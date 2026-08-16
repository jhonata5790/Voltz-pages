from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
js = path.read_text(encoding='utf-8')

# ------------------------------------------------------------
# 1. Perfil tatico dinamico do rival conforme o placar.
# ------------------------------------------------------------
anchor = '''  function getFootballAdaptiveRead(g, now = performance.now()) {\n'''
assert anchor in js, 'adaptive read anchor not found'
insert = r'''  function getFootballRivalTactics(g) {
    const deficit = Number(g?.score || 0) - Number(g?.rivalScore || 0);
    if (deficit >= 2) {
      return {
        id:"all-in", label:"PRESSÃO TOTAL", pressSpeed:16.7, coverSpeed:12.75,
        runnerSpeed:15.75, supportSpeed:13.55, dribbleSpeed:13.9,
        tackleDistance:4.38, tackleCooldown:835, secondaryClose:.24,
        actionDelayScale:.82, throughBias:.20, crossBias:.17, shotRange:34,
        readBoost:.075, blockDepth:-.052, centerCompact:.03
      };
    }
    if (deficit === 1) {
      return {
        id:"chase", label:"PRESSÃO ALTA", pressSpeed:16.05, coverSpeed:12.45,
        runnerSpeed:15.35, supportSpeed:13.25, dribbleSpeed:13.7,
        tackleDistance:4.30, tackleCooldown:900, secondaryClose:.14,
        actionDelayScale:.90, throughBias:.11, crossBias:.09, shotRange:31,
        readBoost:.04, blockDepth:-.025, centerCompact:.04
      };
    }
    if (deficit <= -1) {
      return {
        id:"protect", label:"BLOCO COMPACTO", pressSpeed:14.75, coverSpeed:12.55,
        runnerSpeed:14.55, supportSpeed:12.65, dribbleSpeed:13.0,
        tackleDistance:4.12, tackleCooldown:1040, secondaryClose:0,
        actionDelayScale:1.06, throughBias:.03, crossBias:-.06, shotRange:25,
        readBoost:.025, blockDepth:.055, centerCompact:.12
      };
    }
    return {
      id:"balanced", label:"EQUILÍBRIO", pressSpeed:15.5, coverSpeed:12.1,
      runnerSpeed:14.9, supportSpeed:12.9, dribbleSpeed:13.5,
      tackleDistance:4.25, tackleCooldown:980, secondaryClose:.06,
      actionDelayScale:1, throughBias:0, crossBias:0, shotRange:27,
      readBoost:0, blockDepth:0, centerCompact:.06
    };
  }

  function updateFootballRivalTacticalMode(g) {
    if (!g) return;
    const tactics = getFootballRivalTactics(g);
    if (g.rivalTacticalMode === tactics.id) return;
    g.rivalTacticalMode = tactics.id;
    if (g.aiRead) g.aiRead.until = 0;
    const messages = {
      "all-in":"O visitante mudou tudo: pressão total, linha alta e mais gente atacando o espaço.",
      chase:"O visitante subiu a marcação e começou a apertar sua saída de bola.",
      balanced:"O visitante voltou para uma estrutura equilibrada.",
      protect:"O visitante baixou as linhas e passou a proteger a vantagem para sair no contra-ataque."
    };
    g.pendingTacticalMessage = messages[tactics.id] || "";
  }

'''
js = js.replace(anchor, insert + anchor, 1)

old_read = '''  function getFootballAdaptiveRead(g, now = performance.now()) {\n    const style = getFootballPlayerStyle(g);\n    const cached = g?.aiRead;\n    if (cached && now < Number(cached.until || 0)) return cached;\n\n    const confidence = style.confidence;\n    const read = {\n      until:now + 850 + Math.random() * 430,\n      targetId:style.favoredTargetId && Math.random() < confidence ? style.favoredTargetId : null,\n      lane:style.favoredLane && Math.random() < confidence * .9 ? style.favoredLane : null,\n      shotLane:style.shotLane && Math.random() < confidence * .78 ? style.shotLane : null,\n      confidence\n    };'''
new_read = '''  function getFootballAdaptiveRead(g, now = performance.now()) {\n    const style = getFootballPlayerStyle(g);\n    const cached = g?.aiRead;\n    if (cached && now < Number(cached.until || 0)) return cached;\n\n    const tactics = getFootballRivalTactics(g);\n    // Mesmo quando está desesperado, o rival nunca ganha leitura perfeita. Ele apenas\n    // presta mais atenção aos padrões que já observou.\n    const confidence = clamp(style.confidence + tactics.readBoost, 0, .74);\n    const read = {\n      until:now + 850 + Math.random() * 430,\n      targetId:style.favoredTargetId && Math.random() < confidence ? style.favoredTargetId : null,\n      lane:style.favoredLane && Math.random() < confidence * .9 ? style.favoredLane : null,\n      shotLane:style.shotLane && Math.random() < confidence * .78 ? style.shotLane : null,\n      confidence\n    };'''
assert old_read in js, 'adaptive read block not found'
js = js.replace(old_read, new_read, 1)

# ------------------------------------------------------------
# 2. Estado inicial + mudanças de postura depois de cada gol.
# ------------------------------------------------------------
old_state = '''      playerModel: loadFootballPlayerModel(),\n      aiRead: { until:0, targetId:null, lane:null, shotLane:null, confidence:0 },\n      feedback: compact ? "Gol de ouro no Pentatlo: marque antes do rival." : `Primeiro a ${targetGoals} gols. Leia o campo antes de acelerar a jogada.`,'''
new_state = '''      playerModel: loadFootballPlayerModel(),\n      aiRead: { until:0, targetId:null, lane:null, shotLane:null, confidence:0 },\n      rivalTacticalMode:"balanced",\n      pendingTacticalMessage:"",\n      possessionTeam:"voltz",\n      lastTurnoverAt:0,\n      lastTurnoverWinner:null,\n      feedback: compact ? "Gol de ouro no Pentatlo: marque antes do rival." : `Primeiro a ${targetGoals} gols. Leia o campo antes de acelerar a jogada.`,'''
assert old_state in js, 'football initial AI state not found'
js = js.replace(old_state, new_state, 1)

old_possession_start = '''  function footballSetPossession(g, player, now, feedback = "") {\n    if (!g || !player) return;\n    g.ball.ownerId = player.id;'''
new_possession_start = '''  function footballSetPossession(g, player, now, feedback = "") {\n    if (!g || !player) return;\n    const previousTeam = g.possessionTeam || null;\n    if (previousTeam && previousTeam !== player.team) {\n      g.lastTurnoverAt = now;\n      g.lastTurnoverWinner = player.team;\n    }\n    g.possessionTeam = player.team;\n    g.ball.ownerId = player.id;'''
assert old_possession_start in js, 'footballSetPossession start not found'
js = js.replace(old_possession_start, new_possession_start, 1)

old_reset = '''    const starter = getFootballPlayer(g, team === "voltz" ? "v1" : "r1");\n    footballSetPossession(g, starter, performance.now(), team === "voltz" ? "Sua saída. Construa o ataque." : "Saída do visitante. Recupere a bola.");\n    g.controlledId = "v1";\n    g.phase = "play";\n    g.banner = team === "voltz" ? "SAÍDA VOLTZ" : "SAÍDA VISITANTE";'''
new_reset = '''    const starter = getFootballPlayer(g, team === "voltz" ? "v1" : "r1");\n    // Saída de bola não conta como troca de posse para a leitura de contra-ataque.\n    g.possessionTeam = team;\n    footballSetPossession(g, starter, performance.now(), team === "voltz" ? "Sua saída. Construa o ataque." : "Saída do visitante. Recupere a bola.");\n    g.controlledId = "v1";\n    g.phase = "play";\n    g.banner = team === "voltz" ? "SAÍDA VOLTZ" : "SAÍDA VISITANTE";\n    if (g.pendingTacticalMessage) {\n      g.feedback = g.pendingTacticalMessage;\n      g.pendingTacticalMessage = "";\n    }'''
assert old_reset in js, 'kickoff reset block not found'
js = js.replace(old_reset, new_reset, 1)

old_goal_update = '''    }\n    updateFootballDom(performance.now());\n\n    if (g.score >= g.targetGoals || g.rivalScore >= g.targetGoals) {'''
new_goal_update = '''    }\n    updateFootballRivalTacticalMode(g);\n    updateFootballDom(performance.now());\n\n    if (g.score >= g.targetGoals || g.rivalScore >= g.targetGoals) {'''
# only first occurrence after footballGoal should match this exact nearby text
assert old_goal_update in js, 'goal tactical update anchor not found'
js = js.replace(old_goal_update, new_goal_update, 1)

# ------------------------------------------------------------
# 3. Bote da IA aceita urgência tática sem buff absurdo.
# ------------------------------------------------------------
old_tackle = '''    tackler.tackleUntil = now + 250;\n    tackler.tackleCooldownUntil = now + (options.ai ? 980 : 820);\n    tackler.x = clamp(tackler.x + facing.x * 4.2, 7, 93);'''
new_tackle = '''    tackler.tackleUntil = now + 250;\n    const aiCooldown = Number.isFinite(Number(options.aiCooldown)) ? Number(options.aiCooldown) : 980;\n    tackler.tackleCooldownUntil = now + (options.ai ? aiCooldown : 820);\n    tackler.x = clamp(tackler.x + facing.x * 4.2, 7, 93);'''
assert old_tackle in js, 'tackle cooldown block not found'
js = js.replace(old_tackle, new_tackle, 1)

old_success = '''    const success = distance <= (options.ai ? 3.75 : 4.15) && alignment > -.18;'''
new_success = '''    const aiReach = Number.isFinite(Number(options.aiReach)) ? Number(options.aiReach) : 3.75;\n    const success = distance <= (options.ai ? aiReach : 4.15) && alignment > -.18;'''
assert old_success in js, 'tackle success block not found'
js = js.replace(old_success, new_success, 1)

# ------------------------------------------------------------
# 4. Bloco defensivo muda de altura/compactação conforme placar.
# ------------------------------------------------------------
old_depth = '''    const depthGuard = adaptiveDefense && style ? .24 + style.throughRate * style.confidence * .12 : .24;\n    const insideY = receiver.y + (50 - receiver.y) * .08;\n    let targetY = insideY;'''
new_depth = '''    const tactics = adaptiveDefense ? getFootballRivalTactics(g) : null;\n    const baseDepthGuard = adaptiveDefense && style ? .24 + style.throughRate * style.confidence * .12 : .24;\n    const depthGuard = clamp(baseDepthGuard + Number(tactics?.blockDepth || 0), .16, .34);\n    const insideY = receiver.y + (50 - receiver.y) * .08;\n    let targetY = insideY;\n    if (adaptiveDefense && tactics?.centerCompact) targetY += (50 - targetY) * tactics.centerCompact;'''
assert old_depth in js, 'defensive depth block not found'
js = js.replace(old_depth, new_depth, 1)

# ------------------------------------------------------------
# 5. Ataque rival reage à necessidade: acelerar, equilibrar ou controlar.
# ------------------------------------------------------------
old_enemy_pass_delay = '''    g.aiActionAt = now + 900;'''
new_enemy_pass_delay = '''    g.aiActionAt = now + 900 * getFootballRivalTactics(g).actionDelayScale;'''
assert old_enemy_pass_delay in js, 'enemy pass delay not found'
js = js.replace(old_enemy_pass_delay, new_enemy_pass_delay, 1)

old_through_delay = '''    g.aiActionAt = now + 980;'''
new_through_delay = '''    g.aiActionAt = now + 980 * getFootballRivalTactics(g).actionDelayScale;'''
assert old_through_delay in js, 'enemy through delay not found'
js = js.replace(old_through_delay, new_through_delay, 1)

old_cross_delay = '''    g.aiActionAt = now + 1120;'''
new_cross_delay = '''    g.aiActionAt = now + 1120 * getFootballRivalTactics(g).actionDelayScale;'''
assert old_cross_delay in js, 'enemy cross delay not found'
js = js.replace(old_cross_delay, new_cross_delay, 1)

old_shoot_delay = '''    g.aiActionAt = now + 1400;'''
new_shoot_delay = '''    g.aiActionAt = now + 1400 * getFootballRivalTactics(g).actionDelayScale;'''
assert old_shoot_delay in js, 'enemy shoot delay not found'
js = js.replace(old_shoot_delay, new_shoot_delay, 1)

start = js.index('  function chooseFootballEnemyAction(g, owner, now) {')
end = js.index('  function updateFootballControlledPlayer(g, dt) {', start)
new_enemy_choice = r'''  function chooseFootballEnemyAction(g, owner, now) {
    const voltz = getFootballTeam(g, "voltz", false);
    const nearest = voltz.slice().sort((a, b) => footballDistance(a, owner) - footballDistance(b, owner))[0];
    const pressure = nearest ? footballDistance(nearest, owner) : 99;
    const tactics = getFootballRivalTactics(g);
    const justReceived = now - Number(owner.receivedAt || 0) < 520;
    const counterWindow = g.lastTurnoverWinner === "rival" && now - Number(g.lastTurnoverAt || 0) < 1250;
    const wide = owner.y <= 27 || owner.y >= 73;
    const nearGoal = owner.x <= tactics.shotRange;
    const decision = Math.random();

    // Quem está vencendo prefere segurança, mas acelera se acabou de recuperar a bola.
    if (tactics.id === "protect") {
      if (nearGoal && decision < .67) return footballEnemyShoot(g, owner, now);
      if (counterWindow && owner.x <= 80 && decision < .72 && footballEnemyThroughPass(g, owner, now)) return true;
      if (justReceived && pressure < 6.3 && decision < .78) return footballEnemyPass(g, owner, now);
      if (pressure < 9.2 || decision < .48) return footballEnemyPass(g, owner, now);
      if (wide && owner.x <= 48 && decision < .56 && footballEnemyCross(g, owner, now)) return true;
      return false;
    }

    // Sob pressão logo após dominar, procura uma saída de primeira em vez de congelar.
    if (justReceived && pressure < 5.3 && decision < (.66 + tactics.throughBias * .18)) return footballEnemyPass(g, owner, now);
    if (nearGoal && (pressure > 5.5 || decision < (.76 + tactics.throughBias * .38))) return footballEnemyShoot(g, owner, now);
    if (wide && owner.x <= 56 && decision < clamp(.64 + tactics.crossBias, .42, .84) && footballEnemyCross(g, owner, now)) return true;
    if (owner.x <= 80 && decision < clamp(.52 + tactics.throughBias, .38, .78) && footballEnemyThroughPass(g, owner, now)) return true;
    if (pressure < 8.2 || decision < (.24 + tactics.throughBias * .25)) return footballEnemyPass(g, owner, now);
    return false;
  }

'''
js = js[:start] + new_enemy_choice + js[end:]

# ------------------------------------------------------------
# 6. Pressão rival: abordagem angular, segunda cobertura e linha baixa ao vencer.
# ------------------------------------------------------------
old_rival_intro = '''    // Rival: um pressiona, os outros protegem passe/profundidade.\n    const rivalOffBall = rivalOutfield.filter((player) => player.id !== owner?.id);\n    const rivalPressOrder = possession === "voltz"\n      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))\n      : [];'''
new_rival_intro = '''    // Rival: um pressiona, os outros protegem passe/profundidade. A altura do bloco\n    // e a proximidade da segunda cobertura mudam conforme o estado do placar.\n    const rivalTactics = getFootballRivalTactics(g);\n    const rivalRead = possession === "voltz" ? getFootballAdaptiveRead(g, now) : null;\n    const rivalOffBall = rivalOutfield.filter((player) => player.id !== owner?.id);\n    const rivalPressOrder = possession === "voltz"\n      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))\n      : [];'''
assert old_rival_intro in js, 'rival press intro not found'
js = js.replace(old_rival_intro, new_rival_intro, 1)

old_rival_defense = '''      if (possession === "voltz") {\n        const pressing = rivalPressOrder[0]?.id === player.id;\n        if (pressing) {\n          footballMoveToward(player, owner.x, owner.y, 15.5, dt);\n          const liveOwner = getFootballOwner(g);\n          if (liveOwner?.team === "voltz" && !liveOwner.keeper && footballDistance(player, liveOwner) < 4.25 && now >= Number(player.tackleCooldownUntil || 0)) {\n            executeFootballTackle(g, player, now, { ai:true, autoAim:true });\n          }\n        } else {\n          const target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);\n          footballMoveToward(player, target.x, target.y, 12.1, dt);\n        }\n      } else if (possession === "rival") {\n        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);\n        const role = getFootballAttackShape(g, owner).get(player.id)?.role;\n        footballMoveToward(player, target.x, target.y, role === "runner" ? 14.9 : 12.9, dt);'''
new_rival_defense = '''      if (possession === "voltz") {\n        const pressRank = rivalPressOrder.findIndex((candidate) => candidate.id === player.id);\n        // Vencendo, o rival só salta no portador quando a bola entra na metade mais perigosa\n        // ou quando o marcador já está perto. Atrás no placar, aperta desde a saída.\n        const protectHold = rivalTactics.id === "protect" && owner.x < 44 && footballDistance(player, owner) > 7.5;\n        const pressing = pressRank === 0 && !protectHold;\n        if (pressing) {\n          let pressX = owner.x + (rivalTactics.id === "all-in" ? 1.65 : 1.15);\n          let pressY = owner.y;\n          // Ele tenta chegar pelo lado do corredor que aprendeu que você prefere, fechando-o.\n          if (rivalRead?.lane === "upper") pressY -= 1.8;\n          else if (rivalRead?.lane === "lower") pressY += 1.8;\n          pressX = clamp(pressX, 7, 93);\n          pressY = clamp(pressY, 8, 92);\n          footballMoveToward(player, pressX, pressY, rivalTactics.pressSpeed, dt);\n          const liveOwner = getFootballOwner(g);\n          if (liveOwner?.team === "voltz" && !liveOwner.keeper && footballDistance(player, liveOwner) < rivalTactics.tackleDistance && now >= Number(player.tackleCooldownUntil || 0)) {\n            executeFootballTackle(g, player, now, { ai:true, autoAim:true, aiReach:rivalTactics.tackleDistance - .48, aiCooldown:rivalTactics.tackleCooldown });\n          }\n        } else {\n          let target = getFootballDefensiveBlockTarget(g, player, owner, roleIndex);\n          if (pressRank === 1 && rivalTactics.secondaryClose > 0) {\n            target = {\n              x:target.x + (owner.x - target.x) * rivalTactics.secondaryClose,\n              y:target.y + (owner.y - target.y) * rivalTactics.secondaryClose\n            };\n          }\n          footballMoveToward(player, target.x, target.y, rivalTactics.coverSpeed, dt);\n        }\n      } else if (possession === "rival") {\n        const target = getFootballOpenSpaceTarget(g, player, owner, roleIndex);\n        const role = getFootballAttackShape(g, owner).get(player.id)?.role;\n        footballMoveToward(player, target.x, target.y, role === "runner" ? rivalTactics.runnerSpeed : rivalTactics.supportSpeed, dt);'''
assert old_rival_defense in js, 'rival defense block not found'
js = js.replace(old_rival_defense, new_rival_defense, 1)

old_rival_dribble = '''        const targetY = clamp(50 + (owner.y - 50) * .38, 29, 71);\n        const dribbleTargetX = owner.x <= 24 ? 12 : Math.max(12, owner.x - 18);\n        footballMoveToward(owner, dribbleTargetX, targetY, 13.5, dt);\n        if (now >= Number(g.aiActionAt || 0)) g.aiActionAt = now + 260;'''
new_rival_dribble = '''        const rivalTactics = getFootballRivalTactics(g);\n        const targetY = clamp(50 + (owner.y - 50) * (rivalTactics.id === "protect" ? .28 : .38), 29, 71);\n        const advance = rivalTactics.id === "all-in" ? 21 : rivalTactics.id === "protect" ? 14 : 18;\n        const dribbleTargetX = owner.x <= 24 ? 12 : Math.max(12, owner.x - advance);\n        footballMoveToward(owner, dribbleTargetX, targetY, rivalTactics.dribbleSpeed, dt);\n        if (now >= Number(g.aiActionAt || 0)) g.aiActionAt = now + 260 * rivalTactics.actionDelayScale;'''
assert old_rival_dribble in js, 'rival dribble block not found'
js = js.replace(old_rival_dribble, new_rival_dribble, 1)

path.write_text(js, encoding='utf-8')
print('Football V5.1 dynamic match tactics applied')
