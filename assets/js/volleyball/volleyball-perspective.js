(function initializeVolleyballPerspective(global) {
  const VERSION = "1.2-diagonal";
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

  function cameraCorners() {
    // Ordem: rival/fundo, Voltz/fundo, rival/frente, Voltz/frente.
    // O ponto de fuga fica deslocado para a direita, criando uma câmera 3/4
    // em vez da antiga perspectiva central e simétrica.
    return isMobile()
      ? {
          farRival:{ x:9, y:24 },
          farVoltz:{ x:70, y:8 },
          nearRival:{ x:3, y:86 },
          nearVoltz:{ x:98, y:66 }
        }
      : {
          farRival:{ x:12.5, y:27 },
          farVoltz:{ x:70.5, y:7 },
          nearRival:{ x:5, y:88 },
          nearVoltz:{ x:97, y:63 }
        };
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function projectPercent(rawLeft, rawTop) {
    const u = clamp(Number(rawLeft || 0) / 100, 0, 1);
    const v = clamp(Number(rawTop || 0) / 100, 0, 1);
    const corners = cameraCorners();
    const farX = mix(corners.farRival.x, corners.farVoltz.x, u);
    const farY = mix(corners.farRival.y, corners.farVoltz.y, u);
    const nearX = mix(corners.nearRival.x, corners.nearVoltz.x, u);
    const nearY = mix(corners.nearRival.y, corners.nearVoltz.y, u);

    return {
      x:mix(farX, nearX, v),
      y:mix(farY, nearY, v),
      u,
      v
    };
  }

  function depthScale(projectedY) {
    const depth = clamp((projectedY - 5) / 84, 0, 1);
    return (isMobile() ? .80 : .72) + depth * (isMobile() ? .28 : .44);
  }

  function depthShadow(projectedY) {
    const depth = clamp((projectedY - 5) / 84, 0, 1);
    return 1 + depth * 5.5;
  }

  function setProjection(court, element, projected, rawLeft, rawTop, scaleByDepth) {
    const offsetXPx = ((projected.x - rawLeft) / 100) * court.clientWidth;
    const offsetYPx = ((projected.y - rawTop) / 100) * court.clientHeight;
    const scale = scaleByDepth ? depthScale(projected.y) : 1;

    element.style.setProperty("--volley-perspective-x", `${offsetXPx.toFixed(2)}px`);
    element.style.setProperty("--volley-perspective-y", `${offsetYPx.toFixed(2)}px`);
    element.style.setProperty("--volley-depth-scale", scale.toFixed(3));
    element.style.setProperty("--volley-depth-shadow", `${depthShadow(projected.y).toFixed(2)}px`);
    element.style.setProperty("--volley-projected-y", projected.y.toFixed(2));
  }

  function projectGroundElement(court, element, groundTop = null, scaleByDepth = false, sortByDepth = false) {
    if (!court || !element) return;
    const rawLeft = rawPercent(element, "left");
    const rawTop = groundTop ?? rawPercent(element, "top");
    if (rawLeft === null || rawTop === null) return;

    const projected = projectPercent(rawLeft, rawTop);
    setProjection(court, element, projected, rawLeft, rawTop, scaleByDepth);

    if (sortByDepth) {
      element.style.zIndex = String(30 + Math.round(projected.y));
    }
  }

  function projectBall(court, ball, shadow) {
    if (!court || !ball || !shadow) return;
    const rawLeft = rawPercent(ball, "left");
    const rawBallTop = rawPercent(ball, "top");
    const rawGroundTop = rawPercent(shadow, "top");
    if (rawLeft === null || rawBallTop === null || rawGroundTop === null) return;

    const ground = projectPercent(rawLeft, rawGroundTop);
    const rawLift = rawBallTop - rawGroundTop;
    const liftScale = .72 + clamp((ground.y - 5) / 84, 0, 1) * .28;
    const projected = {
      ...ground,
      y:ground.y + rawLift * liftScale
    };

    setProjection(court, ball, projected, rawLeft, rawBallTop, true);
    ball.style.zIndex = String(150 + Math.round(ground.y));
  }

  function applyPerspective() {
    const court = document.getElementById("volleyballDynamicCourt");
    if (!court) return;

    court.dataset.camera = VERSION;
    court.querySelectorAll(".volleyball-dynamic-player").forEach((player) => {
      projectGroundElement(court, player, null, true, true);
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
  global.VoltzVolleyballPerspective = Object.freeze({
    version:VERSION,
    refresh:applyPerspective,
    projectPoint:(left, top) => projectPercent(left, top)
  });
  requestAnimationFrame(frame);
})(window);

