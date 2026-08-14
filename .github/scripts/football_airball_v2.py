from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/sports-minigames.css')
s = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'anchor not found: {label}')
    s = s.replace(old, new, 1)


rep(
    'football: "Escolha um canto e use a barra de força. O goleiro também escolhe uma direção; força ruim ou leitura errada pode matar a cobrança.",',
    'football: "Partida 3v3 com goleiros. WASD move, J chuta, K toca, L cruza e I ativa a Voltz Vision para ler espaços e linhas de passe.",',
    'football intro'
)

rep(
    'x:26, y:50, vx:0, vy:0, ownerId:"v1", lastTouchTeam:"voltz",\n        passTargetId:null, isShot:false, ignorePickupUntil:0, keeperReleaseAt:0',
    'x:26, y:50, z:0, vx:0, vy:0, vz:0, ownerId:"v1", lastTouchTeam:"voltz",\n        passTargetId:null, isShot:false, isCross:false, airborne:false, landingX:null, landingY:null,\n        ignorePickupUntil:0, keeperReleaseAt:0',
    'ball state'
)

rep(
    '<div id="footballBall" class="football-live-ball" aria-label="Bola"></div>\n<div id="footballPassTarget" class="football-pass-target" aria-hidden="true"></div>',
    '<div id="footballBallShadow" class="football-ball-shadow" aria-hidden="true"></div>\n<div id="footballBall" class="football-live-ball" aria-label="Bola"></div>\n<div id="footballPassTarget" class="football-pass-target" aria-hidden="true"></div>',
    'ball shadow markup'
)

rep(
    '<div id="footballVisionStatus" class="football-vision-status">L · VOLTZ VISION PRONTA</div>',
    '<div id="footballVisionStatus" class="football-vision-status">I · VOLTZ VISION PRONTA</div>',
    'vision hud key'
)

rep(
    '<button type="button" onclick="VoltzSports.footballPass()"><b>K</b> PASSE</button>\n<button type="button" onclick="VoltzSports.activateFootballVision()"><b>L</b> VOLTZ VISION</button>',
    '<button type="button" onclick="VoltzSports.footballPass()"><b>K</b> TOCAR</button>\n<button type="button" onclick="VoltzSports.footballCross()"><b>L</b> CRUZAR</button>\n<button type="button" onclick="VoltzSports.activateFootballVision()"><b>I</b> VOLTZ VISION</button>',
    'control buttons'
)

rep(
    'g.ball.isShot = false;\n    g.ball.vx = 0;\n    g.ball.vy = 0;\n    g.ball.x = player.x;\n    g.ball.y = player.y;',
    'g.ball.isShot = false;\n    g.ball.isCross = false;\n    g.ball.airborne = false;\n    g.ball.z = 0;\n    g.ball.vx = 0;\n    g.ball.vy = 0;\n    g.ball.vz = 0;\n    g.ball.landingX = null;\n    g.ball.landingY = null;\n    g.ball.x = player.x;\n    g.ball.y = player.y;',
    'possession air reset'
)

rep(
    'g.ball.passTargetId = options.passTargetId || null;\n    g.ball.isShot = Boolean(options.isShot);\n    g.ball.ignorePickupUntil = now + (options.isShot ? 180 : 120);',
    'g.ball.passTargetId = options.passTargetId || null;\n    g.ball.isShot = Boolean(options.isShot);\n    g.ball.isCross = Boolean(options.isCross);\n    g.ball.airborne = Boolean(options.airborne);\n    g.ball.z = Number(options.z || 0);\n    g.ball.vz = Number(options.vz || 0);\n    g.ball.landingX = Number.isFinite(options.landingX) ? options.landingX : targetX;\n    g.ball.landingY = Number.isFinite(options.landingY) ? options.landingY : targetY;\n    g.ball.ignorePickupUntil = now + (options.isShot ? 180 : options.airborne ? 210 : 120);',
    'launch air options'
)

anchor = '  function shootFootball() {\n'
if anchor not in s:
    raise SystemExit('anchor not found: shoot function')

cross_fn = '''  function footballCross() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (!owner || owner.team !== "voltz" || owner.keeper || owner.id !== g.controlledId) {
      g.feedback = "Você precisa estar com a bola para cruzar.";
      return;
    }

    const teammates = getFootballTeam(g, "voltz", false).filter((player) => player.id !== owner.id);
    if (!teammates.length) return;
    const target = teammates
      .map((player) => {
        const forward = player.x - owner.x;
        const boxBonus = player.x >= 62 ? 24 : 0;
        const separation = Math.abs(player.y - owner.y) * .45;
        const marker = Math.min(...getFootballTeam(g, "rival", false).map((rival) => footballDistance(rival, player)));
        return { player, score: forward * 1.2 + boxBonus + separation + marker };
      })
      .sort((a, b) => b.score - a.score)[0]?.player || teammates[0];

    const landingX = clamp(Math.max(owner.x + 26, target.x + 7), 58, 91);
    const landingY = clamp(target.y + (target.y < 50 ? 3 : -3), 22, 78);
    const distance = Math.hypot(landingX - owner.x, landingY - owner.y);
    const speed = clamp(distance / 1.45, 30, 46);
    footballLaunchBall(g, owner, landingX, landingY, speed, performance.now(), {
      passTargetId: target.id,
      isCross: true,
      airborne: true,
      vz: 23,
      landingX,
      landingY
    });
    g.feedback = `Cruzamento para a área buscando #${target.number}. A bola vai disputar pelo alto.`;
    g.banner = "CRUZAMENTO";
    sportSfx("throwCurve");
  }

'''
s = s.replace(anchor, cross_fn + anchor, 1)

old_keeper = '''      if (owner.keeper && now >= ball.keeperReleaseAt) {
        const teammates = getFootballTeam(g, owner.team, false);
        const target = teammates.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner))[0];
        if (target) {
footballLaunchBall(g, owner, target.x, target.y, 42, now, { passTargetId: target.id });
if (owner.team === "voltz") g.controlledId = target.id;
        }
        return;
      }'''

new_keeper = '''      if (owner.keeper && now >= ball.keeperReleaseAt) {
        const teammates = getFootballTeam(g, owner.team, false);
        const opponents = getFootballTeam(g, owner.team === "voltz" ? "rival" : "voltz", false);
        const target = teammates
          .map((mate) => {
            const laneOpen = isFootballPassLaneOpen(g, owner, mate) ? 18 : 0;
            const nearestOpponent = Math.min(...opponents.map((rival) => footballDistance(rival, mate)));
            const distancePenalty = footballDistance(owner, mate) * .25;
            return { mate, score: laneOpen + nearestOpponent * 2 - distancePenalty };
          })
          .sort((a, b) => b.score - a.score)[0]?.mate || teammates[0];
        if (target) {
          const highRelease = !isFootballPassLaneOpen(g, owner, target);
          footballLaunchBall(g, owner, target.x, target.y, highRelease ? 36 : 44, now, {
            passTargetId: target.id,
            airborne: highRelease,
            vz: highRelease ? 14 : 0,
            landingX: target.x,
            landingY: target.y
          });
          if (owner.team === "voltz") g.controlledId = target.id;
          g.feedback = highRelease ? "Seu goleiro evitou a pressão e lançou por cima." : "Seu goleiro encontrou uma saída segura.";
          g.banner = "REPOSIÇÃO SEGURA";
        }
        return;
      }'''
rep(old_keeper, new_keeper, 'keeper distribution')

rep(
    '''    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const damping = Math.pow(.994, dt * 60);
    ball.vx *= damping;
    ball.vy *= damping;
''',
    '''    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.airborne || ball.z > 0) {
      ball.z = Math.max(0, Number(ball.z || 0) + Number(ball.vz || 0) * dt);
      ball.vz = Number(ball.vz || 0) - 31 * dt;
      if (ball.z <= 0 && ball.vz <= 0) {
        ball.z = 0;
        ball.vz = 0;
        ball.airborne = false;
        ball.isCross = false;
      }
    }
    const damping = Math.pow(ball.airborne ? .998 : .994, dt * 60);
    ball.vx *= damping;
    ball.vy *= damping;
''',
    'ball gravity'
)

rep('if (inGoalMouth) footballGoal(g, "voltz");', 'if (inGoalMouth && ball.z <= 4.5) footballGoal(g, "voltz");', 'right goal crossbar')
rep('if (inGoalMouth) footballGoal(g, "rival");', 'if (inGoalMouth && ball.z <= 4.5) footballGoal(g, "rival");', 'left goal crossbar')

old_candidates = '''    const candidates = g.players
      .filter((player) => !player.keeper || (player.team === "voltz" ? ball.x < 15 : ball.x > 85))
      .map((player) => ({ player, distance:footballDistance(player, ball) }))
      .filter((entry) => entry.distance < (entry.player.keeper ? 4.2 : 2.65))
      .sort((a, b) => a.distance - b.distance);'''

new_candidates = '''    const candidates = g.players
      .filter((player) => !player.keeper || (player.team === "voltz" ? ball.x < 15 : ball.x > 85))
      .map((player) => ({ player, distance:footballDistance(player, ball) }))
      .filter((entry) => {
        const maxHeight = entry.player.keeper ? 6.4 : (ball.vz < 0 ? 4.2 : 2.5);
        if (ball.z > maxHeight) return false;
        const radius = entry.player.keeper ? 4.4 : ball.z > 1.4 ? 2.25 : 2.65;
        return entry.distance < radius;
      })
      .sort((a, b) => a.distance - b.distance);'''
rep(old_candidates, new_candidates, 'aerial pickup')

rep(
    ': "Bola dominada.");',
    ': ball.z > 1.2 ? `${receiver.team === "voltz" ? "BOLA ALTA DOMINADA!" : "O visitante ganhou a disputa aérea."}` : "Bola dominada.");',
    'aerial feedback'
)

old_dom = '''    const ballEl = document.getElementById("footballBall");
    if (ballEl) {
      ballEl.style.left = `${g.ball.x}%`;
      ballEl.style.top = `${g.ball.y}%`;
    }
'''

new_dom = '''    const ballEl = document.getElementById("footballBall");
    const ballShadow = document.getElementById("footballBallShadow");
    if (ballEl) {
      const heightPx = Math.min(82, Number(g.ball.z || 0) * 4.2);
      const scale = 1 + Math.min(.34, Number(g.ball.z || 0) * .018);
      ballEl.style.left = `${g.ball.x}%`;
      ballEl.style.top = `${g.ball.y}%`;
      ballEl.style.transform = `translate(-50%, calc(-50% - ${heightPx}px)) scale(${scale})`;
      ballEl.classList.toggle("is-airborne", Number(g.ball.z || 0) > .35);
    }
    if (ballShadow) {
      ballShadow.style.left = `${g.ball.x}%`;
      ballShadow.style.top = `${g.ball.y}%`;
      const height = Number(g.ball.z || 0);
      ballShadow.style.opacity = `${clamp(.34 - height * .012, .08, .34)}`;
      ballShadow.style.transform = `translate(-50%,-50%) scale(${1 + Math.min(.8, height * .035)})`;
    }
'''
rep(old_dom, new_dom, 'ball height dom')

rep('if (visionActive) visionStatus.textContent = "L · VOLTZ VISION ATIVA";', 'if (visionActive) visionStatus.textContent = "I · VOLTZ VISION ATIVA";', 'vision active label')
rep('else if (now < g.visionCooldownUntil) visionStatus.textContent = `L · RECARGA ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s`;', 'else if (now < g.visionCooldownUntil) visionStatus.textContent = `I · RECARGA ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s`;', 'vision cooldown label')
rep('else visionStatus.textContent = "L · VOLTZ VISION PRONTA";', 'else visionStatus.textContent = "I · VOLTZ VISION PRONTA";', 'vision ready label')

old_keys = '''    if (game.type === "football") {
      if (["j","k","l"].includes(key)) {
        event.preventDefault();
        if (!event.repeat) {
          if (key === "j") shootFootball();
          else if (key === "k") footballPass();
          else activateFootballVision();
        }
      }
      return;
    }'''

new_keys = '''    if (game.type === "football") {
      if (["j","k","l","i"].includes(key)) {
        event.preventDefault();
        if (!event.repeat) {
          if (key === "j") shootFootball();
          else if (key === "k") footballPass();
          else if (key === "l") footballCross();
          else activateFootballVision();
        }
      }
      return;
    }'''
rep(old_keys, new_keys, 'football keys')

rep(
    '    footballPass,\n    activateFootballVision,',
    '    footballPass,\n    footballCross,\n    activateFootballVision,',
    'football export'
)

css_add = '''

/* Futebol V2 · bola aérea / cruzamento */
.football-ball-shadow {
  position:absolute;
  z-index:7;
  width:18px;
  height:8px;
  transform:translate(-50%,-50%);
  border-radius:50%;
  background:rgba(0,0,0,.62);
  filter:blur(2px);
  pointer-events:none;
}
.football-live-ball.is-airborne {
  z-index:18;
  box-shadow:0 9px 13px rgba(0,0,0,.26),0 0 10px rgba(255,255,255,.16);
}
.football-control-strip { grid-template-columns:repeat(5,minmax(0,1fr)); }
@media(max-width:820px){
  .football-control-strip { grid-template-columns:repeat(3,minmax(0,1fr)); }
}
'''
if '/* Futebol V2 · bola aérea / cruzamento */' not in css:
    css += css_add

js_path.write_text(s, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
