(function initializeSportsMinigames(global) {
  const REALM_ID = "reino-educacao-fisica";
  const SPORT_IDS = ["football", "basketball", "athletics", "volleyball", "dodgeball"];
  const CAPITAO_RUBRO_IMAGE = "assets/images/rivals/capitao-rubro.png";

  // Slots preparados para futuras poses. Enquanto enabled=false, o jogo usa
  // automaticamente a arte atual e não tenta carregar arquivos inexistentes.
  const CAPITAO_RUBRO_POSE_SLOTS = Object.freeze({
    attack: { path: "assets/images/rivals/capitao-rubro-ataque.png", enabled: false },
    phase2: { path: "assets/images/rivals/capitao-rubro-fase2.png", enabled: false }
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
    clearRuntime();
    state.open = false;
    state.activeId = "";
    state.mode = "normal";
    state.championship = null;
    panel?.classList.remove("visible", "dodgeball-fit");
    panel?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sports-minigame-active");
    updateHud();
    if (interactionText) interactionText.textContent = state.sceneId === REALM_ID
      ? "Explore o Complexo Esportivo Voltz e escolha uma modalidade."
      : "Explore o mundo.";
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
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
  }

  function getCapitaoRubroPose(g, stance = "idle") {
    const phase = getRubroPhase(g);
    if (phase >= 2 && CAPITAO_RUBRO_POSE_SLOTS.phase2.enabled) return CAPITAO_RUBRO_POSE_SLOTS.phase2.path;
    if (["defense", "throw", "charge", "feint"].includes(stance) && CAPITAO_RUBRO_POSE_SLOTS.attack.enabled) return CAPITAO_RUBRO_POSE_SLOTS.attack.path;
    return CAPITAO_RUBRO_IMAGE;
  }

  function renderDodgeballRival(g, phase = "command") {
    const opponentLost = Math.max(0, g.opponentMaxHp - g.opponentHp);
    const playerLost = Math.max(0, g.playerMaxHp - g.playerHp);
    const rubroPhase = getRubroPhase(g);
    const stance = phase === "defense" ? "rival-throwing" : phase === "aim" ? "rival-ready" : "rival-waiting";
    const pose = getCapitaoRubroPose(g, phase);
    return `
      <section class="dodgeball-rival-stage ${stance} rubro-phase-${rubroPhase}" aria-label="Capitão Rubro" data-rubro-phase="${rubroPhase}">
        <div class="dodgeball-rival-aura"></div>
        <img class="dodgeball-rival-image" src="${pose}" alt="Capitão Rubro segurando uma bola de queimada" draggable="false" />
        <div class="dodgeball-rival-card">
          <div>
            <span class="dodgeball-rival-kicker">RIVAL DA ARENA · FASE ${rubroPhase}</span>
            <strong>CAPITÃO RUBRO</strong>
          </div>
          <div class="dodgeball-scoreboard">
            <span title="Pontos restantes do Capitão Rubro">Rubro ${"●".repeat(g.opponentHp)}${"○".repeat(opponentLost)}</span>
            <span title="Seus pontos restantes">Você ${"●".repeat(g.playerHp)}${"○".repeat(playerLost)}</span>
          </div>
        </div>
      </section>`;
  }

  function getDodgeballRootActions() {
    return [
      { id: "throw", label: "ARREMESSAR", icon: "⚡", description: "Ataque direto com escolha de estilo." },
      { id: "tactic", label: "TÁTICA", icon: "◈", description: "Ler o rival, fintar ou observar o próximo padrão." },
      { id: "item", label: "ITEM", icon: "✦", description: "Recuperar fôlego ou reforçar a defesa." },
      { id: "stance", label: "POSTURA", icon: "⬢", description: "Preparar bônus para o próximo turno." }
    ];
  }

  function getDodgeballThrowOptions() {
    return [
      { id: "straight", label: "Reto", description: "Janela equilibrada e dano estável.", baseDamage: 1, min: 34, max: 66 },
      { id: "curve", label: "Curva", description: "Mais difícil, mas engana melhor o rival.", baseDamage: 1, min: 42, max: 58, graze: 8 },
      { id: "power", label: "Forte", description: "Janela menor, porém mais impacto.", baseDamage: 2, min: 47, max: 53 }
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
      { id: "water", label: `Água (${g.items.water})`, available: g.items.water > 0, description: "Recupera 1 ponto, até o máximo." },
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
    const baseDuration = state.mode === "championship" ? 3300 : 4200;
    const catalog = {
      straight: { id: "straight", label: "Arremesso Reto", duration: baseDuration, catchable: true, telegraph: "Rubro alinha o ombro. A bola vem reta." },
      curve: { id: "curve", label: "Arremesso Curvo", duration: baseDuration + 350, catchable: true, telegraph: "Rubro gira o punho. A trajetória vai dobrar." },
      power: { id: "power", label: "Arremesso Forte", duration: baseDuration - 450, catchable: false, telegraph: "Rubro planta o pé no chão e carrega força." },
      feint: { id: "feint", label: "Finta", duration: baseDuration + 500, catchable: true, telegraph: "Rubro ergue a bola... mas o corpo dele ainda não decidiu o lado." },
      ricochet: { id: "ricochet", label: "Ricochete", duration: baseDuration + 800, catchable: false, telegraph: "Rubro olha para a parede da arena, não para você." },
      combo: { id: "combo", label: "Sequência Rubra", duration: baseDuration + 1150, catchable: false, telegraph: "Rubro troca a bola de mão e acelera o ritmo." }
    };

    let pool = phase === 1
      ? [catalog.straight, catalog.straight, catalog.curve]
      : phase === 2
        ? [catalog.straight, catalog.curve, catalog.feint, catalog.ricochet]
        : [catalog.curve, catalog.power, catalog.feint, catalog.ricochet, catalog.combo, catalog.combo];

    const filtered = pool.filter((attack) => attack.id !== g.lastPatternId);
    const chosen = (filtered.length ? filtered : pool)[Math.floor(Math.random() * (filtered.length ? filtered.length : pool.length))];
    g.nextPattern = { ...chosen };
    g.lastPatternId = chosen.id;
    return g.nextPattern;
  }

  function startDodgeball() {
    const playerMaxHp = state.mode === "championship" ? 2 : 3;
    const opponentMaxHp = state.mode === "championship" ? 2 : 3;
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
      catchWindowUntil: 0,
      catchCooldownUntil: 0,
      counterAttackReady: false,
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
    openPanelShell(
      title,
      "Arena da Esquiva",
      subtitle,
      `${renderDodgeballRival(g, phase)}
      <section class="dodgeball-battle-card">
        <div class="dodgeball-status-strip">
          <span>Turno ${g.turn}</span>
          <span>Você ${"♥".repeat(g.playerHp)}${"♡".repeat(Math.max(0, g.playerMaxHp - g.playerHp))}</span>
          <span>Rubro ${"●".repeat(g.opponentHp)}${"○".repeat(Math.max(0, g.opponentMaxHp - g.opponentHp))}</span>
        </div>
        <div class="dodgeball-dialogue-box"><p>${escapeHtml(dialogue)}</p></div>
        ${body}
      </section>`
    );
  }

  function renderDodgeMenuButtons(menuTitle, options, backLabel = "Voltar") {
    return `
      <div class="dodgeball-command-area">
        <div class="dodgeball-command-title">${escapeHtml(menuTitle)}</div>
        <div class="dodgeball-command-grid ${options.length > 3 ? "is-four" : ""}">
          ${options.map((option, index) => `
            <button class="dodgeball-command-btn ${option.available === false ? "is-disabled" : ""}" type="button" onclick="${option.onclick}" ${option.available === false ? "disabled" : ""}>
              <span class="dodgeball-command-index">${index + 1}</span>
              <strong>${escapeHtml(option.label)}</strong>
              <small>${escapeHtml(option.description)}</small>
            </button>
          `).join("")}
        </div>
        <div class="dodgeball-command-footer">Pressione 1–4 para escolher · Esc para sair · 0 para ${escapeHtml(backLabel.toLowerCase())}</div>
      </div>`;
  }

  function renderDodgeballCommand() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
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
    renderDodgeballSubmenu(id);
  }

  function backDodgeMenu() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "command") return;
    renderDodgeballCommand();
  }

  function selectDodgeThrow(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    const option = getDodgeballThrowOptions().find((entry) => entry.id === id);
    if (!option) return;
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
      g.damageBonus += 1;
      performDodgeNonAttack("Você leu a postura de Capitão Rubro. Seu próximo arremesso ficará mais incisivo.");
    }
  }

  function useDodgeItem(id) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    if (id === "water") {
      if (g.items.water <= 0) return;
      g.items.water -= 1;
      g.playerHp = Math.min(g.playerMaxHp, g.playerHp + 1);
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
      g.damageBonus += 1;
      performDodgeNonAttack("Você segurou a bola por um instante a mais. O próximo arremesso virá mais pesado.");
    }
  }


  function createDodgeballImpact(x, y, styleId = "straight") {
    if (!panel) return;
    const impact = document.createElement("div");
    impact.className = `dodgeball-impact dodgeball-impact-${styleId}`;
    impact.style.left = `${x}px`;
    impact.style.top = `${y}px`;

    const particleCount = styleId === "power" ? 12 : 8;
    impact.innerHTML = `
      <span class="dodgeball-impact-ring"></span>
      <span class="dodgeball-impact-core"></span>
      ${Array.from({ length: particleCount }, (_, index) => `<span class="dodgeball-impact-particle" style="--impact-angle:${(360 / particleCount) * index}deg"></span>`).join("")}
    `;
    panel.appendChild(impact);
    addTimer(() => impact.remove(), styleId === "power" ? 520 : 430);
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

    const animation = projectile.animate(frames, {
      duration,
      easing: styleId === "power" ? "cubic-bezier(.08,.72,.16,1)" : styleId === "curve" ? "cubic-bezier(.32,.02,.22,1)" : "cubic-bezier(.18,.68,.22,1)"
    });

    await animation.finished.catch(() => {});
    projectile.remove();

    if (!connected) return;

    onImpact?.();
    createDodgeballImpact(targetX, targetY, styleId);
    await flashDodgeballRival(styleId);
  }

  async function throwDodgeball() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "aim" || !g.selectedThrow || g.locked) return;
    const option = g.selectedThrow;
    g.locked = true;
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

    await playDodgeballThrowEffect(option.id, connected, g.cursor, min, max, () => {
      g.opponentHp = Math.max(0, g.opponentHp - damage);
    });

    if (!state.current || state.current !== g) return;

    g.throwWindowBonus = 0;
    g.damageBonus = 0;
    g.counterAttackReady = false;
    g.turn += 1;
    g.dialogue = message;

    // Mantém o estilo vivo só durante a resolução para o painel conseguir
    // mostrar corretamente qual arremesso acabou de acontecer.
    renderDodgeballAim(message);

    addTimer(() => {
      if (!state.current || state.current !== g) return;
      g.selectedThrow = null;
      g.locked = false;
      if (g.opponentHp <= 0) {
        finishSport("dodgeball", true, "Você venceu o Capitão Rubro e dominou a Arena da Esquiva.");
        return;
      }
      startDodgeDefense();
    }, option.id === "power" ? 520 : 650);
  }

  function getRubroAttackComment(g, attack) {
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
    g.balls = [];
    g.player = { x: 50, y: 62, invulnerableUntil: 0 };
    const attack = g.nextPattern || chooseNextDodgePattern(g);
    g.activePattern = attack;
    g.enemyAttackStart = performance.now();
    g.enemyAttackStep = 0;
    g.enemyAttackDone = false;
    g.enemyAttackSequence = buildRubroAttackSequence(g, attack);
    g.defenseEnd = g.enemyAttackStart + attack.duration;
    g.lastSpawn = 0;
    g.rubroArenaSide = "center";
    g.catchWindowUntil = 0;
    renderDodgeDefense();
  }

  function buildRubroAttackSequence(g, attack) {
    const phase = getRubroPhase(g);
    const quick = state.mode === "championship" ? 0.88 : 1;
    const seq = [];
    const add = (at, kind, data = {}) => seq.push({ at: at * quick, kind, done: false, ...data });

    if (attack.id === "straight") {
      add(0, "telegraph", { text: "RETO", side: "center", tone: "normal" });
      add(650, "throw", { style: "straight", side: "center", catchable: true });
    } else if (attack.id === "curve") {
      const side = Math.random() > 0.5 ? "left" : "right";
      add(0, "telegraph", { text: `CURVA ${side === "left" ? "↙" : "↘"}`, side, tone: "curve" });
      add(720, "throw", { style: "curve", side, curveDirection: side === "left" ? 1 : -1, catchable: true });
    } else if (attack.id === "power") {
      const side = ["left","center","right"][Math.floor(Math.random()*3)];
      add(0, "telegraph", { text: "FORTE!", side, tone: "power" });
      add(480, "charge", { side });
      add(920, "throw", { style: "power", side, catchable: false });
    } else if (attack.id === "feint") {
      const fakeSide = Math.random() > 0.5 ? "left" : "right";
      const realSide = fakeSide === "left" ? "right" : "left";
      add(0, "telegraph", { text: "...", side: fakeSide, tone: "feint" });
      add(520, "fake", { side: fakeSide });
      add(930, "telegraph", { text: "FINTA!", side: realSide, tone: "feint-real" });
      add(1280, "throw", { style: phase >= 3 ? "curve" : "straight", side: realSide, curveDirection: realSide === "left" ? 1 : -1, catchable: true });
    } else if (attack.id === "ricochet") {
      const side = Math.random() > 0.5 ? "left" : "right";
      add(0, "telegraph", { text: "RICOCHE!", side, tone: "ricochet" });
      add(780, "throw", { style: "ricochet", side, catchable: false, bounces: phase >= 3 ? 2 : 1 });
    } else if (attack.id === "combo") {
      const first = Math.random() > 0.5 ? "left" : "right";
      add(0, "telegraph", { text: "SEQUÊNCIA RUBRA", side: first, tone: "combo" });
      add(500, "throw", { style: "straight", side: first, catchable: false });
      add(950, "telegraph", { text: "2", side: first === "left" ? "right" : "left", tone: "combo" });
      add(1160, "throw", { style: "curve", side: first === "left" ? "right" : "left", curveDirection: first === "left" ? -1 : 1, catchable: false });
      add(1640, "charge", { side: "center" });
      add(1980, "throw", { style: "power", side: "center", catchable: false });
    }
    return seq;
  }

  function renderDodgeDefense() {
    const g = state.current;
    const attack = g.activePattern;
    const catchHelp = attack?.catchable
      ? "Algumas bolas brilham quando podem ser agarradas: pressione Espaço no timing certo para contra-atacar."
      : "Este ataque não pode ser agarrado: a resposta é esquivar.";
    renderDodgeballLayout(
      "🔴 Queimada · Turno Inimigo",
      "Leia o corpo de Capitão Rubro. Agora cada lançamento é coreografado.",
      `${g.dialogue} ${getRubroAttackComment(g, attack)}`,
      `<div class="sports-game-card dodgeball-defense-stage">
        <div class="dodgeball-turn-label">CAPITÃO RUBRO · ${escapeHtml(attack?.label || "ATAQUE")}</div>
        <div class="dodgeball-hearts">${"♥ ".repeat(g.playerHp)}${"♡ ".repeat(Math.max(0, g.playerMaxHp - g.playerHp))}</div>
        <div id="dodgeArena" class="dodgeball-arena dodgeball-dynamic-arena">
          <div id="dodgeTelegraph" class="dodge-attack-telegraph"><span id="dodgeTelegraphLabel"></span></div>
          <div id="dodgePlayer" class="dodge-player">⚡</div>
        </div>
        <div id="dodgeTimer" class="sports-feedback">Leia o movimento...</div>
        <div class="sports-help">WASD / Setas · ${catchHelp} ${g.defenseShield > 0 ? "Você tem um escudo pronto. " : ""}${g.moveBoost > 1 ? "Sua postura defensiva aumenta a velocidade. " : ""}${g.enemySlowMultiplier < 1 ? "O apito desacelerou as bolas. " : ""}</div>
      </div>`,
      "defense"
    );
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
    const desiredPose = getCapitaoRubroPose(state.current, ["charge","throw","feint"].includes(action) ? "throw" : "defense");
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

  function createEnemyBall({ x, y, targetX, targetY, speed, style = "straight", catchable = false, curveDirection = 0, bounces = 0 }) {
    const g = state.current;
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    g.balls.push({
      x, y,
      vx: dx / len * speed,
      vy: dy / len * speed,
      el: null,
      style,
      catchable,
      turnRate: style === "curve" ? curveDirection * 0.82 : 0,
      bouncesRemaining: bounces,
      hasEnteredArena: false
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

    if (event.style === "power") {
      createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:470*slow*phaseSpeed, style:"power", catchable:false });
      return;
    }
    if (event.style === "curve") {
      const offset = event.curveDirection > 0 ? -95 : 95;
      createEnemyBall({ x:startX, y:startY, targetX:playerX+offset, targetY:playerY, speed:295*slow*phaseSpeed, style:"curve", catchable:event.catchable, curveDirection:event.curveDirection || 1 });
      return;
    }
    if (event.style === "ricochet") {
      const wallX = event.side === "left" ? 24 : rect.width - 24;
      const wallY = rect.height * .42;
      createEnemyBall({ x:startX, y:startY, targetX:wallX, targetY:wallY, speed:330*slow*phaseSpeed, style:"ricochet", catchable:false, bounces:event.bounces || 1 });
      return;
    }
    createEnemyBall({ x:startX, y:startY, targetX:playerX, targetY:playerY, speed:325*slow*phaseSpeed, style:"straight", catchable:event.catchable });
  }

  function processRubroAttackTimeline(now, rect) {
    const g = state.current;
    const elapsed = now - g.enemyAttackStart;
    for (const event of g.enemyAttackSequence) {
      if (event.done || elapsed < event.at) continue;
      event.done = true;
      if (event.kind === "telegraph") {
        setRubroDefenseVisual(event.side, event.tone === "feint" ? "feint" : "ready");
        showDodgeTelegraph(event.text, event.tone, event.side);
      } else if (event.kind === "charge") {
        setRubroDefenseVisual(event.side, "charge");
        showDodgeTelegraph("!", "power", event.side);
      } else if (event.kind === "fake") {
        setRubroDefenseVisual(event.side, "feint");
        showDodgeTelegraph("FALSO", "feint", event.side);
      } else if (event.kind === "throw") {
        setRubroDefenseVisual(event.side, "throw");
        spawnRubroThrow(event, rect);
        addTimer(() => setRubroDefenseVisual(event.side, "recover"), 180);
      }
    }
  }

  function attemptCatchDodgeball() {
    const g = state.current;
    if (!g || g.phase !== "defense" || performance.now() < g.catchCooldownUntil) return false;
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
      if (distance < nearestDistance) { nearest = ball; nearestDistance = distance; }
    }

    g.catchCooldownUntil = performance.now() + 260;
    if (!nearest || nearestDistance > 70) {
      const timer = document.getElementById("dodgeTimer");
      if (timer) timer.textContent = "Muito cedo! Espere a bola entrar no alcance.";
      return false;
    }

    nearest.el?.remove();
    g.balls = g.balls.filter((ball) => ball !== nearest);
    g.counterAttackReady = true;
    g.throwWindowBonus = Math.max(g.throwWindowBonus, 7);
    g.damageBonus += 1;
    g.dialogue = nearestDistance <= 42
      ? "AGARROU PERFEITO! Você tomou a posse da bola no instante exato. Contra-ataque carregado."
      : "Você agarrou a bola! O turno de Rubro acabou e seu próximo arremesso recebeu Contra-ataque.";
    const player = document.getElementById("dodgePlayer");
    player?.classList.add("dodge-catch-success");
    const arenaEl = document.getElementById("dodgeArena");
    arenaEl?.classList.add("dodge-catch-flash");
    setRubroDefenseVisual("center", "recover");
    const timer = document.getElementById("dodgeTimer");
    if (timer) timer.textContent = nearestDistance <= 42 ? "PERFECT CATCH! ⚡" : "AGARROU! · CONTRA-ATAQUE";
    addTimer(() => finishRubroDefenseTurn(true), 520);
    return true;
  }

  function playDodgePlayerHitEffect(style = "straight") {
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
    g.balls.forEach((ball) => ball.el?.remove());
    g.balls = [];
    g.moveBoost = 1;
    g.enemySlowMultiplier = 1;
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
    const speedPct = 58 * dt * (g.moveBoost || 1);

    let dx = 0, dy = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
    if (dx && dy) { dx *= .707; dy *= .707; }
    g.player.x = clamp(g.player.x + dx * speedPct, 4, 96);
    g.player.y = clamp(g.player.y + dy * speedPct, 8, 92);
    updateDodgePlayerDom();

    processRubroAttackTimeline(now, rect);

    const playerX = rect.width * g.player.x / 100;
    const playerY = rect.height * g.player.y / 100;
    g.balls = g.balls.filter((ball) => {
      if (ball.turnRate) {
        const speed = Math.hypot(ball.vx, ball.vy);
        const angle = Math.atan2(ball.vy, ball.vx) + ball.turnRate * dt;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.y >= 0 && ball.y <= rect.height) ball.hasEnteredArena = true;

      if (ball.style === "ricochet" && ball.hasEnteredArena && ball.bouncesRemaining > 0) {
        if (ball.x <= 13 && ball.vx < 0) { ball.x = 13; ball.vx *= -1; ball.bouncesRemaining -= 1; ball.el?.classList.add("just-bounced"); }
        else if (ball.x >= rect.width - 13 && ball.vx > 0) { ball.x = rect.width - 13; ball.vx *= -1; ball.bouncesRemaining -= 1; ball.el?.classList.add("just-bounced"); }
      }

      if (!ball.el) {
        ball.el = document.createElement("div");
        ball.el.className = `dodge-ball rubro-ball rubro-ball-${ball.style}${ball.catchable ? " is-catchable" : ""}`;
        arena.appendChild(ball.el);
      }
      ball.el.style.left = `${ball.x - 12}px`;
      ball.el.style.top = `${ball.y - 12}px`;

      const catchDistance = Math.hypot(ball.x - playerX, ball.y - playerY);
      ball.el.classList.toggle("catch-window", ball.catchable && catchDistance <= 78 && catchDistance > 24);

      const outside = ball.x < -90 || ball.x > rect.width + 90 || ball.y < -90 || ball.y > rect.height + 90;
      if (outside) { ball.el.remove(); return false; }

      const hitRadius = ball.style === "power" ? 29 : 25;
      const hit = catchDistance < hitRadius;
      if (hit && now >= g.player.invulnerableUntil) {
        ball.el.remove();
        if (g.defenseShield > 0) {
          g.defenseShield -= 1;
          g.player.invulnerableUntil = now + 440;
          const timer = document.getElementById("dodgeTimer");
          if (timer) timer.textContent = "Escudo absorveu a bolada!";
          return false;
        }
        g.playerHp -= 1;
        g.player.invulnerableUntil = now + 700;
        playDodgePlayerHitEffect(ball.style);
        const hearts = document.querySelector(".dodgeball-hearts");
        if (hearts) hearts.textContent = `${"♥ ".repeat(g.playerHp)}${"♡ ".repeat(Math.max(0, g.playerMaxHp - g.playerHp))}`;
        if (g.playerHp <= 0) {
          finishSport("dodgeball", false, "Capitão Rubro te eliminou da quadra antes do apito final.");
          return false;
        }
        return false;
      }
      return true;
    });

    const playerEl = document.getElementById("dodgePlayer");
    if (playerEl) playerEl.classList.toggle("invulnerable", now < g.player.invulnerableUntil);
    const remaining = Math.max(0, (g.defenseEnd - now) / 1000);
    const timer = document.getElementById("dodgeTimer");
    if (timer && !timer.textContent.includes("AGARROU") && !timer.textContent.includes("PERFECT")) {
      timer.textContent = `${remaining.toFixed(1)}s · ${g.activePattern?.label || "Esquiva"}`;
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

  function handleDodgeballKeyDown(key, event) {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return false;

    if (g.phase === "defense") {
      if (key === " " || key === "spacebar") {
        event.preventDefault();
        attemptCatchDodgeball();
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

    if (key === "space" && g.phase === "aim") {
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
