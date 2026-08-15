from pathlib import Path
import re

p = Path('assets/js/realms/physical-education/sports-minigames.js')
s = p.read_text(encoding='utf-8')

old = '''        x:26, y:50, z:0, vx:0, vy:0, vz:0, ownerId:"v1", lastTouchTeam:"voltz",
        passTargetId:null, isShot:false, isCross:false, airborne:false, landingX:null, landingY:null,
        ignorePickupUntil:0, keeperReleaseAt:0'''
new = '''        x:26, y:50, z:0, vx:0, vy:0, vz:0, ownerId:"v1", lastTouchTeam:"voltz",
        passTargetId:null, isShot:false, isCross:false, airborne:false, landingX:null, landingY:null,
        ignorePickupUntil:0, keeperReleaseAt:0, shotAt:0, shotId:0'''
assert old in s, 'ball init block not found'
s = s.replace(old, new, 1)

old = '''    g.ball.isShot = false;
    g.ball.isCross = false;'''
new = '''    g.ball.isShot = false;
    g.ball.shotAt = 0;
    g.ball.isCross = false;'''
assert old in s, 'possession shot reset block not found'
s = s.replace(old, new, 1)

old = '''    g.ball.isShot = Boolean(options.isShot);
    g.ball.isCross = Boolean(options.isCross);'''
new = '''    g.ball.isShot = Boolean(options.isShot);
    g.ball.shotAt = options.isShot ? now : 0;
    if (options.isShot) g.ball.shotId = Number(g.ball.shotId || 0) + 1;
    g.ball.isCross = Boolean(options.isCross);'''
assert old in s, 'launch shot block not found'
s = s.replace(old, new, 1)

old = '''  function updateFootballKeepers(g, dt) {
    const ballY = g.ball.y;
    const vgk = getFootballPlayer(g, "vgk");
    const rgk = getFootballPlayer(g, "rgk");
    footballMoveToward(vgk, 5.5, clamp(ballY, 37, 63), vgk.speed, dt);
    footballMoveToward(rgk, 94.5, clamp(ballY, 37, 63), rgk.speed, dt);
  }
'''
new = '''  function getFootballKeeperThreat(g, keeper) {
    if (!g || !keeper) return null;
    const opponentTeam = keeper.team === "voltz" ? "rival" : "voltz";
    const owner = getFootballOwner(g);
    if (owner?.team === opponentTeam) return owner;
    if (!g.ball.ownerId && g.ball.lastTouchTeam === opponentTeam) return g.ball;
    return null;
  }

  function getFootballShotPrediction(g, keeper) {
    const ball = g?.ball;
    if (!ball || !keeper || ball.ownerId || !ball.isShot) return null;
    const towardGoal = keeper.team === "voltz" ? ball.vx < 0 : ball.vx > 0;
    if (!towardGoal) return null;

    const samples = getFootballBallFutureSamples(g, 1.9, .03);
    if (!samples.length) return null;
    const goalX = keeper.team === "voltz" ? 1 : 99;
    const crossing = samples.find((sample) => keeper.team === "voltz" ? sample.x <= goalX : sample.x >= goalX)
      || samples.slice().sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX))[0];
    if (!crossing) return null;
    return {
      ...crossing,
      onTarget:crossing.y >= 35.5 && crossing.y <= 64.5 && crossing.z <= 4.8
    };
  }

  function getFootballKeeperBasePosition(g, keeper) {
    const threat = getFootballKeeperThreat(g, keeper);
    const goalX = keeper.team === "voltz" ? 0 : 100;
    const homeX = keeper.team === "voltz" ? 5.5 : 94.5;
    if (!threat) return { x:homeX, y:50 };

    const distanceToGoal = Math.abs(goalX - threat.x);
    const danger = clamp((58 - distanceToGoal) / 48, 0, 1);
    const angleWeight = .22 + danger * .22;
    const targetY = clamp(50 + (threat.y - 50) * angleWeight, 39, 61);
    const stepOut = danger * (Math.abs(threat.y - 50) < 24 ? 4.6 : 2.8);
    const targetX = keeper.team === "voltz" ? homeX + stepOut : homeX - stepOut;
    return { x:targetX, y:targetY };
  }

  function updateFootballKeeper(g, keeper, now, dt) {
    if (!keeper) return;
    const base = getFootballKeeperBasePosition(g, keeper);
    const prediction = getFootballShotPrediction(g, keeper);

    if (!prediction?.onTarget) {
      footballMoveToward(keeper, base.x, base.y, keeper.speed, dt);
      return;
    }

    const shotId = Number(g.ball.shotId || 0);
    if (Number(keeper.lastReadShotId || 0) !== shotId) {
      keeper.lastReadShotId = shotId;
      keeper.reactionUntil = Number(g.ball.shotAt || now) + 115 + Math.random() * 55;
      const readError = (Math.random() - .5) * 2.2;
      keeper.saveReadY = clamp(prediction.y + readError, 35.5, 64.5);
    }

    if (now < Number(keeper.reactionUntil || 0)) {
      footballMoveToward(keeper, base.x, base.y, keeper.speed * .9, dt);
      return;
    }

    const targetY = clamp(Number(keeper.saveReadY ?? prediction.y), 35.5, 64.5);
    const distanceY = Math.abs(targetY - keeper.y);
    const shotClosing = keeper.team === "voltz" ? g.ball.x < 24 : g.ball.x > 76;
    const dive = distanceY > 4.2 && shotClosing;
    if (dive) keeper.diveUntil = now + 150;

    const goalLineX = keeper.team === "voltz" ? 5.1 : 94.9;
    const responseSpeed = dive ? 34 : distanceY > 2.5 ? 27 : 21;
    footballMoveToward(keeper, goalLineX, targetY, responseSpeed, dt);
  }

  function updateFootballKeepers(g, dt) {
    const now = performance.now();
    updateFootballKeeper(g, getFootballPlayer(g, "vgk"), now, dt);
    updateFootballKeeper(g, getFootballPlayer(g, "rgk"), now, dt);
  }
'''
assert old in s, 'keeper update block not found'
s = s.replace(old, new, 1)

old = '''        const radius = entry.player.keeper ? 4.4 : ball.z > 1.4 ? 2.25 : 2.65;
        return entry.distance < radius;'''
new = '''        const keeperDiving = entry.player.keeper && ball.isShot && now < Number(entry.player.diveUntil || 0);
        const radius = entry.player.keeper ? (keeperDiving ? 6.6 : 4.4) : ball.z > 1.4 ? 2.25 : 2.65;
        return entry.distance < radius;'''
assert old in s, 'keeper pickup radius block not found'
s = s.replace(old, new, 1)

old = '''    if (candidates.length) {
      const receiver = candidates[0].player;
      const intended = ball.passTargetId && receiver.id === ball.passTargetId;
      const blocked = ball.passTargetId && receiver.id !== ball.passTargetId;
      footballSetPossession(g, receiver, now,'''
new = '''    if (candidates.length) {
      const receiver = candidates[0].player;
      const intended = ball.passTargetId && receiver.id === ball.passTargetId;
      const blocked = ball.passTargetId && receiver.id !== ball.passTargetId;
      const wasShot = Boolean(ball.isShot);
      footballSetPossession(g, receiver, now,'''
assert old in s, 'candidate receive block not found'
s = s.replace(old, new, 1)

old = '''      if (blocked) g.banner = receiver.team === "voltz" ? "INTERCEPÇÃO" : "PASSE CORTADO";
    }
  }'''
new = '''      if (receiver.keeper && wasShot) {
        g.banner = receiver.team === "voltz" ? "DEFESA!" : "GOLEIRO DEFENDEU";
        g.feedback = receiver.team === "voltz" ? "Seu goleiro leu a trajetória e fez a defesa." : "O goleiro leu o chute e fechou o gol.";
      } else if (blocked) {
        g.banner = receiver.team === "voltz" ? "INTERCEPÇÃO" : "PASSE CORTADO";
      }
    }
  }'''
assert old in s, 'candidate banner block not found'
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
