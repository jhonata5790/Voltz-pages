(function initializeVoltzMobileControls(global) {
  const STORAGE_KEY = "voltz-mobile-controls";
  const params = new URLSearchParams(global.location.search);
  const coarse = global.matchMedia?.("(pointer: coarse)")?.matches;
  const narrow = global.matchMedia?.("(max-width: 900px)")?.matches;
  const forced = params.get("mobile") === "1";
  const disabledByUrl = params.get("mobile") === "0";
  let enabled = disabledByUrl ? false : forced || coarse || narrow || localStorage.getItem(STORAGE_KEY) === "on";
  const held = new Map();

  const KEY_META = {
    up: { key:"ArrowUp", code:"ArrowUp" },
    down: { key:"ArrowDown", code:"ArrowDown" },
    left: { key:"ArrowLeft", code:"ArrowLeft" },
    right: { key:"ArrowRight", code:"ArrowRight" },
    e: { key:"e", code:"KeyE" },
    j: { key:"j", code:"KeyJ" },
    k: { key:"k", code:"KeyK" },
    l: { key:"l", code:"KeyL" },
    i: { key:"i", code:"KeyI" },
    a: { key:"a", code:"KeyA" },
    d: { key:"d", code:"KeyD" },
    space: { key:" ", code:"Space" },
    shift: { key:"Shift", code:"ShiftLeft" },
    escape: { key:"Escape", code:"Escape" }
  };

  function keyboardEvent(type, token) {
    const meta = KEY_META[token];
    if (!meta) return;
    const event = new KeyboardEvent(type, {
      key: meta.key,
      code: meta.code,
      bubbles: true,
      cancelable: true,
      repeat: false
    });
    document.dispatchEvent(event);
  }

  function press(token) {
    keyboardEvent("keydown", token);
    requestAnimationFrame(() => keyboardEvent("keyup", token));
  }

  function hold(token, pointerId) {
    if (held.has(pointerId)) return;
    held.set(pointerId, token);
    keyboardEvent("keydown", token);
  }

  function release(pointerId) {
    const token = held.get(pointerId);
    if (!token) return;
    held.delete(pointerId);
    keyboardEvent("keyup", token);
  }

  function releaseAll() {
    [...held.entries()].forEach(([pointerId]) => release(pointerId));
  }

  function sportsContext() {
    const body = document.body;
    if (body.classList.contains("standalone-volleyball-page")) return "volleyball";
    if (body.classList.contains("standalone-football-page")) return "football";
    if (body.classList.contains("standalone-dodgeball-page")) return "dodgeball";
    const panel = document.getElementById("sportsMinigamePanel");
    if (!panel?.classList.contains("visible")) return "world";
    const text = (document.getElementById("sportsMinigameContent")?.textContent || "").toLowerCase();
    if (text.includes("vôlei") || text.includes("volei")) return "volleyball";
    if (text.includes("futebol")) return "football";
    if (text.includes("queimada") || text.includes("rubro")) return "dodgeball";
    if (text.includes("atletismo") || text.includes("largada")) return "athletics";
    if (text.includes("basquete") || text.includes("arremesso")) return "basketball";
    return "sports";
  }

  function actionMarkup(context) {
    if (context === "football") {
      return `
        <button class="mobile-action primary" data-key="j"><b>J</b><span>CHUTE / BOTE</span></button>
        <button class="mobile-action" data-key="k"><b>K</b><span>PASSE</span></button>
        <button class="mobile-action" data-key="l"><b>L</b><span>CRUZAR</span></button>
        <button class="mobile-action" data-key="i"><b>I</b><span>VISÃO</span></button>`;
    }
    if (context === "volleyball") {
      return `
        <button class="mobile-action primary" data-key="j"><b>J</b><span>TOCAR / SACAR</span></button>
        <button class="mobile-action" data-key="escape"><b>×</b><span>FECHAR</span></button>`;
    }
    if (context === "dodgeball") {
      return `
        <button class="mobile-action primary" data-key="space"><b>●</b><span>AÇÃO / AGARRAR</span></button>
        <button class="mobile-action" data-key="escape"><b>×</b><span>VOLTAR</span></button>`;
    }
    if (context === "athletics") {
      return `
        <button class="mobile-action primary" data-key="space"><b>●</b><span>LARGADA</span></button>
        <button class="mobile-action" data-key="a"><b>A</b><span>PASSO</span></button>
        <button class="mobile-action" data-key="d"><b>D</b><span>PASSO</span></button>`;
    }
    if (context === "basketball") {
      return `
        <button class="mobile-action primary" data-key="space"><b>●</b><span>ARREMESSAR</span></button>
        <button class="mobile-action" data-key="escape"><b>×</b><span>VOLTAR</span></button>`;
    }
    if (context === "sports") {
      return `
        <button class="mobile-action primary" data-key="space"><b>●</b><span>AÇÃO</span></button>
        <button class="mobile-action" data-key="escape"><b>×</b><span>VOLTAR</span></button>`;
    }
    return `
      <button class="mobile-action primary" data-key="e"><b>E</b><span>INTERAGIR</span></button>
      <button class="mobile-action hold" data-key="shift"><b>⇧</b><span>CORRER</span></button>
      <button class="mobile-action" data-key="i"><b>I</b><span>MOCHILA</span></button>
      <button class="mobile-action" data-key="escape"><b>×</b><span>VOLTAR</span></button>`;
  }

  const root = document.createElement("div");
  root.id = "voltzMobileControls";
  root.className = "voltz-mobile-controls";
  root.innerHTML = `
    <div class="mobile-top-actions">
      <button class="mobile-mini dev" data-mobile-command="dev" type="button">DEV</button>
      <button class="mobile-mini" data-mobile-command="collapse" type="button" aria-label="Ocultar controles">⌄</button>
    </div>
    <div class="mobile-dpad" aria-label="Movimento">
      <button class="mobile-dir up hold" data-key="up" type="button">▲</button>
      <button class="mobile-dir left hold" data-key="left" type="button">◀</button>
      <div class="mobile-dpad-core">⚡</div>
      <button class="mobile-dir right hold" data-key="right" type="button">▶</button>
      <button class="mobile-dir down hold" data-key="down" type="button">▼</button>
    </div>
    <div class="mobile-actions" id="voltzMobileActions"></div>
    <button class="mobile-expand" data-mobile-command="collapse" type="button">🎮</button>
  `;
  document.body.appendChild(root);

  const actions = root.querySelector("#voltzMobileActions");
  let lastContext = "";
  let collapsed = false;

  function refresh() {
    const context = sportsContext();
    if (context !== lastContext) {
      lastContext = context;
      actions.innerHTML = actionMarkup(context);
    }
    root.dataset.context = context;
    root.classList.toggle("enabled", enabled);
    root.classList.toggle("collapsed", collapsed);
    document.body.classList.toggle("voltz-mobile-enabled", enabled);
  }

  function setEnabled(value, persist = true) {
    enabled = Boolean(value);
    if (persist) localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    if (!enabled) releaseAll();
    refresh();
    return enabled;
  }

  function toggleCollapsed() {
    collapsed = !collapsed;
    releaseAll();
    refresh();
  }

  root.addEventListener("pointerdown", (event) => {
    const command = event.target.closest("[data-mobile-command]")?.dataset.mobileCommand;
    if (command === "dev") {
      event.preventDefault();
      if (global.VoltzDevMenu?.open) global.VoltzDevMenu.open();
      else global.location.href = "game.html?mobile=1&dev=1";
      return;
    }
    if (command === "collapse") {
      event.preventDefault();
      toggleCollapsed();
      return;
    }

    const button = event.target.closest("[data-key]");
    if (!button || !enabled) return;
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    button.classList.add("pressed");
    if (button.classList.contains("hold")) hold(button.dataset.key, event.pointerId);
    else press(button.dataset.key);
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    root.addEventListener(type, (event) => {
      const button = event.target.closest?.("[data-key]");
      button?.classList.remove("pressed");
      release(event.pointerId);
    });
  });

  root.addEventListener("contextmenu", (event) => event.preventDefault());
  global.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
  new MutationObserver(refresh).observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["class"] });
  global.addEventListener("resize", refresh);

  global.VoltzMobileControls = Object.freeze({
    isEnabled: () => enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    refresh,
    press
  });

  refresh();
})(window);
