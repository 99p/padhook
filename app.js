const KEY_ROOTS = {
  C: 60,
  Db: 61,
  D: 62,
  Eb: 63,
  E: 64,
  F: 65,
  Gb: 66,
  G: 67,
  Ab: 68,
  A: 69,
  Bb: 70,
  B: 71
};

const KEY_NAMES = Object.keys(KEY_ROOTS);

const SCALES = {
  major: {
    label: "Major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    roman: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    qualities: ["maj", "min", "min", "maj", "maj", "min", "dim"]
  },
  minor: {
    label: "Natural Minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    roman: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
    qualities: ["min", "dim", "maj", "min", "min", "maj", "maj"]
  }
};

const DEGREE_COLORS = [
  "#f25555",
  "#f0a126",
  "#e6d84a",
  "#48b462",
  "#38a8b3",
  "#6977dd",
  "#db6aa5"
];

const DURATIONS = [
  { value: 0.5, label: "1/2" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" }
];

const CHORD_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8]
};

const FOLLOW_MAP = {
  1: [
    [5, 95, "強いドミナント"],
    [6, 88, "王道ポップ"],
    [4, 84, "安定した展開"],
    [2, 70, "前進感"]
  ],
  2: [
    [5, 93, "ii-Vの流れ"],
    [4, 74, "柔らかい寄り道"],
    [7, 62, "緊張を足す"],
    [1, 58, "早めに解決"]
  ],
  3: [
    [6, 86, "自然な下降"],
    [4, 78, "明るく接続"],
    [2, 67, "循環へ"],
    [5, 60, "強く押す"]
  ],
  4: [
    [5, 91, "サビ前に強い"],
    [1, 88, "素直に帰る"],
    [2, 72, "もう一段進む"],
    [6, 64, "温かい回避"]
  ],
  5: [
    [1, 97, "解決"],
    [6, 86, "偽終止"],
    [4, 72, "浮遊感"],
    [3, 58, "少し意外"]
  ],
  6: [
    [4, 91, "I-V-vi-IV系"],
    [2, 82, "循環の入口"],
    [5, 78, "戻りやすい"],
    [1, 75, "落ち着く"]
  ],
  7: [
    [1, 94, "導音の解決"],
    [3, 70, "暗めに接続"],
    [5, 63, "緊張を維持"],
    [6, 55, "変化球"]
  ]
};

const PROGRESSION_BANK = [
  [1, 5, 6, 4],
  [6, 4, 1, 5],
  [1, 6, 4, 5],
  [2, 5, 1, 6],
  [1, 4, 5, 1],
  [6, 2, 5, 1]
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  keySelect: $("#keySelect"),
  scaleSelect: $("#scaleSelect"),
  tempoInput: $("#tempoInput"),
  meterSelect: $("#meterSelect"),
  playButton: $("#playButton"),
  rewindButton: $("#rewindButton"),
  themeButton: $("#themeButton"),
  themeColorMeta: $("#themeColorMeta"),
  demoButton: $("#demoButton"),
  undoButton: $("#undoButton"),
  redoButton: $("#redoButton"),
  newButton: $("#newButton"),
  addMeasureButton: $("#addMeasureButton"),
  positionStatus: $("#positionStatus"),
  activeChordStatus: $("#activeChordStatus"),
  guideStatus: $("#guideStatus"),
  timelineScroll: $("#timelineScroll"),
  timelineSurface: $("#timelineSurface"),
  ruler: $("#ruler"),
  chordLane: $("#chordLane"),
  melodyLane: $("#melodyLane"),
  cursorLine: $("#cursorLine"),
  playheadLine: $("#playheadLine"),
  chordPalette: $("#chordPalette"),
  notePalette: $("#notePalette"),
  durationRowChords: $("#durationRowChords"),
  durationRowMelody: $("#durationRowMelody"),
  suggestionList: $("#suggestionList"),
  deleteButtonChords: $("#deleteButtonChords"),
  deleteButtonMelody: $("#deleteButtonMelody"),
  extendChordButton: $("#extendChordButton"),
  invertChordButton: $("#invertChordButton"),
  tieChordButton: $("#tieChordButton"),
  restButton: $("#restButton"),
  lowerNoteButton: $("#lowerNoteButton"),
  raiseNoteButton: $("#raiseNoteButton"),
  octaveDownButton: $("#octaveDownButton"),
  octaveUpButton: $("#octaveUpButton"),
  generateButton: $("#generateButton"),
  generateMelodyButton: $("#generateMelodyButton"),
  clearAfterButton: $("#clearAfterButton"),
  saveButton: $("#saveButton"),
  exportJsonButton: $("#exportJsonButton"),
  importJsonButton: $("#importJsonButton"),
  importFileInput: $("#importFileInput"),
  exportMidiButton: $("#exportMidiButton"),
  copySummaryButton: $("#copySummaryButton"),
  toast: $("#toast")
};

let state = createInitialState();
let audioContext = null;
let activeNodes = [];
let playState = null;
let animationFrame = 0;
let toastTimer = 0;
let audioUnlockAttempted = false;
let silentAudioUrl = "";
let silentAudioElement = null;

init();

function createInitialState() {
  return {
    key: "C",
    scale: "major",
    tempo: 108,
    meter: 4,
    measures: 8,
    duration: 1,
    cursorBeat: 0,
    mode: "chords",
    selected: null,
    nextId: 1,
    chords: [],
    notes: [],
    history: [],
    future: []
  };
}

function init() {
  initTheme();
  setupSelectors();
  bindEvents();
  installAudioUnlockHandlers();
  const saved = loadStoredState();
  if (saved) {
    state = saved;
    toast("前回のスケッチを復元しました");
  } else {
    loadDemo(false);
  }
  syncControls();
  render();
}

function setupSelectors() {
  for (const key of KEY_NAMES) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    els.keySelect.append(option);
  }
}

function bindEvents() {
  els.keySelect.addEventListener("change", () => commit(() => {
    state.key = els.keySelect.value;
  }));

  els.scaleSelect.addEventListener("change", () => commit(() => {
    state.scale = els.scaleSelect.value;
  }));

  els.tempoInput.addEventListener("change", () => commit(() => {
    state.tempo = clamp(Number(els.tempoInput.value) || 108, 50, 190);
  }));

  els.meterSelect.addEventListener("change", () => commit(() => {
    const nextMeter = Number(els.meterSelect.value);
    state.meter = nextMeter;
    state.chords = state.chords.filter((item) => item.beat < totalBeats());
    state.notes = state.notes.filter((item) => item.beat < totalBeats());
    state.cursorBeat = clampBeat(state.cursorBeat);
  }));

  els.playButton.addEventListener("click", togglePlayback);
  els.rewindButton.addEventListener("click", () => {
    stopPlayback();
    state.cursorBeat = 0;
    state.selected = null;
    render();
    scrollCursorIntoView();
  });

  els.demoButton.addEventListener("click", () => loadDemo(true));
  els.themeButton.addEventListener("click", toggleTheme);
  els.undoButton.addEventListener("click", undo);
  els.redoButton.addEventListener("click", redo);
  els.newButton.addEventListener("click", () => {
    if (!confirm("現在のスケッチを消して新規作成しますか？")) return;
    commit(() => {
      const fresh = createInitialState();
      fresh.history = state.history;
      state = fresh;
    });
    toast("新規スケッチを作成しました");
  });

  els.addMeasureButton.addEventListener("click", () => commit(() => {
    state.measures += 1;
  }));

  els.chordLane.addEventListener("pointerdown", handleChordLanePointer);
  els.melodyLane.addEventListener("pointerdown", handleMelodyLanePointer);

  els.deleteButtonChords.addEventListener("click", deleteSelected);
  els.deleteButtonMelody.addEventListener("click", deleteSelected);
  els.extendChordButton.addEventListener("click", cycleChordExtension);
  els.invertChordButton.addEventListener("click", invertSelectedChord);
  els.tieChordButton.addEventListener("click", extendSelectedChord);

  els.restButton.addEventListener("click", () => addNote(1, true));
  els.lowerNoteButton.addEventListener("click", () => transposeSelectedNote(-1));
  els.raiseNoteButton.addEventListener("click", () => transposeSelectedNote(1));
  els.octaveDownButton.addEventListener("click", () => octaveSelectedNote(-1));
  els.octaveUpButton.addEventListener("click", () => octaveSelectedNote(1));

  els.generateButton.addEventListener("click", generateProgression);
  els.generateMelodyButton.addEventListener("click", generateMelody);
  els.clearAfterButton.addEventListener("click", clearAfterCursor);

  els.saveButton.addEventListener("click", () => {
    saveStoredState();
    toast("保存しました");
  });
  els.exportJsonButton.addEventListener("click", exportJson);
  els.importJsonButton.addEventListener("click", () => els.importFileInput.click());
  els.importFileInput.addEventListener("change", importJson);
  els.exportMidiButton.addEventListener("click", exportMidi);
  els.copySummaryButton.addEventListener("click", copySummary);

  for (const tab of $$(".mode-tab")) {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  }

  window.addEventListener("keydown", handleKeyboard);
  window.addEventListener("pagehide", saveStoredState);
}

function initTheme() {
  const saved = readThemePreference();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  writeThemePreference(next);
  applyTheme(next);
  toast(next === "dark" ? "ダークモードにしました" : "ライトモードにしました");
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  els.themeButton.textContent = normalized === "dark" ? "ライト" : "ダーク";
  els.themeButton.setAttribute("aria-pressed", String(normalized === "dark"));
  els.themeColorMeta.setAttribute("content", normalized === "dark" ? "#101010" : "#fafafa");
}

function readThemePreference() {
  try {
    return localStorage.getItem("padhook-theme");
  } catch {
    return null;
  }
}

function writeThemePreference(theme) {
  try {
    localStorage.setItem("padhook-theme", theme);
  } catch {
    // Private browsing can reject localStorage writes.
  }
}

function syncControls() {
  els.keySelect.value = state.key;
  els.scaleSelect.value = state.scale;
  els.tempoInput.value = state.tempo;
  els.meterSelect.value = String(state.meter);
}

function commit(mutator) {
  const before = snapshot();
  mutator();
  normalizeState();
  if (snapshot() !== before) {
    state.history.push(before);
    if (state.history.length > 60) state.history.shift();
    state.future = [];
  }
  syncControls();
  render();
  saveStoredState();
}

function updateView(mutator, persist = false) {
  mutator();
  normalizeState();
  syncControls();
  render();
  if (persist) saveStoredState();
}

function snapshot() {
  const { history, future, ...rest } = state;
  return JSON.stringify(rest);
}

function restore(serialized) {
  const parsed = JSON.parse(serialized);
  state = {
    ...createInitialState(),
    ...parsed,
    history: state.history,
    future: state.future
  };
  normalizeState();
  syncControls();
  render();
  saveStoredState();
}

function undo() {
  if (!state.history.length) {
    toast("戻せる操作がありません");
    return;
  }
  const current = snapshot();
  const previous = state.history.pop();
  state.future.push(current);
  restore(previous);
}

function redo() {
  if (!state.future.length) {
    toast("やり直せる操作がありません");
    return;
  }
  const current = snapshot();
  const next = state.future.pop();
  state.history.push(current);
  restore(next);
}

function normalizeState() {
  state.key = KEY_ROOTS[state.key] ? state.key : "C";
  state.scale = SCALES[state.scale] ? state.scale : "major";
  state.tempo = clamp(Number(state.tempo) || 108, 50, 190);
  state.meter = [3, 4, 6].includes(Number(state.meter)) ? Number(state.meter) : 4;
  state.measures = clamp(Math.floor(Number(state.measures) || 8), 1, 64);
  state.duration = DURATIONS.some((item) => item.value === Number(state.duration)) ? Number(state.duration) : 1;
  state.cursorBeat = clampBeat(Number(state.cursorBeat) || 0);
  state.chords = sanitizeItems(state.chords, "chord");
  state.notes = sanitizeItems(state.notes, "note");
  state.nextId = Math.max(Number(state.nextId) || 1, nextAvailableId());
}

function sanitizeItems(items, type) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: Number(item.id) || state.nextId++,
      beat: clamp(Number(item.beat) || 0, 0, totalBeats() - 0.5),
      duration: normalizeItemDuration(Number(item.duration) || 1),
      degree: clamp(Math.floor(Number(item.degree) || 1), 1, 7),
      octave: clamp(Math.floor(Number(item.octave) || 0), -2, 2),
      rest: Boolean(item.rest),
      extension: type === "chord" ? normalizeExtension(item.extension) : undefined,
      inversion: type === "chord" ? clamp(Math.floor(Number(item.inversion) || 0), 0, 3) : undefined
    }))
    .filter((item) => item.beat < totalBeats())
    .sort((a, b) => a.beat - b.beat || a.id - b.id);
}

function normalizeExtension(extension) {
  return ["triad", "7", "9"].includes(extension) ? extension : "triad";
}

function clampDuration(value) {
  if (DURATIONS.some((item) => item.value === value)) return value;
  return 1;
}

function normalizeItemDuration(value) {
  if (!Number.isFinite(value)) return 1;
  return clamp(Math.round(value * 2) / 2, 0.5, 64);
}

function nextAvailableId() {
  const ids = [...state.chords, ...state.notes].map((item) => item.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function render() {
  syncMode();
  renderDurationRows();
  renderPalettes();
  renderTimeline();
  renderSuggestions();
  renderStatus();
  renderButtons();
}

function syncMode() {
  for (const tab of $$(".mode-tab")) {
    tab.classList.toggle("active", tab.dataset.mode === state.mode);
  }
  for (const panel of $$(".panel-page")) {
    panel.classList.toggle("active", panel.dataset.panel === state.mode);
  }
}

function renderDurationRows() {
  for (const row of [els.durationRowChords, els.durationRowMelody]) {
    row.textContent = "";
    for (const duration of DURATIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "duration-button";
      button.classList.toggle("active", state.duration === duration.value);
      button.textContent = `${duration.label}拍`;
      button.addEventListener("click", () => setDuration(duration.value));
      row.append(button);
    }
  }
}

function renderPalettes() {
  const scale = currentScale();
  const activeChord = chordAtBeat(state.cursorBeat);
  const stableDegrees = activeChord ? chordToneDegrees(activeChord) : [];

  els.chordPalette.textContent = "";
  for (let degree = 1; degree <= 7; degree += 1) {
    const button = degreeButton({
      degree,
      label: scale.roman[degree - 1],
      subLabel: chordQualityLabel(scale.qualities[degree - 1]),
      stable: false
    });
    button.addEventListener("click", () => addChord(degree));
    els.chordPalette.append(button);
  }

  els.notePalette.textContent = "";
  for (let degree = 1; degree <= 7; degree += 1) {
    const button = degreeButton({
      degree,
      label: String(degree),
      subLabel: solfegeLabel(degree),
      stable: stableDegrees.includes(degree)
    });
    button.addEventListener("click", () => addNote(degree, false));
    els.notePalette.append(button);
  }
}

function degreeButton({ degree, label, subLabel, stable }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "degree-button";
  button.classList.toggle("stable", stable);
  button.style.background = DEGREE_COLORS[degree - 1];
  button.innerHTML = `<span>${escapeHtml(label)}</span><small>${escapeHtml(subLabel)}</small>`;
  return button;
}

function renderTimeline() {
  const width = totalBeats() * beatWidth();
  els.timelineSurface.style.width = `${width}px`;
  els.timelineSurface.style.setProperty("--meter", state.meter);
  els.timelineSurface.style.setProperty("--measure-w", `${state.meter * beatWidth()}px`);
  renderRuler();
  renderChordLane();
  renderMelodyLane();
  setLinePosition(els.cursorLine, state.cursorBeat);
  if (!playState) {
    els.playheadLine.classList.remove("active");
    setLinePosition(els.playheadLine, state.cursorBeat);
  }
}

function renderRuler() {
  els.ruler.textContent = "";
  for (let measure = 0; measure < state.measures; measure += 1) {
    const label = document.createElement("div");
    label.className = "measure-label";
    label.style.left = `${measure * state.meter * beatWidth() + 4}px`;
    label.textContent = `${measure + 1}`;
    els.ruler.append(label);
  }
}

function renderChordLane() {
  els.chordLane.textContent = "";
  const hit = document.createElement("div");
  hit.className = "lane-hit";
  els.chordLane.append(hit);

  for (const chord of state.chords) {
    const block = document.createElement("button");
    block.type = "button";
    block.className = "block chord-block";
    block.classList.toggle("selected", isSelected("chord", chord.id));
    block.style.left = `${chord.beat * beatWidth() + 3}px`;
    block.style.width = `${Math.max(chord.duration * beatWidth() - 6, 28)}px`;
    block.style.background = chord.rest ? "#d8dadd" : DEGREE_COLORS[chord.degree - 1];
    block.dataset.id = String(chord.id);
    block.innerHTML = `<span class="chord-symbol">${escapeHtml(chordSymbol(chord))}</span><span class="chord-meta">${escapeHtml(chordMeta(chord))}</span>`;
    block.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      selectItem("chord", chord.id, chord.beat);
    });
    els.chordLane.append(block);
  }
}

function renderMelodyLane() {
  els.melodyLane.textContent = "";
  const hit = document.createElement("div");
  hit.className = "lane-hit";
  els.melodyLane.append(hit);

  const activeChord = chordAtBeat(state.cursorBeat);
  const stableDegrees = activeChord ? chordToneDegrees(activeChord) : [];
  for (let degree = 7; degree >= 1; degree -= 1) {
    const top = rowTopForDegree(degree);
    const label = document.createElement("div");
    label.className = "row-label";
    label.style.top = `${top + 2}px`;
    label.textContent = String(degree);
    els.melodyLane.append(label);

    if (stableDegrees.includes(degree)) {
      const guide = document.createElement("div");
      guide.className = "stable-guide";
      guide.style.top = `${top}px`;
      els.melodyLane.append(guide);
    }
  }

  for (const note of state.notes) {
    const block = document.createElement("button");
    block.type = "button";
    block.className = "block note-block";
    block.classList.toggle("rest", note.rest);
    block.classList.toggle("selected", isSelected("note", note.id));
    block.style.left = `${note.beat * beatWidth() + 3}px`;
    block.style.top = `${rowTopForDegree(note.degree) + 4}px`;
    block.style.width = `${Math.max(note.duration * beatWidth() - 6, 28)}px`;
    block.style.background = note.rest ? "" : DEGREE_COLORS[note.degree - 1];
    block.dataset.id = String(note.id);
    block.textContent = note.rest ? "休" : `${note.degree}${note.octaveLabel || octaveMark(note.octave)}`;
    block.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      selectItem("note", note.id, note.beat);
    });
    els.melodyLane.append(block);
  }
}

function renderSuggestions() {
  els.suggestionList.textContent = "";
  const suggestions = nextChordSuggestions();
  for (const item of suggestions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-button";
    button.style.borderColor = DEGREE_COLORS[item.degree - 1];
    button.innerHTML = `<strong>${escapeHtml(item.symbol)}</strong><span>${escapeHtml(item.reason)}</span><em class="score-pill">${item.score}</em>`;
    button.addEventListener("click", () => {
      setMode("chords");
      addChord(item.degree);
    });
    els.suggestionList.append(button);
  }
}

function renderStatus() {
  const measure = Math.floor(state.cursorBeat / state.meter) + 1;
  const beat = (state.cursorBeat % state.meter) + 1;
  els.positionStatus.textContent = `${measure}小節 ${formatBeat(beat)}拍`;

  const chord = chordAtBeat(state.cursorBeat);
  if (chord) {
    els.activeChordStatus.textContent = `現在のコード: ${chordSymbol(chord)} (${chordMeta(chord)})`;
    const degrees = chordToneDegrees(chord).join(", ");
    els.guideStatus.textContent = `安定音: ${degrees}`;
  } else {
    els.activeChordStatus.textContent = "現在のコード: なし";
    els.guideStatus.textContent = "安定音: なし";
  }
}

function renderButtons() {
  els.undoButton.disabled = !state.history.length;
  els.redoButton.disabled = !state.future.length;
  const selectedChord = selectedItem("chord");
  const selectedNote = selectedItem("note");
  els.deleteButtonChords.disabled = !state.selected;
  els.deleteButtonMelody.disabled = !state.selected;
  els.extendChordButton.disabled = !selectedChord;
  els.invertChordButton.disabled = !selectedChord;
  els.tieChordButton.disabled = !selectedChord;
  els.lowerNoteButton.disabled = !selectedNote;
  els.raiseNoteButton.disabled = !selectedNote;
  els.octaveDownButton.disabled = !selectedNote;
  els.octaveUpButton.disabled = !selectedNote;
}

function setDuration(value) {
  commit(() => {
    state.duration = value;
    const selected = selectedItem();
    if (selected) {
      selected.duration = value;
      ensureMeasuresFor(selected.beat + value);
      removeOverlaps(selected);
    }
  });
}

function addChord(degree) {
  commit(() => {
    const beat = state.cursorBeat;
    ensureMeasuresFor(beat + state.duration);
    const chord = {
      id: state.nextId++,
      beat,
      duration: state.duration,
      degree,
      octave: 0,
      rest: false,
      extension: "triad",
      inversion: 0
    };
    state.chords = state.chords.filter((item) => !overlaps(item, chord));
    state.chords.push(chord);
    state.selected = { type: "chord", id: chord.id };
    state.cursorBeat = clampBeat(beat + state.duration);
  });
  scrollCursorIntoView();
}

function addNote(degree, rest) {
  commit(() => {
    const beat = state.cursorBeat;
    ensureMeasuresFor(beat + state.duration);
    const previous = previousNoteBefore(beat);
    const octave = rest ? 0 : smartOctave(degree, previous);
    const note = {
      id: state.nextId++,
      beat,
      duration: state.duration,
      degree,
      octave,
      rest
    };
    state.notes = state.notes.filter((item) => !overlaps(item, note));
    state.notes.push(note);
    state.selected = { type: "note", id: note.id };
    state.cursorBeat = clampBeat(beat + state.duration);
  });
  scrollCursorIntoView();
}

function handleChordLanePointer(event) {
  if (event.target.closest(".block")) return;
  const beat = beatFromEvent(event);
  updateView(() => {
    state.cursorBeat = beat;
    state.selected = null;
    state.mode = "chords";
  });
}

function handleMelodyLanePointer(event) {
  if (event.target.closest(".block")) return;
  const beat = beatFromEvent(event);
  const degree = degreeFromEvent(event);
  updateView(() => {
    state.cursorBeat = beat;
    state.mode = "melody";
    state.selected = null;
  });
  addNote(degree, false);
}

function selectItem(type, id, beat) {
  updateView(() => {
    state.selected = { type, id };
    state.cursorBeat = clampBeat(beat);
    state.mode = type === "chord" ? "chords" : "melody";
  });
}

function deleteSelected() {
  if (!state.selected) {
    toast("削除する音符かコードを選んでください");
    return;
  }
  commit(() => {
    if (state.selected.type === "chord") {
      state.chords = state.chords.filter((item) => item.id !== state.selected.id);
    } else {
      state.notes = state.notes.filter((item) => item.id !== state.selected.id);
    }
    state.selected = null;
  });
}

function cycleChordExtension() {
  const chord = selectedItem("chord");
  if (!chord) return;
  commit(() => {
    chord.extension = chord.extension === "triad" ? "7" : chord.extension === "7" ? "9" : "triad";
  });
}

function invertSelectedChord() {
  const chord = selectedItem("chord");
  if (!chord) return;
  commit(() => {
    const max = chord.extension === "9" ? 4 : chord.extension === "7" ? 3 : 2;
    chord.inversion = (chord.inversion + 1) % (max + 1);
  });
}

function extendSelectedChord() {
  const chord = selectedItem("chord");
  if (!chord) return;
  commit(() => {
    chord.duration = normalizeItemDuration(chord.duration + state.duration);
    ensureMeasuresFor(chord.beat + chord.duration);
    removeOverlaps(chord);
  });
}

function transposeSelectedNote(step) {
  const note = selectedItem("note");
  if (!note || note.rest) return;
  commit(() => {
    let degree = note.degree + step;
    if (degree > 7) {
      degree = 1;
      note.octave = clamp(note.octave + 1, -2, 2);
    } else if (degree < 1) {
      degree = 7;
      note.octave = clamp(note.octave - 1, -2, 2);
    }
    note.degree = degree;
  });
}

function octaveSelectedNote(step) {
  const note = selectedItem("note");
  if (!note || note.rest) return;
  commit(() => {
    note.octave = clamp(note.octave + step, -2, 2);
  });
}

function generateProgression() {
  const bankIndex = Math.abs(Math.floor(state.cursorBeat / state.meter) + state.chords.length) % PROGRESSION_BANK.length;
  const progression = PROGRESSION_BANK[bankIndex];
  commit(() => {
    const start = Math.floor(state.cursorBeat / state.meter) * state.meter;
    ensureMeasuresFor(start + progression.length * state.meter);
    const generated = progression.map((degree, index) => ({
      id: state.nextId++,
      beat: start + index * state.meter,
      duration: state.meter,
      degree,
      octave: 0,
      rest: false,
      extension: "triad",
      inversion: 0
    }));
    state.chords = state.chords.filter((item) => !generated.some((next) => overlaps(item, next)));
    state.chords.push(...generated);
    state.cursorBeat = clampBeat(start + progression.length * state.meter);
    state.selected = { type: "chord", id: generated[generated.length - 1].id };
  });
  toast("4小節のコードを生成しました");
  scrollCursorIntoView();
}

function generateMelody() {
  commit(() => {
    const start = Math.floor(state.cursorBeat / state.meter) * state.meter;
    const end = Math.min(start + 4 * state.meter, totalBeats());
    const generated = [];
    for (let beat = start; beat < end; beat += 1) {
      const chord = chordAtBeat(beat);
      const tones = chord ? chordToneDegrees(chord) : [1, 2, 3, 5, 6];
      const degree = tones[(Math.floor(beat - start) + tones.length) % tones.length];
      const isLong = (beat - start) % state.meter === state.meter - 1;
      generated.push({
        id: state.nextId++,
        beat,
        duration: isLong ? 1 : 0.5,
        degree,
        octave: beat % (state.meter * 2) === 0 ? 1 : 0,
        rest: false
      });
    }
    state.notes = state.notes.filter((item) => item.beat < start || item.beat >= end);
    state.notes.push(...generated);
    if (generated.length) {
      state.selected = { type: "note", id: generated[generated.length - 1].id };
      state.cursorBeat = clampBeat(generated[generated.length - 1].beat + generated[generated.length - 1].duration);
    }
  });
  toast("コードに沿うメロディを補完しました");
  scrollCursorIntoView();
}

function clearAfterCursor() {
  commit(() => {
    state.chords = state.chords.filter((item) => item.beat < state.cursorBeat);
    state.notes = state.notes.filter((item) => item.beat < state.cursorBeat);
    state.selected = null;
  });
  toast("現在位置以降を空にしました");
}

function setMode(mode) {
  updateView(() => {
    state.mode = mode;
  }, true);
}

function loadDemo(withHistory) {
  const fill = () => {
    const base = createInitialState();
    base.key = "C";
    base.scale = "major";
    base.tempo = 104;
    base.meter = 4;
    base.measures = 8;
    base.duration = 1;
    base.nextId = 1;
    const progression = [1, 5, 6, 4, 1, 3, 4, 5];
    base.chords = progression.map((degree, index) => ({
      id: base.nextId++,
      beat: index * 4,
      duration: 4,
      degree,
      octave: 0,
      rest: false,
      extension: index === 5 ? "7" : "triad",
      inversion: 0
    }));
    const melodyDegrees = [3, 3, 5, 6, 5, 3, 2, 1, 6, 6, 5, 3, 4, 3, 2, 1];
    base.notes = melodyDegrees.map((degree, index) => ({
      id: base.nextId++,
      beat: index * 2,
      duration: 1,
      degree,
      octave: index % 4 === 2 ? 1 : 0,
      rest: false
    }));
    base.cursorBeat = 0;
    base.mode = "chords";
    state = {
      ...base,
      history: state.history || [],
      future: []
    };
  };

  if (withHistory) {
    commit(fill);
    toast("例を読み込みました");
  } else {
    fill();
  }
}

function handleKeyboard(event) {
  if (event.target.matches("input, select, textarea")) return;
  if (event.key === " ") {
    event.preventDefault();
    togglePlayback();
    return;
  }
  if (/^[1-7]$/.test(event.key)) {
    event.preventDefault();
    const degree = Number(event.key);
    if (state.mode === "melody") addNote(degree, false);
    else addChord(degree);
    return;
  }
  if (event.key === "0" && state.mode === "melody") {
    event.preventDefault();
    addNote(1, true);
    return;
  }
  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  }
}

async function togglePlayback() {
  if (playState) {
    stopPlayback();
    return;
  }
  try {
    await ensureAudioContext();
  } catch {
    toast("音声を開始できませんでした。Safariの音量設定を確認してください");
    return;
  }
  const startBeat = 0;
  const startTime = audioContext.currentTime + 0.08;
  const secondsPerBeat = 60 / state.tempo;
  playState = {
    startTime,
    startBeat,
    secondsPerBeat,
    endTime: startTime + totalBeats() * secondsPerBeat
  };
  scheduleSong(startTime, secondsPerBeat);
  els.playButton.textContent = "停止";
  els.playheadLine.classList.add("active");
  animatePlayhead();
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  await unlockAudioForIOS();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

function installAudioUnlockHandlers() {
  const options = { capture: true, passive: true };
  const unlock = () => {
    unlockAudioForIOS().then(() => {
      if (!audioUnlockAttempted) return;
      for (const eventName of ["touchstart", "touchend", "pointerdown", "mousedown", "keydown"]) {
        window.removeEventListener(eventName, unlock, options);
      }
    });
  };
  for (const eventName of ["touchstart", "touchend", "pointerdown", "mousedown", "keydown"]) {
    window.addEventListener(eventName, unlock, options);
  }
}

async function unlockAudioForIOS() {
  if (audioUnlockAttempted) return;
  audioUnlockAttempted = true;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const htmlAudioPromise = playSilentHtmlAudio();
  playSilentWebAudioBuffer();

  if (audioContext.state === "suspended") {
    await audioContext.resume().catch(() => null);
  }
  await htmlAudioPromise;
}

async function playSilentHtmlAudio() {
  const audio = getSilentAudioElement();
  try {
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch {
    audioUnlockAttempted = false;
  }
}

function playSilentWebAudioBuffer() {
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = audioContext.createBuffer(1, 1, 22050);
  gain.gain.value = 0.00001;
  source.connect(gain).connect(audioContext.destination);
  source.start(0);
  source.stop(audioContext.currentTime + 0.01);
  activeNodes.push(source);
}

function getSilentAudioElement() {
  if (!silentAudioElement) {
    silentAudioElement = new Audio(getSilentAudioUrl());
    silentAudioElement.preload = "auto";
    silentAudioElement.setAttribute("playsinline", "");
    silentAudioElement.volume = 0.01;
  }
  return silentAudioElement;
}

function getSilentAudioUrl() {
  if (silentAudioUrl) return silentAudioUrl;
  const sampleRate = 8000;
  const sampleCount = 80;
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + sampleCount * bytesPerSample);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * bytesPerSample, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * bytesPerSample, true);
  silentAudioUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  return silentAudioUrl;
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function scheduleSong(startTime, secondsPerBeat) {
  activeNodes = [];
  for (const chord of state.chords) {
    if (chord.rest) continue;
    const when = startTime + chord.beat * secondsPerBeat;
    const duration = chord.duration * secondsPerBeat;
    scheduleChord(chord, when, duration);
    scheduleBass(chord, when, duration);
  }
  for (const note of state.notes) {
    if (note.rest) continue;
    const when = startTime + note.beat * secondsPerBeat;
    const duration = note.duration * secondsPerBeat;
    scheduleTone(midiToFrequency(noteMidi(note)), when, duration, {
      type: "sine",
      gain: 0.08,
      attack: 0.01,
      release: 0.08
    });
  }
  for (let beat = 0; beat < totalBeats(); beat += 1) {
    scheduleClick(startTime + beat * secondsPerBeat, beat % state.meter === 0);
  }
}

function scheduleChord(chord, when, duration) {
  const notes = chordMidi(chord, 0);
  notes.forEach((midi, index) => {
    scheduleTone(midiToFrequency(midi), when + index * 0.015, duration * 0.94, {
      type: "triangle",
      gain: 0.045,
      attack: 0.025,
      release: 0.16
    });
  });
}

function scheduleBass(chord, when, duration) {
  const root = degreeMidi(chord.degree, -2);
  scheduleTone(midiToFrequency(root), when, duration * 0.88, {
    type: "sawtooth",
    gain: 0.035,
    attack: 0.018,
    release: 0.12
  });
}

function scheduleClick(when, accented) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = accented ? 1200 : 760;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(accented ? 0.045 : 0.024, when + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.045);
  activeNodes.push(oscillator);
}

function scheduleTone(frequency, when, duration, options) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = options.type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(options.gain, when + options.attack);
  gain.gain.setValueAtTime(options.gain, Math.max(when + options.attack, when + duration - options.release));
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
  activeNodes.push(oscillator);
}

function stopPlayback() {
  for (const node of activeNodes) {
    try {
      node.stop();
    } catch {
      // Already stopped.
    }
  }
  activeNodes = [];
  playState = null;
  cancelAnimationFrame(animationFrame);
  els.playButton.textContent = "再生";
  els.playheadLine.classList.remove("active");
  setLinePosition(els.playheadLine, state.cursorBeat);
}

function animatePlayhead() {
  if (!playState || !audioContext) return;
  const elapsed = audioContext.currentTime - playState.startTime;
  const beat = clamp(elapsed / playState.secondsPerBeat + playState.startBeat, 0, totalBeats());
  setLinePosition(els.playheadLine, beat);
  if (beat >= totalBeats()) {
    state.cursorBeat = 0;
    stopPlayback();
    render();
    return;
  }
  animationFrame = requestAnimationFrame(animatePlayhead);
}

function currentScale() {
  return SCALES[state.scale];
}

function totalBeats() {
  return state.measures * state.meter;
}

function beatWidth() {
  return Number(getComputedStyle(document.documentElement).getPropertyValue("--beat-w").replace("px", "")) || 56;
}

function rowHeight() {
  return Number(getComputedStyle(document.documentElement).getPropertyValue("--row-h").replace("px", "")) || 34;
}

function rowTopForDegree(degree) {
  return (7 - degree) * rowHeight();
}

function beatFromEvent(event) {
  const rect = els.timelineSurface.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const raw = x / beatWidth();
  return clampBeat(Math.round(raw * 2) / 2);
}

function degreeFromEvent(event) {
  const rect = els.melodyLane.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const index = clamp(Math.floor(y / rowHeight()), 0, 6);
  return 7 - index;
}

function clampBeat(beat) {
  return clamp(Math.round(beat * 2) / 2, 0, Math.max(0, totalBeats() - 0.5));
}

function setLinePosition(line, beat) {
  line.style.left = `${beat * beatWidth()}px`;
}

function ensureMeasuresFor(beatEnd) {
  if (beatEnd <= totalBeats()) return;
  state.measures = Math.ceil(beatEnd / state.meter);
}

function removeOverlaps(source) {
  if (!state.selected) return;
  const list = state.selected.type === "chord" ? state.chords : state.notes;
  const filtered = list.filter((item) => item.id === source.id || !overlaps(item, source));
  if (state.selected.type === "chord") state.chords = filtered;
  else state.notes = filtered;
}

function overlaps(a, b) {
  return a.beat < b.beat + b.duration && b.beat < a.beat + a.duration && a.id !== b.id;
}

function chordAtBeat(beat) {
  return [...state.chords]
    .sort((a, b) => b.beat - a.beat)
    .find((chord) => chord.beat <= beat && beat < chord.beat + chord.duration);
}

function previousChordBefore(beat) {
  return [...state.chords]
    .filter((chord) => chord.beat < beat)
    .sort((a, b) => b.beat - a.beat)[0] || null;
}

function previousNoteBefore(beat) {
  return [...state.notes]
    .filter((note) => !note.rest && note.beat < beat)
    .sort((a, b) => b.beat - a.beat)[0] || null;
}

function nextChordSuggestions() {
  const reference = chordAtBeat(state.cursorBeat) || previousChordBefore(state.cursorBeat);
  const degree = reference ? reference.degree : 1;
  const scale = currentScale();
  return (FOLLOW_MAP[degree] || FOLLOW_MAP[1]).map(([nextDegree, score, reason]) => ({
    degree: nextDegree,
    score,
    reason,
    symbol: scale.roman[nextDegree - 1]
  }));
}

function chordToneDegrees(chord) {
  const offsets = chord.extension === "9" ? [0, 2, 4, 6, 1] : chord.extension === "7" ? [0, 2, 4, 6] : [0, 2, 4];
  return [...new Set(offsets.map((offset) => ((chord.degree - 1 + offset) % 7) + 1))];
}

function smartOctave(degree, previous) {
  if (!previous) return 0;
  const candidates = [-1, 0, 1].map((octave) => ({ octave, midi: degreeMidi(degree, octave) }));
  const previousMidi = noteMidi(previous);
  candidates.sort((a, b) => Math.abs(a.midi - previousMidi) - Math.abs(b.midi - previousMidi));
  return clamp(candidates[0].octave, -2, 2);
}

function degreeMidi(degree, octave = 0) {
  return KEY_ROOTS[state.key] + currentScale().intervals[degree - 1] + octave * 12;
}

function noteMidi(note) {
  return degreeMidi(note.degree, note.octave);
}

function chordMidi(chord, octave = 0) {
  const quality = currentScale().qualities[chord.degree - 1];
  const root = degreeMidi(chord.degree, octave - 1);
  const intervals = [...CHORD_INTERVALS[quality]];
  if (chord.extension === "7" || chord.extension === "9") {
    intervals.push(quality === "maj" ? 11 : 10);
  }
  if (chord.extension === "9") {
    intervals.push(14);
  }
  const notes = intervals.map((interval) => root + interval);
  for (let i = 0; i < chord.inversion; i += 1) {
    const moved = notes.shift();
    notes.push(moved + 12);
  }
  return notes;
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function chordSymbol(chord) {
  if (chord.rest) return "N.C.";
  const base = currentScale().roman[chord.degree - 1];
  return chord.extension === "triad" ? base : `${base}${chord.extension}`;
}

function chordMeta(chord) {
  const quality = chordQualityLabel(currentScale().qualities[chord.degree - 1]);
  const inversion = chord.inversion ? ` / inv${chord.inversion}` : "";
  return `${quality}${inversion} / ${formatDuration(chord.duration)}拍`;
}

function chordQualityLabel(quality) {
  return {
    maj: "Major",
    min: "Minor",
    dim: "Dim",
    aug: "Aug"
  }[quality] || quality;
}

function solfegeLabel(degree) {
  return ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti"][degree - 1];
}

function octaveMark(octave) {
  if (octave > 0) return "+".repeat(octave);
  if (octave < 0) return "-".repeat(Math.abs(octave));
  return "";
}

function formatBeat(beat) {
  return Number.isInteger(beat) ? String(beat) : beat.toFixed(1);
}

function formatDuration(duration) {
  return Number.isInteger(duration) ? String(duration) : duration.toFixed(1);
}

function isSelected(type, id) {
  return state.selected?.type === type && state.selected?.id === id;
}

function selectedItem(type = state.selected?.type) {
  if (!state.selected || !type || state.selected.type !== type) return null;
  const list = type === "chord" ? state.chords : state.notes;
  return list.find((item) => item.id === state.selected.id) || null;
}

function scrollCursorIntoView() {
  requestAnimationFrame(() => {
    const left = state.cursorBeat * beatWidth();
    const visibleLeft = els.timelineScroll.scrollLeft;
    const visibleRight = visibleLeft + els.timelineScroll.clientWidth;
    if (left < visibleLeft + 32) {
      els.timelineScroll.scrollTo({ left: Math.max(0, left - 32), behavior: "smooth" });
    } else if (left > visibleRight - 80) {
      els.timelineScroll.scrollTo({ left: left - els.timelineScroll.clientWidth + 80, behavior: "smooth" });
    }
  });
}

function exportJson() {
  const data = JSON.stringify(JSON.parse(snapshot()), null, 2);
  downloadBlob(new Blob([data], { type: "application/json" }), "padhook-song.json");
  toast("JSONを書き出しました");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      commit(() => {
        state = {
          ...createInitialState(),
          ...parsed,
          history: state.history,
          future: []
        };
      });
      toast("JSONを読み込みました");
    } catch {
      toast("JSONを読み込めませんでした");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function exportMidi() {
  const bytes = buildMidiFile();
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "audio/midi" }), "padhook-song.mid");
  toast("MIDIを書き出しました");
}

async function copySummary() {
  const summary = buildChordSummary();
  try {
    await navigator.clipboard.writeText(summary);
    toast("コード進行をコピーしました");
  } catch {
    toast(summary);
  }
}

function buildChordSummary() {
  const byMeasure = [];
  for (let measure = 0; measure < state.measures; measure += 1) {
    const start = measure * state.meter;
    const chords = state.chords
      .filter((chord) => chord.beat >= start && chord.beat < start + state.meter)
      .sort((a, b) => a.beat - b.beat)
      .map(chordSymbol);
    byMeasure.push(`${measure + 1}: ${chords.length ? chords.join(" ") : "-"}`);
  }
  return `Key ${state.key} ${SCALES[state.scale].label}, ${state.tempo} BPM\n${byMeasure.join("\n")}`;
}

function buildMidiFile() {
  const ticksPerBeat = 480;
  const header = ascii("MThd").concat(u32(6), u16(1), u16(3), u16(ticksPerBeat));
  const tempoTrack = makeTrack([
    { tick: 0, bytes: metaTempo(state.tempo) },
    { tick: 0, bytes: [0xff, 0x58, 0x04, state.meter, state.meter === 6 ? 3 : 2, 24, 8] }
  ]);
  const melodyEvents = [{ tick: 0, bytes: [0xc0, 0] }];
  for (const note of state.notes) {
    if (note.rest) continue;
    const start = Math.round(note.beat * ticksPerBeat);
    const end = Math.round((note.beat + note.duration) * ticksPerBeat);
    const midi = noteMidi(note);
    melodyEvents.push({ tick: start, bytes: [0x90, midi, 86] });
    melodyEvents.push({ tick: end, bytes: [0x80, midi, 0] });
  }
  const harmonyEvents = [{ tick: 0, bytes: [0xc1, 4] }];
  for (const chord of state.chords) {
    if (chord.rest) continue;
    const start = Math.round(chord.beat * ticksPerBeat);
    const end = Math.round((chord.beat + chord.duration) * ticksPerBeat);
    for (const midi of chordMidi(chord, 0)) {
      harmonyEvents.push({ tick: start, bytes: [0x91, midi, 68] });
      harmonyEvents.push({ tick: end, bytes: [0x81, midi, 0] });
    }
    const bass = degreeMidi(chord.degree, -2);
    harmonyEvents.push({ tick: start, bytes: [0x91, bass, 76] });
    harmonyEvents.push({ tick: end, bytes: [0x81, bass, 0] });
  }
  return header.concat(tempoTrack, makeTrack(melodyEvents), makeTrack(harmonyEvents));
}

function makeTrack(events) {
  const sorted = events
    .slice()
    .sort((a, b) => a.tick - b.tick || eventSortWeight(a.bytes) - eventSortWeight(b.bytes));
  let lastTick = 0;
  const data = [];
  for (const event of sorted) {
    data.push(...vlq(event.tick - lastTick), ...event.bytes);
    lastTick = event.tick;
  }
  data.push(...vlq(0), 0xff, 0x2f, 0x00);
  return ascii("MTrk").concat(u32(data.length), data);
}

function eventSortWeight(bytes) {
  return (bytes[0] & 0xf0) === 0x80 ? 0 : 1;
}

function metaTempo(bpm) {
  const mpqn = Math.round(60000000 / bpm);
  return [0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff];
}

function ascii(text) {
  return [...text].map((char) => char.charCodeAt(0));
}

function u16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function u32(value) {
  return [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function vlq(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadStoredState() {
  try {
    const raw = localStorage.getItem("padhook-state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      history: [],
      future: []
    };
  } catch {
    return null;
  }
}

function saveStoredState() {
  try {
    localStorage.setItem("padhook-state", snapshot());
  } catch {
    // Private browsing can reject localStorage writes.
  }
}

function toast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
