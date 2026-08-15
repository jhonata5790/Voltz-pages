from pathlib import Path

p = Path('assets/js/realms/physical-education/sports-minigames.js')
s = p.read_text(encoding='utf-8')

old_target = '''  function getFootballPassTarget(g, passer) {
    const teammates = getFootballTeam(g, passer.team, false).filter((player) => player.id !== passer.id);
    if (!teammates.length) return null;

    let inputX = 0;
    let inputY = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) inputX -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) inputX += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) inputY -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) inputY += 1;
    const inputLength = Math.hypot(inputX, inputY);
    if (inputLength) { inputX /= inputLength; inputY /= inputLength; }

    const direction = passer.team === "voltz" ? 1 : -1;
    return teammates
      .map((target) => {
        const dx = target.x - passer.x;
        const dy = target.y - passer.y;
        const len = Math.hypot(dx, dy) || 1;
        const alignment = inputLength ? (dx / len * inputX + dy / len * inputY) * 22 : 0;
        const forward = direction * dx * .7;
        const open = isFootballPassLaneOpen(g, passer, target) ? 18 : -8;
        const nearestMarker = Math.min(...getFootballTeam(g, passer.team === "voltz" ? "rival" : "voltz", false).map((rival) => footballDistance(rival, target)));
        return { target, score: alignment + forward + open + nearestMarker * .8 - len * .08 };
      })
      .sort((a, b) => b.score - a.score)[0]?.target || teammates[0];
  }
'''

new_target = '''  function getFootballAimDirection(player) {
    let x = 0;
    let y = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) x -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) x += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) y -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) y += 1;
    const length = Math.hypot(x, y);
    if (length > .01) return { x:x / length, y:y / length, explicit:true };
    const facing = getFootballFacing(player);
    return { x:facing.x, y:facing.y, explicit:false };
  }

  function getFootballReceiverVelocity(player, now = performance.now()) {
    if (!player || now >= Number(player.movingUntil || 0) || now < Number(player.recoverUntil || 0)) return { x:0, y:0, moving:false };
    const facing = getFootballFacing(player);
    const speed = Number(player.speed || 0);
    return { x:facing.x * speed, y:facing.y * speed, moving:speed > .1 };
  }

  function predictFootballReceiverPoint(receiver, travelSeconds, now = performance.now()) {
    const velocity = getFootballReceiverVelocity(receiver, now);
    if (!velocity.moving) return { x:receiver.x, y:receiver.y, moving:false };
    const lead = clamp(travelSeconds, .12, 1.65);
    return {
      x:clamp(receiver.x + velocity.x * lead, 7, 93),
      y:clamp(receiver.y + velocity.y * lead, 8, 92),
      moving:true
    };
  }

  function getFootballDirectionalTarget(g, passer) {
    const teammates = getFootballTeam(g, passer.team, false).filter((player) => player.id !== passer.id);
    if (!teammates.length) return null;
    const aim = getFootballAimDirection(passer);

    const ranked = teammates.map((target) => {
      const dx = target.x - passer.x;
      const dy = target.y - passer.y;
      const along = dx * aim.x + dy * aim.y;
      const perpendicular = Math.abs(dx * aim.y - dy * aim.x);
      const distance = Math.hypot(dx, dy);
      const behindPenalty = along < 0 ? 80 + Math.abs(along) * 2 : 0;
      const lineScore = perpendicular * 5.5;
      const forwardReward = Math.max(0, along) * .35;
      const openReward = isFootballPassLaneOpen(g, passer, target) ? 9 : 0;
      return { target, score:lineScore + behindPenalty + distance * .08 - forwardReward - openReward, along };
    }).sort((a, b) => a.score - b.score);

    const ahead = ranked.find((entry) => entry.along > 1.5);
    return (ahead || ranked[0])?.target || teammates[0];
  }

  function getFootballPassTarget(g, passer) {
    return getFootballDirectionalTarget(g, passer);
  }
'''

if old_target not in s:
    raise SystemExit('target selector anchor not found')
s = s.replace(old_target, new_target, 1)

old_pass = '''    const target = getFootballPassTarget(g, owner);
    if (!target) return;
    const now = performance.now();
    const open = isFootballPassLaneOpen(g, owner, target);
    const leadX = target.x + (target.x - owner.x) * .06;
    const leadY = target.y + (target.y - owner.y) * .04;
    footballLaunchBall(g, owner, leadX, leadY, 48, now, { passTargetId: target.id });
    g.feedback = open ? `Passe para #${target.number}. Linha limpa.` : `Passe arriscado para #${target.number}. Tem marcação na linha.`;
'''
new_pass = '''    const target = getFootballPassTarget(g, owner);
    if (!target) return;
    const now = performance.now();
    const open = isFootballPassLaneOpen(g, owner, target);
    const baseDistance = footballDistance(owner, target);
    const firstTravelEstimate = clamp(baseDistance / 48, .12, 1.05);
    let predicted = predictFootballReceiverPoint(target, firstTravelEstimate, now);
    const predictedDistance = Math.hypot(predicted.x - owner.x, predicted.y - owner.y);
    predicted = predictFootballReceiverPoint(target, clamp(predictedDistance / 48, .12, 1.12), now);
    footballLaunchBall(g, owner, predicted.x, predicted.y, 48, now, { passTargetId: target.id });
    g.feedback = predicted.moving
      ? `Passe no espaço para #${target.number}. A bola foi ajustada à corrida.`
      : open ? `Passe no pé de #${target.number}. Linha limpa.` : `Passe arriscado para #${target.number}. Tem marcação na linha.`;
'''
if old_pass not in s:
    raise SystemExit('pass anchor not found')
s = s.replace(old_pass, new_pass, 1)

old_cross = '''    const teammates = getFootballTeam(g, "voltz", false).filter((player) => player.id !== owner.id);
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
'''
new_cross = '''    const target = getFootballDirectionalTarget(g, owner);
    if (!target) return;
    const now = performance.now();
    const gravity = 31;
    const verticalSpeed = 23;
    const airTime = (2 * verticalSpeed) / gravity;
    const predicted = predictFootballReceiverPoint(target, airTime * .88, now);
    const aim = getFootballAimDirection(owner);
    const extraIntoSpace = predicted.moving ? 2.4 : 0;
    const landingX = clamp(predicted.x + aim.x * extraIntoSpace, 8, 92);
    const landingY = clamp(predicted.y + aim.y * extraIntoSpace, 9, 91);
    const distance = Math.hypot(landingX - owner.x, landingY - owner.y);
    const speed = clamp(distance / Math.max(.9, airTime), 30, 48);
    footballLaunchBall(g, owner, landingX, landingY, speed, now, {
      passTargetId: target.id,
      isCross: true,
      airborne: true,
      vz: verticalSpeed,
      landingX,
      landingY
    });
    g.feedback = predicted.moving
      ? `Cruzamento antecipado para a corrida de #${target.number}.`
      : `Cruzamento no ponto de #${target.number}.`;
'''
if old_cross not in s:
    raise SystemExit('cross anchor not found')
s = s.replace(old_cross, new_cross, 1)

p.write_text(s, encoding='utf-8')
print('directional targeting patch applied')
