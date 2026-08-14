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
    'football: "Partida 3v3 com goleiros. WASD move, J chuta, K toca, L cruza e I ativa a Voltz Vision para ler espaços e linhas de passe.",',
    'football: "Partida 3v3 com goleiros. WASD move; J chuta com a bola e dá o bote sem ela; K toca, L cruza e I ativa a Voltz Vision.",',
    'football intro controls'
)

old_players = '''        { id:"v1", team:"voltz", number:"7",  x:24, y:50, homeX:24, homeY:50, speed:22 },
        { id:"v2", team:"voltz", number:"10", x:34, y:28, homeX:34, homeY:28, speed:17 },
        { id:"v3", team:"voltz", number:"11", x:34, y:72, homeX:34, homeY:72, speed:17 },
        { id:"vgk", team:"voltz", number:"GK", x:6, y:50, homeX:6, homeY:50, speed:18, keeper:true },
        { id:"r1", team:"rival", number:"8",  x:76, y:50, homeX:76, homeY:50, speed:16 },
        { id:"r2", team:"rival", number:"6",  x:66, y:28, homeX:66, homeY:28, speed:15 },
        { id:"r3", team:"rival", number:"9",  x:66, y:72, homeX:66, homeY:72, speed:15 },
        { id:"rgk", team:"rival", number:"GK", x:94, y:50, homeX:94, homeY:50, speed:18, keeper:true }'''
new_players = '''        { id:"v1", team:"voltz", number:"7",  x:24, y:50, homeX:24, homeY:50, speed:22, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"v2", team:"voltz", number:"10", x:34, y:28, homeX:34, homeY:28, speed:17, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"v3", team:"voltz", number:"11", x:34, y:72, homeX:34, homeY:72, speed:17, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"vgk", team:"voltz", number:"GK", x:6, y:50, homeX:6, homeY:50, speed:18, keeper:true, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r1", team:"rival", number:"8",  x:76, y:50, homeX:76, homeY:50, speed:16, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r2", team:"rival", number:"6",  x:66, y:28, homeX:66, homeY:28, speed:15, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r3", team:"rival", number:"9",  x:66, y:72, homeX:66, homeY:72, speed:15, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"rgk", team:"rival", number:"GK", x:94, y:50, homeX:94, homeY:50, speed:18, keeper:true, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 }'''
rep(old_players, new_players, 'football player state')
rep('      lastStealAt: 0,', '      lastTackleAt: 0,', 'tackle state')

old_move_toward = '''  function footballMoveToward(player, targetX, targetY, speed, dt) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = Math.hypot(dx, dy) || 1;
    const step = Math.min(length, speed * dt);
    player.x += dx / length * step;
    player.y += dy / length * step;
    player.x = clamp(player.x, player.keeper ? 3.5 : 7, player.keeper ? 96.5 : 93);
    player.y = clamp(player.y, 8, 92);
  }'''
new_move_toward = '''  function footballMoveToward(player, targetX, targetY, speed, dt) {
    const now = performance.now();
    if (now < Number(player.tackleUntil || 0)) return;
    const recoveryScale = now < Number(player.recoverUntil || 0) ? .24 : 1;
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = Math.hypot(dx, dy) || 1;
    if (length > .05) {
      player.facingX = dx / length;
      player.facingY = dy / length;
    }
    const step = Math.min(length, speed * recoveryScale * dt);
    player.x += dx / length * step;
    player.y += dy / length * step;
    if (step > .01) player.movingUntil = now + 120;
    player.x = clamp(player.x, player.keeper ? 3.5 : 7, player.keeper ? 96.5 : 93);
    player.y = clamp(player.y, 8, 92);
  }'''
rep(old_move_toward, new_move_toward, 'move toward facing')

old_markup = '''    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} ${player.keeper ? "is-keeper" : ""}" data-id="${player.id}">
        <span>${player.number}</span>
      </div>`).join("");'''
new_markup = '''    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} ${player.keeper ? "is-keeper" : ""}" data-id="${player.id}">
        <i class="football-player-shadow" aria-hidden="true"></i>
        <div class="football-player-body" aria-hidden="true">
          <i class="football-player-head"></i>
          <i class="football-player-torso"></i>
          <i class="football-player-leg leg-left"></i>
          <i class="football-player-leg leg-right"></i>
          <span>${player.number}</span>
        </div>
      </div>`).join("");'''
rep(old_markup, new_markup, 'player topdown markup')

rep(
    '<button type="button" onclick="VoltzSports.shootFootball()"><b>J</b> CHUTAR</button>',
    '<button type="button" onclick="VoltzSports.footballPrimaryAction()"><b>J</b> CHUTE / BOTE</button>',
    'primary button'
)

anchor = '''  function shootFootball() {
'''
if anchor not in s:
    raise SystemExit('anchor not found: shoot function')

tackle_functions = '''  function getFootballFacing(player, fallbackTarget = null) {
    let fx = Number(player?.facingX || 0);
    let fy = Number(player?.facingY || 0);
    if ((!fx && !fy) && fallbackTarget && player) {
      fx = fallbackTarget.x - player.x;
      fy = fallbackTarget.y - player.y;
    }
    const length = Math.hypot(fx, fy) || 1;
    return { x: fx / length, y: fy / length };
  }

  function executeFootballTackle(g, tackler, now, options = {}) {
    if (!g || !tackler || tackler.keeper || now < Number(tackler.tackleCooldownUntil || 0)) return false;
    const owner = getFootballOwner(g);
    const target = owner && owner.team !== tackler.team && !owner.keeper ? owner : null;
    const fallback = target || g.ball;
    const facing = options.autoAim && fallback
      ? (() => {
          const dx = fallback.x - tackler.x;
          const dy = fallback.y - tackler.y;
          const len = Math.hypot(dx, dy) || 1;
          return { x:dx / len, y:dy / len };
        })()
      : getFootballFacing(tackler, fallback);

    tackler.facingX = facing.x;
    tackler.facingY = facing.y;
    tackler.tackleUntil = now + 250;
    tackler.tackleCooldownUntil = now + (options.ai ? 980 : 820);
    tackler.x = clamp(tackler.x + facing.x * 4.2, 7, 93);
    tackler.y = clamp(tackler.y + facing.y * 4.2, 8, 92);

    if (!target) {
      const looseDistance = footballDistance(tackler, g.ball);
      if (!g.ball.ownerId && Number(g.ball.z || 0) <= 1.3 && looseDistance <= 3.6) {
        footballSetPossession(g, tackler, now, tackler.team === "voltz" ? "BOTE NA BOLA! Você recuperou a posse." : "O rival chegou primeiro na bola solta.");
        g.banner = tackler.team === "voltz" ? "BOLA RECUPERADA" : "RECUPERAÇÃO RIVAL";
        sportSfx("impact");
        return true;
      }
      tackler.recoverUntil = now + 430;
      return false;
    }

    const toOwnerX = target.x - tackler.x;
    const toOwnerY = target.y - tackler.y;
    const distance = Math.hypot(toOwnerX, toOwnerY);
    const toOwnerLength = distance || 1;
    const alignment = facing.x * (toOwnerX / toOwnerLength) + facing.y * (toOwnerY / toOwnerLength);
    const success = distance <= (options.ai ? 3.75 : 4.15) && alignment > -.18;

    if (success) {
      target.recoverUntil = now + 360;
      footballSetPossession(g, tackler, now, tackler.team === "voltz" ? "BOTE CERTO! Você tomou a bola no tempo certo." : "O rival acertou o bote e tomou a posse.");
      g.banner = tackler.team === "voltz" ? "DESARME!" : "BOTE ADVERSÁRIO";
      g.lastTackleAt = now;
      sportSfx("impact");
      return true;
    }

    tackler.recoverUntil = now + (options.ai ? 520 : 620);
    if (!options.ai && tackler.team === "voltz") {
      g.feedback = "Bote no vazio! Você ficou vendido por um instante.";
      g.banner = "BOTE ERRADO";
      sportSfx("menuBack");
    }
    return false;
  }

  function footballTackle() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const controlled = getFootballPlayer(g, g.controlledId);
    const owner = getFootballOwner(g);
    if (!controlled || controlled.keeper || owner?.team === "voltz") return;
    executeFootballTackle(g, controlled, performance.now());
  }

  function footballPrimaryAction() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (owner?.team === "voltz" && owner.id === g.controlledId && !owner.keeper) shootFootball();
    else footballTackle();
  }

'''
s = s.replace(anchor, tackle_functions + anchor, 1)

old_controlled = '''  function updateFootballControlledPlayer(g, dt) {
    const owner = getFootballOwner(g);
    if (owner?.team === "voltz" && !owner.keeper) g.controlledId = owner.id;
    const controlled = getFootballPlayer(g, g.controlledId);
    if (!controlled || controlled.keeper) return;

    let dx = 0;
    let dy = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    if (dx || dy) {
      controlled.x += dx / len * controlled.speed * dt;
      controlled.y += dy / len * controlled.speed * dt;
      controlled.x = clamp(controlled.x, 7, 93);
      controlled.y = clamp(controlled.y, 8, 92);
    }
  }'''
new_controlled = '''  function updateFootballControlledPlayer(g, dt) {
    const owner = getFootballOwner(g);
    if (owner?.team === "voltz" && !owner.keeper) g.controlledId = owner.id;
    const controlled = getFootballPlayer(g, g.controlledId);
    if (!controlled || controlled.keeper) return;
    const now = performance.now();
    if (now < Number(controlled.tackleUntil || 0)) return;

    let dx = 0;
    let dy = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    if (dx || dy) {
      controlled.facingX = dx / len;
      controlled.facingY = dy / len;
      const recoveryScale = now < Number(controlled.recoverUntil || 0) ? .28 : 1;
      controlled.x += dx / len * controlled.speed * recoveryScale * dt;
      controlled.y += dy / len * controlled.speed * recoveryScale * dt;
      controlled.movingUntil = now + 130;
      controlled.x = clamp(controlled.x, 7, 93);
      controlled.y = clamp(controlled.y, 8, 92);
    }
  }'''
rep(old_controlled, new_controlled, 'controlled facing and recovery')

old_rival_press = '''        const targetX = pressing ? ball.x + 1.5 : clamp(ball.x + 14 + index * 3, 54, 84);
        const targetY = pressing ? ball.y : index === 0 ? 50 : index === 1 ? 30 : 70;
        footballMoveToward(player, targetX, targetY, pressing ? 15.5 : 11.5, dt);'''
new_rival_press = '''        const targetX = pressing ? ball.x + 1.5 : clamp(ball.x + 14 + index * 3, 54, 84);
        const targetY = pressing ? ball.y : index === 0 ? 50 : index === 1 ? 30 : 70;
        footballMoveToward(player, targetX, targetY, pressing ? 15.5 : 11.5, dt);
        const liveOwner = getFootballOwner(g);
        if (pressing && liveOwner?.team === "voltz" && !liveOwner.keeper && footballDistance(player, liveOwner) < 4.25 && now >= Number(player.tackleCooldownUntil || 0)) {
          executeFootballTackle(g, player, now, { ai:true, autoAim:true });
        }'''
rep(old_rival_press, new_rival_press, 'rival ai tackle')

old_keeper = '''      if (owner.keeper && now >= ball.keeperReleaseAt) {
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
new_keeper = '''      if (owner.keeper && now >= ball.keeperReleaseAt) {
        const teammates = getFootballTeam(g, owner.team, false);
        const opponents = getFootballTeam(g, owner.team === "voltz" ? "rival" : "voltz", false);
        const ranked = teammates
          .map((mate) => {
            const laneOpen = isFootballPassLaneOpen(g, owner, mate);
            const nearestOpponent = Math.min(...opponents.map((rival) => footballDistance(rival, mate)));
            const nearestLaneOpponent = Math.min(...opponents.map((rival) => distanceToFootballSegment(rival, owner, mate)));
            const score = (laneOpen ? 24 : -12) + nearestOpponent * 2.4 + nearestLaneOpponent * 1.6 - footballDistance(owner, mate) * .18;
            return { mate, laneOpen, nearestOpponent, score };
          })
          .sort((a, b) => b.score - a.score);
        const best = ranked[0];
        const safeShort = best && best.laneOpen && best.nearestOpponent >= 7.2;

        if (safeShort) {
          footballLaunchBall(g, owner, best.mate.x, best.mate.y, 44, now, { passTargetId: best.mate.id });
          if (owner.team === "voltz") g.controlledId = best.mate.id;
          g.feedback = "Seu goleiro encontrou uma saída curta segura.";
          g.banner = "REPOSIÇÃO SEGURA";
          return;
        }

        const direction = owner.team === "voltz" ? 1 : -1;
        const zoneX = owner.team === "voltz" ? 38 : 62;
        const zones = [22, 50, 78].map((zoneY) => {
          const point = { x:zoneX, y:zoneY };
          const opponentClearance = Math.min(...opponents.map((rival) => footballDistance(rival, point)));
          const teammateSupport = Math.min(...teammates.map((mate) => footballDistance(mate, point)));
          return { x:point.x, y:point.y, score:opponentClearance * 2 - teammateSupport * .35 };
        }).sort((a, b) => b.score - a.score);
        const clearZone = zones[0] || { x:owner.x + direction * 30, y:50 };
        footballLaunchBall(g, owner, clearZone.x, clearZone.y, 40, now, {
          airborne:true,
          vz:18,
          landingX:clearZone.x,
          landingY:clearZone.y
        });
        g.feedback = "Sem passe curto seguro: o goleiro rifou para uma zona livre.";
        g.banner = "BOLA LONGA";
        return;
      }'''
rep(old_keeper, new_keeper, 'keeper safe distribution v2')

old_auto_steal = '''      if (!owner.keeper && now - g.lastStealAt > 650) {
        const opponents = getFootballTeam(g, owner.team === "voltz" ? "rival" : "voltz", false);
        const tackler = opponents.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner))[0];
        if (tackler && footballDistance(tackler, owner) < 2.75) {
g.lastStealAt = now;
footballSetPossession(g, tackler, now, tackler.team === "voltz" ? "DESARME! Você recuperou a posse." : "O visitante roubou a bola. Feche o contra-ataque!");
g.banner = tackler.team === "voltz" ? "BOLA RECUPERADA" : "PERDEU A POSSE";
        }
      }
'''
rep(old_auto_steal, '', 'remove automatic stealing')

old_owner_ball = '''      const direction = owner.team === "voltz" ? 1 : -1;
      ball.x = owner.x + direction * (owner.keeper ? 1.2 : 1.8);
      ball.y = owner.y + 1.2;'''
new_owner_ball = '''      const direction = owner.team === "voltz" ? 1 : -1;
      const facing = getFootballFacing(owner, { x:owner.x + direction, y:owner.y });
      const dribbleOffset = owner.keeper ? 1.1 : 1.75;
      ball.x = owner.x + facing.x * dribbleOffset;
      ball.y = owner.y + facing.y * dribbleOffset;'''
rep(old_owner_ball, new_owner_ball, 'directional dribble')

separator_anchor = '''  function updateFootballBall(g, now, dt) {
'''
if separator_anchor not in s:
    raise SystemExit('anchor not found: ball update')
separator_fn = '''  function resolveFootballPlayerSeparation(g) {
    const players = g?.players || [];
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const a = players[i];
        const b = players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || .001;
        const minDistance = a.keeper || b.keeper ? 3.25 : 3.05;
        if (distance >= minDistance) continue;
        const overlap = (minDistance - distance) * .5;
        const nx = dx / distance;
        const ny = dy / distance;
        a.x = clamp(a.x - nx * overlap, a.keeper ? 3.5 : 7, a.keeper ? 96.5 : 93);
        a.y = clamp(a.y - ny * overlap, 8, 92);
        b.x = clamp(b.x + nx * overlap, b.keeper ? 3.5 : 7, b.keeper ? 96.5 : 93);
        b.y = clamp(b.y + ny * overlap, 8, 92);
      }
    }
  }

'''
s = s.replace(separator_anchor, separator_fn + separator_anchor, 1)

old_dom_loop = '''    g.players.forEach((player) => {
      const el = document.getElementById(`footballPlayer-${player.id}`);
      if (!el) return;
      el.style.left = `${player.x}%`;
      el.style.top = `${player.y}%`;
      el.classList.toggle("is-controlled", player.id === g.controlledId && !player.keeper);
      el.classList.toggle("has-ball", g.ball.ownerId === player.id);
    });'''
new_dom_loop = '''    g.players.forEach((player) => {
      const el = document.getElementById(`footballPlayer-${player.id}`);
      if (!el) return;
      el.style.left = `${player.x}%`;
      el.style.top = `${player.y}%`;
      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });
      const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;
      el.style.setProperty("--football-facing-angle", `${angle}deg`);
      el.classList.toggle("is-controlled", player.id === g.controlledId && !player.keeper);
      el.classList.toggle("has-ball", g.ball.ownerId === player.id);
      el.classList.toggle("is-running", now < Number(player.movingUntil || 0));
      el.classList.toggle("is-tackling", now < Number(player.tackleUntil || 0));
      el.classList.toggle("is-recovering", now < Number(player.recoverUntil || 0));
    });'''
rep(old_dom_loop, new_dom_loop, 'topdown player dom')

old_update_match = '''    updateFootballControlledPlayer(g, simDt);
    updateFootballKeepers(g, simDt);
    updateFootballAI(g, now, simDt);
    updateFootballBall(g, now, simDt);
    updateFootballDom(now);'''
new_update_match = '''    updateFootballControlledPlayer(g, simDt);
    updateFootballKeepers(g, simDt);
    updateFootballAI(g, now, simDt);
    resolveFootballPlayerSeparation(g);
    updateFootballBall(g, now, simDt);
    updateFootballDom(now);'''
rep(old_update_match, new_update_match, 'player separation update')

old_keys = '''          if (key === "j") shootFootball();
          else if (key === "k") footballPass();'''
new_keys = '''          if (key === "j") footballPrimaryAction();
          else if (key === "k") footballPass();'''
rep(old_keys, new_keys, 'contextual J key')

rep(
    '''    shootFootball,
    footballPass,
    footballCross,''',
    '''    shootFootball,
    footballPrimaryAction,
    footballTackle,
    footballPass,
    footballCross,''',
    'exports tackle'
)

css_append = r'''

/* Football V3 · top-down físico + bote contextual */
.football-field-live {
  background:
    radial-gradient(circle at 50% 50%, rgba(255,255,255,.035), transparent 44%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.030) 0 8.333%, rgba(0,0,0,.030) 8.333% 16.666%),
    repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 2px, transparent 2px 7px),
    linear-gradient(180deg,#154b3a,#0b382f 52%,#092c27) !important;
  perspective:900px;
}
.football-field-live::before {
  box-shadow:inset 0 0 28px rgba(0,0,0,.14);
}

.football-live-player {
  --football-facing-angle:90deg;
  --football-kit:#35dba1;
  --football-kit-dark:#176f72;
  width:42px !important;
  height:42px !important;
  border:0 !important;
  border-radius:0 !important;
  background:none !important;
  box-shadow:none !important;
  filter:none !important;
  display:block !important;
  transform:translate(-50%,-50%) !important;
  transition:none !important;
}
.football-live-player.team-rival {
  --football-kit:#ff6b7a;
  --football-kit-dark:#8a2438;
}
.football-live-player.is-keeper {
  --football-kit:#ffd166;
  --football-kit-dark:#9b671b;
  width:44px !important;
  height:44px !important;
  background:none !important;
}
.football-live-player.team-rival.is-keeper {
  --football-kit:#d599ff;
  --football-kit-dark:#6e3a9e;
}
.football-player-shadow {
  position:absolute;
  left:50%;top:58%;
  width:25px;height:12px;
  border-radius:50%;
  background:rgba(0,0,0,.34);
  filter:blur(2px);
  transform:translate(-50%,-50%);
  transition:transform .08s ease,opacity .08s ease;
}
.football-player-body {
  position:absolute;
  left:50%;top:50%;
  width:24px;height:32px;
  transform:translate(-50%,-50%) rotate(var(--football-facing-angle));
  transform-origin:50% 55%;
  transition:transform .07s linear,filter .1s ease;
}
.football-player-head {
  position:absolute;
  left:50%;top:1px;
  width:10px;height:10px;
  transform:translateX(-50%);
  border-radius:50%;
  background:#d8a06e;
  border:1px solid rgba(16,22,22,.7);
  box-shadow:0 1px 2px rgba(0,0,0,.35);
}
.football-player-torso {
  position:absolute;
  left:50%;top:10px;
  width:18px;height:15px;
  transform:translateX(-50%);
  border-radius:7px 7px 5px 5px;
  background:linear-gradient(145deg,var(--football-kit),var(--football-kit-dark));
  border:1px solid rgba(255,255,255,.48);
  box-shadow:0 2px 4px rgba(0,0,0,.34);
}
.football-player-leg {
  position:absolute;
  top:23px;
  width:6px;height:9px;
  border-radius:2px 2px 4px 4px;
  background:var(--football-kit-dark);
  border:1px solid rgba(0,0,0,.25);
  transform-origin:50% 0;
}
.football-player-leg.leg-left { left:5px; }
.football-player-leg.leg-right { right:5px; }
.football-player-body > span {
  position:absolute !important;
  left:50% !important;top:13px !important;
  transform:translate(-50%,-50%) rotate(calc(var(--football-facing-angle) * -1)) !important;
  width:auto !important;height:auto !important;
  color:#fff !important;
  font-size:.43rem !important;
  font-weight:1000 !important;
  line-height:1 !important;
  text-shadow:0 1px 2px rgba(0,0,0,.65) !important;
  z-index:4;
}
.football-live-player.is-running .leg-left { animation:footballLegLeft .22s ease-in-out infinite alternate; }
.football-live-player.is-running .leg-right { animation:footballLegRight .22s ease-in-out infinite alternate; }
@keyframes footballLegLeft { from{transform:rotate(-18deg)} to{transform:rotate(20deg)} }
@keyframes footballLegRight { from{transform:rotate(20deg)} to{transform:rotate(-18deg)} }
.football-live-player.is-controlled::before {
  content:"";
  position:absolute;
  left:50%;top:54%;
  width:35px;height:20px;
  transform:translate(-50%,-50%);
  border:2px solid #8cf7ff;
  border-radius:50%;
  box-shadow:0 0 13px rgba(140,247,255,.75),inset 0 0 8px rgba(140,247,255,.18);
  animation:footballControlRing .7s ease-in-out infinite alternate;
}
.football-live-player.is-controlled::after {
  content:"▼" !important;
  position:absolute !important;
  left:50% !important;top:-13px !important;
  transform:translateX(-50%) !important;
  color:#8cf7ff !important;
  font-size:.62rem !important;
  text-shadow:0 0 8px #45a3ff !important;
}
@keyframes footballControlRing { to{transform:translate(-50%,-50%) scale(1.08);opacity:.72} }
.football-live-player.has-ball .football-player-shadow {
  box-shadow:0 0 10px rgba(140,247,255,.22);
}
.football-live-player.is-tackling .football-player-body {
  filter:brightness(1.35);
  animation:footballTackleBody .25s cubic-bezier(.12,.76,.28,1);
}
.football-live-player.is-tackling .football-player-shadow {
  transform:translate(-50%,-50%) scaleX(1.35);
}
@keyframes footballTackleBody {
  0%{transform:translate(-50%,-50%) rotate(var(--football-facing-angle)) scale(1)}
  55%{transform:translate(-50%,-50%) rotate(var(--football-facing-angle)) scale(1.18,.88)}
  100%{transform:translate(-50%,-50%) rotate(var(--football-facing-angle)) scale(1)}
}
.football-live-player.is-recovering .football-player-body { opacity:.72;filter:saturate(.55); }
.football-live-player.is-recovering .football-player-shadow { opacity:.22; }

.football-ball-shadow {
  position:absolute;
  z-index:10;
  width:18px;height:9px;
  border-radius:50%;
  background:rgba(0,0,0,.48);
  filter:blur(2px);
  pointer-events:none;
}
.football-live-ball { transition:none !important; }
.football-live-ball.is-airborne { filter:drop-shadow(0 6px 8px rgba(0,0,0,.22)); }

.football-control-strip button:first-of-type {
  min-width:126px;
}
'''

if '/* Football V3 · top-down físico + bote contextual */' not in css:
    css += css_append

js_path.write_text(s, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('football top-down V3 patch applied')
