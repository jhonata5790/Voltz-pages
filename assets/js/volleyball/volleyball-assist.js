(function initializeVolleyballAssist(global) {
  const DIRECTION_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);
  const assistHeld = new Set();
  const manualHeld = new Set();
  let lastActiveId = "";
  let easyCoverActiveId = "";
  let easyCoverUsed = false;
  let bufferedJUntil = 0;
  let bufferedJActiveId = "";
  let lastFrame = 0;

  const KEY_META = {
    up: { key:"ArrowUp", code:"ArrowUp" },
    down: { key:"ArrowDown", code:"ArrowDown" },
    left: { key:"ArrowLeft", code:"ArrowLeft" },
    right: { key:"ArrowRight", code:"ArrowRight" },
    j: { key:"j", code:"KeyJ" }
  };

  function normalizeKey(event) {
    if (event.code === "Space" || event.key === " ") return "space";
    return String(event.key || "").toLowerCase();
  }

  function dispatchAssistKey(type, token) {
    const meta = KEY_META[token];
    if (!meta) return;
    const event = new KeyboardEvent(type, {
      key:meta.key,
      code:meta.code,
      bubbles:true,
      cancelable:true,
      repeat:false
    });
    try { Object.defineProperty(event, "voltzAssist", { value:true }); } catch {}
    document.dispatchEvent(event);
  }

  function tapAssistJ() {
    dispatchAssistKey("keydown", "j");
    requestAnimationFrame(() => dispatchAssistKey("keyup", "j"));
  }

  function syncAssistDirections(wanted) {
    [...assistHeld].forEach((token) => {
      if (!wanted.has(token)) {
        assistHeld.delete(token);
        dispatchAssistKey("keyup", token);
      }
    });
    [...wanted].forEach((token) => {
      if (!assistHeld.has(token)) {
        assistHeld.add(token);
        dispatchAssistKey("keydown", token);
      }
    });
  }

  function releaseAssistDirections() {
    syncAssistDirections(new Set());
  }

  function getDom() {
    const court = document.getElementById("volleyballDynamicCourt");
    const active = court?.querySelector(".volleyball-dynamic-player.team-voltz.is-active") || null;
    const ball = document.getElementById("volleyballDynamicBall");
    const shadow = document.getElementById("volleyballBallShadow");
    const landing = document.getElementById("volleyballLandingMarker");
    const touches = document.getElementById("volleyballTouchCount");
    const status = document.getElementById("volleyballDynamicStatus");
    return { court, active, ball, shadow, landing, touches, status };
  }

  function center(rect) {
    return { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 };
  }

  function touchCount(dom) {
    const match = String(dom.touches?.textContent || "0").match(/\d+/);
    return Number(match?.[0] || 0);
  }

  function ballMetrics(dom) {
    if (!dom.court || !dom.active || !dom.ball || !dom.shadow || !dom.ball.classList.contains("in-play")) return null;
    const courtRect = dom.court.getBoundingClientRect();
    if (!courtRect.width || !courtRect.height) return null;
    const playerCenter = center(dom.active.getBoundingClientRect());
    const shadowCenter = center(dom.shadow.getBoundingClientRect());
    const ballCenter = center(dom.ball.getBoundingClientRect());

    // A câmera horizontal mapeia Y interno no eixo X da tela e X interno no eixo Y.
    const internalDx = (playerCenter.y - shadowCenter.y) / courtRect.height * 100;
    const internalDy = (playerCenter.x - shadowCenter.x) / courtRect.width * 100;
    const distance = Math.hypot(internalDx, internalDy);
    const liftPercent = Math.max(0, (shadowCenter.y - ballCenter.y) / courtRect.height * 100);
    const height = liftPercent / .30;
    return { distance, height };
  }

  function landingDistance(dom) {
    if (!dom.court || !dom.active || !dom.landing || !dom.landing.classList.contains("visible")) return Infinity;
    const courtRect = dom.court.getBoundingClientRect();
    const a = center(dom.active.getBoundingClientRect());
    const b = center(dom.landing.getBoundingClientRect());
    const dx = (a.y - b.y) / courtRect.height * 100;
    const dy = (a.x - b.x) / courtRect.width * 100;
    return Math.hypot(dx, dy);
  }

  function thresholds(touches, forgiving = false) {
    if (forgiving) {
      if (touches === 2) return { distance:13.4, height:29 };
      if (touches === 1) return { distance:12.8, height:18 };
      return { distance:13.2, height:14.5 };
    }
    if (touches === 2) return { distance:10.2, height:27 };
    if (touches === 1) return { distance:9.2, height:15 };
    return { distance:9.2, height:12 };
  }

  function actualTouchReady(dom) {
    const metrics = ballMetrics(dom);
    if (!metrics) return false;
    const limit = thresholds(touchCount(dom), false);
    return metrics.distance <= limit.distance && metrics.height <= limit.height;
  }

  function forgivingTouchReady(dom) {
    const metrics = ballMetrics(dom);
    if (!metrics) return false;
    const limit = thresholds(touchCount(dom), true);
    return metrics.distance <= limit.distance && metrics.height <= limit.height;
  }

  function manualMovementActive() {
    return manualHeld.size > 0 || document.getElementById("voltzJoystick")?.classList.contains("active");
  }

  function guideTowardLanding(dom, now) {
    if (!dom.court || !dom.active || !dom.landing || !dom.landing.classList.contains("visible")) {
      releaseAssistDirections();
      return;
    }
    if (touchCount(dom) !== 0 || manualMovementActive()) {
      releaseAssistDirections();
      return;
    }

    // Aproximadamente 53% de duty-cycle: ajuda perceptível sem assumir o controle.
    if (now % 180 >= 95) {
      releaseAssistDirections();
      return;
    }

    const courtRect = dom.court.getBoundingClientRect();
    const a = center(dom.active.getBoundingClientRect());
    const b = center(dom.landing.getBoundingClientRect());
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const xUnits = Math.abs(dx) / courtRect.width * 100;
    const yUnits = Math.abs(dy) / courtRect.height * 100;
    const wanted = new Set();

    if (xUnits > 2.6) wanted.add(dx < 0 ? "left" : "right");
    if (yUnits > 2.6) wanted.add(dy < 0 ? "up" : "down");
    syncAssistDirections(wanted);
  }

  function ensurePrompt(dom, now) {
    document.querySelectorAll(".volleyball-action-prompt-assist").forEach((node) => {
      if (node.parentElement !== dom.active) node.remove();
    });
    if (!dom.active) return;
    let prompt = dom.active.querySelector(".volleyball-action-prompt-assist");
    if (!prompt) {
      prompt = document.createElement("em");
      prompt.className = "volleyball-action-prompt-assist";
      dom.active.appendChild(prompt);
    }

    const status = String(dom.status?.textContent || "").toUpperCase();
    const inPlay = Boolean(dom.ball?.classList.contains("in-play"));
    const touches = touchCount(dom);
    let text = "";

    if (status.includes("SEU SAQUE")) {
      text = "J · SACAR";
    } else if (inPlay && !status.includes("PONTO") && !status.includes("SAQUE VISITANTE")) {
      if (touches === 0 && (dom.landing?.classList.contains("visible") || status.includes("RECEP") || status.includes("DEFESA"))) {
        text = "J · RECEBER";
      } else if (touches === 1 && status.includes("LEVANT")) {
        text = "J · LEVANTAR";
      } else if (touches === 2 && status.includes("ATAQUE")) {
        text = "J · CORTAR";
      }
    }

    if (bufferedJUntil > now && bufferedJActiveId === dom.active.dataset.id) text = "J ✓ AJUSTANDO";
    prompt.textContent = text;
    prompt.classList.toggle("ready", Boolean(text && (actualTouchReady(dom) || status.includes("SEU SAQUE"))));
  }

  function armEasyCoverOnSwitch(dom) {
    const id = dom.active?.dataset.id || "";
    if (!id || id === lastActiveId) return;
    lastActiveId = id;
    easyCoverUsed = false;
    easyCoverActiveId = "";

    const status = String(dom.status?.textContent || "").toUpperCase();
    if (touchCount(dom) !== 0 || !dom.landing?.classList.contains("visible") || status.includes("SEU SAQUE")) return;
    // Só automatiza se o novo receptor JÁ recebeu a bola praticamente em cima dele.
    if (!manualMovementActive() && landingDistance(dom) <= 6.2) easyCoverActiveId = id;
  }

  function tryEasyCover(dom) {
    if (easyCoverUsed || !easyCoverActiveId || dom.active?.dataset.id !== easyCoverActiveId) return;
    if (touchCount(dom) !== 0 || manualMovementActive()) return;
    if (!actualTouchReady(dom)) return;
    easyCoverUsed = true;
    easyCoverActiveId = "";
    tapAssistJ();
  }

  function tryBufferedJ(dom, now) {
    if (!bufferedJUntil) return;
    if (now > bufferedJUntil || !dom.active || dom.active.dataset.id !== bufferedJActiveId) {
      bufferedJUntil = 0;
      bufferedJActiveId = "";
      return;
    }
    if (actualTouchReady(dom)) {
      bufferedJUntil = 0;
      bufferedJActiveId = "";
      tapAssistJ();
    }
  }

  function frame(now) {
    if (now - lastFrame < 16) {
      requestAnimationFrame(frame);
      return;
    }
    lastFrame = now;
    const dom = getDom();
    if (!dom.court || !dom.active) {
      releaseAssistDirections();
      requestAnimationFrame(frame);
      return;
    }

    armEasyCoverOnSwitch(dom);
    guideTowardLanding(dom, now);
    tryEasyCover(dom);
    tryBufferedJ(dom, now);
    ensurePrompt(dom, now);
    requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", (event) => {
    if (event.voltzAssist) return;
    const key = normalizeKey(event);
    if (DIRECTION_KEYS.has(key)) {
      manualHeld.add(key);
      releaseAssistDirections();
      return;
    }
    if (key !== "j" || event.repeat) return;

    const dom = getDom();
    if (!dom.court || !dom.active || !dom.ball?.classList.contains("in-play")) return;
    if (actualTouchReady(dom) || !forgivingTouchReady(dom)) return;

    // Pequeno buffer: apertou J quase certo, o toque sai quando a bola entra
    // na janela real do motor em vez de punir alguns pixels/milissegundos.
    event.preventDefault();
    event.stopImmediatePropagation();
    bufferedJUntil = performance.now() + 480;
    bufferedJActiveId = dom.active.dataset.id || "";
  }, true);

  document.addEventListener("keyup", (event) => {
    if (event.voltzAssist) return;
    const key = normalizeKey(event);
    if (DIRECTION_KEYS.has(key)) manualHeld.delete(key);
  }, true);

  global.addEventListener("blur", () => {
    manualHeld.clear();
    releaseAssistDirections();
    bufferedJUntil = 0;
    bufferedJActiveId = "";
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    manualHeld.clear();
    releaseAssistDirections();
  });

  global.VoltzVolleyballAssist = Object.freeze({
    getState: () => ({
      manualMovement:manualMovementActive(),
      buffered:Boolean(bufferedJUntil > performance.now()),
      easyCoverActiveId,
      assistDirections:[...assistHeld]
    })
  });

  requestAnimationFrame(frame);
})(window);
