(function initializeSportsMinigames(global) {
  const REALM_ID = "reino-educacao-fisica";
  const SPORT_IDS = ["football", "basketball", "athletics", "volleyball", "dodgeball"];
  const CAPITAO_RUBRO_IMAGE = "assets/images/rivals/capitao-rubro.png";
  const DODGE_CATCH_DISTANCE = 82;
  const DODGE_CATCH_PERFECT_DISTANCE = 34;
  const DODGE_CATCH_BUFFER_MS = 110;
  // V4: mobilidade responsiva; a dificuldade vem dos padrões, não de travar o jogador.
  const DODGE_PLAYER_BASE_SPEED_PX_PER_SECOND = 400;
  const RUBRO_PROJECTILE_SPEED_MULTIPLIER = Object.freeze({ 1: 1.15, 2: 1.30, 3: 1.42 });
  const RUBRO_DAMAGE_MULTIPLIER = Object.freeze({ 1: 1.00, 2: 1.12, 3: 1.22 });

  const DODGEBALL_VISUALS = Object.freeze({
    background: "assets/images/realms/physical-education/dodgeball/arena-bg.webp",
    stands: "assets/images/realms/physical-education/dodgeball/arena-stands.webp",
    floor: "assets/images/realms/physical-education/dodgeball/arena-floor.webp",
    overlay: "assets/images/realms/physical-education/dodgeball/arena-overlay.webp",
    ballStraight: "assets/images/realms/physical-education/dodgeball/ball-straight.webp",
    ballCurve: "assets/images/realms/physical-education/dodgeball/ball-curve.webp",
    ballPower: "assets/images/realms/physical-education/dodgeball/ball-power.webp",
    ballCatch: "assets/images/realms/physical-education/dodgeball/ball-catch.webp",
    ballBomb: "assets/images/realms/physical-education/dodgeball/ball-bomb.webp",
    impactLight: "assets/images/realms/physical-education/dodgeball/impact-light.webp",
    impactPower: "assets/images/realms/physical-education/dodgeball/impact-power.webp",
    ballTrail: "assets/images/realms/physical-education/dodgeball/ball-trail.webp",
    soulFrames: [
      "assets/images/realms/physical-education/dodgeball/soul-1.webp",
      "assets/images/realms/physical-education/dodgeball/soul-2.webp",
      "assets/images/realms/physical-education/dodgeball/soul-3.webp"
    ]
  });

  // Poses extras do Capitão Rubro.
  // attack: usada no telegraph/carga/arremesso durante as fases normais.
  // phase2: usada quando Rubro entra em modo sério (<= 30% HP) e durante o Rally.
  const CAPITAO_RUBRO_POSE_SLOTS = Object.freeze({
    attack: { path: "assets/images/rivals/capitao-rubro-ataque.png", enabled: true },
    phase2: { path: "assets/images/rivals/capitao-rubro-fase2.png", enabled: true }
  });

  const SPORT_META = {
    football: { icon: "⚽", name: "Futebol", zone: "Campo das Decisões" },
    basketball: { icon: "🏀", name: "Basquete", zone: "Quadra do Ritmo" },
    athletics: { icon: "🏃", name: "Atletismo", zone: "Pista do Impulso" },
    volleyball: { icon: "🏐", name: "Vôlei", zone: "Quadra da Sequência" },
    dodgeball: { icon: "🔴", name: "Queimada", zone: "Arena da Esquiva" }
  };

  const panel = document.getElementById("sportsMinigamePanel");
  const content = document.getElementById("sportsMinigameContent");
  const hud = document.getElementById("sportsProgressHud");
  const interactionText = document.getElementById("interactionText");

  const state = {
    open: false,
    activeId: "",
    cleanupFns: [],
    rafId: null,
    pressed: new Set(),
    mode: "normal",
    championship: null,
    sceneId: "",
    current: null
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sportSfx(name, options) { global.VoltzAudio?.playSfx?.(name, options); }
  function playDodgeballMusic(intensity = .55) { global.VoltzAudio?.playMusic?.("dodgeball", { intensity }); }
  function setDodgeballMusicIntensity(value) { global.VoltzAudio?.setMusicIntensity?.(value); }
  function stopDodgeballMusic(fadeMs = 350) { global.VoltzAudio?.stopMusic?.(fadeMs); }
  function duckDodgeballMusic(amount = .22, ms = 150) { global.VoltzAudio?.duckMusic?.(amount, ms); }

  function getProgress() {
    const progress = global.VoltzProfile?.getRealmProgress?.(REALM_ID) || {};
    return {
      ...progress,
      completedMinigameIds: Array.isArray(progress.completedMinigameIds)
        ? [...new Set(progress.completedMinigameIds.filter((id) => SPORT_IDS.includes(id)))]
        : [],
      guardianChallengeCompleted: Boolean(progress.guardianChallengeCompleted || progress.bossDefeated),
      completed: Boolean(progress.completed || progress.guardianChallengeCompleted || progress.bossDefeated)
    };
  }

  function isSportCompleted(id) {
    return getProgress().completedMinigameIds.includes(id);
  }

  function allSportsCompleted() {
    const completed = getProgress().completedMinigameIds;
    return SPORT_IDS.every((id) => completed.includes(id));
  }

  function clearRuntime() {
    panel?.classList.remove("perfect-return-mode", "perfect-return-impacting");
    panel?.querySelectorAll?.(".perfect-return-cinematic")?.forEach?.((node) => node.remove());
    state.cleanupFns.splice(0).forEach((fn) => {
      try { fn(); } catch {}
    });
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.pressed.clear();
    state.current = null;
  }

  function addTimer(callback, delay) {
    const id = setTimeout(callback, delay);
    state.cleanupFns.push(() => clearTimeout(id));
    return id;
  }

  function addInterval(callback, delay) {
    const id = setInterval(callback, delay);
    state.cleanupFns.push(() => clearInterval(id));
    return id;
  }

  function updateHud() {
    if (!hud) return;
    const activeScene = state.sceneId === REALM_ID || global.getActiveSceneId?.() === REALM_ID;
    hud.classList.toggle("visible", activeScene && !state.open);
    if (!activeScene) return;

    const progress = getProgress();
    const done = progress.completedMinigameIds.length;
    const finalDone = progress.guardianChallengeCompleted;
    hud.innerHTML = `
      <div class="sports-hud-head">
        <strong>🏅 Jornada de Educação Física</strong>
        <span>${done}/${SPORT_IDS.length}</span>
      </div>
      <div class="sports-hud-chips">
        ${SPORT_IDS.map((id) => {
          const meta = SPORT_META[id];
          const completed = progress.completedMinigameIds.includes(id);
          return `<span class="sports-hud-chip ${completed ? "done" : ""}">${completed ? "✓" : "○"} ${meta.icon} ${meta.name}</span>`;
        }).join("")}
      </div>
      <div class="sports-hud-final ${finalDone || done === SPORT_IDS.length ? "ready" : ""}">
        ${finalDone
          ? "🏆 Reino concluído · Diploma de Educação Física conquistado"
          : done === SPORT_IDS.length
            ? "🏆 Estádio Voltz liberado · Desafio Final disponível"
            : `Conclua mais ${SPORT_IDS.length - done} modalidade${SPORT_IDS.length - done === 1 ? "" : "s"} para liberar o Estádio Voltz.`}
      </div>
    `;
  }

  async function saveSportCompletion(id) {
    if (!SPORT_IDS.includes(id)) return { ok: false };
    const current = getProgress();
    if (current.completedMinigameIds.includes(id)) {
      return { ok: true, alreadyCompleted: true };
    }

    const next = {
      ...current,
      completedMinigameIds: [...current.completedMinigameIds, id],
      lastSportCompletedAt: new Date().toISOString()
    };

    const save = await global.VoltzProfile?.setRealmProgress?.(REALM_ID, next);
    if (save?.ok !== false) {
      await global.VoltzProfile?.addRewards?.(45, 12);
    }
    updateHud();
    return save || { ok: true, persisted: false };
  }

  function openPanelShell(title, kicker, subtitle, body) {
    if (!panel || !content) return;
    panel.classList.toggle("dodgeball-fit", state.current?.type === "dodgeball");
    panel.classList.toggle("dodgeball-hud-v2", state.current?.type === "dodgeball");
    content.innerHTML = `
      <div class="sports-game-shell">
        <div class="sports-game-topbar">
          <div>
            <div class="sports-game-kicker">${escapeHtml(kicker)}</div>
            <div class="sports-game-title">${escapeHtml(title)}</div>
            <p class="sports-game-subtitle">${escapeHtml(subtitle)}</p>
          </div>
          <button class="sports-close-btn" type="button" onclick="VoltzSports.close()">Fechar ✕</button>
        </div>
        ${state.championship?.active ? renderChampionshipHeader() : ""}
        ${body}
      </div>
    `;
  }

  function renderChampionshipHeader() {
    const champ = state.championship;
    if (!champ?.active) return "";
    return `
      <div class="championship-progress">
        ${champ.order.map((id, index) => {
          const meta = SPORT_META[id];
          const cls = index < champ.index ? "done" : index === champ.index ? "current" : "";
          return `<span class="championship-step ${cls}">${index < champ.index ? "✓" : index + 1} ${meta.icon} ${meta.name}</span>`;
        }).join("")}
      </div>
    `;
  }

  function openIntro(id) {
    const completed = isSportCompleted(id);
    const meta = SPORT_META[id];
    const descriptions = {
      football: "Partida 3v3 com goleiros. WASD move; J chuta com a bola e dá o bote sem ela; K toca, L cruza e I ativa a Voltz Vision.",
      basketball: "O marcador se move pela barra. Pressione Espaço dentro da zona central para acertar o tempo do arremesso.",
      athletics: "Não queime a largada. Quando aparecer JÁ!, pressione Espaço e depois alterne A e D para construir velocidade.",
      volleyball: "Uma sequência de comandos representa recepção, levantamento e ataque. Pressione cada tecla antes do tempo acabar.",
      dodgeball: "Seu turno usa uma barra de precisão para arremessar. No turno adversário, mova o Núcleo Voltz e sobreviva à chuva de bolas."
    };

    openPanelShell(
      `${meta.icon} ${meta.name}`,
      meta.zone,
      descriptions[id],
      `<div class="sports-game-card">
        <div class="sports-rules">
          <strong>${completed ? "✓ Modalidade já concluída." : "Modalidade ainda não concluída."}</strong>
          <span>${completed ? "Você pode repetir o minigame por treino, mas não receberá XP/moedas novamente." : "Primeira conclusão: +45 XP e +12 moedas."}</span>
        </div>
        <div style="display:flex;justify-content:center;margin-top:24px;">
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.start('${id}')">${completed ? "Treinar novamente" : "Começar desafio"}</button>
        </div>
      </div>`
    );
  }

  function openChampionshipIntro() {
    const progress = getProgress();
    const unlocked = allSportsCompleted();
    const completed = progress.guardianChallengeCompleted;

    openPanelShell(
      "🏆 Desafio Final · Pentatlo Voltz",
      "Estádio Voltz",
      "Cinco versões rápidas das modalidades, uma após a outra. Falhar em qualquer etapa encerra a tentativa.",
      `<div class="sports-game-card">
        <div class="sports-rules">
          <strong>${completed ? "✓ Você já concluiu o Reino de Educação Física." : unlocked ? "✓ Estádio liberado." : "🔒 Estádio ainda bloqueado."}</strong>
          <span>Modalidades concluídas: ${progress.completedMinigameIds.length}/${SPORT_IDS.length}.</span>
          <span>Ordem do pentatlo: Atletismo → Basquete → Futebol → Vôlei → Queimada.</span>
          ${completed ? "<span>Você pode repetir o pentatlo como treino.</span>" : unlocked ? "<span>Conclua todas as cinco etapas para receber o Diploma de Educação Física.</span>" : "<span>Conclua as cinco estações espalhadas pelo reino antes de competir.</span>"}
        </div>
        <div style="display:flex;justify-content:center;margin-top:24px;">
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.startChampionship()" ${unlocked ? "" : "disabled"}>${completed ? "Repetir pentatlo" : "Entrar no Estádio"}</button>
        </div>
      </div>`
    );
  }

  function open(id) {
    if (!panel || !content) return;
    clearRuntime();
    state.open = true;
    state.activeId = id;
    state.mode = "normal";
    state.championship = null;
    panel.classList.add("visible");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("sports-minigame-active");
    updateHud();

    if (interactionText) interactionText.textContent = "Minigame esportivo aberto.";

    if (id === "championship") openChampionshipIntro();
    else if (SPORT_IDS.includes(id)) openIntro(id);
    else close();
  }

  function close() {
    if (state.activeId === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      if (state.current?.type === "football" && state.current?.phase === "play") {
        global.VoltzStandaloneFootball?.onExitBlocked?.();
        return;
      }
      global.VoltzStandaloneFootball?.returnToWorld?.();
      return;
    }
    if (state.activeId === "dodgeball" || state.current?.type === "dodgeball") stopDodgeballMusic(280);
    clearRuntime();
    state.open = false;
    state.activeId = "";
    state.mode = "normal";
    state.championship = null;
    panel?.classList.remove("visible", "dodgeball-fit", "dodgeball-hud-v2", "dodgeball-hud-v3");
    panel?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sports-minigame-active");
    updateHud();
    if (interactionText) interactionText.textContent = state.sceneId === REALM_ID
      ? "Explore o Complexo Esportivo Voltz e escolha uma modalidade."
      : "Explore o mundo.";
    global.setTimeout(() => global.VoltzAudio?.restoreSceneMusic?.(), 320);
  }

  function isOpen() {
    return state.open;
  }

  function start(id) {
    if (!SPORT_IDS.includes(id)) return;
    clearRuntime();
    state.activeId = id;
    state.mode = state.championship?.active ? "championship" : "normal";

    if (id === "football") startFootball();
    if (id === "basketball") startBasketball();
    if (id === "athletics") startAthletics();
    if (id === "volleyball") startVolleyball();
    if (id === "dodgeball") startDodgeball();
  }

  async function finishSport(id, success, message) {
    if (id === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      global.VoltzStandaloneFootball?.onMatchFinished?.({ success:Boolean(success) });
    }
    if (id === "dodgeball") {
      sportSfx(success ? "victory" : "failure");
      if (success) duckDodgeballMusic(.10, 300);
      stopDodgeballMusic(success ? 900 : 600);
    }
    clearRuntime();

    if (state.championship?.active) {
      if (!success) {
        renderChampionshipFailure(id, message);
        return;
      }

      state.championship.index += 1;
      if (state.championship.index >= state.championship.order.length) {
        await finishChampionship();
        return;
      }

      const nextId = state.championship.order[state.championship.index];
      const nextMeta = SPORT_META[nextId];
      openPanelShell(
        "🏆 Etapa concluída",
        "Pentatlo Voltz",
        message || "Boa execução. O campeonato continua.",
        `<div class="sports-result success">
          <div class="sports-result-icon">✓</div>
          <h3>Próxima modalidade: ${nextMeta.icon} ${escapeHtml(nextMeta.name)}</h3>
          <p>Você não pode descansar muito: o Estádio já está preparando a próxima prova.</p>
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.continueChampionship()">Continuar</button>
        </div>`
      );
      return;
    }

    if (success) await saveSportCompletion(id);
    const meta = SPORT_META[id];
    const already = isSportCompleted(id);

    openPanelShell(
      success ? "Modalidade concluída!" : "Tentativa encerrada",
      meta.zone,
      message || (success ? "Desafio registrado." : "Você pode tentar novamente quando quiser."),
      `<div class="sports-result ${success ? "success" : "failure"}">
        <div class="sports-result-icon">${success ? "🏅" : "↻"}</div>
        <h3>${success ? `${meta.name} concluído` : "Tente novamente"}</h3>
        <p>${success
          ? `A modalidade agora conta para a progressão do Reino de Educação Física.${already ? "" : " Primeira conclusão registrada."}`
          : "A tentativa não altera seu save. Observe a mecânica e tente de novo."}</p>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.start('${id}')">Jogar novamente</button>
          <button class="sports-close-btn" type="button" onclick="VoltzSports.close()">Voltar ao reino</button>
        </div>
      </div>`
    );
    updateHud();
  }

  // -------------------------------------------------------
  // Futebol · Campo das Decisões 3v3
  // -------------------------------------------------------
  // Ritmo-base do 3v3: jogadores de linha se movem a 78% do protótipo original.
  // A bola NÃO usa este multiplicador; assim passe, cruzamento e finalização
  // continuam rápidos enquanto o jogador ganha mais tempo para ler o campo.
  const FOOTBALL_OUTFIELD_PACE = 0.78;
  // V3.9: a simulação continua normalizada em 0..100, mas o gramado agora representa
  // uma área física maior. A bola preserva a velocidade aprovada; jogadores precisam
  // percorrer mais espaço para atravessar o campo, abrindo linhas e profundidade.
  const FOOTBALL_PITCH_SCALE_X = 1.22;
  const FOOTBALL_PITCH_SCALE_Y = 1.12;

  function isFootballPerspectiveRender() {
    return Boolean(global.VoltzStandaloneFootball?.isStandalone?.());
  }

  // Camera V4: a simulacao fica intacta. Apenas convertemos o ponto de mundo
  // para um campo trapezoidal visto de uma lateral elevada. y=0 e o fundo; y=100 e a frente.
  function projectFootballPoint(x, y) {
    const worldX = Number.isFinite(Number(x)) ? Number(x) : 50;
    const worldY = Number.isFinite(Number(y)) ? Number(y) : 50;
    if (!isFootballPerspectiveRender()) {
      return { x:worldX, y:worldY, scale:1, depth:clamp(worldY / 100, 0, 1) };
    }

    const depth = clamp(worldY / 100, 0, 1);
    const widthScale = .74 + depth * .25;
    const screenX = 50 + (worldX - 50) * widthScale;
    const screenY = 6 + depth * 91;
    const scale = .82 + depth * .24;
    return { x:screenX, y:screenY, scale, depth };
  }

  function footballSvgPoint(point) {
    const projected = projectFootballPoint(point[0], point[1]);
    return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
  }

  function footballSvgPath(points, close = false) {
    if (!points?.length) return '';
    const projected = points.map(footballSvgPoint);
    return `M ${projected.join(' L ')}${close ? ' Z' : ''}`;
  }

  function footballScreenPointFromGround(worldX, worldY, lift = 0) {
    const ground = projectFootballPoint(worldX, worldY);
    return {
      x:ground.x,
      y:ground.y - Number(lift || 0) * ground.scale,
      scale:ground.scale,
      depth:ground.depth
    };
  }

  function footballSvgScreenPath(points, close = false) {
    if (!points?.length) return '';
    const mapped = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    return `M ${mapped.join(' L ')}${close ? ' Z' : ''}`;
  }

  function buildFootballGoal3D(side) {
    const left = side === 'left';
    const frontX = left ? 2 : 98;
    // A profundidade fica para fora da linha do gol, mas ainda dentro da área visível
    // do container. É uma ilusão 3D: a lógica de gol continua exatamente em x=0/100.
    const backX = left ? -3.2 : 103.2;
    const farY = 32;
    const nearY = 68;
    const backFarY = 30;
    const backNearY = 70;
    const goalHeight = 7.8;

    const frontFarBase = footballScreenPointFromGround(frontX, farY, 0);
    const frontNearBase = footballScreenPointFromGround(frontX, nearY, 0);
    const backFarBase = footballScreenPointFromGround(backX, backFarY, 0);
    const backNearBase = footballScreenPointFromGround(backX, backNearY, 0);
    const frontFarTop = footballScreenPointFromGround(frontX, farY, goalHeight);
    const frontNearTop = footballScreenPointFromGround(frontX, nearY, goalHeight);
    const backFarTop = footballScreenPointFromGround(backX, backFarY, goalHeight * .92);
    const backNearTop = footballScreenPointFromGround(backX, backNearY, goalHeight * .92);

    const shadow = footballSvgScreenPath([
      frontFarBase, frontNearBase, backNearBase, backFarBase
    ], true);
    const roof = footballSvgScreenPath([
      frontFarTop, frontNearTop, backNearTop, backFarTop
    ], true);
    const farSide = footballSvgScreenPath([
      frontFarBase, frontFarTop, backFarTop, backFarBase
    ], true);
    const nearSide = footballSvgScreenPath([
      frontNearBase, frontNearTop, backNearTop, backNearBase
    ], true);
    const backNet = footballSvgScreenPath([
      backFarBase, backFarTop, backNearTop, backNearBase
    ], true);

    const mesh = [];
    const lerpPoint = (a, b, t) => ({
      x:a.x + (b.x - a.x) * t,
      y:a.y + (b.y - a.y) * t
    });

    // Malha vertical da rede traseira.
    for (let i = 1; i < 6; i += 1) {
      const t = i / 6;
      const base = lerpPoint(backFarBase, backNearBase, t);
      const top = lerpPoint(backFarTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([base, top])}"/>`);
    }
    // Malha horizontal da rede traseira.
    for (let i = 1; i < 4; i += 1) {
      const t = i / 4;
      const far = lerpPoint(backFarBase, backFarTop, t);
      const near = lerpPoint(backNearBase, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([far, near])}"/>`);
    }
    // Linhas de profundidade no teto e nas laterais.
    for (let i = 1; i < 4; i += 1) {
      const t = i / 4;
      const roofFar = lerpPoint(frontFarTop, backFarTop, t);
      const roofNear = lerpPoint(frontNearTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([roofFar, roofNear])}"/>`);

      const farBase = lerpPoint(frontFarBase, backFarBase, t);
      const farTop = lerpPoint(frontFarTop, backFarTop, t);
      const nearBase = lerpPoint(frontNearBase, backNearBase, t);
      const nearTop = lerpPoint(frontNearTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([farBase, farTop])}"/>`);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([nearBase, nearTop])}"/>`);
    }

    return `
      <g class="football-goal-3d football-goal-3d-${side}">
        <path class="football-goal-3d-shadow" d="${shadow}"/>
        <path class="football-goal-3d-net-surface" d="${backNet}"/>
        <path class="football-goal-3d-net-surface is-side" d="${farSide}"/>
        <path class="football-goal-3d-net-surface is-side" d="${nearSide}"/>
        <path class="football-goal-3d-net-surface is-roof" d="${roof}"/>
        ${mesh.join('')}
        <path class="football-goal-3d-frame is-back" d="${footballSvgScreenPath([backFarBase, backFarTop, backNearTop, backNearBase])}"/>
        <path class="football-goal-3d-frame is-depth" d="${footballSvgScreenPath([frontFarTop, backFarTop])}"/>
        <path class="football-goal-3d-frame is-depth" d="${footballSvgScreenPath([frontNearTop, backNearTop])}"/>
        <path class="football-goal-3d-frame is-front" d="${footballSvgScreenPath([frontFarBase, frontFarTop, frontNearTop, frontNearBase])}"/>
      </g>
    `;
  }

  function buildFootballProjectedPitch() {
    if (!isFootballPerspectiveRender()) return '';
    const centerCircle = [];
    for (let index = 0; index <= 32; index += 1) {
      const angle = Math.PI * 2 * index / 32;
      centerCircle.push([50 + Math.cos(angle) * 9.5, 50 + Math.sin(angle) * 9.5]);
    }

    const leftBox = [[2,23],[18,23],[18,77],[2,77]];
    const rightBox = [[98,23],[82,23],[82,77],[98,77]];
    const centerSpot = projectFootballPoint(50, 50);
    const leftSpot = projectFootballPoint(12, 50);
    const rightSpot = projectFootballPoint(88, 50);
    const goals3D = `${buildFootballGoal3D('left')}${buildFootballGoal3D('right')}`;

    return `
      <path class="football-pitch-outline" d="${footballSvgPath([[2,5],[98,5],[98,95],[2,95]], true)}"/>
      <path class="football-pitch-line" d="${footballSvgPath([[50,5],[50,95]])}"/>
      <path class="football-pitch-line" d="${footballSvgPath(centerCircle, true)}"/>
      <path class="football-pitch-line" d="${footballSvgPath(leftBox, true)}"/>
      <path class="football-pitch-line" d="${footballSvgPath(rightBox, true)}"/>
      ${goals3D}
      <circle class="football-pitch-spot" cx="${centerSpot.x.toFixed(2)}" cy="${centerSpot.y.toFixed(2)}" r=".42"/>
      <circle class="football-pitch-spot" cx="${leftSpot.x.toFixed(2)}" cy="${leftSpot.y.toFixed(2)}" r=".34"/>
      <circle class="football-pitch-spot" cx="${rightSpot.x.toFixed(2)}" cy="${rightSpot.y.toFixed(2)}" r=".34"/>
    `;
  }

  function startFootball() {
    if (global.VoltzStandaloneFootball?.isStandalone?.()) {
      global.VoltzStandaloneFootball?.onMatchStarted?.();
    }
    const compact = state.mode === "championship";
    const targetGoals = compact ? 1 : 3;
    state.current = {
      type: "football",
      phase: "play",
      score: 0,
      rivalScore: 0,
      targetGoals,
      controlledId: "v1",
      players: [
        { id:"v1", team:"voltz", number:"7",  x:24, y:50, homeX:24, homeY:50, speed:22, isUserAvatar:true, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"v2", team:"voltz", number:"10", x:34, y:28, homeX:34, homeY:28, speed:17, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"v3", team:"voltz", number:"11", x:34, y:72, homeX:34, homeY:72, speed:17, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"vgk", team:"voltz", number:"GK", x:6, y:50, homeX:6, homeY:50, speed:18, keeper:true, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r1", team:"rival", number:"8",  x:76, y:50, homeX:76, homeY:50, speed:16, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r2", team:"rival", number:"6",  x:66, y:28, homeX:66, homeY:28, speed:15, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"r3", team:"rival", number:"9",  x:66, y:72, homeX:66, homeY:72, speed:15, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },
        { id:"rgk", team:"rival", number:"GK", x:94, y:50, homeX:94, homeY:50, speed:18, keeper:true, facingX:-1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 }
      ],
      ball: {
        x:26, y:50, z:0, vx:0, vy:0, vz:0, ownerId:"v1", lastTouchTeam:"voltz",
        passTargetId:null, isShot:false, isCross:false, airborne:false, landingX:null, landingY:null,
        ignorePickupUntil:0, keeperReleaseAt:0, shotAt:0, shotId:0
      },
      visionUntil: 0,
      visionCooldownUntil: 0,
      aiActionAt: 0,
      autoSelectAt: 0,
      lastTackleAt: 0,
      feedback: compact ? "Gol de ouro no Pentatlo: marque antes do rival." : `Primeiro a ${targetGoals} gols. Leia o campo antes de acelerar a jogada.`,
      banner: "SAÍDA VOLTZ"
    };

    renderFootball();

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "football") return;
      const dt = Math.min(.034, Math.max(0, (now - last) / 1000));
      last = now;
      updateFootballMatch(now, dt);
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function getFootballPlayer(g, id) {
    return g?.players?.find((player) => player.id === id) || null;
  }

  function getFootballOwner(g) {
    return getFootballPlayer(g, g?.ball?.ownerId);
  }

  function getFootballTeam(g, team, includeKeeper = true) {
    return (g?.players || []).filter((player) => player.team === team && (includeKeeper || !player.keeper));
  }

  function footballDistance(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function footballMoveToward(player, targetX, targetY, speed, dt) {
    const now = performance.now();
    if (now < Number(player.tackleUntil || 0)) return;
    const recoveryScale = now < Number(player.recoverUntil || 0) ? .24 : 1;
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = Math.hypot(dx, dy) || 1;
    const pitchLength = Math.hypot(dx * FOOTBALL_PITCH_SCALE_X, dy * FOOTBALL_PITCH_SCALE_Y) || 1;
    if (length > .05) {
      player.facingX = dx / length;
      player.facingY = dy / length;
    }
    const movementScale = player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE;
    const step = Math.min(pitchLength, speed * movementScale * recoveryScale * dt);
    player.x += dx / pitchLength * step;
    player.y += dy / pitchLength * step;
    if (step > .01) player.movingUntil = now + 120;
    player.x = clamp(player.x, player.keeper ? 3.5 : 7, player.keeper ? 96.5 : 93);
    player.y = clamp(player.y, 8, 92);
  }

  const FOOTBALL_AVATAR_PROFILES = {
    v1: {
      bodyA:"#78f7ff", bodyB:"#9257ff", bodyC:"#00eaff", accent:"#ffd166", coreA:"#ffffff", coreB:"#78f7ff", coreC:"#9257ff",
      bodyPath:"M32 108 C24 77,28 42,60 29 C92 42,96 77,88 108 C79 126,41 126,32 108Z",
      top:'<path d="M43 31 L52 10 L60 29 L68 10 L77 31" fill="none" stroke="__ACCENT__" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    v2: {
      bodyA:"#72ffd1", bodyB:"#20a99d", bodyC:"#2be6ff", accent:"#eafff7", coreA:"#ffffff", coreB:"#63f5b5", coreC:"#237cbf",
      bodyPath:"M36 111 C28 82,31 48,60 31 C89 48,92 82,84 111 C76 127,44 127,36 111Z",
      top:'<path d="M41 36 Q48 16 57 31 Q66 10 78 34" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round"/><circle cx="79" cy="31" r="4" fill="__ACCENT__"/>'
    },
    v3: {
      bodyA:"#65caff", bodyB:"#6047d6", bodyC:"#9b6dff", accent:"#aefcff", coreA:"#ffffff", coreB:"#45a3ff", coreC:"#9257ff",
      bodyPath:"M28 106 C22 78,27 47,60 32 C93 47,98 78,92 106 C82 127,38 127,28 106Z",
      top:'<path d="M38 34 L49 18 L60 31 L72 16 L83 35" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M49 18 L72 16" stroke="__ACCENT__" stroke-width="3" opacity=".55"/>'
    },
    vgk: {
      bodyA:"#ffe28b", bodyB:"#c78a2e", bodyC:"#63f5b5", accent:"#fff8d2", coreA:"#ffffff", coreB:"#ffd166", coreC:"#35b78a",
      bodyPath:"M27 112 C22 78,27 42,60 27 C93 42,98 78,93 112 C82 131,38 131,27 112Z",
      top:'<path d="M34 38 Q60 13 86 38 L79 45 Q60 28 41 45Z" fill="__ACCENT__" opacity=".9"/><path d="M42 40 Q60 27 78 40" fill="none" stroke="#8a6422" stroke-width="4" stroke-linecap="round"/>'
    },
    r1: {
      bodyA:"#ff7b87", bodyB:"#8b2038", bodyC:"#ff3d58", accent:"#ffd0d5", coreA:"#fff2f3", coreB:"#ff6b7a", coreC:"#731a2d",
      bodyPath:"M31 113 L24 81 L34 45 L60 27 L86 45 L96 81 L89 113 C78 128,42 128,31 113Z",
      top:'<path d="M37 40 L42 17 L56 34 L64 13 L78 36 L86 20 L84 44" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    r2: {
      bodyA:"#ff69b4", bodyB:"#7b225f", bodyC:"#c43b91", accent:"#ffd2ec", coreA:"#fff4fb", coreB:"#ff62ad", coreC:"#632253",
      bodyPath:"M35 115 C22 91,29 50,60 28 C91 50,98 91,85 115 C75 129,45 129,35 115Z",
      top:'<path d="M39 38 Q45 18 55 31 Q60 9 66 31 Q78 16 82 40" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="17" r="5" fill="__ACCENT__"/>'
    },
    r3: {
      bodyA:"#ff9b54", bodyB:"#9b2d35", bodyC:"#ff5d47", accent:"#ffe0bd", coreA:"#fff7ea", coreB:"#ff9251", coreC:"#8b2531",
      bodyPath:"M28 108 C18 82,25 44,60 34 C95 44,102 82,92 108 C81 127,39 127,28 108Z",
      top:'<path d="M33 43 L47 21 L56 36 L68 17 L87 42" fill="none" stroke="__ACCENT__" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    rgk: {
      bodyA:"#dcadff", bodyB:"#6b3b9d", bodyC:"#ff6b9e", accent:"#f5e5ff", coreA:"#ffffff", coreB:"#d599ff", coreC:"#783f9f",
      bodyPath:"M26 112 C21 77,27 41,60 27 C93 41,99 77,94 112 C83 131,37 131,26 112Z",
      top:'<path d="M33 39 Q60 12 87 39 L80 48 Q60 29 40 48Z" fill="__ACCENT__" opacity=".92"/><path d="M39 41 L81 41" stroke="#6e3a9e" stroke-width="5" stroke-linecap="round"/>'
    }
  };

  function buildFootballAvatarSvg(player) {
    const profile = FOOTBALL_AVATAR_PROFILES[player?.id] || FOOTBALL_AVATAR_PROFILES[player?.team === "rival" ? "r1" : "v2"];
    const gradientId = `footballAvatarBody-${player.id}`;
    const coreId = `footballAvatarCore-${player.id}`;
    const top = String(profile.top || "").replaceAll("__ACCENT__", profile.accent);
    const showNumber = !player.isUserAvatar;
    return `<div class="football-user-avatar-shell" aria-hidden="true">
      <svg class="football-user-avatar" viewBox="0 0 120 150" focusable="false">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${profile.bodyA}"/>
            <stop offset="55%" stop-color="${profile.bodyB}"/>
            <stop offset="100%" stop-color="${profile.bodyC}"/>
          </linearGradient>
          <radialGradient id="${coreId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${profile.coreA}"/>
            <stop offset="48%" stop-color="${profile.coreB}"/>
            <stop offset="100%" stop-color="${profile.coreC}"/>
          </radialGradient>
        </defs>

        <ellipse class="football-avatar-aura" cx="60" cy="82" rx="45" ry="51" fill="${profile.bodyC}"/>
        <g class="football-avatar-body">
          <path d="${profile.bodyPath}" fill="url(#${gradientId})" stroke="#f5fbff" stroke-width="4" stroke-linejoin="round"/>
          ${top}
          <circle class="football-avatar-core" cx="60" cy="82" r="20" fill="url(#${coreId})" stroke="#ffffff" stroke-width="4"/>
          ${showNumber ? `<text class="football-avatar-number" x="60" y="88" text-anchor="middle">${player.number}</text>` : ""}

          <g class="football-face football-face-front">
            <ellipse cx="47" cy="59" rx="7" ry="9" fill="#02040d"/>
            <ellipse cx="73" cy="59" rx="7" ry="9" fill="#02040d"/>
            <circle cx="49" cy="56" r="2.5" fill="${profile.accent}"/>
            <circle cx="75" cy="56" r="2.5" fill="${profile.accent}"/>
            <path d="M49 108 C56 113,64 113,71 108" fill="none" stroke="#02040d" stroke-width="4.5" stroke-linecap="round"/>
          </g>

          <g class="football-face football-face-back">
            <path d="M40 60 C50 52,70 52,80 60" fill="none" stroke="#02040d" stroke-width="5" stroke-linecap="round"/>
            <path d="M46 106 C54 101,66 101,74 106" fill="none" stroke="${profile.accent}" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="60" cy="65" r="7" fill="#050713" stroke="${profile.accent}" stroke-width="3"/>
          </g>

          <g class="football-face football-face-side">
            <ellipse cx="72" cy="60" rx="8" ry="9" fill="#02040d"/>
            <circle cx="75" cy="57" r="2.5" fill="${profile.accent}"/>
            <path d="M64 106 C71 110,78 109,83 104" fill="none" stroke="#02040d" stroke-width="4.5" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    </div>`;
  }

  function renderFootball() {
    const g = state.current;
    if (!g || g.type !== "football") return;

    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} is-svg-avatar ${player.keeper ? "is-keeper" : ""} ${player.isUserAvatar ? "is-user-avatar" : ""}" data-id="${player.id}" data-football-facing="right">
        <i class="football-player-shadow" aria-hidden="true"></i>
        ${buildFootballAvatarSvg(player)}
      </div>`).join("");

    openPanelShell(
      "⚽ Futebol · 3v3",
      "Campo das Decisões",
      "Controle quem está na jogada, crie linhas de passe e encontre o momento de finalizar.",
      `<div class="sports-game-card football-match-card">
        <div class="football-live-scoreboard">
<div><small>TIME VOLTZ</small><strong id="footballScoreVoltz">${g.score}</strong></div>
<div class="football-score-center"><span>PRIMEIRO A ${g.targetGoals}</span><b id="footballMatchBanner">${escapeHtml(g.banner)}</b></div>
<div><small>VISITANTE</small><strong id="footballScoreRival">${g.rivalScore}</strong></div>
        </div>

        <div id="footballField" class="football-field-live ${isFootballPerspectiveRender() ? "is-perspective-pitch" : ""}">
${isFootballPerspectiveRender()
  ? `<svg class="football-pitch-projection" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${buildFootballProjectedPitch()}</svg>`
  : `<div class="football-half-line"></div>
<div class="football-center-circle"></div>
<div class="football-box football-box-left"></div>
<div class="football-box football-box-right"></div>
<div class="football-goal football-goal-left"></div>
<div class="football-goal football-goal-right"></div>`}
<svg id="footballVisionSvg" class="football-vision-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
${playerMarkup}
<div id="footballBallShadow" class="football-ball-shadow" aria-hidden="true"></div>
<div id="footballBall" class="football-live-ball" aria-label="Bola"></div>
<div id="footballPassTarget" class="football-pass-target" aria-hidden="true"></div>
        </div>

        <div class="football-live-hud">
<div id="footballFeedback" class="football-live-feedback">${escapeHtml(g.feedback)}</div>
<div id="footballVisionStatus" class="football-vision-status">I · VOLTZ VISION PRONTA</div>
        </div>

        <div class="football-control-strip">
<span><b>WASD</b> MOVER</span>
<button type="button" onclick="VoltzSports.footballSwitchPlayer()"><b>Q</b> TROCAR</button>
<button type="button" onclick="VoltzSports.footballPrimaryAction()"><b>J</b> CHUTE / BOTE</button>
<button type="button" onclick="VoltzSports.footballPass()"><b>K</b> TOCAR</button>
<button type="button" onclick="VoltzSports.footballCross()"><b>L</b> CRUZAR</button>
<button type="button" onclick="VoltzSports.activateFootballVision()"><b>I</b> VOLTZ VISION</button>
        </div>
      </div>`
    );

    updateFootballDom(performance.now());
  }

  function footballSetPossession(g, player, now, feedback = "") {
    if (!g || !player) return;
    g.ball.ownerId = player.id;
    g.ball.lastTouchTeam = player.team;
    g.ball.passTargetId = null;
    g.ball.isShot = false;
    g.ball.shotAt = 0;
    g.ball.isCross = false;
    g.ball.airborne = false;
    g.ball.z = 0;
    g.ball.vx = 0;
    g.ball.vy = 0;
    g.ball.vz = 0;
    g.ball.landingX = null;
    g.ball.landingY = null;
    g.ball.x = player.x;
    g.ball.y = player.y;
    g.ball.ignorePickupUntil = now + 180;
    if (player.keeper) g.ball.keeperReleaseAt = now + 720;
    if (player.team === "voltz" && !player.keeper) g.controlledId = player.id;
    if (feedback) g.feedback = feedback;
  }

  function footballResetKickoff(g, team = "voltz") {
    if (!g) return;
    g.players.forEach((player) => {
      player.x = player.homeX;
      player.y = player.homeY;
    });
    const starter = getFootballPlayer(g, team === "voltz" ? "v1" : "r1");
    footballSetPossession(g, starter, performance.now(), team === "voltz" ? "Sua saída. Construa o ataque." : "Saída do visitante. Recupere a bola.");
    g.controlledId = "v1";
    g.phase = "play";
    g.banner = team === "voltz" ? "SAÍDA VOLTZ" : "SAÍDA VISITANTE";
  }

  function footballGoal(g, team) {
    if (!g || g.phase !== "play") return;
    g.phase = "goal";
    g.ball.ownerId = null;
    g.ball.vx = 0;
    g.ball.vy = 0;

    if (team === "voltz") {
      g.score += 1;
      g.banner = "GOOOOL VOLTZ!";
      g.feedback = "A jogada encontrou o espaço certo.";
      sportSfx("victory");
    } else {
      g.rivalScore += 1;
      g.banner = "GOL DO VISITANTE";
      g.feedback = "Eles encontraram uma brecha. Reorganize a marcação.";
      sportSfx("failure");
    }
    updateFootballDom(performance.now());

    if (g.score >= g.targetGoals || g.rivalScore >= g.targetGoals) {
      const won = g.score >= g.targetGoals;
      addTimer(() => {
        if (state.current !== g) return;
        finishSport("football", won, won
? `Vitória ${g.score} a ${g.rivalScore}. Você criou espaço, circulou a bola e decidiu a partida.`
: `Derrota ${g.score} a ${g.rivalScore}. O rival puniu as decisões apressadas.`);
      }, 900);
      return;
    }

    addTimer(() => {
      if (state.current !== g) return;
      footballResetKickoff(g, team === "voltz" ? "rival" : "voltz");
      updateFootballDom(performance.now());
    }, 1050);
  }

  function footballLaunchBall(g, from, targetX, targetY, speed, now, options = {}) {
    const dx = targetX - from.x;
    const dy = targetY - from.y;
    const length = Math.hypot(dx, dy) || 1;
    g.ball.ownerId = null;
    g.ball.x = from.x;
    g.ball.y = from.y;
    g.ball.vx = dx / length * speed;
    g.ball.vy = dy / length * speed;
    g.ball.lastTouchTeam = from.team;
    g.ball.passTargetId = options.passTargetId || null;
    g.ball.isShot = Boolean(options.isShot);
    g.ball.shotAt = options.isShot ? now : 0;
    if (options.isShot) g.ball.shotId = Number(g.ball.shotId || 0) + 1;
    g.ball.isCross = Boolean(options.isCross);
    g.ball.airborne = Boolean(options.airborne);
    g.ball.z = Number(options.z || 0);
    g.ball.vz = Number(options.vz || 0);
    g.ball.landingX = Number.isFinite(options.landingX) ? options.landingX : targetX;
    g.ball.landingY = Number.isFinite(options.landingY) ? options.landingY : targetY;
    g.ball.ignorePickupUntil = now + (options.isShot ? 180 : options.airborne ? 210 : 120);
  }

  function distanceToFootballSegment(point, a, b) {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = point.x - a.x;
    const wy = point.y - a.y;
    const c2 = vx * vx + vy * vy || 1;
    const t = clamp((wx * vx + wy * vy) / c2, 0, 1);
    const px = a.x + vx * t;
    const py = a.y + vy * t;
    return Math.hypot(point.x - px, point.y - py);
  }

  function isFootballPassLaneOpen(g, passer, receiver) {
    const rivals = getFootballTeam(g, passer.team === "voltz" ? "rival" : "voltz", false);
    return rivals.every((rival) => distanceToFootballSegment(rival, passer, receiver) > 6.2);
  }

  function getFootballAimDirection(player) {
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
    const speed = Number(player.speed || 0) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);
    const pitchLength = Math.hypot(facing.x * FOOTBALL_PITCH_SCALE_X, facing.y * FOOTBALL_PITCH_SCALE_Y) || 1;
    return { x:facing.x / pitchLength * speed, y:facing.y / pitchLength * speed, moving:speed > .1 };
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

  function footballPass() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (!owner || owner.team !== "voltz" || owner.keeper || owner.id !== g.controlledId) {
      g.feedback = "Você precisa estar com a bola para passar.";
      return;
    }

    const target = getFootballPassTarget(g, owner);
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
    g.banner = "PASSE";
    sportSfx("menuConfirm");
  }

  function footballCross() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (!owner || owner.team !== "voltz" || owner.keeper || owner.id !== g.controlledId) {
      g.feedback = "Você precisa estar com a bola para cruzar.";
      return;
    }

    const target = getFootballDirectionalTarget(g, owner);
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
    g.banner = "CRUZAMENTO";
    sportSfx("throwCurve");
  }

  function getFootballFacing(player, fallbackTarget = null) {
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

  function footballSwitchPlayer() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (owner?.team === "voltz") {
      g.controlledId = owner.id;
      g.feedback = `#${owner.number} está com a bola. O controle acompanha a posse.`;
      return;
    }

    const outfield = getFootballTeam(g, "voltz", false);
    if (!outfield.length) return;
    const currentIndex = Math.max(0, outfield.findIndex((player) => player.id === g.controlledId));
    const next = outfield[(currentIndex + 1) % outfield.length] || outfield[0];
    g.controlledId = next.id;
    g.feedback = `Troca manual: você agora controla #${next.number}.`;
    g.banner = `CONTROLE #${next.number}`;
    sportSfx("menuMove");
  }

  function footballPrimaryAction() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (owner?.team === "voltz" && owner.id === g.controlledId && !owner.keeper) shootFootball();
    else footballTackle();
  }

  function shootFootball() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const owner = getFootballOwner(g);
    if (!owner || owner.team !== "voltz" || owner.keeper || owner.id !== g.controlledId) {
      g.feedback = "Recupere a posse antes de finalizar.";
      return;
    }

    let targetY = 50;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) targetY = 35;
    else if (state.pressed.has("s") || state.pressed.has("arrowdown")) targetY = 65;
    else targetY = owner.y < 50 ? 39 : owner.y > 50 ? 61 : (Math.random() > .5 ? 39 : 61);

    const distance = 100 - owner.x;
    const speed = clamp(80 - distance * .18, 64, 78);
    const spread = distance > 55 ? (Math.random() - .5) * 8 : (Math.random() - .5) * 3;
    footballLaunchBall(g, owner, 104, clamp(targetY + spread, 31.5, 68.5), speed, performance.now(), { isShot:true });
    g.feedback = distance > 55 ? "Chute de longe! O goleiro tem tempo para reagir." : "Finalização! Ache o canto antes que o goleiro feche.";
    g.banner = "FINALIZAÇÃO";
    sportSfx("throwPower");
  }

  function activateFootballVision() {
    const g = state.current;
    if (!g || g.type !== "football" || g.phase !== "play") return;
    const now = performance.now();
    if (now < g.visionCooldownUntil) {
      g.feedback = `Voltz Vision recarregando: ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s.`;
      sportSfx("menuBack");
      return;
    }
    g.visionUntil = now + 1800;
    g.visionCooldownUntil = now + 6500;
    g.feedback = "VOLTZ VISION: leia pressão, linhas de passe e espaços antes de decidir.";
    g.banner = "VOLTZ VISION";
    sportSfx("counterReady");
  }

  function footballEnemyPass(g, owner, now) {
    const candidates = getFootballTeam(g, "rival", false).filter((player) => player.id !== owner.id);
    const target = candidates
      .filter((player) => player.x < owner.x + 8)
      .sort((a, b) => a.x - b.x)[0] || candidates[0];
    if (!target) return false;
    footballLaunchBall(g, owner, target.x, target.y, 45, now, { passTargetId: target.id });
    g.aiActionAt = now + 1200;
    return true;
  }

  function footballEnemyShoot(g, owner, now) {
    const targetY = Math.random() > .5 ? 36 : 64;
    footballLaunchBall(g, owner, -4, targetY + (Math.random() - .5) * 4, 72, now, { isShot:true });
    g.aiActionAt = now + 1400;
    g.banner = "CHUTE ADVERSÁRIO";
    return true;
  }

  function updateFootballControlledPlayer(g, dt) {
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
    const pitchLength = Math.hypot(dx * FOOTBALL_PITCH_SCALE_X, dy * FOOTBALL_PITCH_SCALE_Y) || 1;
    if (dx || dy) {
      controlled.facingX = dx / len;
      controlled.facingY = dy / len;
      const recoveryScale = now < Number(controlled.recoverUntil || 0) ? .28 : 1;
      controlled.x += dx / pitchLength * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;
      controlled.y += dy / pitchLength * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;
      controlled.movingUntil = now + 130;
      controlled.x = clamp(controlled.x, 7, 93);
      controlled.y = clamp(controlled.y, 8, 92);
    }
  }

  function getFootballKeeperThreat(g, keeper) {
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
      keeper.reactionUntil = Number(g.ball.shotAt || now) + 170 + Math.random() * 70;
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

  function getFootballNearestMarkerDistance(g, player) {
    if (!g || !player) return Infinity;
    const opponents = getFootballTeam(g, player.team === "voltz" ? "rival" : "voltz", false);
    if (!opponents.length) return Infinity;
    return Math.min(...opponents.map((opponent) => footballDistance(opponent, player)));
  }

  function getFootballBallFutureSamples(g, horizon = 2.6, step = .055) {
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
    const speed = Math.max(12.5, Number(player.speed || 15) * 1.06) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);

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

  function getFootballDefensiveBlockTarget(g, defender, owner, roleIndex = 0) {
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

  function getFootballLooseBallMovement(g, player, now, roleIndex = 0, primaryChaserId = null) {
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

  function updateFootballAI(g, now, dt) {
    const owner = getFootballOwner(g);
    const possession = owner?.team || null;
    const ball = g.ball;
    const controlled = getFootballPlayer(g, g.controlledId);

    const voltzOutfield = getFootballTeam(g, "voltz", false);
    const rivalOutfield = getFootballTeam(g, "rival", false);

    // V3.9: sem a bola, a seleção é manual pelo Q. O controle só troca
    // automaticamente quando um jogador Voltz realmente recebe a posse.

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

  function resolveFootballPlayerSeparation(g) {
    const players = g?.players || [];
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const a = players[i];
        const b = players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || .001;
        const minDistance = a.keeper || b.keeper ? 3.5 : 3.85;
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

  function updateFootballBall(g, now, dt) {
    const ball = g.ball;
    const owner = getFootballOwner(g);

    if (owner) {
      const direction = owner.team === "voltz" ? 1 : -1;
      const facing = getFootballFacing(owner, { x:owner.x + direction, y:owner.y });
      const dribbleOffset = owner.keeper ? 1.1 : 1.75;
      ball.x = owner.x + facing.x * dribbleOffset;
      ball.y = owner.y + facing.y * dribbleOffset;

      if (owner.keeper && now >= ball.keeperReleaseAt) {
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
      }

      return;
    }

    ball.x += ball.vx * dt;
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

    if (ball.y <= 3 && ball.vy < 0) { ball.y = 3; ball.vy *= -.72; }
    if (ball.y >= 97 && ball.vy > 0) { ball.y = 97; ball.vy *= -.72; }

    const inGoalMouth = ball.y >= 32 && ball.y <= 68;
    if (ball.x >= 100) {
      if (inGoalMouth && ball.z <= 4.5) footballGoal(g, "voltz");
      else footballSetPossession(g, getFootballPlayer(g, "rgk"), now, "Tiro de meta do visitante.");
      return;
    }
    if (ball.x <= 0) {
      if (inGoalMouth && ball.z <= 4.5) footballGoal(g, "rival");
      else footballSetPossession(g, getFootballPlayer(g, "vgk"), now, "Tiro de meta Voltz.");
      return;
    }

    if (now < ball.ignorePickupUntil) return;

    const candidates = g.players
      .filter((player) => !player.keeper || (player.team === "voltz" ? ball.x < 15 : ball.x > 85))
      .map((player) => ({ player, distance:footballDistance(player, ball) }))
      .filter((entry) => {
        const maxHeight = entry.player.keeper ? 6.4 : (ball.vz < 0 ? 4.2 : 2.5);
        if (ball.z > maxHeight) return false;
        const keeperDiving = entry.player.keeper && ball.isShot && now < Number(entry.player.diveUntil || 0);
        const radius = entry.player.keeper ? (keeperDiving ? 5.6 : 4.4) : ball.z > 1.4 ? 2.25 : 2.65;
        return entry.distance < radius;
      })
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length) {
      const receiver = candidates[0].player;
      const intended = ball.passTargetId && receiver.id === ball.passTargetId;
      const blocked = ball.passTargetId && receiver.id !== ball.passTargetId;
      const wasShot = Boolean(ball.isShot);
      footballSetPossession(g, receiver, now,
        intended
? `${receiver.team === "voltz" ? "Passe recebido" : "Passe adversário"} por #${receiver.number}.`
: blocked
  ? `${receiver.team === "voltz" ? "INTERCEPTOU!" : "Passe interceptado."}`
  : receiver.keeper
    ? `${receiver.team === "voltz" ? "Seu goleiro segurou!" : "Defesa do goleiro."}`
    : ball.z > 1.2 ? `${receiver.team === "voltz" ? "BOLA ALTA DOMINADA!" : "O visitante ganhou a disputa aérea."}` : "Bola dominada.");
      if (receiver.keeper && wasShot) {
        g.banner = receiver.team === "voltz" ? "DEFESA!" : "GOLEIRO DEFENDEU";
        g.feedback = receiver.team === "voltz" ? "Seu goleiro leu a trajetória e fez a defesa." : "O goleiro leu o chute e fechou o gol.";
      } else if (blocked) {
        g.banner = receiver.team === "voltz" ? "INTERCEPÇÃO" : "PASSE CORTADO";
      }
    }
  }

  function buildFootballVision(g) {
    const controlled = getFootballPlayer(g, g.controlledId);
    if (!controlled) return "";
    const owner = getFootballOwner(g);
    const parts = [];

    const line = (className, a, b) => {
      const pa = projectFootballPoint(a.x, a.y);
      const pb = projectFootballPoint(b.x, b.y);
      return `<line class="${className}" x1="${pa.x.toFixed(2)}" y1="${pa.y.toFixed(2)}" x2="${pb.x.toFixed(2)}" y2="${pb.y.toFixed(2)}"></line>`;
    };
    const ellipse = (className, point, radius) => {
      const p = projectFootballPoint(point.x, point.y);
      return `<ellipse class="${className}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" rx="${(radius * p.scale).toFixed(2)}" ry="${(radius * .62 * p.scale).toFixed(2)}"></ellipse>`;
    };

    getFootballTeam(g, "rival", false).forEach((rival) => {
      parts.push(ellipse('vision-pressure', rival, 7));
    });

    if (owner?.team === "voltz" && owner.id === controlled.id) {
      getFootballTeam(g, "voltz", false)
        .filter((mate) => mate.id !== owner.id)
        .forEach((mate) => {
          const open = isFootballPassLaneOpen(g, owner, mate);
          parts.push(line(`vision-pass ${open ? "is-open" : "is-risky"}`, owner, mate));
          parts.push(ellipse(`vision-space ${open ? "is-open" : "is-risky"}`, mate, 4.5));
        });

      if (owner.x >= 48) {
        parts.push(line('vision-shot', owner, { x:99, y:35 }));
        parts.push(line('vision-shot', owner, { x:99, y:65 }));
      }
    } else {
      parts.push(ellipse('vision-control', controlled, 5.5));
      parts.push(line('vision-chase', controlled, g.ball));
    }
    return parts.join("");
  }

  function getFootballDomCache(g) {
    if (!g) return null;
    const cached = g._footballDomCache;
    if (cached?.field?.isConnected) return cached;

    const players = new Map();
    (g.players || []).forEach((player) => {
      players.set(player.id, document.getElementById(`footballPlayer-${player.id}`));
    });

    const next = {
      field: document.getElementById("footballField"),
      players,
      ballEl: document.getElementById("footballBall"),
      ballShadow: document.getElementById("footballBallShadow"),
      targetEl: document.getElementById("footballPassTarget"),
      scoreVoltz: document.getElementById("footballScoreVoltz"),
      scoreRival: document.getElementById("footballScoreRival"),
      banner: document.getElementById("footballMatchBanner"),
      feedback: document.getElementById("footballFeedback"),
      visionSvg: document.getElementById("footballVisionSvg"),
      visionStatus: document.getElementById("footballVisionStatus")
    };
    g._footballDomCache = next;
    return next;
  }

  function updateFootballDom(now = performance.now()) {
    const g = state.current;
    if (!g || g.type !== "football") return;
    const dom = getFootballDomCache(g);
    const field = dom?.field;
    if (!field) return;

    g.players.forEach((player) => {
      const el = dom.players.get(player.id);
      if (!el) return;

      const projected = projectFootballPoint(player.x, player.y);
      const left = `${projected.x.toFixed(2)}%`;
      const top = `${projected.y.toFixed(2)}%`;
      const visual = el._footballVisualState || (el._footballVisualState = {});
      if (visual.left !== left) { el.style.left = left; visual.left = left; }
      if (visual.top !== top) { el.style.top = top; visual.top = top; }
      const depthZ = String(30 + Math.round(projected.y));
      if (visual.depthZ !== depthZ) {
        el.style.setProperty('--football-depth-z', depthZ);
        visual.depthZ = depthZ;
      }

      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });
      const isSvgAvatar = el.classList.contains("is-svg-avatar");
      if (!isSvgAvatar) {
        const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;
        const angleValue = `${angle.toFixed(1)}deg`;
        if (visual.angle !== angleValue) {
          el.style.setProperty("--football-facing-angle", angleValue);
          visual.angle = angleValue;
        }
      }

      const facingName = Math.abs(facing.x) >= Math.abs(facing.y)
        ? (facing.x >= 0 ? "right" : "left")
        : (facing.y >= 0 ? "down" : "up");
      if (visual.facing !== facingName) {
        el.dataset.footballFacing = facingName;
        visual.facing = facingName;
      }

      if (isSvgAvatar) {
        const depthBucket = Math.round(projected.depth * 20);
        if (visual.depthBucket !== depthBucket) {
          const depth = depthBucket / 20;
          const depthScale = isFootballPerspectiveRender() ? (.82 + depth * .24) : clamp(.94 + player.y * .0012, .95, 1.06);
          el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));
          visual.depthBucket = depthBucket;
        }
      }

      const controlled = player.id === g.controlledId && !player.keeper;
      const hasBall = g.ball.ownerId === player.id;
      const running = now < Number(player.movingUntil || 0);
      const tackling = now < Number(player.tackleUntil || 0);
      const recovering = now < Number(player.recoverUntil || 0);
      if (visual.controlled !== controlled) { el.classList.toggle("is-controlled", controlled); visual.controlled = controlled; }
      if (visual.hasBall !== hasBall) { el.classList.toggle("has-ball", hasBall); visual.hasBall = hasBall; }
      if (visual.running !== running) { el.classList.toggle("is-running", running); visual.running = running; }
      if (visual.tackling !== tackling) { el.classList.toggle("is-tackling", tackling); visual.tackling = tackling; }
      if (visual.recovering !== recovering) { el.classList.toggle("is-recovering", recovering); visual.recovering = recovering; }
    });

    const ballEl = dom.ballEl;
    const ballShadow = dom.ballShadow;
    const ballGround = projectFootballPoint(g.ball.x, g.ball.y);
    if (ballEl) {
      const height = Number(g.ball.z || 0);
      const heightPx = Math.min(82, height * 4.2 * ballGround.scale);
      const scale = ballGround.scale * (1 + Math.min(.34, height * .018));
      ballEl.style.left = `${ballGround.x.toFixed(2)}%`;
      ballEl.style.top = `${ballGround.y.toFixed(2)}%`;
      ballEl.style.zIndex = String(40 + Math.round(ballGround.y) + (height > .35 ? 28 : 0));
      ballEl.style.transform = `translate(-50%, calc(-50% - ${heightPx}px)) scale(${scale.toFixed(3)})`;
      ballEl.classList.toggle("is-airborne", height > .35);
    }
    if (ballShadow) {
      ballShadow.style.left = `${ballGround.x.toFixed(2)}%`;
      ballShadow.style.top = `${ballGround.y.toFixed(2)}%`;
      const height = Number(g.ball.z || 0);
      ballShadow.style.zIndex = String(22 + Math.round(ballGround.y));
      ballShadow.style.opacity = `${clamp(.34 - height * .012, .08, .34)}`;
      ballShadow.style.transform = `translate(-50%,-50%) scale(${(ballGround.scale * (1 + Math.min(.8, height * .035))).toFixed(3)})`;
    }

    const targetEl = dom.targetEl;
    const target = getFootballPlayer(g, g.ball.passTargetId);
    if (targetEl) {
      const visible = Boolean(target && !g.ball.ownerId);
      if (g._footballPassTargetVisible !== visible) {
        targetEl.classList.toggle("visible", visible);
        g._footballPassTargetVisible = visible;
      }
      if (target) {
        const projectedTarget = projectFootballPoint(target.x, target.y);
        const targetLeft = `${projectedTarget.x.toFixed(2)}%`;
        const targetTop = `${projectedTarget.y.toFixed(2)}%`;
        if (g._footballPassTargetLeft !== targetLeft) { targetEl.style.left = targetLeft; g._footballPassTargetLeft = targetLeft; }
        if (g._footballPassTargetTop !== targetTop) { targetEl.style.top = targetTop; g._footballPassTargetTop = targetTop; }
        targetEl.style.setProperty('--football-target-scale', projectedTarget.scale.toFixed(3));
      }
    }

    const scoreVoltz = dom.scoreVoltz;
    const scoreRival = dom.scoreRival;
    const banner = dom.banner;
    const feedback = dom.feedback;
    const scoreVoltzText = String(g.score);
    const scoreRivalText = String(g.rivalScore);
    const bannerText = String(g.banner || "");
    const feedbackText = String(g.feedback || "");
    if (scoreVoltz && scoreVoltz.textContent !== scoreVoltzText) scoreVoltz.textContent = scoreVoltzText;
    if (scoreRival && scoreRival.textContent !== scoreRivalText) scoreRival.textContent = scoreRivalText;
    if (banner && banner.textContent !== bannerText) banner.textContent = bannerText;
    if (feedback && feedback.textContent !== feedbackText) feedback.textContent = feedbackText;

    const visionActive = now < g.visionUntil;
    if (g._footballVisionClassActive !== visionActive) {
      field.classList.toggle("vision-active", visionActive);
      g._footballVisionClassActive = visionActive;
    }
    const visionSvg = dom.visionSvg;
    if (visionSvg) {
      if (visionActive) {
        if (now - Number(g._footballVisionRenderedAt || 0) >= 80) {
          visionSvg.innerHTML = buildFootballVision(g);
          g._footballVisionRenderedAt = now;
        }
      } else if (g._footballVisionWasActive) {
        visionSvg.innerHTML = "";
      }
      g._footballVisionWasActive = visionActive;
    }

    const visionStatus = dom.visionStatus;
    if (visionStatus) {
      const visionText = visionActive
        ? "I · VOLTZ VISION ATIVA"
        : now < g.visionCooldownUntil
          ? `I · RECARGA ${((g.visionCooldownUntil - now) / 1000).toFixed(1)}s`
          : "I · VOLTZ VISION PRONTA";
      if (visionStatus.textContent !== visionText) visionStatus.textContent = visionText;
    }
  }

  function updateFootballMatch(now, dt) {
    const g = state.current;
    if (!g || g.type !== "football") return;
    if (g.phase !== "play") {
      updateFootballDom(now);
      return;
    }

    // A Vision desacelera o mundo inteiro, inclusive o jogador: ela compra tempo de leitura,
    // não velocidade grátis para atravessar o campo.
    const timeScale = now < g.visionUntil ? .46 : 1;
    const simDt = dt * timeScale;
    updateFootballControlledPlayer(g, simDt);
    updateFootballKeepers(g, simDt);
    updateFootballAI(g, now, simDt);
    resolveFootballPlayerSeparation(g);
    updateFootballBall(g, now, simDt);
    updateFootballDom(now);
  }

  // Compatibilidade com qualquer botão antigo que ainda esteja em cache.
  function chooseFootballZone() {}

  // -------------------------------------------------------
  // Basquete
  // -------------------------------------------------------
  function startBasketball() {
    const compact = state.mode === "championship";
    state.current = {
      type: "basketball",
      attempts: 0,
      scores: 0,
      attemptsMax: compact ? 2 : 5,
      needed: compact ? 1 : 3,
      cursor: 8,
      dir: 1,
      locked: false
    };
    renderBasketball();

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "basketball") return;
      const dt = Math.min(32, now - last);
      last = now;
      const g = state.current;
      g.cursor += g.dir * dt * 0.11;
      if (g.cursor >= 100) { g.cursor = 100; g.dir = -1; }
      if (g.cursor <= 0) { g.cursor = 0; g.dir = 1; }
      const el = document.getElementById("basketballCursor");
      if (el) el.style.left = `${g.cursor}%`;
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function renderBasketball(feedback = "") {
    const g = state.current;
    openPanelShell(
      "🏀 Basquete · Janela de Arremesso",
      "Quadra do Ritmo",
      `Acerte ${g.needed} cesta${g.needed === 1 ? "" : "s"} em até ${g.attemptsMax} arremesso${g.attemptsMax === 1 ? "" : "s"}.`,
      `<div class="sports-game-card">
        <div class="sports-status-row"><span class="sports-stat-pill">Cestas ${g.scores}/${g.needed}</span><span class="sports-stat-pill">Arremessos ${g.attempts}/${g.attemptsMax}</span></div>
        <div class="basketball-hoop-ui"><div class="basketball-backboard"></div></div>
        <div class="sports-meter"><div class="sports-meter-perfect"></div><div id="basketballCursor" class="sports-meter-cursor" style="left:${g.cursor}%"></div></div>
        <div style="text-align:center;"><button class="sports-primary-btn" type="button" onclick="VoltzSports.shootBasketball()" ${g.locked ? "disabled" : ""}>Arremessar [Espaço]</button></div>
        <div class="sports-feedback">${escapeHtml(feedback)}</div>
        <div class="sports-help">A janela verde representa o ponto de liberação mais estável do arremesso.</div>
      </div>`
    );
  }

  function shootBasketball() {
    const g = state.current;
    if (!g || g.type !== "basketball" || g.locked) return;
    g.locked = true;
    g.attempts += 1;
    const scored = g.cursor >= 40 && g.cursor <= 60;
    if (scored) g.scores += 1;
    renderBasketball(scored ? "SWISH! Timing limpo." : g.cursor < 40 ? "Soltou cedo demais." : "Segurou a bola por tempo demais.");

    addTimer(() => {
      if (!state.current || state.current.type !== "basketball") return;
      if (g.scores >= g.needed) finishSport("basketball", true, `Você encontrou o timing e converteu ${g.scores} cesta${g.scores === 1 ? "" : "s"}.`);
      else if (g.attempts >= g.attemptsMax) finishSport("basketball", false, `Você terminou com ${g.scores}/${g.needed} cestas necessárias.`);
      else { g.locked = false; renderBasketball("Próximo arremesso."); }
    }, 700);
  }

  // -------------------------------------------------------
  // Atletismo
  // -------------------------------------------------------
  function startAthletics() {
    state.current = {
      type: "athletics",
      phase: "idle",
      signal: "PREPARE-SE",
      distance: 0,
      target: state.mode === "championship" ? 70 : 125,
      energy: 100,
      lastStep: "",
      timeLeft: state.mode === "championship" ? 5 : 8,
      falseStarts: 0,
      goAt: 0,
      sprintInterval: null
    };
    renderAthletics();
  }

  function renderAthletics(feedback = "") {
    const g = state.current;
    const progress = clamp((g.distance / g.target) * 100, 0, 100);
    openPanelShell(
      "🏃 Atletismo · Largada e Ritmo",
      "Pista do Impulso",
      "Espere o sinal. Na corrida, alterne A e D; repetir a mesma passada não gera impulso.",
      `<div class="sports-game-card">
        <div class="sports-status-row"><span class="sports-stat-pill">Distância ${Math.round(g.distance)}/${g.target}</span><span class="sports-stat-pill">Tempo ${g.timeLeft.toFixed(1)}s</span></div>
        <div class="athletics-light"><div id="athleticsSignal" class="athletics-signal ${g.phase === "go" || g.phase === "sprint" ? "go" : ""}">${escapeHtml(g.signal)}</div></div>
        <div class="athletics-track-ui">
          <div>Progresso</div><div class="athletics-progress-track"><div id="athleticsProgress" class="athletics-progress-fill" style="width:${progress}%"></div></div>
          <div>Energia</div><div class="athletics-energy-track"><div id="athleticsEnergy" class="athletics-energy-fill" style="width:${g.energy}%"></div></div>
        </div>
        <div style="text-align:center;margin-top:16px;"><button class="sports-primary-btn" type="button" onclick="VoltzSports.beginAthletics()" ${g.phase !== "idle" ? "disabled" : ""}>Entrar nos blocos [Espaço]</button></div>
        <div class="sports-feedback">${escapeHtml(feedback)}</div>
        <div class="sports-help">${g.phase === "sprint" ? "Alterne A → D → A → D. Energia baixa reduz o impulso." : "Pressionar Espaço antes do JÁ! conta como falsa largada."}</div>
      </div>`
    );
  }

  function beginAthletics() {
    const g = state.current;
    if (!g || g.type !== "athletics" || g.phase !== "idle") return;
    g.phase = "waiting";
    g.signal = "ESPERE...";
    renderAthletics();
    const wait = 900 + Math.random() * 1200;
    addTimer(() => {
      if (state.current !== g || g.phase !== "waiting") return;
      g.phase = "go";
      g.signal = "JÁ!";
      g.goAt = performance.now();
      renderAthletics("REAJA! Espaço!");
      addTimer(() => {
        if (state.current === g && g.phase === "go") finishSport("athletics", false, "Você demorou demais para reagir ao sinal de largada.");
      }, state.mode === "championship" ? 850 : 1000);
    }, wait);
  }

  function athleticsSpace() {
    const g = state.current;
    if (!g || g.type !== "athletics") return;

    if (g.phase === "idle") {
      beginAthletics();
      return;
    }

    if (g.phase === "waiting") {
      g.falseStarts += 1;
      g.phase = "idle";
      g.signal = "FALSA LARGADA";
      renderAthletics("Você saiu antes do sinal. Reposicione-se nos blocos.");
      addTimer(() => {
        if (state.current === g && g.phase === "idle") {
          g.signal = "PREPARE-SE";
          renderAthletics(g.falseStarts >= 2 ? "Mais uma falsa largada encerra a tentativa." : "");
        }
      }, 850);
      if (g.falseStarts >= 2) addTimer(() => finishSport("athletics", false, "Duas falsas largadas encerraram a prova."), 900);
      return;
    }

    if (g.phase === "go") {
      const reaction = performance.now() - g.goAt;
      g.phase = "sprint";
      g.signal = `${Math.round(reaction)} ms`;
      g.timeLeft = state.mode === "championship" ? 5 : 8;
      renderAthletics(`Boa largada: ${Math.round(reaction)} ms. Agora alterne A e D!`);

      const started = performance.now();
      let lastTime = started;
      const interval = addInterval(() => {
        if (state.current !== g || g.phase !== "sprint") return;
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        g.timeLeft = Math.max(0, g.timeLeft - delta);
        g.energy = Math.min(100, g.energy + delta * 12);
        updateAthleticsLive();

        if (g.distance >= g.target) finishSport("athletics", true, "Você controlou a largada e manteve uma cadência eficiente até a chegada.");
        else if (g.timeLeft <= 0) finishSport("athletics", false, `Você chegou a ${Math.round(g.distance)}/${g.target} de distância antes do tempo acabar.`);
      }, 70);
      g.sprintInterval = interval;
    }
  }

  function athleticsStep(key) {
    const g = state.current;
    if (!g || g.type !== "athletics" || g.phase !== "sprint") return;
    const upper = key.toUpperCase();
    if (!["A","D"].includes(upper) || upper === g.lastStep) return;
    g.lastStep = upper;
    const strong = g.energy >= 25;
    g.distance += strong ? 10 : 4;
    g.energy = Math.max(0, g.energy - 8);
    updateAthleticsLive();
    if (g.distance >= g.target) finishSport("athletics", true, "Você controlou a largada e manteve uma cadência eficiente até a chegada.");
  }

  function updateAthleticsLive() {
    const g = state.current;
    if (!g || g.type !== "athletics") return;
    const p = document.getElementById("athleticsProgress");
    const e = document.getElementById("athleticsEnergy");
    const signal = document.getElementById("athleticsSignal");
    if (p) p.style.width = `${clamp((g.distance / g.target) * 100, 0, 100)}%`;
    if (e) e.style.width = `${clamp(g.energy, 0, 100)}%`;
    if (signal) signal.textContent = g.phase === "sprint" ? `${g.timeLeft.toFixed(1)}s` : g.signal;
  }

  // -------------------------------------------------------
  // Vôlei
  // -------------------------------------------------------
  function startVolleyball() {
    const length = state.mode === "championship" ? 4 : 8;
    const keys = ["A","S","D"];
    const sequence = Array.from({ length }, () => keys[Math.floor(Math.random() * keys.length)]);
    state.current = {
      type: "volleyball",
      sequence,
      index: 0,
      misses: 0,
      maxMisses: state.mode === "championship" ? 1 : 2,
      deadlineTimer: null
    };
    renderVolleyball("Prepare a recepção.");
    scheduleVolleyballDeadline();
  }

  function renderVolleyball(feedback = "") {
    const g = state.current;
    openPanelShell(
      "🏐 Vôlei · Sequência de Três Toques",
      "Quadra da Sequência",
      "Leia o comando atual e responda antes que a janela termine. A, S e D representam posições de toque.",
      `<div class="sports-game-card">
        <div class="sports-status-row"><span class="sports-stat-pill">Sequência ${g.index}/${g.sequence.length}</span><span class="sports-stat-pill">Erros ${g.misses}/${g.maxMisses}</span></div>
        <div class="volleyball-sequence">${g.sequence.map((key, i) => `<div class="volleyball-key ${i < g.index ? "done" : i === g.index ? "current" : ""}">${key}</div>`).join("")}</div>
        <div class="sports-feedback">${escapeHtml(feedback)}</div>
        <div class="sports-help">Cada comando tem uma janela curta. Pense em recepção → levantamento → ataque como uma sequência de ritmo.</div>
      </div>`
    );
  }

  function scheduleVolleyballDeadline() {
    const g = state.current;
    if (!g || g.type !== "volleyball") return;
    const timer = setTimeout(() => {
      if (state.current !== g || g.index >= g.sequence.length) return;
      g.misses += 1;
      if (g.misses > g.maxMisses) {
        finishSport("volleyball", false, "A sequência se perdeu depois de erros demais.");
      } else {
        g.index += 1;
        if (g.index >= g.sequence.length) finishSport("volleyball", true, "Mesmo com um ajuste no meio da jogada, você completou a sequência.");
        else {
          renderVolleyball("Você perdeu a janela desse toque. Recupere a jogada!");
          scheduleVolleyballDeadline();
        }
      }
    }, state.mode === "championship" ? 950 : 1150);
    state.cleanupFns.push(() => clearTimeout(timer));
    g.deadlineTimer = timer;
  }

  function volleyballInput(key) {
    const g = state.current;
    if (!g || g.type !== "volleyball" || g.index >= g.sequence.length) return;
    if (g.deadlineTimer) clearTimeout(g.deadlineTimer);
    const expected = g.sequence[g.index];
    if (key.toUpperCase() === expected) {
      g.index += 1;
      if (g.index >= g.sequence.length) {
        finishSport("volleyball", true, "Recepção, levantamento e ataque conectados no ritmo certo.");
      } else {
        renderVolleyball("Toque correto!");
        scheduleVolleyballDeadline();
      }
    } else {
      g.misses += 1;
      if (g.misses > g.maxMisses) finishSport("volleyball", false, `Você pressionou ${key.toUpperCase()} quando a jogada pedia ${expected}.`);
      else {
        renderVolleyball(`Comando errado. O próximo toque ainda é ${expected}.`);
        scheduleVolleyballDeadline();
      }
    }
  }




  function getRubroPhase(g) {
    if (!g?.opponentMaxHp) return 1;
    const ratio = g.opponentHp / g.opponentMaxHp;
    if (ratio > 0.60) return 1;
    if (ratio > 0.30) return 2;
    return 3;
  }

  function getCapitaoRubroPose(g, stance = "idle") {
    const maxHp = Math.max(1, Number(g?.opponentMaxHp || 100));
    const hpRatio = Number(g?.opponentHp ?? maxHp) / maxHp;
    const seriousMode = Boolean(g?.rallyActive) || hpRatio <= 0.30;

    // A pose de fase 2 tem prioridade no trecho mais perigoso da batalha.
    if (seriousMode && CAPITAO_RUBRO_POSE_SLOTS.phase2.enabled) {
      return CAPITAO_RUBRO_POSE_SLOTS.phase2.path;
    }

    // Durante os ataques normais, Rubro troca para a pose preparada de arremesso.
    // "defense" aqui é o estado geral do turno inimigo; a troca ocorre apenas
    // quando setRubroDefenseVisual chama charge/throw/feint.
    if (["throw", "charge", "feint"].includes(stance) && CAPITAO_RUBRO_POSE_SLOTS.attack.enabled) {
      return CAPITAO_RUBRO_POSE_SLOTS.attack.path;
    }

    return CAPITAO_RUBRO_IMAGE;
  }

  function getCapitaoRubroPoseName(g, stance = "idle") {
    const pose = getCapitaoRubroPose(g, stance);
    if (pose === CAPITAO_RUBRO_POSE_SLOTS.phase2.path) return "phase2";
    if (pose === CAPITAO_RUBRO_POSE_SLOTS.attack.path) return "attack";
    return "base";
  }

  function hpPercent(value, max) {
    return clamp((Number(value || 0) / Math.max(1, Number(max || 1))) * 100, 0, 100);
  }

  function renderDodgeHpBar(label, value, max, side = "player") {
    const pct = hpPercent(value, max);
    return `<div class="dodge-hp-block ${side}">
      <div class="dodge-hp-label"><strong>${escapeHtml(label)}</strong><span>${Math.max(0, Math.round(value))}/${max} HP</span></div>
      <div class="dodge-hp-track"><i style="width:${pct}%"></i></div>
    </div>`;
  }


  function renderDodgeballArenaLayers() {
    return `
      <div class="dodgeball-scene-layers" aria-hidden="true">
        <img class="dodgeball-scene-layer layer-bg" src="${DODGEBALL_VISUALS.background}" alt="" draggable="false">
        <img class="dodgeball-scene-layer layer-stands" src="${DODGEBALL_VISUALS.stands}" alt="" draggable="false">
        <img class="dodgeball-scene-layer layer-floor" src="${DODGEBALL_VISUALS.floor}" alt="" draggable="false">
        <img class="dodgeball-scene-layer layer-overlay" src="${DODGEBALL_VISUALS.overlay}" alt="" draggable="false">
      </div>`;
  }

  function renderDodgeballRival(g, phase = "command") {
    const rubroPhase = getRubroPhase(g);
    const stance = phase === "defense" ? "rival-throwing" : phase === "aim" ? "rival-ready" : "rival-waiting";
    const pose = getCapitaoRubroPose(g, phase);
    const poseName = getCapitaoRubroPoseName(g, phase);
    const rallyClass = g.rallyActive ? " rally-active" : "";
    const hpPct = hpPercent(g.opponentHp, g.opponentMaxHp);
    return `
      <section class="dodgeball-rival-stage ${stance} rubro-phase-${rubroPhase}${rallyClass}" aria-label="Capitão Rubro" data-rubro-phase="${rubroPhase}" data-rubro-pose="${poseName}">
        <div class="dodgeball-rival-aura"></div>
        <img class="dodgeball-rival-image" src="${pose}" data-pose="${poseName}" data-fallback-src="${CAPITAO_RUBRO_IMAGE}" onerror="this.onerror=null;this.dataset.pose='base';this.src=this.dataset.fallbackSrc;" alt="Capitão Rubro segurando uma bola de queimada" draggable="false" />
        <div class="dodgeball-rival-card">
          <div class="dodgeball-rival-emblem" aria-hidden="true">R</div>
          <div class="dodgeball-rival-identity">
            <strong>CAPITÃO RUBRO</strong>
            <span class="dodgeball-rival-kicker">RIVAL DA ARENA · FASE ${rubroPhase}${g.rallyActive ? " · RALLY" : ""}</span>
          </div>
          <div class="dodgeball-rival-hp">
            <span>HP</span>
            <div class="dodgeball-rival-hp-track"><i style="width:${hpPct}%"></i></div>
            <b>${Math.max(0, Math.round(g.opponentHp))} / ${g.opponentMaxHp}</b>
          </div>
        </div>
      </section>`;
  }

  function getDodgeballRootActions() {
    return [
      { id: "throw", label: "ARREMESSAR", icon: "⌖", description: "Ataque direto com escolha de estilo." },
      { id: "tactic", label: "TÁTICA", icon: "◉", description: "Ler o rival, fintar ou observar o próximo padrão." },
      { id: "item", label: "ITEM", icon: "◆", description: "Recuperar fôlego ou reforçar a defesa." },
      { id: "stance", label: "POSTURA", icon: "⬡", description: "Preparar a defesa para o próximo turno." }
    ];
  }

  function getDodgeballThrowOptions() {
    return [
      { id: "straight", label: "Reto", description: "Janela equilibrada · 18 de dano.", baseDamage: 18, min: 34, max: 66 },
      { id: "curve", label: "Curva", description: "Janela menor · 22 de dano e trajetória enganosa.", baseDamage: 22, min: 42, max: 58, graze: 8 },
      { id: "power", label: "Forte", description: "Janela mínima · 32 de dano e impacto pesado.", baseDamage: 32, min: 47, max: 53 }
    ];
  }

  function getDodgeballTacticOptions() {
    return [
      { id: "observe", label: "Observar padrão", description: "Revela o tipo de ataque do próximo turno inimigo." },
      { id: "feint", label: "Finta", description: "Amplia a janela do seu próximo arremesso." },
      { id: "read", label: "Ler postura", description: "Prepara um lançamento mais incisivo no próximo turno." }
    ];
  }

  function getDodgeballItemOptions(g) {
    return [
      { id: "water", label: `Água (${g.items.water})`, available: g.items.water > 0, description: "Recupera 25 HP, até o máximo." },
      { id: "band", label: `Faixa (${g.items.band})`, available: g.items.band > 0, description: "Absorve o próximo impacto na esquiva." },
      { id: "whistle", label: `Apito (${g.items.whistle})`, available: g.items.whistle > 0, description: "Desacelera as bolas do próximo turno inimigo." }
    ];
  }

  function getDodgeballStanceOptions() {
    return [
      { id: "defense", label: "Defensiva", description: "Aumenta a velocidade de movimento no próximo turno inimigo." },
      { id: "focus", label: "Concentração", description: "Amplia a janela do próximo arremesso." },
      { id: "prepare", label: "Preparar lançamento", description: "Adiciona dano ao próximo arremesso." }
    ];
  }


  function chooseNextDodgePattern(g) {
    const phase = getRubroPhase(g);
    const catalog = {
      bounceTrio: {
        id: "bounce-trio",
        label: "Três Rebotes",
        duration: 6800,
        catchable: true,
        telegraph: "Rubro solta três bolas de uma vez. Elas ficam mais rápidas a cada rebote."
      },
      cornerBarrage: {
        id: "corner-barrage",
        label: "Mira Rubra",
        duration: 7200,
        catchable: true,
        telegraph: "Rubro vai para o canto. Observe os avisos de impacto — depois da terceira, não confie neles."
      },
      fallingRain: {
        id: "falling-rain",
        label: "Chuva Rubra",
        duration: 6600,
        catchable: false,
        telegraph: "Rubro lança as bolas para o alto. As sombras mostram onde elas vão cair."
      },
      wallPassage: {
        id: "wall-passage",
        label: "Passagem Estreita",
        duration: 6500,
        catchable: true,
        telegraph: "As bolas formam paredes. Sempre existe uma abertura — mas ela muda a cada onda."
      },
      siege: {
        id: "siege",
        label: "Cerco Rubro",
        duration: 6700,
        catchable: true,
        telegraph: "Quatro bolas fecham o centro e retornam para fora. Uma delas poderá ser tomada na volta."
      },
      hunter: {
        id: "hunter",
        label: "Caçada",
        duration: 7200,
        catchable: true,
        telegraph: "Uma bola passa a te perseguir enquanto Rubro fecha suas rotas."
      },
      bomb: {
        id: "bomb",
        label: "Bola-Bomba",
        duration: 6600,
        catchable: false,
        telegraph: "A bola grande não está vindo para te acertar diretamente. Saia de perto antes que ela estoure."
      },
      crossfire: {
        id: "crossfire",
        label: "Linha de Fogo",
        duration: 6500,
        catchable: false,
        telegraph: "Rubro cruza a quadra com rajadas horizontais. Procure o corredor vazio."
      },
      spiralPressure: {
        id: "spiral-pressure",
        label: "Espiral Rubra",
        duration: 7600,
        catchable: false,
        telegraph: "O cerco fecha primeiro. Depois, curvas alternadas obrigam você a acompanhar o espaço livre."
      },
      bombCrossfire: {
        id: "bomb-crossfire",
        label: "Bombardeio Cruzado",
        duration: 7800,
        catchable: false,
        telegraph: "Uma Bola-Bomba força o deslocamento enquanto linhas laterais cortam as rotas óbvias."
      },
      falseCorridor: {
        id: "false-corridor",
        label: "Corredor Falso",
        duration: 7600,
        catchable: true,
        telegraph: "As paredes deixam uma passagem, mas Rubro cruza a abertura logo depois. Leia duas ameaças ao mesmo tempo."
      },

      mixRainHunter: {
        id: "mix-rain-hunter",
        label: "Caçada sob Chuva",
        duration: 8200,
        catchable: true,
        telegraph: "A bola perseguidora entra primeiro. Rubro então começa a chover bolas perto de você."
      },
      mixBounceWalls: {
        id: "mix-bounce-walls",
        label: "Rebote Confinado",
        duration: 8200,
        catchable: true,
        telegraph: "Três ricochetes aceleram enquanto paredes de bolas comprimem a arena."
      },
      mixBombCorner: {
        id: "mix-bomb-corner",
        label: "Mira Explosiva",
        duration: 8200,
        catchable: true,
        telegraph: "Rubro prepara uma Bola-Bomba e usa os avisos de mira para impedir sua fuga."
      },
      mixSiegeRain: {
        id: "mix-siege-rain",
        label: "Cerco Vertical",
        duration: 8000,
        catchable: true,
        telegraph: "O Cerco Rubro fecha o centro enquanto novas sombras começam a nascer aos seus pés."
      }
    };

    let pool;
    if (phase === 1) {
      // Rubro já começa com variedade real: nada de quatro padrões excessivamente seguros.
      pool = [catalog.bounceTrio, catalog.cornerBarrage, catalog.fallingRain, catalog.wallPassage, catalog.siege, catalog.crossfire];
    } else if (phase === 2) {
      pool = [
        catalog.bounceTrio, catalog.cornerBarrage, catalog.fallingRain, catalog.wallPassage,
        catalog.siege, catalog.hunter, catalog.bomb, catalog.crossfire,
        catalog.spiralPressure, catalog.falseCorridor,
        catalog.mixRainHunter, catalog.mixBombCorner
      ];
    } else {
      // Abaixo de 30% ele para de apresentar ataques isolados e começa a misturá-los.
      pool = [
        catalog.mixRainHunter, catalog.mixBounceWalls, catalog.mixBombCorner, catalog.mixSiegeRain,
        catalog.spiralPressure, catalog.bombCrossfire, catalog.falseCorridor
      ];
    }

    const filtered = pool.filter((attack) => attack.id !== g.lastPatternId);
    const choices = filtered.length ? filtered : pool;
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    g.nextPattern = { ...chosen };
    g.lastPatternId = chosen.id;
    return g.nextPattern;
  }

  function startDodgeball() {
    playDodgeballMusic(state.mode === "championship" ? .72 : .56);
    sportSfx("whistle");
    const playerMaxHp = 100;
    const opponentMaxHp = 240;
    state.current = {
      type: "dodgeball",
      phase: "command",
      menu: "root",
      playerHp: playerMaxHp,
      playerMaxHp,
      opponentHp: opponentMaxHp,
      opponentMaxHp,
      cursor: 16,
      dir: 1,
      locked: false,
      turn: 1,
      balls: [],
      player: { x: 50, y: 50, invulnerableUntil: 0 },
      defenseEnd: 0,
      patternClearSince: 0,
      lastSpawn: 0,
      lastPatternId: "",
      nextPattern: null,
      activePattern: null,
      enemyAttackStart: 0,
      enemyAttackStep: 0,
      enemyAttackDone: false,
      enemyAttackSequence: [],
      rubroArenaSide: "center",
      fallingBalls: [],
      warningTargets: {},
      catchWindowUntil: 0,
      catchCooldownUntil: 0,
      catchBufferedUntil: 0,
      counterAttackReady: false,
      rallyUsed: false,
      rallyActive: false,
      rallyCompleted: false,
      rallyFinalCaught: false,
      perfectReturnReady: false,
      rubroExhausted: false,
      selectedThrow: null,
      throwWindowBonus: 0,
      damageBonus: 0,
      moveBoost: 1,
      defenseShield: 0,
      enemySlowMultiplier: 1,
      items: { water: 2, band: 1, whistle: 1 },
      dialogue: "Capitão Rubro gira a bola na mão e mede a distância. Escolha sua ação.",
      statusText: "Sua vez.",
      styleUsed: "",
      pendingObservedPattern: false
    };
    chooseNextDodgePattern(state.current);
    renderDodgeballCommand();

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "dodgeball") return;
      const g = state.current;
      const dt = Math.min(32, now - last);
      last = now;

      if (g.phase === "aim") {
        g.cursor += g.dir * dt * 0.105;
        if (g.cursor >= 100) { g.cursor = 100; g.dir = -1; }
        if (g.cursor <= 0) { g.cursor = 0; g.dir = 1; }
        const el = document.getElementById("dodgeAttackCursor");
        if (el) el.style.left = `${g.cursor}%`;
      } else if (g.phase === "defense") {
        updateDodgeDefense(now, dt / 1000);
      }

      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }


  function renderDodgeballLayout(title, subtitle, dialogue, body, phase = "command") {
    const g = state.current;
    if (!panel || !content || !g) return;

    panel.classList.add("dodgeball-fit", "dodgeball-hud-v2", "dodgeball-hud-v3");
    const playerPct = hpPercent(g.playerHp, g.playerMaxHp);
    const turnLabel = String(Math.max(1, Number(g.turn || 1))).padStart(2, "0");
    const defenseMode = phase === "defense";

    content.innerHTML = `
      <div class="dodgeball-shell-v2 dodgeball-shell-v3 phase-${escapeHtml(phase)}">
        <header class="dodgeball-top-hud-v2 dodgeball-top-hud-v3">
          <div class="dodgeball-brand-v2">
            <div class="dodgeball-brand-mark">⚡</div>
            <div><strong>VOLTZ EDUCATION</strong><span>REINO DE EDUCAÇÃO FÍSICA</span></div>
          </div>

          <div class="dodgeball-turn-v2">
            <span>TURNO</span>
            <b>${turnLabel}</b>
          </div>

          <div class="dodgeball-player-status-v2">
            <img src="${DODGEBALL_VISUALS.soulFrames[0]}" alt="" draggable="false">
            <div class="dodgeball-player-status-copy">
              <span>VOCÊ</span>
              <strong>VOLTZ</strong>
            </div>
            <div class="dodgeball-player-hp-v2">
              <b>${Math.max(0, Math.round(g.playerHp))} / ${g.playerMaxHp} HP</b>
              <div><i style="width:${playerPct}%"></i></div>
            </div>
          </div>

          <button class="dodgeball-close-v2" type="button" onclick="VoltzSports.close()" aria-label="Fechar batalha">×</button>
        </header>

        ${state.championship?.active ? renderChampionshipHeader() : ""}

        <main class="dodgeball-main-v2 dodgeball-main-v3 phase-${escapeHtml(phase)}">
          <section class="dodgeball-scene-v2 dodgeball-scene-v3">
            ${renderDodgeballArenaLayers()}
            <div class="dodgeball-scene-title-v2 dodgeball-scene-title-v3">
              <span>ARENA DA ESQUIVA</span>
              <strong>${escapeHtml(title)}</strong>
              <small>${escapeHtml(subtitle)}</small>
            </div>
            ${renderDodgeballRival(g, phase)}
          </section>

          <section class="dodgeball-actions-v2 dodgeball-actions-v3 ${defenseMode ? "is-defense" : "is-command"}">
            ${defenseMode ? `
              <div class="dodgeball-dialogue-box dodgeball-dialogue-arena is-defense">
                <div class="dodgeball-dialogue-defense-head">
                  <span class="dodgeball-dialogue-icon" aria-hidden="true">⚡</span>
                  <p>${escapeHtml(dialogue)}</p>
                </div>
                <div class="dodgeball-defense-transform-slot">${body}</div>
              </div>
            ` : `
              <div class="dodgeball-dialogue-box dodgeball-dialogue-arena is-dialogue">
                <span class="dodgeball-dialogue-icon" aria-hidden="true">≡</span>
                <p>${escapeHtml(dialogue)}</p>
              </div>
              <div class="dodgeball-body-v2 dodgeball-body-v3">${body}</div>
            `}
          </section>
        </main>
      </div>
    `;
  }

  function renderDodgeMenuButtons(menuTitle, options, backLabel = "Voltar") {
    const hasIcons = options.some((option) => option.icon);
    return `
      <div class="dodgeball-command-area ${hasIcons ? "has-icons" : ""}">
        <div class="dodgeball-command-title">${escapeHtml(menuTitle)}</div>
        <div class="dodgeball-command-grid ${options.length > 3 ? "is-four" : ""}">
          ${options.map((option, index) => `
            <button class="dodgeball-command-btn ${option.available === false ? "is-disabled" : ""}" type="button" onclick="${option.onclick}" ${option.available === false ? "disabled" : ""}>
              ${option.icon ? `<span class="dodgeball-command-icon">${escapeHtml(option.icon)}</span>` : ""}
              <span class="dodgeball-command-index">${index + 1}.</span>
              <strong>${escapeHtml(option.label)}</strong>
              <small>${escapeHtml(option.description)}</small>
            </button>
          `).join("")}
        </div>
        <div class="dodgeball-command-footer">Pressione <b>1–4</b> para escolher · <b>Esc</b> para sair · <b>0</b> para ${escapeHtml(backLabel.toLowerCase())}</div>
      </div>`;
  }

  function renderDodgeballCommand() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    const phaseIntensity = getRubroPhase(g) === 3 ? .72 : getRubroPhase(g) === 2 ? .61 : .50;
    setDodgeballMusicIntensity(phaseIntensity);
    g.phase = "command";
    g.menu = "root";
    const options = getDodgeballRootActions().map((option) => ({
      ...option,
      onclick: `VoltzSports.selectDodgeRoot('${option.id}')`
    }));
    renderDodgeballLayout(
      "🔴 Queimada · Duelo Tático",
      "Escolha como lidar com o próximo turno da partida.",
      g.dialogue,
      `${renderDodgeMenuButtons("Comando", options)}
      <div class="sports-help dodgeball-extra-help">A alma Voltz só aparece no turno de esquiva. No seu turno, a decisão vem antes da ação.</div>`,
      "command"
    );
  }

  function renderDodgeballSubmenu(kind) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    g.menu = kind;

    let title = "";
    let options = [];
    if (kind === "throw") {
      title = "Escolha o estilo de arremesso";
      options = getDodgeballThrowOptions().map((option) => ({
        label: option.label,
        description: option.description,
        onclick: `VoltzSports.selectDodgeThrow('${option.id}')`
      }));
    } else if (kind === "tactic") {
      title = "Escolha uma tática";
      options = getDodgeballTacticOptions().map((option) => ({
        label: option.label,
        description: option.description,
        onclick: `VoltzSports.selectDodgeTactic('${option.id}')`
      }));
    } else if (kind === "item") {
      title = "Escolha um item";
      options = getDodgeballItemOptions(g).map((option) => ({
        label: option.label,
        description: option.description,
        available: option.available,
        onclick: `VoltzSports.useDodgeItem('${option.id}')`
      }));
    } else if (kind === "stance") {
      title = "Escolha uma postura";
      options = getDodgeballStanceOptions().map((option) => ({
        label: option.label,
        description: option.description,
        onclick: `VoltzSports.useDodgeStance('${option.id}')`
      }));
    }

    renderDodgeballLayout(
      "🔴 Queimada · Duelo Tático",
      "Cada escolha altera o fluxo do próximo turno.",
      g.dialogue,
      `${renderDodgeMenuButtons(title, options, "Voltar")}
      <div style="text-align:center;margin-top:12px;"><button class="sports-close-btn" type="button" onclick="VoltzSports.backDodgeMenu()">0 · Voltar</button></div>`,
      "command"
    );
  }

  function selectDodgeRoot(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "command") return;
    if (!["throw","tactic","item","stance"].includes(id)) return;
    sportSfx("menuConfirm");
    renderDodgeballSubmenu(id);
  }

  function backDodgeMenu() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "command") return;
    sportSfx("menuBack");
    renderDodgeballCommand();
  }

  function selectDodgeThrow(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    const option = getDodgeballThrowOptions().find((entry) => entry.id === id);
    if (!option) return;
    sportSfx("menuConfirm");
    g.selectedThrow = option;
    g.phase = "aim";
    g.menu = "aim";
    g.cursor = 16;
    g.dir = 1;
    g.dialogue = `Você segura a bola e prepara um arremesso ${option.label.toLowerCase()}.`;
    renderDodgeballAim();
  }

  function renderDodgeballAim(feedback = "") {
    const g = state.current;
    const option = g.selectedThrow;
    const min = clamp(option.min - g.throwWindowBonus, 5, 90);
    const max = clamp(option.max + g.throwWindowBonus, 10, 95);
    renderDodgeballLayout(
      `🔴 Queimada · ${option.label}`,
      "Segure o tempo do lançamento e solte no momento certo.",
      g.dialogue,
      `<div class="sports-game-card dodgeball-aim-stage">
        <div class="sports-status-row">
          <span class="sports-stat-pill">Estilo ${escapeHtml(option.label)}</span>
          <span class="sports-stat-pill">Bônus de dano +${g.damageBonus}${g.counterAttackReady ? " · CONTRA-ATAQUE" : ""}</span>
          <span class="sports-stat-pill">Janela ${Math.round(max - min)}%</span>
        </div>
        <div class="sports-meter"><div class="sports-meter-perfect" style="left:${min}%;width:${Math.max(6, max - min)}%;"></div><div id="dodgeAttackCursor" class="sports-meter-cursor" style="left:${g.cursor}%"></div></div>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.throwDodgeball()" ${g.locked ? "disabled" : ""}>${g.locked ? "Lançado!" : "Lançar [Espaço]"}</button>
          <button class="sports-close-btn" type="button" onclick="VoltzSports.backDodgeMenu()" ${g.locked ? "disabled" : ""}>Voltar</button>
        </div>
        <div class="sports-feedback">${escapeHtml(feedback || "Acerte a zona colorida para superar a marcação de Capitão Rubro.")}</div>
      </div>`,
      "aim"
    );
  }

  function performDodgeNonAttack(dialogue) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    g.turn += 1;
    g.dialogue = dialogue;
    startDodgeDefense();
  }

  function selectDodgeTactic(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    sportSfx("menuConfirm");
    if (id === "observe") {
      const pattern = g.nextPattern || chooseNextDodgePattern(g);
      performDodgeNonAttack(`Você observou a postura de Capitão Rubro. Próximo padrão: ${pattern.label}.`);
      return;
    }
    if (id === "feint") {
      g.throwWindowBonus = Math.max(g.throwWindowBonus, 8);
      performDodgeNonAttack("Você fintou o corpo e desequilibrou a leitura do rival. Seu próximo arremesso terá janela ampliada.");
      return;
    }
    if (id === "read") {
      g.damageBonus += 8;
      performDodgeNonAttack("Você leu a postura de Capitão Rubro. Seu próximo arremesso ficará mais incisivo.");
    }
  }

  function useDodgeItem(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    sportSfx("menuConfirm");
    if (id === "water") {
      if (g.items.water <= 0) return;
      g.items.water -= 1;
      g.playerHp = Math.min(g.playerMaxHp, g.playerHp + 25);
      performDodgeNonAttack("Você tomou água e recuperou o fôlego antes do próximo turno.");
      return;
    }
    if (id === "band") {
      if (g.items.band <= 0) return;
      g.items.band -= 1;
      g.defenseShield += 1;
      performDodgeNonAttack("A faixa esportiva ficou firme. O próximo impacto será absorvido.");
      return;
    }
    if (id === "whistle") {
      if (g.items.whistle <= 0) return;
      g.items.whistle -= 1;
      g.enemySlowMultiplier = 0.82;
      performDodgeNonAttack("O apito do treinador desacelerou o ritmo do próximo turno inimigo.");
    }
  }

  function useDodgeStance(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    sportSfx("menuConfirm");
    if (id === "defense") {
      g.moveBoost = Math.max(g.moveBoost, 1.15);
      performDodgeNonAttack("Você baixou o centro de gravidade. No próximo turno, sua esquiva ficará mais rápida.");
      return;
    }
    if (id === "focus") {
      g.throwWindowBonus = Math.max(g.throwWindowBonus, 10);
      performDodgeNonAttack("Você respirou fundo e entrou em concentração. O próximo arremesso terá mais precisão.");
      return;
    }
    if (id === "prepare") {
      g.damageBonus += 8;
      performDodgeNonAttack("Você segurou a bola por um instante a mais. O próximo arremesso virá mais pesado.");
    }
  }


  function createDodgeballImpact(x, y, styleId = "straight") {
    if (!panel) return;
    const impact = document.createElement("div");
    impact.className = `dodgeball-impact dodgeball-impact-${styleId}`;
    impact.style.left = `${x}px`;
    impact.style.top = `${y}px`;
    impact.style.backgroundImage = `url("${styleId === "power" ? DODGEBALL_VISUALS.impactPower : DODGEBALL_VISUALS.impactLight}")`;
    panel.appendChild(impact);
    addTimer(() => impact.remove(), styleId === "power" ? 520 : 410);
  }

  function flashDodgeballRival(styleId = "straight") {
    const rivalImage = panel?.querySelector?.(".dodgeball-rival-image");
    if (!rivalImage?.animate) return Promise.resolve();

    const power = styleId === "power";
    const keyframes = power
      ? [
          { filter: "brightness(1) contrast(1)", transform: "translateX(0) scale(1)" },
          { filter: "brightness(.10) contrast(1.45)", transform: "translateX(-5px) scale(1.025)", offset: .16 },
          { filter: "brightness(1) contrast(1.15)", transform: "translateX(5px) scale(1.015)", offset: .30 },
          { filter: "brightness(.08) contrast(1.55)", transform: "translateX(-4px) scale(1.035)", offset: .45 },
          { filter: "brightness(1) contrast(1.1)", transform: "translateX(4px) scale(1.01)", offset: .62 },
          { filter: "brightness(.18) contrast(1.35)", transform: "translateX(-2px) scale(1.02)", offset: .76 },
          { filter: "brightness(1) contrast(1)", transform: "translateX(0) scale(1)" }
        ]
      : [
          { filter: "brightness(1)", transform: "translateX(0)" },
          { filter: "brightness(.28)", transform: "translateX(-2px)", offset: .34 },
          { filter: "brightness(.72)", transform: "translateX(2px)", offset: .62 },
          { filter: "brightness(1)", transform: "translateX(0)" }
        ];

    const animation = rivalImage.animate(keyframes, {
      duration: power ? 320 : 245,
      easing: power ? "linear" : "ease-out"
    });
    return animation.finished.catch(() => {});
  }

  async function playDodgeballThrowEffect(styleId, connected, cursor, min, max, onImpact) {
    if (!panel) {
      if (connected) onImpact?.();
      return;
    }

    const rivalImage = panel.querySelector(".dodgeball-rival-image");
    const panelRect = panel.getBoundingClientRect();
    const rivalRect = rivalImage?.getBoundingClientRect?.();
    if (!rivalRect || rivalRect.width <= 0 || rivalRect.height <= 0) {
      if (connected) onImpact?.();
      return;
    }

    const projectile = document.createElement("div");
    projectile.className = `dodgeball-attack-projectile dodgeball-projectile-${styleId}`;
    projectile.setAttribute("aria-hidden", "true");
    const ballSprite = styleId === "power"
      ? DODGEBALL_VISUALS.ballPower
      : styleId === "curve"
        ? DODGEBALL_VISUALS.ballCurve
        : DODGEBALL_VISUALS.ballStraight;
    projectile.style.backgroundImage = `url("${ballSprite}")`;

    const trail = document.createElement("div");
    trail.className = `dodgeball-attack-trail dodgeball-trail-${styleId}`;
    trail.style.backgroundImage = `url("${DODGEBALL_VISUALS.ballTrail}")`;
    trail.setAttribute("aria-hidden", "true");

    panel.appendChild(trail);
    panel.appendChild(projectile);

    const startX = panelRect.width * .50;
    const startY = panelRect.height - 44;
    const rivalX = rivalRect.left - panelRect.left + rivalRect.width * .50;
    const rivalY = rivalRect.top - panelRect.top + rivalRect.height * .40;

    const missDirection = cursor < min ? -1 : cursor > max ? 1 : (Math.random() < .5 ? -1 : 1);
    const targetX = connected ? rivalX : rivalX + missDirection * Math.max(110, rivalRect.width * 1.05);
    const targetY = connected ? rivalY : rivalY - 18 + Math.random() * 38;
    const dx = targetX - startX;
    const dy = targetY - startY;

    projectile.style.left = `${startX - 22}px`;
    projectile.style.top = `${startY - 22}px`;
    trail.style.left = `${startX - 62}px`;
    trail.style.top = `${startY - 62}px`;

    let duration = 500;
    let frames;
    if (styleId === "curve") {
      duration = 650;
      const side = Math.random() < .5 ? -1 : 1;
      const curve = side * Math.min(170, panelRect.width * .14);
      frames = [
        { transform: "translate(0, 0) scale(1.32) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * .30 + curve}px, ${dy * .30}px) scale(1.08) rotate(${side * 160}deg)`, offset: .32 },
        { transform: `translate(${dx * .67 + curve * .72}px, ${dy * .67}px) scale(.78) rotate(${side * 340}deg)`, offset: .68 },
        { transform: `translate(${dx}px, ${dy}px) scale(.52) rotate(${side * 520}deg)`, opacity: 1 }
      ];
    } else if (styleId === "power") {
      duration = 255;
      frames = [
        { transform: "translate(0, 0) scale(1.48)", opacity: 1, filter: "brightness(1.2)" },
        { transform: `translate(${dx * .46}px, ${dy * .46}px) scale(.98)`, opacity: 1, filter: "brightness(1.28)", offset: .45 },
        { transform: `translate(${dx}px, ${dy}px) scale(.48)`, opacity: 1, filter: "brightness(1.35)" }
      ];
    } else {
      duration = 485;
      frames = [
        { transform: "translate(0, 0) scale(1.34)", opacity: 1 },
        { transform: `translate(${dx * .52}px, ${dy * .52}px) scale(.88)`, opacity: 1, offset: .52 },
        { transform: `translate(${dx}px, ${dy}px) scale(.52)`, opacity: 1 }
      ];
    }

    const easing = styleId === "power" ? "cubic-bezier(.08,.72,.16,1)" : styleId === "curve" ? "cubic-bezier(.32,.02,.22,1)" : "cubic-bezier(.18,.68,.22,1)";
    const animation = projectile.animate(frames, { duration, easing });
    const trailFrames = frames.map((frame, index) => ({
      ...frame,
      opacity: index === frames.length - 1 ? .15 : .72,
      filter: `${frame.filter || ""} blur(${styleId === "power" ? 0 : 0.4}px)`
    }));
    trail.animate(trailFrames, { duration, easing });

    await animation.finished.catch(() => {});
    projectile.remove();
    trail.remove();

    if (!connected) return;

    onImpact?.();
    sportSfx(styleId === "power" ? "impactPower" : "impact");
    if (styleId === "power") duckDodgeballMusic(.16, 180);
    createDodgeballImpact(targetX, targetY, styleId);
    await flashDodgeballRival(styleId);
  }

  async function throwDodgeball() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "aim" || !g.selectedThrow || g.locked) return;
    const option = g.selectedThrow;
    g.locked = true;
    sportSfx(option.id === "power" ? "throwPower" : option.id === "curve" ? "throwCurve" : "throwStraight");
    const min = clamp(option.min - g.throwWindowBonus, 5, 90);
    const max = clamp(option.max + g.throwWindowBonus, 10, 95);
    const hit = g.cursor >= min && g.cursor <= max;
    const graze = option.graze ? (g.cursor >= min - option.graze && g.cursor <= max + option.graze) : false;
    const connected = hit || graze;
    let damage = 0;
    let message = "";

    if (hit) {
      damage = option.baseDamage + g.damageBonus;
      message = `Acerto direto! O arremesso ${option.label.toLowerCase()} atingiu Capitão Rubro e causou ${damage} ponto${damage === 1 ? "" : "s"}.`;
    } else if (graze) {
      damage = Math.max(1, Math.floor((option.baseDamage + g.damageBonus) / 2));
      message = `Quase perfeito, mas suficiente. O arremesso passou raspando e ainda causou ${damage} ponto.`;
    } else {
      message = `Capitão Rubro leu o seu ${option.label.toLowerCase()} e saiu da trajetória.`;
    }

    const feedback = panel?.querySelector?.(".dodgeball-aim-stage .sports-feedback");
    if (feedback) feedback.textContent = connected ? "A bola saiu da sua mão..." : "Capitão Rubro começa a sair da trajetória...";
    const throwButton = panel?.querySelector?.(".dodgeball-aim-stage .sports-primary-btn");
    const backButton = panel?.querySelector?.(".dodgeball-aim-stage .sports-close-btn");
    if (throwButton) { throwButton.disabled = true; throwButton.textContent = "Lançado!"; }
    if (backButton) backButton.disabled = true;

    let rallyTriggeredByHit = false;
    await playDodgeballThrowEffect(option.id, connected, g.cursor, min, max, () => {
      const nextHp = Math.max(0, g.opponentHp - damage);
      if (damage > 0 && !g.rallyUsed && g.opponentHp > 10 && nextHp <= 10) {
        // Phase gate: a primeira vez que Rubro cruza 10 HP, ele segura em 9 e inicia o Rally.
        g.opponentHp = 9;
        rallyTriggeredByHit = true;
      } else {
        g.opponentHp = nextHp;
      }
    });

    if (!state.current || state.current !== g) return;

    g.throwWindowBonus = 0;
    g.damageBonus = 0;
    g.counterAttackReady = false;
    g.rubroExhausted = false;
    g.turn += 1;
    g.dialogue = message;

    // Mantém o estilo vivo só durante a resolução para o painel conseguir
    // mostrar corretamente qual arremesso acabou de acontecer.
    renderDodgeballAim(message);

    addTimer(() => {
      if (!state.current || state.current !== g) return;
      g.selectedThrow = null;
      g.locked = false;
      if (rallyTriggeredByHit) {
        g.dialogue = "O golpe deveria ter encerrado a partida... mas Rubro firma os pés com 9 HP.";
        startRallyRubro();
        return;
      }
      if (g.opponentHp <= 0) {
        finishSport("dodgeball", true, "Você venceu o Capitão Rubro e dominou a Arena da Esquiva.");
        return;
      }
      startDodgeDefense();
    }, option.id === "power" ? 520 : 650);
  }

  function getRubroAttackComment(g, attack) {
    if (attack?.id === "rally") return "Sobreviva ao Rally. Nenhuma bola pode ser agarrada até o último arremesso.";
    const phase = getRubroPhase(g);
    if (phase === 1) return attack.telegraph;
    if (phase === 2) return `${attack.telegraph} Ele já não está jogando no mesmo ritmo do início.`;
    return `${attack.telegraph} Capitão Rubro não está mais segurando nada.`;
  }

  function startDodgeDefense() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    g.phase = "defense";
    g.locked = false;
    clearRubroHazards(g);
    g.fallingBalls = [];
    g.warningTargets = {};
    g.lastWallGapStart = null;
    g.lastCrossfireGap = null;
    g.player = { x: 50, y: 62, invulnerableUntil: 0 };
    const attack = g.nextPattern || chooseNextDodgePattern(g);
    g.activePattern = attack;
    setDodgeballMusicIntensity(getRubroPhase(g) === 3 ? .98 : getRubroPhase(g) === 2 ? .86 : .74);
    g.enemyAttackStart = performance.now();
    g.enemyAttackStep = 0;
    g.enemyAttackDone = false;
    g.patternClearSince = 0;
    g.enemyAttackSequence = buildRubroAttackSequence(g, attack);
    // V4: sem encerramento por cronômetro. O turno termina quando o padrão resolver.
    g.defenseEnd = 0;
    g.lastSpawn = 0;
    g.rubroArenaSide = "center";
    g.catchWindowUntil = 0;
    g.catchBufferedUntil = 0;
    renderDodgeDefense();
  }


  function buildRubroAttackSequence(g, attack) {
    const phase = getRubroPhase(g);
    const quick = state.mode === "championship" ? 0.90 : 1;
    const seq = [];
    const add = (at, kind, data = {}) => seq.push({ at: at * quick, kind, done: false, ...data });

    if (attack.id === "bounce-trio") {
      add(0, "telegraph", { text: "TRÊS REBOTES", side: "center", tone: "ricochet" });
      add(360, "bounceTrio", { catchAfter: phase >= 2 ? 3400 : 3900, damage: phase >= 2 ? 11 : 9 });

    } else if (attack.id === "corner-barrage") {
      const side = Math.random() > .5 ? "left" : "right";
      add(0, "telegraph", { text: "MIRA RUBRA", side, tone: "combo" });
      add(400, "warning", { key: "c1", mode: "nearPlayer", label: "!" });
      add(1050, "targetThrow", { key: "c1", side, style: "straight", damage: 10 });
      add(1650, "warning", { key: "c2", mode: "nearPlayer", label: "!" });
      add(2300, "targetThrow", { key: "c2", side, style: "curve", curveDirection: side === "left" ? 1 : -1, damage: 11 });
      add(2900, "warning", { key: "c3", mode: "nearPlayer", label: "!" });
      add(3550, "targetThrow", { key: "c3", side, style: "straight", damage: 10 });
      add(4200, "warning", { key: "c4", mode: "random", label: "!" });
      add(5050, "retargetWarning", { key: "c4", mode: "player", text: "FINTA!" });
      add(5350, "targetThrow", { key: "c4", side, style: "power", damage: 18, catchable: true });

    } else if (attack.id === "falling-rain") {
      add(0, "telegraph", { text: "OLHE AS SOMBRAS", side: "center", tone: "combo" });
      const count = phase === 3 ? 3 : 2;
      [450, 1050, 1650, 2250, 2850, 3450, 4050, 4650, 5250].forEach((at) => add(at, "fallingVolley", { count, damage: 8 }));

    } else if (attack.id === "wall-passage") {
      add(0, "telegraph", { text: "ENCONTRE A ABERTURA", side: "center", tone: "combo" });
      [500, 1300, 2100, 2900, 3700, 4500].forEach((at, index) => add(at, "wallWave", {
        wave: index,
        damage: phase >= 2 ? 9 : 8,
        catchableEdge: index === 5
      }));

    } else if (attack.id === "siege") {
      add(0, "telegraph", { text: "CERCO RUBRO", side: "center", tone: "ricochet" });
      add(650, "siege", { damage: 10, catchableReturn: true });

    } else if (attack.id === "hunter") {
      add(0, "telegraph", { text: "NÃO PARE", side: "center", tone: "power" });
      add(600, "hunter", { damage: 11, catchAfter: 4900 });
      [1300, 2200, 3100, 4000, 4900, 5800].forEach((at, index) => add(at, "throw", {
        style: index % 2 ? "curve" : "straight",
        side: index % 2 ? "right" : "left",
        curveDirection: index % 2 ? -1 : 1,
        catchable: false,
        damage: 7
      }));

    } else if (attack.id === "bomb") {
      add(0, "telegraph", { text: "BOLA-BOMBA", side: "center", tone: "power" });
      add(650, "bomb", { damage: 7, fragments: phase >= 2 ? 8 : 6 });
      if (phase >= 2) add(3400, "bomb", { damage: 7, fragments: 8 });

    } else if (attack.id === "crossfire") {
      add(0, "telegraph", { text: "LINHA DE FOGO", side: "center", tone: "combo" });
      [450, 1050, 1650, 2250, 2850, 3450, 4050, 4650, 5250, 5850].forEach((at, index) => add(at, "crossfire", {
        wave: index,
        damage: 8
      }));

    } else if (attack.id === "spiral-pressure") {
      add(0, "telegraph", { text: "ESPIRAL RUBRA", side: "center", tone: "ricochet" });
      add(450, "siege", { damage: 8, catchableReturn: false });
      [1500, 2300, 3100, 3900, 4700, 5500].forEach((at, index) => add(at, "throw", {
        style: "curve",
        side: index % 2 ? "right" : "left",
        curveDirection: index % 2 ? -1 : 1,
        catchable: false,
        damage: 8
      }));

    } else if (attack.id === "bomb-crossfire") {
      add(0, "telegraph", { text: "BOMBARDEIO CRUZADO", side: "center", tone: "power" });
      add(450, "bomb", { damage: 7, fragments: 8 });
      [1250, 1950, 2650, 3350, 4050, 4750, 5450, 6150].forEach((at, index) => add(at, "crossfire", {
        wave: index,
        damage: 7
      }));
      add(3900, "bomb", { damage: 7, fragments: 8 });

    } else if (attack.id === "false-corridor") {
      add(0, "telegraph", { text: "CORREDOR FALSO", side: "center", tone: "combo" });
      [500, 1550, 2600, 3650, 4700, 5750].forEach((at, index) => {
        add(at, "wallWave", { wave: index, damage: 8, catchableEdge: index === 5 });
        if (index < 5) add(at + 430, "crossfire", { wave: index, damage: 6 });
      });

    } else if (attack.id === "mix-rain-hunter") {
      add(0, "telegraph", { text: "CAÇADA SOB CHUVA", side: "center", tone: "power" });
      add(500, "hunter", { damage: 10, catchAfter: 6200 });
      [700, 1450, 2200, 2950, 3700, 4450, 5200, 5950, 6700].forEach((at) => add(at, "fallingVolley", { count: 3, damage: 7 }));

    } else if (attack.id === "mix-bounce-walls") {
      add(0, "telegraph", { text: "REBOQUE CONFINADO", side: "center", tone: "ricochet" });
      add(450, "bounceTrio", { catchAfter: 6200, damage: 8 });
      [950, 1950, 2950, 3950, 4950, 5950, 6950].forEach((at, index) => add(at, "wallWave", {
        wave: index,
        damage: 7,
        catchableEdge: false
      }));

    } else if (attack.id === "mix-bomb-corner") {
      const side = Math.random() > .5 ? "left" : "right";
      add(0, "telegraph", { text: "MIRA EXPLOSIVA", side, tone: "power" });
      add(500, "bomb", { damage: 7, fragments: 8 });
      add(1100, "warning", { key: "m1", mode: "nearPlayer", label: "!" });
      add(1800, "targetThrow", { key: "m1", side, style: "straight", damage: 8 });
      add(2700, "warning", { key: "m2", mode: "nearPlayer", label: "!" });
      add(3400, "targetThrow", { key: "m2", side, style: "curve", curveDirection: side === "left" ? 1 : -1, damage: 9 });
      add(4300, "bomb", { damage: 7, fragments: 8 });
      add(5000, "warning", { key: "m3", mode: "random", label: "!" });
      add(5900, "retargetWarning", { key: "m3", mode: "player", text: "AGORA!" });
      add(6200, "targetThrow", { key: "m3", side, style: "power", damage: 16, catchable: true });

    } else if (attack.id === "mix-siege-rain") {
      add(0, "telegraph", { text: "CERCO VERTICAL", side: "center", tone: "combo" });
      add(500, "siege", { damage: 8, catchableReturn: true });
      [900, 1700, 2500, 3300, 4100, 4900, 5700, 6500].forEach((at) => add(at, "fallingVolley", { count: 3, damage: 7 }));
    }

    return seq;
  }


  function buildRallyRubroSequence(g) {
    const seq = [];
    const add = (at, kind, data = {}) => seq.push({ at, kind, done: false, ...data });

    // ~30 segundos. Cada trecho reapresenta um padrão completo antes do próximo.
    add(0, "rallyTitle", { text: "RALLY RUBRO" });

    // 0.5–3.5s · três bolas ricocheteando.
    add(500, "telegraph", { text: "TRÊS REBOTES", side: "center", tone: "ricochet" });
    add(850, "bounceTrio", { catchAfter: null, damage: 6, rally: true });
    add(3500, "clearHazards");

    // 3.7–7.2s · mira + finta.
    add(3700, "telegraph", { text: "MIRA RUBRA", side: "left", tone: "combo" });
    add(3950, "warning", { key: "r1", mode: "nearPlayer", label: "!" });
    add(4450, "targetThrow", { key: "r1", side: "left", style: "straight", damage: 7 });
    add(4950, "warning", { key: "r2", mode: "nearPlayer", label: "!" });
    add(5450, "targetThrow", { key: "r2", side: "left", style: "curve", curveDirection: 1, damage: 7 });
    add(5900, "warning", { key: "r3", mode: "random", label: "!" });
    add(6500, "retargetWarning", { key: "r3", mode: "player", text: "FINTA!" });
    add(6800, "targetThrow", { key: "r3", side: "left", style: "power", damage: 10, catchable: false });
    add(7300, "clearHazards");

    // 7.5–10.8s · chuva dupla.
    add(7500, "telegraph", { text: "CHUVA RUBRA", side: "center", tone: "combo" });
    [7700, 8200, 8700, 9200, 9700, 10200].forEach((at) => add(at, "fallingVolley", { count: 3, damage: 6 }));
    add(10800, "clearHazards");

    // 11–14s · cerco.
    add(11000, "telegraph", { text: "CERCO", side: "center", tone: "ricochet" });
    add(11300, "siege", { damage: 6, catchableReturn: false });
    add(14000, "clearHazards");

    // 14.2–17.5s · caçada.
    add(14200, "telegraph", { text: "CAÇADA", side: "center", tone: "power" });
    add(14500, "hunter", { damage: 7, catchAfter: null });
    add(15300, "throw", { style: "straight", side: "left", catchable: false, damage: 5 });
    add(16100, "throw", { style: "curve", side: "right", curveDirection: -1, catchable: false, damage: 5 });
    add(17500, "clearHazards");

    // 17.7–21s · passagem estreita.
    add(17700, "telegraph", { text: "PASSAGEM", side: "center", tone: "combo" });
    [17900, 18450, 19000, 19550, 20100, 20650].forEach((at, index) => add(at, "wallWave", {
      wave: index, damage: 5, catchableEdge: false
    }));
    add(21000, "clearHazards");

    // 21.2–24s · bola-bomba.
    add(21200, "telegraph", { text: "BOLA-BOMBA", side: "center", tone: "power" });
    add(21500, "bomb", { damage: 5, fragments: 8 });
    add(24000, "clearHazards");

    // 24.2–26.7s · linha de fogo.
    add(24200, "telegraph", { text: "LINHA DE FOGO", side: "center", tone: "combo" });
    [24400, 24800, 25200, 25600, 26000, 26400].forEach((at, index) => add(at, "crossfire", { wave: index, damage: 5 }));
    add(26800, "clearHazards");

    // Clímax: única bola agarrável.
    add(27000, "rallyFinalTelegraph", { text: "ÚLTIMA BOLA" });
    add(28200, "throw", { style: "rallyFinal", side: "center", catchable: true, damage: 18, isRallyFinal: true });

    return seq;
  }

  function startRallyRubro() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.rallyUsed) return;
    g.rallyUsed = true;
    g.rallyActive = true;
    g.rallyCompleted = false;
    g.rallyFinalCaught = false;
    g.perfectReturnReady = false;
    g.phase = "defense";
    g.locked = false;
    clearRubroHazards(g);
    g.fallingBalls = [];
    g.warningTargets = {};
    g.lastWallGapStart = null;
    g.lastCrossfireGap = null;
    g.player = { x: 50, y: 62, invulnerableUntil: 0 };
    g.activePattern = {
      id: "rally",
      label: "RALLY RUBRO",
      duration: 30000,
      catchable: true,
      telegraph: "Capitão Rubro parou de sorrir. Agora ele vai atravessar o arsenal inteiro sem te dar descanso."
    };
    g.enemyAttackStart = performance.now();
    g.enemyAttackDone = false;
    g.patternClearSince = 0;
    g.enemyAttackSequence = buildRallyRubroSequence(g);
    // O Rally também espera a última ameaça desaparecer/agarrar.
    g.defenseEnd = 0;
    g.catchBufferedUntil = 0;
    setDodgeballMusicIntensity(1);
    duckDodgeballMusic(.10, 180);
    sportSfx("whistle");
    g.dialogue = "Capitão Rubro para de sorrir. Ele pega outra bola. E outra. ...Isso não parece bom.";
    renderDodgeDefense();
    addTimer(() => {
      if (state.current === g && g.rallyActive) showDodgeTelegraph("RALLY RUBRO", "power", "center");
    }, 120);
  }

  function renderPerfectReturnCommand() {
    const g = state.current;
    if (!g || !g.perfectReturnReady) return;
    g.phase = "perfect-return";
    g.menu = "perfect-return";
    setDodgeballMusicIntensity(.42);
    renderDodgeballLayout(
      "⚡ DEVOLUÇÃO PERFEITA",
      "Você segurou o último arremesso de Rubro. Não existe mais escolha de estilo.",
      "Você está segurando o último arremesso do Capitão Rubro. Ele já sabe que a bola vai voltar.",
      `<div class="perfect-return-command">
        <div class="perfect-return-emblem">⚡</div>
        <button class="perfect-return-btn" type="button" onclick="VoltzSports.performPerfectReturn()">CONTRA-ATACAR</button>
        <div class="sports-help">[Espaço / Enter] · Esse ataque não pode errar.</div>
      </div>`,
      "command"
    );
  }

  async function performPerfectReturn() {
    const g = state.current;
    if (!g || g.phase !== "perfect-return" || !g.perfectReturnReady || g.locked) return;
    g.locked = true;
    g.phase = "cinematic";
    sportSfx("counterReady");
    duckDodgeballMusic(.04, 420);

    const root = panel;
    const rivalStage = root?.querySelector?.(".dodgeball-rival-stage");
    const rivalImage = rivalStage?.querySelector?.(".dodgeball-rival-image");
    if (!root || !rivalStage || !rivalImage) {
      g.opponentHp = 0;
      finishSport("dodgeball", true, "Devolução Perfeita. Você venceu o Capitão Rubro.");
      return;
    }

    root.classList.add("perfect-return-mode");
    const overlay = document.createElement("div");
    overlay.className = "perfect-return-cinematic";
    overlay.innerHTML = `<div class="perfect-return-caption">VOCÊ JÁ SABIA.</div><div class="perfect-return-ball"></div><div class="perfect-return-impact"></div>`;
    root.appendChild(overlay);

    const rootRect = root.getBoundingClientRect();
    const rivalRect = rivalImage.getBoundingClientRect();
    const startX = rootRect.width * .5;
    const startY = rootRect.height * .87;
    const targetX = rivalRect.left - rootRect.left + rivalRect.width * .5;
    const targetY = rivalRect.top - rootRect.top + rivalRect.height * .42;
    const dodgeX = Math.min(rootRect.width - 70, targetX + Math.min(150, rootRect.width * .16));
    const ball = overlay.querySelector(".perfect-return-ball");
    const impact = overlay.querySelector(".perfect-return-impact");
    const caption = overlay.querySelector(".perfect-return-caption");

    ball.style.left = `${startX}px`;
    ball.style.top = `${startY}px`;
    impact.style.left = `${dodgeX}px`;
    impact.style.top = `${targetY}px`;

    sportSfx("throwPower");
    ball.animate([
      { left:`${startX}px`, top:`${startY}px`, transform:"translate(-50%,-50%) scale(1.8)", offset:0 },
      { left:`${targetX}px`, top:`${targetY + 65}px`, transform:"translate(-50%,-50%) scale(1.05)", offset:.43 },
      { left:`${targetX - 20}px`, top:`${targetY}px`, transform:"translate(-50%,-50%) scale(.95)", offset:.58 },
      { left:`${dodgeX - 55}px`, top:`${targetY - 18}px`, transform:"translate(-50%,-50%) scale(1.0)", offset:.75 },
      { left:`${dodgeX}px`, top:`${targetY}px`, transform:"translate(-50%,-50%) scale(1.18)", offset:1 }
    ], { duration: 2050, easing:"cubic-bezier(.16,.72,.18,1)", fill:"forwards" });

    rivalImage.animate([
      { transform:"translateX(0) rotate(0deg)", offset:0 },
      { transform:"translateX(0) rotate(0deg)", offset:.42 },
      { transform:"translateX(135px) rotate(5deg)", offset:.60 },
      { transform:"translateX(135px) rotate(5deg)", offset:1 }
    ], { duration:2050, easing:"cubic-bezier(.2,.8,.2,1)", fill:"forwards" });

    await new Promise((resolve) => addTimer(resolve, 880));
    if (state.current !== g) return;
    caption.classList.add("visible");
    sportSfx("feint");

    await new Promise((resolve) => addTimer(resolve, 1160));
    if (state.current !== g) return;
    sportSfx("impactPower");
    duckDodgeballMusic(.01, 250);
    root.classList.add("perfect-return-impacting");
    rivalStage.classList.add("perfect-return-rubro-hit");
    impact.classList.add("active");
    g.opponentHp = 0;

    await new Promise((resolve) => addTimer(resolve, 850));
    if (state.current !== g) return;
    g.dialogue = "Você já sabia que ele tentaria desviar.";
    finishSport("dodgeball", true, "DEVOLUÇÃO PERFEITA. Você leu o Capitão Rubro até o último movimento.");
  }


  function renderDodgeDefense() {
    const g = state.current;
    const attack = g.activePattern;
    const catchHelp = attack?.id === "rally"
      ? "RALLY: aguente até o fim. Só a última bola ficará verde e poderá ser agarrada."
      : attack?.catchable
        ? "Bola verde = agarrável. Pressione Espaço quando ela entrar no alcance."
        : "Este padrão não pode ser agarrado. Priorize a esquiva.";

    renderDodgeballLayout(
      "🔴 Queimada · Turno Inimigo",
      "Leia o movimento do Capitão Rubro e sobreviva ao padrão.",
      `${g.dialogue} ${getRubroAttackComment(g, attack)}`,
      `<div class="dodgeball-defense-stage-v3">
        <div class="dodgeball-defense-meta-v3">
          <strong>CAPITÃO RUBRO · ${escapeHtml(attack?.label || "ATAQUE")}</strong>
          <span id="dodgeTimer">Padrão em andamento...</span>
        </div>

        <div id="dodgeArena" class="dodgeball-arena dodgeball-dynamic-arena dodgeball-arena-v3">
          <div id="dodgeTelegraph" class="dodge-attack-telegraph"><span id="dodgeTelegraphLabel"></span></div>
          <div id="dodgePlayer" class="dodge-player" aria-label="Alma Voltz">
            <img class="dodge-soul-frame soul-frame-1" src="${DODGEBALL_VISUALS.soulFrames[0]}" alt="" draggable="false">
            <img class="dodge-soul-frame soul-frame-2" src="${DODGEBALL_VISUALS.soulFrames[1]}" alt="" draggable="false">
            <img class="dodge-soul-frame soul-frame-3" src="${DODGEBALL_VISUALS.soulFrames[2]}" alt="" draggable="false">
          </div>
        </div>

        <div class="dodgeball-defense-help-v3">
          <span>WASD / Setas</span>
          <span>${catchHelp}</span>
          ${g.defenseShield > 0 ? "<span>Escudo pronto</span>" : ""}
          ${g.moveBoost > 1 ? "<span>Velocidade aumentada</span>" : ""}
          ${g.enemySlowMultiplier < 1 ? "<span>Projéteis desacelerados</span>" : ""}
        </div>
      </div>`,
      "defense"
    );

    // A nova caixa nasce no tamanho do diálogo e expande imediatamente para
    // a arena de esquiva, simulando a transformação da mesma interface.
    const morphBox = panel?.querySelector?.(".dodgeball-dialogue-arena.is-defense");
    if (morphBox) {
      morphBox.classList.add("is-morph-enter");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => morphBox.classList.add("is-morph-expanded"));
      });
    }

    updateDodgePlayerDom();
  }

  function setRubroDefenseVisual(side = "center", action = "ready") {
    const stage = panel?.querySelector?.(".dodgeball-rival-stage");
    const image = stage?.querySelector?.(".dodgeball-rival-image");
    if (!stage || !image) return;
    stage.classList.remove("rubro-action-ready","rubro-action-charge","rubro-action-throw","rubro-action-feint","rubro-action-recover");
    stage.classList.add(`rubro-action-${action}`);
    const shift = side === "left" ? -95 : side === "right" ? 95 : 0;
    stage.style.setProperty("--rubro-shift", `${shift}px`);
    const desiredStance = ["charge","throw","feint"].includes(action) ? action : "defense";
    const desiredPose = getCapitaoRubroPose(state.current, desiredStance);
    const desiredPoseName = getCapitaoRubroPoseName(state.current, desiredStance);
    stage.dataset.rubroPose = desiredPoseName;
    image.dataset.pose = desiredPoseName;
    image.dataset.fallbackSrc = CAPITAO_RUBRO_IMAGE;
    image.onerror = () => {
      image.onerror = null;
      image.dataset.pose = "base";
      stage.dataset.rubroPose = "base";
      image.src = CAPITAO_RUBRO_IMAGE;
    };
    if (image.getAttribute("src") !== desiredPose) image.setAttribute("src", desiredPose);
  }

  function showDodgeTelegraph(text, tone = "normal", side = "center") {
    const telegraph = document.getElementById("dodgeTelegraph");
    const label = document.getElementById("dodgeTelegraphLabel");
    if (!telegraph || !label) return;
    telegraph.className = `dodge-attack-telegraph visible tone-${tone} side-${side}`;
    label.textContent = text;
    window.clearTimeout(showDodgeTelegraph.hideTimer);
    showDodgeTelegraph.hideTimer = window.setTimeout(() => telegraph.classList.remove("visible"), tone === "power" ? 620 : 430);
  }


  function createEnemyBall(options) {
    const g = state.current;
    if (!g || !options) return null;

    const {
      x, y, targetX, targetY, speed,
      style = "straight",
      catchable = false,
      curveDirection = 0,
      bounces = 0,
      damage = null,
      isRallyFinal = false,
      bounceAll = false,
      accelerationPerSecond = 0,
      maxSpeed = 999,
      catchableAt = null,
      lifeUntil = null,
      homingStrength = 0,
      siegeStage = null,
      siegeCatchCandidate = false,
      explodeAt = null,
      bombFragments = 0
    } = options;

    // Toda bola inimiga passa pelo mesmo balanceamento. Isso também faz o
    // Apito funcionar de forma consistente em todos os padrões.
    const phase = getRubroPhase(g);
    const phaseSpeedMultiplier = isRallyFinal ? 1 : (RUBRO_PROJECTILE_SPEED_MULTIPLIER[phase] || 1);
    const slowMultiplier = g.enemySlowMultiplier || 1;
    const effectiveSpeed = speed * phaseSpeedMultiplier * slowMultiplier;
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const ball = {
      x, y,
      vx: dx / len * effectiveSpeed,
      vy: dy / len * effectiveSpeed,
      el: null,
      style,
      catchable,
      turnRate: style === "curve" ? curveDirection * 0.82 : 0,
      bouncesRemaining: bounces,
      damage,
      isRallyFinal,
      hasEnteredArena: false,
      bounceAll,
      accelerationPerSecond,
      maxSpeed,
      catchableAt,
      lifeUntil,
      homingStrength,
      siegeStage,
      siegeCatchCandidate,
      explodeAt,
      bombFragments
    };
    g.balls.push(ball);
    return ball;
  }

  function clearRubroHazards(g = state.current) {
    if (!g) return;
    (g.balls || []).forEach((ball) => ball.el?.remove());
    g.balls = [];

    (g.fallingBalls || []).forEach((drop) => {
      drop.ballEl?.remove();
      drop.shadowEl?.remove();
    });
    g.fallingBalls = [];

    Object.values(g.warningTargets || {}).forEach((warning) => warning?.el?.remove());
    g.warningTargets = {};
  }

  function getWarningPoint(g, rect, mode = "nearPlayer") {
    const playerX = rect.width * g.player.x / 100;
    const playerY = rect.height * g.player.y / 100;
    if (mode === "player") return { x: playerX, y: playerY };
    if (mode === "random") {
      return {
        x: 40 + Math.random() * Math.max(40, rect.width - 80),
        y: 45 + Math.random() * Math.max(45, rect.height - 90)
      };
    }
    return {
      x: clamp(playerX + (Math.random() - .5) * 130, 35, rect.width - 35),
      y: clamp(playerY + (Math.random() - .5) * 90, 40, rect.height - 40)
    };
  }

  function createDodgeWarning(key, rect, mode = "nearPlayer", label = "!") {
    const g = state.current;
    const arena = document.getElementById("dodgeArena");
    if (!g || !arena) return null;
    g.warningTargets ||= {};
    g.warningTargets[key]?.el?.remove();

    const point = getWarningPoint(g, rect, mode);
    const el = document.createElement("div");
    el.className = "dodge-warning-box";
    el.textContent = label;
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    arena.appendChild(el);

    g.warningTargets[key] = { ...point, el };
    return g.warningTargets[key];
  }

  function retargetDodgeWarning(key, rect, mode = "player") {
    const g = state.current;
    if (!g?.warningTargets?.[key]) return null;
    const point = getWarningPoint(g, rect, mode);
    const warning = g.warningTargets[key];
    warning.x = point.x;
    warning.y = point.y;
    warning.el?.classList.add("retargeted");
    if (warning.el) {
      warning.el.style.left = `${point.x}px`;
      warning.el.style.top = `${point.y}px`;
    }
    return warning;
  }

  function consumeDodgeWarning(key) {
    const g = state.current;
    const warning = g?.warningTargets?.[key];
    if (!warning) return null;
    warning.el?.classList.add("fired");
    addTimer(() => warning.el?.remove(), 180);
    delete g.warningTargets[key];
    return warning;
  }

  function applyDodgeballDamage(g, rawDamage, style, now) {
    if (!g || g.phase !== "defense" || now < g.player.invulnerableUntil) return false;

    if (g.defenseShield > 0) {
      g.defenseShield -= 1;
      sportSfx("shield");
      g.player.invulnerableUntil = now + 420;
      const timer = document.getElementById("dodgeTimer");
      if (timer) timer.textContent = "Escudo absorveu a bolada!";
      return false;
    }

    const phase = getRubroPhase(g);
    const damageMultiplier = RUBRO_DAMAGE_MULTIPLIER[phase] || 1;
    const incomingDamage = Math.max(1, Math.round((rawDamage || 1) * damageMultiplier));
    g.playerHp = Math.max(0, g.playerHp - incomingDamage);
    // Menos i-frames impede atravessar uma sequência inteira depois de um único erro.
    g.player.invulnerableUntil = now + (g.rallyActive ? 330 : 500);
    playDodgePlayerHitEffect(style);

    const hpReadout = document.querySelector(".dodgeball-defense-hp strong");
    if (hpReadout) hpReadout.textContent = `${Math.round(g.playerHp)} HP`;
    const playerBar = document.querySelector(".dodge-hp-block.player .dodge-hp-track i");
    if (playerBar) playerBar.style.width = `${hpPercent(g.playerHp, g.playerMaxHp)}%`;
    const timer = document.getElementById("dodgeTimer");
    if (timer) timer.textContent = `-${incomingDamage} HP`;

    if (g.playerHp <= 0) {
      finishSport("dodgeball", false, "Capitão Rubro te eliminou da quadra antes do apito final.");
    }
    return true;
  }

  function spawnBounceTrio(event, rect) {
    const g = state.current;
    const now = performance.now();
    const catchIndex = event.catchAfter == null ? -1 : Math.floor(Math.random() * 3);
    const starts = [24, 50, 76];

    starts.forEach((pct, index) => {
      const targetX = index === 0 ? rect.width * .78 : index === 1 ? rect.width * .22 : rect.width * .55;
      const targetY = index === 1 ? rect.height * .82 : rect.height * .70;
      createEnemyBall({
        x: rect.width * pct / 100,
        y: 18,
        targetX,
        targetY,
        speed: 225 + index * 18,
        style: "chaos-bounce",
        catchable: false,
        damage: event.damage || 9,
        bounceAll: true,
        accelerationPerSecond: .24,
        maxSpeed: 650,
        catchableAt: index === catchIndex ? now + event.catchAfter : null,
        lifeUntil: now + Number(event.lifeMs || 5600)
      });
    });
  }

  function spawnFallingVolley(event, rect) {
    const g = state.current;
    const arena = document.getElementById("dodgeArena");
    if (!g || !arena) return;

    g.fallingBalls ||= [];
    const count = Math.max(1, Number(event.count || 1));
    const now = performance.now();

    for (let i = 0; i < count; i += 1) {
      const playerX = rect.width * g.player.x / 100;
      const playerY = rect.height * g.player.y / 100;
      const spread = count > 1 ? 90 : 115;
      const x = clamp(playerX + (Math.random() - .5) * spread, 30, rect.width - 30);
      const y = clamp(playerY + (Math.random() - .5) * spread * .65, 38, rect.height - 38);
      const phase = getRubroPhase(g);
      const baseDuration = phase === 3 ? 500 : phase === 2 ? 560 : 640;
      const duration = (baseDuration + Math.random() * 100) / (g.enemySlowMultiplier || 1);

      const shadowEl = document.createElement("div");
      shadowEl.className = "dodge-falling-shadow";
      shadowEl.style.left = `${x}px`;
      shadowEl.style.top = `${y}px`;

      const ballEl = document.createElement("div");
      ballEl.className = "dodge-falling-ball";
      ballEl.style.left = `${x}px`;
      ballEl.style.top = `${y - 150}px`;

      arena.appendChild(shadowEl);
      arena.appendChild(ballEl);

      g.fallingBalls.push({
        x, y,
        start: now,
        duration,
        damage: event.damage || 8,
        landed: false,
        shadowEl,
        ballEl
      });
    }
  }

  function spawnSiege(event, rect) {
    const g = state.current;
    const now = performance.now();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const catchIndex = event.catchableReturn ? Math.floor(Math.random() * 4) : -1;
    const corners = [
      [18, 18],
      [rect.width - 18, 18],
      [18, rect.height - 18],
      [rect.width - 18, rect.height - 18]
    ];

    corners.forEach(([x, y], index) => {
      createEnemyBall({
        x, y,
        targetX: centerX,
        targetY: centerY,
        speed: 245,
        style: "siege",
        catchable: false,
        damage: event.damage || 10,
        siegeStage: 0,
        siegeCatchCandidate: index === catchIndex,
        lifeUntil: now + 5700
      });
    });
  }

  function spawnHunter(event, rect) {
    const g = state.current;
    const now = performance.now();
    createEnemyBall({
      x: rect.width / 2,
      y: 18,
      targetX: rect.width * g.player.x / 100,
      targetY: rect.height * g.player.y / 100,
      speed: 170,
      style: "hunter",
      catchable: false,
      damage: event.damage || 11,
      accelerationPerSecond: .18,
      maxSpeed: 440,
      homingStrength: 3.4,
      catchableAt: event.catchAfter == null ? null : now + event.catchAfter,
      lifeUntil: now + Number(event.lifeMs || 5900)
    });
  }

  function spawnWallWave(event, rect) {
    const g = state.current;
    const phase = getRubroPhase(g);
    const columns = phase >= 3 ? 11 : 10;
    // Duas colunas formam um corredor de verdade. A dificuldade vem da troca de posição, não de uma fresta impossível.
    const gapSize = 2;
    const maxStart = Math.max(0, columns - gapSize);
    let gapStart;

    if (Number.isFinite(g?.lastWallGapStart)) {
      // A próxima abertura pode mudar bastante, mas nunca teleportar para o lado oposto da arena.
      const minStart = Math.max(0, g.lastWallGapStart - 3);
      const maxReachable = Math.min(maxStart, g.lastWallGapStart + 3);
      gapStart = minStart + Math.floor(Math.random() * (maxReachable - minStart + 1));
    } else {
      gapStart = Math.floor(Math.random() * (maxStart + 1));
    }
    if (g) g.lastWallGapStart = gapStart;

    // O multiplicador global de fase é aplicado em createEnemyBall.
    const speed = 245;
    const leftEdge = gapStart - 1;
    const rightEdge = gapStart + gapSize;
    const catchableIndex = event.catchableEdge
      ? (Math.random() > .5 ? leftEdge : rightEdge)
      : -1;

    for (let index = 0; index < columns; index += 1) {
      if (index >= gapStart && index < gapStart + gapSize) continue;
      const x = ((index + .5) / columns) * rect.width;
      createEnemyBall({
        x,
        y: -20,
        targetX: x,
        targetY: rect.height + 30,
        speed,
        style: "wall",
        catchable: index === catchableIndex,
        damage: event.damage || 8
      });
    }
  }

  function spawnBomb(event, rect) {
    const g = state.current;
    const now = performance.now();
    const playerX = rect.width * g.player.x / 100;
    const playerY = rect.height * g.player.y / 100;
    createEnemyBall({
      x: rect.width * (.25 + Math.random() * .5),
      y: 18,
      targetX: clamp(playerX + (Math.random() - .5) * 120, 80, rect.width - 80),
      targetY: clamp(playerY - 70, 80, rect.height - 80),
      speed: 90,
      style: "bomb",
      catchable: false,
      damage: event.damage || 7,
      explodeAt: now + 1180,
      bombFragments: event.fragments || 6
    });
  }

  function explodeBomb(ball, rect) {
    const g = state.current;
    if (!g || !ball) return;
    sportSfx("impactPower");

    const arena = document.getElementById("dodgeArena");
    if (arena) {
      const flash = document.createElement("div");
      flash.className = "dodge-bomb-impact";
      flash.style.left = `${ball.x}px`;
      flash.style.top = `${ball.y}px`;
      arena.appendChild(flash);
      addTimer(() => flash.remove(), 420);
    }

    const fragments = Math.max(6, ball.bombFragments || 6);
    for (let i = 0; i < fragments; i += 1) {
      const angle = (Math.PI * 2 * i / fragments) + Math.random() * .12;
      const distance = 180;
      createEnemyBall({
        x: ball.x,
        y: ball.y,
        targetX: ball.x + Math.cos(angle) * distance,
        targetY: ball.y + Math.sin(angle) * distance,
        speed: 285,
        style: "bomb-fragment",
        catchable: false,
        damage: ball.damage || 7
      });
    }
  }

  function spawnCrossfireWave(event, rect) {
    const g = state.current;
    const rows = 6;
    let gap;

    if (Number.isFinite(g?.lastCrossfireGap)) {
      // No Rally as ondas chegam a cada ~400 ms: a rota segura só pode mover uma faixa por vez.
      const maxShift = g.rallyActive ? 1 : 2;
      const minGap = Math.max(0, g.lastCrossfireGap - maxShift);
      const maxGap = Math.min(rows - 1, g.lastCrossfireGap + maxShift);
      gap = minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
    } else {
      gap = Math.floor(Math.random() * rows);
    }
    if (g) g.lastCrossfireGap = gap;

    for (let row = 0; row < rows; row += 1) {
      if (row === gap) continue;
      const y = ((row + .5) / rows) * rect.height;
      const fromLeft = (row + Number(event.wave || 0)) % 2 === 0;
      createEnemyBall({
        x: fromLeft ? -20 : rect.width + 20,
        y,
        targetX: fromLeft ? rect.width + 30 : -30,
        targetY: y,
        speed: 330 + Number(event.wave || 0) * 12,
        style: "crossfire",
        catchable: false,
        damage: event.damage || 8
      });
    }
  }

  function updateFallingBalls(now, rect, playerX, playerY) {
    const g = state.current;
    if (!g?.fallingBalls?.length) return;

    g.fallingBalls = g.fallingBalls.filter((drop) => {
      const progress = clamp((now - drop.start) / drop.duration, 0, 1);
      const height = (1 - progress) * 160;
      const scale = .58 + progress * .48;

      if (drop.ballEl) {
        drop.ballEl.style.left = `${drop.x}px`;
        drop.ballEl.style.top = `${drop.y - height}px`;
        drop.ballEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
      }
      if (drop.shadowEl) {
        drop.shadowEl.style.transform = `translate(-50%,-50%) scale(${.35 + progress * .95})`;
        drop.shadowEl.style.opacity = `${.22 + progress * .65}`;
      }

      if (progress < 1 || drop.landed) return true;
      drop.landed = true;
      drop.ballEl?.classList.add("landed");
      drop.shadowEl?.classList.add("landed");
      sportSfx("impact");

      const distance = Math.hypot(drop.x - playerX, drop.y - playerY);
      if (distance < 34) applyDodgeballDamage(g, drop.damage, "falling", now);

      addTimer(() => {
        drop.ballEl?.remove();
        drop.shadowEl?.remove();
      }, 180);
      return false;
    });
  }

  function spawnRubroThrow(event, rect) {
    const g = state.current;
    const sidePct = event.side === "left" ? 24 : event.side === "right" ? 76 : 50;
    const startX = rect.width * sidePct / 100;
    const startY = 10;
    const playerX = rect.width * g.player.x / 100;
    const playerY = rect.height * g.player.y / 100;
    const damage = event.damage ?? (event.style === "power" ? 24 : event.style === "curve" ? 16 : event.style === "ricochet" ? 14 : 15);

    if (event.style === "rallyFinal") {
      createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:390, style:"rally-final", catchable:true, damage, isRallyFinal:true });
      return;
    }
    if (event.style === "power") {
      createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:520, style:"power", catchable:false, damage });
      return;
    }
    if (event.style === "curve") {
      const offset = event.curveDirection > 0 ? -95 : 95;
      createEnemyBall({ x:startX, y:startY, targetX:playerX+offset, targetY:playerY, speed:330, style:"curve", catchable:event.catchable, curveDirection:event.curveDirection || 1, damage });
      return;
    }
    if (event.style === "ricochet") {
      const wallX = event.side === "left" ? 24 : rect.width - 24;
      const wallY = rect.height * .42;
      createEnemyBall({ x:startX, y:startY, targetX:wallX, targetY:wallY, speed:370, style:"ricochet", catchable:false, bounces:event.bounces || 1, damage });
      return;
    }
    createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:360, style:"straight", catchable:event.catchable, damage });
  }


  function processRubroAttackTimeline(now, rect) {
    const g = state.current;
    const elapsed = now - g.enemyAttackStart;

    for (const event of g.enemyAttackSequence) {
      if (event.done || elapsed < event.at) continue;
      event.done = true;

      if (event.kind === "rallyTitle") {
        setRubroDefenseVisual("center", "charge");
        showDodgeTelegraph(event.text, "power", "center");
        sportSfx("enemyPower");

      } else if (event.kind === "rallyFinalTelegraph") {
        setRubroDefenseVisual("center", "charge");
        showDodgeTelegraph("ÚLTIMA BOLA · PREPARE O ESPAÇO", "power", "center");
        sportSfx("counterReady");
        duckDodgeballMusic(.16, 320);

      } else if (event.kind === "telegraph") {
        setRubroDefenseVisual(event.side, event.tone === "feint" ? "feint" : "ready");
        showDodgeTelegraph(event.text, event.tone, event.side);
        if (event.tone === "feint") sportSfx("feint");

      } else if (event.kind === "charge") {
        setRubroDefenseVisual(event.side, "charge");
        sportSfx("enemyPower");
        showDodgeTelegraph("!", "power", event.side);

      } else if (event.kind === "fake") {
        setRubroDefenseVisual(event.side, "feint");
        sportSfx("feint");
        showDodgeTelegraph("FALSO", "feint", event.side);

      } else if (event.kind === "throw") {
        setRubroDefenseVisual(event.side, "throw");
        sportSfx(event.style === "power" ? "enemyPower" : "enemyThrow");
        spawnRubroThrow(event, rect);
        addTimer(() => setRubroDefenseVisual(event.side, "recover"), 180);

      } else if (event.kind === "clearHazards") {
        clearRubroHazards(g);

      } else if (event.kind === "warning") {
        createDodgeWarning(event.key, rect, event.mode, event.label || "!");
        sportSfx("menuMove");

      } else if (event.kind === "retargetWarning") {
        retargetDodgeWarning(event.key, rect, event.mode || "player");
        setRubroDefenseVisual("center", "feint");
        showDodgeTelegraph(event.text || "FINTA!", "feint-real", "center");
        sportSfx("feint");

      } else if (event.kind === "targetThrow") {
        const target = consumeDodgeWarning(event.key) || getWarningPoint(g, rect, "player");
        const sidePct = event.side === "left" ? 10 : event.side === "right" ? 90 : 50;
        const startX = rect.width * sidePct / 100;
        const startY = 12;
        const speed = event.style === "power" ? 540 : event.style === "curve" ? 350 : 380;
        setRubroDefenseVisual(event.side || "center", "throw");
        sportSfx(event.style === "power" ? "enemyPower" : "enemyThrow");
        createEnemyBall({
          x: startX,
          y: startY,
          targetX: target.x,
          targetY: target.y,
          speed,
          style: event.style || "straight",
          catchable: Boolean(event.catchable),
          curveDirection: event.curveDirection || 0,
          damage: event.damage || 10
        });
        addTimer(() => setRubroDefenseVisual(event.side || "center", "recover"), 180);

      } else if (event.kind === "bounceTrio") {
        setRubroDefenseVisual("center", "throw");
        sportSfx("enemyThrow");
        spawnBounceTrio(event, rect);

      } else if (event.kind === "fallingVolley") {
        setRubroDefenseVisual("center", "throw");
        sportSfx("enemyThrow");
        spawnFallingVolley(event, rect);

      } else if (event.kind === "siege") {
        setRubroDefenseVisual("center", "throw");
        sportSfx("ricochet");
        spawnSiege(event, rect);

      } else if (event.kind === "hunter") {
        setRubroDefenseVisual("center", "charge");
        sportSfx("enemyPower");
        spawnHunter(event, rect);

      } else if (event.kind === "wallWave") {
        sportSfx("enemyThrow");
        spawnWallWave(event, rect);

      } else if (event.kind === "bomb") {
        setRubroDefenseVisual("center", "charge");
        sportSfx("enemyPower");
        spawnBomb(event, rect);

      } else if (event.kind === "crossfire") {
        setRubroDefenseVisual(Number(event.wave || 0) % 2 ? "right" : "left", "throw");
        sportSfx("enemyThrow");
        spawnCrossfireWave(event, rect);
      }
    }
  }

  function completeDodgeballCatch(ball, distance) {
    const g = state.current;
    if (!g || g.phase !== "defense" || !ball || !ball.catchable) return false;

    ball.el?.remove();
    g.balls = g.balls.filter((candidate) => candidate !== ball);
    g.catchBufferedUntil = 0;
    g.catchCooldownUntil = performance.now() + 280;
    g.counterAttackReady = true;
    g.throwWindowBonus = Math.max(g.throwWindowBonus, 7);
    g.damageBonus += 8;

    const perfect = ball.isRallyFinal ? true : distance <= DODGE_CATCH_PERFECT_DISTANCE;
    sportSfx(perfect ? "perfectCatch" : "catch");
    duckDodgeballMusic(perfect ? .06 : .18, perfect ? 260 : 150);
    addTimer(() => sportSfx("counterReady"), perfect ? 150 : 110);
    if (ball.isRallyFinal) {
      g.rallyFinalCaught = true;
      g.perfectReturnReady = true;
      g.counterAttackReady = false;
      g.throwWindowBonus = 0;
      g.damageBonus = 0;
      g.dialogue = "PERFECT CATCH. Você está segurando o último arremesso do Rally Rubro.";
    } else {
      g.dialogue = perfect
        ? "AGARROU PERFEITO! Você tomou a posse da bola no instante exato. Contra-ataque carregado."
        : "Você agarrou a bola! O turno de Rubro acabou e seu próximo arremesso recebeu Contra-ataque.";
    }

    const player = document.getElementById("dodgePlayer");
    player?.classList.remove("dodge-catch-ready");
    player?.classList.add("dodge-catch-success");
    const arenaEl = document.getElementById("dodgeArena");
    arenaEl?.classList.add("dodge-catch-flash");
    setRubroDefenseVisual("center", "recover");
    const timer = document.getElementById("dodgeTimer");
    if (timer) timer.textContent = perfect ? "PERFECT CATCH! ⚡" : "AGARROU! · CONTRA-ATAQUE";
    addTimer(() => finishRubroDefenseTurn(true), 520);
    return true;
  }

  function attemptCatchDodgeball() {
    const g = state.current;
    const now = performance.now();
    if (!g || g.phase !== "defense" || now < g.catchCooldownUntil) return false;

    const arena = document.getElementById("dodgeArena");
    if (!arena) return false;
    const rect = arena.getBoundingClientRect();
    const px = rect.width * g.player.x / 100;
    const py = rect.height * g.player.y / 100;

    let nearest = null;
    let nearestDistance = Infinity;
    for (const ball of g.balls) {
      if (!ball.catchable) continue;
      const distance = Math.hypot(ball.x - px, ball.y - py);
      if (distance < nearestDistance) {
        nearest = ball;
        nearestDistance = distance;
      }
    }

    // Input buffer: apertar Espaço pouco antes do alcance não pune o jogador.
    // O comando fica armado por alguns milissegundos e dispara assim que a bola entra na janela.
    if (!nearest) {
      const timer = document.getElementById("dodgeTimer");
      if (g.rallyActive) {
        if (timer) timer.textContent = "Ainda não — só a ÚLTIMA BOLA pode ser agarrada.";
        return false;
      }
      g.catchBufferedUntil = now + DODGE_CATCH_BUFFER_MS;
      const player = document.getElementById("dodgePlayer");
      player?.classList.add("dodge-catch-ready");
      if (timer) timer.textContent = "AGARRÃO PREPARADO… espere a bola chegar!";
      return false;
    }
    if (nearestDistance > DODGE_CATCH_DISTANCE) {
      g.catchBufferedUntil = now + DODGE_CATCH_BUFFER_MS;
      const player = document.getElementById("dodgePlayer");
      player?.classList.add("dodge-catch-ready");
      const timer = document.getElementById("dodgeTimer");
      if (timer) timer.textContent = g.rallyActive ? "ÚLTIMA BOLA chegando…" : "AGARRÃO PREPARADO… espere a bola chegar!";
      return false;
    }

    return completeDodgeballCatch(nearest, nearestDistance);
  }

  function playDodgePlayerHitEffect(style = "straight") {
    sportSfx("playerHit");
    if (style === "power") duckDodgeballMusic(.14, 180);
    const player = document.getElementById("dodgePlayer");
    const arena = document.getElementById("dodgeArena");
    if (!player || !arena) return;
    player.classList.remove("dodge-player-hit","dodge-player-hit-power");
    arena.classList.remove("dodge-arena-hit");
    void player.offsetWidth;
    player.classList.add(style === "power" ? "dodge-player-hit-power" : "dodge-player-hit");
    arena.classList.add("dodge-arena-hit");
    addTimer(() => { player.classList.remove("dodge-player-hit","dodge-player-hit-power"); arena.classList.remove("dodge-arena-hit"); }, style === "power" ? 420 : 260);
  }


  function finishRubroDefenseTurn(caught = false) {
    const g = state.current;
    if (!g || g.phase !== "defense" || g.enemyAttackDone) return;
    g.enemyAttackDone = true;
    clearRubroHazards(g);
    g.moveBoost = 1;
    g.enemySlowMultiplier = 1;

    if (g.rallyActive) {
      g.rallyActive = false;
      g.rallyCompleted = true;
      if (g.perfectReturnReady) {
        addTimer(() => { if (state.current === g) renderPerfectReturnCommand(); }, 360);
        return;
      }
      g.rubroExhausted = true;
      g.throwWindowBonus = Math.max(g.throwWindowBonus, 7);
      chooseNextDodgePattern(g);
      g.dialogue = "Você sobreviveu ao RALLY RUBRO. O Capitão está ofegante — essa é sua abertura.";
      addTimer(() => { if (state.current === g) renderDodgeballCommand(); }, 360);
      return;
    }

    chooseNextDodgePattern(g);
    if (!caught) g.dialogue = "Você sobreviveu ao turno de Capitão Rubro. Sua vez novamente.";
    addTimer(() => {
      if (state.current === g) renderDodgeballCommand();
    }, caught ? 240 : 180);
  }


  function isRubroPatternResolved(g, now) {
    if (!g || g.enemyAttackDone) return false;
    const timelineDone = Array.isArray(g.enemyAttackSequence) && g.enemyAttackSequence.every((event) => event.done);
    const ballsActive = Array.isArray(g.balls) && g.balls.length > 0;
    const fallingActive = Array.isArray(g.fallingBalls) && g.fallingBalls.length > 0;
    const warningsActive = Object.keys(g.warningTargets || {}).length > 0;

    if (!timelineDone || ballsActive || fallingActive || warningsActive) {
      g.patternClearSince = 0;
      return false;
    }

    if (!g.patternClearSince) g.patternClearSince = now;
    return now - g.patternClearSince >= 260;
  }

  function updateDodgeDefense(now, dt) {
    const g = state.current;
    const arena = document.getElementById("dodgeArena");
    if (!arena || g.enemyAttackDone) return;
    const rect = arena.getBoundingClientRect();

    // Mantem X/Y com a mesma velocidade real em pixels; ajuste aqui para balancear.
    const boost = g.moveBoost || 1;
    const speedPxPerSecond = DODGE_PLAYER_BASE_SPEED_PX_PER_SECOND * boost;
    const xStepPct = rect.width > 0 ? (speedPxPerSecond / rect.width) * 100 * dt : 0;
    const yStepPct = rect.height > 0 ? (speedPxPerSecond / rect.height) * 100 * dt : 0;

    let dx = 0, dy = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
    if (dx && dy) { dx *= .70710678; dy *= .70710678; }

    g.player.x = clamp(g.player.x + dx * xStepPct, 4, 96);
    g.player.y = clamp(g.player.y + dy * yStepPct, 8, 92);
    updateDodgePlayerDom();

    processRubroAttackTimeline(now, rect);

    const playerX = rect.width * g.player.x / 100;
    const playerY = rect.height * g.player.y / 100;
    updateFallingBalls(now, rect, playerX, playerY);

    g.balls = g.balls.filter((ball) => {
      if (ball.lifeUntil && now >= ball.lifeUntil) {
        ball.el?.remove();
        return false;
      }

      if (ball.catchableAt && now >= ball.catchableAt && !ball.catchable) {
        ball.catchable = true;
        ball.el?.classList.add("is-catchable", "catch-armed");
        if (ball.el) ball.el.style.backgroundImage = `url("${DODGEBALL_VISUALS.ballCatch}")`;
        sportSfx("counterReady");
      }

      let speed = Math.hypot(ball.vx, ball.vy);

      if (ball.homingStrength) {
        const currentAngle = Math.atan2(ball.vy, ball.vx);
        const desiredAngle = Math.atan2(playerY - ball.y, playerX - ball.x);
        let diff = desiredAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxTurn = ball.homingStrength * dt;
        const nextAngle = currentAngle + clamp(diff, -maxTurn, maxTurn);
        ball.vx = Math.cos(nextAngle) * speed;
        ball.vy = Math.sin(nextAngle) * speed;
      }

      if (ball.accelerationPerSecond) {
        speed = Math.min(ball.maxSpeed || 999, speed * (1 + ball.accelerationPerSecond * dt));
        const angle = Math.atan2(ball.vy, ball.vx);
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
      }

      if (ball.turnRate) {
        speed = Math.hypot(ball.vx, ball.vy);
        const angle = Math.atan2(ball.vy, ball.vx) + ball.turnRate * dt;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x >= 0 && ball.x <= rect.width && ball.y >= 0 && ball.y <= rect.height) ball.hasEnteredArena = true;

      // Três Rebotes: quicam em TODAS as bordas e ficam mais rápidos.
      if (ball.bounceAll && ball.hasEnteredArena) {
        let bounced = false;
        if (ball.x <= 13 && ball.vx < 0) { ball.x = 13; ball.vx *= -1; bounced = true; }
        if (ball.x >= rect.width - 13 && ball.vx > 0) { ball.x = rect.width - 13; ball.vx *= -1; bounced = true; }
        if (ball.y <= 13 && ball.vy < 0) { ball.y = 13; ball.vy *= -1; bounced = true; }
        if (ball.y >= rect.height - 13 && ball.vy > 0) { ball.y = rect.height - 13; ball.vy *= -1; bounced = true; }
        if (bounced) {
          ball.vx *= 1.035;
          ball.vy *= 1.035;
          sportSfx("ricochet");
          ball.el?.classList.add("just-bounced");
        }
      }

      if (ball.style === "ricochet" && ball.hasEnteredArena && ball.bouncesRemaining > 0) {
        if (ball.x <= 13 && ball.vx < 0) {
          ball.x = 13; ball.vx *= -1; ball.bouncesRemaining -= 1; sportSfx("ricochet"); ball.el?.classList.add("just-bounced");
        } else if (ball.x >= rect.width - 13 && ball.vx > 0) {
          ball.x = rect.width - 13; ball.vx *= -1; ball.bouncesRemaining -= 1; sportSfx("ricochet"); ball.el?.classList.add("just-bounced");
        }
      }

      // Cerco: ao chegar ao centro, as quatro bolas voltam para fora.
      if (ball.style === "siege" && ball.siegeStage === 0) {
        const centerDistance = Math.hypot(ball.x - rect.width / 2, ball.y - rect.height / 2);
        if (centerDistance <= 34) {
          ball.siegeStage = 1;
          ball.vx *= -1.20;
          ball.vy *= -1.20;
          sportSfx("ricochet");
          if (ball.siegeCatchCandidate) {
            ball.catchable = true;
            ball.el?.classList.add("is-catchable", "catch-armed");
            if (ball.el) ball.el.style.backgroundImage = `url("${DODGEBALL_VISUALS.ballCatch}")`;
            sportSfx("counterReady");
          }
        }
      }

      // Bola-bomba explode em fragmentos radiais.
      if (ball.style === "bomb" && ball.explodeAt && now >= ball.explodeAt) {
        explodeBomb(ball, rect);
        ball.el?.remove();
        return false;
      }

      if (!ball.el) {
        ball.el = document.createElement("div");
        ball.el.className = `dodge-ball rubro-ball rubro-ball-${ball.style}${ball.catchable ? " is-catchable" : ""}${ball.isRallyFinal ? " is-rally-final" : ""}`;
        const enemySprite = ball.catchable
          ? DODGEBALL_VISUALS.ballCatch
          : ball.style === "bomb"
            ? DODGEBALL_VISUALS.ballBomb
            : ball.style === "power"
              ? DODGEBALL_VISUALS.ballPower
              : ball.style === "curve"
                ? DODGEBALL_VISUALS.ballCurve
                : DODGEBALL_VISUALS.ballStraight;
        ball.el.style.backgroundImage = `url("${enemySprite}")`;
        arena.appendChild(ball.el);
      }

      if (ball.catchable) {
        ball.el.classList.add("is-catchable");
        ball.el.style.backgroundImage = `url("${DODGEBALL_VISUALS.ballCatch}")`;
      }
      ball.el.style.left = `${ball.x - 12}px`;
      ball.el.style.top = `${ball.y - 12}px`;

      const catchDistance = Math.hypot(ball.x - playerX, ball.y - playerY);
      const catchWindowActive = ball.catchable && catchDistance <= DODGE_CATCH_DISTANCE && catchDistance > 22;
      ball.el.classList.toggle("catch-window", catchWindowActive);

      if (ball.catchable && now <= g.catchBufferedUntil && catchDistance <= DODGE_CATCH_DISTANCE) {
        completeDodgeballCatch(ball, catchDistance);
        return false;
      }

      const outside = ball.x < -100 || ball.x > rect.width + 100 || ball.y < -100 || ball.y > rect.height + 100;
      if (outside && !ball.bounceAll) {
        ball.el.remove();
        return false;
      }

      const hitRadius =
        ball.style === "power" ? 29 :
        ball.style === "bomb-fragment" ? 20 :
        ball.style === "hunter" ? 27 :
        ball.style === "siege" ? 25 : 24;

      if (catchDistance < hitRadius && now >= g.player.invulnerableUntil) {
        ball.el.remove();
        const fallbackDamage =
          ball.style === "power" ? 24 :
          ball.style === "curve" ? 16 :
          ball.style === "ricochet" ? 14 :
          ball.style === "bomb-fragment" ? 7 : 10;
        applyDodgeballDamage(g, ball.damage ?? fallbackDamage, ball.style, now);
        return false;
      }

      return true;
    });

    if (state.current !== g || g.playerHp <= 0) return;

    const playerEl = document.getElementById("dodgePlayer");
    if (playerEl) playerEl.classList.toggle("invulnerable", now < g.player.invulnerableUntil);

    const timer = document.getElementById("dodgeTimer");
    const catchableInRange = g.balls.some((ball) => {
      if (!ball.catchable) return false;
      const distance = Math.hypot(ball.x - playerX, ball.y - playerY);
      return distance <= DODGE_CATCH_DISTANCE;
    });

    playerEl?.classList.toggle("dodge-catch-ready", catchableInRange || now <= g.catchBufferedUntil);
    if (timer && !timer.textContent.includes("AGARROU") && !timer.textContent.includes("PERFECT")) {
      timer.textContent = catchableInRange
        ? (g.rallyActive ? "ÚLTIMA BOLA · AGARRA! [ESPAÇO]" : "AGARRA! [ESPAÇO]")
        : `${g.activePattern?.label || "Esquiva"} · padrão em andamento`;
    }

    if (isRubroPatternResolved(g, now)) finishRubroDefenseTurn(false);
  }

  function updateDodgePlayerDom() {
    const g = state.current;
    const el = document.getElementById("dodgePlayer");
    if (!g || !el) return;
    el.style.left = `calc(${g.player.x}% - 15px)`;
    el.style.top = `calc(${g.player.y}% - 15px)`;
  }

  function devTriggerRally() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return { ok:false, message:"Abra a Queimada primeiro." };
    g.opponentHp = 9;
    g.rallyUsed = false;
    g.rallyActive = false;
    g.perfectReturnReady = false;
    startRallyRubro();
    return { ok:true };
  }

  function devTriggerPerfectReturn() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return { ok:false, message:"Abra a Queimada primeiro." };
    g.opponentHp = Math.min(g.opponentHp, 9);
    g.rallyUsed = true;
    g.rallyActive = false;
    g.rallyCompleted = true;
    g.rallyFinalCaught = true;
    g.perfectReturnReady = true;
    g.dialogue = "DEV: última bola agarrada. Devolução Perfeita pronta.";
    renderPerfectReturnCommand();
    return { ok:true };
  }

  function handleDodgeballKeyDown(key, event) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return false;

    if (g.phase === "perfect-return") {
      const activate = key === " " || key === "spacebar" || key === "space" || key === "enter" || event.code === "Space";
      if (activate) {
        event.preventDefault();
        if (!event.repeat) performPerfectReturn();
        return true;
      }
      return false;
    }

    if (g.phase === "cinematic") return true;

    if (g.phase === "defense") {
      const isSpace = key === " " || key === "spacebar" || key === "space" || event.code === "Space";
      if (isSpace) {
        event.preventDefault();
        if (!event.repeat) attemptCatchDodgeball();
        return true;
      }
      return false;
    }

    if (["0","backspace"].includes(key) && g.phase === "command" && g.menu !== "root") {
      event.preventDefault();
      backDodgeMenu();
      return true;
    }

    const mapIndex = { "1": 0, "2": 1, "3": 2, "4": 3 };
    if (g.phase === "command" && mapIndex[key] != null) {
      event.preventDefault();
      const index = mapIndex[key];
      if (g.menu === "root") {
        const root = getDodgeballRootActions()[index];
        if (root) selectDodgeRoot(root.id);
        return true;
      }
      if (g.menu === "throw") {
        const opt = getDodgeballThrowOptions()[index];
        if (opt) selectDodgeThrow(opt.id);
        return true;
      }
      if (g.menu === "tactic") {
        const opt = getDodgeballTacticOptions()[index];
        if (opt) selectDodgeTactic(opt.id);
        return true;
      }
      if (g.menu === "item") {
        const opt = getDodgeballItemOptions(g)[index];
        if (opt && opt.available) useDodgeItem(opt.id);
        return true;
      }
      if (g.menu === "stance") {
        const opt = getDodgeballStanceOptions()[index];
        if (opt) useDodgeStance(opt.id);
        return true;
      }
    }

    if ((key === " " || key === "spacebar" || key === "space" || event.code === "Space") && g.phase === "aim") {
      event.preventDefault();
      throwDodgeball();
      return true;
    }

    return false;
  }

  // -------------------------------------------------------
  // Campeonato

  // -------------------------------------------------------
  function startChampionship() {
    if (!allSportsCompleted()) {
      openChampionshipIntro();
      return;
    }
    clearRuntime();
    state.championship = {
      active: true,
      order: ["athletics", "basketball", "football", "volleyball", "dodgeball"],
      index: 0
    };
    state.mode = "championship";
    continueChampionship();
  }

  function continueChampionship() {
    if (!state.championship?.active) return;
    const id = state.championship.order[state.championship.index];
    state.mode = "championship";
    start(id);
  }

  function renderChampionshipFailure(id, message) {
    const meta = SPORT_META[id];
    openPanelShell(
      "Pentatlo interrompido",
      "Estádio Voltz",
      message || "Uma das etapas não foi concluída.",
      `<div class="sports-result failure">
        <div class="sports-result-icon">🏳️</div>
        <h3>A sequência terminou em ${meta.icon} ${escapeHtml(meta.name)}</h3>
        <p>O campeonato precisa ser completado em uma única tentativa. As cinco modalidades normais continuam salvas.</p>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button class="sports-primary-btn" type="button" onclick="VoltzSports.startChampionship()">Recomeçar pentatlo</button>
          <button class="sports-close-btn" type="button" onclick="VoltzSports.close()">Voltar ao reino</button>
        </div>
      </div>`
    );
  }

  async function finishChampionship() {
    sportSfx("victory");
    stopDodgeballMusic(700);
    clearRuntime();
    const alreadyCompleted = getProgress().guardianChallengeCompleted;
    let result = { alreadyCompleted: true, xpReward: 0, coinReward: 0 };

    if (!alreadyCompleted) {
      result = await global.VoltzProfile?.completeGuardianChallenge?.(
        REALM_ID,
        { id: "campeonato-voltz", enemyRank: "guardian", name: "Pentatlo Voltz" },
        { xp: 260, coins: 100 },
        {
          id: "diploma-educacao-fisica",
          name: "Diploma de Educação Física",
          abilityId: "reflexos-treinados",
          abilityName: "Reflexos Treinados",
          abilityDescription: "Uma vez por batalha, adiciona 6 segundos ao cronômetro da pergunta atual."
        }
      ) || result;
    }

    state.championship = null;
    updateHud();
    openPanelShell(
      "🏆 Pentatlo Voltz concluído",
      "Estádio Voltz",
      alreadyCompleted ? "Você completou novamente o circuito como treino." : "O reino reconheceu sua técnica, ritmo, coordenação e reflexos.",
      `<div class="sports-result success">
        <div class="sports-result-icon">🎓</div>
        <h3>${alreadyCompleted ? "Treino completo" : "Diploma de Educação Física"}</h3>
        <p>${alreadyCompleted
          ? "Seu diploma já estava registrado; nenhuma recompensa adicional foi concedida."
          : `Competência desbloqueada: Reflexos Treinados. +${result.xpReward || 260} XP e +${result.coinReward || 100} moedas.`}</p>
        ${alreadyCompleted ? "" : `<div class="sports-game-card" style="margin-bottom:20px;"><strong>🏅 Reflexos Treinados</strong><p style="color:rgba(245,251,255,.65);">Uma vez por batalha, adicione 6 segundos à pergunta atual.</p></div>`}
        <button class="sports-primary-btn" type="button" onclick="VoltzSports.close()">Receber diploma e voltar ao reino</button>
      </div>`
    );
  }

  async function devCompleteAll() {
    const current = getProgress();
    const next = {
      ...current,
      completedMinigameIds: [...SPORT_IDS],
      lastSportCompletedAt: new Date().toISOString()
    };
    const result = await global.VoltzProfile?.setRealmProgress?.(REALM_ID, next);
    updateHud();
    return result || { ok: true, persisted: false };
  }

  async function devReset() {
    const result = await global.VoltzProfile?.resetGuardianChallenge?.(REALM_ID);
    await global.VoltzProfile?.setRealmProgress?.(REALM_ID, {
      defeatedEnemyIds: [],
      solvedWorldEquationIds: [],
      miniBossDefeated: false,
      bossDefeated: false,
      guardianChallengeCompleted: false,
      completed: false,
      completedMinigameIds: []
    });
    updateHud();
    return result || { ok: true };
  }

  function onSceneChanged(sceneId) {
    state.sceneId = sceneId || "";
    if (state.open && state.sceneId !== REALM_ID) close();
    updateHud();
  }

  function handleKeyDown(event) {
    if (!state.open) return;
    const isSpace = event.code === "Space" || event.key === " " || event.key === "Spacebar";
    const key = isSpace ? "space" : event.key.toLowerCase();
    state.pressed.add(key);

    if (key === "escape") {
      event.preventDefault();
      close();
      return;
    }

    const game = state.current;
    if (!game) return;

    if (game.type === "dodgeball") {
      if (handleDodgeballKeyDown(key, event)) return;
      if (game.phase === "defense") return;
    }

    if (game.type === "football") {
      if (["q","j","k","l","i"].includes(key)) {
        event.preventDefault();
        if (!event.repeat) {
          if (key === "q") footballSwitchPlayer();
          else if (key === "j") footballPrimaryAction();
          else if (key === "k") footballPass();
          else if (key === "l") footballCross();
          else activateFootballVision();
        }
      }
      return;
    }

    if (key === "space") {
      event.preventDefault();
      if (game.type === "basketball") shootBasketball();
      else if (game.type === "athletics") athleticsSpace();
      return;
    }

    if (game.type === "athletics" && ["a","d"].includes(key)) athleticsStep(key);
    if (game.type === "volleyball" && ["a","s","d"].includes(key)) volleyballInput(key);
  }

  function handleKeyUp(event) {
    const key = event.code === "Space" || event.key === " " || event.key === "Spacebar"
      ? "space"
      : event.key.toLowerCase();
    state.pressed.delete(key);
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  global.addEventListener("voltz:profile-ready", updateHud);
  global.addEventListener("voltz:profile-updated", updateHud);

  global.VoltzSports = Object.freeze({
    open,
    close,
    isOpen,
    start,
    chooseFootballZone,
    shootFootball,
    footballPrimaryAction,
    footballTackle,
    footballSwitchPlayer,
    footballPass,
    footballCross,
    activateFootballVision,
    shootBasketball,
    beginAthletics,
    selectDodgeRoot,
    selectDodgeThrow,
    selectDodgeTactic,
    useDodgeItem,
    useDodgeStance,
    backDodgeMenu,
    throwDodgeball,
    performPerfectReturn,
    devTriggerRally,
    devTriggerPerfectReturn,
    startChampionship,
    continueChampionship,
    onSceneChanged,
    updateHud,
    getProgress,
    allSportsCompleted,
    devCompleteAll,
    devReset
  });

  if (global.getActiveSceneId) onSceneChanged(global.getActiveSceneId());
})(window);
