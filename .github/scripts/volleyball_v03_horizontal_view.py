from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/volleyball/volleyball-standalone.css')
volley_html_path = Path('volleyball.html')
game_html_path = Path('game.html')

sports = sports_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
volley_html = volley_html_path.read_text(encoding='utf-8')
game_html = game_html_path.read_text(encoding='utf-8')

old_input = '''  function volleyballInputVector() {\n    let x = 0;\n    let y = 0;\n    if (state.pressed.has("a") || state.pressed.has("arrowleft")) x -= 1;\n    if (state.pressed.has("d") || state.pressed.has("arrowright")) x += 1;\n    if (state.pressed.has("w") || state.pressed.has("arrowup")) y -= 1;\n    if (state.pressed.has("s") || state.pressed.has("arrowdown")) y += 1;\n    const length = Math.hypot(x, y) || 1;\n    return { x:x / length, y:y / length, moving:Boolean(x || y) };\n  }\n'''
new_input = '''  function volleyballInputVector() {\n    // A logica interna continua usando x = largura da quadra e y = profundidade.\n    // A camera horizontal gira essa leitura na tela: esquerda/direita movem na\n    // profundidade e cima/baixo percorrem as faixas laterais da quadra.\n    let x = 0;\n    let y = 0;\n    if (state.pressed.has("a") || state.pressed.has("arrowleft")) y -= 1;\n    if (state.pressed.has("d") || state.pressed.has("arrowright")) y += 1;\n    if (state.pressed.has("w") || state.pressed.has("arrowup")) x += 1;\n    if (state.pressed.has("s") || state.pressed.has("arrowdown")) x -= 1;\n    const length = Math.hypot(x, y) || 1;\n    return { x:x / length, y:y / length, moving:Boolean(x || y) };\n  }\n'''
if old_input not in sports:
    raise SystemExit('volleyballInputVector antigo nao encontrado')
sports = sports.replace(old_input, new_input, 1)

marker = '  function syncVolleyballDynamicDom(now) {'
if marker not in sports:
    raise SystemExit('syncVolleyballDynamicDom nao encontrado')
helper = '''  function volleyballWorldToScreen(point, lift = 0) {\n    // Camera horizontal: rival fica a esquerda, Voltz a direita e a rede vira\n    // uma linha vertical. A fisica permanece no mesmo sistema de coordenadas.\n    return {\n      left: clamp(Number(point?.y || 0), 0, 100),\n      top: clamp(100 - Number(point?.x || 0) - Number(lift || 0), 0, 100)\n    };\n  }\n\n'''
sports = sports.replace(marker, helper + marker, 1)

old_players = '''      el.style.left = `${player.x}%`;\n      el.style.top = `${player.y}%`;\n'''
new_players = '''      const screen = volleyballWorldToScreen(player);\n      el.style.left = `${screen.left}%`;\n      el.style.top = `${screen.top}%`;\n'''
if old_players not in sports:
    raise SystemExit('posicionamento visual dos jogadores nao encontrado')
sports = sports.replace(old_players, new_players, 1)

old_ball = '''    const ball = g.ball;\n    if (dom.ball && ball) {\n      const visualY = ball.y - Math.max(0, ball.z) * .30;\n      const scale = 1 + Math.min(1.15, Math.max(0, ball.z) * .024);\n      dom.ball.style.left = `${ball.x}%`;\n      dom.ball.style.top = `${visualY}%`;\n      dom.ball.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;\n      dom.ball.classList.toggle("in-play", Boolean(ball.inPlay));\n    }\n    if (dom.shadow && ball) {\n      dom.shadow.style.left = `${ball.x}%`;\n      dom.shadow.style.top = `${ball.y}%`;\n      const shadowScale = clamp(1 - ball.z / 45, .28, 1);\n      dom.shadow.style.transform = `translate(-50%,-50%) scale(${shadowScale.toFixed(3)})`;\n      dom.shadow.style.opacity = ball.inPlay ? String(clamp(.78 - ball.z / 58, .18, .72)) : "0";\n    }\n'''
new_ball = '''    const ball = g.ball;\n    if (dom.ball && ball) {\n      const screen = volleyballWorldToScreen(ball, Math.max(0, ball.z) * .30);\n      const scale = 1 + Math.min(1.15, Math.max(0, ball.z) * .024);\n      dom.ball.style.left = `${screen.left}%`;\n      dom.ball.style.top = `${screen.top}%`;\n      dom.ball.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;\n      dom.ball.classList.toggle("in-play", Boolean(ball.inPlay));\n    }\n    if (dom.shadow && ball) {\n      const screen = volleyballWorldToScreen(ball);\n      dom.shadow.style.left = `${screen.left}%`;\n      dom.shadow.style.top = `${screen.top}%`;\n      const shadowScale = clamp(1 - ball.z / 45, .28, 1);\n      dom.shadow.style.transform = `translate(-50%,-50%) scale(${shadowScale.toFixed(3)})`;\n      dom.shadow.style.opacity = ball.inPlay ? String(clamp(.78 - ball.z / 58, .18, .72)) : "0";\n    }\n'''
if old_ball not in sports:
    raise SystemExit('bloco visual da bola nao encontrado')
sports = sports.replace(old_ball, new_ball, 1)

old_landing = '''      if (incomingVoltz) {\n        dom.landing.style.left = `${clamp(landing.x, 7, 93)}%`;\n        dom.landing.style.top = `${clamp(landing.y, 53, 94)}%`;\n      }\n'''
new_landing = '''      if (incomingVoltz) {\n        const screen = volleyballWorldToScreen({\n          x:clamp(landing.x, 7, 93),\n          y:clamp(landing.y, 53, 94)\n        });\n        dom.landing.style.left = `${screen.left}%`;\n        dom.landing.style.top = `${screen.top}%`;\n      }\n'''
if old_landing not in sports:
    raise SystemExit('marcador de queda nao encontrado')
sports = sports.replace(old_landing, new_landing, 1)

old_side = '    const attackSide = attacker.x < 42 ? "ESQUERDA" : attacker.x > 58 ? "DIREITA" : "MEIO";\n'
new_side = '    const attackSide = attacker.x < 42 ? "FAIXA INFERIOR" : attacker.x > 58 ? "FAIXA SUPERIOR" : "MEIO";\n'
if old_side in sports:
    sports = sports.replace(old_side, new_side, 1)

css_override = r'''

/* Volei V0.3 · camera top-down horizontal */
.volleyball-dynamic-court {
  width:min(1080px,100%);
  aspect-ratio:16/8.6;
  background:
    linear-gradient(180deg, transparent 49.8%, rgba(255,255,255,.055) 50%, transparent 50.2%),
    linear-gradient(90deg, rgba(255,107,122,.075) 0 49.5%, rgba(99,245,181,.085) 50.5% 100%),
    repeating-linear-gradient(0deg, rgba(255,255,255,.016) 0 58px, rgba(255,255,255,.034) 59px 60px),
    #07131a;
  box-shadow:inset 0 0 70px rgba(0,0,0,.34), 0 18px 55px rgba(0,0,0,.24);
}

.volleyball-dynamic-net {
  left:50%; right:auto; top:4%; bottom:4%;
  width:8px; height:auto;
  transform:translateX(-50%);
}
.volleyball-dynamic-net::before,
.volleyball-dynamic-net::after {
  left:-10px; top:auto; width:28px; height:5px;
}
.volleyball-dynamic-net::before { top:-3px; }
.volleyball-dynamic-net::after { bottom:-3px; }
.volleyball-dynamic-net i {
  left:8px; right:auto; top:0; bottom:0;
  width:12px; height:auto;
  background:repeating-linear-gradient(180deg,#fff 0 1px,transparent 1px 12px);
}

.volleyball-attack-line {
  top:5%; bottom:5%; height:auto; width:1px;
  border-top:0; border-left:1px dashed rgba(255,255,255,.13);
}
.volleyball-attack-line.line-rival { left:34%; right:auto; }
.volleyball-attack-line.line-voltz { left:66%; right:auto; }

.volleyball-side-label { top:10px; bottom:auto; }
.volleyball-side-label.rival { left:12px; right:auto; top:10px; }
.volleyball-side-label.voltz { left:auto; right:12px; top:10px; bottom:auto; }

/* Personagens mais proximos de uma leitura top-down de jogo e menos de pecas. */
.volleyball-dynamic-player {
  width:24px; height:38px;
  border-radius:11px 11px 9px 9px;
  box-shadow:0 8px 10px rgba(0,0,0,.28), 0 0 15px rgba(99,245,181,.12);
}
.volleyball-dynamic-player::before {
  content:"";
  position:absolute; left:50%; top:-9px;
  width:15px; height:15px;
  transform:translateX(-50%);
  border-radius:50%;
  background:inherit;
  border:2px solid currentColor;
  box-shadow:0 3px 5px rgba(0,0,0,.24);
}
.volleyball-dynamic-player span { top:43px; }
.volleyball-dynamic-player.is-active {
  width:30px; height:44px;
  color:#fff;
  box-shadow:0 9px 12px rgba(0,0,0,.32), 0 0 0 7px rgba(69,163,255,.12), 0 0 24px rgba(69,163,255,.52);
}
.volleyball-dynamic-player.can-touch {
  box-shadow:0 9px 12px rgba(0,0,0,.3), 0 0 0 9px rgba(255,209,102,.14), 0 0 28px rgba(255,209,102,.62);
}

.volleyball-ball-shadow {
  width:18px; height:10px;
}
.volleyball-landing-marker {
  width:30px; height:54px;
}

@media(max-width:700px){
  .volleyball-dynamic-court { aspect-ratio:16/10.5; }
  .volleyball-dynamic-player { width:21px; height:33px; }
  .volleyball-dynamic-player.is-active { width:27px; height:39px; }
  .volleyball-dynamic-player span { top:38px; }
}
'''
if '/* Volei V0.3 · camera top-down horizontal */' not in css:
    css += css_override

for old, new in [
    ('volleyball-standalone.css?v=volleyball-v03', 'volleyball-standalone.css?v=volleyball-v03-horizontal'),
    ('sports-minigames.js?v=volleyball-v03', 'sports-minigames.js?v=volleyball-v03-horizontal')
]:
    volley_html = volley_html.replace(old, new)
    game_html = game_html.replace(old, new)

sports_path.write_text(sports, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
volley_html_path.write_text(volley_html, encoding='utf-8')
game_html_path.write_text(game_html, encoding='utf-8')
