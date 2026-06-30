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

const paletteSets = [
  {
    name: "Basic",
    colors: ["#f48fb1", "#ffcc80", "#fff176", "#9ccc65", "#4db6ac", "#64b5f6", "#9575cd", "#ba68c8", "#ef5350", "#8d6e63", "#90a4ae", "#ffffff"]
  },
  {
    name: "Pastels",
    colors: ["#ffd6e7", "#ffe5c2", "#fff6ba", "#d9f7c5", "#c8f5ec", "#c9e7ff", "#dccdff", "#f2ccff", "#f6d6d0", "#e5d2c6", "#dce6ef", "#fffdf8"]
  },
  {
    name: "Dark Tones",
    colors: ["#2d1b2f", "#4a2438", "#5a2b2b", "#5c3b20", "#4c4a1f", "#23452e", "#174246", "#1c365c", "#2c2a68", "#3f2f4f", "#2d3138", "#111111"]
  },
  {
    name: "Skin Tones",
    colors: ["#fff0df", "#f7d8bd", "#edc29d", "#d9a06f", "#bf7d4e", "#9b5f3a", "#774425", "#5a311b", "#3b2116", "#f3c6a8", "#c98f6a", "#8f5737"]
  },
  {
    name: "Nature",
    colors: ["#315c2b", "#4f7d35", "#76a34d", "#9fca65", "#d6dd7f", "#6b8f71", "#3f7f7a", "#4c9ca8", "#7ab7d8", "#8b6f47", "#c08b52", "#f3d27a"]
  },
  {
    name: "Neon",
    colors: ["#ff2d95", "#ff5f1f", "#faff00", "#39ff14", "#00ffd5", "#00a3ff", "#7a5cff", "#d400ff", "#ff1744", "#00ff85", "#ffea00", "#ffffff"]
  }
];

const customPaletteSlotCount = 8;
const customPaletteKey = "jillian-coloring:custom-colors";
const sessionsKey = "jillian-coloring:sessions";
const sessionsRecordKey = "sessions";

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
  sessionId: createSessionId(),
  roomCreated: false,
  shareBaseUrl: "",
  tool: "fill",
  color: "#f48fb1",
  brushSize: 12,
  paletteIndex: 0,
  customColors: [],
  fills: {},
  uploads: {},
  imageSnapshots: {},
  drawingSnapshots: {},
  pages: {},
  pageOrder: [],
  currentPageId: "cozy",
  currentPageIndex: 0,
  uploadImageData: null,
  uploadOriginalData: null,
  uploadSnapshotTimer: null,
  drawingSnapshotTimer: null,
  undoStack: [],
  clientId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  eventSource: null,
  online: false,
  serverAvailable: null,
  syncing: false,
  addingThemePage: false
};

const els = {
  homeView: document.getElementById("homeView"),
  customView: document.getElementById("customView"),
  themeView: document.getElementById("themeView"),
  workspaceView: document.getElementById("workspaceView"),
  homeCustomBtn: document.getElementById("homeCustomBtn"),
  homeJoinBtn: document.getElementById("homeJoinBtn"),
  homeArtRoomBtn: document.getElementById("homeArtRoomBtn"),
  homeJoinPanel: document.getElementById("homeJoinPanel"),
  homeRoomInput: document.getElementById("homeRoomInput"),
  homeJoinSubmit: document.getElementById("homeJoinSubmit"),
  homeJoinStatus: document.getElementById("homeJoinStatus"),
  artRoomPanel: document.getElementById("artRoomPanel"),
  artRoomRefreshBtn: document.getElementById("artRoomRefreshBtn"),
  savedRoomsList: document.getElementById("savedRoomsList"),
  customBackBtn: document.getElementById("customBackBtn"),
  customHomeBtn: document.getElementById("customHomeBtn"),
  customRoomInput: document.getElementById("customRoomInput"),
  customJoinRoomBtn: document.getElementById("customJoinRoomBtn"),
  customNewRoomBtn: document.getElementById("customNewRoomBtn"),
  customShareUrl: document.getElementById("customShareUrl"),
  customCopyShareBtn: document.getElementById("customCopyShareBtn"),
  customBlankBtn: document.getElementById("customBlankBtn"),
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
  pageNav: document.getElementById("pageNav"),
  pagePrevBtn: document.getElementById("pagePrevBtn"),
  pageNextBtn: document.getElementById("pageNextBtn"),
  pageCounter: document.getElementById("pageCounter"),
  pageNameInput: document.getElementById("pageNameInput"),
  savePageNameBtn: document.getElementById("savePageNameBtn"),
  templateTitle: document.getElementById("templateTitle"),
  colorPicker: document.getElementById("colorPicker"),
  palette: document.getElementById("palette"),
  saveStatus: document.getElementById("saveStatus"),
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
  drawTool: document.getElementById("drawTool"),
  drawEraseTool: document.getElementById("drawEraseTool"),
  eraseTool: document.getElementById("eraseTool"),
  pickTool: document.getElementById("pickTool"),
  undoBtn: document.getElementById("undoBtn"),
  brushSize: document.getElementById("brushSize"),
  brushSizeText: document.getElementById("brushSizeText"),
  palettePrevBtn: document.getElementById("palettePrevBtn"),
  paletteNextBtn: document.getElementById("paletteNextBtn"),
  paletteName: document.getElementById("paletteName"),
  saveBtn: document.getElementById("saveBtn"),
  exportBtn: document.getElementById("exportBtn"),
  downloadStateBtn: document.getElementById("downloadStateBtn"),
  importStateInput: document.getElementById("importStateInput"),
  uploadPageInput: document.getElementById("uploadPageInput"),
  blankPageBtn: document.getElementById("blankPageBtn"),
  openThemesBtn: document.getElementById("openThemesBtn"),
  deleteUploadBtn: document.getElementById("deleteUploadBtn"),
  clearBtn: document.getElementById("clearBtn")
};

const saveKey = () => `jillian-coloring:${appState.room}:${appState.template}`;
const uploadsKey = "jillian-coloring:uploads";
const regionKey = (template, region) => `${template}:${region}`;
const selectedPageKey = () => `jillian-coloring:selected-page:${appState.sessionId || appState.room}`;

async function boot() {
  await loadThemePages();
  await loadUploads();
  loadCustomColors();
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
  els.customBlankBtn.addEventListener("click", startCustomBlankDrawing);
  els.customColorPicker.addEventListener("input", () => {
    appState.color = els.customColorPicker.value;
    syncColorControls();
    markActiveSwatch();
  });
  els.customColorPicker.addEventListener("change", () => {
    rememberCustomColor(els.customColorPicker.value);
  });
  els.homeJoinBtn.addEventListener("click", () => {
    els.homeJoinPanel.hidden = !els.homeJoinPanel.hidden;
    if (!els.homeJoinPanel.hidden) {
      els.homeRoomInput.value = "";
      els.homeJoinStatus.textContent = "";
      els.homeRoomInput.focus();
    }
  });
  els.homeArtRoomBtn.addEventListener("click", () => {
    els.artRoomPanel.hidden = !els.artRoomPanel.hidden;
    if (!els.artRoomPanel.hidden) renderArtRoomList();
  });
  els.artRoomRefreshBtn.addEventListener("click", renderArtRoomList);
  els.homeJoinSubmit.addEventListener("click", joinHomeRoom);
  els.homeRoomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinHomeRoom();
  });
  els.homeThemeSelect.addEventListener("change", () => {
    if (!els.homeThemeSelect.value) return;
    appState.addingThemePage = false;
    location.hash = `theme/${els.homeThemeSelect.value}`;
  });
  els.themeBackBtn.addEventListener("click", () => {
    if (appState.addingThemePage) {
      appState.addingThemePage = false;
      history.pushState(null, "", roomHash());
      showWorkspace();
      return;
    }
    location.hash = "";
  });
  els.workspaceHomeBtn.addEventListener("click", () => {
    history.pushState(null, "", location.pathname);
    showHome();
  });

  els.savePageNameBtn.addEventListener("click", () => renameCurrentPage());
  els.pageNameInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    renameCurrentPage();
    els.pageNameInput.blur();
  });
  els.pageNameInput.addEventListener("change", () => renameCurrentPage());

  els.colorPicker.addEventListener("input", () => {
    appState.color = els.colorPicker.value;
    syncColorControls();
    markActiveSwatch();
  });
  els.colorPicker.addEventListener("change", () => {
    rememberCustomColor(els.colorPicker.value);
  });

  els.joinRoomBtn.addEventListener("click", joinWorkspaceRoomId);

  els.roomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") els.joinRoomBtn.click();
  });

  els.newRoomBtn.addEventListener("click", applyWorkspaceRoomId);
  els.copyShareBtn.addEventListener("click", copyShareUrl);
  els.fillTool.addEventListener("click", () => setTool("fill"));
  els.drawTool.addEventListener("click", () => setTool("draw"));
  els.drawEraseTool.addEventListener("click", () => setTool("draw-erase"));
  els.eraseTool.addEventListener("click", () => setTool("erase"));
  els.pickTool.addEventListener("click", () => setTool("pick"));
  els.brushSize.addEventListener("input", () => {
    appState.brushSize = Number(els.brushSize.value) || 12;
    els.brushSizeText.textContent = `${appState.brushSize} px`;
  });
  els.palettePrevBtn.addEventListener("click", () => switchPalette(-1));
  els.paletteNextBtn.addEventListener("click", () => switchPalette(1));
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
  els.blankPageBtn.addEventListener("click", createBlankDrawingPage);
  els.openThemesBtn.addEventListener("click", () => {
    appState.addingThemePage = true;
    history.pushState(null, "", "#theme/all");
    showTheme("all");
  });
  els.pagePrevBtn.addEventListener("click", () => turnPage(-1));
  els.pageNextBtn.addEventListener("click", () => turnPage(1));
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
  appState.addingThemePage = false;
  leaveCurrentRoomForMenu();
  els.homeView.hidden = false;
  els.customView.hidden = true;
  els.themeView.hidden = true;
  els.workspaceView.hidden = true;
  els.homeThemeSelect.value = "";
  if (!els.artRoomPanel.hidden) renderArtRoomList();
}

function showCustom() {
  appState.addingThemePage = false;
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

async function startCustomBlankDrawing() {
  const nextRoom = normalizeRoom(els.customRoomInput.value) || createRoomCode();
  if (!nextRoom) return;
  setRoom(nextRoom);
  els.customUploadStatus.textContent = "Opening blank drawing canvas...";
  await createBlankDrawingPage();
  els.customUploadStatus.textContent = "Blank drawing canvas created.";
  showWorkspace(true);
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
  if (appState.room !== nextRoom) {
    appState.roomCreated = false;
    appState.sessionId = createSessionId();
  }
  appState.room = nextRoom;
  els.roomInput.value = nextRoom;
  els.customRoomInput.value = nextRoom;
  els.roomName.textContent = nextRoom;
  updateShareLinks();
}

function showTheme(theme) {
  const addToCurrentRoom = appState.addingThemePage;
  if (!addToCurrentRoom) leaveCurrentRoomForMenu();
  const categories = getThemeLibrarySections();
  els.homeView.hidden = true;
  els.customView.hidden = true;
  els.themeView.hidden = false;
  els.workspaceView.hidden = true;
  els.themeTitle.textContent = "Theme Pages";
  els.themeGrid.innerHTML = "";

  categories.forEach((section) => {
    if (!section.pages.length) return;
    const heading = document.createElement("h2");
    heading.className = "theme-section-title";
    heading.textContent = `${capitalize(section.theme)} Pages`;
    els.themeGrid.appendChild(heading);

    section.pages.forEach((page) => {
      const template = templates[page.template] || builtInTemplates[page.template] || seasonalTemplates[page.template];
      if (!template) return;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "theme-card";
      const preview = createThemePreview(template);
      const title = document.createElement("strong");
      title.textContent = page.title;
      card.append(preview, title);
      card.addEventListener("click", async () => {
        if (addToCurrentRoom) {
          await addThemePageToRoom(page.template, page.title);
          appState.addingThemePage = false;
        } else {
          await addThemePageToRoom(page.template, page.title, { replaceStarter: true });
        }
        showWorkspace(true);
      });
      els.themeGrid.appendChild(card);
    });
  });
}

function getThemeLibrarySections() {
  const themeNames = ["winter", "fall", "spring", "summer"];
  return themeNames.map((theme) => ({
    theme,
    pages: themeCollections[theme] || defaultThemeCollections[theme] || []
  }));
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

function createSessionId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
  appState.imageSnapshots = {};
  appState.drawingSnapshots = {};
  appState.pages = {};
  appState.pageOrder = [];
  appState.undoStack = [];
}

function currentRoomUploads() {
  const pageIds = new Set([...appState.pageOrder, ...Object.keys(appState.pages), appState.template]);
  return Object.fromEntries(
    Object.entries(appState.uploads).filter(([id]) => pageIds.has(id))
  );
}

function currentImageSnapshots() {
  return Object.fromEntries(
    Object.entries(appState.imageSnapshots).filter(([, dataUrl]) => Boolean(dataUrl))
  );
}

function currentDrawingSnapshots() {
  return Object.fromEntries(
    Object.entries(appState.drawingSnapshots).filter(([, dataUrl]) => Boolean(dataUrl))
  );
}

function currentRoomPages() {
  ensurePageRecord(appState.template);
  return { ...appState.pages };
}

function currentRoomPageOrder() {
  ensurePageRecord(appState.template);
  return getRoomPageIds();
}

function createPageId(prefix = "page", source = "") {
  const cleanSource = String(source || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 18);
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return [prefix, cleanSource, suffix].filter(Boolean).join("-");
}

function getStoredRoomPageIds() {
  const seen = new Set();
  const ids = [];
  appState.pageOrder.forEach((id) => {
    if (seen.has(id)) return;
    if (!templates[id] && !appState.pages[id]) return;
    seen.add(id);
    ids.push(id);
  });
  Object.keys(appState.pages).forEach((id) => {
    if (seen.has(id)) return;
    if (!templates[id] && !appState.pages[id]) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

function getRoomPageIds() {
  const seen = new Set();
  const ids = [];
  if (templates[appState.template]) ensurePageRecord(appState.template);

  appState.pageOrder.forEach((id) => {
    if (seen.has(id)) return;
    if (!templates[id] && !appState.pages[id]) return;
    seen.add(id);
    ids.push(id);
  });

  if (templates[appState.template] && !seen.has(appState.template)) {
    ensurePageRecord(appState.template);
    ids.push(appState.template);
  }

  return ids;
}

function pageRecordFromTemplate(id) {
  const template = templates[id];
  if (!template) return null;
  return {
    id,
    title: template.title || "Coloring Page",
    type: template.type || "svg",
    templateId: template.templateId || "",
    sourceTemplateId: template.sourceTemplateId || id,
    sourceTitle: template.sourceTitle || template.title || "",
    dataUrl: template.type === "image" ? template.dataUrl || "" : "",
    createdAt: new Date().toISOString()
  };
}

function pageRecordFromSourceTemplate(sourceId, title = "") {
  const source = templates[sourceId] || builtInTemplates[sourceId] || seasonalTemplates[sourceId];
  if (!source) return null;
  const pageTitle = title || source.title || "Coloring Page";
  const page = {
    id: createPageId("page", sourceId),
    title: pageTitle,
    type: source.type || "svg",
    templateId: source.templateId || "",
    sourceTemplateId: source.sourceTemplateId || sourceId,
    sourceTitle: source.sourceTitle || source.title || pageTitle,
    dataUrl: source.type === "image" ? source.dataUrl || "" : "",
    createdAt: new Date().toISOString()
  };
  if (source.type === "image") page.coloredDataUrl = "";
  return page;
}

function addPageRecord(page, rebuild = true) {
  if (!page || !page.id) return null;
  const id = String(page.id);
  const normalized = {
    ...appState.pages[id],
    ...page,
    id,
    title: page.title || appState.pages[id]?.title || "Coloring Page",
    type: page.type || appState.pages[id]?.type || "svg"
  };
  appState.pages[id] = normalized;
  if (!appState.pageOrder.includes(id)) appState.pageOrder.push(id);

  if (normalized.type === "image" && normalized.dataUrl && id.startsWith("upload-") && !appState.uploads[id]) {
    appState.uploads[id] = {
      title: normalized.title,
      dataUrl: normalized.dataUrl,
      coloredDataUrl: appState.imageSnapshots[id] || ""
    };
  }

  if (rebuild) {
    rebuildTemplateCatalog();
    rebuildTemplateOptions();
  }
  return normalized;
}

function hasPageArtwork(id) {
  const hasFills = Object.keys(appState.fills).some((key) => key.startsWith(`${id}:`));
  return Boolean(
    hasFills ||
    appState.imageSnapshots[id] ||
    appState.drawingSnapshots[id] ||
    appState.uploads[id]?.coloredDataUrl
  );
}

function canReplaceDefaultStarter(nextId) {
  const ids = getStoredRoomPageIds();
  return ids.length === 1 && ids[0] === "cozy" && nextId !== "cozy" && !hasPageArtwork("cozy");
}

function canUseAsSingleStarter(nextId) {
  return getStoredRoomPageIds().length === 0 || canReplaceDefaultStarter(nextId);
}

function pruneUnusedDefaultStarter() {
  const ids = getStoredRoomPageIds();
  if (ids.length <= 1 || appState.template === "cozy" || !ids.includes("cozy") || hasPageArtwork("cozy")) return;
  delete appState.pages.cozy;
  appState.pageOrder = appState.pageOrder.filter((id) => id !== "cozy");
}

function setSingleStarterPage(page) {
  if (!page || !page.id) return;
  appState.pages = {};
  appState.pageOrder = [];
  addPageRecord(page, false);
}

function ensurePageRecord(id) {
  if (appState.pages[id]) return appState.pages[id];
  const page = pageRecordFromTemplate(id);
  return page ? addPageRecord(page, false) : null;
}

async function sharePageRecord(id = appState.template) {
  const page = ensurePageRecord(id);
  if (!page || !(await ensureCurrentRoom())) return false;
  await broadcast({ type: "page-add", page });
  if (page.type === "image" && appState.uploads[id]) {
    await broadcast({ type: "upload", id, page: appState.uploads[id] });
  }
  if (appState.drawingSnapshots[id]) {
    await broadcast({ type: "drawing-progress", template: id, dataUrl: appState.drawingSnapshots[id] });
  }
  return true;
}

async function choosePage(id, options = {}) {
  if (!templates[id]) return false;
  const page = pageRecordFromTemplate(id);
  if (options.replaceStarter && page && canReplaceDefaultStarter(id)) {
    setSingleStarterPage(page);
  } else {
    ensurePageRecord(id);
  }
  appState.template = id;
  appState.currentPageId = id;
  appState.currentPageIndex = getCurrentPageIndex();
  pruneUnusedDefaultStarter();
  appState.currentPageIndex = getCurrentPageIndex();
  rememberCurrentPage();
  renderTemplate(appState.template);
  rebuildTemplateOptions();
  if (options.sharePage) await sharePageRecord(id);
  return true;
}

async function addThemePageToRoom(sourceId, title, options = {}) {
  const page = pageRecordFromSourceTemplate(sourceId, title);
  if (!page) return false;

  if (options.replaceStarter && canUseAsSingleStarter(page.id)) {
    setSingleStarterPage(page);
  } else {
    addPageRecord(page, false);
  }

  rebuildTemplateCatalog();
  rebuildTemplateOptions();
  await choosePage(page.id);
  if (await ensureCurrentRoom()) await broadcast({ type: "page-add", page: appState.pages[page.id] || page });
  setStatus(`${getPageTitle(page.id)} added`);
  return true;
}

function getPageTitle(id = appState.template) {
  return appState.pages[id]?.title || templates[id]?.title || "Coloring Page";
}

function normalizePageTitle(value, fallback = "Coloring Page") {
  const title = String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
  return title || fallback;
}

function applyPageTitle(id, title, options = {}) {
  if (!templates[id] && !appState.pages[id]) return false;
  const fallback = getPageTitle(id);
  const nextTitle = normalizePageTitle(title, fallback);
  const page = ensurePageRecord(id);
  if (!page) return false;

  page.title = nextTitle;
  appState.pages[id] = page;
  if (appState.uploads[id]) appState.uploads[id].title = nextTitle;
  if (templates[id]) templates[id].title = nextTitle;
  rebuildTemplateCatalog();
  rebuildTemplateOptions();

  if (id === appState.template) {
    els.templateTitle.textContent = nextTitle;
    els.pageNameInput.value = nextTitle;
  }

  if (!options.silent) setStatus("Page name saved");
  return true;
}

async function renameCurrentPage() {
  const id = appState.template;
  const currentTitle = getPageTitle(id);
  const nextTitle = normalizePageTitle(els.pageNameInput.value, currentTitle);
  if (nextTitle === currentTitle) {
    els.pageNameInput.value = currentTitle;
    return;
  }

  if (!applyPageTitle(id, nextTitle)) return;
  await saveLocalSession();
  if (await ensureCurrentRoom()) await broadcast({ type: "page-rename", id, title: nextTitle });
}

function rememberCurrentPage() {
  try {
    localStorage.setItem(selectedPageKey(), appState.template);
    localStorage.setItem(`${selectedPageKey()}:index`, String(appState.currentPageIndex));
  } catch {
    // Current-page memory is a convenience only.
  }
}

function getRememberedPage() {
  try {
    return localStorage.getItem(selectedPageKey());
  } catch {
    return "";
  }
}

function getCurrentPageIndex() {
  const ids = getRoomPageIds();
  const index = ids.indexOf(appState.template);
  return index === -1 ? 0 : index;
}

async function turnPage(direction) {
  const ids = getRoomPageIds();
  if (!ids.length) return;
  const currentIndex = getCurrentPageIndex();
  const nextIndex = clamp(currentIndex + direction, 0, ids.length - 1);
  if (nextIndex === currentIndex) return;
  await choosePage(ids[nextIndex]);
}

function updatePageNavControls() {
  const ids = getRoomPageIds();
  const index = ids.indexOf(appState.template);
  const safeIndex = index === -1 ? 0 : index;
  appState.currentPageId = appState.template;
  appState.currentPageIndex = safeIndex;

  const total = ids.length || 1;
  els.pageNav.hidden = total <= 1;
  els.pageCounter.textContent = `Page ${safeIndex + 1} of ${total}`;
  els.pagePrevBtn.disabled = safeIndex <= 0;
  els.pageNextBtn.disabled = safeIndex >= ids.length - 1;
  els.pagePrevBtn.title = safeIndex > 0 && templates[ids[safeIndex - 1]]
    ? `Previous: ${templates[ids[safeIndex - 1]].title}`
    : "Previous page";
  els.pageNextBtn.title = safeIndex < ids.length - 1 && templates[ids[safeIndex + 1]]
    ? `Next: ${templates[ids[safeIndex + 1]].title}`
    : "Next page";
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
        sessionId: appState.sessionId,
        template: appState.template,
        fills: appState.fills,
        uploads: currentRoomUploads(),
        imageSnapshots: currentImageSnapshots(),
        drawingSnapshots: currentDrawingSnapshots(),
        pages: currentRoomPages(),
        pageOrder: currentRoomPageOrder()
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
  await saveLocalSession();
  if (!(await ensureCurrentRoom())) {
    setStatus("Saved in Art Room; room could not be saved");
    return;
  }

  await broadcast({
    type: "hello",
    sessionId: appState.sessionId,
    template: appState.template,
    fills: appState.fills,
    uploads: currentRoomUploads(),
    imageSnapshots: currentImageSnapshots(),
    drawingSnapshots: currentDrawingSnapshots(),
    pages: currentRoomPages(),
    pageOrder: currentRoomPageOrder()
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

  Object.entries(appState.pages).forEach(([id, page]) => {
    if (!page || !page.type) return;
    if (page.type === "svg") {
      const source = builtInTemplates[page.sourceTemplateId] || builtInTemplates[id] || templates[page.sourceTemplateId] || templates[id];
      const templateId = page.templateId || source?.templateId || "";
      if (templateId) {
        templates[id] = {
          id,
          title: page.title || source?.title || "Coloring Page",
          type: "svg",
          templateId,
          sourceTemplateId: page.sourceTemplateId || id,
          sourceTitle: page.sourceTitle || source?.title || ""
        };
      } else if (templates[id]) {
        templates[id] = { ...templates[id], title: page.title || templates[id].title };
      }
    }
    if (page.type === "drawing") {
      templates[id] = {
        id,
        title: page.title || "Blank Drawing Page",
        type: "drawing"
      };
    }
    if (page.type === "image" && page.dataUrl) {
      templates[id] = {
        id,
        title: page.title || "Uploaded Page",
        type: "image",
        dataUrl: page.dataUrl,
        coloredDataUrl: appState.imageSnapshots[id] || page.coloredDataUrl || ""
      };
    }
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

async function readSavedSessions() {
  try {
    const saved = await readRecordFromDb(sessionsRecordKey);
    if (saved && typeof saved === "object") return saved;
  } catch {
    // Fall through to localStorage.
  }

  return readJson(localStorage.getItem(sessionsKey)) || {};
}

async function writeSavedSessions(sessions) {
  try {
    await writeRecordToDb(sessionsRecordKey, sessions);
    localStorage.removeItem(sessionsKey);
    return true;
  } catch {
    try {
      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      return true;
    } catch {
      setStatus("Art Room storage is full");
      return false;
    }
  }
}

function buildSessionPayload() {
  ensurePageRecord(appState.template);
  const savedAt = new Date().toISOString();
  return {
    sessionId: appState.sessionId,
    roomCode: appState.room,
    title: templates[appState.template]?.title || "Jillian Coloring Room",
    currentPageId: appState.template,
    currentPageIndex: getCurrentPageIndex(),
    savedAt,
    pages: currentRoomPages(),
    pageOrder: currentRoomPageOrder(),
    fills: appState.fills,
    uploads: currentRoomUploads(),
    imageSnapshots: currentImageSnapshots(),
    drawingSnapshots: currentDrawingSnapshots()
  };
}

async function saveLocalSession() {
  const sessions = await readSavedSessions();
  sessions[appState.sessionId] = buildSessionPayload();
  const saved = await writeSavedSessions(sessions);
  if (saved && !els.artRoomPanel.hidden) renderArtRoomList();
  return saved;
}

async function renderArtRoomList() {
  const sessions = await readSavedSessions();
  const items = Object.values(sessions).sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
  els.savedRoomsList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "small-note";
    empty.textContent = "Saved rooms will show up here after you press Save.";
    els.savedRoomsList.appendChild(empty);
    return;
  }

  items.forEach((session) => {
    const row = document.createElement("div");
    row.className = "saved-room";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = session.title || "Saved Coloring Room";
    const meta = document.createElement("span");
    const savedAt = session.savedAt ? new Date(session.savedAt).toLocaleString() : "Saved";
    meta.textContent = `Room ${session.roomCode || "new"} - ${savedAt}`;
    info.append(title, meta);

    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Open";
    open.addEventListener("click", () => openSavedSession(session));
    row.append(info, open);
    els.savedRoomsList.appendChild(row);
  });
}

async function openSavedSession(session) {
  if (!session) return;
  resetDraft();
  const restoredSessionId = session.sessionId || createSessionId();
  setRoom(session.roomCode || createRoomCode());
  appState.sessionId = restoredSessionId;
  appState.fills = session.fills || {};
  appState.imageSnapshots = session.imageSnapshots || {};
  appState.drawingSnapshots = session.drawingSnapshots || {};
  appState.pages = session.pages || {};
  appState.pageOrder = Array.isArray(session.pageOrder) ? session.pageOrder : Object.keys(appState.pages);
  appState.uploads = { ...appState.uploads, ...(session.uploads || {}) };
  await saveUploads();
  await loadUploads();
  mergeRoomPages(appState.pages, appState.pageOrder);
  const restoredIds = getRoomPageIds();
  const indexedPage = restoredIds[Number(session.currentPageIndex) || 0];
  const pageId = session.currentPageId && templates[session.currentPageId] ? session.currentPageId : indexedPage || "cozy";
  appState.template = pageId;
  appState.currentPageId = pageId;
  appState.currentPageIndex = getCurrentPageIndex();
  rememberCurrentPage();
  await createRoom(appState.room);
  showWorkspace(true);
  setStatus("Opened saved Art Room session");
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

async function readRecordFromDb(key) {
  const db = await getUploadDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(uploadStoreName, "readonly");
    const request = transaction.objectStore(uploadStoreName).get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not read saved data"));
  });
}

async function writeRecordToDb(key, value) {
  const db = await getUploadDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(uploadStoreName, "readwrite");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not save data"));
    transaction.objectStore(uploadStoreName).put(value, key);
  });
}

function rebuildTemplateOptions() {
  updatePageNavControls();
}

function buildPalette() {
  els.palette.innerHTML = "";
  els.customPalette.innerHTML = "";
  const palette = paletteSets[appState.paletteIndex] || paletteSets[0];
  els.paletteName.textContent = palette.name;
  palette.colors.forEach((color) => {
    els.palette.appendChild(createSwatch(color));
    els.customPalette.appendChild(createSwatch(color));
  });
  getCustomSlots().forEach((color, index) => {
    els.palette.appendChild(createSwatch(color, index));
    els.customPalette.appendChild(createSwatch(color, index));
  });
  syncColorControls();
  markActiveSwatch();
}

function createSwatch(color, customIndex = null) {
  const swatch = document.createElement("button");
  swatch.type = "button";
  swatch.className = "swatch";
  if (!color) {
    swatch.classList.add("empty");
    swatch.title = "Save current custom color here";
  } else {
    swatch.title = color === "#ffffff" ? "White" : color;
    swatch.style.background = color;
  }
  swatch.addEventListener("click", () => {
    if (!color && customIndex !== null) {
      setCustomColorSlot(customIndex, appState.color);
      return;
    }
    if (!color) return;
    appState.color = color;
    syncColorControls();
    markActiveSwatch();
    if (appState.tool === "draw-erase") setTool("draw");
    else if (!isDrawingTool()) setTool("fill");
  });
  return swatch;
}

function switchPalette(direction) {
  appState.paletteIndex = (appState.paletteIndex + direction + paletteSets.length) % paletteSets.length;
  buildPalette();
}

function loadCustomColors() {
  const saved = readJson(localStorage.getItem(customPaletteKey));
  appState.customColors = Array.isArray(saved) ? saved.slice(0, customPaletteSlotCount) : [];
  while (appState.customColors.length < customPaletteSlotCount) appState.customColors.push("");
}

function getCustomSlots() {
  while (appState.customColors.length < customPaletteSlotCount) appState.customColors.push("");
  return appState.customColors.slice(0, customPaletteSlotCount);
}

function setCustomColorSlot(index, color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  appState.customColors[index] = color.toLowerCase();
  saveCustomColors();
  buildPalette();
  setStatus("Custom color saved");
}

function rememberCustomColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  const normalized = color.toLowerCase();
  if (appState.customColors.includes(normalized)) return;
  const index = appState.customColors.findIndex((slot) => !slot);
  setCustomColorSlot(index === -1 ? 0 : index, normalized);
}

function saveCustomColors() {
  try {
    localStorage.setItem(customPaletteKey, JSON.stringify(getCustomSlots()));
  } catch {
    // Custom palette storage is best-effort.
  }
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

  const pageTitle = getPageTitle(templateName);
  els.templateTitle.textContent = pageTitle;
  els.pageNameInput.value = pageTitle;
  els.deleteUploadBtn.disabled = !(config.type === "image" && appState.uploads[templateName] && templateName.startsWith("upload-"));
  updatePageNavControls();

  if (config.type === "image") {
    renderUploadedPage(config);
    return;
  }

  if (config.type === "drawing") {
    renderBlankDrawingPage(config);
    return;
  }

  const template = document.getElementById(config.templateId);
  const frame = createPageFrame();
  frame.appendChild(template.content.firstElementChild.cloneNode(true));
  els.artboard.replaceChildren(frame);
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;
  applyFills();
  updateProgress();

  els.artboard.querySelectorAll("[data-region]").forEach((region) => {
    region.addEventListener("click", () => handleRegionClick(region));
  });
  setupDrawingLayer(frame, 900, 900);
}

function renderUploadedPage(config) {
  const canvas = document.createElement("canvas");
  const frame = createPageFrame();
  canvas.className = "coloring-page upload-canvas base-canvas";
  canvas.setAttribute("aria-label", `${config.title} coloring canvas`);
  frame.appendChild(canvas);
  els.artboard.replaceChildren(frame);
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;

  const img = new Image();
  img.onload = () => {
    const limit = 1400;
    const scale = Math.min(1, limit / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    frame.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

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
        setupDrawingLayer(frame, canvas.width, canvas.height);
      };
      colored.src = savedSnapshot;
    } else {
      appState.uploadImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      updateProgress();
      setupDrawingLayer(frame, canvas.width, canvas.height);
    }
  };
  img.src = config.dataUrl;

  canvas.addEventListener("click", (event) => handleCanvasClick(event, canvas));
}

function renderBlankDrawingPage(config) {
  const frame = createPageFrame();
  const canvas = document.createElement("canvas");
  canvas.className = "coloring-page base-canvas";
  canvas.width = 900;
  canvas.height = 900;
  canvas.setAttribute("aria-label", `${config.title} blank drawing canvas`);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  frame.appendChild(canvas);
  els.artboard.replaceChildren(frame);
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;
  setupDrawingLayer(frame, canvas.width, canvas.height);
  if (appState.tool !== "draw" && appState.tool !== "draw-erase") setTool("draw");
}

function createPageFrame() {
  const frame = document.createElement("div");
  frame.className = "page-stack";
  return frame;
}

function setupDrawingLayer(frame, width, height) {
  frame.querySelector(".drawing-layer")?.remove();
  const canvas = document.createElement("canvas");
  canvas.className = "drawing-layer";
  canvas.width = width;
  canvas.height = height;
  canvas.dataset.template = appState.template;
  frame.appendChild(canvas);
  paintDrawingLayerFromDataUrl(appState.drawingSnapshots[appState.template] || "", canvas);
  bindDrawingLayer(canvas);
  updateDrawingLayerMode();
}

function bindDrawingLayer(canvas) {
  let drawing = false;
  let lastPoint = null;

  canvas.addEventListener("pointerdown", (event) => {
    if (!isDrawingTool()) return;
    event.preventDefault();
    drawing = true;
    lastPoint = getCanvasPoint(event, canvas);
    const before = canvas.toDataURL("image/png");
    appState.undoStack.push({ drawing: true, template: appState.template, before });
    canvas.setPointerCapture(event.pointerId);
    drawStrokeSegment(canvas, lastPoint, lastPoint);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing || !lastPoint) return;
    event.preventDefault();
    const nextPoint = getCanvasPoint(event, canvas);
    drawStrokeSegment(canvas, lastPoint, nextPoint);
    lastPoint = nextPoint;
  });

  const finish = (event) => {
    if (!drawing) return;
    event.preventDefault();
    drawing = false;
    lastPoint = null;
    saveDrawingLayer(canvas, true);
  };

  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  canvas.addEventListener("pointerleave", finish);
}

function isDrawingTool() {
  return appState.tool === "draw" || appState.tool === "draw-erase";
}

function updateDrawingLayerMode() {
  els.artboard.classList.toggle("drawing-active", isDrawingTool());
}

function drawStrokeSegment(canvas, from, to) {
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = appState.brushSize;
  if (appState.tool === "draw-erase") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = appState.color;
  }
  if (Math.abs(from.x - to.x) < 0.01 && Math.abs(from.y - to.y) < 0.01) {
    ctx.beginPath();
    ctx.arc(from.x, from.y, appState.brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
  ctx.restore();
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function saveDrawingLayer(canvas = getDrawingCanvas(), shareWithRoom = false) {
  if (!canvas) return;
  const dataUrl = canvas.toDataURL("image/png");
  if (isCanvasBlank(canvas)) {
    delete appState.drawingSnapshots[appState.template];
  } else {
    appState.drawingSnapshots[appState.template] = dataUrl;
  }
  if (shareWithRoom) queueDrawingProgressSnapshot();
}

function queueDrawingProgressSnapshot() {
  clearTimeout(appState.drawingSnapshotTimer);
  appState.drawingSnapshotTimer = setTimeout(() => {
    const canvas = getDrawingCanvas();
    if (!canvas) return;
    const dataUrl = appState.drawingSnapshots[appState.template] || "";
    broadcast({ type: "drawing-progress", template: appState.template, dataUrl });
  }, 160);
}

function paintDrawingLayerFromDataUrl(dataUrl, canvas = getDrawingCanvas()) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!dataUrl) return;
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

function clearDrawingLayer() {
  const canvas = getDrawingCanvas();
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getDrawingCanvas() {
  return els.artboard.querySelector(".drawing-layer");
}

function getBaseCanvas() {
  return els.artboard.querySelector(".base-canvas, .upload-canvas");
}

function isCanvasBlank(canvas) {
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] !== 0) return false;
  }
  return true;
}

function handleRegionClick(region) {
  if (isDrawingTool()) return;
  const id = region.dataset.region;
  const key = regionKey(appState.template, id);
  const previous = appState.fills[key] || "";

  if (appState.tool === "pick") {
    const picked = previous || "#ffffff";
    appState.color = picked;
    syncColorControls();
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
  if (isDrawingTool()) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
  const before = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const picked = getPixel(before.data, x, y, canvas.width);

  if (appState.tool === "pick") {
    appState.color = rgbToHex(`rgb(${picked[0]}, ${picked[1]}, ${picked[2]})`);
    syncColorControls();
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
  // Progress is intentionally not shown in the UI.
}

function setTool(tool) {
  appState.tool = tool;
  els.fillTool.classList.toggle("active", tool === "fill");
  els.drawTool.classList.toggle("active", tool === "draw");
  els.drawEraseTool.classList.toggle("active", tool === "draw-erase");
  els.eraseTool.classList.toggle("active", tool === "erase");
  els.pickTool.classList.toggle("active", tool === "pick");
  updateDrawingLayerMode();
}

function undo() {
  const item = appState.undoStack.pop();
  if (!item) {
    setStatus("Nothing to undo");
    return;
  }

  if (item.canvas) {
    const canvas = getBaseCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.putImageData(item.imageData, 0, 0);
    appState.uploadImageData = item.imageData;
    saveUploadedCanvas(true);
    setStatus("Undid last fill");
    return;
  }

  if (item.drawing) {
    appState.drawingSnapshots[item.template] = item.before || "";
    if (item.template === appState.template) paintDrawingLayerFromDataUrl(item.before || "");
    broadcast({ type: "drawing-progress", template: item.template, dataUrl: item.before || "" });
    setStatus("Undid last brush stroke");
    return;
  }

  setFill(item.key, item.previous);
  saveDraft(false);
  broadcast({ type: "fill", key: item.key, color: item.previous, template: appState.template });
  setStatus("Undid last fill");
}

function clearColors() {
  const drawingCanvas = getDrawingCanvas();
  const drawingBefore = drawingCanvas && appState.drawingSnapshots[appState.template] ? drawingCanvas.toDataURL("image/png") : "";

  if (templates[appState.template] && templates[appState.template].type === "image") {
    const canvas = getBaseCanvas();
    if (!canvas || !appState.uploadOriginalData) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    appState.undoStack.push({ canvas: true, imageData: current });
    ctx.putImageData(appState.uploadOriginalData, 0, 0);
    appState.uploadImageData = appState.uploadOriginalData;
    saveUploadedCanvas(true);
    if (drawingBefore) {
      appState.undoStack.push({ drawing: true, template: appState.template, before: drawingBefore });
      delete appState.drawingSnapshots[appState.template];
      clearDrawingLayer();
      broadcast({ type: "drawing-progress", template: appState.template, dataUrl: "" });
    }
    setStatus("Cleared uploaded page");
    return;
  }

  const keys = Object.keys(appState.fills).filter((key) => key.startsWith(`${appState.template}:`));
  if (!keys.length && !drawingBefore) return;
  appState.undoStack.push(...keys.map((key) => ({ key, previous: appState.fills[key], next: "" })));
  keys.forEach((key) => setFill(key, ""));
  if (drawingBefore) {
    appState.undoStack.push({ drawing: true, template: appState.template, before: drawingBefore });
    delete appState.drawingSnapshots[appState.template];
    clearDrawingLayer();
  }
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
  const canvas = getBaseCanvas();
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
    const canvas = getBaseCanvas();
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
    broadcast({
      type: "hello",
      sessionId: appState.sessionId,
      template: appState.template,
      fills: appState.fills,
      uploads: currentRoomUploads(),
      imageSnapshots: currentImageSnapshots(),
      drawingSnapshots: currentDrawingSnapshots(),
      pages: currentRoomPages(),
      pageOrder: currentRoomPageOrder()
    });
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
  appState.currentPageId = "cozy";
  appState.currentPageIndex = 0;
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
  if (state.sessionId) appState.sessionId = state.sessionId;
  const hasUploads = state.uploads && Object.keys(state.uploads).length > 0;
  const hasFills = state.fills && Object.keys(state.fills).length > 0;
  const hasImageSnapshots = state.imageSnapshots && Object.keys(state.imageSnapshots).length > 0;
  const hasDrawingSnapshots = state.drawingSnapshots && Object.keys(state.drawingSnapshots).length > 0;

  mergeRoomPages(state.pages, state.pageOrder);

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

  if (hasDrawingSnapshots) {
    appState.drawingSnapshots = { ...appState.drawingSnapshots, ...state.drawingSnapshots };
  }

  const rememberedPage = getRememberedPage();
  if (rememberedPage && templates[rememberedPage]) {
    appState.template = rememberedPage;
  } else if (state.template && templates[state.template] && (state.template !== "cozy" || hasUploads || hasFills || hasImageSnapshots || hasDrawingSnapshots)) {
    appState.template = state.template;
  } else if (!templates[appState.template]) {
    appState.template = "cozy";
  }

  appState.currentPageId = appState.template;
  appState.currentPageIndex = getCurrentPageIndex();
  pruneUnusedDefaultStarter();
  appState.currentPageIndex = getCurrentPageIndex();
  rememberCurrentPage();
  renderTemplate(appState.template);
}

function mergeRoomPages(pages = {}, pageOrder = []) {
  const localOrder = [...appState.pageOrder];
  Object.values(pages || {}).forEach((page) => addPageRecord(page, false));
  const ordered = [];
  (Array.isArray(pageOrder) ? pageOrder : []).forEach((id) => {
    if (appState.pages[id] && !ordered.includes(id)) ordered.push(id);
  });
  [...localOrder, ...appState.pageOrder, ...Object.keys(appState.pages)].forEach((id) => {
    if (appState.pages[id] && !ordered.includes(id)) ordered.push(id);
  });
  appState.pageOrder = ordered;
  pruneUnusedDefaultStarter();
  rebuildTemplateCatalog();
  rebuildTemplateOptions();
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
    mergeRoomPages(message.pages, message.pageOrder);
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
    if (message.drawingSnapshots && Object.keys(message.drawingSnapshots).length) {
      appState.drawingSnapshots = { ...appState.drawingSnapshots, ...message.drawingSnapshots };
    }
    renderTemplate(appState.template);
    if (templates[appState.template] && templates[appState.template].type === "image") {
      await saveUploads();
    } else {
      saveDraft(false);
    }
    setStatus("Synced room colors");
  }

  if (message.type === "template" && templates[message.template]) {
    ensurePageRecord(message.template);
    rebuildTemplateOptions();
    setStatus(`${templates[message.template].title} is available`);
  }

  if (message.type === "page-add" && message.page && message.page.id) {
    addPageRecord(message.page);
    if (message.page.id === appState.template) {
      els.templateTitle.textContent = getPageTitle(appState.template);
      els.pageNameInput.value = getPageTitle(appState.template);
    }
    setStatus(`${message.page.title || "A room page"} is available`);
  }

  if (message.type === "page-rename" && message.id && message.title) {
    applyPageTitle(message.id, message.title, { silent: true });
    if (message.id === appState.template) setStatus("Page name updated");
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
    addPageRecord({
      id: message.id,
      title: message.page.title || "Uploaded Page",
      type: "image",
      dataUrl: message.page.dataUrl || ""
    }, false);
    await saveUploads();
    await loadUploads();
    rebuildTemplateOptions();
    setStatus("A room page was shared");
  }

  if (message.type === "upload-progress" && message.template) {
    appState.imageSnapshots[message.template] = message.coloredDataUrl || "";
    if (appState.uploads[message.template]) appState.uploads[message.template].coloredDataUrl = message.coloredDataUrl || "";
    if (templates[message.template]) templates[message.template].coloredDataUrl = message.coloredDataUrl || "";
    if (appState.uploads[message.template]) persistUploads();
    if (appState.template === message.template) {
      paintCurrentCanvasFromDataUrl(message.coloredDataUrl);
    }
    setStatus("A friend colored the uploaded page");
  }

  if (message.type === "drawing-progress" && message.template) {
    appState.drawingSnapshots[message.template] = message.dataUrl || "";
    if (message.template === appState.template) paintDrawingLayerFromDataUrl(message.dataUrl || "");
    setStatus("A friend drew on a page");
  }

  if (message.type === "clear" && message.template) {
    Object.keys(appState.fills)
      .filter((key) => key.startsWith(`${message.template}:`))
      .forEach((key) => setFill(key, ""));
    delete appState.drawingSnapshots[message.template];
    if (message.template === appState.template) clearDrawingLayer();
    saveDraft(false);
    setStatus("Room cleared this template");
  }

  if (message.type === "delete-upload" && message.template) {
    delete appState.uploads[message.template];
    delete appState.imageSnapshots[message.template];
    delete appState.drawingSnapshots[message.template];
    delete appState.pages[message.template];
    appState.pageOrder = appState.pageOrder.filter((id) => id !== message.template);
    await saveUploads();
    await loadUploads();
    rebuildTemplateOptions();
    if (appState.template === message.template) {
      appState.template = "cozy";
      appState.currentPageId = appState.template;
      appState.currentPageIndex = getCurrentPageIndex();
      rememberCurrentPage();
      appState.uploadImageData = null;
      appState.uploadOriginalData = null;
      renderTemplate(appState.template);
    }
    setStatus("A room upload was deleted");
  }
}

function applyRemoteCanvasFill(message) {
  if (message.template !== appState.template) return;
  const template = templates[message.template];
  const canvas = getBaseCanvas();
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
  const canvas = getBaseCanvas();
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
  const payload = buildSessionPayload();
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
    if (!imported || (!imported.fills && !imported.upload && !imported.pages && !imported.uploads)) {
      setStatus("That save file did not load");
      return;
    }

    if (imported.pages || imported.uploads || imported.drawingSnapshots) {
      const restoredSessionId = imported.sessionId || createSessionId();
      if (imported.roomCode || imported.room) setRoom(imported.roomCode || imported.room);
      appState.sessionId = restoredSessionId;
      appState.fills = imported.fills || {};
      appState.imageSnapshots = imported.imageSnapshots || {};
      appState.drawingSnapshots = imported.drawingSnapshots || {};
      appState.pages = imported.pages || {};
      appState.pageOrder = Array.isArray(imported.pageOrder) ? imported.pageOrder : Object.keys(appState.pages);
      appState.uploads = { ...appState.uploads, ...(imported.uploads || {}) };
      await saveUploads();
      await loadUploads();
      mergeRoomPages(appState.pages, appState.pageOrder);
      const importedIds = getRoomPageIds();
      const indexedPage = importedIds[Number(imported.currentPageIndex) || 0];
      const nextPage = imported.currentPageId || imported.template || indexedPage || "cozy";
      if (templates[nextPage]) appState.template = nextPage;
    } else if (imported.upload && imported.upload.dataUrl) {
      const id = imported.template && imported.template.startsWith("upload-") ? imported.template : `upload-${Date.now()}`;
      appState.uploads[id] = imported.upload;
      addPageRecord({ id, title: imported.upload.title || "Uploaded Page", type: "image", dataUrl: imported.upload.dataUrl }, false);
      await saveUploads();
      await loadUploads();
      rebuildTemplateOptions();
      appState.template = id;
    } else {
      appState.fills = imported.fills;
      if (templates[imported.template]) appState.template = imported.template;
    }

    appState.currentPageId = appState.template;
    appState.currentPageIndex = getCurrentPageIndex();
    rememberCurrentPage();
    renderTemplate(appState.template);
    saveDraft(false);
    await saveLocalSession();
    if (await ensureCurrentRoom()) {
      const importedTemplate = templates[appState.template];
      if (importedTemplate && importedTemplate.type === "image") {
        await broadcast({ type: "upload", id: appState.template, page: appState.uploads[appState.template] });
      }
      broadcast({
        type: "hello",
        sessionId: appState.sessionId,
        template: appState.template,
        fills: appState.fills,
        uploads: currentRoomUploads(),
        imageSnapshots: currentImageSnapshots(),
        drawingSnapshots: currentDrawingSnapshots(),
        pages: currentRoomPages(),
        pageOrder: currentRoomPageOrder()
      });
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
    const pageRecord = { id, title, type: "image", dataUrl };
    if (canUseAsSingleStarter(id)) {
      setSingleStarterPage(pageRecord);
    } else {
      addPageRecord(pageRecord, false);
    }
    els.customUploadStatus.textContent = "Saving upload...";
    if (!(await saveUploads())) {
      delete appState.uploads[id];
      delete appState.pages[id];
      appState.pageOrder = appState.pageOrder.filter((pageId) => pageId !== id);
      return;
    }

    await loadUploads();
    rebuildTemplateOptions();
    await choosePage(id);
    els.customUploadStatus.textContent = "Upload saved. Opening coloring page...";
    if (await ensureCurrentRoom()) {
      await broadcast({ type: "page-add", page: appState.pages[id] || pageRecordFromTemplate(id) });
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

async function createBlankDrawingPage() {
  const id = `drawing-${Date.now()}`;
  const count = Object.values(appState.pages).filter((page) => page.type === "drawing").length + 1;
  const page = {
    id,
    title: `Blank Drawing ${count}`,
    type: "drawing",
    createdAt: new Date().toISOString()
  };
  if (canUseAsSingleStarter(id)) {
    setSingleStarterPage(page);
    rebuildTemplateCatalog();
    rebuildTemplateOptions();
  } else {
    addPageRecord(page);
  }
  await choosePage(id);
  if (await ensureCurrentRoom()) await broadcast({ type: "page-add", page });
  setStatus("Blank drawing page added");
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
  if (!template || template.type !== "image" || !appState.uploads[appState.template] || !appState.template.startsWith("upload-")) {
    setStatus("Choose an uploaded page first");
    return;
  }

  const deletedTemplate = appState.template;
  delete appState.uploads[appState.template];
  delete appState.pages[appState.template];
  appState.pageOrder = appState.pageOrder.filter((id) => id !== appState.template);
  delete appState.drawingSnapshots[appState.template];
  await saveUploads();
  await loadUploads();
  appState.template = "cozy";
  appState.currentPageId = appState.template;
  appState.currentPageIndex = getCurrentPageIndex();
  rememberCurrentPage();
  rebuildTemplateOptions();
  appState.uploadImageData = null;
  appState.uploadOriginalData = null;
  renderTemplate(appState.template);
  broadcast({ type: "delete-upload", template: deletedTemplate });
  setStatus("Uploaded page deleted");
}

function downloadPng() {
  const baseCanvas = getBaseCanvas();
  const drawingCanvas = getDrawingCanvas();
  if (baseCanvas) {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = baseCanvas.width;
    exportCanvas.height = baseCanvas.height;
    const ctx = exportCanvas.getContext("2d");
    ctx.drawImage(baseCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    if (drawingCanvas) ctx.drawImage(drawingCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    exportCanvas.toBlob((blob) => {
      downloadBlob(blob, `jillian-coloring-${appState.template}.png`);
      setStatus("PNG downloaded");
    }, "image/png");
    return;
  }

  const svgNode = els.artboard.querySelector("svg");
  if (!svgNode) return;
  const svg = svgNode.cloneNode(true);
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
    if (drawingCanvas) ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);
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
