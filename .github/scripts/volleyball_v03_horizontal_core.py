from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/volleyball/volleyball-standalone.css')
volley_html_path = Path('volleyball.html')

sports = sports_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
volley_html = volley_html_path.read_text(encoding='utf-8')


def replace_function(source, name, next_name, replacement):
    start = source.find(f'  function {name}(')
    end = source.find(f'  function {next_name}(', start)
    if start < 0 or end < 0:
        raise SystemExit(f'marcadores ausentes: {name} -> {next_name}')
    return source[:start] + replacement.rstrip() + '\n\n' + source[end:]

input_fn = r'''  function volleyballInputVector() {
    // Camera horizontal: na tela A/D percorrem a quadra da esquerda para a direita,
    // enquanto W/S percorrem as faixas superior e inferior. A fisica interna
    // continua intacta e recebe o vetor ja convertido para suas coordenadas.
    let x = 0;
    let y = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) y -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) y += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) x += 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) x -= 1;
    const length = Math.hypot(x, y) || 1;
    return { x:x / length, y:y / length, moving:Boolean(x || y) };
  }'''

sync_fn = r'''  function volleyballWorldToScreen(point, lift = 0) {
    // Gira apenas a camera: rival = esquerda, Voltz = direita, rede vertical.
    return {
      left: clamp(Number(point?.y || 0), 0, 100),
      top: clamp(100 - Number(point?.x || 0) - Number(lift || 0), 0, 100)
    };
  }

  function syncVolleyballDynamicDom(now) {
    const g = state.current;
    if (!g?.dynamic) return;
    const dom = getVolleyballDynamicDom();
    if (!dom.court) return;

    g.players.forEach((player) => {
      const el = document.getElementById(`volleyballPlayer-${player.id}`);
      if (!el) return;
      const screen = volleyballWorldToScreen(player);
      el.style.left = `${screen.left}%`;
      el.style.top = `${screen.top}%`;
      const active = player.id === g.activePlayerId;
      el.classList.toggle("is-active", active);
      el.classList.toggle("can-touch", active && g.phase === "rally" && g.ball.inPlay && volleyballDistance(player, g.ball) <= 10.5 && g.ball.z <= 27);
    });

    const ball = g.ball;
    if (dom.ball && ball) {
      const screen = volleyballWorldToScreen(ball, Math.max(0, ball.z) * .30);
      const scale = 1 + Math.min(1.15, Math.max(0, ball.z) * .024);
      dom.ball.style.left = `${screen.left}%`;
      dom.ball.style.top = `${screen.top}%`;
      dom.ball.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;
      dom.ball.classList.toggle("in-play", Boolean(ball.inPlay));
    }

    if (dom.shadow && ball) {
      const screen = volleyballWorldToScreen(ball);
      dom.shadow.style.left = `${screen.left}%`;
      dom.shadow.style.top = `${screen.top}%`;
      const shadowScale = clamp(1 - ball.z / 45, .28, 1);
      dom.shadow.style.transform = `translate(-50%,-50%) scale(${shadowScale.toFixed(3)})`;
      dom.shadow.style.opacity = ball.inPlay ? String(clamp(.78 - ball.z / 58, .18, .72)) : "0";
    }

    const landing = volleyballLanding(ball);
    const incomingVoltz = ball?.inPlay && landing && landing.y > 50 && g.lastTouchTeam !== "voltz";
    if (dom.landing) {
      dom.landing.classList.toggle("visible", Boolean(incomingVoltz));
      if (incomingVoltz) {
        const screen = volleyballWorldToScreen({
          x:clamp(landing.x, 7, 93),
          y:clamp(landing.y, 53, 94)
        });
        dom.landing.style.left = `${screen.left}%`;
        dom.landing.style.top = `${screen.top}%`;
      }
    }

    if (dom.feedback && dom.feedback.textContent !== g.message) dom.feedback.textContent = g.message || "";
    if (dom.scoreV) dom.scoreV.textContent = String(g.score);
    if (dom.scoreR) dom.scoreR.textContent = String(g.rivalScore);
    if (dom.touches) dom.touches.textContent = `${volleyballTouchesFor(g, "voltz")}/3`;
    if (dom.status) {
      const active = volleyballPlayer(g, g.activePlayerId);
      const status = g.phase === "serve-voltz" ? "SEU SAQUE"
        : g.phase === "serve-rival" ? "SAQUE VISITANTE"
          : g.phase === "point" ? "PONTO"
            : `${g.controlReason || "RALLY"}${active ? ` · ${active.role}` : ""}`;
      dom.status.textContent = status;
    }
  }'''

sports = replace_function(sports, 'volleyballInputVector', 'volleyballMoveToward', input_fn)
sports = replace_function(sports, 'syncVolleyballDynamicDom', 'updateVolleyballDynamic', sync_fn)

sports = sports.replace(
    '    const attackSide = attacker.x < 42 ? "ESQUERDA" : attacker.x > 58 ? "DIREITA" : "MEIO";',
    '    const attackSide = attacker.x < 42 ? "FAIXA INFERIOR" : attacker.x > 58 ? "FAIXA SUPERIOR" : "MEIO";'
)

css_marker = '/* Volei V0.3 · camera top-down horizontal */'
if css_marker not in css:
    css += r'''

/* Volei V0.3 · camera top-down horizontal */
.volleyball-dynamic-court {
  width:min(1080px,100%);
  aspect-ratio:16/8.6;
  background:
    linear-gradient(180deg, transparent 49.8%, rgba(255,255,255,.055) 50%, transparent 50.2%),
    linear-gradient(90deg, rgba(255,107,122,.075) 0 49.5%, rgba(99,245,181,.085) 50.5% 100%),
    repeating-linear-gradient(0deg, rgba(255,255,255,.016) 0 58px, rgba(255,255,255,.034) 59px 60px),
    #07131a;
  box-shadow:inset 0 0 70px rgba(0,0,0,.34),0 18px 55px rgba(0,0,0,.24);
}
.volleyball-dynamic-net {
  left:50%; right:auto; top:4%; bottom:4%; width:8px; height:auto;
  transform:translateX(-50%);
}
.volleyball-dynamic-net::before,
.volleyball-dynamic-net::after { left:-10px; top:auto; width:28px; height:5px; }
.volleyball-dynamic-net::before { top:-3px; }
.volleyball-dynamic-net::after { bottom:-3px; }
.volleyball-dynamic-net i {
  left:8px; right:auto; top:0; bottom:0; width:12px; height:auto;
  background:repeating-linear-gradient(180deg,#fff 0 1px,transparent 1px 12px);
}
.volleyball-attack-line {
  top:5%; bottom:5%; height:auto; width:1px; border-top:0;
  border-left:1px dashed rgba(255,255,255,.13);
}
.volleyball-attack-line.line-rival { left:34%; right:auto; }
.volleyball-attack-line.line-voltz { left:66%; right:auto; }
.volleyball-side-label { top:10px; bottom:auto; }
.volleyball-side-label.rival { left:12px; right:auto; top:10px; }
.volleyball-side-label.voltz { left:auto; right:12px; top:10px; bottom:auto; }

.volleyball-dynamic-player {
  width:24px; height:38px; border-radius:11px 11px 9px 9px;
  box-shadow:0 8px 10px rgba(0,0,0,.28),0 0 15px rgba(99,245,181,.12);
}
.volleyball-dynamic-player::before {
  content:""; position:absolute; left:50%; top:-9px; width:15px; height:15px;
  transform:translateX(-50%); border-radius:50%; background:inherit;
  border:2px solid currentColor; box-shadow:0 3px 5px rgba(0,0,0,.24);
}
.volleyball-dynamic-player span { top:43px; }
.volleyball-dynamic-player.is-active {
  width:30px; height:44px; color:#fff;
  box-shadow:0 9px 12px rgba(0,0,0,.32),0 0 0 7px rgba(69,163,255,.12),0 0 24px rgba(69,163,255,.52);
}
.volleyball-dynamic-player.can-touch {
  box-shadow:0 9px 12px rgba(0,0,0,.3),0 0 0 9px rgba(255,209,102,.14),0 0 28px rgba(255,209,102,.62);
}
.volleyball-ball-shadow { width:18px; height:10px; }
.volleyball-landing-marker { width:30px; height:54px; }

@media(max-width:700px){
  .volleyball-dynamic-court { aspect-ratio:16/10.5; }
  .volleyball-dynamic-player { width:21px; height:33px; }
  .volleyball-dynamic-player.is-active { width:27px; height:39px; }
  .volleyball-dynamic-player span { top:38px; }
}
'''

volley_html = volley_html.replace('volleyball-v03"', 'volleyball-v03-horizontal"')
volley_html = volley_html.replace('volleyball-v03\"', 'volleyball-v03-horizontal\"')

sports_path.write_text(sports, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
volley_html_path.write_text(volley_html, encoding='utf-8')
