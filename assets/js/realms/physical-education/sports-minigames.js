(function initializeSportsMinigames(global) {
  const REALM_ID = "reino-educacao-fisica";
  const SPORT_IDS = ["football", "basketball", "athletics", "volleyball", "dodgeball"];
  const CAPITAO_RUBRO_IMAGE = "assets/images/rivals/capitao-rubro.png";
  const DODGE_CATCH_DISTANCE = 104;
  const DODGE_CATCH_PERFECT_DISTANCE = 46;
  const DODGE_CATCH_BUFFER_MS = 160;
  const DODGE_PLAYER_BASE_SPEED_PX_PER_SECOND = 640;

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
      football: "Escolha um canto e use a barra de força. O goleiro também escolhe uma direção; força ruim ou leitura errada pode matar a cobrança.",
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
  // Futebol
  // -------------------------------------------------------
  function startFootball() {
    const compact = state.mode === "championship";
    const attemptsMax = compact ? 2 : 5;
    const goalsNeeded = compact ? 1 : 3;
    state.current = {
      type: "football",
      attempts: 0,
      goals: 0,
      attemptsMax,
      goalsNeeded,
      selected: "center",
      cursor: 20,
      dir: 1,
      locked: false,
      lastKeeper: ""
    };

    renderFootball();

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "football") return;
      const dt = Math.min(32, now - last);
      last = now;
      const game = state.current;
      game.cursor += game.dir * dt * 0.085;
      if (game.cursor >= 100) { game.cursor = 100; game.dir = -1; }
      if (game.cursor <= 0) { game.cursor = 0; game.dir = 1; }
      const el = document.getElementById("footballCursor");
      if (el) el.style.left = `${game.cursor}%`;
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function renderFootball(feedback = "") {
    const g = state.current;
    if (!g) return;
    openPanelShell(
      "⚽ Futebol · Cobrança de Pênaltis",
      "Campo das Decisões",
      `Converta ${g.goalsNeeded} cobrança${g.goalsNeeded === 1 ? "" : "s"} em até ${g.attemptsMax} tentativa${g.attemptsMax === 1 ? "" : "s"}.`,
      `<div class="sports-game-card">
        <div class="sports-status-row">
          <span class="sports-stat-pill">Gols ${g.goals}/${g.goalsNeeded}</span>
          <span class="sports-stat-pill">Tentativas ${g.attempts}/${g.attemptsMax}</span>
        </div>
        <div class="football-goal-ui">
          ${["left","center","right"].map((zone) => `
            <button class="football-zone ${g.selected === zone ? "selected" : ""} ${g.lastKeeper === zone ? "goalkeeper" : ""}" type="button" onclick="VoltzSports.chooseFootballZone('${zone}')">
              ${zone === "left" ? "ESQUERDA" : zone === "center" ? "CENTRO" : "DIREITA"}
            </button>`).join("")}
        </div>
        <div class="sports-meter"><div class="sports-meter-perfect"></div><div id="footballCursor" class="sports-meter-cursor" style="left:${g.cursor}%"></div></div>
        <div style="text-align:center;"><button class="sports-primary-btn" type="button" onclick="VoltzSports.shootFootball()" ${g.locked ? "disabled" : ""}>Chutar [Espaço]</button></div>
        <div class="sports-feedback">${escapeHtml(feedback)}</div>
        <div class="sports-help">Escolha um canto. A zona central da barra representa uma força controlada.</div>
      </div>`
    );
  }

  function chooseFootballZone(zone) {
    if (state.current?.type !== "football" || state.current.locked) return;
    if (!["left","center","right"].includes(zone)) return;
    state.current.selected = zone;
    renderFootball();
  }

  function shootFootball() {
    const g = state.current;
    if (!g || g.type !== "football" || g.locked) return;
    g.locked = true;
    g.attempts += 1;
    const keeper = ["left","center","right"][Math.floor(Math.random() * 3)];
    g.lastKeeper = keeper;
    const controlledPower = g.cursor >= 28 && g.cursor <= 82;
    const perfect = g.cursor >= 43 && g.cursor <= 57;
    const goal = controlledPower && (keeper !== g.selected || perfect);

    if (goal) g.goals += 1;
    const feedback = !controlledPower
      ? "A força saiu do controle e a bola passou longe."
      : goal
        ? keeper === g.selected
          ? "GOLAÇO! O goleiro leu o canto, mas a execução perfeita venceu."
          : "Gol! Você deslocou o goleiro."
        : "Defesa do goleiro! Ele leu exatamente o seu canto.";

    renderFootball(feedback);

    addTimer(() => {
      if (!state.current || state.current.type !== "football") return;
      if (g.goals >= g.goalsNeeded) {
        finishSport("football", true, `Você converteu ${g.goals} cobrança${g.goals === 1 ? "" : "s"} com precisão.`);
      } else if (g.attempts >= g.attemptsMax) {
        finishSport("football", false, `Placar final: ${g.goals}/${g.goalsNeeded} gols necessários.`);
      } else {
        g.locked = false;
        g.lastKeeper = "";
        renderFootball("Prepare a próxima cobrança.");
      }
    }, 900);
  }

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
      pool = [catalog.bounceTrio, catalog.cornerBarrage, catalog.fallingRain, catalog.wallPassage];
    } else if (phase === 2) {
      pool = [
        catalog.bounceTrio, catalog.cornerBarrage, catalog.fallingRain, catalog.wallPassage,
        catalog.siege, catalog.hunter, catalog.bomb, catalog.crossfire
      ];
    } else {
      // Abaixo de 30% ele para de apresentar ataques isolados e começa a misturá-los.
      pool = [catalog.mixRainHunter, catalog.mixBounceWalls, catalog.mixBombCorner, catalog.mixSiegeRain];
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
    const opponentMaxHp = 100;
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
      g.moveBoost = Math.max(g.moveBoost, 1.18);
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
    g.player = { x: 50, y: 62, invulnerableUntil: 0 };
    const attack = g.nextPattern || chooseNextDodgePattern(g);
    g.activePattern = attack;
    setDodgeballMusicIntensity(getRubroPhase(g) === 3 ? .98 : getRubroPhase(g) === 2 ? .86 : .74);
    g.enemyAttackStart = performance.now();
    g.enemyAttackStep = 0;
    g.enemyAttackDone = false;
    g.enemyAttackSequence = buildRubroAttackSequence(g, attack);
    g.defenseEnd = g.enemyAttackStart + attack.duration;
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
      add(520, "bounceTrio", { catchAfter: phase >= 2 ? 4300 : 4700, damage: phase >= 2 ? 11 : 9 });

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
      const count = g.opponentHp <= 60 ? 2 : 1;
      [650, 1350, 2050, 2750, 3450, 4150, 4850, 5550].forEach((at) => add(at, "fallingVolley", { count, damage: 8 }));

    } else if (attack.id === "wall-passage") {
      add(0, "telegraph", { text: "ENCONTRE A ABERTURA", side: "center", tone: "combo" });
      [650, 1650, 2650, 3650, 4650].forEach((at, index) => add(at, "wallWave", {
        wave: index,
        damage: phase >= 2 ? 9 : 8,
        catchableEdge: index === 4
      }));

    } else if (attack.id === "siege") {
      add(0, "telegraph", { text: "CERCO RUBRO", side: "center", tone: "ricochet" });
      add(650, "siege", { damage: 10, catchableReturn: true });

    } else if (attack.id === "hunter") {
      add(0, "telegraph", { text: "NÃO PARE", side: "center", tone: "power" });
      add(600, "hunter", { damage: 11, catchAfter: 4900 });
      [1800, 2900, 4000, 5100].forEach((at, index) => add(at, "throw", {
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
      [650, 1450, 2250, 3050, 3850, 4650, 5450].forEach((at, index) => add(at, "crossfire", {
        wave: index,
        damage: 8
      }));

    } else if (attack.id === "mix-rain-hunter") {
      add(0, "telegraph", { text: "CAÇADA SOB CHUVA", side: "center", tone: "power" });
      add(500, "hunter", { damage: 10, catchAfter: 6200 });
      [900, 1800, 2700, 3600, 4500, 5400, 6300].forEach((at) => add(at, "fallingVolley", { count: 2, damage: 7 }));

    } else if (attack.id === "mix-bounce-walls") {
      add(0, "telegraph", { text: "REBOQUE CONFINADO", side: "center", tone: "ricochet" });
      add(450, "bounceTrio", { catchAfter: 6200, damage: 8 });
      [1300, 2600, 3900, 5200, 6500].forEach((at, index) => add(at, "wallWave", {
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
      [1200, 2200, 3200, 4200, 5200, 6200].forEach((at) => add(at, "fallingVolley", { count: 2, damage: 7 }));
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
    [7800, 8500, 9200, 9900].forEach((at) => add(at, "fallingVolley", { count: 2, damage: 6 }));
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
    [18000, 18700, 19400, 20100].forEach((at, index) => add(at, "wallWave", {
      wave: index, damage: 5, catchableEdge: false
    }));
    add(21000, "clearHazards");

    // 21.2–24s · bola-bomba.
    add(21200, "telegraph", { text: "BOLA-BOMBA", side: "center", tone: "power" });
    add(21500, "bomb", { damage: 5, fragments: 8 });
    add(24000, "clearHazards");

    // 24.2–26.7s · linha de fogo.
    add(24200, "telegraph", { text: "LINHA DE FOGO", side: "center", tone: "combo" });
    [24500, 25100, 25700, 26300].forEach((at, index) => add(at, "crossfire", { wave: index, damage: 5 }));
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
    g.enemyAttackSequence = buildRallyRubroSequence(g);
    g.defenseEnd = g.enemyAttackStart + 30000;
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
          <span id="dodgeTimer">Leia o movimento...</span>
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

    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const ball = {
      x, y,
      vx: dx / len * speed,
      vy: dy / len * speed,
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

    const incomingDamage = Math.max(1, Math.round(rawDamage || 1));
    g.playerHp = Math.max(0, g.playerHp - incomingDamage);
    g.player.invulnerableUntil = now + (g.rallyActive ? 390 : 620);
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
        speed: 205 + index * 16,
        style: "chaos-bounce",
        catchable: false,
        damage: event.damage || 9,
        bounceAll: true,
        accelerationPerSecond: .16,
        maxSpeed: 560,
        catchableAt: index === catchIndex ? now + event.catchAfter : null,
        lifeUntil: g.defenseEnd - 180
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
      const duration = 780 + Math.random() * 140;

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
        speed: 190,
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
      speed: 120,
      style: "hunter",
      catchable: false,
      damage: event.damage || 11,
      accelerationPerSecond: .12,
      maxSpeed: 330,
      homingStrength: 2.7,
      catchableAt: event.catchAfter == null ? null : now + event.catchAfter,
      lifeUntil: g.defenseEnd - 200
    });
  }

  function spawnWallWave(event, rect) {
    const phase = getRubroPhase(state.current);
    const columns = phase >= 3 ? 11 : 10;
    const gapSize = 2;
    const gapStart = Math.floor(Math.random() * Math.max(1, columns - gapSize));
    const speed = phase >= 3 ? 265 : phase === 2 ? 245 : 225;
    const catchableIndex = event.catchableEdge ? (Math.random() > .5 ? gapStart - 1 : gapStart + gapSize) : -1;

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
      explodeAt: now + 1550,
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
        speed: 245,
        style: "bomb-fragment",
        catchable: false,
        damage: ball.damage || 7
      });
    }
  }

  function spawnCrossfireWave(event, rect) {
    const rows = 5;
    const gap = Math.floor(Math.random() * rows);
    for (let row = 0; row < rows; row += 1) {
      if (row === gap) continue;
      const y = ((row + .5) / rows) * rect.height;
      const fromLeft = (row + Number(event.wave || 0)) % 2 === 0;
      createEnemyBall({
        x: fromLeft ? -20 : rect.width + 20,
        y,
        targetX: fromLeft ? rect.width + 30 : -30,
        targetY: y,
        speed: 290 + Number(event.wave || 0) * 8,
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
    const slow = g.enemySlowMultiplier || 1;
    const phase = getRubroPhase(g);
    const phaseSpeed = phase === 3 ? 1.1 : phase === 2 ? 1.04 : 1;
    const damage = event.damage ?? (event.style === "power" ? 24 : event.style === "curve" ? 16 : event.style === "ricochet" ? 14 : 15);

    if (event.style === "rallyFinal") {
      createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:300*slow, style:"rally-final", catchable:true, damage, isRallyFinal:true });
      return;
    }
    if (event.style === "power") {
      createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:470*slow*phaseSpeed, style:"power", catchable:false, damage });
      return;
    }
    if (event.style === "curve") {
      const offset = event.curveDirection > 0 ? -95 : 95;
      createEnemyBall({ x:startX, y:startY, targetX:playerX+offset, targetY:playerY, speed:295*slow*phaseSpeed, style:"curve", catchable:event.catchable, curveDirection:event.curveDirection || 1, damage });
      return;
    }
    if (event.style === "ricochet") {
      const wallX = event.side === "left" ? 24 : rect.width - 24;
      const wallY = rect.height * .42;
      createEnemyBall({ x:startX, y:startY, targetX:wallX, targetY:wallY, speed:330*slow*phaseSpeed, style:"ricochet", catchable:false, bounces:event.bounces || 1, damage });
      return;
    }
    createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:325*slow*phaseSpeed, style:"straight", catchable:event.catchable, damage });
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
        const slow = g.enemySlowMultiplier || 1;
        const speed = event.style === "power" ? 480 : event.style === "curve" ? 310 : 340;
        setRubroDefenseVisual(event.side || "center", "throw");
        sportSfx(event.style === "power" ? "enemyPower" : "enemyThrow");
        createEnemyBall({
          x: startX,
          y: startY,
          targetX: target.x,
          targetY: target.y,
          speed: speed * slow,
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

    const remaining = Math.max(0, (g.defenseEnd - now) / 1000);
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
        : `${remaining.toFixed(1)}s · ${g.activePattern?.label || "Esquiva"}`;
    }

    if (remaining <= 0 && !g.enemyAttackDone) finishRubroDefenseTurn(false);
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

    if (key === "space") {
      event.preventDefault();
      if (game.type === "football") shootFootball();
      else if (game.type === "basketball") shootBasketball();
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
