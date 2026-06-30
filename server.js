const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const port = Number(process.env.PORT || process.argv[2] || 4173);
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, ".data");
const savedRoomsPath = path.join(dataDir, "rooms.json");
const rooms = new Map();
const roomStates = new Map();
const unsavedRoomTtlMs = 30 * 60 * 1000;
const maxBodyLength = 50000000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/events") {
    openEventStream(req, res, url);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, {
      ok: true,
      app: "jillian-coloring",
      collaboration: true
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/host-info") {
    sendJson(res, {
      port,
      baseUrl: getRequestBaseUrl(req),
      urls: getLocalUrls()
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/room-state") {
    const room = sanitizeRoom(url.searchParams.get("room"));
    const state = getRoomState(room);
    if (!state) {
      sendJson(res, { error: "Room ID invalid" }, 404);
      return;
    }
    sendJson(res, roomSnapshot(state));
    return;
  }

  if (req.method === "POST" && url.pathname === "/room-create") {
    const body = await readBody(req);
    let message;
    try {
      message = JSON.parse(body || "{}");
    } catch {
      send(res, 400, "Invalid JSON");
      return;
    }

    const room = sanitizeRoom(message.room);
    if (!room) {
      send(res, 400, "Missing room");
      return;
    }

    const state = createRoomState(room, message);
    sendJson(res, roomSnapshot(state));
    return;
  }

  if (req.method === "POST" && url.pathname === "/room-save") {
    const body = await readBody(req);
    let message;
    try {
      message = JSON.parse(body || "{}");
    } catch {
      send(res, 400, "Invalid JSON");
      return;
    }

    const room = sanitizeRoom(message.room);
    const state = getRoomState(room);
    if (!state) {
      sendJson(res, { error: "Room ID invalid" }, 404);
      return;
    }

    state.saved = true;
    state.dirty = false;
    state.savedSnapshot = cloneJson(roomSnapshot(state));
    state.lastActive = Date.now();
    persistSavedRooms();
    broadcast(room, { type: "room-saved", room });
    sendJson(res, roomSnapshot(state));
    return;
  }

  if (req.method === "POST" && url.pathname === "/broadcast") {
    const body = await readBody(req);
    let message;
    try {
      message = JSON.parse(body || "{}");
    } catch {
      send(res, 400, "Invalid JSON");
      return;
    }

    const room = sanitizeRoom(message.room);
    if (!room) {
      send(res, 400, "Missing room");
      return;
    }

    message.room = room;
    if (!updateRoomState(room, message)) {
      sendJson(res, { error: "Room ID invalid" }, 404);
      return;
    }
    broadcast(room, message);
    send(res, 204, "");
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, "Method not allowed");
    return;
  }

  serveStatic(url.pathname, res);
});

function openEventStream(req, res, url) {
  const room = sanitizeRoom(url.searchParams.get("room"));
  const clientId = sanitizeClient(url.searchParams.get("client"));

  if (!room || !clientId || !getRoomState(room)) {
    send(res, 400, "Missing room or client");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  res.write("\n");

  const client = { id: clientId, res };
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(client);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const clients = rooms.get(room);
    if (!clients) return;
    clients.delete(client);
    if (!clients.size) {
      rooms.delete(room);
      settleInactiveRoom(room);
    }
  });
}

function broadcast(room, message) {
  const clients = rooms.get(room);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  clients.forEach((client) => client.res.write(payload));
}

function createRoomState(room, initial = {}) {
  let state = roomStates.get(room);
  if (!state) {
    state = {
      sessionId: initial.sessionId || createSessionId(),
      template: initial.template || "cozy",
      fills: initial.fills || {},
      uploads: initial.uploads || {},
      imageSnapshots: initial.imageSnapshots || {},
      drawingSnapshots: initial.drawingSnapshots || {},
      pages: initial.pages || {},
      pageOrder: Array.isArray(initial.pageOrder) ? initial.pageOrder : [],
      saved: false,
      dirty: true,
      savedSnapshot: null,
      lastActive: Date.now()
    };
    roomStates.set(room, state);
    return state;
  }

  state.lastActive = Date.now();
  return state;
}

function getRoomState(room) {
  return room ? roomStates.get(room) : null;
}

function updateRoomState(room, message) {
  const state = getRoomState(room);
  if (!state) return false;
  state.lastActive = Date.now();
  if (!state.imageSnapshots) state.imageSnapshots = {};
  if (!state.drawingSnapshots) state.drawingSnapshots = {};
  if (!state.pages) state.pages = {};
  if (!Array.isArray(state.pageOrder)) state.pageOrder = [];

  if (message.type === "hello") {
    state.sessionId = message.sessionId || state.sessionId;
    state.fills = { ...state.fills, ...(message.fills || {}) };
    state.uploads = { ...state.uploads, ...(message.uploads || {}) };
    state.imageSnapshots = { ...state.imageSnapshots, ...(message.imageSnapshots || {}) };
    state.drawingSnapshots = { ...state.drawingSnapshots, ...(message.drawingSnapshots || {}) };
    mergePages(state, message.pages, message.pageOrder);
    state.dirty = true;
  }

  if (message.type === "template") {
    state.template = message.template || state.template;
    state.dirty = true;
  }

  if (message.type === "fill" && message.key) {
    if (message.color) state.fills[message.key] = message.color;
    else delete state.fills[message.key];
    state.template = message.template || state.template;
    state.dirty = true;
  }

  if (message.type === "clear" && message.template) {
    Object.keys(state.fills)
      .filter((key) => key.startsWith(`${message.template}:`))
      .forEach((key) => delete state.fills[key]);
    delete state.drawingSnapshots[message.template];
    state.dirty = true;
  }

  if (message.type === "upload" && message.id && message.page) {
    state.uploads[message.id] = message.page;
    addPage(state, {
      id: message.id,
      title: message.page.title || "Uploaded Page",
      type: "image",
      dataUrl: message.page.dataUrl || ""
    });
    state.dirty = true;
  }

  if (message.type === "upload-progress" && message.template) {
    state.imageSnapshots[message.template] = message.coloredDataUrl || "";
    if (state.uploads[message.template]) state.uploads[message.template].coloredDataUrl = message.coloredDataUrl || "";
    state.dirty = true;
  }

  if (message.type === "canvas-fill" && message.template) {
    state.dirty = true;
  }

  if (message.type === "page-add" && message.page && message.page.id) {
    addPage(state, message.page);
    state.dirty = true;
  }

  if (message.type === "page-rename" && message.id && message.title) {
    const id = String(message.id).slice(0, 120);
    if (state.pages[id]) state.pages[id].title = String(message.title).trim().slice(0, 80) || state.pages[id].title;
    if (state.uploads[id]) state.uploads[id].title = String(message.title).trim().slice(0, 80) || state.uploads[id].title;
    state.dirty = true;
  }

  if (message.type === "drawing-progress" && message.template) {
    state.drawingSnapshots[message.template] = message.dataUrl || "";
    state.dirty = true;
  }

  if (message.type === "delete-upload" && message.template) {
    delete state.uploads[message.template];
    delete state.imageSnapshots[message.template];
    delete state.drawingSnapshots[message.template];
    delete state.pages[message.template];
    state.pageOrder = state.pageOrder.filter((id) => id !== message.template);
    if (state.template === message.template) state.template = "cozy";
    state.dirty = true;
  }

  return true;
}

function addPage(state, page) {
  if (!page || !page.id) return;
  const id = String(page.id).slice(0, 120);
  state.pages[id] = {
    ...state.pages[id],
    ...page,
    id
  };
  if (!state.pageOrder.includes(id)) state.pageOrder.push(id);
}

function mergePages(state, pages = {}, pageOrder = []) {
  const localOrder = [...state.pageOrder];
  Object.values(pages || {}).forEach((page) => addPage(state, page));
  const ordered = [];
  (Array.isArray(pageOrder) ? pageOrder : []).forEach((id) => {
    if (state.pages[id] && !ordered.includes(id)) ordered.push(id);
  });
  [...localOrder, ...state.pageOrder, ...Object.keys(state.pages)].forEach((id) => {
    if (state.pages[id] && !ordered.includes(id)) ordered.push(id);
  });
  state.pageOrder = ordered;
}

function roomSnapshot(state) {
  return {
    sessionId: state.sessionId || "",
    template: state.template || "cozy",
    fills: state.fills || {},
    uploads: state.uploads || {},
    imageSnapshots: state.imageSnapshots || {},
    drawingSnapshots: state.drawingSnapshots || {},
    pages: state.pages || {},
    pageOrder: Array.isArray(state.pageOrder) ? state.pageOrder : []
  };
}

function settleInactiveRoom(room) {
  roomStates.delete(room);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSavedRooms() {
  if (!fs.existsSync(savedRoomsPath)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(savedRoomsPath, "utf8"));
    const count = Object.keys(parsed.sessions || parsed.rooms || {}).length;
    if (count) console.log(`Found ${count} saved session${count === 1 ? "" : "s"}; browsers restore them from Art Room.`);
  } catch (error) {
    console.warn(`Could not load saved rooms: ${error.message}`);
  }
}

function persistSavedRooms() {
  const savedSessions = {};
  roomStates.forEach((state, room) => {
    if (!state.saved) return;
    const sessionId = state.sessionId || createSessionId();
    savedSessions[sessionId] = {
      ...cloneJson(state.savedSnapshot || roomSnapshot(state)),
      roomCode: room,
      sessionId
    };
  });

  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(savedRoomsPath, JSON.stringify({
      savedAt: new Date().toISOString(),
      sessions: savedSessions
    }, null, 2));
  } catch (error) {
    console.warn(`Could not persist saved rooms: ${error.message}`);
  }
}

function serveStatic(rawPathname, res) {
  const pathname = rawPathname === "/" ? "/index.html" : rawPathname;
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not found");
      return;
    }
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodyLength) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sanitizeRoom(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
}

function sanitizeClient(value) {
  return String(value || "").replace(/[^a-z0-9-]/gi, "").slice(0, 80);
}

function createSessionId() {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function getLocalUrls() {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (entry.family !== "IPv4" || entry.internal) return;
      urls.push(`http://${entry.address}:${port}`);
    });
  });

  return urls;
}

function getRequestBaseUrl(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwardedProto || (req.socket.encrypted ? "https" : "http");
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const requestHost = forwardedHost || req.headers.host || `localhost:${port}`;
  return `${proto}://${requestHost}`;
}

loadSavedRooms();

server.listen(port, host, () => {
  console.log(`Jillian Coloring running at http://localhost:${port}`);
});

setInterval(() => {
  const now = Date.now();
  roomStates.forEach((state, room) => {
    if (state.saved || rooms.has(room)) return;
    if (now - state.lastActive > unsavedRoomTtlMs) roomStates.delete(room);
  });
}, 60000).unref();
