from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/sports-minigames.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# Cache DOM references instead of querying the document dozens of times per frame.
anchor = '  function updateFootballDom(now = performance.now()) {'
assert anchor in js, 'updateFootballDom anchor not found'
helper = '''  function getFootballDomCache(g) {\n    if (!g) return null;\n    const cached = g._footballDomCache;\n    if (cached?.field?.isConnected) return cached;\n\n    const players = new Map();\n    (g.players || []).forEach((player) => {\n      players.set(player.id, document.getElementById(`footballPlayer-${player.id}`));\n    });\n\n    const next = {\n      field: document.getElementById("footballField"),\n      players,\n      ballEl: document.getElementById("footballBall"),\n      ballShadow: document.getElementById("footballBallShadow"),\n      targetEl: document.getElementById("footballPassTarget"),\n      scoreVoltz: document.getElementById("footballScoreVoltz"),\n      scoreRival: document.getElementById("footballScoreRival"),\n      banner: document.getElementById("footballMatchBanner"),\n      feedback: document.getElementById("footballFeedback"),\n      visionSvg: document.getElementById("footballVisionSvg"),\n      visionStatus: document.getElementById("footballVisionStatus")\n    };\n    g._footballDomCache = next;\n    return next;\n  }\n\n'''
if helper not in js:
    js = js.replace(anchor, helper + anchor, 1)

old_start = '''  function updateFootballDom(now = performance.now()) {\n    const g = state.current;\n    if (!g || g.type !== "football") return;\n    const field = document.getElementById("footballField");\n    if (!field) return;\n\n    g.players.forEach((player) => {\n      const el = document.getElementById(`footballPlayer-${player.id}`);\n      if (!el) return;\n      el.style.left = `${player.x}%`;\n      el.style.top = `${player.y}%`;\n      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });\n      const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;\n      el.style.setProperty("--football-facing-angle", `${angle}deg`);\n      const facingName = Math.abs(facing.x) >= Math.abs(facing.y)\n        ? (facing.x >= 0 ? "right" : "left")\n        : (facing.y >= 0 ? "down" : "up");\n      el.dataset.footballFacing = facingName;\n      if (el.classList.contains("is-svg-avatar")) {\n        const depthScale = clamp(.94 + player.y * .0012, .95, 1.06);\n        el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n      }\n      el.classList.toggle("is-controlled", player.id === g.controlledId && !player.keeper);\n      el.classList.toggle("has-ball", g.ball.ownerId === player.id);\n      el.classList.toggle("is-running", now < Number(player.movingUntil || 0));\n      el.classList.toggle("is-tackling", now < Number(player.tackleUntil || 0));\n      el.classList.toggle("is-recovering", now < Number(player.recoverUntil || 0));\n    });\n\n    const ballEl = document.getElementById("footballBall");\n    const ballShadow = document.getElementById("footballBallShadow");'''

new_start = '''  function updateFootballDom(now = performance.now()) {\n    const g = state.current;\n    if (!g || g.type !== "football") return;\n    const dom = getFootballDomCache(g);\n    const field = dom?.field;\n    if (!field) return;\n\n    g.players.forEach((player) => {\n      const el = dom.players.get(player.id);\n      if (!el) return;\n\n      const left = `${player.x.toFixed(2)}%`;\n      const top = `${player.y.toFixed(2)}%`;\n      const visual = el._footballVisualState || (el._footballVisualState = {});\n      if (visual.left !== left) { el.style.left = left; visual.left = left; }\n      if (visual.top !== top) { el.style.top = top; visual.top = top; }\n\n      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });\n      const isSvgAvatar = el.classList.contains("is-svg-avatar");\n      if (!isSvgAvatar) {\n        const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;\n        const angleValue = `${angle.toFixed(1)}deg`;\n        if (visual.angle !== angleValue) {\n          el.style.setProperty("--football-facing-angle", angleValue);\n          visual.angle = angleValue;\n        }\n      }\n\n      const facingName = Math.abs(facing.x) >= Math.abs(facing.y)\n        ? (facing.x >= 0 ? "right" : "left")\n        : (facing.y >= 0 ? "down" : "up");\n      if (visual.facing !== facingName) {\n        el.dataset.footballFacing = facingName;\n        visual.facing = facingName;\n      }\n\n      if (isSvgAvatar) {\n        const depthBucket = Math.round(player.y / 4);\n        if (visual.depthBucket !== depthBucket) {\n          const depthY = depthBucket * 4;\n          const depthScale = clamp(.94 + depthY * .0012, .95, 1.06);\n          el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n          visual.depthBucket = depthBucket;\n        }\n      }\n\n      const controlled = player.id === g.controlledId && !player.keeper;\n      const hasBall = g.ball.ownerId === player.id;\n      const running = now < Number(player.movingUntil || 0);\n      const tackling = now < Number(player.tackleUntil || 0);\n      const recovering = now < Number(player.recoverUntil || 0);\n      if (visual.controlled !== controlled) { el.classList.toggle("is-controlled", controlled); visual.controlled = controlled; }\n      if (visual.hasBall !== hasBall) { el.classList.toggle("has-ball", hasBall); visual.hasBall = hasBall; }\n      if (visual.running !== running) { el.classList.toggle("is-running", running); visual.running = running; }\n      if (visual.tackling !== tackling) { el.classList.toggle("is-tackling", tackling); visual.tackling = tackling; }\n      if (visual.recovering !== recovering) { el.classList.toggle("is-recovering", recovering); visual.recovering = recovering; }\n    });\n\n    const ballEl = dom.ballEl;\n    const ballShadow = dom.ballShadow;'''
assert old_start in js, 'updateFootballDom player block not found'
js = js.replace(old_start, new_start, 1)

replacements = {
    '    const targetEl = document.getElementById("footballPassTarget");': '    const targetEl = dom.targetEl;',
    '    const scoreVoltz = document.getElementById("footballScoreVoltz");\n    const scoreRival = document.getElementById("footballScoreRival");\n    const banner = document.getElementById("footballMatchBanner");\n    const feedback = document.getElementById("footballFeedback");\n    if (scoreVoltz) scoreVoltz.textContent = g.score;\n    if (scoreRival) scoreRival.textContent = g.rivalScore;\n    if (banner) banner.textContent = g.banner;\n    if (feedback) feedback.textContent = g.feedback;': '    const scoreVoltz = dom.scoreVoltz;\n    const scoreRival = dom.scoreRival;\n    const banner = dom.banner;\n    const feedback = dom.feedback;\n    const scoreVoltzText = String(g.score);\n    const scoreRivalText = String(g.rivalScore);\n    const bannerText = String(g.banner || "");\n    const feedbackText = String(g.feedback || "");\n    if (scoreVoltz && scoreVoltz.textContent !== scoreVoltzText) scoreVoltz.textContent = scoreVoltzText;\n    if (scoreRival && scoreRival.textContent !== scoreRivalText) scoreRival.textContent = scoreRivalText;\n    if (banner && banner.textContent !== bannerText) banner.textContent = bannerText;\n    if (feedback && feedback.textContent !== feedbackText) feedback.textContent = feedbackText;',
    '    const visionSvg = document.getElementById("footballVisionSvg");\n    if (visionSvg) visionSvg.innerHTML = visionActive ? buildFootballVision(g) : "";\n\n    const visionStatus = document.getElementById("footballVisionStatus");\n    if (visionStatus) {\n      if (visionActive) visionStatus.textContent = "I · VOLTZ VISION ATIVA";\n      else if (now < g.visionCooldownUntil) visionStatus.textContent = `I · RECARGA ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s`;\n      else visionStatus.textContent = "I · VOLTZ VISION PRONTA";\n    }': '    const visionSvg = dom.visionSvg;\n    if (visionSvg) {\n      if (visionActive) {\n        if (now - Number(g._footballVisionRenderedAt || 0) >= 80) {\n          visionSvg.innerHTML = buildFootballVision(g);\n          g._footballVisionRenderedAt = now;\n        }\n      } else if (g._footballVisionWasActive) {\n        visionSvg.innerHTML = "";\n      }\n      g._footballVisionWasActive = visionActive;\n    }\n\n    const visionStatus = dom.visionStatus;\n    if (visionStatus) {\n      const visionText = visionActive\n        ? "I · VOLTZ VISION ATIVA"\n        : now < g.visionCooldownUntil\n          ? `I · RECARGA ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s`\n          : "I · VOLTZ VISION PRONTA";\n      if (visionStatus.textContent !== visionText) visionStatus.textContent = visionText;\n    }'
}
for old, new in replacements.items():
    assert old in js, f'expected JS block not found: {old[:60]}'
    js = js.replace(old, new, 1)

# Avoid repeated field class mutations.
old_vision_class = '    const visionActive = now < g.visionUntil;\n    field.classList.toggle("vision-active", visionActive);'
new_vision_class = '    const visionActive = now < g.visionUntil;\n    if (g._footballVisionClassActive !== visionActive) {\n      field.classList.toggle("vision-active", visionActive);\n      g._footballVisionClassActive = visionActive;\n    }'
assert old_vision_class in js, 'vision class block not found'
js = js.replace(old_vision_class, new_vision_class, 1)

# Cache pass-target writes as well.
old_target = '''    if (targetEl) {\n      targetEl.classList.toggle("visible", Boolean(target && !g.ball.ownerId));\n      if (target) { targetEl.style.left = `${target.x}%`; targetEl.style.top = `${target.y}%`; }\n    }'''
new_target = '''    if (targetEl) {\n      const visible = Boolean(target && !g.ball.ownerId);\n      if (g._footballPassTargetVisible !== visible) {\n        targetEl.classList.toggle("visible", visible);\n        g._footballPassTargetVisible = visible;\n      }\n      if (target) {\n        const targetLeft = `${target.x.toFixed(2)}%`;\n        const targetTop = `${target.y.toFixed(2)}%`;\n        if (g._footballPassTargetLeft !== targetLeft) { targetEl.style.left = targetLeft; g._footballPassTargetLeft = targetLeft; }\n        if (g._footballPassTargetTop !== targetTop) { targetEl.style.top = targetTop; g._footballPassTargetTop = targetTop; }\n      }\n    }'''
assert old_target in js, 'pass target block not found'
js = js.replace(old_target, new_target, 1)

# CSS overrides: remove per-frame raster-heavy filters and continuous bobbing.
marker = '/* Football V3.7.1 · render otimizado dos SVGs */'
css_append = r'''

/* Football V3.7.1 · render otimizado dos SVGs */
.football-live-player.is-svg-avatar {
  contain:layout style;
  isolation:isolate;
}
.football-live-player.is-svg-avatar .football-user-avatar-shell {
  will-change:transform;
  backface-visibility:hidden;
}
.football-live-player.is-svg-avatar .football-user-avatar,
.football-live-player.is-svg-avatar.team-voltz .football-user-avatar,
.football-live-player.is-svg-avatar.team-rival .football-user-avatar {
  filter:none !important;
}
.football-live-player.is-svg-avatar .football-avatar-aura {
  opacity:.045 !important;
  filter:none !important;
}
.football-live-player.is-svg-avatar .football-player-shadow,
.football-live-player.is-svg-avatar.is-keeper .football-player-shadow {
  filter:none !important;
  box-shadow:0 3px 6px rgba(0,0,0,.24) !important;
}
.football-live-player.is-svg-avatar.is-running .football-user-avatar-shell {
  animation:none !important;
}
.football-live-player.is-svg-avatar.has-ball .football-avatar-core,
.football-live-player.is-svg-avatar.team-rival.has-ball .football-avatar-core {
  filter:none !important;
  stroke-width:6px;
}
'''
if marker not in css:
    css += css_append

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
