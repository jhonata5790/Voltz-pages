(function initializeVolleyballPerspective(global) {
  let lastFrame = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rawPercent(element, property) {
    const value = Number.parseFloat(element?.style?.[property] || "");
    return Number.isFinite(value) ? value : null;
  }

  function isMobile() {
    return Boolean(global.matchMedia?.("(max-width: 700px)")?.matches);
  }

  function farWidthFactor() {
    return isMobile() ? .74 : .64;
  }

  function depth01(screenTop) {
    return clamp(Number(screenTop || 0) / 100, 0, 1);
  }

  function widthFactor(screenTop) {
    const t = depth01(screenTop);
    const far = farWidthFactor();
    // Curva suave: o fundo fecha mais rápido e o primeiro plano abre bastante.
    const shaped = Math.pow(t, 1.08);
    return far + (1 - far) * shaped;
  }

  function projectedGroundTop(screenTop) {
    const t = depth01(screenTop);
    // Foreshortening vertical: comprime as distâncias no fundo e abre no primeiro plano.
    // Mantém os extremos 0 e 100 estáveis para não quebrar a borda da quadra.
    const power = isMobile() ? 1.22 : 1.34;
    return Math.pow(t, power) * 100;
  }

  function depthScale(screenTop) {
    const t = depth01(screenTop);
    // Diferença agora é perceptível: fundo ~72%, frente ~112%.
    return (isMobile() ? .78 : .72) + t * (isMobile() ? .28 : .40);
  }

  function depthShadow(screenTop) {
    const t = depth01(screenTop);
    return 1 + t * 4.5;
  }

  function projectGroundElement(court, element, groundTop = null, scaleByDepth = false) {
    if (!court || !element) return;
    const rawLeft = rawPercent(element, "left");
    const rawTop = groundTop ?? rawPercent(element, "top");
    if (rawLeft === null || rawTop === null) return;

    const factor = widthFactor(rawTop);
    const projectedLeft = 50 + (rawLeft - 50) * factor;
    const projectedTop = projectedGroundTop(rawTop);
    const offsetXPx = ((projectedLeft - rawLeft) / 100) * court.clientWidth;
    const offsetYPx = ((projectedTop - rawTop) / 100) * court.clientHeight;

    element.style.setProperty("--volley-perspective-x", `${offsetXPx.toFixed(2)}px`);
    element.style.setProperty("--volley-perspective-y", `${offsetYPx.toFixed(2)}px`);

    const scale = scaleByDepth ? depthScale(rawTop) : 1;
    element.style.setProperty("--volley-depth-scale", scale.toFixed(3));
    element.style.setProperty("--volley-depth-shadow", `${depthShadow(rawTop).toFixed(2)}px`);
  }

  function projectBall(court, ball, shadow) {
    if (!court || !ball || !shadow) return;
    const rawLeft = rawPercent(ball, "left");
    const rawBallTop = rawPercent(ball, "top");
    const rawGroundTop = rawPercent(shadow, "top");
    if (rawLeft === null || rawBallTop === null || rawGroundTop === null) return;

    const factor = widthFactor(rawGroundTop);
    const projectedLeft = 50 + (rawLeft - 50) * factor;
    const projectedGround = projectedGroundTop(rawGroundTop);

    // Preserva a altura visual da bola, mas reduz levemente o lift no fundo para combinar com a perspectiva.
    const lift = rawBallTop - rawGroundTop;
    const liftScale = .72 + depth01(rawGroundTop) * .28;
    const projectedBallTop = projectedGround + lift * liftScale;

    const offsetXPx = ((projectedLeft - rawLeft) / 100) * court.clientWidth;
    const offsetYPx = ((projectedBallTop - rawBallTop) / 100) * court.clientHeight;
    ball.style.setProperty("--volley-perspective-x", `${offsetXPx.toFixed(2)}px`);
    ball.style.setProperty("--volley-perspective-y", `${offsetYPx.toFixed(2)}px`);
    ball.style.setProperty("--volley-depth-scale", depthScale(rawGroundTop).toFixed(3));
  }

  function applyPerspective() {
    const court = document.getElementById("volleyballDynamicCourt");
    if (!court) return;

    court.querySelectorAll(".volleyball-dynamic-player").forEach((player) => {
      projectGroundElement(court, player, null, true);
    });

    const shadow = document.getElementById("volleyballBallShadow");
    const ball = document.getElementById("volleyballDynamicBall");
    const landing = document.getElementById("volleyballLandingMarker");

    projectGroundElement(court, shadow, null, true);
    projectBall(court, ball, shadow);
    projectGroundElement(court, landing, null, true);
  }

  function frame(now) {
    if (now - lastFrame >= 16) {
      lastFrame = now;
      applyPerspective();
    }
    requestAnimationFrame(frame);
  }

  global.addEventListener("resize", applyPerspective);
  global.VoltzVolleyballPerspective = Object.freeze({ refresh:applyPerspective });
  requestAnimationFrame(frame);
})(window);
