(function initializeVolleyballTracking(global) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TRAIL_COUNT = 9;
  const trail = [];
  let lastSampleAt = 0;
  let lastHelpText = "";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function centerRelative(element, courtRect) {
    if (!element || !courtRect) return null;
    const rect = element.getBoundingClientRect();
    return {
      x:rect.left + rect.width / 2 - courtRect.left,
      y:rect.top + rect.height / 2 - courtRect.top
    };
  }

  function createSvgNode(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function ensureOverlay(court) {
    let svg = court.querySelector(".volleyball-ball-guide-svg");
    if (svg) return svg;

    svg = createSvgNode("svg", {
      class:"volleyball-ball-guide-svg",
      "aria-hidden":"true",
      preserveAspectRatio:"none"
    });

    const defs = createSvgNode("defs");
    const gradient = createSvgNode("linearGradient", {
      id:"volleyTrajectoryGradient",
      x1:"0%", y1:"0%", x2:"100%", y2:"0%"
    });
    gradient.append(
      createSvgNode("stop", { offset:"0%", "stop-color":"#dffeff", "stop-opacity":".28" }),
      createSvgNode("stop", { offset:"55%", "stop-color":"#81f4ff", "stop-opacity":".72" }),
      createSvgNode("stop", { offset:"100%", "stop-color":"#ffd166", "stop-opacity":".96" })
    );
    defs.appendChild(gradient);

    const trajectory = createSvgNode("path", { class:"trajectory" });
    const tether = createSvgNode("path", { class:"height-tether" });
    const trailGroup = createSvgNode("g", { class:"trail" });
    for (let index = 0; index < TRAIL_COUNT; index += 1) {
      trailGroup.appendChild(createSvgNode("circle", { class:"trail-dot", cx:0, cy:0, r:0, opacity:0 }));
    }

    svg.append(defs, trajectory, tether, trailGroup);
    court.appendChild(svg);
    return svg;
  }

  function updateTrail(svg, ballPoint, now, inPlay) {
    const dots = [...svg.querySelectorAll(".trail-dot")];
    if (!inPlay || !ballPoint) {
      trail.length = 0;
      dots.forEach((dot) => dot.setAttribute("opacity", "0"));
      return;
    }

    if (now - lastSampleAt >= 42) {
      lastSampleAt = now;
      const previous = trail[trail.length - 1];
      const moved = !previous || Math.hypot(previous.x - ballPoint.x, previous.y - ballPoint.y) >= 3;
      if (moved) {
        trail.push({ x:ballPoint.x, y:ballPoint.y });
        if (trail.length > TRAIL_COUNT) trail.shift();
      }
    }

    dots.forEach((dot, index) => {
      const point = trail[index];
      if (!point) {
        dot.setAttribute("opacity", "0");
        return;
      }
      const age = (index + 1) / Math.max(1, trail.length);
      dot.setAttribute("cx", point.x.toFixed(1));
      dot.setAttribute("cy", point.y.toFixed(1));
      dot.setAttribute("r", (1.8 + age * 3.1).toFixed(1));
      dot.setAttribute("opacity", (.08 + age * .44).toFixed(2));
    });
  }

  function updateTrajectory(svg, ballPoint, landingPoint, visible) {
    const path = svg.querySelector(".trajectory");
    if (!path) return;
    if (!visible || !ballPoint || !landingPoint) {
      path.setAttribute("d", "");
      path.style.opacity = "0";
      return;
    }

    const dx = landingPoint.x - ballPoint.x;
    const dy = landingPoint.y - ballPoint.y;
    const distance = Math.hypot(dx, dy);
    const controlX = ballPoint.x + dx * .52;
    const controlY = Math.min(ballPoint.y, landingPoint.y) - clamp(distance * .14, 18, 74);
    path.setAttribute(
      "d",
      `M ${ballPoint.x.toFixed(1)} ${ballPoint.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${landingPoint.x.toFixed(1)} ${landingPoint.y.toFixed(1)}`
    );
    path.style.opacity = ".78";
  }

  function updateHeightTether(svg, ballPoint, shadowPoint, inPlay) {
    const tether = svg.querySelector(".height-tether");
    if (!tether) return;
    if (!inPlay || !ballPoint || !shadowPoint) {
      tether.setAttribute("d", "");
      return;
    }
    tether.setAttribute(
      "d",
      `M ${ballPoint.x.toFixed(1)} ${ballPoint.y.toFixed(1)} L ${shadowPoint.x.toFixed(1)} ${shadowPoint.y.toFixed(1)}`
    );
  }

  function updateLandingReadScale(landing, ballPoint, shadowPoint, courtRect) {
    if (!landing) return;
    if (!ballPoint || !shadowPoint || !courtRect?.height) {
      landing.style.setProperty("--volley-read-scale", "1");
      return;
    }

    const visualLift = Math.max(0, shadowPoint.y - ballPoint.y);
    const height01 = clamp(visualLift / (courtRect.height * .17), 0, 1);
    // Bola alta: area ampla para leitura. Perto do contato: fecha no ponto real.
    const readScale = .76 + height01 * .68;
    landing.style.setProperty("--volley-read-scale", readScale.toFixed(3));
  }

  function refreshHelp() {
    const help = document.querySelector(".volleyball-dynamic-hud .sports-help");
    if (!help) return;
    const text = "RECEPCAO E LEVANTAMENTO: chegue na zona e aperte J uma vez para deixar o toque pronto. CORTE: acompanhe o rastro e espere J · CORTA AGORA! A direcao de movimento no levantamento continua indicando o setor do atacante.";
    if (lastHelpText !== text || help.textContent !== text) {
      lastHelpText = text;
      help.textContent = text;
    }
  }

  function frame(now) {
    const court = document.getElementById("volleyballDynamicCourt");
    const ball = document.getElementById("volleyballDynamicBall");
    const shadow = document.getElementById("volleyballBallShadow");
    const landing = document.getElementById("volleyballLandingMarker");

    if (court && ball && shadow) {
      const svg = ensureOverlay(court);
      const courtRect = court.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${courtRect.width.toFixed(1)} ${courtRect.height.toFixed(1)}`);

      const inPlay = ball.classList.contains("in-play");
      const ballPoint = inPlay ? centerRelative(ball, courtRect) : null;
      const shadowPoint = inPlay ? centerRelative(shadow, courtRect) : null;
      const landingVisible = Boolean(landing?.classList.contains("visible"));
      const landingPoint = landingVisible ? centerRelative(landing, courtRect) : null;

      updateTrail(svg, ballPoint, now, inPlay);
      updateTrajectory(svg, ballPoint, landingPoint, landingVisible);
      updateHeightTether(svg, ballPoint, shadowPoint, inPlay);
      updateLandingReadScale(landing, ballPoint, shadowPoint, courtRect);
      refreshHelp();
    }

    requestAnimationFrame(frame);
  }

  global.VoltzVolleyballTracking = Object.freeze({
    clearTrail:() => { trail.length = 0; }
  });

  requestAnimationFrame(frame);
})(window);
