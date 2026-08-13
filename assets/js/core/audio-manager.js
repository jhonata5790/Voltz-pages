(function initializeVoltzAudio(global) {
  "use strict";

  const STORAGE_KEY = "voltz.audio.settings.v1";
  const DEFAULTS = Object.freeze({ master: 0.86, music: 0.58, sfx: 0.82, muted: false });
  const sampleRegistry = new Map();
  const sampleBuffers = new Map();
  const musicRegistry = new Map();
  const musicBuffers = new Map();

  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let currentMusic = null;
  let pendingMusicRequest = null;
  let uiReady = false;

  const settings = loadSettings();

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return { ...DEFAULTS, ...(raw || {}) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
    updateUi();
  }

  function ensureContext() {
    if (ctx) return ctx;
    const AudioContextCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextCtor) return null;
    ctx = new AudioContextCtor();
    masterGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    applyVolumes(true);
    return ctx;
  }

  async function resumeContext() {
    const context = ensureContext();
    if (!context) return false;
    if (context.state === "suspended") {
      try { await context.resume(); } catch { return false; }
    }
    return context.state === "running";
  }

  async function unlock() {
    const ok = await resumeContext();
    if (!ok) return false;

    if (pendingMusicRequest && !currentMusic) {
      const request = pendingMusicRequest;
      pendingMusicRequest = null;
      global.setTimeout(() => playMusic(request.name, request.options), 0);
    } else if (!currentMusic && typeof global.getActiveSceneId === "function") {
      // Fallback de boot: caso a cena tenha sido carregada antes do pedido de música,
      // o primeiro gesto do jogador restaura a trilha correta automaticamente.
      global.setTimeout(() => playSceneMusic(global.getActiveSceneId()), 0);
    }
    return true;
  }

  function applyVolumes(immediate = false) {
    if (!ctx || !masterGain || !musicGain || !sfxGain) return;
    const now = ctx.currentTime;
    const master = settings.muted ? 0 : clamp(settings.master);
    const method = immediate ? "setValueAtTime" : "setTargetAtTime";
    if (immediate) {
      masterGain.gain.setValueAtTime(master, now);
      musicGain.gain.setValueAtTime(clamp(settings.music), now);
      sfxGain.gain.setValueAtTime(clamp(settings.sfx), now);
    } else {
      masterGain.gain.setTargetAtTime(master, now, .025);
      musicGain.gain.setTargetAtTime(clamp(settings.music), now, .035);
      sfxGain.gain.setTargetAtTime(clamp(settings.sfx), now, .025);
    }
  }

  function setMasterVolume(value) { settings.master = clamp(value); saveSettings(); applyVolumes(); }
  function setMusicVolume(value) { settings.music = clamp(value); saveSettings(); applyVolumes(); }
  function setSfxVolume(value) { settings.sfx = clamp(value); saveSettings(); applyVolumes(); }
  function setMuted(value) { settings.muted = Boolean(value); saveSettings(); applyVolumes(); }
  function toggleMute() { setMuted(!settings.muted); }
  function getSettings() { return { ...settings }; }

  function midiToHz(note) { return 440 * Math.pow(2, (note - 69) / 12); }

  function tone({ freq = 440, endFreq = null, duration = .08, type = "square", gain = .08, when = 0, destination = "sfx", attack = .005, release = .055 }) {
    const context = ensureContext();
    if (!context) return;
    const start = Math.max(context.currentTime, context.currentTime + when);
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0001, gain), start + attack);
    amp.gain.exponentialRampToValueAtTime(.0001, start + Math.max(attack + .01, duration - release));
    amp.gain.setValueAtTime(.0001, start + duration);
    osc.connect(amp);
    amp.connect(destination === "music" ? musicGain : sfxGain);
    osc.start(start);
    osc.stop(start + duration + .02);
  }

  function noise({ duration = .08, gain = .05, when = 0, highpass = 500, lowpass = 9000, destination = "sfx" }) {
    const context = ensureContext();
    if (!context) return;
    const start = context.currentTime + when;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    let node = source;
    if (highpass) {
      const hp = context.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = highpass; node.connect(hp); node = hp;
    }
    if (lowpass) {
      const lp = context.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = lowpass; node.connect(lp); node = lp;
    }
    const amp = context.createGain();
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
    node.connect(amp);
    amp.connect(destination === "music" ? musicGain : sfxGain);
    source.start(start);
  }

  function synthSfx(name) {
    switch (name) {
      case "menuMove": tone({freq:520,endFreq:610,duration:.045,type:"square",gain:.035}); break;
      case "menuConfirm": tone({freq:540,duration:.055,gain:.045}); tone({freq:760,duration:.07,gain:.04,when:.045}); break;
      case "menuBack": tone({freq:420,endFreq:280,duration:.09,type:"triangle",gain:.045}); break;
      case "throwStraight": noise({duration:.11,gain:.045,highpass:700}); tone({freq:185,endFreq:420,duration:.12,type:"sawtooth",gain:.035}); break;
      case "throwCurve": tone({freq:270,endFreq:620,duration:.22,type:"triangle",gain:.055}); tone({freq:610,endFreq:350,duration:.18,type:"sine",gain:.025,when:.08}); break;
      case "throwPower": noise({duration:.16,gain:.085,highpass:180,lowpass:4500}); tone({freq:105,endFreq:58,duration:.22,type:"sawtooth",gain:.10}); break;
      case "enemyThrow": noise({duration:.095,gain:.042,highpass:850}); tone({freq:230,endFreq:410,duration:.10,type:"triangle",gain:.03}); break;
      case "enemyPower": noise({duration:.16,gain:.08,highpass:160}); tone({freq:92,endFreq:48,duration:.20,type:"sawtooth",gain:.09}); break;
      case "feint": tone({freq:660,duration:.04,gain:.035}); tone({freq:430,duration:.05,gain:.035,when:.07}); break;
      case "ricochet": tone({freq:970,endFreq:760,duration:.08,type:"square",gain:.055}); noise({duration:.04,gain:.025,highpass:1800}); break;
      case "impact": noise({duration:.10,gain:.07,highpass:120}); tone({freq:110,endFreq:72,duration:.14,type:"sine",gain:.075}); break;
      case "impactPower": noise({duration:.18,gain:.12,highpass:80,lowpass:5000}); tone({freq:82,endFreq:42,duration:.25,type:"sawtooth",gain:.13}); tone({freq:160,endFreq:78,duration:.18,type:"square",gain:.045}); break;
      case "playerHit": noise({duration:.12,gain:.085,highpass:130}); tone({freq:150,endFreq:70,duration:.18,type:"sawtooth",gain:.08}); break;
      case "shield": tone({freq:430,endFreq:820,duration:.12,type:"sine",gain:.055}); tone({freq:900,duration:.07,gain:.03,when:.04}); break;
      case "catch": tone({freq:392,duration:.09,type:"triangle",gain:.055}); tone({freq:523,duration:.11,type:"triangle",gain:.06,when:.055}); tone({freq:659,duration:.13,type:"triangle",gain:.055,when:.11}); break;
      case "perfectCatch": [523,659,784,1047].forEach((n,i)=>tone({freq:n,duration:.12,type:"square",gain:.05,when:i*.045})); noise({duration:.16,gain:.035,highpass:3000}); break;
      case "counterReady": tone({freq:740,endFreq:980,duration:.12,type:"sine",gain:.045}); tone({freq:1175,duration:.10,type:"triangle",gain:.035,when:.08}); break;
      case "victory": [523,659,784,1047].forEach((n,i)=>tone({freq:n,duration:.16,type:"square",gain:.055,when:i*.09})); break;
      case "failure": [330,294,247,196].forEach((n,i)=>tone({freq:n,duration:.18,type:"triangle",gain:.05,when:i*.11})); break;
      case "whistle": tone({freq:1650,endFreq:2050,duration:.16,type:"sine",gain:.045}); tone({freq:1850,duration:.12,type:"sine",gain:.025,when:.035}); break;
      default: tone({freq:480,duration:.05,gain:.025});
    }
  }

  async function loadAudioBuffer(url, cache) {
    const context = ensureContext();
    if (!context || !url) return null;
    if (cache.has(url)) return cache.get(url);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(data.slice(0));
      cache.set(url, buffer);
      return buffer;
    } catch { return null; }
  }

  function playBuffer(buffer, gainValue = 1, destination = "sfx", loop = false) {
    const context = ensureContext();
    if (!context || !buffer) return null;
    const source = context.createBufferSource();
    const amp = context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    amp.gain.value = gainValue;
    source.connect(amp);
    amp.connect(destination === "music" ? musicGain : sfxGain);
    source.start();
    return source;
  }

  function registerSfx(name, url) { if (name && url) sampleRegistry.set(name, url); }
  function registerMusic(name, url) { if (name && url) musicRegistry.set(name, url); }
  function preloadSfx(name) { const url = sampleRegistry.get(name); return url ? loadAudioBuffer(url, sampleBuffers) : Promise.resolve(null); }

  function playSfx(name, options = {}) {
    unlock();
    const url = sampleRegistry.get(name);
    if (url) {
      const cached = sampleBuffers.get(url);
      if (cached) { playBuffer(cached, clamp(options.gain ?? 1, 0, 2), "sfx"); return; }
      preloadSfx(name);
    }
    synthSfx(name);
  }

  function createMusicNote(note, when, length, gain = .026, type = "square") {
    tone({freq:midiToHz(note),duration:length,type,gain,when:when - ctx.currentTime,destination:"music",attack:.006,release:.06});
  }

  function scheduleKick(when, gain = .055) {
    const startOffset = when - ctx.currentTime;
    tone({freq:115,endFreq:48,duration:.13,type:"sine",gain,when:startOffset,destination:"music",attack:.002,release:.075});
  }

  function scheduleHat(when, gain = .018) {
    noise({duration:.035,gain,when:when-ctx.currentTime,highpass:4500,lowpass:11000,destination:"music"});
  }

  function startProceduralDodgeball(intensity = .55) {
    stopCurrentMusicSource();
    const context = ensureContext();
    if (!context) return;
    const bpm = 148;
    const stepDuration = 60 / bpm / 4;
    const melody = [69,null,72,74,76,null,74,72, 69,null,72,76,79,76,74,72];
    const bass = [45,null,null,null,45,null,48,null, 41,null,null,null,43,null,44,null];
    const state = {
      name:"dodgeball", type:"procedural", intensity:clamp(intensity), step:0,
      nextTime:context.currentTime+.05, timer:null, stopped:false
    };
    currentMusic = state;

    const scheduler = () => {
      if (state.stopped || currentMusic !== state || !ctx) return;
      const horizon = ctx.currentTime + .16;
      while (state.nextTime < horizon) {
        const idx = state.step % 16;
        if (idx % 4 === 0) scheduleKick(state.nextTime, .035 + state.intensity*.025);
        if (idx % 2 === 0 || state.intensity > .7) scheduleHat(state.nextTime, .009 + state.intensity*.014);
        const b = bass[idx];
        if (b != null) createMusicNote(b, state.nextTime, stepDuration*3.5, .018 + state.intensity*.013, "triangle");
        const m = melody[idx];
        if (m != null) createMusicNote(m, state.nextTime, stepDuration*1.65, .010 + state.intensity*.018, state.intensity > .72 ? "sawtooth" : "square");
        if (state.intensity > .82 && idx % 4 === 2 && m != null) createMusicNote(m+12, state.nextTime, stepDuration*.8, .009, "square");
        state.step++;
        state.nextTime += stepDuration;
      }
    };
    scheduler();
    state.timer = global.setInterval(scheduler, 35);
  }

  function stopCurrentMusicSource() {
    if (!currentMusic) return;
    currentMusic.stopped = true;
    if (currentMusic.timer) global.clearInterval(currentMusic.timer);
    try { currentMusic.source?.stop?.(); } catch {}
    currentMusic = null;
  }

  async function playMusic(name, options = {}) {
    const intensity = clamp(options.intensity ?? .55);
    pendingMusicRequest = { name, options: { ...options, intensity } };
    const ok = await resumeContext();
    if (!ok) return;
    pendingMusicRequest = null;

    if (currentMusic?.name === name) { setMusicIntensity(intensity); return; }
    stopCurrentMusicSource();

    const url = musicRegistry.get(name);
    if (url) {
      const buffer = await loadAudioBuffer(url, musicBuffers);
      if (buffer && ctx) {
        const source = playBuffer(buffer, 1, "music", true);
        currentMusic = { name, type:"buffer", source, intensity, stopped:false };
        return;
      }
    }
    if (name === "dodgeball") startProceduralDodgeball(intensity);
  }

  function resolveSceneMusic(sceneId) {
    const id = String(sceneId || "");
    if (!id || id === "vila-central" || id.startsWith("interior-")) return "village";
    if (id === "reino-matematica") return "math";
    if (id === "reino-gramatica") return "portuguese";
    if (id === "reino-educacao-fisica") return "physical";
    return "village";
  }

  function playSceneMusic(sceneId, options = {}) {
    const name = resolveSceneMusic(sceneId);
    return playMusic(name, { intensity: options.intensity ?? .50 });
  }

  function restoreSceneMusic(options = {}) {
    const sceneId = typeof global.getActiveSceneId === "function" ? global.getActiveSceneId() : "vila-central";
    return playSceneMusic(sceneId, options);
  }

  function stopMusic(fadeMs = 300) {
    if (!currentMusic || !ctx || !musicGain) { stopCurrentMusicSource(); return; }
    const state = currentMusic;
    const now = ctx.currentTime;
    const target = musicGain.gain.value;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(.0001, musicGain.gain.value), now);
    musicGain.gain.exponentialRampToValueAtTime(.0001, now + Math.max(.04, fadeMs/1000));
    global.setTimeout(() => {
      if (currentMusic === state) stopCurrentMusicSource();
      if (ctx && musicGain) {
        musicGain.gain.cancelScheduledValues(ctx.currentTime);
        musicGain.gain.setValueAtTime(clamp(settings.music), ctx.currentTime);
      }
    }, fadeMs + 30);
  }

  function setMusicIntensity(value) {
    if (!currentMusic) return;
    currentMusic.intensity = clamp(value);
  }

  function duckMusic(amount = .22, ms = 160) {
    if (!ctx || !musicGain || !currentMusic) return;
    const now = ctx.currentTime;
    const normal = clamp(settings.music);
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setTargetAtTime(Math.max(.015, normal * clamp(amount, .05, 1)), now, .012);
    musicGain.gain.setTargetAtTime(normal, now + ms/1000, .045);
  }

  function createUi() {
    if (uiReady) return;
    uiReady = true;
    const controls = document.querySelector(".hud-controls");
    if (!controls) return;
    const button = document.createElement("button");
    button.id = "audioSettingsButton";
    button.className = "hud-pill hud-action-button audio-settings-button";
    button.type = "button";
    button.textContent = settings.muted ? "🔇 Áudio" : "🔊 Áudio";
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("div");
    panel.id = "audioSettingsPanel";
    panel.className = "audio-settings-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="audio-settings-head"><strong>🔊 Áudio Voltz</strong><button type="button" data-audio-close>✕</button></div>
      <label>Geral <span data-audio-value="master"></span><input data-audio-range="master" type="range" min="0" max="100" step="1"></label>
      <label>Música <span data-audio-value="music"></span><input data-audio-range="music" type="range" min="0" max="100" step="1"></label>
      <label>Efeitos <span data-audio-value="sfx"></span><input data-audio-range="sfx" type="range" min="0" max="100" step="1"></label>
      <button class="audio-mute-btn" type="button" data-audio-mute></button>`;
    document.body.appendChild(panel);
    controls.appendChild(button);

    const setOpen = (open) => {
      panel.classList.toggle("visible", open);
      panel.setAttribute("aria-hidden", String(!open));
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () => { unlock(); playSfx("menuConfirm"); setOpen(!panel.classList.contains("visible")); });
    panel.querySelector("[data-audio-close]")?.addEventListener("click", () => { playSfx("menuBack"); setOpen(false); });
    panel.querySelector("[data-audio-mute]")?.addEventListener("click", () => { toggleMute(); if (!settings.muted) playSfx("menuConfirm"); });
    panel.querySelectorAll("[data-audio-range]").forEach((input) => input.addEventListener("input", () => {
      const value = Number(input.value) / 100;
      const key = input.dataset.audioRange;
      if (key === "master") setMasterVolume(value);
      if (key === "music") setMusicVolume(value);
      if (key === "sfx") setSfxVolume(value);
    }));
    updateUi();
  }

  function updateUi() {
    const button = document.getElementById("audioSettingsButton");
    if (button) button.textContent = settings.muted ? "🔇 Áudio" : "🔊 Áudio";
    for (const key of ["master","music","sfx"]) {
      const input = document.querySelector(`[data-audio-range="${key}"]`);
      const value = document.querySelector(`[data-audio-value="${key}"]`);
      if (input) input.value = String(Math.round(clamp(settings[key])*100));
      if (value) value.textContent = `${Math.round(clamp(settings[key])*100)}%`;
    }
    const mute = document.querySelector("[data-audio-mute]");
    if (mute) mute.textContent = settings.muted ? "🔇 Ativar áudio" : "🔊 Silenciar tudo";
  }

  const BUILTIN_MUSIC = Object.freeze({
    village: "assets/audio/music/voltz-vila.ogg",
    math: "assets/audio/music/voltz-matematica.ogg",
    portuguese: "assets/audio/music/voltz-portugues.ogg",
    physical: "assets/audio/music/voltz-educacao-fisica.ogg",
    battle: "assets/audio/music/voltz-batalha.ogg",
    dodgeball: "assets/audio/music/voltz-capitao-rubro.ogg"
  });

  const BUILTIN_SFX = Object.freeze({
    menuMove: "assets/audio/sfx/menu-move.ogg",
    menuConfirm: "assets/audio/sfx/menu-confirm.ogg",
    menuBack: "assets/audio/sfx/menu-back.ogg",
    interact: "assets/audio/sfx/interact.ogg",
    item: "assets/audio/sfx/item.ogg",
    coin: "assets/audio/sfx/coin.ogg",
    xp: "assets/audio/sfx/xp.ogg",
    unlock: "assets/audio/sfx/unlock.ogg",
    error: "assets/audio/sfx/error.ogg",
    damage: "assets/audio/sfx/damage.ogg",
    heal: "assets/audio/sfx/heal.ogg",
    diploma: "assets/audio/sfx/diploma.ogg",
    victory: "assets/audio/sfx/victory.ogg",
    failure: "assets/audio/sfx/failure.ogg",
    portal: "assets/audio/sfx/portal.ogg",
    throwStraight: "assets/audio/sfx/throw-straight.ogg",
    throwCurve: "assets/audio/sfx/throw-curve.ogg",
    throwPower: "assets/audio/sfx/throw-power.ogg",
    enemyThrow: "assets/audio/sfx/enemy-throw.ogg",
    enemyPower: "assets/audio/sfx/enemy-power.ogg",
    feint: "assets/audio/sfx/feint.ogg",
    ricochet: "assets/audio/sfx/ricochet.ogg",
    impact: "assets/audio/sfx/impact.ogg",
    impactPower: "assets/audio/sfx/impact-power.ogg",
    playerHit: "assets/audio/sfx/player-hit.ogg",
    shield: "assets/audio/sfx/shield.ogg",
    catch: "assets/audio/sfx/catch.ogg",
    perfectCatch: "assets/audio/sfx/perfect-catch.ogg",
    counterReady: "assets/audio/sfx/counter-ready.ogg",
    whistle: "assets/audio/sfx/whistle.ogg"
  });

  Object.entries(BUILTIN_MUSIC).forEach(([name, url]) => registerMusic(name, url));
  Object.entries(BUILTIN_SFX).forEach(([name, url]) => registerSfx(name, url));

  document.addEventListener("pointerdown", unlock, { once:true, passive:true });
  document.addEventListener("keydown", unlock, { once:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createUi, { once:true });
  else createUi();

  global.VoltzAudio = Object.freeze({
    unlock, playSfx, playMusic, playSceneMusic, restoreSceneMusic, stopMusic, setMusicIntensity, duckMusic,
    setMasterVolume, setMusicVolume, setSfxVolume, setMuted, toggleMute, getSettings,
    registerSfx, registerMusic, preloadSfx
  });
})(window);
