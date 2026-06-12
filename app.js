const builtInTemplates = {
  cozy: { title: "Cozy Friends", templateId: "cozy-template", type: "svg" },
  garden: { title: "Pocket Garden", templateId: "garden-template", type: "svg" },
  snack: { title: "Snack Table", templateId: "snack-template", type: "svg" }
};

const defaultThemeCollections = {
  winter: [
    { template: "cozy", title: "Cozy Friends" },
    { template: "snack", title: "Cocoa Table" }
  ],
  fall: [
    { template: "snack", title: "Harvest Snack Table" },
    { template: "garden", title: "Leafy Garden Pot" }
  ],
  spring: [
    { template: "garden", title: "Pocket Garden" },
    { template: "cozy", title: "Sunny Window Friends" }
  ],
  summer: [
    { template: "snack", title: "Picnic Table" },
    { template: "garden", title: "Summer Flower Pot" }
  ]
};

let themeCollections = { ...defaultThemeCollections };
let seasonalTemplates = {};
let templates = { ...builtInTemplates };

const paletteColors = [
  "#f48fb1", "#ffcc80", "#fff176", "#9ccc65", "#4db6ac", "#64b5f6",
  "#9575cd", "#ba68c8", "#ef5350", "#8d6e63", "#90a4ae", "#ffffff"
];

const roomCodeLength = 5;
const roomAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const uploadDataUrlLimit = 10000000;
const uploadDbName = "jillian-coloring-db";
const uploadDbVersion = 1;
const uploadStoreName = "uploads";
const uploadRecordKey = "all";
let uploadDbPromise = null;

const appState = {
  template: "cozy",
  room: createRoomCode(),
  roomCreated: false,
  shareBaseUrl: "",
  tool: "fill",
  color: "#f48fb1",
  fills: {},
  uploads: {},
  imageSnapshots: {},
  uploadImageData: null,
  uploadOriginalData: null,
  uploadSnapshotTimer: null,
  undoStack: [],
  clientId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  eventSource: null,
  online: false,
  serverAvailable: null,
  syncing: false
};

const els = {
  homeView: document.getElementById("homeView"),
  customView: document.getElementById("customView"),
  themeView: document.getElementById("themeView"),
  workspaceView: document.getElementById("workspaceView"),
  homeCustomBtn: document.getElementById("homeCustomBtn"),
  homeJoinBtn: document.getElementById("homeJoinBtn"),
  homeJoinPanel: document.getElementById("homeJoinPanel"),
  homeRoomInput: document.getElementById("homeRoomInput"),
  homeJoinSubmit: document.getElementById("homeJoinSubmit"),
  homeJoinStatus: document.getElementById("homeJoinStatus"),
  customBackBtn: document.getElementById("customBackBtn"),
  customHomeBtn: document.getElementById("customHomeBtn"),
  customRoomInput: document.getElementById("customRoomInput"),
  customJoinRoomBtn: document.getElementById("customJoinRoomBtn"),
  customNewRoomBtn: document.getElementById("customNewRoomBtn"),
  customShareUrl: document.getElementById("customShareUrl"),
  customCopyShareBtn: document.getElementById("customCopyShareBtn"),
  customUploadBtn: document.getElementById("customUploadBtn"),
  customUploadPageInput: document.getElementById("customUploadPageInput"),
  customUploadStatus: document.getElementById("customUploadStatus"),
  customColorPicker: document.getElementById("customColorPicker"),
  customPalette: document.getElementById("customPalette"),
  homeThemeSelect: document.getElementById("homeThemeSelect"),
  themeBackBtn: document.getElementById("themeBackBtn"),
  themeTitle: document.getElementById("themeTitle"),
  themeGrid: document.getElementById("themeGrid"),
  artboard: document.getElementById("artboard"),
  templateSelect: document.getElementById("templateSelect"),
  templateTitle: document.getElementById("templateTitle"),
  colorPicker: document.getElementById("colorPicker"),
  palette: document.getElementById("palette"),
  saveStatus: document.getElementById("saveStatus"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  lastAction: document.getElementById("lastAction"),
  roomInput: document.getElementById("roomInput"),
  roomName: document.getElementById("roomName"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  newRoomBtn: document.getElementById("newRoomBtn"),
  workspaceHomeBtn: document.getElementById("workspaceHomeBtn"),
  shareUrl: document.getElementById("shareUrl"),
  copyShareBtn: document.getElementById("copyShareBtn"),
  connectionDot: document.getElementById("connectionDot"),
  connectionText: document.getElementById("connectionText"),
  fillTool: document.getElementById("fillTool"),
  eraseTool: document.getElementById("eraseTool"),
  pickTool: document.getElementById("pickTool"),
  undoBtn: document.getElementById("undoBtn"),
  saveBtn: document.getElementById("saveBtn"),
  exportBtn: document.getElementById("exportBtn"),
  downloadStateBtn: document.getElementById("downloadStateBtn"),
  importStateInput: document.getElementById("importStateInput"),
  uploadPageInput: document.getElementById("uploadPageInput"),
  deleteUploadBtn: document.getElementById("deleteUploadBtn"),
  clearBtn: document.getElementById("clearBtn")
};

const saveKey = () => `jillian-coloring:${appState.room}:${appState.template}`;
const uploadsKey = "jillian-coloring:uploads";
const regionKey = (template, region) => `${template}:${region}`;

async function boot() {
  await loadThemePages();
  await loadUploads();
  rebuildTemplateOptions();
  clearRememberedRoom();
  resetDraft();
  setRoom(getRoomFromLocation() || appState.room);
  buildPalette();
  bindControls();
  await loadHostInfo();
  routeFromHash();
  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("popstate", routeFromHash);
}

function bindControls() {
  els.homeCustomBtn.addEventListener("click", () => {
    location.hash = "custom";
  });
  els.customBackBtn.addEventListener("click", () => {
    location.hash = "";
  });
  els.customHomeBtn.addEventListener("click", () => {
    location.hash = "";
  });
  [els.homeRoomInput, els.customRoomInput, els.roomInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = normalizeRoom(input.value);
    });
  });
  els.customJoinRoomBtn.addEventListener("click", applyCustomRoomId);
  els.customNewRoomBtn.addEventListener("click", applyCustomRoomId);
  els.customRoomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyCustomRoomId();
  });
  els.customCopyShareBtn.addEventListener("click", () => copyInputValue(els.customShareUrl, "Share link copied"));
  els.customColorPicker.addEventListener("input", () => {
    appState.color = els.customColorPicker.value;
    syncColorControls();
    markActiveSwatch();
  });
  els.homeJoinBtn.addEventListener("click", () => {
    els.homeJoinPanel.hidden = !els.homeJoinPanel.hidden;
    if (!els.homeJoinPanel.hidden) els.homeRoomInput.focus();
  });
  els.homeJoinSubmit.addEventListener("click", joinHomeRoom);
  els.homeRoomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinHomeRoom();
  });
  els.homeThemeSelect.addEventListener("change", () => {
    if (!els.homeThemeSelect.value) return;
    location.hash = `theme/${els.homeThemeSelect.value}`;
  });
  els.themeBackBtn.addEventListener("click", () => {
    location.hash = "";
  });
  els.workspaceHomeBtn.addEventListener("click", () => {
    history.pushState(null, "", location.pathname);
    showHome();
  });

  els.templateSelect.addEventListener("change", async () => {
    appState.template = els.templateSelect.value;
    renderTemplate(appState.template);
    await ensureCurrentRoom();
    if (templates[appState.template] && templates[appState.template].type === "image" && appState.uploads[appState.template]) {
      broadcast({ type: "upload", id: appState.template, page: appState.uploads[appState.template] });
    }
    broadcast({ type: "template", template: appState.template });
  });

  els.colorPicker.addEventListener("input", () => {
    appState.color = els.colorPicker.value;
    syncColorControls();
    markActiveSwatch();
  });

  els.joinRoomBtn.addEventListener("click", joinWorkspaceRoomId);

  els.roomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") els.joinRoomBtn.click();
  });

  els.newRoomBtn.addEventListener("click", applyWorkspaceRoomId);
  els.copyShareBtn.addEventListener("click", copyShareUrl);
  els.fillTool.addEventListener("click", () => setTool("fill"));
  els.eraseTool.addEventListener("click", () => setTool("erase"));
  els.pickTool.addEventListener("click", () => setTool("pick"));
  els.undoBtn.addEventListener("click", undo);
  els.saveBtn.addEventListener("click", saveCurrentWork);
  els.exportBtn.addEventListener("click", downloadPng);
  els.downloadStateBtn.addEventListener("click", downloadSaveFile);
  els.importStateInput.addEventListener("change", importSaveFile);
  els.customUploadBtn.addEventListener("click", () => {
    els.customUploadStatus.textContent = "Choose a PNG, JPG, WebP, or SVG file.";
    els.customUploadPageInput.click();
  });
  els.customUploadPageInput.addEventListener("change", importColoringPage);
  els.uploadPageInput.addEventListener("change", importColoringPage);
  els.deleteUploadBtn.addEventListener("click", deleteUploadedPage);
  els.clearBtn.addEventListener("click", clearColors);

}

async function routeFromHash() {
  const hash = location.hash.replace(/^#/, "");
  const sharedRoom = getRoomFromLocation();

  if (hash.startsWith("room/") && sharedRoom) {
    await joinSharedRoom(sharedRoom);
    return;
  }

  if (hash.startsWith("theme/")) {
    showTheme(hash.split("/")[1]);
    return;
  }

  if (hash === "custom") {
    showCustom();
    return;
  }

  if (hash === "workspace") {
    await ensureCurrentRoom();
    showWorkspace();
    return;
  }

  if (sharedRoom) {
    await joinSharedRoom(sharedRoom);
    return;
  }

  showHome();
}

function showHome() {
  leaveCurrentRoomForMenu();
  els.homeView.hidden = false;
  els.customView.hidden = true;
  els.themeView.hidden = true;
  els.workspaceView.hidden = true;
  els.homeThemeSelect.value = "";
}

function showCustom() {
  leaveCurrentRoomForMenu();
  els.homeView.hidden = true;
  els.customView.hidden = false;
  els.themeView.hidden = true;
  els.workspaceView.hidden = true;
}

function showWorkspace(updateHash = false) {
  els.homeView.hidden = true;
  els.customView.hidden = true;
  els.themeView.hidden = true;
  els.workspaceView.hidden = false;
  renderTemplate(appState.template);
  connectRoom(appState.room);
  if (updateHash) history.pushState(null, "", roomHash());
}

async function joinHomeRoom() {
  const nextRoom = normalizeRoom(els.homeRoomInput.value);
  if (!nextRoom) {
    showRoomMessage(els.homeJoinStatus, "Enter a room ID first.");
    return;
  }
  await joinExistingRoom(nextRoom, els.homeJoinStatus);
}

async function applyCustomRoomId() {
  const nextRoom = normalizeRoom(els.customRoomInput.value) || createRoomCode();
  if (!nextRoom) return;
  setRoom(nextRoom);
  if (!(await createRoom(nextRoom, els.customUploadStatus))) return;
  els.customUploadStatus.textContent = `Room set to ${nextRoom}.`;
}

async function joinWorkspaceRoomId() {
  const nextRoom = normalizeRoom(els.roomInput.value);
  if (!nextRoom) return;
  await joinExistingRoom(nextRoom, null);
}

async function applyWorkspaceRoomId() {
  const nextRoom = normalizeRoom(els.roomInput.value) || createRoomCode();
  if (!nextRoom) return;
  setRoom(nextRoom);
  if (!(await createRoom(nextRoom))) return;
  renderTemplate(appState.template);
  connectRoom(nextRoom);
  history.pushState(null, "", roomHash());
  setStatus(`Room set to ${nextRoom}`);
}

function setRoom(room) {
  const nextRoom = normalizeRoom(room) || createRoomCode();
  if (appState.room !== nextRoom) appState.roomCreated = false;
  appState.room = nextRoom;
  els.homeRoomInput.value = nextRoom;
  els.roomInput.value = nextRoom;
  els.customRoomInput.value = nextRoom;
  els.roomName.textContent = nextRoom;
  updateShareLinks();
}

function showTheme(theme) {
  leaveCurrentRoomForMenu();
  const pages = themeCollections[theme] || themeCollections.winter;
  els.homeView.hidden = true;
  els.customView.hidden = true;
  els.themeView.hidden = false;
  els.workspaceView.hidden = true;
  els.themeTitle.textContent = `${capitalize(theme)} Pages`;
  els.themeGrid.innerHTML = "";

  pages.forEach((page) => {
    const template = templates[page.template] || builtInTemplates[page.template];
    if (!template) return;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "theme-card";
    const preview = createThemePreview(template);
    const title = document.createElement("strong");
    title.textContent = page.title;
    card.append(preview, title);
    card.addEventListener("click", async () => {
      appState.template = page.template;
      renderTemplate(appState.template);
      await ensureCurrentRoom();
      await broadcast({ type: "template", template: appState.template });
      showWorkspace(true);
    });
    els.themeGrid.appendChild(card);
  });
}

function createThemePreview(template) {
  if (template.type === "image") {
    const img = document.createElement("img");
    img.src = template.dataUrl;
    img.alt = template.title;
    img.loading = "lazy";
    return img;
  }

  const preview = document.getElementById(template.templateId).content.firstElementChild.cloneNode(true);
  preview.removeAttribute("class");
  preview.querySelectorAll("[data-region]").forEach((region) => {
    region.removeAttribute("data-region");
    region.style.fill = "#fffdf8";
  });
  return preview;
}

async function joinSharedRoom(room) {
  await joinExistingRoom(room, null, false);
}

function createRoomCode() {
  const bytes = new Uint8Array(roomCodeLength);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256);
    });
  }
  return [...bytes].map((byte) => roomAlphabet[byte % roomAlphabet.length]).join("");
}

function normalizeRoom(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, roomCodeLength);
}

function getRoomFromLocation() {
  const hash = location.hash.replace(/^#/, "");
  if (hash.startsWith("room/")) return normalizeRoom(hash.split("/")[1]);
  const params = new URLSearchParams(location.search);
  return normalizeRoom(params.get("room"));
}

function roomHash() {
  return `#room/${encodeURIComponent(appState.room)}`;
}

function buildShareUrl() {
  const fallback = location.origin === "null" ? "http://localhost:4173" : location.origin;
  const base = (appState.shareBaseUrl || fallback).replace(/\/$/, "");
  return `${base}/${roomHash()}`;
}

function updateShareLinks() {
  const url = buildShareUrl();
  els.shareUrl.value = url;
  els.customShareUrl.value = url;
}

function clearRememberedRoom() {
  localStorage.removeItem("jillian-coloring:last");
  localStorage.removeItem("color-together:last");
}

function resetDraft() {
  appState.fills = {};
  appState.undoStack = [];
}

function currentRoomUploads() {
  const template = templates[appState.template];
  if (!template || template.type !== "image" || !appState.uploads[appState.template]) return {};
  return { [appState.template]: appState.uploads[appState.template] };
}

function currentImageSnapshots() {
  const template = templates[appState.template];
  if (!template || template.type !== "image") return {};

  const coloredDataUrl = template.coloredDataUrl || appState.imageSnapshots[appState.template] || "";
  return coloredDataUrl ? { [appState.template]: coloredDataUrl } : {};
}

async function createRoom(room = appState.room, statusEl = null) {
  const targetRoom = normalizeRoom(room);
  if (!targetRoom || location.protocol === "file:") return false;
  if (!(await ensureCollaborationServer(statusEl))) return false;

  try {
    const response = await fetch("/room-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: targetRoom,
        template: appState.template,
        fills: appState.fills,
        uploads: currentRoomUploads(),
        imageSnapshots: currentImageSnapshots()
      })
    });

    if (!response.ok) {
      showCollaborationProblem(statusEl, "Room could not be created. Check that the site is deployed as a Web Service.");
      return false;
    }

    appState.roomCreated = targetRoom === appState.room;
    return true;
  } catch {
    setOnline(false, "Offline draft");
    showCollaborationProblem(statusEl, "Collaboration server unavailable.");
    return false;
  }
}

async function ensureCurrentRoom() {
  if (appState.roomCreated) return true;
  return createRoom(appState.room);
}

async function joinExistingRoom(room, statusEl = null, updateHash = true) {
  const targetRoom = normalizeRoom(room);
  if (!targetRoom) return false;
  showRoomMessage(statusEl, "");
  if (!(await ensureCollaborationServer(statusEl))) return false;

  try {
    const response = await fetch(`/room-state?room=${encodeURIComponent(targetRoom)}`);
    if (!response.ok) {
      showInvalidRoom(targetRoom, statusEl);
      return false;
    }

    const state = await response.json();
    setRoom(targetRoom);
    appState.roomCreated = true;
    resetDraft();
    await applyRoomState(state);
    showWorkspace(updateHash);
    return true;
  } catch {
    setOnline(false, "Offline draft");
    showCollaborationProblem(statusEl, "Could not check that room.");
    return false;
  }
}

function showInvalidRoom(room, statusEl = null) {
  const text = "Room ID invalid.";
  showRoomMessage(statusEl, text);
  if (els.workspaceView.hidden) {
    setRoom(createRoomCode());
    els.homeJoinPanel.hidden = false;
    els.homeRoomInput.value = room;
    els.homeJoinStatus.textContent = text;
    showHome();
  } else {
    setStatus(text);
  }
}

function showRoomMessage(statusEl, text) {
  if (statusEl) statusEl.textContent = text;
}

async function ensureCollaborationServer(statusEl = null) {
  if (location.protocol === "file:") {
    showCollaborationProblem(statusEl, "Run the server to use rooms.");
    return false;
  }

  if (appState.serverAvailable === true) return true;
  appState.serverAvailable = await probeCollaborationServer();

  if (!appState.serverAvailable) {
    showCollaborationProblem(statusEl, "Collaboration server unavailable. On Render, deploy as a Web Service, not a Static Site.");
    return false;
  }

  return true;
}

async function probeCollaborationServer() {
  try {
    const response = await fetch("/health", { cache: "no-store" });
    if (!response.ok) return false;
    const info = await response.json();
    return Boolean(info && info.ok && info.collaboration);
  } catch {
    return false;
  }
}

function showCollaborationProblem(statusEl, text) {
  showRoomMessage(statusEl, text);
  if (!statusEl && !els.workspaceView.hidden) setStatus(text);
  if (!els.customView.hidden) els.customUploadStatus.textContent = text;
  if (!els.homeView.hidden) {
    els.homeJoinPanel.hidden = false;
    els.homeJoinStatus.textContent = text;
  }
  setOnline(false, "Server unavailable");
}

async function saveCurrentWork() {
  saveDraft(true);
  if (!(await ensureCurrentRoom())) {
    setStatus("Room could not be saved");
    return;
  }

  await broadcast({
    type: "hello",
    template: appState.template,
    fills: appState.fills,
    uploads: currentRoomUploads(),
    imageSnapshots: currentImageSnapshots()
  });

  try {
    const response = await fetch("/room-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: appState.room })
    });

    if (!response.ok) {
      if (response.status === 404) showInvalidRoom(appState.room);
      else setStatus("Room could not be saved");
      return;
    }

    appState.roomCreated = true;
    setStatus("Room saved");
  } catch {
    setOnline(false, "Offline draft");
    setStatus("Room could not be saved");
  }
}

async function loadHostInfo() {
  const fallback = location.origin === "null" ? "http://localhost:4173" : location.origin;
  appState.shareBaseUrl = fallback;
  updateShareLinks();

  if (location.protocol === "file:") return;

  appState.serverAvailable = await probeCollaborationServer();
  if (!appState.serverAvailable) {
    showCollaborationProblem(null, "Collaboration server unavailable. On Render, deploy as a Web Service, not a Static Site.");
    return;
  }

  if (!isLocalNetworkHost(location.hostname)) return;

  try {
    const response = await fetch("/host-info");
    const info = await response.json();
    appState.shareBaseUrl = (info.urls && info.urls[0]) || info.baseUrl || fallback;
    updateShareLinks();
  } catch {
    appState.shareBaseUrl = fallback;
    updateShareLinks();
  }
}

function isLocalNetworkHost(hostname) {
  return hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

async function copyShareUrl() {
  copyInputValue(els.shareUrl, "Share link copied");
}

async function copyInputValue(input, statusText) {
  input.select();
  try {
    await navigator.clipboard.writeText(input.value);
    setStatus(statusText);
  } catch {
    document.execCommand("copy");
    setStatus(statusText);
  }
  if (input === els.customShareUrl) els.customUploadStatus.textContent = `${statusText}.`;
}

async function loadThemePages() {
  try {
    const response = await fetch("pages/manifest.json", { cache: "no-store" });
    if (!response.ok) return;
    const manifest = await response.json();
    const nextTemplates = {};
    const nextCollections = { winter: [], fall: [], spring: [], summer: [] };

    (manifest.pages || []).forEach((page) => {
      const theme = String(page.theme || "").toLowerCase();
      if (!nextCollections[theme] || !page.id || !page.src) return;

      nextTemplates[page.id] = {
        id: page.id,
        title: page.title || "Seasonal Page",
        type: "image",
        dataUrl: page.src,
        coloredDataUrl: ""
      };
      nextCollections[theme].push({ template: page.id, title: page.title || "Seasonal Page" });
    });

    seasonalTemplates = nextTemplates;
    themeCollections = Object.keys(nextCollections).reduce((collections, theme) => {
      collections[theme] = nextCollections[theme].length ? nextCollections[theme] : defaultThemeCollections[theme];
      return collections;
    }, {});
    rebuildTemplateCatalog();
  } catch {
    seasonalTemplates = {};
    themeCollections = { ...defaultThemeCollections };
  }
}

async function loadUploads() {
  const saved = await readUploads();
  appState.uploads = saved && typeof saved === "object" ? saved : {};
  rebuildTemplateCatalog();
}

function rebuildTemplateCatalog() {
  templates = { ...builtInTemplates, ...seasonalTemplates };
  Object.entries(appState.uploads).forEach(([id, page]) => {
    if (!page || !page.dataUrl) return;
    templates[id] = {
      id,
      title: page.title || "Uploaded Page",
      type: "image",
      dataUrl: page.dataUrl,
      coloredDataUrl: page.coloredDataUrl || ""
    };
  });

  Object.entries(appState.imageSnapshots).forEach(([id, coloredDataUrl]) => {
    if (templates[id] && templates[id].type === "image") templates[id].coloredDataUrl = coloredDataUrl || "";
  });
}

async function saveUploads() {
  try {
    await writeUploadsToDb(appState.uploads);
    localStorage.removeItem(uploadsKey);
    return true;
  } catch {
    try {
      localStorage.setItem(uploadsKey, JSON.stringify(appState.uploads));
      return true;
    } catch {
      els.customUploadStatus.textContent = "Browser storage is full. Delete an uploaded page or try a smaller file.";
      return false;
    }
  }
}

function persistUploads() {
  saveUploads();
}

async function readUploads() {
  try {
    const saved = await readUploadsFromDb();
    if (saved && typeof saved === "object") return saved;
  } catch {
    // Fall through to the legacy localStorage copy.
  }

  const legacy = readJson(localStorage.getItem(uploadsKey));
  if (legacy && typeof legacy === "object") {
    try {
      await writeUploadsToDb(legacy);
      localStorage.removeItem(uploadsKey);
    } catch {
      // Keep the legacy copy if migration is blocked.
    }
    return legacy;
  }

  return {};
}

function getUploadDb() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB is unavailable"));
  if (uploadDbPromise) return uploadDbPromise;

  uploadDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(uploadDbName, uploadDbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(uploadStoreName)) db.createObjectStore(uploadStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open upload storage"));
  });

  return uploadDbPromise;
}

async function readUploadsFromDb() {
  const db = await getUploadDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(uploadStoreName, "readonly");
    const request = transaction.objectStore(uploadStoreName).get(uploadRecordKey);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not read uploads"));
  });
}

async function writeUploadsToDb(uploads) {
  const db = await getUploadDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(uploadStoreName, "readwrite");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not save uploads"));
    transaction.objectStore(uploadStoreName).put(uploads, uploadRecordKey);
  });
}

function rebuildTemplateOptions() {
  els.templateSelect.innerHTML = "";
  Object.entries(templates).forEach(([id, template]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = template.title;
    els.templateSelect.appendChild(option);
  });
}

function buildPalette() {
  els.palette.innerHTML = "";
  els.customPalette.innerHTML = "";
  paletteColors.forEach((color) => {
    els.palette.appendChild(createSwatch(color));
    els.customPalette.appendChild(createSwatch(color));
  });
  syncColorControls();
  markActiveSwatch();
}

function createSwatch(color) {
  const swatch = document.createElement("button");
  swatch.type = "button";
  swatch.className = "swatch";
  swatch.title = color === "#ffffff" ? "White" : color;
  swatch.style.background = color;
  swatch.addEventListener("click", () => {
    appState.color = color;
    syncColorControls();
    markActiveSwatch();
    setTool("fill");
  });
  return swatch;
}

function syncColorControls() {
  els.colorPicker.value = appState.color;
  els.customColorPicker.value = appState.color;
}

function markActiveSwatch() {
  [...els.palette.children, ...els.customPalette.children].forEach((swatch) => {
    swatch.classList.toggle("active", rgbToHex(swatch.style.backgroundColor) === appState.color.toLowerCase());
  });
}

function renderTemplate(templateName) {
  const config = templates[templateName];
  if (!config) {
    appState.template = "cozy";
    renderTemplate(appState.template);
    return;
  }

  els.templateTitle.textContent = config.title;
  els.templateSelect.value = templateName;
  els.deleteUploadBtn.disabled = config.type !== "image";

  if (config.type === "image") {
    renderUploadedPage(config);
    return;
  }

  const template = document.getElementById(config.templateId);
  els.artboard.replaceChildren(template.content.firstElementChild.cloneNode(true));
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;
  applyFills();
  updateProgress();

  els.artboard.querySelectorAll("[data-region]").forEach((region) => {
    region.addEventListener("click", () => handleRegionClick(region));
  });
}

function renderUploadedPage(config) {
  const canvas = document.createElement("canvas");
  canvas.className = "coloring-page upload-canvas";
  canvas.setAttribute("aria-label", `${config.title} coloring canvas`);
  els.artboard.replaceChildren(canvas);
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;

  const img = new Image();
  img.onload = () => {
    const limit = 1400;
    const scale = Math.min(1, limit / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    appState.uploadOriginalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const savedSnapshot = config.coloredDataUrl || appState.imageSnapshots[appState.template] || "";
    if (savedSnapshot) {
      const colored = new Image();
      colored.onload = () => {
        ctx.drawImage(colored, 0, 0, canvas.width, canvas.height);
        appState.uploadImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        updateProgress();
      };
      colored.src = savedSnapshot;
    } else {
      appState.uploadImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      updateProgress();
    }
  };
  img.src = config.dataUrl;

  canvas.addEventListener("click", (event) => handleCanvasClick(event, canvas));
}

function handleRegionClick(region) {
  const id = region.dataset.region;
  const key = regionKey(appState.template, id);
  const previous = appState.fills[key] || "";

  if (appState.tool === "pick") {
    const picked = previous || "#ffffff";
    appState.color = picked;
    els.colorPicker.value = picked;
    markActiveSwatch();
    setTool("fill");
    setStatus(`Picked ${picked}`);
    return;
  }

  const next = appState.tool === "erase" ? "" : appState.color;
  if (previous === next) return;

  appState.undoStack.push({ key, previous, next });
  setFill(key, next);
  saveDraft(false);
  broadcast({ type: "fill", key, color: next, template: appState.template });
  setStatus(next ? `Filled ${humanize(id)}` : `Erased ${humanize(id)}`);
}

function handleCanvasClick(event, canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
  const before = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const picked = getPixel(before.data, x, y, canvas.width);

  if (appState.tool === "pick") {
    appState.color = rgbToHex(`rgb(${picked[0]}, ${picked[1]}, ${picked[2]})`);
    els.colorPicker.value = appState.color;
    markActiveSwatch();
    setTool("fill");
    setStatus(`Picked ${appState.color}`);
    return;
  }

  if (isDarkPixel(picked)) {
    setStatus("That looks like line art");
    return;
  }

  const undoData = new ImageData(new Uint8ClampedArray(before.data), before.width, before.height);
  const action = { tool: appState.tool, color: appState.color };
  const after = floodFillImage(before, appState.uploadOriginalData, x, y, canvas.width, canvas.height, action);
  if (!after.changed) {
    setStatus("No blank area found there");
    return;
  }

  ctx.putImageData(after.imageData, 0, 0);
  appState.uploadImageData = after.imageData;
  appState.undoStack.push({ canvas: true, imageData: undoData });
  saveUploadedCanvas(false);
  broadcast({
    type: "canvas-fill",
    template: appState.template,
    nx: x / canvas.width,
    ny: y / canvas.height,
    color: appState.color,
    tool: appState.tool
  });
  queueUploadedProgressSnapshot();
  setStatus(appState.tool === "erase" ? "Erased uploaded area" : "Filled uploaded area");
}

function floodFillImage(imageData, originalData, x, y, width, height, action = {}) {
  const data = imageData.data;
  const original = originalData ? originalData.data : data;
  const start = (y * width + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fill = hexToRgba(action.color || appState.color);
  const tool = action.tool || appState.tool;
  const tolerance = 42;
  const visited = new Uint8Array(width * height);
  const stack = [[x, y]];
  let changed = false;

  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const point = cy * width + cx;
    if (visited[point]) continue;
    visited[point] = 1;

    const idx = point * 4;
    const pixel = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    if (!isSimilarColor(pixel, target, tolerance) || isDarkPixel(pixel)) continue;

    if (tool === "erase") {
      data[idx] = original[idx];
      data[idx + 1] = original[idx + 1];
      data[idx + 2] = original[idx + 2];
      data[idx + 3] = original[idx + 3];
    } else {
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = 255;
    }
    changed = true;

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  return { changed, imageData };
}

function setFill(key, color) {
  if (color) appState.fills[key] = color;
  else delete appState.fills[key];

  const [template, region] = key.split(":");
  if (template === appState.template) {
    const node = els.artboard.querySelector(`[data-region="${CSS.escape(region)}"]`);
    if (node) node.style.fill = color || "#fffdf8";
  }
  updateProgress();
}

function applyFills() {
  els.artboard.querySelectorAll("[data-region]").forEach((region) => {
    const key = regionKey(appState.template, region.dataset.region);
    region.style.fill = appState.fills[key] || "#fffdf8";
  });
}

function updateProgress() {
  if (templates[appState.template] && templates[appState.template].type === "image") {
    els.progressBar.style.width = "100%";
    els.progressText.textContent = "Image page ready";
    return;
  }

  const total = els.artboard.querySelectorAll("[data-region]").length || 1;
  const filled = [...els.artboard.querySelectorAll("[data-region]")]
    .filter((region) => appState.fills[regionKey(appState.template, region.dataset.region)]).length;
  const percent = Math.round((filled / total) * 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${percent}% filled`;
}

function setTool(tool) {
  appState.tool = tool;
  els.fillTool.classList.toggle("active", tool === "fill");
  els.eraseTool.classList.toggle("active", tool === "erase");
  els.pickTool.classList.toggle("active", tool === "pick");
}

function undo() {
  const item = appState.undoStack.pop();
  if (!item) {
    setStatus("Nothing to undo");
    return;
  }

  if (item.canvas) {
    const canvas = els.artboard.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.putImageData(item.imageData, 0, 0);
    appState.uploadImageData = item.imageData;
    saveUploadedCanvas(true);
    setStatus("Undid last fill");
    return;
  }

  setFill(item.key, item.previous);
  saveDraft(false);
  broadcast({ type: "fill", key: item.key, color: item.previous, template: appState.template });
  setStatus("Undid last fill");
}

function clearColors() {
  if (templates[appState.template] && templates[appState.template].type === "image") {
    const canvas = els.artboard.querySelector("canvas");
    if (!canvas || !appState.uploadOriginalData) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    appState.undoStack.push({ canvas: true, imageData: current });
    ctx.putImageData(appState.uploadOriginalData, 0, 0);
    appState.uploadImageData = appState.uploadOriginalData;
    saveUploadedCanvas(true);
    setStatus("Cleared uploaded page");
    return;
  }

  const keys = Object.keys(appState.fills).filter((key) => key.startsWith(`${appState.template}:`));
  if (!keys.length) return;
  appState.undoStack.push(...keys.map((key) => ({ key, previous: appState.fills[key], next: "" })));
  keys.forEach((key) => setFill(key, ""));
  saveDraft(false);
  broadcast({ type: "clear", template: appState.template });
  setStatus("Cleared this template");
}

function saveDraft(showMessage = true) {
  if (templates[appState.template] && templates[appState.template].type === "image") {
    saveUploadedCanvas(false, showMessage);
    if (showMessage) setStatus("Image page saved");
    return;
  }

  if (!showMessage) return;

  const payload = {
    template: appState.template,
    room: appState.room,
    fills: appState.fills,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(saveKey(), JSON.stringify(payload));
  if (showMessage) setStatus("Saved in this browser");
}

function loadDraft() {
  resetDraft();
}

function saveUploadedCanvas(shareWithRoom = false, persist = false) {
  const template = templates[appState.template];
  const canvas = els.artboard.querySelector("canvas");
  if (!template || template.type !== "image" || !canvas || !appState.uploadOriginalData) return;

  const coloredDataUrl = canvas.toDataURL("image/png");
  appState.imageSnapshots[appState.template] = coloredDataUrl;
  templates[appState.template].coloredDataUrl = coloredDataUrl;
  if (appState.uploads[appState.template]) {
    appState.uploads[appState.template].coloredDataUrl = coloredDataUrl;
    if (persist) persistUploads();
  }

  if (shareWithRoom) {
    broadcast({ type: "upload-progress", template: appState.template, coloredDataUrl, reason: "replace" });
  }
}

function queueUploadedProgressSnapshot() {
  clearTimeout(appState.uploadSnapshotTimer);
  appState.uploadSnapshotTimer = setTimeout(() => {
    const canvas = els.artboard.querySelector("canvas");
    if (!canvas || !templates[appState.template] || templates[appState.template].type !== "image") return;
    broadcast({
      type: "upload-progress",
      template: appState.template,
      coloredDataUrl: canvas.toDataURL("image/png"),
      reason: "snapshot"
    });
  }, 450);
}

function connectRoom(room) {
  if (appState.eventSource) appState.eventSource.close();
  setOnline(false, "Connecting...");

  if (appState.serverAvailable === false) {
    showCollaborationProblem(null, "Collaboration server unavailable.");
    return;
  }

  if (!window.EventSource || location.protocol === "file:") {
    setOnline(false, "Run the server for collaboration");
    return;
  }

  appState.eventSource = new EventSource(`/events?room=${encodeURIComponent(room)}&client=${encodeURIComponent(appState.clientId)}`);

  appState.eventSource.addEventListener("open", async () => {
    setOnline(true, "Room online");
    const synced = await syncRoomState();
    if (!synced) return;
    broadcast({ type: "hello", template: appState.template, fills: appState.fills, uploads: currentRoomUploads(), imageSnapshots: currentImageSnapshots() });
  });

  appState.eventSource.addEventListener("message", (event) => {
    const message = readJson(event.data);
    if (!message || message.clientId === appState.clientId) return;
    receiveMessage(message);
  });

  appState.eventSource.addEventListener("error", () => {
    setOnline(false, "Offline draft");
  });
}

async function syncRoomState() {
  try {
    const response = await fetch(`/room-state?room=${encodeURIComponent(appState.room)}`);
    if (!response.ok) {
      if (response.status === 404) showInvalidRoom(appState.room);
      return false;
    }
    const state = await response.json();
    await applyRoomState(state);
    return true;
  } catch {
    setOnline(false, "Offline draft");
    return false;
  }
}

function disconnectRoom() {
  if (!appState.eventSource) return;
  appState.eventSource.close();
  appState.eventSource = null;
  setOnline(false, "Not in a room");
}

function leaveCurrentRoomForMenu() {
  const hadRoom = Boolean(appState.eventSource || appState.roomCreated);
  disconnectRoom();
  if (!hadRoom) return;

  resetDraft();
  appState.template = "cozy";
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;
  appState.roomCreated = false;
  setRoom(createRoomCode());
  loadUploads().then(() => {
    rebuildTemplateOptions();
  });
}

async function applyRoomState(state) {
  if (!state) return;
  const hasUploads = state.uploads && Object.keys(state.uploads).length > 0;
  const hasFills = state.fills && Object.keys(state.fills).length > 0;
  const hasImageSnapshots = state.imageSnapshots && Object.keys(state.imageSnapshots).length > 0;

  if (hasUploads) {
    appState.uploads = { ...appState.uploads, ...state.uploads };
    await saveUploads();
    await loadUploads();
    rebuildTemplateOptions();
  }

  if (state.fills) {
    appState.fills = { ...appState.fills, ...state.fills };
  }

  if (hasImageSnapshots) {
    appState.imageSnapshots = { ...appState.imageSnapshots, ...state.imageSnapshots };
    applyImageSnapshots(state.imageSnapshots);
  }

  if (state.template && templates[state.template] && (state.template !== "cozy" || hasUploads || hasFills || hasImageSnapshots)) {
    appState.template = state.template;
  }

  renderTemplate(appState.template);
}

function applyImageSnapshots(snapshots = {}) {
  Object.entries(snapshots).forEach(([id, coloredDataUrl]) => {
    if (templates[id] && templates[id].type === "image") {
      templates[id].coloredDataUrl = coloredDataUrl || "";
    }
  });
}

async function receiveMessage(message) {
  if (message.type === "hello") {
    if (message.uploads && Object.keys(message.uploads).length) {
      appState.uploads = { ...appState.uploads, ...message.uploads };
      await saveUploads();
      await loadUploads();
      rebuildTemplateOptions();
    }
    Object.assign(appState.fills, message.fills || {});
    if (message.imageSnapshots && Object.keys(message.imageSnapshots).length) {
      appState.imageSnapshots = { ...appState.imageSnapshots, ...message.imageSnapshots };
      applyImageSnapshots(message.imageSnapshots);
    }
    if (message.template && templates[message.template]) appState.template = message.template;
    renderTemplate(appState.template);
    if (templates[appState.template] && templates[appState.template].type === "image") {
      await saveUploads();
    } else {
      saveDraft(false);
    }
    setStatus("Synced room colors");
  }

  if (message.type === "template" && templates[message.template]) {
    appState.template = message.template;
    renderTemplate(appState.template);
    setStatus(`Switched to ${templates[message.template].title}`);
  }

  if (message.type === "fill") {
    setFill(message.key, message.color || "");
    saveDraft(false);
    setStatus("A friend colored a space");
  }

  if (message.type === "canvas-fill") {
    applyRemoteCanvasFill(message);
  }

  if (message.type === "upload" && message.id && message.page) {
    appState.uploads[message.id] = message.page;
    await saveUploads();
    await loadUploads();
    rebuildTemplateOptions();
    appState.template = message.id;
    renderTemplate(appState.template);
    setStatus("A room page was shared");
  }

  if (message.type === "upload-progress" && message.template) {
    appState.imageSnapshots[message.template] = message.coloredDataUrl || "";
    if (appState.uploads[message.template]) appState.uploads[message.template].coloredDataUrl = message.coloredDataUrl || "";
    if (templates[message.template]) templates[message.template].coloredDataUrl = message.coloredDataUrl || "";
    if (appState.uploads[message.template]) persistUploads();
    if (message.reason === "replace" && appState.template === message.template) {
      paintCurrentCanvasFromDataUrl(message.coloredDataUrl);
    }
    setStatus("A friend colored the uploaded page");
  }

  if (message.type === "clear" && message.template === appState.template) {
    Object.keys(appState.fills)
      .filter((key) => key.startsWith(`${appState.template}:`))
      .forEach((key) => setFill(key, ""));
    saveDraft(false);
    setStatus("Room cleared this template");
  }

  if (message.type === "delete-upload" && message.template) {
    delete appState.uploads[message.template];
    delete appState.imageSnapshots[message.template];
    await saveUploads();
    await loadUploads();
    rebuildTemplateOptions();
    if (appState.template === message.template) {
      appState.template = "cozy";
      resetDraft();
      renderTemplate(appState.template);
    }
    setStatus("A room upload was deleted");
  }
}

function applyRemoteCanvasFill(message) {
  if (message.template !== appState.template) return;
  const template = templates[message.template];
  const canvas = els.artboard.querySelector("canvas");
  if (!template || template.type !== "image" || !canvas || !appState.uploadOriginalData) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const x = clamp(Math.floor(Number(message.nx) * canvas.width), 0, canvas.width - 1);
  const y = clamp(Math.floor(Number(message.ny) * canvas.height), 0, canvas.height - 1);
  const before = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const after = floodFillImage(before, appState.uploadOriginalData, x, y, canvas.width, canvas.height, {
    tool: message.tool,
    color: message.color
  });

  if (!after.changed) return;
  ctx.putImageData(after.imageData, 0, 0);
  appState.uploadImageData = after.imageData;
  saveUploadedCanvas(false);
  setStatus("A friend colored the uploaded page");
}

function paintCurrentCanvasFromDataUrl(dataUrl) {
  const canvas = els.artboard.querySelector("canvas");
  if (!canvas || !dataUrl) return;

  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    appState.uploadImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

async function broadcast(payload) {
  if (location.protocol === "file:") return false;
  try {
    const response = await fetch("/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, room: appState.room, clientId: appState.clientId })
    });
    if (!response.ok) {
      if (response.status === 404) showInvalidRoom(appState.room);
      return false;
    }
    return true;
  } catch {
    setOnline(false, "Offline draft");
    return false;
  }
}

function setOnline(isOnline, text) {
  appState.online = isOnline;
  els.connectionDot.classList.toggle("online", isOnline);
  els.connectionText.textContent = text;
}

function setStatus(text) {
  els.saveStatus.textContent = text;
  els.lastAction.textContent = text;
}

function downloadSaveFile() {
  saveDraft(false);
  const template = templates[appState.template];
  const payload = {
    template: appState.template,
    room: appState.room,
    fills: appState.fills,
    upload: template && template.type === "image" ? appState.uploads[appState.template] : null,
    savedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify({
    ...payload
  }, null, 2)], { type: "application/json" });
  downloadBlob(blob, `jillian-coloring-${appState.room}.json`);
  setStatus("Save file exported");
}

function importSaveFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const imported = readJson(reader.result);
    if (!imported || (!imported.fills && !imported.upload)) {
      setStatus("That save file did not load");
      return;
    }

    if (imported.upload && imported.upload.dataUrl) {
      const id = imported.template && imported.template.startsWith("upload-") ? imported.template : `upload-${Date.now()}`;
      appState.uploads[id] = imported.upload;
      await saveUploads();
      await loadUploads();
      rebuildTemplateOptions();
      appState.template = id;
    } else {
      appState.fills = imported.fills;
      if (templates[imported.template]) appState.template = imported.template;
    }

    renderTemplate(appState.template);
    saveDraft(false);
    if (await ensureCurrentRoom()) {
      const importedTemplate = templates[appState.template];
      if (importedTemplate && importedTemplate.type === "image") {
        await broadcast({ type: "upload", id: appState.template, page: appState.uploads[appState.template] });
      }
      broadcast({ type: "hello", template: appState.template, fills: appState.fills, uploads: currentRoomUploads(), imageSnapshots: currentImageSnapshots() });
    }
    setStatus("Save file imported");
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function importColoringPage(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (!isSupportedImageFile(file)) {
      els.customUploadStatus.textContent = "Use a PNG, JPG, WebP, or SVG file.";
      return;
    }

    els.customUploadStatus.textContent = `Preparing ${file.name}...`;
    const id = `upload-${Date.now()}`;
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Uploaded Page";
    const fileDataUrl = await readFileAsDataUrl(file);
    const dataUrl = await prepareUploadDataUrl(fileDataUrl);

    appState.uploads[id] = {
      title,
      dataUrl,
      coloredDataUrl: ""
    };
    els.customUploadStatus.textContent = "Saving upload...";
    if (!(await saveUploads())) {
      delete appState.uploads[id];
      return;
    }

    await loadUploads();
    rebuildTemplateOptions();
    appState.template = id;
    els.customUploadStatus.textContent = "Upload saved. Opening coloring page...";
    if (await ensureCurrentRoom()) {
      await broadcast({ type: "upload", id, page: appState.uploads[id] });
    }
    showWorkspace(true);
    setStatus("Uploaded page saved");
  } catch {
    els.customUploadStatus.textContent = "That file could not be loaded. Try PNG, JPG, WebP, or SVG.";
  } finally {
    event.target.value = "";
    if (event.target !== els.customUploadPageInput) els.customUploadPageInput.value = "";
    if (event.target !== els.uploadPageInput) els.uploadPageInput.value = "";
  }
}

async function prepareUploadDataUrl(dataUrl) {
  const img = await loadImageElement(dataUrl);
  const large = drawImageToDataUrl(img, 1400, "image/png");
  if (large.length <= uploadDataUrlLimit) return large;

  const medium = drawImageToDataUrl(img, 1000, "image/png");
  if (medium.length <= uploadDataUrlLimit) return medium;

  const compact = drawImageToDataUrl(img, 1000, "image/webp", 0.88);
  if (compact.length <= uploadDataUrlLimit) return compact;

  const small = drawImageToDataUrl(img, 780, "image/webp", 0.82);
  if (small.length <= uploadDataUrlLimit) return small;

  return drawImageToDataUrl(img, 620, "image/webp", 0.78);
}

function isSupportedImageFile(file) {
  const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
  if (acceptedTypes.has(file.type)) return true;
  return /\.(png|jpe?g|webp|svg)$/i.test(file.name);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File did not produce a data URL"));
    };
    reader.onerror = () => reject(reader.error || new Error("File could not be read"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function drawImageToDataUrl(img, maxDimension, type, quality) {
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) throw new Error("Image has no dimensions");

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(type, quality);
}

async function deleteUploadedPage() {
  const template = templates[appState.template];
  if (!template || template.type !== "image") {
    setStatus("Choose an uploaded page first");
    return;
  }

  const deletedTemplate = appState.template;
  delete appState.uploads[appState.template];
  await saveUploads();
  await loadUploads();
  appState.template = "cozy";
  rebuildTemplateOptions();
  resetDraft();
  renderTemplate(appState.template);
  broadcast({ type: "delete-upload", template: deletedTemplate });
  setStatus("Uploaded page deleted");
}

function downloadPng() {
  const canvas = els.artboard.querySelector("canvas");
  if (canvas) {
    canvas.toBlob((blob) => {
      downloadBlob(blob, `jillian-coloring-${appState.template}.png`);
      setStatus("PNG downloaded");
    }, "image/png");
    return;
  }

  const svg = els.artboard.querySelector("svg").cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 1800;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      downloadBlob(blob, `color-together-${appState.template}.png`);
      setStatus("PNG downloaded");
    }, "image/png");
  };
  img.src = url;
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function readJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function rgbToHex(value) {
  if (value.startsWith("#")) return value.toLowerCase();
  const match = value.match(/\d+/g);
  if (!match) return value;
  return `#${match.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgba(hex) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    255
  ];
}

function getPixel(data, x, y, width) {
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function isSimilarColor(pixel, target, tolerance) {
  return Math.abs(pixel[0] - target[0]) <= tolerance &&
    Math.abs(pixel[1] - target[1]) <= tolerance &&
    Math.abs(pixel[2] - target[2]) <= tolerance &&
    Math.abs(pixel[3] - target[3]) <= tolerance;
}

function isDarkPixel(pixel) {
  return pixel[0] < 80 && pixel[1] < 80 && pixel[2] < 80;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function capitalize(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";
}

function humanize(value) {
  return value.replace(/-/g, " ");
}

boot();
