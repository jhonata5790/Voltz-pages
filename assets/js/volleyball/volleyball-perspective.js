(function initializeVolleyballPerspective(global) {
  let lastFrame = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rawPercent(element, property) {
    const value = Number.parseFloat(element?.style?.[property] || "");
    return Number.isFinite(value) ? value : null;
  }

  function farWidthFactor() {
    return global.matchMedia?.("(max-width: 700px)")?.matches ? .86 : .80;
  }

  function depthFactor(screenTop) {
    const depth = clamp(Number(screenTop || 0) / 100, 0, 1);
    const far = farWidthFactor();
    return far + (1 - far) * depth;
  }

  function projectElement(court, element, groundTop = null, scaleByDepth = false) {
    if (!court || !element) return;
    const rawLeft = rawPercent(element, "left");
    const rawTop = groundTop ?? rawPercent(element, "top");
    if (rawLeft === null || rawTop === null) return;

    // O topo da tela é o fundo da quadra: mais distante = mais estreito.
    const factor = depthFactor(rawTop);
    const projectedLeft = 50 + (rawLeft - 50) * factor;
    const offsetPx = ((projectedLeft - rawLeft) / 100) * court.clientWidth;
    element.style.setProperty("--volley-perspective-x", `${offsetPx.toFixed(2)}px`);

    if (scaleByDepth) {
      // Variação pequena: dá profundidade sem transformar os atletas em miniaturas.
      const scale = .90 + clamp(rawTop / 100, 0, 1) * .10;
      element.style.setProperty("--volley-depth-scale", scale.toFixed(3));
    }
  }

  function applyPerspective() {
    const court = document.getElementById("volleyballDynamicCourt");
    if (!court) return;

    court.querySelectorAll(".volleyball-dynamic-player").forEach((player) => {
      projectElement(court, player, null, true);
    });

    const shadow = document.getElementById("volleyballBallShadow");
    const ball = document.getElementById("volleyballDynamicBall");
    const landing = document.getElementById("volleyballLandingMarker");
    const shadowTop = rawPercent(shadow, "top");

    projectElement(court, shadow);
    // A bola usa a profundidade da sombra no chão; a altura não deve fazê-la
    // convergir lateralmente como se estivesse mais longe da câmera.
    projectElement(court, ball, shadowTop);
    projectElement(court, landing);
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
