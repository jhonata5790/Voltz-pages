from pathlib import Path
import re

p = Path('assets/js/realms/physical-education/sports-minigames.js')
s = p.read_text(encoding='utf-8')

new_open_space = r'''  function getFootballBallFutureSamples(g, horizon = 2.6, step = .055) {
    if (!g?.ball || g.ball.ownerId) return [];
    const source = g.ball;
    let x = Number(source.x || 0);
    let y = Number(source.y || 0);
    let z = Number(source.z || 0);
    let vx = Number(source.vx || 0);
    let vy = Number(source.vy || 0);
    let vz = Number(source.vz || 0);
    let airborne = Boolean(source.airborne || z > 0);
    const samples = [];

    for (let t = step; t <= horizon; t += step) {
      x += vx * step;
      y += vy * step;
      if (airborne || z > 0) {
        z = Math.max(0, z + vz * step);
        vz -= 31 * step;
        if (z <= 0 && vz <= 0) {
          z = 0;
          vz = 0;
          airborne = false;
        }
      }
      const damping = Math.pow(airborne ? .998 : .994, step * 60);
      vx *= damping;
      vy *= damping;
      if (y <= 3 && vy < 0) { y = 3; vy *= -.72; }
      if (y >= 97 && vy > 0) { y = 97; vy *= -.72; }
      samples.push({ x:clamp(x, 0, 100), y:clamp(y, 3, 97), z, vz, t });
      if (Math.abs(vx) + Math.abs(vy) < .4 && z <= 0) break;
    }
    return samples;
  }

  function getFootballDynamicIntercept(g, player) {
    if (!g || !player || g.ball.ownerId) return null;
    const samples = getFootballBallFutureSamples(g);
    if (!samples.length) return { x:g.ball.x, y:g.ball.y, t:0 };
    const speed = Math.max(12.5, Number(player.speed || 15) * 1.06);

    for (const sample of samples) {
      const maxHeight = player.keeper ? 6.4 : (sample.vz < 0 ? 4.2 : 2.5);
      if (sample.z > maxHeight) continue;
      const travel = Math.hypot(sample.x - player.x, sample.y - player.y) / speed;
      if (travel <= sample.t + .075) return sample;
    }

    const reachable = samples.filter((sample) => sample.z <= (player.keeper ? 6.4 : 4.2));
    return reachable[reachable.length - 1] || samples[samples.length - 1];
  }

  function getFootballAttackShape(g, owner) {
    const shape = new Map();
    if (!g || !owner) return shape;
    const direction = owner.team === "voltz" ? 1 : -1;
    const offBall = getFootballTeam(g, owner.team, false).filter((player) => player.id !== owner.id);
    if (!offBall.length) return shape;

    const byDistance = offBall.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner));
    const support = byDistance[0];
    const runner = byDistance[1];

    let supportY;
    let runnerY;
    if (owner.y <= 36) {
      supportY = owner.y + 20;
      runnerY = owner.y + 43;
    } else if (owner.y >= 64) {
      supportY = owner.y - 20;
      runnerY = owner.y - 43;
    } else {
      let supportSide = support && support.y < owner.y ? -1 : 1;
      if (support && Math.abs(support.y - owner.y) < 5) supportSide = support.homeY < 50 ? -1 : 1;
      supportY = owner.y + supportSide * 21;
      runnerY = owner.y - supportSide * 29;
    }

    if (support) shape.set(support.id, {
      role:"support",
      x:clamp(owner.x + direction * 4, 11, 89),
      y:clamp(supportY, 12, 88)
    });
    if (runner) shape.set(runner.id, {
      role:"runner",
      x:clamp(owner.x + direction * 27, 12, 90),
      y:clamp(runnerY, 11, 89)
    });
    return shape;
  }

  function getFootballOpenSpaceTarget(g, player, owner, roleIndex = 0) {
    if (!g || !player || !owner) return { x:player.x, y:player.y };
    const opponents = getFootballTeam(g, owner.team === "voltz" ? "rival" : "voltz", false);
    const allies = getFootballTeam(g, owner.team, false).filter((ally) => ally.id !== player.id && ally.id !== owner.id);
    const shape = getFootballAttackShape(g, owner);
    const anchor = shape.get(player.id) || {
      role:roleIndex % 2 === 0 ? "support" : "runner",
      x:clamp(owner.x + (owner.team === "voltz" ? 1 : -1) * (roleIndex % 2 === 0 ? 5 : 24), 11, 89),
      y:clamp(owner.y + (roleIndex % 2 === 0 ? -22 : 27), 12, 88)
    };
    const offsets = [[0,0],[3,0],[-3,0],[0,5],[0,-5],[3,4],[-3,-4]];
    const candidates = offsets.map(([ox, oy]) => {
      const candidate = { x:clamp(anchor.x + ox, 10, 90), y:clamp(anchor.y + oy, 10, 90) };
      const nearestOpponent = opponents.length ? Math.min(...opponents.map((opponent) => footballDistance(opponent, candidate))) : 20;
      const nearestAlly = allies.length ? Math.min(...allies.map((ally) => footballDistance(ally, candidate))) : 30;
      const laneOpen = opponents.every((opponent) => distanceToFootballSegment(opponent, owner, candidate) > 5.8);
      const anchorDeviation = Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);
      const crowdPenalty = nearestAlly < 15 ? (15 - nearestAlly) * 3.2 : 0;
      return {
        ...candidate,
        score:nearestOpponent * 2.8 + (laneOpen ? 12 : -4) - anchorDeviation * 1.5 - crowdPenalty
      };
    }).sort((a, b) => b.score - a.score);
    return candidates[0] || anchor;
  }

'''

pattern = r'  function getFootballOpenSpaceTarget\(.*?(?=  function getFootballDefensiveBlockTarget\()'
s, n = re.subn(pattern, new_open_space, s, count=1, flags=re.S)
assert n == 1, f'open space replace count={n}'

new_defense = r'''  function getFootballDefensiveBlockTarget(g, defender, owner, roleIndex = 0) {
    if (!g || !defender || !owner) return { x:defender.homeX, y:defender.homeY };
    const receivers = getFootballTeam(g, owner.team, false)
      .filter((player) => player.id !== owner.id)
      .sort((a, b) => a.y - b.y);
    if (!receivers.length) {
      const ownGoalX = defender.team === "voltz" ? 8 : 92;
      return { x:(owner.x + ownGoalX) * .5, y:clamp(defender.homeY, 18, 82) };
    }
    const receiver = receivers[roleIndex % receivers.length];
    const ownGoalX = defender.team === "voltz" ? 7 : 93;
    const insideY = receiver.y + (50 - receiver.y) * .08;
    return {
      x:clamp(receiver.x + (ownGoalX - receiver.x) * .24, 10, 90),
      y:clamp(insideY, 11, 89)
    };
  }

'''
pattern = r'  function getFootballDefensiveBlockTarget\(.*?(?=  function getFootballLooseBallMovement\()'
s, n = re.subn(pattern, new_defense, s, count=1, flags=re.S)
assert n == 1, f'defense replace count={n}'

new_loose = r'''  function getFootballLooseBallMovement(g, player, now, roleIndex = 0, primaryChaserId = null) {
    if (!g || !player || g.ball.ownerId) return null;
    const ball = g.ball;
    const sameTeamPass = ball.lastTouchTeam === player.team && Boolean(ball.passTargetId);
    const intended = sameTeamPass && ball.passTargetId === player.id;
    const dynamicIntercept = getFootballDynamicIntercept(g, player);
    const fallbackLanding = {
      x:Number.isFinite(Number(ball.landingX)) ? Number(ball.landingX) : clamp(ball.x + ball.vx * .35, 7, 93),
      y:Number.isFinite(Number(ball.landingY)) ? Number(ball.landingY) : clamp(ball.y + ball.vy * .35, 8, 92)
    };

    if (intended) {
      const markerDistance = getFootballNearestMarkerDistance(g, player);
      const intercept = dynamicIntercept || fallbackLanding;
      const ballDistance = footballDistance(player, ball);
      const interceptDistance = footballDistance(player, intercept);
      const directArrival = !ball.isCross && markerDistance >= 7.4 && interceptDistance <= 2.5 && ballDistance > 2.6;
      if (directArrival) return { x:player.x, y:player.y, speed:0, mode:"wait" };
      return {
        x:intercept.x,
        y:intercept.y,
        speed:Math.max(15.2, Number(player.speed || 15) * (ball.isCross ? 1.13 : 1.06)),
        mode:ball.isCross || interceptDistance > 3.2 ? "run" : "meet"
      };
    }

    if (sameTeamPass) {
      const receiver = getFootballPlayer(g, ball.passTargetId);
      const receiverIntercept = receiver ? getFootballDynamicIntercept(g, receiver) : null;
      const center = receiverIntercept || fallbackLanding;
      const direction = player.team === "voltz" ? 1 : -1;
      let side = player.homeY < 45 ? -1 : player.homeY > 55 ? 1 : (roleIndex % 2 === 0 ? -1 : 1);
      if (receiver && Math.sign(receiver.y - 50) === side) side *= -1;
      return {
        x:clamp(center.x - direction * (roleIndex % 2 === 0 ? 11 : 3), 10, 90),
        y:clamp(center.y + side * (roleIndex % 2 === 0 ? 23 : 29), 10, 90),
        speed:12.6,
        mode:"support"
      };
    }

    const opponentReceiver = getFootballPlayer(g, ball.passTargetId);
    if (opponentReceiver && opponentReceiver.team !== player.team) {
      if (player.id === primaryChaserId) {
        const intercept = dynamicIntercept || fallbackLanding;
        return { x:intercept.x, y:intercept.y, speed:13.8, mode:"intercept" };
      }
      const ownGoalX = player.team === "voltz" ? 7 : 93;
      const side = roleIndex % 2 === 0 ? -1 : 1;
      return {
        x:clamp(opponentReceiver.x + (ownGoalX - opponentReceiver.x) * .27, 10, 90),
        y:clamp(opponentReceiver.y + side * 17, 11, 89),
        speed:11.9,
        mode:"cover"
      };
    }

    if (player.id === primaryChaserId) {
      const intercept = dynamicIntercept || { x:ball.x, y:ball.y };
      return { x:intercept.x, y:intercept.y, speed:13.5, mode:"loose" };
    }

    const ownGoalX = player.team === "voltz" ? 7 : 93;
    const side = player.homeY < 50 ? -1 : player.homeY > 50 ? 1 : (roleIndex % 2 === 0 ? -1 : 1);
    return {
      x:clamp(ball.x + (ownGoalX - ball.x) * .23, 10, 90),
      y:clamp(ball.y + side * 24, 11, 89),
      speed:11.4,
      mode:"shape"
    };
  }

'''
pattern = r'  function getFootballLooseBallMovement\(.*?(?=  function updateFootballAI\()'
s, n = re.subn(pattern, new_loose, s, count=1, flags=re.S)
assert n == 1, f'loose replace count={n}'

new_ai = r'''  function updateFootballAI(g, now, dt) {
    const owner = getFootballOwner(g);
    const possession = owner?.team || null;
    const ball = g.ball;
    const controlled = getFootballPlayer(g, g.controlledId);

    const voltzOutfield = getFootballTeam(g, "voltz", false);
    const rivalOutfield = getFootballTeam(g, "rival", false);

    const ownPassInFlight = !possession && ball.lastTouchTeam === "voltz" && Boolean(ball.passTargetId);
    if (possession !== "voltz" && !ownPassInFlight && now >= g.autoSelectAt) {
      const nearest = voltzOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0];
      if (nearest) g.controlledId = nearest.id;
      g.autoSelectAt = now + 260;
    }

    const voltzPrimary = !possession
      ? voltzOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0]
      : null;
    const rivalPrimary = !possession
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0]
      : null;

    const voltzOffBall = voltzOutfield.filter((player) => player.id !== owner?.id && player.id !== g.controlledId);
    voltzOutfield.forEach((player) => {
      if (player.id === g.controlledId) return;
      const roleIndex = Math.max(0, voltzOffBall.findIndex((candidate) => candidate.id === player.id));
      if (possession === "voltz") {
        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);
        const role = getFootballAttackShape(g, owner).get(player.id)?.role;
        footballMoveToward(player, target.x, target.y, role === "runner" ? 15.4 : 13.2, dt);
      } else if (possession === "rival") {
        const target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);
        footballMoveToward(player, target.x, target.y, 12.0, dt);
      } else {
        const movement = getFootballLooseBallMovement(g, player, now, roleIndex, voltzPrimary?.id || null);
        if (movement && movement.speed > 0) footballMoveToward(player, movement.x, movement.y, movement.speed, dt);
      }
    });

    const rivalOffBall = rivalOutfield.filter((player) => player.id !== owner?.id);
    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    rivalOutfield.forEach((player) => {
      if (owner?.id === player.id) return;
      const roleIndex = Math.max(0, rivalOffBall.findIndex((candidate) => candidate.id === player.id));
      if (possession === "voltz") {
        const pressing = rivalPressOrder[0]?.id === player.id;
        if (pressing) {
          footballMoveToward(player, owner.x, owner.y, 15.5, dt);
          const liveOwner = getFootballOwner(g);
          if (liveOwner?.team === "voltz" && !liveOwner.keeper && footballDistance(player, liveOwner) < 4.25 && now >= Number(player.tackleCooldownUntil || 0)) {
            executeFootballTackle(g, player, now, { ai:true, autoAim:true });
          }
        } else {
          const target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);
          footballMoveToward(player, target.x, target.y, 12.1, dt);
        }
      } else if (possession === "rival") {
        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);
        const role = getFootballAttackShape(g, owner).get(player.id)?.role;
        footballMoveToward(player, target.x, target.y, role === "runner" ? 14.9 : 12.9, dt);
      } else {
        const movement = getFootballLooseBallMovement(g, player, now, roleIndex, rivalPrimary?.id || null);
        if (movement && movement.speed > 0) footballMoveToward(player, movement.x, movement.y, movement.speed, dt);
      }
    });

    if (owner?.team === "rival" && !owner.keeper) {
      const nearestVoltz = voltzOutfield.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner))[0];
      const pressure = footballDistance(nearestVoltz, owner);
      if (owner.x <= 27 && now >= g.aiActionAt) {
        footballEnemyShoot(g, owner, now);
      } else if (pressure < 8 && now >= g.aiActionAt && Math.random() < .55) {
        footballEnemyPass(g, owner, now);
      } else {
        const targetY = clamp(50 + (owner.y - 50) * .35, 32, 68);
        footballMoveToward(owner, 12, targetY, 13.5, dt);
      }
    }

    if (controlled) {
      controlled.x = clamp(controlled.x, 7, 93);
      controlled.y = clamp(controlled.y, 8, 92);
    }
  }

'''
pattern = r'  function updateFootballAI\(.*?(?=  function resolveFootballPlayerSeparation\()'
s, n = re.subn(pattern, new_ai, s, count=1, flags=re.S)
assert n == 1, f'AI replace count={n}'

s = s.replace('const minDistance = a.keeper || b.keeper ? 3.25 : 3.05;', 'const minDistance = a.keeper || b.keeper ? 3.5 : 3.85;', 1)

p.write_text(s, encoding='utf-8')
print('football V3.3 patch applied')
