from pathlib import Path

p = Path('assets/js/realms/physical-education/sports-minigames.js')
s = p.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'anchor not found: {label}')
    s = s.replace(old, new, 1)

anchor = '''  function updateFootballAI(g, now, dt) {
'''
helpers = r'''  function getFootballNearestMarkerDistance(g, player) {
    if (!g || !player) return Infinity;
    const opponents = getFootballTeam(g, player.team === "voltz" ? "rival" : "voltz", false);
    if (!opponents.length) return Infinity;
    return Math.min(...opponents.map((opponent) => footballDistance(opponent, player)));
  }

  function getFootballOpenSpaceTarget(g, player, owner, roleIndex = 0) {
    if (!g || !player || !owner) return { x:player.x, y:player.y };
    const direction = owner.team === "voltz" ? 1 : -1;
    const opponents = getFootballTeam(g, owner.team === "voltz" ? "rival" : "voltz", false);
    const allies = getFootballTeam(g, owner.team, false).filter((ally) => ally.id !== player.id && ally.id !== owner.id);
    const supportRole = roleIndex % 2 === 0;
    const forwardSteps = supportRole ? [7, 11, 14] : [15, 20, 25];
    const sideSteps = supportRole ? [-14, 14, -7, 7, 0] : [-24, 24, -16, 16, -8, 8];
    const candidates = [];

    forwardSteps.forEach((forward) => {
      sideSteps.forEach((side) => {
        const candidate = {
          x:clamp(owner.x + direction * forward, 9, 91),
          y:clamp(owner.y + side, 10, 90)
        };
        const nearestOpponent = opponents.length
          ? Math.min(...opponents.map((opponent) => footballDistance(opponent, candidate)))
          : 20;
        const nearestAlly = allies.length
          ? Math.min(...allies.map((ally) => footballDistance(ally, candidate)))
          : 20;
        const fromOwner = footballDistance(owner, candidate);
        const fromPlayer = footballDistance(player, candidate);
        const laneOpen = opponents.every((opponent) => distanceToFootballSegment(opponent, owner, candidate) > 5.8);
        const progress = direction * (candidate.x - owner.x);
        const spacingPenalty = nearestAlly < 8 ? (8 - nearestAlly) * 2.2 : 0;
        const supportDistancePenalty = supportRole && fromOwner > 20 ? (fromOwner - 20) * 1.1 : 0;
        const runnerReward = !supportRole ? progress * .42 : 0;
        const score = nearestOpponent * 2.7
          + (laneOpen ? 13 : -5)
          + runnerReward
          - fromPlayer * .14
          - spacingPenalty
          - supportDistancePenalty;
        candidates.push({ ...candidate, score });
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || { x:player.x, y:player.y };
  }

  function getFootballDefensiveBlockTarget(g, defender, owner, roleIndex = 0) {
    if (!g || !defender || !owner) return { x:defender.homeX, y:defender.homeY };
    const receivers = getFootballTeam(g, owner.team, false)
      .filter((player) => player.id !== owner.id)
      .sort((a, b) => footballDistance(owner, a) - footballDistance(owner, b));
    if (!receivers.length) {
      const ownGoalX = defender.team === "voltz" ? 8 : 92;
      return { x:(owner.x + ownGoalX) * .5, y:owner.y };
    }
    const receiver = receivers[roleIndex % receivers.length];
    const blockRatio = roleIndex % 2 === 0 ? .48 : .62;
    const ownGoalX = defender.team === "voltz" ? 7 : 93;
    return {
      x:clamp(owner.x + (receiver.x - owner.x) * blockRatio + (ownGoalX - owner.x) * .06, 9, 91),
      y:clamp(owner.y + (receiver.y - owner.y) * blockRatio, 10, 90)
    };
  }

  function getFootballLooseBallMovement(g, player, now, roleIndex = 0) {
    if (!g || !player || g.ball.ownerId) return null;
    const ball = g.ball;
    const sameTeamPass = ball.lastTouchTeam === player.team;
    const intended = sameTeamPass && ball.passTargetId === player.id;
    const landing = {
      x:Number.isFinite(Number(ball.landingX)) ? Number(ball.landingX) : clamp(ball.x + ball.vx * .35, 7, 93),
      y:Number.isFinite(Number(ball.landingY)) ? Number(ball.landingY) : clamp(ball.y + ball.vy * .35, 8, 92)
    };

    if (intended) {
      const markerDistance = getFootballNearestMarkerDistance(g, player);
      const leadDistance = footballDistance(player, landing);
      const ballDistance = footballDistance(player, ball);
      const advancedBall = Boolean(ball.isCross) || leadDistance > 3.4;

      if (advancedBall) {
        return {
          x:landing.x,
          y:landing.y,
          speed:Math.max(14.5, Number(player.speed || 15) * 1.08),
          mode:"run"
        };
      }

      if (markerDistance >= 7.4 && ballDistance > 2.6) {
        return { x:player.x, y:player.y, speed:0, mode:"wait" };
      }

      return {
        x:ball.x,
        y:ball.y,
        speed:Math.max(12.5, Number(player.speed || 15) * .9),
        mode:"meet"
      };
    }

    if (sameTeamPass) {
      const direction = player.team === "voltz" ? 1 : -1;
      const side = player.homeY < 50 ? -1 : player.homeY > 50 ? 1 : (roleIndex % 2 ? 1 : -1);
      return {
        x:clamp(landing.x - direction * (roleIndex % 2 === 0 ? 8 : 3), 9, 91),
        y:clamp(landing.y + side * (roleIndex % 2 === 0 ? 11 : 17), 10, 90),
        speed:12.8,
        mode:"support"
      };
    }

    const opponentReceiver = getFootballPlayer(g, ball.passTargetId);
    if (opponentReceiver && opponentReceiver.team !== player.team) {
      const ratio = roleIndex % 2 === 0 ? .5 : .68;
      return {
        x:clamp(ball.x + (opponentReceiver.x - ball.x) * ratio, 9, 91),
        y:clamp(ball.y + (opponentReceiver.y - ball.y) * ratio, 10, 90),
        speed:13.2,
        mode:"intercept"
      };
    }

    return {
      x:ball.x,
      y:ball.y,
      speed:11.5,
      mode:"loose"
    };
  }

'''
if anchor not in s:
    raise SystemExit('anchor not found: updateFootballAI')
s = s.replace(anchor, helpers + anchor, 1)

rep(
'''    if (possession !== "voltz" && now >= g.autoSelectAt) {
      const nearest = voltzOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0];
      if (nearest) g.controlledId = nearest.id;
      g.autoSelectAt = now + 260;
    }
''',
'''    const ownPassInFlight = !possession && ball.lastTouchTeam === "voltz" && Boolean(ball.passTargetId);
    if (possession !== "voltz" && !ownPassInFlight && now >= g.autoSelectAt) {
      const nearest = voltzOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball))[0];
      if (nearest) g.controlledId = nearest.id;
      g.autoSelectAt = now + 260;
    }
''',
'auto select own pass'
)

rep(
'''    voltzOutfield.forEach((player, index) => {
      if (player.id === g.controlledId) return;
      if (possession === "voltz") {
        const laneY = index === 0 ? 50 : index === 1 ? 27 : 73;
        const targetX = clamp(ball.x + (player.x < ball.x ? 10 : 17), 18, 88);
        footballMoveToward(player, targetX, laneY, 12.5, dt);
      } else if (possession === "rival") {
        const rivalOwner = owner;
        const targetX = clamp(rivalOwner.x - 12, 20, 58);
        const targetY = index === 0 ? rivalOwner.y : index === 1 ? 31 : 69;
        footballMoveToward(player, targetX, targetY, 11.5, dt);
      } else {
        footballMoveToward(player, player.homeX, player.homeY, 10.5, dt);
      }
    });
''',
'''    const voltzOffBall = voltzOutfield.filter((player) => player.id !== owner?.id && player.id !== g.controlledId);
    voltzOutfield.forEach((player, index) => {
      if (player.id === g.controlledId) return;
      const roleIndex = Math.max(0, voltzOffBall.findIndex((candidate) => candidate.id === player.id));
      if (possession === "voltz") {
        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);
        footballMoveToward(player, target.x, target.y, roleIndex % 2 === 0 ? 13.4 : 15.2, dt);
      } else if (possession === "rival") {
        const target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);
        footballMoveToward(player, target.x, target.y, 12.2, dt);
      } else {
        const movement = getFootballLooseBallMovement(g, player, now, roleIndex);
        if (movement && movement.speed > 0) footballMoveToward(player, movement.x, movement.y, movement.speed, dt);
      }
    });
''',
'voltz smart offball'
)

rep(
'''    rivalOutfield.forEach((player, index) => {
      if (owner?.id === player.id) return;
      if (possession === "voltz") {
        const pressOrder = rivalOutfield.slice().sort((a, b) => footballDistance(a, ball) - footballDistance(b, ball));
        const pressing = pressOrder[0]?.id === player.id;
        const targetX = pressing ? ball.x + 1.5 : clamp(ball.x + 14 + index * 3, 54, 84);
        const targetY = pressing ? ball.y : index === 0 ? 50 : index === 1 ? 30 : 70;
        footballMoveToward(player, targetX, targetY, pressing ? 15.5 : 11.5, dt);
        const liveOwner = getFootballOwner(g);
        if (pressing && liveOwner?.team === "voltz" && !liveOwner.keeper && footballDistance(player, liveOwner) < 4.25 && now >= Number(player.tackleCooldownUntil || 0)) {
          executeFootballTackle(g, player, now, { ai:true, autoAim:true });
        }
      } else if (possession === "rival") {
        const laneY = index === 0 ? 50 : index === 1 ? 28 : 72;
        footballMoveToward(player, clamp(ball.x - 14, 14, 80), laneY, 11.8, dt);
      } else {
        footballMoveToward(player, ball.x, ball.y, 11, dt);
      }
    });
''',
'''    const rivalOffBall = rivalOutfield.filter((player) => player.id !== owner?.id);
    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    rivalOutfield.forEach((player, index) => {
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
          footballMoveToward(player, target.x, target.y, 12.4, dt);
        }
      } else if (possession === "rival") {
        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);
        footballMoveToward(player, target.x, target.y, roleIndex % 2 === 0 ? 13.0 : 14.6, dt);
      } else {
        const movement = getFootballLooseBallMovement(g, player, now, roleIndex);
        if (movement && movement.speed > 0) footballMoveToward(player, movement.x, movement.y, movement.speed, dt);
      }
    });
''',
'rival smart offball'
)

p.write_text(s, encoding='utf-8')
print('football off-ball AI V3.2 applied')
