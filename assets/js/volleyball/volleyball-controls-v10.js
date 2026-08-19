(function initializeVolleyballControlsV10(global) {
  const GOOD_MIN = 38;
  const GOOD_MAX = 62;
  const PERFECT_MIN = 47;
  const PERFECT_MAX = 53;
  const METER_CYCLE_MS = 1050;

  let meterActive = false;
  let meterStartedAt = 0;
  let meterCursor = 0;
  let slowmoStartedAt = 0;
  let slowmoRaf = 0;
  let meterRaf = 0;

  function normalizeKey(event) {
    return String(event.key || "").toLowerCase();
  }

  function core() {
    return global.VoltzVolleyballCoreV10 || null;
  }

  function isDynamicVolleyball() {
    const state = core()?.getState?.();
    return Boolean(state?.type === "volleyball" && state?.dynamic);
  }

  function dispatchLegacyJ() {
    const event = new KeyboardEvent("keydown", {
      key:"j",
      code:"KeyJ",
      bubbles:true,
      cancelable:true,
      repeat:false
    });
    try { Object.defineProperty(event, "voltzV10PassThrough", { value:true }); } catch {}
    document.dispatchEvent(event);
    requestAnimationFrame(() => {
      const up = new KeyboardEvent("keyup", {
        key:"j",
        code:"KeyJ",
        bubbles:true,
        cancelable:true,
        repeat:false
      });
      try { Object.defineProperty(up, "voltzV10PassThrough", { value:true }); } catch {}
      document.dispatchEvent(up);
    });
  }

  function ensureMeterDom() {
    let overlay = document.getElementById("volleyballSpikeFocusV10");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "volleyballSpikeFocusV10";
    overlay.className = "volleyball-spike-focus-v10";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="volleyball-spike-vignette-v10"></div>
      <div class="volleyball-spike-panel-v10">
        <div class="volleyball-spike-kicker-v10">ATAQUE VOLTZ</div>
        <strong>CORTE</strong>
        <div class="volleyball-spike-meter-v10">
          <div class="volleyball-spike-good-v10"></div>
          <div class="volleyball-spike-perfect-v10"></div>
          <i id="volleyballSpikeCursorV10"></i>
        </div>
        <span>APERTE <b>J</b> NO TEMPO CERTO</span>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function stopMeterLoops() {
    if (slowmoRaf) cancelAnimationFrame(slowmoRaf);
    if (meterRaf) cancelAnimationFrame(meterRaf);
    slowmoRaf = 0;
    meterRaf = 0;
  }

  function resetSpikeFocus() {
    stopMeterLoops();
    meterActive = false;
    meterStartedAt = 0;
    meterCursor = 0;
    core()?.setTimeScale?.(1);
    document.body.classList.remove("volleyball-spike-slowmo-v10", "volleyball-spike-meter-open-v10");
    const overlay = document.getElementById("volleyballSpikeFocusV10");
    overlay?.classList.remove("visible", "resolved-good", "resolved-miss", "resolved-perfect");
    overlay?.setAttribute("aria-hidden", "true");
  }

  function meterFrame(now) {
    if (!meterActive) return;
    const elapsed = now - meterStartedAt;
    const phase = (elapsed % METER_CYCLE_MS) / METER_CYCLE_MS;
    meterCursor = phase <= .5 ? phase * 200 : (1 - phase) * 200;
    const cursor = document.getElementById("volleyballSpikeCursorV10");
    if (cursor) cursor.style.left = `${meterCursor.toFixed(2)}%`;
    meterRaf = requestAnimationFrame(meterFrame);
  }

  function openMeter() {
    const overlay = ensureMeterDom();
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("volleyball-spike-meter-open-v10");
    meterActive = true;
    meterStartedAt = performance.now();
    meterRaf = requestAnimationFrame(meterFrame);
  }

  function startSpikeFocus() {
    const api = core();
    if (!api?.canTouch?.()) {
      api?.setMessage?.("Chega na bola primeiro! O J so abre o corte quando voce entra no contato.");
      return;
    }

    if (api.getTouchCount?.() !== 2) return;

    stopMeterLoops();
    document.body.classList.add("volleyball-spike-slowmo-v10");
    slowmoStartedAt = performance.now();
    api.setTimeScale?.(1);

    const animateSlowmo = (now) => {
      if (meterActive) return;
      const progress = Math.min(1, (now - slowmoStartedAt) / 360);
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = 1 - eased;
      api.setTimeScale?.(Math.max(0, scale));
      if (progress >= 1) {
        api.setTimeScale?.(0);
        openMeter();
        return;
      }
      slowmoRaf = requestAnimationFrame(animateSlowmo);
    };

    slowmoRaf = requestAnimationFrame(animateSlowmo);
  }

  function resolveSpike() {
    if (!meterActive) return;
    meterActive = false;
    stopMeterLoops();

    const api = core();
    const good = meterCursor >= GOOD_MIN && meterCursor <= GOOD_MAX;
    const perfect = meterCursor >= PERFECT_MIN && meterCursor <= PERFECT_MAX;
    const overlay = ensureMeterDom();

    overlay.classList.add(perfect ? "resolved-perfect" : good ? "resolved-good" : "resolved-miss");

    if (good) {
      api?.directAttack?.({
        quality:perfect ? 1 : .88,
        openSpace:true,
        miss:false,
        soft:false
      });
    } else {
      api?.directAttack?.({
        quality:.18,
        openSpace:false,
        miss:true,
        soft:false
      });
    }

    // O impacto devolve o jogo imediatamente para 100%, criando o contraste do corte.
    api?.setTimeScale?.(1);
    document.body.classList.remove("volleyball-spike-slowmo-v10", "volleyball-spike-meter-open-v10");

    global.setTimeout(() => {
      overlay.classList.remove("visible", "resolved-good", "resolved-miss", "resolved-perfect");
      overlay.setAttribute("aria-hidden", "true");
    }, perfect ? 420 : good ? 330 : 260);
  }

  function handleControlledTouch() {
    const api = core();
    const touches = api?.getTouchCount?.();
    if (touches < 0) return;

    if (touches === 2) {
      if (!api.canTouch?.()) {
        api.setMessage?.("Chega na bola para fazer o toque leve.");
        return;
      }
      api.directAttack?.({ quality:.26, soft:true, openSpace:false, miss:false });
      return;
    }

    // Recepcao, levantamento e saque continuam usando o sistema de assistencia
    // ja aprovado. O K apenas passa a ser a linguagem visivel para essa acao.
    dispatchLegacyJ();
  }

  function handleDirectAttack() {
    const api = core();
    if (!api) return;
    const touches = api.getTouchCount?.();
    const state = api.getState?.();

    if (state?.phase === "serve-voltz") {
      api.setMessage?.("J agora e CORTE. Use K para sacar.");
      return;
    }

    if (touches === 2) {
      startSpikeFocus();
      return;
    }

    if (!api.canTouch?.()) {
      api.setMessage?.("Chega na bola primeiro para devolver com J.");
      return;
    }

    api.directAttack?.({ quality:.32, soft:false, openSpace:false, miss:false });
  }

  function updatePromptAndHelp() {
    if (!isDynamicVolleyball()) return;
    const court = document.getElementById("volleyballDynamicCourt");
    const active = court?.querySelector(".volleyball-dynamic-player.team-voltz.is-active");
    if (!active) return;

    document.querySelectorAll(".volleyball-action-prompt-v10").forEach((node) => {
      if (node.parentElement !== active) node.remove();
    });

    let prompt = active.querySelector(".volleyball-action-prompt-v10");
    if (!prompt) {
      prompt = document.createElement("em");
      prompt.className = "volleyball-action-prompt-v10";
      active.appendChild(prompt);
    }

    const api = core();
    const state = api?.getState?.();
    const touches = api?.getTouchCount?.();
    const canTouch = Boolean(api?.canTouch?.());
    let text = "";

    if (meterActive) text = "J · ACERTA O TEMPO";
    else if (state?.phase === "serve-voltz") text = "K · SACAR";
    else if (state?.phase === "rally" && state?.ball?.inPlay) {
      if (touches === 0) text = "K · RECEBER  |  J · DEVOLVER";
      else if (touches === 1) text = "K · LEVANTAR  |  J · DEVOLVER";
      else if (touches === 2) text = canTouch ? "K · TOQUE LEVE  |  J · CORTAR" : "PREPARA O CORTE";
    }

    prompt.textContent = text;
    prompt.classList.toggle("ready", canTouch || state?.phase === "serve-voltz" || meterActive);

    const help = document.querySelector(".volleyball-dynamic-hud .sports-help");
    if (help && help.dataset.controlsV10 !== "1") {
      help.dataset.controlsV10 = "1";
      help.textContent = "K constroi a jogada: recebe, levanta e devolve de leve. J manda direto para o rival; no 3º toque, J abre a barra especial de corte.";
    }

    const strip = document.querySelector(".volleyball-control-strip");
    if (strip && strip.dataset.controlsV10 !== "1") {
      strip.dataset.controlsV10 = "1";
      strip.innerHTML = "<span><b>WASD</b> MOVER</span><span><b>K</b> TOQUE CONTROLADO</span><span><b>J</b> CORTE / DEVOLVER</span><span>TOQUES <b id=\"volleyballTouchCount\">0/3</b></span>";
    }
  }

  function updateMobileActions() {
    const root = document.getElementById("voltzMobileControls");
    const actions = document.getElementById("voltzMobileActions");
    if (!root || !actions || root.dataset.context !== "volleyball") return;
    if (actions.dataset.volleyballV10 === "1") return;

    actions.dataset.volleyballV10 = "1";
    actions.innerHTML = `
      <button class="mobile-action primary" data-key="k"><b>K</b><span>TOQUE</span></button>
      <button class="mobile-action" data-key="j"><b>J</b><span>CORTE</span></button>
      <button class="mobile-action" data-key="escape"><b>×</b><span>FECHAR</span></button>`;
  }

  document.addEventListener("keydown", (event) => {
    if (event.voltzV10PassThrough) return;
    if (!isDynamicVolleyball()) return;

    const key = normalizeKey(event);
    if (key !== "j" && key !== "k") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;

    if (meterActive) {
      if (key === "j") resolveSpike();
      return;
    }

    if (key === "k") handleControlledTouch();
    else handleDirectAttack();
  }, true);

  global.addEventListener("blur", resetSpikeFocus);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetSpikeFocus();
  });

  const observer = new MutationObserver(() => {
    updateMobileActions();
  });
  observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["class", "data-context"] });

  function frame() {
    if (!isDynamicVolleyball() && meterActive) resetSpikeFocus();
    updatePromptAndHelp();
    updateMobileActions();
    requestAnimationFrame(frame);
  }

  global.VoltzVolleyballControlsV10 = Object.freeze({
    version:"1.0",
    isMeterActive:() => meterActive,
    getMeterCursor:() => meterCursor,
    reset:resetSpikeFocus
  });

  ensureMeterDom();
  requestAnimationFrame(frame);
})(window);
