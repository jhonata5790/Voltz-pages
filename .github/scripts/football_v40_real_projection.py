from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/football/football-standalone.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# ------------------------------------------------------------
# 1. Projecao real: logica continua 0..100, render vira trapezio.
# ------------------------------------------------------------
anchor = '''  const FOOTBALL_PITCH_SCALE_X = 1.22;\n  const FOOTBALL_PITCH_SCALE_Y = 1.12;\n'''
assert anchor in js, 'pitch constants anchor not found'
projection = '''  const FOOTBALL_PITCH_SCALE_X = 1.22;\n  const FOOTBALL_PITCH_SCALE_Y = 1.12;\n\n  function isFootballPerspectiveRender() {\n    return Boolean(global.VoltzStandaloneFootball?.isStandalone?.());\n  }\n\n  // Camera V4: a simulacao fica intacta. Apenas convertemos o ponto de mundo\n  // para um campo trapezoidal visto de uma lateral elevada. y=0 e o fundo; y=100 e a frente.\n  function projectFootballPoint(x, y) {\n    const worldX = Number.isFinite(Number(x)) ? Number(x) : 50;\n    const worldY = Number.isFinite(Number(y)) ? Number(y) : 50;\n    if (!isFootballPerspectiveRender()) {\n      return { x:worldX, y:worldY, scale:1, depth:clamp(worldY / 100, 0, 1) };\n    }\n\n    const depth = clamp(worldY / 100, 0, 1);\n    const widthScale = .74 + depth * .25;\n    const screenX = 50 + (worldX - 50) * widthScale;\n    const screenY = 6 + depth * 91;\n    const scale = .82 + depth * .24;\n    return { x:screenX, y:screenY, scale, depth };\n  }\n\n  function footballSvgPoint(point) {\n    const projected = projectFootballPoint(point[0], point[1]);\n    return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;\n  }\n\n  function footballSvgPath(points, close = false) {\n    if (!points?.length) return '';\n    const projected = points.map(footballSvgPoint);\n    return `M ${projected.join(' L ')}${close ? ' Z' : ''}`;\n  }\n\n  function buildFootballProjectedPitch() {\n    if (!isFootballPerspectiveRender()) return '';\n    const centerCircle = [];\n    for (let index = 0; index <= 32; index += 1) {\n      const angle = Math.PI * 2 * index / 32;\n      centerCircle.push([50 + Math.cos(angle) * 9.5, 50 + Math.sin(angle) * 9.5]);\n    }\n\n    const leftBox = [[2,23],[18,23],[18,77],[2,77]];\n    const rightBox = [[98,23],[82,23],[82,77],[98,77]];\n    const leftGoal = [[2,32],[.5,32],[.5,68],[2,68]];\n    const rightGoal = [[98,32],[99.5,32],[99.5,68],[98,68]];\n    const centerSpot = projectFootballPoint(50, 50);\n    const leftSpot = projectFootballPoint(12, 50);\n    const rightSpot = projectFootballPoint(88, 50);\n\n    const netLines = [];\n    [40,50,60].forEach((worldY) => {\n      netLines.push(`<path class="football-pitch-net-line" d="${footballSvgPath([[.5,worldY],[2,worldY]])}"/>`);\n      netLines.push(`<path class="football-pitch-net-line" d="${footballSvgPath([[98,worldY],[99.5,worldY]])}"/>`);\n    });\n\n    return `\n      <path class="football-pitch-outline" d="${footballSvgPath([[2,5],[98,5],[98,95],[2,95]], true)}"/>\n      <path class="football-pitch-line" d="${footballSvgPath([[50,5],[50,95]])}"/>\n      <path class="football-pitch-line" d="${footballSvgPath(centerCircle, true)}"/>\n      <path class="football-pitch-line" d="${footballSvgPath(leftBox, true)}"/>\n      <path class="football-pitch-line" d="${footballSvgPath(rightBox, true)}"/>\n      <path class="football-pitch-goal" d="${footballSvgPath(leftGoal, true)}"/>\n      <path class="football-pitch-goal" d="${footballSvgPath(rightGoal, true)}"/>\n      ${netLines.join('')}\n      <circle class="football-pitch-spot" cx="${centerSpot.x.toFixed(2)}" cy="${centerSpot.y.toFixed(2)}" r=".42"/>\n      <circle class="football-pitch-spot" cx="${leftSpot.x.toFixed(2)}" cy="${leftSpot.y.toFixed(2)}" r=".34"/>\n      <circle class="football-pitch-spot" cx="${rightSpot.x.toFixed(2)}" cy="${rightSpot.y.toFixed(2)}" r=".34"/>\n    `;\n  }\n'''
js = js.replace(anchor, projection, 1)

# ------------------------------------------------------------
# 2. Campo: no standalone usamos SVG projetado no lugar das divs planas.
# ------------------------------------------------------------
old_field = '''        <div id="footballField" class="football-field-live">\n<div class="football-half-line"></div>\n<div class="football-center-circle"></div>\n<div class="football-box football-box-left"></div>\n<div class="football-box football-box-right"></div>\n<div class="football-goal football-goal-left"></div>\n<div class="football-goal football-goal-right"></div>\n<svg id="footballVisionSvg" class="football-vision-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>'''
new_field = '''        <div id="footballField" class="football-field-live ${isFootballPerspectiveRender() ? "is-perspective-pitch" : ""}">\n${isFootballPerspectiveRender()\n  ? `<svg class="football-pitch-projection" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${buildFootballProjectedPitch()}</svg>`\n  : `<div class="football-half-line"></div>\n<div class="football-center-circle"></div>\n<div class="football-box football-box-left"></div>\n<div class="football-box football-box-right"></div>\n<div class="football-goal football-goal-left"></div>\n<div class="football-goal football-goal-right"></div>`}\n<svg id="footballVisionSvg" class="football-vision-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>'''
assert old_field in js, 'football field markup not found'
js = js.replace(old_field, new_field, 1)

# ------------------------------------------------------------
# 3. Vision overlay segue a mesma projecao.
# ------------------------------------------------------------
start = js.index('  function buildFootballVision(g) {')
end = js.index('  function getFootballDomCache(g) {', start)
new_vision = '''  function buildFootballVision(g) {\n    const controlled = getFootballPlayer(g, g.controlledId);\n    if (!controlled) return "";\n    const owner = getFootballOwner(g);\n    const parts = [];\n\n    const line = (className, a, b) => {\n      const pa = projectFootballPoint(a.x, a.y);\n      const pb = projectFootballPoint(b.x, b.y);\n      return `<line class="${className}" x1="${pa.x.toFixed(2)}" y1="${pa.y.toFixed(2)}" x2="${pb.x.toFixed(2)}" y2="${pb.y.toFixed(2)}"></line>`;\n    };\n    const ellipse = (className, point, radius) => {\n      const p = projectFootballPoint(point.x, point.y);\n      return `<ellipse class="${className}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" rx="${(radius * p.scale).toFixed(2)}" ry="${(radius * .62 * p.scale).toFixed(2)}"></ellipse>`;\n    };\n\n    getFootballTeam(g, "rival", false).forEach((rival) => {\n      parts.push(ellipse('vision-pressure', rival, 7));\n    });\n\n    if (owner?.team === "voltz" && owner.id === controlled.id) {\n      getFootballTeam(g, "voltz", false)\n        .filter((mate) => mate.id !== owner.id)\n        .forEach((mate) => {\n          const open = isFootballPassLaneOpen(g, owner, mate);\n          parts.push(line(`vision-pass ${open ? "is-open" : "is-risky"}`, owner, mate));\n          parts.push(ellipse(`vision-space ${open ? "is-open" : "is-risky"}`, mate, 4.5));\n        });\n\n      if (owner.x >= 48) {\n        parts.push(line('vision-shot', owner, { x:99, y:35 }));\n        parts.push(line('vision-shot', owner, { x:99, y:65 }));\n      }\n    } else {\n      parts.push(ellipse('vision-control', controlled, 5.5));\n      parts.push(line('vision-chase', controlled, g.ball));\n    }\n    return parts.join("");\n  }\n\n'''
js = js[:start] + new_vision + js[end:]

# ------------------------------------------------------------
# 4. Jogadores: posicao, escala e ordem de profundidade projetadas.
# ------------------------------------------------------------
old_player_position = '''      const left = `${player.x.toFixed(2)}%`;\n      const top = `${player.y.toFixed(2)}%`;\n      const visual = el._footballVisualState || (el._footballVisualState = {});\n      if (visual.left !== left) { el.style.left = left; visual.left = left; }\n      if (visual.top !== top) { el.style.top = top; visual.top = top; }'''
new_player_position = '''      const projected = projectFootballPoint(player.x, player.y);\n      const left = `${projected.x.toFixed(2)}%`;\n      const top = `${projected.y.toFixed(2)}%`;\n      const visual = el._footballVisualState || (el._footballVisualState = {});\n      if (visual.left !== left) { el.style.left = left; visual.left = left; }\n      if (visual.top !== top) { el.style.top = top; visual.top = top; }\n      const depthZ = String(30 + Math.round(projected.y));\n      if (visual.depthZ !== depthZ) {\n        el.style.setProperty('--football-depth-z', depthZ);\n        visual.depthZ = depthZ;\n      }'''
assert old_player_position in js, 'player position render block not found'
js = js.replace(old_player_position, new_player_position, 1)

old_depth = '''      if (isSvgAvatar) {\n        const depthBucket = Math.round(player.y / 4);\n        if (visual.depthBucket !== depthBucket) {\n          const depthY = depthBucket * 4;\n          const depthScale = clamp(.94 + depthY * .0012, .95, 1.06);\n          el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n          visual.depthBucket = depthBucket;\n        }\n      }'''
new_depth = '''      if (isSvgAvatar) {\n        const depthBucket = Math.round(projected.depth * 20);\n        if (visual.depthBucket !== depthBucket) {\n          const depth = depthBucket / 20;\n          const depthScale = isFootballPerspectiveRender() ? (.82 + depth * .24) : clamp(.94 + player.y * .0012, .95, 1.06);\n          el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n          visual.depthBucket = depthBucket;\n        }\n      }'''
assert old_depth in js, 'avatar depth block not found'
js = js.replace(old_depth, new_depth, 1)

# ------------------------------------------------------------
# 5. Bola e sombra: ponto no chao projetado + altura em tela.
# ------------------------------------------------------------
old_ball = '''    const ballEl = dom.ballEl;\n    const ballShadow = dom.ballShadow;\n    if (ballEl) {\n      const heightPx = Math.min(82, Number(g.ball.z || 0) * 4.2);\n      const scale = 1 + Math.min(.34, Number(g.ball.z || 0) * .018);\n      ballEl.style.left = `${g.ball.x}%`;\n      ballEl.style.top = `${g.ball.y}%`;\n      ballEl.style.transform = `translate(-50%, calc(-50% - ${heightPx}px)) scale(${scale})`;\n      ballEl.classList.toggle("is-airborne", Number(g.ball.z || 0) > .35);\n    }\n    if (ballShadow) {\n      ballShadow.style.left = `${g.ball.x}%`;\n      ballShadow.style.top = `${g.ball.y}%`;\n      const height = Number(g.ball.z || 0);\n      ballShadow.style.opacity = `${clamp(.34 - height * .012, .08, .34)}`;\n      ballShadow.style.transform = `translate(-50%,-50%) scale(${1 + Math.min(.8, height * .035)})`;\n    }'''
new_ball = '''    const ballEl = dom.ballEl;\n    const ballShadow = dom.ballShadow;\n    const ballGround = projectFootballPoint(g.ball.x, g.ball.y);\n    if (ballEl) {\n      const height = Number(g.ball.z || 0);\n      const heightPx = Math.min(82, height * 4.2 * ballGround.scale);\n      const scale = ballGround.scale * (1 + Math.min(.34, height * .018));\n      ballEl.style.left = `${ballGround.x.toFixed(2)}%`;\n      ballEl.style.top = `${ballGround.y.toFixed(2)}%`;\n      ballEl.style.zIndex = String(40 + Math.round(ballGround.y) + (height > .35 ? 28 : 0));\n      ballEl.style.transform = `translate(-50%, calc(-50% - ${heightPx}px)) scale(${scale.toFixed(3)})`;\n      ballEl.classList.toggle("is-airborne", height > .35);\n    }\n    if (ballShadow) {\n      ballShadow.style.left = `${ballGround.x.toFixed(2)}%`;\n      ballShadow.style.top = `${ballGround.y.toFixed(2)}%`;\n      const height = Number(g.ball.z || 0);\n      ballShadow.style.zIndex = String(22 + Math.round(ballGround.y));\n      ballShadow.style.opacity = `${clamp(.34 - height * .012, .08, .34)}`;\n      ballShadow.style.transform = `translate(-50%,-50%) scale(${(ballGround.scale * (1 + Math.min(.8, height * .035))).toFixed(3)})`;\n    }'''
assert old_ball in js, 'ball render block not found'
js = js.replace(old_ball, new_ball, 1)

# ------------------------------------------------------------
# 6. Alvo do passe acompanha a projecao.
# ------------------------------------------------------------
old_target = '''      if (target) {\n        const targetLeft = `${target.x.toFixed(2)}%`;\n        const targetTop = `${target.y.toFixed(2)}%`;\n        if (g._footballPassTargetLeft !== targetLeft) { targetEl.style.left = targetLeft; g._footballPassTargetLeft = targetLeft; }\n        if (g._footballPassTargetTop !== targetTop) { targetEl.style.top = targetTop; g._footballPassTargetTop = targetTop; }\n      }'''
new_target = '''      if (target) {\n        const projectedTarget = projectFootballPoint(target.x, target.y);\n        const targetLeft = `${projectedTarget.x.toFixed(2)}%`;\n        const targetTop = `${projectedTarget.y.toFixed(2)}%`;\n        if (g._footballPassTargetLeft !== targetLeft) { targetEl.style.left = targetLeft; g._footballPassTargetLeft = targetLeft; }\n        if (g._footballPassTargetTop !== targetTop) { targetEl.style.top = targetTop; g._footballPassTargetTop = targetTop; }\n        targetEl.style.setProperty('--football-target-scale', projectedTarget.scale.toFixed(3));\n      }'''
assert old_target in js, 'pass target render block not found'
js = js.replace(old_target, new_target, 1)

# ------------------------------------------------------------
# 7. CSS standalone: campo nao e mais uma folha rotacionada. O trapezio e real.
# ------------------------------------------------------------
marker = '/* Football V4 · projecao top-down obliqua real */'
assert marker not in css, 'V4 CSS already present'
css += r'''


/* Football V4 · projecao top-down obliqua real */
.football-standalone-panel .football-field-live.is-perspective-pitch {
  transform:none !important;
  transform-origin:center !important;
  clip-path:polygon(13% 6%,87% 6%,99.5% 97%,.5% 97%) !important;
  border:0 !important;
  border-radius:0 !important;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(130,255,200,.06), transparent 56%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.028) 0 8.333%, rgba(0,0,0,.028) 8.333% 16.666%),
    linear-gradient(180deg,#174c3b 0%,#0d3a30 48%,#082b26 100%) !important;
  box-shadow:inset 0 0 70px rgba(0,0,0,.34),0 13px 34px rgba(0,0,0,.28) !important;
}
.football-standalone-panel .football-field-live.is-perspective-pitch::before {
  display:none !important;
}
.football-pitch-projection {
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  z-index:2;
  overflow:visible;
  pointer-events:none;
}
.football-pitch-outline,
.football-pitch-line,
.football-pitch-goal,
.football-pitch-net-line {
  fill:none;
  vector-effect:non-scaling-stroke;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.football-pitch-outline { stroke:rgba(231,255,244,.70);stroke-width:2.2; }
.football-pitch-line { stroke:rgba(231,255,244,.53);stroke-width:1.7; }
.football-pitch-goal { stroke:rgba(238,255,248,.86);stroke-width:2.3;fill:rgba(232,255,245,.025); }
.football-pitch-net-line { stroke:rgba(231,255,244,.25);stroke-width:1;stroke-dasharray:3 3; }
.football-pitch-spot { fill:rgba(237,255,247,.78); }
.football-standalone-panel .football-live-player.is-svg-avatar {
  z-index:var(--football-depth-z,60) !important;
}
.football-standalone-panel .football-pass-target {
  width:42px !important;
  height:22px !important;
  transform:translate(-50%,-50%) scale(var(--football-target-scale,1));
}
.football-standalone-panel .football-pass-target.visible {
  animation:footballPerspectiveTargetPulse .55s ease-in-out infinite alternate !important;
}
@keyframes footballPerspectiveTargetPulse {
  from { transform:translate(-50%,-50%) scale(calc(var(--football-target-scale,1) * .84)); }
  to { transform:translate(-50%,-50%) scale(calc(var(--football-target-scale,1) * 1.06)); }
}
.football-standalone-panel .football-ball-shadow {
  height:7px;
}
@media(max-width:900px){
  .football-standalone-panel .football-field-live.is-perspective-pitch {
    transform:none !important;
    clip-path:polygon(12% 6%,88% 6%,99% 97%,1% 97%) !important;
  }
}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('Football V4 projection patch applied')
