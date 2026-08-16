from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
js = path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global js
    if old not in js:
        raise SystemExit(f'marker not found: {label}')
    js = js.replace(old, new, 1)

# ------------------------------------------------------------
# V5.2 · leitura de domínio antes do placar decidir a partida
# ------------------------------------------------------------
old = '''  function getFootballRivalTactics(g) {
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
new = '''  function addFootballVoltzThreat(g, amount, now = performance.now(), reason = "") {
    if (!g || !Number.isFinite(Number(amount))) return;
    g.voltzThreat = clamp(Number(g.voltzThreat || 0) + Number(amount), 0, 100);
    g.lastThreatEventAt = now;
    if (reason) g.lastThreatReason = reason;
  }

  function updateFootballDominanceRead(g, now, dt) {
    if (!g || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    let change = -5.6 * dt;

    if (owner?.team === "voltz" && !owner.keeper) {
      const territory = clamp((owner.x - 43) / 45, 0, 1);
      change += territory * 12.5 * dt;
      if (owner.x >= 68) change += 3.8 * dt;
      if (owner.x >= 82) change += 5.2 * dt;

      const dangerBand = owner.x >= 82 ? 3 : owner.x >= 68 ? 2 : owner.x >= 54 ? 1 : 0;
      if (dangerBand > Number(g.voltzDangerBand || 0) && now - Number(g.lastDangerBandAt || 0) > 520) {
        addFootballVoltzThreat(g, dangerBand === 3 ? 7.2 : dangerBand === 2 ? 4.6 : 2.2, now, "territory");
        g.lastDangerBandAt = now;
      }
      g.voltzDangerBand = dangerBand;
    } else if (owner?.team === "rival") {
      change -= 5.2 * dt;
      g.voltzDangerBand = 0;
    } else if (!owner && g.ball.lastTouchTeam === "voltz" && g.ball.x >= 56) {
      change += clamp((g.ball.x - 54) / 38, 0, 1) * 4.5 * dt;
    }

    g.voltzThreat = clamp(Number(g.voltzThreat || 0) + change, 0, 100);
    if (now >= Number(g.nextTacticalReadAt || 0)) {
      g.nextTacticalReadAt = now + 220;
      updateFootballRivalTacticalMode(g, now);
    }
  }

  function getFootballRivalTactics(g) {
    const deficit = Number(g?.score || 0) - Number(g?.rivalScore || 0);
    const threat = Number(g?.voltzThreat || 0);
    const current = g?.rivalTacticalMode || "balanced";
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

    const holdLockdown = current === "lockdown" && threat >= 43;
    if (threat >= 61 || holdLockdown) {
      return {
        id:"lockdown", label:"CERCO", pressSpeed:16.32, coverSpeed:12.72,
        runnerSpeed:15.18, supportSpeed:13.12, dribbleSpeed:13.58,
        tackleDistance:4.34, tackleCooldown:875, secondaryClose:.22,
        actionDelayScale:.91, throughBias:.08, crossBias:.06, shotRange:29,
        readBoost:.06, blockDepth:.012, centerCompact:.12
      };
    }

    const holdAlert = (current === "alert" || current === "lockdown") && threat >= 18;
    if (threat >= 27 || holdAlert) {
      return {
        id:"alert", label:"ALERTA", pressSpeed:15.92, coverSpeed:12.42,
        runnerSpeed:15.02, supportSpeed:13.02, dribbleSpeed:13.52,
        tackleDistance:4.29, tackleCooldown:930, secondaryClose:.14,
        actionDelayScale:.96, throughBias:.04, crossBias:.03, shotRange:28,
        readBoost:.035, blockDepth:.008, centerCompact:.09
      };
    }

    return {
      id:"balanced", label:"EQUILÍBRIO", pressSpeed:15.58, coverSpeed:12.16,
      runnerSpeed:14.9, supportSpeed:12.9, dribbleSpeed:13.5,
      tackleDistance:4.25, tackleCooldown:980, secondaryClose:.07,
      actionDelayScale:1, throughBias:0, crossBias:0, shotRange:27,
      readBoost:0, blockDepth:0, centerCompact:.06
    };
  }

  function updateFootballRivalTacticalMode(g, now = performance.now()) {
    if (!g) return;
    const tactics = getFootballRivalTactics(g);
    if (g.rivalTacticalMode === tactics.id) return;
    g.rivalTacticalMode = tactics.id;
    if (g.aiRead) g.aiRead.until = 0;
    const messages = {
      "all-in":"O visitante mudou tudo: pressão total, linha alta e mais gente atacando o espaço.",
      chase:"O visitante subiu a marcação e começou a apertar sua saída de bola.",
      lockdown:"O visitante percebeu o domínio da Voltz e montou um cerco antes do placar escapar.",
      alert:"O visitante identificou perigo cedo e encurtou as linhas para cortar sua construção.",
      balanced:"O visitante voltou para uma estrutura equilibrada.",
      protect:"O visitante baixou as linhas e passou a proteger a vantagem para sair no contra-ataque."
    };
    const message = messages[tactics.id] || "";
    if (g.phase === "play" && message && now - Number(g.lastTacticalNoticeAt || 0) > 1200) {
      g.feedback = message;
      g.lastTacticalNoticeAt = now;
      g.pendingTacticalMessage = "";
    } else {
      g.pendingTacticalMessage = message;
    }
  }
'''
replace_once(old, new, 'rival tactics block')

# Initial match telemetry state.
old = '''      rivalTacticalMode:"balanced",
      pendingTacticalMessage:"",
      possessionTeam:"voltz",
      lastTurnoverAt:0,
      lastTurnoverWinner:null,
'''
new = '''      rivalTacticalMode:"balanced",
      pendingTacticalMessage:"",
      possessionTeam:"voltz",
      lastTurnoverAt:0,
      lastTurnoverWinner:null,
      voltzThreat:0,
      voltzDangerBand:0,
      lastDangerBandAt:0,
      lastThreatEventAt:0,
      lastThreatReason:null,
      nextTacticalReadAt:0,
      lastTacticalNoticeAt:0,
'''
replace_once(old, new, 'initial telemetry state')

# Threat events from forward play.
old = '''    const leadDistance = Math.hypot(predicted.x - target.x, predicted.y - target.y);
    recordFootballPlayerTendency(g, predicted.moving && leadDistance >= 1.35 ? "through" : "pass", { targetId:target.id, y:predicted.y });
    footballLaunchBall(g, owner, predicted.x, predicted.y, 48, now, { passTargetId: target.id });
'''
new = '''    const leadDistance = Math.hypot(predicted.x - target.x, predicted.y - target.y);
    const throughBall = predicted.moving && leadDistance >= 1.35;
    recordFootballPlayerTendency(g, throughBall ? "through" : "pass", { targetId:target.id, y:predicted.y });
    const forwardGain = predicted.x - owner.x;
    addFootballVoltzThreat(g, predicted.x >= 70 ? (throughBall ? 5.8 : 4.2) : forwardGain >= 9 ? 2.5 : .7, now, throughBall ? "through" : "pass");
    footballLaunchBall(g, owner, predicted.x, predicted.y, 48, now, { passTargetId: target.id });
'''
replace_once(old, new, 'player pass threat')

old = '''    recordFootballPlayerTendency(g, "cross", { targetId:target.id, y:landingY });
    footballLaunchBall(g, owner, landingX, landingY, speed, now, {
'''
new = '''    recordFootballPlayerTendency(g, "cross", { targetId:target.id, y:landingY });
    addFootballVoltzThreat(g, 7.2, now, "cross");
    footballLaunchBall(g, owner, landingX, landingY, speed, now, {
'''
replace_once(old, new, 'cross threat')

old = '''    const shotY = clamp(targetY + spread, 31.5, 68.5);
    recordFootballPlayerTendency(g, "shot", { y:shotY });
    footballLaunchBall(g, owner, 104, shotY, speed, performance.now(), { isShot:true });
'''
new = '''    const shotY = clamp(targetY + spread, 31.5, 68.5);
    const now = performance.now();
    recordFootballPlayerTendency(g, "shot", { y:shotY });
    addFootballVoltzThreat(g, distance > 55 ? 9.2 : 13.5, now, "shot");
    footballLaunchBall(g, owner, 104, shotY, speed, now, { isShot:true });
'''
replace_once(old, new, 'shot threat')

# Better trajectory attacking during Voltz passes: one cover defender may cut the path too.
old = '''    const opponentReceiver = getFootballPlayer(g, ball.passTargetId);
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
'''
new = '''    const opponentReceiver = getFootballPlayer(g, ball.passTargetId);
    if (opponentReceiver && opponentReceiver.team !== player.team) {
      if (player.id === primaryChaserId) {
        const intercept = dynamicIntercept || fallbackLanding;
        const interceptSpeed = player.team === "rival" ? getFootballRivalTactics(g).coverSpeed + 1.45 : 13.8;
        return { x:intercept.x, y:intercept.y, speed:interceptSpeed, mode:"intercept" };
      }

      // V5.2: quando a Voltz solta a bola, um segundo defensor não olha apenas para
      // o receptor. Se sua própria rota alcança a trajetória cedo, ele ataca o passe.
      if (player.team === "rival" && ball.lastTouchTeam === "voltz" && roleIndex === 0 && dynamicIntercept) {
        const distanceToIntercept = footballDistance(player, dynamicIntercept);
        if (dynamicIntercept.t <= 1.18 && distanceToIntercept <= 14.5) {
          return {
            x:dynamicIntercept.x,
            y:dynamicIntercept.y,
            speed:getFootballRivalTactics(g).coverSpeed + 1.15,
            mode:"cut-lane"
          };
        }
      }

      const ownGoalX = player.team === "voltz" ? 7 : 93;
      const side = roleIndex % 2 === 0 ? -1 : 1;
      return {
        x:clamp(opponentReceiver.x + (ownGoalX - opponentReceiver.x) * .27, 10, 90),
        y:clamp(opponentReceiver.y + side * 17, 11, 89),
        speed:player.team === "rival" ? getFootballRivalTactics(g).coverSpeed : 11.9,
        mode:"cover"
      };
    }
'''
replace_once(old, new, 'trajectory interception')

# If the first press is beaten, the next defender closes immediately.
old = '''    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    rivalOutfield.forEach((player) => {
'''
new = '''    const rivalPressOrder = possession === "voltz"
      ? rivalOutfield.slice().sort((a, b) => footballDistance(a, owner || ball) - footballDistance(b, owner || ball))
      : [];
    const pressureBroken = possession === "voltz" && rivalOutfield.some((player) =>
      now < Number(player.recoverUntil || 0) &&
      now < Number(player.tackleCooldownUntil || 0) &&
      footballDistance(player, owner) > 5.2
    );
    rivalOutfield.forEach((player) => {
'''
replace_once(old, new, 'pressure broken detector')

old = '''          if (pressRank === 1 && rivalTactics.secondaryClose > 0) {
            target = {
              x:target.x + (owner.x - target.x) * rivalTactics.secondaryClose,
              y:target.y + (owner.y - target.y) * rivalTactics.secondaryClose
            };
          }
          footballMoveToward(player, target.x, target.y, rivalTactics.coverSpeed, dt);
'''
new = '''          const emergencyClose = pressRank === 1 && pressureBroken ? Math.max(.34, rivalTactics.secondaryClose) : rivalTactics.secondaryClose;
          if (pressRank === 1 && emergencyClose > 0) {
            target = {
              x:target.x + (owner.x - target.x) * emergencyClose,
              y:target.y + (owner.y - target.y) * emergencyClose
            };
          }
          footballMoveToward(player, target.x, target.y, rivalTactics.coverSpeed + (pressRank === 1 && pressureBroken ? 1.05 : 0), dt);
'''
replace_once(old, new, 'emergency secondary cover')

# Evaluate dominance before the AI chooses its shape/actions.
old = '''    const simDt = dt * timeScale;
    updateFootballControlledPlayer(g, simDt);
    updateFootballKeepers(g, simDt);
    updateFootballAI(g, now, simDt);
'''
new = '''    const simDt = dt * timeScale;
    updateFootballControlledPlayer(g, simDt);
    updateFootballDominanceRead(g, now, simDt);
    updateFootballKeepers(g, simDt);
    updateFootballAI(g, now, simDt);
'''
replace_once(old, new, 'match dominance tick')

path.write_text(js, encoding='utf-8')
print('Football V5.2 survival AI patch applied')
