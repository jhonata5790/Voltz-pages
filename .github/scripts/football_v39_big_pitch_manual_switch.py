from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/sports-minigames.css')
standalone_path = Path('assets/css/football/football-standalone.css')

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
standalone = standalone_path.read_text(encoding='utf-8')

# 1) Campo efetivamente maior: preserva a coordenada normalizada 0..100 para compatibilidade,
# mas converte a velocidade dos jogadores para uma metragem maior. Assim atravessar o gramado
# leva mais tempo sem destruir passe, chute, colisão e IA já estabilizados.
anchor = '  const FOOTBALL_OUTFIELD_PACE = 0.78;\n'
assert anchor in js, 'FOOTBALL_OUTFIELD_PACE anchor not found'
insert = '''  const FOOTBALL_OUTFIELD_PACE = 0.78;\n  // V3.9: a simulação continua normalizada em 0..100, mas o gramado agora representa\n  // uma área física maior. A bola preserva a velocidade aprovada; jogadores precisam\n  // percorrer mais espaço para atravessar o campo, abrindo linhas e profundidade.\n  const FOOTBALL_PITCH_SCALE_X = 1.22;\n  const FOOTBALL_PITCH_SCALE_Y = 1.12;\n'''
js = js.replace(anchor, insert, 1)

old_move = '''    const dx = targetX - player.x;\n    const dy = targetY - player.y;\n    const length = Math.hypot(dx, dy) || 1;\n    if (length > .05) {\n      player.facingX = dx / length;\n      player.facingY = dy / length;\n    }\n    const movementScale = player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE;\n    const step = Math.min(length, speed * movementScale * recoveryScale * dt);\n    player.x += dx / length * step;\n    player.y += dy / length * step;'''
new_move = '''    const dx = targetX - player.x;\n    const dy = targetY - player.y;\n    const length = Math.hypot(dx, dy) || 1;\n    const pitchLength = Math.hypot(dx * FOOTBALL_PITCH_SCALE_X, dy * FOOTBALL_PITCH_SCALE_Y) || 1;\n    if (length > .05) {\n      player.facingX = dx / length;\n      player.facingY = dy / length;\n    }\n    const movementScale = player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE;\n    const step = Math.min(pitchLength, speed * movementScale * recoveryScale * dt);\n    player.x += dx / pitchLength * step;\n    player.y += dy / pitchLength * step;'''
assert old_move in js, 'footballMoveToward block not found'
js = js.replace(old_move, new_move, 1)

old_receiver = '''    const facing = getFootballFacing(player);\n    const speed = Number(player.speed || 0) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);\n    return { x:facing.x * speed, y:facing.y * speed, moving:speed > .1 };'''
new_receiver = '''    const facing = getFootballFacing(player);\n    const speed = Number(player.speed || 0) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);\n    const pitchLength = Math.hypot(facing.x * FOOTBALL_PITCH_SCALE_X, facing.y * FOOTBALL_PITCH_SCALE_Y) || 1;\n    return { x:facing.x / pitchLength * speed, y:facing.y / pitchLength * speed, moving:speed > .1 };'''
assert old_receiver in js, 'receiver velocity block not found'
js = js.replace(old_receiver, new_receiver, 1)

old_controlled = '''    const len = Math.hypot(dx, dy) || 1;\n    if (dx || dy) {\n      controlled.facingX = dx / len;\n      controlled.facingY = dy / len;\n      const recoveryScale = now < Number(controlled.recoverUntil || 0) ? .28 : 1;\n      controlled.x += dx / len * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;\n      controlled.y += dy / len * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;'''
new_controlled = '''    const len = Math.hypot(dx, dy) || 1;\n    const pitchLength = Math.hypot(dx * FOOTBALL_PITCH_SCALE_X, dy * FOOTBALL_PITCH_SCALE_Y) || 1;\n    if (dx || dy) {\n      controlled.facingX = dx / len;\n      controlled.facingY = dy / len;\n      const recoveryScale = now < Number(controlled.recoverUntil || 0) ? .28 : 1;\n      controlled.x += dx / pitchLength * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;\n      controlled.y += dy / pitchLength * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;'''
assert old_controlled in js, 'controlled movement block not found'
js = js.replace(old_controlled, new_controlled, 1)

# 2) Troca manual: não muda automaticamente de defensor enquanto o rival/bola solta estão em jogo.
old_auto = '''    const ownPassInFlight = !possession && ball.lastTouchTeam === "voltz" && Boolean(ball.passTargetId);\n    if (possession !== "voltz" && !ownPassInFlight && now >= g.autoSelectAt) {\n      const nearest = voltzOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0];\n      if (nearest) g.controlledId = nearest.id;\n      g.autoSelectAt = now + 260;\n    }\n'''
new_auto = '''    // V3.9: sem a bola, a seleção é manual pelo Q. O controle só troca\n    // automaticamente quando um jogador Voltz realmente recebe a posse.\n'''
assert old_auto in js, 'automatic selection block not found'
js = js.replace(old_auto, new_auto, 1)

primary_anchor = '''  function footballPrimaryAction() {\n'''
assert primary_anchor in js, 'footballPrimaryAction anchor not found'
switch_fn = '''  function footballSwitchPlayer() {\n    const g = state.current;\n    if (!g || g.type !== "football" || g.phase !== "play") return;\n    const owner = getFootballOwner(g);\n    if (owner?.team === "voltz") {\n      g.controlledId = owner.id;\n      g.feedback = `#${owner.number} está com a bola. O controle acompanha a posse.`;\n      return;\n    }\n\n    const outfield = getFootballTeam(g, "voltz", false);\n    if (!outfield.length) return;\n    const currentIndex = Math.max(0, outfield.findIndex((player) => player.id === g.controlledId));\n    const next = outfield[(currentIndex + 1) % outfield.length] || outfield[0];\n    g.controlledId = next.id;\n    g.feedback = `Troca manual: você agora controla #${next.number}.`;\n    g.banner = `CONTROLE #${next.number}`;\n    sportSfx("menuMove");\n  }\n\n'''
js = js.replace(primary_anchor, switch_fn + primary_anchor, 1)

# 3) HUD/control strip com Q.
old_controls = '''<span><b>WASD</b> MOVER</span>\n<button type="button" onclick="VoltzSports.footballPrimaryAction()"><b>J</b> CHUTE / BOTE</button>'''
new_controls = '''<span><b>WASD</b> MOVER</span>\n<button type="button" onclick="VoltzSports.footballSwitchPlayer()"><b>Q</b> TROCAR</button>\n<button type="button" onclick="VoltzSports.footballPrimaryAction()"><b>J</b> CHUTE / BOTE</button>'''
assert old_controls in js, 'football controls markup not found'
js = js.replace(old_controls, new_controls, 1)

old_keys = '''      if (["j","k","l","i"].includes(key)) {\n        event.preventDefault();\n        if (!event.repeat) {\n          if (key === "j") footballPrimaryAction();\n          else if (key === "k") footballPass();\n          else if (key === "l") footballCross();\n          else activateFootballVision();\n        }\n      }'''
new_keys = '''      if (["q","j","k","l","i"].includes(key)) {\n        event.preventDefault();\n        if (!event.repeat) {\n          if (key === "q") footballSwitchPlayer();\n          else if (key === "j") footballPrimaryAction();\n          else if (key === "k") footballPass();\n          else if (key === "l") footballCross();\n          else activateFootballVision();\n        }\n      }'''
assert old_keys in js, 'football key handler block not found'
js = js.replace(old_keys, new_keys, 1)

old_export = '''    footballPrimaryAction,\n    footballTackle,\n    footballPass,'''
new_export = '''    footballPrimaryAction,\n    footballTackle,\n    footballSwitchPlayer,\n    footballPass,'''
assert old_export in js, 'VoltzSports export block not found'
js = js.replace(old_export, new_export, 1)

# 4) Gol maior e finalizações com cantos realmente disponíveis.
replacements = {
    '    const inGoalMouth = ball.y >= 36 && ball.y <= 64;': '    const inGoalMouth = ball.y >= 32 && ball.y <= 68;',
    '    if (state.pressed.has("w") || state.pressed.has("arrowup")) targetY = 39;': '    if (state.pressed.has("w") || state.pressed.has("arrowup")) targetY = 35;',
    '    else if (state.pressed.has("s") || state.pressed.has("arrowdown")) targetY = 61;': '    else if (state.pressed.has("s") || state.pressed.has("arrowdown")) targetY = 65;',
    '    else targetY = owner.y < 50 ? 42 : owner.y > 50 ? 58 : (Math.random() > .5 ? 42 : 58);': '    else targetY = owner.y < 50 ? 39 : owner.y > 50 ? 61 : (Math.random() > .5 ? 39 : 61);',
    '    footballLaunchBall(g, owner, 104, clamp(targetY + spread, 34, 66), speed, performance.now(), { isShot:true });': '    footballLaunchBall(g, owner, 104, clamp(targetY + spread, 31.5, 68.5), speed, performance.now(), { isShot:true });',
    '    const targetY = Math.random() > .5 ? 40 : 60;': '    const targetY = Math.random() > .5 ? 36 : 64;',
    '        parts.push(`<line class="vision-shot" x1="${owner.x}" y1="${owner.y}" x2="99" y2="41"></line>`);': '        parts.push(`<line class="vision-shot" x1="${owner.x}" y1="${owner.y}" x2="99" y2="35"></line>`);',
    '        parts.push(`<line class="vision-shot" x1="${owner.x}" y1="${owner.y}" x2="99" y2="59"></line>`);': '        parts.push(`<line class="vision-shot" x1="${owner.x}" y1="${owner.y}" x2="99" y2="65"></line>`);'
}
for old, new in replacements.items():
    assert old in js, f'missing replacement: {old[:80]}'
    js = js.replace(old, new, 1)

# Ajuste visual compartilhado do gol/área (também deixa a versão de campeonato coerente).
css_replacements = {
    '.football-box { position:absolute;z-index:1;top:27%;height:46%;width:15%;border:2px solid rgba(230,255,242,.48);pointer-events:none; }': '.football-box { position:absolute;z-index:1;top:23%;height:54%;width:17%;border:2px solid rgba(230,255,242,.48);pointer-events:none; }',
    '.football-goal { position:absolute;z-index:1;top:38%;height:24%;width:3.2%;border:2px solid rgba(230,255,242,.62);background:repeating-linear-gradient(45deg, transparent 0 7px, rgba(255,255,255,.07) 8px 9px); }': '.football-goal { position:absolute;z-index:1;top:32%;height:36%;width:4.2%;border:2px solid rgba(230,255,242,.68);background:repeating-linear-gradient(45deg, transparent 0 7px, rgba(255,255,255,.08) 8px 9px); }',
    '.football-control-strip { grid-template-columns:repeat(5,minmax(0,1fr)); }': '.football-control-strip { grid-template-columns:repeat(6,minmax(0,1fr)); }'
}
for old, new in css_replacements.items():
    assert old in css, f'missing CSS replacement: {old[:80]}'
    css = css.replace(old, new, 1)

# 5) Standalone: usa quase a tela toda e recebe a primeira projeção top-down 3/4.
marker = '/* Football V3.9 · campo expandido e câmera 3/4 */'
append = r'''

/* Football V3.9 · campo expandido e câmera 3/4 */
.football-standalone-panel .sports-game-topbar {
  display:none !important;
}
.football-standalone-panel .sports-game-shell {
  padding:8px 10px 10px !important;
}
.football-standalone-panel .football-match-card {
  width:min(1780px,calc(100vw - 20px)) !important;
  height:calc(100vh - 18px);
  margin:0 auto !important;
  padding:8px 12px 8px !important;
  gap:4px;
}
.football-standalone-panel .football-live-scoreboard {
  padding:5px 12px !important;
  margin-bottom:4px !important;
}
.football-standalone-panel .football-field-live {
  flex:1 1 auto !important;
  min-height:0 !important;
  aspect-ratio:auto !important;
  border-radius:14px !important;
  transform:perspective(1600px) rotateX(5deg) scale(.985);
  transform-origin:50% 54%;
  clip-path:polygon(1.2% 1%,98.8% 1%,100% 99%,0 99%);
  box-shadow:inset 0 0 52px rgba(0,0,0,.30),0 10px 28px rgba(0,0,0,.24) !important;
}
.football-standalone-panel .football-live-hud {
  margin-top:3px !important;
  min-height:28px;
}
.football-standalone-panel .football-live-feedback {
  min-height:28px !important;
  font-size:.68rem !important;
}
.football-standalone-panel .football-control-strip {
  margin-top:4px !important;
  gap:5px !important;
  grid-template-columns:repeat(6,minmax(0,1fr)) !important;
}
.football-standalone-panel .football-control-strip span,
.football-standalone-panel .football-control-strip button {
  min-height:35px !important;
  font-size:.60rem !important;
  border-radius:8px !important;
}
/* Jogadores menores em relação ao novo gramado: o campo ganha leitura e corredor. */
.football-standalone-panel .football-live-player.is-svg-avatar {
  width:52px !important;
  height:63px !important;
}
.football-standalone-panel .football-live-player.is-svg-avatar.is-keeper {
  width:56px !important;
  height:67px !important;
}
.football-standalone-panel .football-live-player.is-svg-avatar .football-user-avatar-shell {
  width:50px !important;
  height:61px !important;
}
.football-standalone-panel .football-live-player.is-svg-avatar.is-keeper .football-user-avatar-shell {
  width:54px !important;
  height:65px !important;
}
.football-standalone-panel .football-live-player.is-svg-avatar .football-player-shadow {
  width:33px !important;
  height:11px !important;
}
.football-standalone-panel .football-live-player.is-svg-avatar.is-controlled::before {
  width:38px !important;
  height:15px !important;
}
@media(max-width:900px){
  .football-standalone-panel .football-control-strip {
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  }
  .football-standalone-panel .football-match-card {
    width:calc(100vw - 12px) !important;
    height:calc(100vh - 12px);
    padding:6px !important;
  }
  .football-standalone-panel .football-field-live {
    transform:perspective(1200px) rotateX(4deg) scale(.99);
  }
}
'''
if marker not in standalone:
    standalone += append

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
standalone_path.write_text(standalone, encoding='utf-8')
