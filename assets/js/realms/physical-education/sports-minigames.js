(function initializeSportsMinigames(global) {
  const REALM_ID = "reino-educacao-fisica";
  const SPORT_IDS = ["football", "basketball", "athletics", "volleyball", "dodgeball"];
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
    panel?.classList.remove("visible");
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

  // -------------------------------------------------------
  // Queimada — ataque + esquiva
  // -------------------------------------------------------
  function startDodgeball() {
    state.current = {
      type: "dodgeball",
      phase: "attack",
      opponentHp: state.mode === "championship" ? 1 : 2,
      opponentMaxHp: state.mode === "championship" ? 1 : 2,
      playerHp: state.mode === "championship" ? 2 : 3,
      cursor: 12,
      dir: 1,
      rounds: 0,
      maxRounds: state.mode === "championship" ? 2 : 4,
      locked: false,
      balls: [],
      player: { x: 50, y: 50, invulnerableUntil: 0 },
      defenseEnd: 0,
      lastSpawn: 0
    };
    renderDodgeballAttack("Seu turno. Acerte o centro da barra para lançar.");

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "dodgeball") return;
      const g = state.current;
      const dt = Math.min(32, now - last);
      last = now;

      if (g.phase === "attack") {
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

  function renderDodgeballAttack(feedback = "") {
    const g = state.current;
    openPanelShell(
      "🔴 Queimada · Turno de Ataque",
      "Arena da Esquiva",
      "Ataque com precisão; depois sobreviva ao turno adversário.",
      `<div class="sports-game-card dodgeball-attack-stage">
        <div class="sports-status-row"><span class="sports-stat-pill">Adversário ${g.opponentHp}/${g.opponentMaxHp}</span><span class="sports-stat-pill">Seus pontos ${g.playerHp}</span><span class="sports-stat-pill">Rodada ${g.rounds + 1}/${g.maxRounds}</span></div>
        <div class="dodgeball-turn-label">SEU TURNO · ARREMESSO</div>
        <div class="sports-meter"><div class="sports-meter-perfect"></div><div id="dodgeAttackCursor" class="sports-meter-cursor" style="left:${g.cursor}%"></div></div>
        <div style="text-align:center;"><button class="sports-primary-btn" type="button" onclick="VoltzSports.throwDodgeball()" ${g.locked ? "disabled" : ""}>Arremessar [Espaço]</button></div>
        <div class="sports-feedback">${escapeHtml(feedback)}</div>
        <div class="sports-help">Acerte a região central da barra. Depois use WASD ou Setas para esquivar.</div>
      </div>`
    );
  }

  function throwDodgeball() {
    const g = state.current;
    if (!g || g.type !== "dodgeball" || g.phase !== "attack" || g.locked) return;
    g.locked = true;
    g.rounds += 1;
    const hit = g.cursor >= 37 && g.cursor <= 63;
    if (hit) g.opponentHp -= 1;
    renderDodgeballAttack(hit ? "ACERTO! A bola atingiu o adversário." : "O arremesso passou fora da zona ideal.");

    addTimer(() => {
      if (!state.current || state.current !== g) return;
      if (g.opponentHp <= 0) {
        finishSport("dodgeball", true, "Você venceu os turnos de ataque e manteve o controle da Arena da Esquiva.");
        return;
      }
      if (g.rounds >= g.maxRounds) {
        finishSport("dodgeball", false, "Seus turnos de ataque acabaram antes de acertar o adversário vezes suficientes.");
        return;
      }
      startDodgeDefense();
    }, 700);
  }

  function startDodgeDefense() {
    const g = state.current;
    if (!g || g.type !== "dodgeball") return;
    g.phase = "defense";
    g.locked = false;
    g.balls = [];
    g.player = { x: 50, y: 50, invulnerableUntil: 0 };
    g.defenseEnd = performance.now() + (state.mode === "championship" ? 3500 : 5000);
    g.lastSpawn = 0;
    renderDodgeDefense();
  }

  function renderDodgeDefense() {
    const g = state.current;
    openPanelShell(
      "🔴 Queimada · Turno de Esquiva",
      "Arena da Esquiva",
      "O adversário está arremessando. Mova o Núcleo Voltz e sobreviva até o cronômetro zerar.",
      `<div class="sports-game-card">
        <div class="dodgeball-turn-label">TURNO ADVERSÁRIO · ESQUIVA</div>
        <div class="dodgeball-hearts">${"♥ ".repeat(g.playerHp)}${"♡ ".repeat(Math.max(0, 3 - g.playerHp))}</div>
        <div id="dodgeArena" class="dodgeball-arena"><div id="dodgePlayer" class="dodge-player">⚡</div></div>
        <div id="dodgeTimer" class="sports-feedback">Sobreviva...</div>
        <div class="sports-help">WASD / Setas. Encostar numa bola remove um ponto e concede alguns instantes de invulnerabilidade.</div>
      </div>`
    );
    updateDodgePlayerDom();
  }

  function spawnDodgeBall(now, arenaWidth, arenaHeight) {
    const g = state.current;
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = -20; y = Math.random() * arenaHeight; }
    else if (edge === 1) { x = arenaWidth + 20; y = Math.random() * arenaHeight; }
    else if (edge === 2) { x = Math.random() * arenaWidth; y = -20; }
    else { x = Math.random() * arenaWidth; y = arenaHeight + 20; }

    const targetX = (g.player.x / 100) * arenaWidth + (Math.random() - .5) * 120;
    const targetY = (g.player.y / 100) * arenaHeight + (Math.random() - .5) * 90;
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = state.mode === "championship" ? 260 : 225;

    g.balls.push({
      x, y,
      vx: dx / len * speed,
      vy: dy / len * speed,
      el: null
    });
    g.lastSpawn = now;
  }

  function updateDodgeDefense(now, dt) {
    const g = state.current;
    const arena = document.getElementById("dodgeArena");
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const speedPct = 58 * dt;

    let dx = 0, dy = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
    if (dx && dy) { dx *= .707; dy *= .707; }

    g.player.x = clamp(g.player.x + dx * speedPct, 3, 97);
    g.player.y = clamp(g.player.y + dy * speedPct, 5, 95);
    updateDodgePlayerDom();

    const spawnEvery = state.mode === "championship" ? 400 : 470;
    if (!g.lastSpawn || now - g.lastSpawn >= spawnEvery) spawnDodgeBall(now, rect.width, rect.height);

    const playerX = (g.player.x / 100) * rect.width;
    const playerY = (g.player.y / 100) * rect.height;

    g.balls = g.balls.filter((ball) => {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (!ball.el) {
        ball.el = document.createElement("div");
        ball.el.className = "dodge-ball";
        arena.appendChild(ball.el);
      }
      ball.el.style.left = `${ball.x - 12}px`;
      ball.el.style.top = `${ball.y - 12}px`;

      const outside = ball.x < -70 || ball.x > rect.width + 70 || ball.y < -70 || ball.y > rect.height + 70;
      if (outside) {
        ball.el.remove();
        return false;
      }

      const hit = Math.hypot(ball.x - playerX, ball.y - playerY) < 26;
      if (hit && now >= g.player.invulnerableUntil) {
        g.playerHp -= 1;
        g.player.invulnerableUntil = now + 700;
        ball.el.remove();
        updateDodgePlayerDom();
        const hearts = document.querySelector(".dodgeball-hearts");
        if (hearts) hearts.textContent = `${"♥ ".repeat(g.playerHp)}${"♡ ".repeat(Math.max(0, 3 - g.playerHp))}`;

        if (g.playerHp <= 0) {
          finishSport("dodgeball", false, "Você foi atingido vezes demais durante o turno de esquiva.");
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
    if (timer) timer.textContent = `${remaining.toFixed(1)}s`;

    if (remaining <= 0) {
      g.balls.forEach((ball) => ball.el?.remove());
      g.balls = [];
      g.phase = "attack";
      g.locked = false;
      renderDodgeballAttack("Você sobreviveu ao turno adversário. Sua vez!");
    }
  }

  function updateDodgePlayerDom() {
    const g = state.current;
    const el = document.getElementById("dodgePlayer");
    if (!g || !el) return;
    el.style.left = `calc(${g.player.x}% - 15px)`;
    el.style.top = `calc(${g.player.y}% - 15px)`;
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
    const key = event.key.toLowerCase();
    state.pressed.add(key);

    if (key === "escape") {
      event.preventDefault();
      close();
      return;
    }

    const game = state.current;
    if (!game) return;

    if (key === " " || key === "spacebar") {
      event.preventDefault();
      if (game.type === "football") shootFootball();
      else if (game.type === "basketball") shootBasketball();
      else if (game.type === "athletics") athleticsSpace();
      else if (game.type === "dodgeball" && game.phase === "attack") throwDodgeball();
      return;
    }

    if (game.type === "athletics" && ["a","d"].includes(key)) athleticsStep(key);
    if (game.type === "volleyball" && ["a","s","d"].includes(key)) volleyballInput(key);
  }

  function handleKeyUp(event) {
    state.pressed.delete(event.key.toLowerCase());
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
