from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
js = path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global js
    if old not in js:
        raise SystemExit(f'marker not found: {label}')
    js = js.replace(old, new, 1)

# V5.3 · memória curta de tabelinha / devolução.
old = '''      nextTacticalReadAt:0,
      lastTacticalNoticeAt:0,
      feedback: compact ? "Gol de ouro no Pentatlo: marque antes do rival." : `Primeiro a ${targetGoals} gols. Leia o campo antes de acelerar a jogada.`,
'''
new = '''      nextTacticalReadAt:0,
      lastTacticalNoticeAt:0,
      lastVoltzPass:null,
      oneTwoAlertUntil:0,
      feedback: compact ? "Gol de ouro no Pentatlo: marque antes do rival." : `Primeiro a ${targetGoals} gols. Leia o campo antes de acelerar a jogada.`,
'''
replace_once(old, new, 'initial one-two state')

old = '''    const throughBall = predicted.moving && leadDistance >= 1.35;
    recordFootballPlayerTendency(g, throughBall ? "through" : "pass", { targetId:target.id, y:predicted.y });
    const forwardGain = predicted.x - owner.x;
    addFootballVoltzThreat(g, predicted.x >= 70 ? (throughBall ? 5.8 : 4.2) : forwardGain >= 9 ? 2.5 : .7, now, throughBall ? "through" : "pass");
    footballLaunchBall(g, owner, predicted.x, predicted.y, 48, now, { passTargetId: target.id });
'''
new = '''    const throughBall = predicted.moving && leadDistance >= 1.35;
    recordFootballPlayerTendency(g, throughBall ? "through" : "pass", { targetId:target.id, y:predicted.y });
    const previousPass = g.lastVoltzPass;
    const oneTwo = Boolean(
      previousPass &&
      previousPass.fromId === target.id &&
      previousPass.targetId === owner.id &&
      now - Number(previousPass.at || 0) <= 1700
    );
    if (oneTwo) {
      g.oneTwoAlertUntil = now + 5200;
      addFootballVoltzThreat(g, 5.4, now, "one-two");
    }
    g.lastVoltzPass = { fromId:owner.id, targetId:target.id, at:now };
    const forwardGain = predicted.x - owner.x;
    addFootballVoltzThreat(g, predicted.x >= 70 ? (throughBall ? 5.8 : 4.2) : forwardGain >= 9 ? 2.5 : .7, now, throughBall ? "through" : "pass");
    footballLaunchBall(g, owner, predicted.x, predicted.y, 48, now, { passTargetId: target.id });
'''
replace_once(old, new, 'detect one-two')

# Defensive roles: one presses, one protects the return pass, one owns weak side/depth.
marker = '''  function getFootballLooseBallMovement(g, player, now, roleIndex = 0, primaryChaserId = null) {
'''
helper = '''  function getFootballRivalCoverAssignments(g, owner, rivalOutfield, presserId, now = performance.now()) {
    const assignments = new Map();
    if (!g || !owner || owner.team !== "voltz") return assignments;

    const coverDefenders = (rivalOutfield || []).filter((player) => player.id !== presserId);
    const receivers = getFootballTeam(g, "voltz", false).filter((player) => player.id !== owner.id);
    if (!coverDefenders.length || !receivers.length) return assignments;

    const recentPass = g.lastVoltzPass;
    const recentWall = recentPass && recentPass.targetId === owner.id && now - Number(recentPass.at || 0) <= 1900
      ? receivers.find((player) => player.id === recentPass.fromId) || null
      : null;
    const wallTarget = recentWall || receivers.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner))[0];
    const weakTarget = receivers
      .filter((player) => player.id !== wallTarget?.id)
      .sort((a, b) => {
        const aWidth = Math.abs(a.y - owner.y) * 1.35 + Math.max(0, a.x - owner.x) * .42;
        const bWidth = Math.abs(b.y - owner.y) * 1.35 + Math.max(0, b.x - owner.x) * .42;
        return bWidth - aWidth;
      })[0] || null;

    const remaining = coverDefenders.slice();
    const takeNearest = (target) => {
      if (!target || !remaining.length) return null;
      remaining.sort((a, b) => footballDistance(a, target) - footballDistance(b, target));
      return remaining.shift() || null;
    };

    const wallDefender = takeNearest(wallTarget);
    const weakDefender = takeNearest(weakTarget) || remaining.shift() || null;
    const tactics = getFootballRivalTactics(g);
    const oneTwoAware = now < Number(g.oneTwoAlertUntil || 0) || Boolean(recentWall);

    if (wallDefender && wallTarget) {
      const laneBlend = oneTwoAware ? .34 : .23;
      const target = {
        x:clamp(wallTarget.x + (owner.x - wallTarget.x) * laneBlend + 2.0, 10, 91),
        y:clamp(wallTarget.y + (owner.y - wallTarget.y) * laneBlend, 10, 90)
      };
      assignments.set(wallDefender.id, {
        role:"return-guard",
        target,
        speed:tactics.coverSpeed + (oneTwoAware ? .58 : .18),
        markId:wallTarget.id
      });
    }

    if (weakDefender && weakTarget) {
      // O lado fraco não pode ficar vazio só porque a bola está do outro lado.
      // Fica do lado do gol do receptor, perto o bastante para cortar a inversão.
      const goalSide = clamp((93 - weakTarget.x) * .15, 2.6, 6.4);
      const target = {
        x:clamp(weakTarget.x + goalSide, 11, 92),
        y:clamp(weakTarget.y + (50 - weakTarget.y) * .045, 10, 90)
      };
      assignments.set(weakDefender.id, {
        role:"weak-side-guard",
        target,
        speed:tactics.coverSpeed + .28,
        markId:weakTarget.id
      });
    }

    remaining.forEach((defender) => {
      const goalLine = { x:86, y:clamp(50 + (owner.y - 50) * .24, 32, 68) };
      assignments.set(defender.id, { role:"sweeper", target:goalLine, speed:tactics.coverSpeed, markId:null });
    });
    return assignments;
  }

'''
if marker not in js:
    raise SystemExit('marker not found: cover helper insertion')
js = js.replace(marker, helper + marker, 1)

old = '''    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    const pressureBroken = possession === "voltz" && rivalOutfield.some((player) =>
      now < Number(player.recoverUntil || 0) &&
      now < Number(player.tackleCooldownUntil || 0) &&
      footballDistance(player, owner) > 5.2
    );
'''
new = '''    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    const rivalPresserId = possession === "voltz" ? rivalPressOrder[0]?.id || null : null;
    const rivalCoverAssignments = possession === "voltz"
      ? getFootballRivalCoverAssignments(g, owner, rivalOutfield, rivalPresserId, now)
      : new Map();
'''
replace_once(old, new, 'replace pressure broken with cover assignments')

old = '''        const pressRank = rivalPressOrder.findIndex((candidate) => candidate.id === player.id);
        // Vencendo, o rival só salta no portador quando a bola entra na metade mais perigosa
        // ou quando o marcador já está perto. Atrás no placar, aperta desde a saída.
        const protectHold = rivalTactics.id === "protect" && owner.x < 44 && footballDistance(player, owner) > 7.5;
        const pressing = pressRank === 0 && !protectHold;
'''
new = '''        const pressRank = rivalPressOrder.findIndex((candidate) => candidate.id === player.id);
        // Só um defensor salta no portador. Os outros recebem responsabilidades próprias
        // de devolução e lado fraco para não abrir o campo inteiro atrás da pressão.
        const protectHold = rivalTactics.id === "protect" && owner.x < 44 && footballDistance(player, owner) > 7.5;
        const pressing = player.id === rivalPresserId && !protectHold;
'''
replace_once(old, new, 'single presser')

old = '''        } else {
          let target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);
          const emergencyClose = pressRank === 1 && pressureBroken ? Math.max(.34, rivalTactics.secondaryClose) : rivalTactics.secondaryClose;
          if (pressRank === 1 && emergencyClose > 0) {
            target = {
              x:target.x + (owner.x - target.x) * emergencyClose,
              y:target.y + (owner.y - target.y) * emergencyClose
            };
          }
          footballMoveToward(player, target.x, target.y, rivalTactics.coverSpeed + (pressRank === 1 && pressureBroken ? 1.05 : 0), dt);
        }
'''
new = '''        } else {
          const assignment = rivalCoverAssignments.get(player.id);
          const target = assignment?.target || getFootballDefensiveBlockTarget(g, player, owner, roleIndex);
          player.defensiveRole = assignment?.role || "cover";
          player.markId = assignment?.markId || null;
          footballMoveToward(player, target.x, target.y, assignment?.speed || rivalTactics.coverSpeed, dt);
        }
'''
replace_once(old, new, 'role based cover branch')

path.write_text(js, encoding='utf-8')
print('Football V5.3 defensive shape patch applied')
