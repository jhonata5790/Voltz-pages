const viewport = document.getElementById("gameViewport");
    const world = document.getElementById("world");
    const player = document.getElementById("player");
    const playerSvg = player.querySelector(".player-svg");
    const playerLocator = document.getElementById("playerLocator");
    const playerHitboxDebug = document.getElementById("playerHitboxDebug");

    const debugX = document.getElementById("debugX");
    const debugY = document.getElementById("debugY");
    const debugSpeed = document.getElementById("debugSpeed");
    const debugDirection = document.getElementById("debugDirection");
    const debugCameraX = document.getElementById("debugCameraX");
    const debugCameraY = document.getElementById("debugCameraY");
    const debugCollision = document.getElementById("debugCollision");
    const debugOcclusion = document.getElementById("debugOcclusion");
    const interactionText = document.getElementById("interactionText");
    const dialogueBox = document.getElementById("dialogueBox");
    const dialoguePortrait = document.getElementById("dialoguePortrait");
    const dialogueRole = document.getElementById("dialogueRole");
    const dialogueName = document.getElementById("dialogueName");
    const dialogueText = document.getElementById("dialogueText");
    const dialogueFooter = document.getElementById("dialogueFooter");

    const realmPanel = document.getElementById("realmPanel");
    const realmGrid = document.getElementById("realmGrid");
    const realmMessage = document.getElementById("realmMessage");

    const shopPanel = document.getElementById("shopPanel");
    const shopCoins = document.getElementById("shopCoins");
    const shopHintCount = document.getElementById("shopHintCount");
    const shopBuyHintButton = document.getElementById("shopBuyHintButton");
    const shopMessage = document.getElementById("shopMessage");

    const worldInventoryButton = document.getElementById("worldInventoryButton");
    const worldInventoryPanel = document.getElementById("worldInventoryPanel");
    const worldInventorySummary = document.getElementById("worldInventorySummary");
    const worldInventoryItems = document.getElementById("worldInventoryItems");
    const worldInventoryDiplomas = document.getElementById("worldInventoryDiplomas");
    const worldInventoryAbilities = document.getElementById("worldInventoryAbilities");
    const worldInventoryMessage = document.getElementById("worldInventoryMessage");
    const hallFamePanel = document.getElementById("hallFamePanel");
    const hallFamePodium = document.getElementById("hallFamePodium");
    const hallFameList = document.getElementById("hallFameList");
    const hallFameCurrent = document.getElementById("hallFameCurrent");
    const hallFameStatus = document.getElementById("hallFameStatus");
    const studentTerminalPanel = document.getElementById("studentTerminalPanel");
    const studentTerminalSummary = document.getElementById("studentTerminalSummary");
    const studentTerminalRealms = document.getElementById("studentTerminalRealms");
    const studentTerminalAbilities = document.getElementById("studentTerminalAbilities");
    const libraryArchivePanel = document.getElementById("libraryArchivePanel");
    const libraryTopicGrid = document.getElementById("libraryTopicGrid");
    const libraryProgressNote = document.getElementById("libraryProgressNote");

    const equationPanel = document.getElementById("equationPanel");
    const equationPanelKicker = document.getElementById("equationPanelKicker");
    const equationPanelTitle = document.getElementById("equationPanelTitle");
    const equationPanelSubtitle = document.getElementById("equationPanelSubtitle");
    const equationPanelFooter = document.getElementById("equationPanelFooter");
    const equationFormula = document.getElementById("equationFormula");
    const equationPrompt = document.getElementById("equationPrompt");
    const equationOptions = document.getElementById("equationOptions");
    const equationFeedback = document.getElementById("equationFeedback");
    const mathProgressHud = document.getElementById("mathProgressHud");
    const mathBuffHud = document.getElementById("mathBuffHud");

    const enemyPanel = document.getElementById("enemyPanel");
    const enemyPanelKicker = document.getElementById("enemyPanelKicker");
    const enemyPanelTitle = document.getElementById("enemyPanelTitle");
    const enemyPanelSubtitle = document.getElementById("enemyPanelSubtitle");
    const enemyQuestionTip = document.getElementById("enemyQuestionTip");
    const enemyQuestionText = document.getElementById("enemyQuestionText");
    const enemyQuestionOptions = document.getElementById("enemyQuestionOptions");
    const enemyFeedback = document.getElementById("enemyFeedback");
    const enemyNextButton = document.getElementById("enemyNextButton");

    const decorLayer = document.getElementById("decorLayer");
    const buildingBaseLayer = document.getElementById("buildingBaseLayer");
    const roofLayer = document.getElementById("roofLayer");
    const colliderLayer = document.getElementById("colliderLayer");
    const treeBaseLayer = document.getElementById("treeBaseLayer");
    const canopyLayer = document.getElementById("canopyLayer");
    const depthLayer = document.getElementById("depthLayer");
    const interiorLayer = document.getElementById("interiorLayer");

    const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
    document.body.classList.toggle("debug-mode", debugMode);

    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      run: false,
      debugColliders: debugMode
    };

    const worldState = {
      width: 2500,
      height: 1600
    };

    const cameraState = {
      x: 0,
      y: 0,
      zoom: 1,
      targetZoom: 1,
      smoothing: 0.14
    };

    const playerState = {
      x: 0,
      y: 0,
      width: 72,
      height: 92,
      baseSpeed: 3.4,
      runSpeed: 5.2,
      direction: "baixo",
      moving: false,
      scale: 1,
      targetScale: 1
    };

    // Modificadores exclusivos do Painel Dev. Nunca são persistidos no save.
    let devSpeedMultiplier = 1;
    let devMathRhythmOverride = null;

    const cloneData = (data) => JSON.parse(JSON.stringify(data));

    const sourceData = window.VoltzData;
    const interiorSystem = window.VoltzInteriorSystem;

    if (
      !sourceData?.village ||
      !sourceData?.villageNpcs ||
      !sourceData?.villagePortals ||
      !sourceData?.realmOptions ||
      !interiorSystem ||
      interiorSystem.getAllScenes().length === 0
    ) {
      throw new Error("Os dados modulares do mundo e dos interiores não foram carregados antes de openworld.js.");
    }

    let buildings = cloneData(sourceData.village.buildings);
    let decorObjects = cloneData(sourceData.village.decorObjects);
    let treeObjects = cloneData(sourceData.village.treeObjects);
    let npcObjects = cloneData(sourceData.villageNpcs);
    let portalObjects = cloneData(sourceData.villagePortals);
    let worldEquationObjects = [];

    const mathRealmData = sourceData.realms?.mathematics;

    if (!mathRealmData?.enemyTypes || !mathRealmData?.scene) {
      throw new Error("Os dados do Reino da Matemática não foram carregados antes de openworld.js.");
    }

    const enemyTypes = cloneData(mathRealmData.enemyTypes);

    function createMathEnemies() {
      return cloneData(mathRealmData.commonEnemies || []);
    }

    const realmOptions = cloneData(sourceData.realmOptions);

    function getLoadedRealmData(realmId) {
      return Object.values(sourceData.realms || {}).find((realm) => realm?.id === realmId) || null;
    }

    function getSceneForRealm(realmId) {
      if (realmId === mathScene?.id) return mathScene;
      const realmData = getLoadedRealmData(realmId);
      return realmData?.scene ? cloneData(realmData.scene) : null;
    }

    const realmProgressState = Object.create(null);

    function createDefaultRealmProgress() {
      return {
        defeatedEnemyIds: [],
        miniBossDefeated: false,
        bossDefeated: false,
        guardianChallengeCompleted: false,
        completed: false
      };
    }

    function normalizeRuntimeRealmProgress(saved) {
      const source = saved && typeof saved === "object"
        ? cloneData(saved)
        : {};

      return {
        ...source,
        defeatedEnemyIds: Array.isArray(source.defeatedEnemyIds)
          ? [...new Set(source.defeatedEnemyIds.filter((id) => typeof id === "string" && id.trim()))]
          : [],
        solvedWorldEquationIds: Array.isArray(source.solvedWorldEquationIds)
          ? [...new Set(source.solvedWorldEquationIds.filter((id) => typeof id === "string" && id.trim()))]
          : [],
        miniBossDefeated: Boolean(source.miniBossDefeated),
        bossDefeated: Boolean(source.bossDefeated),
        guardianChallengeCompleted: Boolean(source.guardianChallengeCompleted || source.bossDefeated),
        completed: Boolean(source.completed || source.guardianChallengeCompleted || source.bossDefeated)
      };
    }

    function getRealmProgressKey(realmId) {
      const realmData = getLoadedRealmData(realmId);
      return realmData?.progressKey || realmData?.id || realmId;
    }

    function getRuntimeRealmProgress(realmId) {
      if (!realmProgressState[realmId]) {
        realmProgressState[realmId] = createDefaultRealmProgress();
      }

      return realmProgressState[realmId];
    }

    function applyRealmProgressState(realmId, saved) {
      const target = getRuntimeRealmProgress(realmId);
      const next = normalizeRuntimeRealmProgress(saved);

      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, next);
      return target;
    }

    function getRealmProgressSnapshot(realmId) {
      return cloneData(getRuntimeRealmProgress(realmId));
    }

    function persistRealmProgress(realmId) {
      if (!window.VoltzProfile?.setRealmProgress || !realmId) return Promise.resolve(null);

      const progressKey = getRealmProgressKey(realmId);

      return window.VoltzProfile
        .setRealmProgress(progressKey, getRealmProgressSnapshot(realmId))
        .then((result) => {
          if (result?.persisted === false) {
            console.warn(`[SAVE] ${realmId} ficou apenas na memória; Supabase não confirmou a escrita.`, result.error);
          }
          return result;
        })
        .catch((error) => {
          console.error(`Falha inesperada ao salvar progresso de ${realmId}:`, error);
          return { ok: false, persisted: false, error };
        });
    }

    function syncRealmProgressFromProfile(realmId) {
      if (!window.VoltzProfile?.getRealmProgress || !realmId) return null;

      const progressKey = getRealmProgressKey(realmId);
      const saved = window.VoltzProfile.getRealmProgress(progressKey);
      return applyRealmProgressState(realmId, saved || createDefaultRealmProgress());
    }

    function syncAllRealmProgressFromProfile() {
      Object.values(sourceData.realms || {}).forEach((realm) => {
        if (realm?.id) syncRealmProgressFromProfile(realm.id);
      });
    }

    function hydrateRealmProgress() {
      if (!window.VoltzProfile?.ready) return;

      window.VoltzProfile.ready
        .then(() => {
          syncAllRealmProgressFromProfile();
          refreshRealmEnemyObjectsAfterProgress(currentScene?.id);
        })
        .catch((error) => console.error("Falha ao carregar progresso dos reinos:", error));
    }

    function isRealmEnemyDefeated(realmId, enemyId) {
      return getRuntimeRealmProgress(realmId).defeatedEnemyIds.includes(enemyId);
    }

    function getRealmCommonEnemies(realmId) {
      const realmData = getLoadedRealmData(realmId);
      return cloneData(realmData?.commonEnemies || []);
    }

    function getRealmCommonEnemyIds(realmId) {
      return getRealmCommonEnemies(realmId).map((enemy) => enemy.id);
    }

    function getRealmDefeatedCommonCount(realmId) {
      const commonIds = getRealmCommonEnemyIds(realmId);
      return commonIds.filter((id) => isRealmEnemyDefeated(realmId, id)).length;
    }

    function areAllRealmCommonsDefeated(realmId) {
      const commonIds = getRealmCommonEnemyIds(realmId);
      return commonIds.length > 0 && commonIds.every((id) => isRealmEnemyDefeated(realmId, id));
    }

    function isRealmGuardianCompleted(realmId) {
      const progress = getRuntimeRealmProgress(realmId);
      return Boolean(progress.guardianChallengeCompleted || progress.bossDefeated);
    }

    function getRealmProgressionRules(realmId) {
      return getLoadedRealmData(realmId)?.progression || {};
    }

    function getRealmRequiredCommonCount(realmId) {
      const total = getRealmCommonEnemyIds(realmId).length;
      const configured = Number(getRealmProgressionRules(realmId).commonEnemiesRequiredForMiniBoss);
      if (!Number.isFinite(configured)) return total;
      return Math.max(0, Math.min(total, Math.floor(configured)));
    }

    function getRealmRequiredEquationIds(realmId) {
      const configured = getRealmProgressionRules(realmId).requiredEquationIdsForMiniBoss;
      return Array.isArray(configured)
        ? [...new Set(configured.filter((id) => typeof id === "string" && id.trim()))]
        : [];
    }

    function getRealmSolvedEquationCount(realmId) {
      const progress = getRuntimeRealmProgress(realmId);
      const solved = Array.isArray(progress.solvedWorldEquationIds) ? progress.solvedWorldEquationIds : [];
      return getRealmRequiredEquationIds(realmId).filter((id) => solved.includes(id)).length;
    }

    function areRealmMiniBossRequirementsMet(realmId) {
      const requiredCommons = getRealmRequiredCommonCount(realmId);
      const defeatedCommons = getRealmDefeatedCommonCount(realmId);
      const requiredEquations = getRealmRequiredEquationIds(realmId);
      const solvedEquations = getRuntimeRealmProgress(realmId).solvedWorldEquationIds || [];

      const commonsMet = defeatedCommons >= requiredCommons;
      const equationsMet = requiredEquations.every((id) => solvedEquations.includes(id));
      return commonsMet && equationsMet;
    }

    function isRealmMiniBossUnlocked(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);

      return Boolean(
        realmData?.miniBoss &&
        areRealmMiniBossRequirementsMet(realmId) &&
        !progress.miniBossDefeated &&
        !isRealmGuardianCompleted(realmId)
      );
    }

    function isRealmBossUnlocked(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);
      const rules = getRealmProgressionRules(realmId);

      if (!realmData?.boss || isRealmGuardianCompleted(realmId)) return false;
      if (!areRealmMiniBossRequirementsMet(realmId)) return false;

      const requiresMiniBoss = rules.requireMiniBossForBoss !== false && Boolean(realmData.miniBoss);
      return requiresMiniBoss ? progress.miniBossDefeated : true;
    }

    function getRealmEnemyObjectsByProgress(realmId) {
      const realmData = getLoadedRealmData(realmId);
      if (!realmData) return [];

      const commonEnemies = getRealmCommonEnemies(realmId)
        .filter((enemy) => !isRealmEnemyDefeated(realmId, enemy.id));

      if (isRealmBossUnlocked(realmId)) {
        return [...commonEnemies, cloneData(realmData.boss)];
      }

      if (isRealmMiniBossUnlocked(realmId)) {
        return [...commonEnemies, cloneData(realmData.miniBoss)];
      }

      return commonEnemies;
    }

    function getEnemyObjectsForScene(scene) {
      if (!scene) return [];

      const realmData = getLoadedRealmData(scene.id);
      if (realmData) return getRealmEnemyObjectsByProgress(scene.id);

      return cloneData(scene.enemyObjects || []);
    }

    function refreshRealmEnemyObjectsAfterProgress(realmId = currentScene?.id) {
      if (!currentScene || currentScene.id !== realmId || !getLoadedRealmData(realmId)) return;

      enemyObjects = getRealmEnemyObjectsByProgress(realmId);
      buildCollisionAndOcclusionData();
      renderDepthLayer();
      updateNearbyEnemy();
      if (keys.debugColliders) renderColliderDebugLayer();
    }

    // Wrappers de Matemática mantêm os diálogos atuais, mas o motor acima
    // já funciona para qualquer novo reino que siga o mesmo formato de dados.
    const mathProgress = getRuntimeRealmProgress("reino-matematica");

    function getMathProgressSnapshot() {
      return getRealmProgressSnapshot("reino-matematica");
    }

    function persistMathProgress() {
      return persistRealmProgress("reino-matematica");
    }

    function hydrateMathProgress() {
      hydrateRealmProgress();
    }

    function isEnemyDefeated(enemyId) {
      return isRealmEnemyDefeated("reino-matematica", enemyId);
    }

    function getMathCommonEnemies() {
      return getRealmCommonEnemies("reino-matematica");
    }

    function getMathCommonEnemyIds() {
      return getRealmCommonEnemyIds("reino-matematica");
    }

    function getDefeatedCommonCount() {
      return getRealmDefeatedCommonCount("reino-matematica");
    }

    function areAllMathCommonsDefeated() {
      return areAllRealmCommonsDefeated("reino-matematica");
    }

    function isMathMiniBossUnlocked() {
      return isRealmMiniBossUnlocked("reino-matematica");
    }

    function isMathBossUnlocked() {
      return isRealmBossUnlocked("reino-matematica");
    }

    function createMathMiniBoss() {
      return cloneData(mathRealmData.miniBoss);
    }

    function createMathBoss() {
      return cloneData(mathRealmData.boss);
    }

    function getMathEnemyObjectsByProgress() {
      return getRealmEnemyObjectsByProgress("reino-matematica");
    }

    function getMathProgressionState() {
      const totalCommons = getMathCommonEnemyIds().length;
      const defeatedCommons = getDefeatedCommonCount();
      const requiredCommons = getRealmRequiredCommonCount("reino-matematica");
      const requiredEquationIds = getRealmRequiredEquationIds("reino-matematica");
      const solvedEquationIds = getSolvedWorldEquationIds("reino-matematica");
      const solvedRequiredEquations = requiredEquationIds.filter((id) => solvedEquationIds.includes(id)).length;
      const bridgeEquationId = getRealmProgressionRules("reino-matematica").bridgeEquationId || "equacao-operacoes-01";
      const bridgeStable = solvedEquationIds.includes(bridgeEquationId);
      const miniBossUnlocked = isMathMiniBossUnlocked();
      const bossUnlocked = isMathBossUnlocked();

      let stage = 0;
      let label = "Estabilize a Ponte";
      let objective = "Encontre o Núcleo da Ponte no Distrito das Operações e resolva a primeira Equação do Mundo.";

      if (isRealmGuardianCompleted("reino-matematica")) {
        stage = 4;
        label = "Reino concluído";
        objective = "O teste final foi concluído. O Diploma da Matemática foi conquistado e Raciocínio Estruturado está disponível.";
      } else if (bossUnlocked) {
        stage = 3;
        label = "Fortaleza do Golem";
        objective = "O Portão do Teorema está aberto. Siga até o Golem dos Cálculos.";
      } else if (mathProgress.miniBossDefeated) {
        stage = 3;
        label = "Portão do Teorema";
        objective = "Melog foi superado. Atravesse o caminho que leva à Fortaleza do Golem.";
      } else if (miniBossUnlocked) {
        stage = 2;
        label = "Ruínas do Melog";
        objective = "O selo das ruínas se rompeu. Encontre Melog e restaure a lógica da região.";
      } else if (bridgeStable) {
        stage = 1;
        label = "Restaure as zonas";
        const missingCommons = Math.max(0, requiredCommons - defeatedCommons);
        const missingEquations = Math.max(0, requiredEquationIds.length - solvedRequiredEquations);
        const parts = [];
        if (missingCommons) parts.push(`derrote mais ${missingCommons} inimigo${missingCommons === 1 ? "" : "s"}`);
        if (missingEquations) parts.push(`estabilize mais ${missingEquations} Equação${missingEquations === 1 ? "" : "ões"} do Mundo`);
        objective = parts.length
          ? `Explore Fatores e Potências: ${parts.join(" e ")}.`
          : "Os requisitos foram cumpridos. O selo das Ruínas do Melog está cedendo.";
      }

      return {
        stage,
        label,
        objective,
        totalCommons,
        defeatedCommons,
        requiredCommons,
        requiredEquationIds,
        solvedRequiredEquations,
        bridgeStable,
        miniBossUnlocked,
        bossUnlocked
      };
    }

    function getPortugueseProgressionState() {
      const realmId = "reino-gramatica";
      const progress = getRuntimeRealmProgress(realmId);
      const totalCommons = getRealmCommonEnemyIds(realmId).length;
      const defeatedCommons = getRealmDefeatedCommonCount(realmId);
      const requiredCommons = getRealmRequiredCommonCount(realmId);
      const requiredWordIds = getRealmRequiredEquationIds(realmId);
      const solvedWordIds = getSolvedWorldEquationIds(realmId);
      const solvedRequiredWords = requiredWordIds.filter((id) => solvedWordIds.includes(id)).length;
      const openingId = getRealmProgressionRules(realmId).openingChallengeId || getRealmProgressionRules(realmId).bridgeEquationId || "palavra-ortografia-01";
      const openingStable = solvedWordIds.includes(openingId);
      const miniBossUnlocked = isRealmMiniBossUnlocked(realmId);
      const bossUnlocked = isRealmBossUnlocked(realmId);

      let stage = 0;
      let label = "Reconstrua a primeira frase";
      let objective = "Encontre a Inscrição da Passagem no Bairro Ortográfico e escolha a palavra que devolve sentido à frase.";

      if (isRealmGuardianCompleted(realmId)) {
        stage = 4;
        label = "Reino concluído";
        objective = "O Espectro da Gramática foi dissipado. O Diploma de Português e a competência Leitura Crítica foram conquistados.";
      } else if (bossUnlocked) {
        stage = 3;
        label = "Catedral da Gramática";
        objective = "Ortcepse foi superado. Atravesse o Portal da Gramática e enfrente o Espectro.";
      } else if (progress.miniBossDefeated) {
        stage = 3;
        label = "Portal da Gramática";
        objective = "O Arquivo Invertido foi restaurado. O caminho até a Catedral da Gramática está se abrindo.";
      } else if (miniBossUnlocked) {
        stage = 2;
        label = "Arquivo Invertido";
        objective = "As estruturas necessárias foram recuperadas. Entre no Arquivo Invertido e enfrente Ortcepse.";
      } else if (openingStable) {
        stage = 1;
        label = "Reconstrua o reino";
        const missingCommons = Math.max(0, requiredCommons - defeatedCommons);
        const missingWords = Math.max(0, requiredWordIds.length - solvedRequiredWords);
        const parts = [];
        if (missingCommons) parts.push(`supere mais ${missingCommons} inimigo${missingCommons === 1 ? "" : "s"}`);
        if (missingWords) parts.push(`reconstrua mais ${missingWords} Palavra${missingWords === 1 ? "" : "s"} do Mundo`);
        objective = parts.length
          ? `Explore Semântica e Sintaxe: ${parts.join(" e ")}.`
          : "Os requisitos foram cumpridos. O Selo do Arquivo Invertido está cedendo.";
      }

      return {
        stage,
        label,
        objective,
        totalCommons,
        defeatedCommons,
        requiredCommons,
        requiredWordIds,
        solvedRequiredWords,
        openingStable,
        miniBossUnlocked,
        bossUnlocked
      };
    }

    function getPortugueseProgressMessage() {
      const state = getPortugueseProgressionState();
      if (isRealmGuardianCompleted("reino-gramatica")) {
        return "Reino de Português concluído. O Diploma de Português e Leitura Crítica foram registrados.";
      }
      if (state.bossUnlocked) return "Ortcepse foi superado. A Catedral da Gramática está aberta e o Espectro aguarda ao norte.";
      if (state.miniBossUnlocked) return `Arquivo Invertido liberado: ${state.defeatedCommons}/${state.requiredCommons} inimigos e ${state.solvedRequiredWords}/${state.requiredWordIds.length} Palavras do Mundo.`;
      if (!state.openingStable) return "Reconstrua a Inscrição da Passagem no Bairro Ortográfico para abrir o caminho até Semântica e Sintaxe.";
      return state.objective;
    }

    function updatePortugueseProgressHud() {
      if (!mathProgressHud) return;
      const active = currentScene?.id === "reino-gramatica";
      if (!active) {
        mathProgressHud.classList.remove("portuguese-progress");
        return;
      }

      const state = getPortugueseProgressionState();
      const progress = getRuntimeRealmProgress("reino-gramatica");
      const wordsMet = state.solvedRequiredWords >= state.requiredWordIds.length;
      const commonsMet = state.defeatedCommons >= state.requiredCommons;
      const stepsComplete = [
        state.openingStable,
        commonsMet && wordsMet,
        progress.miniBossDefeated,
        isRealmGuardianCompleted("reino-gramatica")
      ].filter(Boolean).length;
      const progressPercent = Math.round((stepsComplete / 4) * 100);
      const statusIcon = (done, available = false) => done ? "✓" : (available ? "!" : "•");

      mathProgressHud.classList.add("visible", "portuguese-progress");
      mathProgressHud.innerHTML = `
        <div class="math-progress-head">
          <span>Jornada de Português</span>
          <strong>Etapa ${Math.min(state.stage + 1, 4)}/4</strong>
        </div>
        <div class="math-progress-stage">${escapeHtml(state.label)}</div>
        <div class="math-progress-objective">${escapeHtml(state.objective)}</div>
        <div class="math-progress-track"><span style="width:${progressPercent}%"></span></div>
        <div class="math-progress-checks">
          <span class="${state.openingStable ? "done" : ""}">${statusIcon(state.openingStable)} Passagem</span>
          <span class="${commonsMet ? "done" : ""}">${statusIcon(commonsMet)} Inimigos ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons}</span>
          <span class="${wordsMet ? "done" : ""}">${statusIcon(wordsMet)} Palavras ${state.solvedRequiredWords}/${state.requiredWordIds.length}</span>
          <span class="${progress.miniBossDefeated ? "done" : state.miniBossUnlocked ? "available" : ""}">${statusIcon(progress.miniBossDefeated, state.miniBossUnlocked)} Ortcepse</span>
          <span class="${isRealmGuardianCompleted("reino-gramatica") ? "done" : state.bossUnlocked ? "available" : ""}">${statusIcon(isRealmGuardianCompleted("reino-gramatica"), state.bossUnlocked)} Espectro</span>
        </div>`;
    }

    function getMathProgressMessage() {
      const state = getMathProgressionState();
      const rhythm = getMathLogicalRhythmState();

      if (isRealmGuardianCompleted("reino-matematica")) {
        return "Reino da Matemática concluído. O Golem reconheceu seu aprendizado e entregou o Diploma da Matemática.";
      }

      if (state.bossUnlocked) {
        return "Melog foi superado. O Portão do Teorema abriu o caminho até a Fortaleza do Golem.";
      }

      if (state.miniBossUnlocked) {
        return `Requisitos cumpridos: ${state.defeatedCommons}/${state.requiredCommons} inimigos e ${state.solvedRequiredEquations}/${state.requiredEquationIds.length} Equações do Mundo. As Ruínas do Melog estão acessíveis.`;
      }

      if (!state.bridgeStable) {
        return `Ritmo Lógico ${rhythm.stacks}/3. Estabilize a Equação do Mundo no Distrito das Operações para materializar a Ponte das Equações.`;
      }

      return `${state.objective} Ritmo Lógico ${rhythm.stacks}/3.`;
    }

    function getGenericRealmProgressMessage(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);
      const total = getRealmCommonEnemyIds(realmId).length;
      const defeated = getRealmDefeatedCommonCount(realmId);
      const realmName = realmData?.scene?.name || realmData?.name || "Reino";

      if (isRealmGuardianCompleted(realmId)) {
        return `${realmName} concluído. Seu progresso foi salvo.`;
      }

      if (isRealmBossUnlocked(realmId)) {
        return `Mini-chefe superado. O guardião final de ${realmName} foi liberado.`;
      }

      if (isRealmMiniBossUnlocked(realmId)) {
        const required = getRealmRequiredCommonCount(realmId);
        return `Requisitos cumpridos (${defeated}/${required} inimigos necessários). O mini-chefe de ${realmName} apareceu!`;
      }

      const required = getRealmRequiredCommonCount(realmId);
      return `Inimigos básicos derrotados: ${defeated}/${total} · requisito: ${Math.min(defeated, required)}/${required}.`;
    }

    function registerEnemyDefeat(enemySnapshot) {
      if (!enemySnapshot) return "";

      const realmId = currentScene?.id;
      if (!realmId || !getLoadedRealmData(realmId)) return "";

      const progress = getRuntimeRealmProgress(realmId);
      const rank = String(enemySnapshot.enemyRank || "").toLowerCase();
      const isBoss = enemySnapshot.isBoss === true || rank === "boss" || rank === "chefe";
      const isMiniBoss =
        enemySnapshot.isMiniBoss === true ||
        rank === "miniboss" ||
        rank === "mini-boss" ||
        rank === "mini_chefe" ||
        rank === "mini-chefe";

      let changed = false;

      if (isBoss) {
        if (!isRealmGuardianCompleted(realmId)) {
          progress.guardianChallengeCompleted = true;
          progress.completed = true;
          progress.completedAt = progress.completedAt || new Date().toISOString();
          changed = true;
        }
      } else if (isMiniBoss) {
        if (!progress.miniBossDefeated) {
          progress.miniBossDefeated = true;
          changed = true;
        }
      } else if (enemySnapshot.id && !progress.defeatedEnemyIds.includes(enemySnapshot.id)) {
        progress.defeatedEnemyIds.push(enemySnapshot.id);
        changed = true;
      }

      if (changed) {
        progress.lastVictoryAt = new Date().toISOString();
        persistRealmProgress(realmId);
      }

      if (realmId === "reino-matematica") {
        if (isBoss) return "Teste do guardião concluído! O Reino da Matemática reconheceu seu aprendizado.";
        if (isMiniBoss) return "Melog foi superado! O Portão do Teorema abriu o caminho para o Golem dos Cálculos.";
        if (isMathMiniBossUnlocked()) {
          return "Os requisitos foram cumpridos. O Selo das Ruínas se rompeu e Melog despertou!";
        }
        return getMathProgressMessage();
      }

      if (realmId === "reino-gramatica") {
        if (isBoss) return "O Espectro da Gramática foi dissipado. O Reino de Português está concluído!";
        if (isMiniBoss) return "Ortcepse foi superado! O Portal da Gramática abriu o caminho para o Espectro.";
        if (isRealmMiniBossUnlocked(realmId)) return "Linguagem suficiente foi restaurada. O Selo do Arquivo Invertido se rompeu e Ortcepse apareceu!";
        return getPortugueseProgressMessage();
      }

      return getGenericRealmProgressMessage(realmId);
    }

    async function resetMathProgress() {
      applyRealmProgressState("reino-matematica", createDefaultRealmProgress());

      const progressKey = getRealmProgressKey("reino-matematica");
      try {
        if (window.VoltzProfile?.resetRealmProgress) {
          await window.VoltzProfile.resetRealmProgress(progressKey);
        } else {
          await persistMathProgress();
        }
      } catch (error) {
        console.error("Falha ao reiniciar progresso da Matemática:", error);
      }

      if (currentScene && currentScene.id === "reino-matematica") {
        enemyObjects = getMathEnemyObjectsByProgress();
        buildCollisionAndOcclusionData();
        renderDepthLayer();
        updateNearbyEnemy();
        updateNearbyWorldEquation();
        if (keys.debugColliders) renderColliderDebugLayer();
      }

      updateMathBuffHud();
      interactionText.textContent = "Jornada da Matemática reiniciada. Todos os inimigos voltaram ao mapa.";
      return getMathProgressSnapshot();
    }

    function refreshMathEnemyObjectsAfterProgress() {
      refreshRealmEnemyObjectsAfterProgress("reino-matematica");
    }

    function completeEnemyDefeatFromBattle(enemySnapshot) {
      if (!enemySnapshot) return;

      const realmId = currentScene?.id;
      const liveEnemy = enemyObjects.find((enemy) => enemy.id === enemySnapshot.id);
      if (liveEnemy) liveEnemy.defeatedPending = true;

      const element = document.querySelector(`[data-enemy-id="${enemySnapshot.id}"]`);
      const finish = () => {
        const message = registerEnemyDefeat(enemySnapshot);
        refreshRealmEnemyObjectsAfterProgress(realmId);
        updateMathBuffHud();

        if (realmId === "reino-matematica") {
          interactionText.textContent = message || getMathProgressMessage();
        } else if (realmId === "reino-gramatica") {
          interactionText.textContent = message || getPortugueseProgressMessage();
        } else {
          interactionText.textContent = message || getGenericRealmProgressMessage(realmId);
        }
      };

      if (!element) {
        finish();
        return;
      }

      element.classList.add("enemy-map-defeated");
      window.setTimeout(() => {
        element.classList.add("enemy-map-vanish");
      }, 520);
      window.setTimeout(finish, 1280);
    }

    const villageScene = {
      id: "vila-central",
      name: "Vila Central",
      className: "scene-village",
      plazaLabel: "PRAÇA<br>VOLTZ",
      defaultHint: "Vila Central: explore, converse com os NPCs e fale com o Guardião do Portal para viajar.",
      spawn: { x: 1250, y: 1120 },
      zoneMarkers: [
        { label: "Zona Mística", x: 1088, y: 92 },
        { label: "Estudo", x: 456, y: 318 },
        { label: "Treino", x: 1778, y: 318 },
        { label: "Comércio", x: 485, y: 1248 },
        { label: "Hall da Fama", x: 1745, y: 1248 }
      ],
      buildings: cloneData(buildings),
      decorObjects: cloneData(decorObjects),
      treeObjects: cloneData(treeObjects),
      npcObjects: cloneData(npcObjects),
      portalObjects: cloneData(portalObjects),
      enemyObjects: []
    };


    const mathScene = {
      ...cloneData(mathRealmData.scene),
      enemyObjects: getRealmEnemyObjectsByProgress("reino-matematica")
    };

    let currentScene = villageScene;

    let enemyObjects = [];
    let nearbyEnemy = null;
    let enemyPanelOpen = false;
    let currentEnemy = null;
    let currentEnemyQuestion = null;
    let enemyQuestionAnswered = false;

    let nearbyNpc = null;
    let nearbyPortal = null;
    let realmPanelOpen = false;
    let shopPanelOpen = false;
    let worldInventoryOpen = false;
    let hallFamePanelOpen = false;
    let hallFameLoading = false;
    let studentTerminalOpen = false;
    let libraryArchiveOpen = false;
    let shopPurchaseBusy = false;
    let worldEquationPanelOpen = false;
    let nearbyWorldEquation = null;
    let currentWorldEquation = null;
    let currentWorldEquationChoices = [];
    let dialogueOpen = false;
    let currentDialogueNpc = null;
    let currentDialogueIndex = 0;
    let sceneTransitionLockedUntil = 0;

    let colliders = [];
    let occluders = [];
    let lastCollisionLabel = "livre";
    let currentOcclusionLabel = "nada";

    function setupPlayer() {
      updateWorldSizeFromCss();
      updatePlayerSizeFromCss();
      enemyObjects = getEnemyObjectsForScene(currentScene);
      buildCollisionAndOcclusionData();

      applySceneVisualState(currentScene);
      cameraState.zoom = currentScene.cameraZoom || 1;
      cameraState.targetZoom = cameraState.zoom;
      playerState.scale = currentScene.playerScale || 1;
      playerState.targetScale = playerState.scale;
      playerState.x = currentScene.spawn.x;
      playerState.y = currentScene.spawn.y;

      renderDepthLayer();
      renderColliderDebugLayer();
      updatePlayerPosition();
      snapCameraToPlayer();
      updateOcclusionVisibility();
      updateNearbyNpc();
      updateNearbyPortal();
      updateNearbyEnemy();
      updateNearbyWorldEquation();
      updateMathBuffHud();
      updateDebug();

      // A cena inicial não passa por changeScene(). Registra sua trilha desde o boot
      // para que o navegador a inicie assim que o primeiro gesto do usuário liberar áudio.
      window.VoltzSports?.onSceneChanged?.(currentScene.id);
      window.VoltzAudio?.playSceneMusic?.(currentScene.id);
    }

    function updateWorldSizeFromCss() {
      worldState.width = world.offsetWidth || 2500;
      worldState.height = world.offsetHeight || 1600;
    }

    function updatePlayerSizeFromCss() {
      playerState.width = player.offsetWidth || 72;
      playerState.height = player.offsetHeight || 92;
    }

    function getCurrentSpeed() {
      const base = keys.run ? playerState.runSpeed : playerState.baseSpeed;
      return base * devSpeedMultiplier;
    }

    function buildCollisionAndOcclusionData() {
      const buildingColliders = buildings.flatMap(getBuildingPhysicalColliders);
      const decorColliders = decorObjects
        .filter((decor) => decor.solid && !isDecorProgressGateOpen(decor))
        .map(getDecorPhysicalCollider)
        .filter(Boolean);

      const treeColliders = treeObjects.map(getTreeTrunkCollider);
      const npcColliders = npcObjects.map(getNpcCollider);

      colliders = [
        ...buildingColliders,
        ...decorColliders,
        ...treeColliders,
        ...npcColliders,
        ...cloneData(currentScene.customColliders || [])
      ];

      const roofOccluders = buildings.map((building) => ({
        id: `${building.id}-teto`,
        label: `${building.label} / teto`,
        x: building.x,
        y: building.y,
        w: building.w,
        h: building.h,
        sortY: getBuildingSortY(building),
        kind: "roof"
      }));

      const canopyOccluders = treeObjects.map((tree) => ({
        id: `${tree.id}-copa`,
        label: `${tree.label.replace("Tronco", "Copa")}`,
        x: tree.x,
        y: tree.y,
        w: tree.w,
        h: tree.h,
        sortY: getTreeSortY(tree),
        kind: "canopy"
      }));

      occluders = [...roofOccluders, ...canopyOccluders];
    }

    function getBuildingSortY(building) {
      return Math.round(building.y + building.h - 8);
    }

    function getTreeSortY(tree) {
      return Math.round(tree.y + tree.h + 18);
    }

    function isDecorProgressGateOpen(decor) {
      const gate = decor?.progressGate;
      if (!gate) return false;

      const realmId = gate.realmId || currentScene?.id;
      if (!realmId) return false;

      const progress = getRuntimeRealmProgress(realmId);

      if (gate.type === "world-equation") {
        return Boolean(gate.equationId && getSolvedWorldEquationIds(realmId).includes(gate.equationId));
      }

      if (gate.type === "mini-boss-unlocked") {
        return Boolean(
          isRealmMiniBossUnlocked(realmId) ||
          progress.miniBossDefeated ||
          isRealmGuardianCompleted(realmId)
        );
      }

      if (gate.type === "boss-unlocked") {
        return Boolean(isRealmBossUnlocked(realmId) || isRealmGuardianCompleted(realmId));
      }

      return false;
    }

    function getDecorVisualClass(decor) {
      const baseClass = decor.type ? `decor-${decor.type}` : "decor-wall";
      const operationClass = decor.operation ? `operation-${decor.operation}` : "";
      const gateClass = decor.progressGate
        ? (isDecorProgressGateOpen(decor) ? "gate-open" : "gate-locked")
        : "";
      return `${baseClass} ${operationClass} ${gateClass}`.trim();
    }

    function getDecorSortY(decor) {
      if (decor.type === "water") {
        return Math.round(decor.y + decor.h * 0.58);
      }

      if ([
        "math-pad",
        "math-symbol",
        "number-line",
        "math-zone",
        "infinity-plaza",
        "math-chasm",
        "equation-bridge",
        "corruption-zone",
        "corruption-wall",
        "fortress-court",
        "fortress-wall",
        "zone-title",
        "language-plaza",
        "language-zone",
        "language-corruption-zone",
        "language-sanctum",
        "language-pad",
        "language-boss-pad",
        "language-inscription",
        "corrupt-word",
        "language-rift",
        "language-corruption-wall",
        "language-sanctum-wall",
        "word-gate"
      ].includes(decor.type)) {
        return Math.round(decor.y + decor.h * 0.52);
      }

      return Math.round(decor.y + decor.h);
    }


    function getWorldEquationSortY(equation) {
      return Math.round(equation.y + 34);
    }

    function getWorldEquationDistance(equation) {
      const footPoint = getPlayerFootPoint();
      return Math.hypot(footPoint.x - equation.x, footPoint.y - equation.y);
    }

    function getNearestWorldEquationInRange() {
      return worldEquationObjects
        .filter((equation) => Number.isFinite(Number(equation?.x)) && Number.isFinite(Number(equation?.y)))
        .map((equation) => ({
          equation,
          distance: getWorldEquationDistance(equation),
          interactionRange: Math.max(60, Number(equation.interactionRange) || 105)
        }))
        .filter((entry) => Number.isFinite(entry.distance) && entry.distance <= entry.interactionRange)
        .sort((a, b) => a.distance - b.distance)[0]?.equation || null;
    }

    function getSolvedWorldEquationIds(realmId = "reino-matematica") {
      const progress = getRuntimeRealmProgress(realmId);
      return Array.isArray(progress.solvedWorldEquationIds) ? progress.solvedWorldEquationIds : [];
    }

    function isWorldEquationSolved(equationId, realmId = currentScene?.id || "reino-matematica") {
      return getSolvedWorldEquationIds(realmId).includes(equationId);
    }

    function getMathLogicalRhythmState() {
      const total = mathRealmData.worldEquations?.length || 0;
      const solved = mathRealmData.worldEquations
        ? mathRealmData.worldEquations.filter((equation) => isWorldEquationSolved(equation.id, "reino-matematica")).length
        : 0;
      const naturalStacks = Math.min(3, solved);
      const stacks = devMathRhythmOverride === null
        ? naturalStacks
        : Math.max(0, Math.min(3, Number(devMathRhythmOverride) || 0));
      return {
        stacks,
        naturalStacks,
        total,
        bonusSeconds: stacks * 2,
        devOverride: devMathRhythmOverride !== null
      };
    }

    function getActiveBattleTimeBonus() {
      if (currentScene?.id !== "reino-matematica") return 0;
      return getMathLogicalRhythmState().bonusSeconds;
    }

    function updateMathProgressHud() {
      if (!mathProgressHud) return;

      const active = currentScene?.id === "reino-matematica";
      if (!active) {
        if (currentScene?.id !== "reino-gramatica") mathProgressHud.classList.remove("visible");
        return;
      }
      mathProgressHud.classList.remove("portuguese-progress");
      mathProgressHud.classList.add("visible");

      const state = getMathProgressionState();
      const equationTotal = state.requiredEquationIds.length;
      const commonsMet = state.defeatedCommons >= state.requiredCommons;
      const equationsMet = state.solvedRequiredEquations >= equationTotal;
      const stepsComplete = [
        state.bridgeStable,
        commonsMet && equationsMet,
        mathProgress.miniBossDefeated,
        isRealmGuardianCompleted("reino-matematica")
      ].filter(Boolean).length;
      const progressPercent = Math.round((stepsComplete / 4) * 100);

      const statusIcon = (done, available = false) => done ? "✓" : (available ? "!" : "•");

      mathProgressHud.innerHTML = `
        <div class="math-progress-head">
          <span>Jornada da Matemática</span>
          <strong>Etapa ${Math.min(state.stage + 1, 4)}/4</strong>
        </div>
        <div class="math-progress-stage">${escapeHtml(state.label)}</div>
        <div class="math-progress-objective">${escapeHtml(state.objective)}</div>
        <div class="math-progress-track"><span style="width:${progressPercent}%"></span></div>
        <div class="math-progress-checks">
          <span class="${state.bridgeStable ? "done" : ""}">${statusIcon(state.bridgeStable)} Ponte</span>
          <span class="${commonsMet ? "done" : ""}">${statusIcon(commonsMet)} Inimigos ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons}</span>
          <span class="${equationsMet ? "done" : ""}">${statusIcon(equationsMet)} Equações ${state.solvedRequiredEquations}/${equationTotal}</span>
          <span class="${mathProgress.miniBossDefeated ? "done" : state.miniBossUnlocked ? "available" : ""}">${statusIcon(mathProgress.miniBossDefeated, state.miniBossUnlocked)} Melog</span>
          <span class="${isRealmGuardianCompleted("reino-matematica") ? "done" : state.bossUnlocked ? "available" : ""}">${statusIcon(isRealmGuardianCompleted("reino-matematica"), state.bossUnlocked)} Golem</span>
        </div>
      `;
    }

    function updateMathBuffHud() {
      updateMathProgressHud();
      updatePortugueseProgressHud();
      if (!mathBuffHud) return;

      const active = currentScene?.id === "reino-matematica";
      mathBuffHud.classList.toggle("visible", active);
      if (!active) return;

      const rhythm = getMathLogicalRhythmState();
      mathBuffHud.innerHTML = `
        <span class="math-buff-icon">∞</span>
        <span>
          <strong>Ritmo Lógico ${rhythm.stacks}/3</strong>
          <small>${rhythm.bonusSeconds > 0 ? `+${rhythm.bonusSeconds}s por pergunta` : "Estabilize Equações do Mundo"}</small>
        </span>
      `;
    }

    function updateNearbyWorldEquation() {
      const activeRealm = getLoadedRealmData(currentScene?.id);
      nearbyWorldEquation = activeRealm && worldEquationObjects.length
        ? getNearestWorldEquationInRange()
        : null;

      document.querySelectorAll("[data-world-equation-id]").forEach((element) => {
        const id = element.dataset.worldEquationId;
        element.classList.toggle("nearby", Boolean(nearbyWorldEquation && id === nearbyWorldEquation.id));
        element.classList.toggle("solved", isWorldEquationSolved(id));
      });
    }

    function shuffleWorldEquationChoices(values) {
      const result = [...values];
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    function renderWorldEquationPanel(message = "") {
      if (!equationPanel || !currentWorldEquation) return;

      const equation = currentWorldEquation;
      const realmData = getLoadedRealmData(currentScene?.id);
      const mechanic = realmData?.worldMechanic || {};
      const isMathRealm = currentScene?.id === "reino-matematica";
      const solved = isWorldEquationSolved(equation.id, currentScene?.id);
      const rhythm = isMathRealm ? getMathLogicalRhythmState() : null;

      if (equationPanelKicker) equationPanelKicker.textContent = equation.area || mechanic.name || "Mecanismo do Mundo";
      if (equationPanelTitle) equationPanelTitle.textContent = equation.name || mechanic.name || "Mecanismo do Mundo";
      if (equationPanelSubtitle) equationPanelSubtitle.textContent = mechanic.panelSubtitle || "Complete o mecanismo para estabilizar esta parte do reino.";
      if (equationPanelFooter) equationPanelFooter.textContent = mechanic.footer || "Cada Equação do Mundo estabilizada concede +2 segundos por pergunta enquanto você estiver neste reino.";
      if (equationFormula) equationFormula.textContent = equation.formula || "?";
      if (equationPrompt) {
        equationPrompt.textContent = solved
          ? (isMathRealm ? `Mecanismo estabilizado. Ritmo Lógico ativo: +${rhythm.bonusSeconds}s por pergunta neste reino.` : (mechanic.solvedPrompt || "Mecanismo restaurado."))
          : (equation.prompt || "Complete o mecanismo para estabilizar esta parte do reino.");
      }

      if (equationOptions) {
        if (solved) {
          equationOptions.innerHTML = `<div class="equation-solved-seal">${escapeHtml(mechanic.solvedSeal || "✓ EQUAÇÃO ESTABILIZADA")}</div>`;
        } else {
          equationOptions.innerHTML = currentWorldEquationChoices.map((choice, index) => {
            const letter = ["A", "B", "C", "D"][index] || String(index + 1);
            return `
              <button class="equation-option-btn" type="button" onclick="answerWorldEquation(${JSON.stringify(String(choice)).replaceAll('"', '&quot;')})">
                <strong>${letter}</strong>
                <span>${escapeHtml(choice)}</span>
              </button>
            `;
          }).join("");
        }
      }

      if (equationFeedback) {
        equationFeedback.className = `equation-feedback${message ? " visible" : ""}`;
        equationFeedback.textContent = message;
      }
    }

    function openWorldEquationPanel(equation) {
      if (!equation || !equationPanel || worldEquationPanelOpen) return false;

      currentWorldEquation = equation;
      currentWorldEquationChoices = shuffleWorldEquationChoices(equation.options || []);
      worldEquationPanelOpen = true;
      clearMovementKeys();
      playerState.moving = false;
      renderWorldEquationPanel();
      equationPanel.classList.add("visible");
      const mechanic = getLoadedRealmData(currentScene?.id)?.worldMechanic || {};
      interactionText.textContent = `${equation.name}: ${mechanic.name ? `reconstrua esta ${mechanic.name.toLowerCase()}` : "resolva o mecanismo"} para estabilizar o mundo.`;
      return true;
    }

    function closeWorldEquationPanel() {
      if (!equationPanel) return;
      equationPanel.classList.remove("visible");
      worldEquationPanelOpen = false;
      currentWorldEquation = null;
      currentWorldEquationChoices = [];
      updateNearbyWorldEquation();
    }

    function interactWithNearbyWorldEquation() {
      updateNearbyWorldEquation();
      if (!nearbyWorldEquation) return false;
      return openWorldEquationPanel(nearbyWorldEquation);
    }

    async function answerWorldEquation(value) {
      if (!worldEquationPanelOpen || !currentWorldEquation) return;

      const equation = currentWorldEquation;
      const realmId = currentScene?.id;
      const realmData = getLoadedRealmData(realmId);
      const mechanic = realmData?.worldMechanic || {};
      if (isWorldEquationSolved(equation.id, realmId)) {
        renderWorldEquationPanel(mechanic.solvedPrompt || "Este mecanismo do mundo já está estável.");
        return;
      }

      const buttons = equationPanel?.querySelectorAll(".equation-option-btn") || [];
      buttons.forEach((button) => { button.disabled = true; });

      if (String(value) !== String(equation.answer)) {
        buttons.forEach((button) => { button.disabled = false; });
        if (equationFeedback) {
          equationFeedback.className = "equation-feedback visible wrong";
          equationFeedback.textContent = mechanic.wrongMessage || "Ainda não. Releia o desafio e tente novamente.";
        }
        return;
      }

      const progress = getRuntimeRealmProgress(realmId);
      progress.solvedWorldEquationIds = Array.isArray(progress.solvedWorldEquationIds)
        ? progress.solvedWorldEquationIds
        : [];

      if (!progress.solvedWorldEquationIds.includes(equation.id)) {
        progress.solvedWorldEquationIds.push(equation.id);
        progress.lastWorldEquationAt = new Date().toISOString();
        await persistRealmProgress(realmId);
      }

      if (realmId === "reino-matematica") {
        const rhythm = getMathLogicalRhythmState();
        renderWorldEquationPanel(`${equation.explanation} Ritmo Lógico ${rhythm.stacks}/3: +${rhythm.bonusSeconds}s por pergunta.`);
        interactionText.textContent = `Equação estabilizada! Ritmo Lógico ${rhythm.stacks}/3 (+${rhythm.bonusSeconds}s por pergunta neste reino).`;
      } else {
        renderWorldEquationPanel(`${equation.explanation} ${mechanic.successSuffix || "O mundo respondeu à escolha correta."}`);
        interactionText.textContent = `${mechanic.name || "Mecanismo do Mundo"} reconstruída! ${getPortugueseProgressMessage()}`;
      }
      updateMathBuffHud();
      buildCollisionAndOcclusionData();
      renderDepthLayer();
      updateNearbyWorldEquation();
    }

    function getPortalSortY(portal) {
      // O portal é alto, então seu ponto de profundidade fica na base luminosa dele,
      // não no topo visual. Isso evita ele sumir atrás do prédio do portal.
      return Math.round(portal.y + 92);
    }

    function getPortalDistance(portal) {
      const footPoint = getPlayerFootPoint();
      const dx = footPoint.x - portal.x;
      const dy = footPoint.y - portal.y;
      return Math.hypot(dx, dy);
    }

    function getNearestPortalInRange() {
      return portalObjects
        .map((portal) => ({ portal, distance: getPortalDistance(portal) }))
        .filter((entry) => entry.distance <= entry.portal.interactionRange)
        .sort((a, b) => a.distance - b.distance)[0]?.portal || null;
    }

    function updateNearbyPortal() {
      nearbyPortal = getNearestPortalInRange();

      document.querySelectorAll("[data-portal-id]").forEach((element) => {
        element.classList.toggle("nearby", nearbyPortal && element.dataset.portalId === nearbyPortal.id);
      });
    }

    function portalSvg(portal) {
      return `
        <svg class="portal-svg" viewBox="0 0 180 220" role="img" aria-label="${portal.name}">
          <ellipse cx="90" cy="198" rx="54" ry="15" fill="rgba(0,0,0,0.35)"></ellipse>
          <ellipse cx="90" cy="110" rx="62" ry="88" fill="rgba(0,234,255,0.13)" stroke="rgba(120,247,255,0.34)" stroke-width="4"></ellipse>
          <ellipse cx="90" cy="110" rx="39" ry="66" fill="rgba(146,87,255,0.22)" stroke="rgba(255,255,255,0.42)" stroke-width="3"></ellipse>
          <path d="M90 28 C138 48 154 91 138 142 C127 178 105 194 90 202 C75 194 53 178 42 142 C26 91 42 48 90 28Z" fill="none" stroke="${portal.colorA}" stroke-width="8" stroke-linecap="round"></path>
          <path d="M90 48 C119 63 131 92 122 128 C116 153 101 169 90 177 C79 169 64 153 58 128 C49 92 61 63 90 48Z" fill="none" stroke="${portal.colorB}" stroke-width="7" stroke-linecap="round" opacity="0.9"></path>
          <path d="M62 112 C78 90 103 90 118 112 C102 134 78 134 62 112Z" fill="rgba(255,255,255,0.72)"></path>
          <circle cx="90" cy="112" r="15" fill="#02040d" stroke="#78f7ff" stroke-width="5"></circle>
          <path d="M51 185 L68 147 M129 185 L112 147" stroke="#ffd166" stroke-width="8" stroke-linecap="round"></path>
          <circle cx="51" cy="185" r="10" fill="#00eaff" stroke="#ffffff" stroke-width="3"></circle>
          <circle cx="129" cy="185" r="10" fill="#9257ff" stroke="#ffffff" stroke-width="3"></circle>
        </svg>
      `;
    }

    function renderRealmPanel() {
      realmGrid.innerHTML = realmOptions.map((realm) => `
        <div class="realm-card ${realm.unlocked ? "unlocked" : "locked"}">
          <div class="realm-icon">${realm.icon}</div>
          <div class="realm-name">${realm.name}</div>
          <div class="realm-desc">${realm.description}</div>
          <span class="realm-status">${realm.unlocked ? "⚡" : "🔒"} ${realm.status}</span>
          <button
            class="realm-enter-btn"
            type="button"
            ${realm.unlocked ? `onclick="selectRealm('${realm.id}')"` : "disabled"}
          >
            ${realm.unlocked ? "Selecionar Reino" : "Bloqueado"}
          </button>
        </div>
      `).join("");
    }

    function openRealmPanel() {
      realmPanelOpen = true;
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();
      renderRealmPanel();
      realmPanel.classList.add("visible");
      interactionText.textContent = "Portal dos Reinos aberto. Escolha uma área ou pressione Esc para voltar.";
    }

    function closeRealmPanel() {
      realmPanelOpen = false;
      realmPanel.classList.remove("visible");
      updateHint();
    }

    function renderShopPanel(message = "") {
      if (!shopPanel) return;

      const profile = window.VoltzProfile?.state?.profile;
      const coins = Math.max(0, Number(profile?.moedas || 0));
      const hintCount = Math.max(0, Number(window.VoltzProfile?.getItemCount?.("dica-foco") || 0));

      if (shopCoins) shopCoins.textContent = `${coins} moedas`;
      if (shopHintCount) shopHintCount.textContent = `Na mochila: ${hintCount}`;

      if (shopBuyHintButton) {
        shopBuyHintButton.disabled = shopPurchaseBusy || coins < 15;
        shopBuyHintButton.textContent = shopPurchaseBusy
          ? "Comprando..."
          : coins < 15
            ? "Moedas insuficientes"
            : "Comprar 1";
      }

      if (shopMessage) {
        shopMessage.textContent = message || "A Dica de Foco custa 15 moedas e pode ser usada uma vez durante qualquer pergunta.";
        shopMessage.classList.toggle("success", Boolean(message && message.startsWith("Compra concluída")));
        shopMessage.classList.toggle("error", Boolean(message && !message.startsWith("Compra concluída")));
      }
    }

    function openShopPanel() {
      if (!shopPanel) return;
      shopPanelOpen = true;

      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();

      renderShopPanel();
      shopPanel.classList.add("visible");
      interactionText.textContent = "Loja Voltz aberta. Compre recursos ou pressione Esc para voltar.";
    }

    function closeShopPanel() {
      shopPanelOpen = false;
      shopPurchaseBusy = false;
      shopPanel?.classList.remove("visible");
      updateHint();
    }

    function stopPlayerForOverlay() {
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();
    }

    function getInventoryItemPresentation(itemId, count) {
      const knownItems = {
        "dica-foco": {
          icon: "💡",
          name: "Dica de Foco",
          description: "Revela a dica da pergunta atual. O uso consome 1 unidade.",
          usage: "Usável durante batalhas"
        }
      };

      const known = knownItems[itemId];
      if (known) return { ...known, count };

      return {
        icon: "◇",
        name: String(itemId || "Item").replace(/[-_]/g, " "),
        description: "Item guardado no seu inventário persistente.",
        usage: "Item salvo",
        count
      };
    }

    function renderWorldInventory(message = "") {
      if (!worldInventoryPanel) return;

      const profile = window.VoltzProfile?.state?.profile;
      const inventory = window.VoltzProfile?.getInventory?.() || {};
      const diplomasObject = window.VoltzProfile?.getDiplomas?.() || {};
      const diplomas = Object.values(diplomasObject).filter((entry) => entry && typeof entry === "object");
      const abilities = diplomas.filter((entry) => entry.abilityId || entry.abilityName);

      if (worldInventorySummary) {
        const totalItems = Object.values(inventory).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
        worldInventorySummary.innerHTML = `
          <div><span>Aluno</span><strong>${escapeHtml(profile?.nome || "Aluno")}</strong></div>
          <div><span>Itens</span><strong>${totalItems}</strong></div>
          <div><span>Diplomas</span><strong>${diplomas.length}</strong></div>
          <div><span>Moedas</span><strong>${Math.max(0, Number(profile?.moedas || 0))}</strong></div>
        `;
      }

      if (worldInventoryItems) {
        const entries = Object.entries(inventory)
          .filter(([, count]) => Math.max(0, Number(count || 0)) > 0)
          .map(([itemId, count]) => getInventoryItemPresentation(itemId, Math.max(0, Number(count || 0))));

        worldInventoryItems.innerHTML = entries.length
          ? entries.map((item) => `
              <article class="world-inventory-card">
                <div class="world-inventory-card-icon">${item.icon}</div>
                <div class="world-inventory-card-body">
                  <div class="world-inventory-card-topline">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>x${item.count}</span>
                  </div>
                  <p>${escapeHtml(item.description)}</p>
                  <small>${escapeHtml(item.usage)}</small>
                </div>
              </article>
            `).join("")
          : `<div class="world-inventory-empty">Sua mochila ainda não possui consumíveis.</div>`;
      }

      if (worldInventoryDiplomas) {
        worldInventoryDiplomas.innerHTML = diplomas.length
          ? diplomas.map((diploma) => `
              <article class="world-inventory-card diploma">
                <div class="world-inventory-card-icon">📜</div>
                <div class="world-inventory-card-body">
                  <div class="world-inventory-card-topline">
                    <strong>${escapeHtml(diploma.name || "Diploma")}</strong>
                    <span>Conquistado</span>
                  </div>
                  <p>${diploma.abilityName
                    ? `Concede a competência permanente ${escapeHtml(diploma.abilityName)}.`
                    : "Diploma conquistado ao concluir um Reino do Conhecimento."}</p>
                  <small>${diploma.earnedAt ? `Registrado em ${new Date(diploma.earnedAt).toLocaleDateString("pt-BR")}` : "Conquista permanente"}</small>
                </div>
              </article>
            `).join("")
          : `<div class="world-inventory-empty">Nenhum diploma conquistado ainda.</div>`;
      }

      if (worldInventoryAbilities) {
        worldInventoryAbilities.innerHTML = abilities.length
          ? abilities.map((diploma) => `
              <article class="world-inventory-card ability">
                <div class="world-inventory-card-icon">${diploma.abilityId === "leitura-critica" ? "📖" : diploma.abilityId === "reflexos-treinados" ? "🏅" : "🧠"}</div>
                <div class="world-inventory-card-body">
                  <div class="world-inventory-card-topline">
                    <strong>${escapeHtml(diploma.abilityName || "Competência")}</strong>
                    <span>Permanente</span>
                  </div>
                  <p>${escapeHtml(diploma.abilityDescription || "Competência desbloqueada por um diploma.")}</p>
                  <small>Disponível automaticamente quando aplicável.</small>
                </div>
              </article>
            `).join("")
          : `<div class="world-inventory-empty">Conclua reinos para desbloquear competências permanentes.</div>`;
      }

      if (worldInventoryMessage) {
        worldInventoryMessage.textContent = message || "Consumíveis de batalha não podem ser gastos aqui. Pressione I ou Esc para fechar.";
      }
    }



    function getStudentRealmProgressSummary(realm) {
      const profile = window.VoltzProfile?.state?.profile;
      const progress = profile?.progresso?.[realm.id] || {};
      const completed = Boolean(progress.completed || progress.guardianChallengeCompleted || progress.bossDefeated);
      const defeated = Array.isArray(progress.defeatedEnemyIds) ? progress.defeatedEnemyIds.length : 0;
      const equations = Array.isArray(progress.solvedWorldEquationIds) ? progress.solvedWorldEquationIds.length : 0;
      const pieces = [];

      if (realm.id === "reino-matematica") {
        pieces.push(`Inimigos ${defeated}/9`);
        pieces.push(`Equações ${equations}/3`);
        pieces.push(progress.miniBossDefeated ? "Melog ✓" : "Melog —");
        pieces.push(progress.guardianChallengeCompleted || progress.bossDefeated ? "Golem ✓" : "Golem —");
      } else if (realm.id === "reino-gramatica") {
        pieces.push(`Inimigos ${defeated}/9`);
        pieces.push(`Palavras ${equations}/3`);
        pieces.push(progress.miniBossDefeated ? "Ortcepse ✓" : "Ortcepse —");
        pieces.push(progress.guardianChallengeCompleted || progress.bossDefeated ? "Espectro ✓" : "Espectro —");
      } else if (realm.id === "reino-educacao-fisica") {
        const sports = Array.isArray(progress.completedMinigameIds) ? progress.completedMinigameIds.length : 0;
        pieces.push(`Modalidades ${sports}/5`);
        pieces.push(progress.guardianChallengeCompleted || progress.bossDefeated ? "Pentatlo ✓" : sports >= 5 ? "Pentatlo liberado" : "Pentatlo —");
      } else {
        pieces.push(realm.unlocked ? "Disponível" : "Ainda não liberado");
      }

      return { completed, pieces };
    }

    function renderStudentTerminal() {
      if (!studentTerminalPanel) return;
      const profile = window.VoltzProfile?.state?.profile;
      const progress = profile?.progresso || {};
      const worldProgress = progress._world && typeof progress._world === "object" ? progress._world : {};
      const diplomas = Object.values(window.VoltzProfile?.getDiplomas?.() || {}).filter((item) => item && typeof item === "object");
      const abilities = diplomas.filter((item) => item.abilityName || item.abilityId);
      const completedRealmIds = Array.isArray(worldProgress.completedRealmIds) ? worldProgress.completedRealmIds : [];
      const gameCompletions = Math.max(0, Number(worldProgress.gameCompletions || 0));

      if (studentTerminalSummary) {
        studentTerminalSummary.innerHTML = `
          <div class="student-terminal-stat"><span>Aluno</span><strong>${escapeHtml(profile?.nome || "Aluno")}</strong></div>
          <div class="student-terminal-stat"><span>XP</span><strong>${Math.max(0, Number(profile?.xp || 0)).toLocaleString("pt-BR")}</strong></div>
          <div class="student-terminal-stat"><span>Moedas</span><strong>${Math.max(0, Number(profile?.moedas || 0)).toLocaleString("pt-BR")}</strong></div>
          <div class="student-terminal-stat"><span>Diplomas</span><strong>${diplomas.length}</strong></div>
          <div class="student-terminal-stat"><span>Reinos concluídos</span><strong>${completedRealmIds.length}</strong></div>
          <div class="student-terminal-stat"><span>Jogo zerado</span><strong>${gameCompletions}×</strong></div>`;
      }

      if (studentTerminalRealms) {
        studentTerminalRealms.innerHTML = realmOptions.map((realm) => {
          const summary = getStudentRealmProgressSummary(realm);
          const status = summary.completed ? "Concluído" : realm.unlocked ? "Em andamento" : "Bloqueado";
          return `
            <article class="student-realm-card ${summary.completed ? "completed" : ""} ${!realm.unlocked ? "locked" : ""}">
              <div class="student-realm-top">
                <div class="student-realm-name">${escapeHtml(realm.icon || "◇")} ${escapeHtml(realm.name)}</div>
                <span class="student-realm-status">${status}</span>
              </div>
              <p>${escapeHtml(realm.description || "Reino do Conhecimento.")}</p>
              <div class="student-realm-progress">${summary.pieces.map((piece) => `<span>${escapeHtml(piece)}</span>`).join("")}</div>
            </article>`;
        }).join("");
      }

      if (studentTerminalAbilities) {
        studentTerminalAbilities.innerHTML = abilities.length
          ? abilities.map((item) => `
              <article class="student-ability-card">
                <strong>${item.abilityId === "leitura-critica" ? "📖" : item.abilityId === "reflexos-treinados" ? "🏅" : "🧠"} ${escapeHtml(item.abilityName || "Competência")}</strong>
                <p>${escapeHtml(item.abilityDescription || "Competência permanente desbloqueada por um diploma.")}</p>
              </article>`).join("")
          : `<div class="student-terminal-empty">Conclua um Reino e conquiste seu diploma para desbloquear competências permanentes.</div>`;
      }
    }

    function openStudentTerminalPanel() {
      if (!studentTerminalPanel || enemyPanelOpen) return;
      if (worldInventoryOpen) closeWorldInventory();
      if (shopPanelOpen) closeShopPanel();
      if (realmPanelOpen) closeRealmPanel();
      if (hallFamePanelOpen) closeHallOfFamePanel();
      if (libraryArchiveOpen) closeLibraryArchivePanel();
      if (worldEquationPanelOpen) closeWorldEquationPanel();
      studentTerminalOpen = true;
      stopPlayerForOverlay();
      renderStudentTerminal();
      studentTerminalPanel.classList.add("visible");
      studentTerminalPanel.setAttribute("aria-hidden", "false");
      interactionText.textContent = "Terminal do Aluno aberto.";
    }

    function closeStudentTerminalPanel() {
      if (!studentTerminalOpen) return;
      studentTerminalOpen = false;
      studentTerminalPanel?.classList.remove("visible");
      studentTerminalPanel?.setAttribute("aria-hidden", "true");
      updateHint();
    }

    function renderLibraryArchive() {
      if (!libraryArchivePanel) return;
      const mathProgressProfile = window.VoltzProfile?.getRealmProgress?.("reino-matematica") || {};
      const defeated = Array.isArray(mathProgressProfile.defeatedEnemyIds) ? mathProgressProfile.defeatedEnemyIds.length : 0;
      const equations = Array.isArray(mathProgressProfile.solvedWorldEquationIds) ? mathProgressProfile.solvedWorldEquationIds.length : 0;
      const diploma = window.VoltzProfile?.hasRealmDiploma?.("reino-matematica");
      const topics = [
        {
          icon: "➗", title: "Matemática",
          text: "O Reino da Matemática exige exploração e domínio progressivo, não apenas uma sequência de perguntas.",
          bullets: ["Estabilize as Equações do Mundo.", "Derrote pelo menos 6 inimigos comuns.", "Supere Melog e depois demonstre aprendizado ao Golem."]
        },
        {
          icon: "⚔️", title: "Combate",
          text: "Acertos causam dano; erros e tempo esgotado reduzem sua energia. A explicação aparece depois da resposta.",
          bullets: ["Leia o enunciado antes de olhar as alternativas.", "Use o tempo para raciocinar, não para chutar.", "Na Arena, treino não altera o save."]
        },
        {
          icon: "🎒", title: "Recursos",
          text: "A Mochila guarda consumíveis e competências permanentes.",
          bullets: ["Dica de Foco: comprada na Loja Voltz por 15 moedas.", "Raciocínio Estruturado: competência permanente do Diploma da Matemática.", "Consumíveis não podem ser gastos na Arena."]
        },
        {
          icon: "🌌", title: "Reinos",
          text: "Cada matéria será um Reino próprio com identidade visual, progressão e um diploma temático.",
          bullets: ["Matemática é o primeiro Reino jogável.", "Os próximos aparecem no Portal como destinos futuros.", "O Terminal do Aluno reúne seu progresso em todos eles."]
        }
      ];

      if (libraryTopicGrid) {
        libraryTopicGrid.innerHTML = topics.map((topic) => `
          <article class="library-topic-card">
            <strong>${topic.icon} ${escapeHtml(topic.title)}</strong>
            <p>${escapeHtml(topic.text)}</p>
            <ul>${topic.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
          </article>`).join("");
      }
      if (libraryProgressNote) {
        libraryProgressNote.innerHTML = `Seu registro atual em Matemática: <strong>${defeated}/9 inimigos</strong> · <strong>${equations}/3 Equações do Mundo</strong> · Diploma ${diploma ? "conquistado ✓" : "ainda não conquistado"}.`;
      }
    }

    function openLibraryArchivePanel() {
      if (!libraryArchivePanel || enemyPanelOpen) return;
      if (worldInventoryOpen) closeWorldInventory();
      if (shopPanelOpen) closeShopPanel();
      if (realmPanelOpen) closeRealmPanel();
      if (hallFamePanelOpen) closeHallOfFamePanel();
      if (studentTerminalOpen) closeStudentTerminalPanel();
      if (worldEquationPanelOpen) closeWorldEquationPanel();
      libraryArchiveOpen = true;
      stopPlayerForOverlay();
      renderLibraryArchive();
      libraryArchivePanel.classList.add("visible");
      libraryArchivePanel.setAttribute("aria-hidden", "false");
      interactionText.textContent = "Acervo de Consulta aberto.";
    }

    function closeLibraryArchivePanel() {
      if (!libraryArchiveOpen) return;
      libraryArchiveOpen = false;
      libraryArchivePanel?.classList.remove("visible");
      libraryArchivePanel?.setAttribute("aria-hidden", "true");
      updateHint();
    }

    window.openStudentTerminalPanel = openStudentTerminalPanel;
    window.closeStudentTerminalPanel = closeStudentTerminalPanel;
    window.openLibraryArchivePanel = openLibraryArchivePanel;
    window.closeLibraryArchivePanel = closeLibraryArchivePanel;

    function hallEscape(value) {
      return escapeHtml(String(value ?? ""));
    }

    function formatHallNumber(value) {
      return Math.max(0, Number(value || 0)).toLocaleString("pt-BR");
    }

    function renderHallEntryCard(entry, medal, cardClass = "") {
      if (!entry) {
        return `<article class="hall-fame-card ${cardClass}"><div class="hall-fame-medal">${medal}</div><div class="hall-fame-name">Vaga aberta</div><div class="hall-fame-stats"><span>Aguardando novo aluno...</span></div></article>`;
      }
      return `
        <article class="hall-fame-card ${cardClass} ${entry.isCurrentUser ? "current" : ""}">
          <div class="hall-fame-medal">${medal}</div>
          <div class="hall-fame-name">${hallEscape(entry.name)}${entry.isCurrentUser ? " · você" : ""}</div>
          <div class="hall-fame-stats">
            <span>🏁 ${formatHallNumber(entry.completions)} conclusão${entry.completions === 1 ? "" : "ões"}</span>
            <span>🎓 ${formatHallNumber(entry.diplomas)} diploma${entry.diplomas === 1 ? "" : "s"}</span>
            <span>⚡ ${formatHallNumber(entry.xp)} XP</span>
          </div>
        </article>`;
    }

    function renderHallOfFameEntries(entries, currentUser) {
      const ordered = Array.isArray(entries) ? [...entries].sort((a,b) => a.position - b.position) : [];
      const top = [1,2,3].map((p) => ordered.find((e) => e.position === p) || null);

      if (hallFamePodium) {
        hallFamePodium.innerHTML = [
          renderHallEntryCard(top[1], "🥈", "second"),
          renderHallEntryCard(top[0], "🥇", "first"),
          renderHallEntryCard(top[2], "🥉", "third")
        ].join("");
      }

      const rows = ordered.filter((e) => e.position >= 4 && e.position <= 10);
      if (hallFameList) {
        hallFameList.innerHTML = rows.length ? rows.map((entry) => `
          <div class="hall-fame-row ${entry.isCurrentUser ? "current" : ""}">
            <span class="hall-fame-position">#${entry.position}</span>
            <strong>${hallEscape(entry.name)}${entry.isCurrentUser ? " · você" : ""}</strong>
            <span>🏁 ${formatHallNumber(entry.completions)}</span>
            <span>🎓 ${formatHallNumber(entry.diplomas)}</span>
            <span>⚡ ${formatHallNumber(entry.xp)} XP</span>
          </div>`).join("") : `<div class="hall-fame-status">Ainda não há alunos entre o 4º e o 10º lugar.</div>`;
      }

      if (hallFameCurrent) {
        hallFameCurrent.innerHTML = currentUser
          ? `<strong>Sua posição: #${currentUser.position}</strong> · ${hallEscape(currentUser.name)} · 🏁 ${formatHallNumber(currentUser.completions)} · 🎓 ${formatHallNumber(currentUser.diplomas)} · ⚡ ${formatHallNumber(currentUser.xp)} XP`
          : "Sua posição será exibida assim que o perfil entrar na classificação.";
      }
    }

    async function refreshHallOfFame() {
      if (hallFameLoading) return;
      hallFameLoading = true;
      if (hallFameStatus) {
        hallFameStatus.className = "hall-fame-status";
        hallFameStatus.textContent = "Sincronizando com o Hall da Fama...";
      }

      try {
        const result = await window.VoltzProfile?.fetchLeaderboard?.(10);
        if (!result?.ok) throw result?.error || new Error("Não foi possível carregar o ranking.");
        renderHallOfFameEntries(result.entries, result.currentUser);
        if (hallFameStatus) {
          hallFameStatus.className = "hall-fame-status";
          hallFameStatus.textContent = `${result.entries.filter((entry) => entry.position <= 10).length} aluno(s) no quadro atual · ranking sincronizado com o Supabase.`;
        }
      } catch (error) {
        console.error("Falha ao carregar Hall da Fama:", error);
        if (hallFameStatus) {
          hallFameStatus.className = "hall-fame-status error";
          hallFameStatus.textContent = `Falha ao carregar ranking: ${error?.message || "erro desconhecido"}`;
        }
      } finally {
        hallFameLoading = false;
      }
    }

    function openHallOfFamePanel() {
      if (!hallFamePanel || enemyPanelOpen) return;
      if (worldInventoryOpen) closeWorldInventory();
      if (shopPanelOpen) closeShopPanel();
      if (realmPanelOpen) closeRealmPanel();
      if (worldEquationPanelOpen) closeWorldEquationPanel();

      hallFamePanelOpen = true;
      clearMovementKeys();
      playerState.moving = false;
      updatePlayerAnimation();
      hallFamePanel.classList.add("visible");
      hallFamePanel.setAttribute("aria-hidden", "false");
      interactionText.textContent = "Consultando o Hall da Fama.";
      refreshHallOfFame();
    }

    function closeHallOfFamePanel() {
      if (!hallFamePanelOpen) return;
      hallFamePanelOpen = false;
      hallFamePanel?.classList.remove("visible");
      hallFamePanel?.setAttribute("aria-hidden", "true");
      interactionText.textContent = currentScene?.defaultHint || "Explore o mundo.";
    }

    window.openHallOfFamePanel = openHallOfFamePanel;
    window.closeHallOfFamePanel = closeHallOfFamePanel;
    window.refreshHallOfFame = refreshHallOfFame;

    function openWorldInventory() {
      if (!worldInventoryPanel || enemyPanelOpen) return;

      if (dialogueOpen) closeDialogue();
      if (realmPanelOpen) closeRealmPanel();
      if (shopPanelOpen) closeShopPanel();
      if (hallFamePanelOpen) closeHallOfFamePanel();
      if (studentTerminalOpen) closeStudentTerminalPanel();
      if (libraryArchiveOpen) closeLibraryArchivePanel();
      if (worldEquationPanelOpen) closeWorldEquationPanel();

      worldInventoryOpen = true;
      stopPlayerForOverlay();
      renderWorldInventory();

      worldInventoryPanel.classList.add("visible");
      worldInventoryPanel.setAttribute("aria-hidden", "false");
      worldInventoryButton?.setAttribute("aria-expanded", "true");
      document.body.classList.add("world-inventory-open");
      interactionText.textContent = "Mochila aberta. Consulte seus itens, diplomas e competências.";
    }

    function closeWorldInventory() {
      if (!worldInventoryOpen) return;

      worldInventoryOpen = false;
      worldInventoryPanel?.classList.remove("visible");
      worldInventoryPanel?.setAttribute("aria-hidden", "true");
      worldInventoryButton?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("world-inventory-open");
      updateHint();
    }

    async function buyShopHint() {
      if (!shopPanelOpen || shopPurchaseBusy) return;

      if (!window.VoltzProfile?.purchaseItem) {
        renderShopPanel("Não foi possível acessar seu inventário agora.");
        return;
      }

      shopPurchaseBusy = true;
      renderShopPanel();

      try {
        const result = await window.VoltzProfile.purchaseItem("dica-foco", 15, 1);

        if (!result?.ok) {
          if (result?.reason === "coins") {
            renderShopPanel(`Você precisa de 15 moedas. Saldo atual: ${result.available || 0}.`);
          } else {
            renderShopPanel("Não foi possível concluir a compra. Tente novamente.");
          }
          return;
        }

        renderShopPanel(`Compra concluída! Você agora tem ${result.count} Dica${result.count === 1 ? "" : "s"} de Foco.`);
      } catch (error) {
        console.error("Falha ao comprar Dica de Foco:", error);
        renderShopPanel("Não foi possível concluir a compra. Tente novamente.");
      } finally {
        shopPurchaseBusy = false;
        renderShopPanel(shopMessage?.textContent || "");
      }
    }

    function applyZoneMarkers(scene) {
      document.querySelectorAll(".zone-marker[data-dynamic-zone]").forEach((marker) => marker.remove());
      if (!debugMode) return;

      (scene.zoneMarkers || []).forEach((zone) => {
        const marker = document.createElement("div");
        marker.className = "zone-marker";
        marker.dataset.dynamicZone = "true";
        marker.style.left = `${zone.x}px`;
        marker.style.top = `${zone.y}px`;
        marker.textContent = zone.label;
        world.appendChild(marker);
      });
    }

    function applySceneVisualState(scene) {
      interiorSystem.applySceneVisualState(scene, {
        world,
        viewport,
        layer: interiorLayer,
        baseSceneClasses: [
          "scene-village",
          ...Object.values(sourceData.realms || {})
            .map((realm) => realm?.scene?.className)
            .filter(Boolean)
        ]
      });

      const centerPlaza = document.querySelector(".center-plaza");
      if (centerPlaza) {
        centerPlaza.innerHTML = scene.plazaLabel;
      }

      const brandSubtitle = document.querySelector(".brand span");
      if (brandSubtitle) {
        brandSubtitle.textContent = scene.name.toUpperCase();
      }

      applyZoneMarkers(scene);
    }

    function clearMovementKeys() {
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
    }

    function shouldShowNpcForProgress(realmId, npc) {
      if (!npc) return false;
      if (npc.showWhenGuardianCompleted) return isRealmGuardianCompleted(realmId);
      if (npc.hideWhenGuardianCompleted) return !isRealmGuardianCompleted(realmId);
      return true;
    }

    function getNpcObjectsForScene(scene) {
      return cloneData(scene?.npcObjects || []).filter((npc) => shouldShowNpcForProgress(scene?.id, npc));
    }

    function refreshConditionalNpcObjectsAfterProgress(realmId) {
      if (!currentScene || currentScene.id !== realmId) return;
      npcObjects = getNpcObjectsForScene(currentScene);
      buildCollisionAndOcclusionData();
      renderDepthLayer();
      updateNearbyNpc();
    }

    function changeScene(scene, options = {}) {
      currentScene = scene;
      buildings = cloneData(scene.buildings);
      decorObjects = cloneData(scene.decorObjects);
      treeObjects = cloneData(scene.treeObjects);
      npcObjects = getNpcObjectsForScene(scene);
      portalObjects = cloneData(scene.portalObjects);
      worldEquationObjects = cloneData(scene.worldEquations || []);
      enemyObjects = getEnemyObjectsForScene(scene);

      if (worldEquationPanelOpen) closeWorldEquationPanel();
      if (hallFamePanelOpen) closeHallOfFamePanel();
      if (studentTerminalOpen) closeStudentTerminalPanel();
      if (libraryArchiveOpen) closeLibraryArchivePanel();
      nearbyNpc = null;
      nearbyWorldEquation = null;
      nearbyEnemy = null;
      nearbyPortal = null;
      lastCollisionLabel = "livre";
      currentOcclusionLabel = "nada";

      applySceneVisualState(scene);
      // Cada reino pode ter dimensões próprias. Recalcula após aplicar a classe visual
      // para câmera, limites do jogador e colisões usarem o tamanho real da cena.
      updateWorldSizeFromCss();
      buildCollisionAndOcclusionData();

      const spawn = options.spawn || scene.spawn;
      playerState.x = spawn.x;
      playerState.y = spawn.y;
      playerState.direction = options.direction || "baixo";
      playerState.moving = false;
      playerState.targetScale = scene.playerScale || 1;
      cameraState.targetZoom = scene.cameraZoom || 1;
      clearMovementKeys();
      sceneTransitionLockedUntil = performance.now() + 650;

      if (!options.animateCamera) {
        playerState.scale = playerState.targetScale;
        cameraState.zoom = cameraState.targetZoom;
      }

      renderDepthLayer();
      renderColliderDebugLayer();
      updatePlayerPosition();
      updatePlayerAnimation();

      if (options.animateCamera) {
        applyCameraTransform();
      } else {
        snapCameraToPlayer();
      }
      updateOcclusionVisibility();
      updateNearbyNpc();
      updateNearbyPortal();
      updateNearbyEnemy();
      updateNearbyWorldEquation();
      updateMathBuffHud();
      updateDebug();
      interactionText.textContent = scene.defaultHint;
      window.VoltzSports?.onSceneChanged?.(scene.id);
      window.VoltzAudio?.playSceneMusic?.(scene.id);
    }

    function resolveSceneById(sceneId) {
      if (sceneId === villageScene.id) return villageScene;

      const realmScene = getSceneForRealm(sceneId);
      if (realmScene) return realmScene;

      return interiorSystem.getScene(sceneId);
    }

    function performSceneTransition(transition) {
      const targetScene = resolveSceneById(transition.targetSceneId);

      if (!targetScene) {
        console.error(`[Voltz Interiors] Cena de destino não encontrada: ${transition.targetSceneId}.`);
        return false;
      }

      changeScene(targetScene, transition.options);
      interactionText.textContent = transition.message;
      return true;
    }

    function updateSceneTransitions() {
      if (performance.now() < sceneTransitionLockedUntil) return false;

      const transition = interiorSystem.findTransition({
        currentScene,
        footPoint: getPlayerFootPoint(),
        keys
      });

      return transition ? performSceneTransition(transition) : false;
    }

    function selectRealm(realmId) {
      const realm = realmOptions.find((item) => item.id === realmId);
      if (!realm || !realm.unlocked) return;

      const targetScene = getSceneForRealm(realmId);
      if (!targetScene) {
        realmMessage.textContent = `${realm.name}: os dados deste reino ainda não foram carregados.`;
        return;
      }

      realmMessage.textContent = `Carregando ${realm.name}...`;
      closeRealmPanel();
      changeScene(targetScene);
    }

    function interactWithNearbyPortal() {
      // O portal é visual nesta etapa. A seleção de reinos acontece conversando com o Guardião.
      return false;
    }


    function getEnemyType(enemy) {
      if (enemy?.typeOverride && typeof enemy.typeOverride === "object") {
        return enemy.typeOverride;
      }
      const realmData = getLoadedRealmData(currentScene?.id);
      const typeRegistry = realmData?.enemyTypes || enemyTypes;
      return typeRegistry[enemy.typeId] || Object.values(typeRegistry)[0] || enemyTypes["soma-subtracao"];
    }

    function getEnemySortY(enemy) {
      return Math.round(enemy.y + 10);
    }

    function getEnemyCollider(enemy) {
      const type = getEnemyType(enemy);
      return {
        id: `${enemy.id}-zona`,
        label: `${type.name} / alcance`,
        x: enemy.x - 28,
        y: enemy.y - 20,
        w: 56,
        h: 34,
        debugClass: "enemy-collider-debug"
      };
    }

    function getEnemyDistance(enemy) {
      const footPoint = getPlayerFootPoint();
      const dx = footPoint.x - enemy.x;
      const dy = footPoint.y - enemy.y;
      return Math.hypot(dx, dy);
    }

    function getNearestEnemyInRange() {
      const interactionRange = 92;
      return enemyObjects
        .filter((enemy) => !enemy.defeatedPending)
        .map((enemy) => ({ enemy, distance: getEnemyDistance(enemy) }))
        .filter((entry) => entry.distance <= interactionRange)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy || null;
    }

    function updateNearbyEnemy() {
      nearbyEnemy = getNearestEnemyInRange();

      document.querySelectorAll("[data-enemy-id]").forEach((element) => {
        element.classList.toggle("nearby", nearbyEnemy && element.dataset.enemyId === nearbyEnemy.id);
      });
    }

    function updateEnemyMovement() {
      if (!enemyObjects.length || dialogueOpen || realmPanelOpen || enemyPanelOpen) return;

      const now = performance.now();

      enemyObjects.forEach((enemy) => {
        if (enemy.defeatedPending) return;
        enemy.lastX = enemy.x;
        enemy.lastY = enemy.y;

        const t = now * enemy.speed + enemy.phase;

        if (enemy.patrol === "vertical") {
          enemy.x = enemy.originX + Math.sin(t * 0.72) * enemy.rangeX;
          enemy.y = enemy.originY + Math.sin(t) * enemy.rangeY;
        } else if (enemy.patrol === "circle") {
          enemy.x = enemy.originX + Math.cos(t) * enemy.rangeX;
          enemy.y = enemy.originY + Math.sin(t) * enemy.rangeY;
        } else {
          enemy.x = enemy.originX + Math.cos(t) * enemy.rangeX;
          enemy.y = enemy.originY + Math.sin(t * 0.72) * enemy.rangeY;
        }

        const dx = enemy.x - enemy.lastX;
        const dy = enemy.y - enemy.lastY;

        if (Math.abs(dx) > Math.abs(dy)) {
          enemy.direction = dx >= 0 ? "direita" : "esquerda";
        } else {
          enemy.direction = dy >= 0 ? "baixo" : "cima";
        }
      });

      updateEnemyDomPositions();

      if (keys.debugColliders) {
        renderColliderDebugLayer();
      }
    }

    function updateEnemyDomPositions() {
      enemyObjects.forEach((enemy) => {
        const element = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
        if (!element) return;

        element.style.left = `${enemy.x}px`;
        element.style.top = `${enemy.y}px`;
        element.style.zIndex = `${getEnemySortY(enemy)}`;
        element.dataset.direction = enemy.direction;
      });
    }

    function enemySvg(enemy) {
      const type = getEnemyType(enemy);

      if (currentScene?.id === "reino-gramatica" && type.battleImage) {
        return `<img class="enemy-map-image" src="${escapeHtml(type.battleImage)}" alt="${escapeHtml(type.name)}" />`;
      }

      if (type.family === "orthography") {
        return `
          <svg class="enemy-svg enemy-svg-orthography" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
            <ellipse cx="65" cy="132" rx="36" ry="10" fill="rgba(0,0,0,.34)"></ellipse>
            <ellipse cx="65" cy="78" rx="48" ry="54" fill="${type.aura}"></ellipse>
            <path d="M34 119 C24 87,31 51,65 35 C99 51,106 87,96 119 C83 136,47 136,34 119Z" fill="${type.colorA}" stroke="rgba(255,255,255,.8)" stroke-width="4"></path>
            <text x="65" y="83" text-anchor="middle" fill="#080512" font-size="42" font-weight="950">Aa</text>
            <path d="M27 52 L104 108 M31 111 L103 47" stroke="${type.colorB}" stroke-width="4" opacity=".7"></path>
            <circle cx="48" cy="101" r="5" fill="#080512"></circle><circle cx="82" cy="101" r="5" fill="#080512"></circle>
          </svg>`;
      }

      if (type.family === "syntax") {
        return `
          <svg class="enemy-svg enemy-svg-syntax" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
            <ellipse cx="65" cy="132" rx="38" ry="11" fill="rgba(0,0,0,.35)"></ellipse>
            <ellipse cx="65" cy="78" rx="49" ry="55" fill="${type.aura}"></ellipse>
            <path d="M29 48 H101 V121 H29Z" rx="16" fill="${type.colorA}" stroke="rgba(255,255,255,.8)" stroke-width="4"></path>
            <path d="M42 66 H88 M42 82 H73 M56 98 H93" stroke="${type.colorB}" stroke-width="7" stroke-linecap="round"></path>
            <text x="65" y="40" text-anchor="middle" fill="${type.colorB}" font-size="29" font-weight="950">{ }</text>
            <circle cx="48" cy="113" r="5" fill="#080512"></circle><circle cx="82" cy="113" r="5" fill="#080512"></circle>
          </svg>`;
      }

      if (type.family === "semantics") {
        return `
          <svg class="enemy-svg enemy-svg-semantics" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
            <ellipse cx="65" cy="132" rx="38" ry="11" fill="rgba(0,0,0,.35)"></ellipse>
            <ellipse cx="65" cy="78" rx="50" ry="56" fill="${type.aura}"></ellipse>
            <path d="M65 31 C100 31,111 57,97 80 C111 103,96 128,65 128 C34 128,19 103,33 80 C19 57,30 31,65 31Z" fill="${type.colorA}" stroke="rgba(255,255,255,.82)" stroke-width="4"></path>
            <text x="65" y="78" text-anchor="middle" fill="#071412" font-size="31" font-weight="950">…?</text>
            <path d="M34 93 C51 83,79 83,96 93" stroke="${type.colorB}" stroke-width="6" fill="none" stroke-linecap="round"></path>
            <circle cx="49" cy="108" r="5" fill="#071412"></circle><circle cx="81" cy="108" r="5" fill="#071412"></circle>
          </svg>`;
      }

      const isSoma = enemy.typeId === "soma-subtracao";
      const isFator = enemy.typeId === "multiplicacao-divisao";

      if (isSoma) {
        return `
          <svg class="enemy-svg enemy-svg-soma" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
            <ellipse cx="65" cy="130" rx="34" ry="10" fill="rgba(0,0,0,0.34)"></ellipse>
            <ellipse cx="65" cy="80" rx="46" ry="50" fill="${type.aura}"></ellipse>
            <path d="M32 112 C24 78, 36 44, 65 38 C94 44, 106 78, 98 112 C88 130, 42 130, 32 112Z" fill="${type.colorA}" stroke="rgba(245,251,255,0.78)" stroke-width="4"></path>
            <circle cx="50" cy="70" r="7" fill="#02040d"></circle>
            <circle cx="80" cy="70" r="7" fill="#02040d"></circle>
            <path d="M48 94 C56 101, 75 101, 83 94" stroke="#02040d" stroke-width="5" fill="none" stroke-linecap="round"></path>
            <path d="M66 26 L66 50 M54 38 L78 38" stroke="${type.colorB}" stroke-width="8" stroke-linecap="round"></path>
            <path d="M25 78 L6 78 M124 78 L105 78" stroke="${type.colorB}" stroke-width="8" stroke-linecap="round"></path>
          </svg>
        `;
      }

      if (isFator) {
        return `
          <svg class="enemy-svg enemy-svg-fator" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
            <ellipse cx="65" cy="130" rx="38" ry="11" fill="rgba(0,0,0,0.36)"></ellipse>
            <ellipse cx="65" cy="82" rx="50" ry="54" fill="${type.aura}"></ellipse>
            <path d="M34 118 L26 76 L48 42 L82 42 L104 76 L96 118 C84 134 46 134 34 118Z" fill="${type.colorB}" stroke="rgba(245,251,255,0.78)" stroke-width="4" stroke-linejoin="round"></path>
            <path d="M42 82 L88 82 M47 64 L83 100 M83 64 L47 100" stroke="#02040d" stroke-width="5" stroke-linecap="round"></path>
            <circle cx="49" cy="57" r="6" fill="#02040d"></circle>
            <circle cx="81" cy="57" r="6" fill="#02040d"></circle>
            <circle cx="65" cy="114" r="10" fill="${type.colorA}" stroke="#ffffff" stroke-width="3"></circle>
          </svg>
        `;
      }

      return `
        <svg class="enemy-svg enemy-svg-raiz" viewBox="0 0 130 150" role="img" aria-label="${type.name}">
          <ellipse cx="65" cy="132" rx="36" ry="11" fill="rgba(0,0,0,0.36)"></ellipse>
          <ellipse cx="65" cy="78" rx="48" ry="56" fill="${type.aura}"></ellipse>
          <path d="M65 22 L104 58 L91 122 L65 138 L39 122 L26 58Z" fill="${type.colorB}" stroke="rgba(245,251,255,0.82)" stroke-width="4" stroke-linejoin="round"></path>
          <path d="M46 58 L58 102 L87 45" fill="none" stroke="${type.colorA}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M86 45 H110" stroke="${type.colorA}" stroke-width="8" stroke-linecap="round"></path>
          <circle cx="50" cy="82" r="6" fill="#02040d"></circle>
          <circle cx="81" cy="82" r="6" fill="#02040d"></circle>
          <path d="M54 106 C60 111, 70 111, 76 106" stroke="#02040d" stroke-width="5" fill="none" stroke-linecap="round"></path>
        </svg>
      `;
    }

    function getQuestionForEnemy(enemy) {
      const type = getEnemyType(enemy);
      const questions = type.questions || [];
      const index = enemy.questionIndex % questions.length;
      return questions[index];
    }


    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function interactWithNearbyEnemy() {
      if (enemyPanelOpen) return;
      updateNearbyEnemy();
      if (nearbyEnemy) {
        openEnemyEncounter(nearbyEnemy);
        return true;
      }
      return false;
    }

    function getNpcSortY(npc) {
      return Math.round(npc.y + 8);
    }

    function getNpcCollider(npc) {
      return {
        id: `${npc.id}-pes`,
        label: `${npc.name} / NPC`,
        x: npc.x - 16,
        y: npc.y - 8,
        w: 32,
        h: 18,
        debugClass: "npc-collider-debug"
      };
    }

    function getNpcDistance(npc) {
      const footPoint = getPlayerFootPoint();
      const dx = footPoint.x - npc.x;
      const dy = footPoint.y - npc.y;
      return Math.hypot(dx, dy);
    }

    function getNearestNpcInRange() {
      const interactionRange = 92;
      return npcObjects
        .map((npc) => ({ npc, distance: getNpcDistance(npc) }))
        .filter((entry) => entry.distance <= interactionRange)
        .sort((a, b) => a.distance - b.distance)[0]?.npc || null;
    }

    function updateNearbyNpc() {
      nearbyNpc = getNearestNpcInRange();

      document.querySelectorAll("[data-npc-id]").forEach((element) => {
        element.classList.toggle("nearby", nearbyNpc && element.dataset.npcId === nearbyNpc.id);
      });
    }

    function getNpcDialogueLines(npc) {
      if (npc && npc.dynamicDialogue === "math-progress") {
        return getMathProgressDialogue();
      }

      if (npc && npc.dynamicDialogue === "melog-gate") {
        return getMelogGateDialogue();
      }

      if (npc && npc.dynamicDialogue === "golem-gate") {
        return getGolemGateDialogue();
      }

      if (npc && npc.dynamicDialogue === "math-guardian-completed") {
        return getMathGuardianCompletedDialogue();
      }

      if (npc && npc.dynamicDialogue === "portuguese-progress") {
        return getPortugueseProgressDialogue();
      }

      if (npc && npc.dynamicDialogue === "portuguese-mini-gate") {
        return getPortugueseMiniGateDialogue();
      }

      if (npc && npc.dynamicDialogue === "portuguese-boss-gate") {
        return getPortugueseBossGateDialogue();
      }

      if (Array.isArray(npc.dialogue)) {
        return npc.dialogue;
      }

      return [npc.dialogue || "..."];
    }

    function getMathProgressDialogue() {
      const state = getMathProgressionState();
      const rhythm = getMathLogicalRhythmState();

      if (isRealmGuardianCompleted("reino-matematica")) {
        return [
          "Status do Reino da Matemática: concluído.",
          "A Praça do Infinito, as zonas de estudo, as Ruínas do Melog e a Fortaleza do Golem registram sua passagem.",
          "Diploma da Matemática: conquistado. Competência permanente: Raciocínio Estruturado.",
          `Ritmo Lógico estabilizado em ${rhythm.stacks}/3 nesta jornada.`
        ];
      }

      if (state.bossUnlocked) {
        return [
          "Etapa 4/4: Fortaleza do Golem.",
          "Melog foi superado e o Portão do Teorema se abriu ao norte.",
          "O Golem dos Cálculos aguarda no último pátio para o teste final."
        ];
      }

      if (state.miniBossUnlocked) {
        return [
          "Etapa 3/4: Ruínas do Melog.",
          `Requisitos cumpridos: ${state.defeatedCommons}/${state.requiredCommons} inimigos necessários e ${state.solvedRequiredEquations}/${state.requiredEquationIds.length} Equações do Mundo.`,
          "O selo se rompeu. Atravesse as ruínas e enfrente Melog."
        ];
      }

      if (!state.bridgeStable) {
        return [
          "Etapa 1/4: estabilize a Ponte das Equações.",
          `Ritmo Lógico atual: ${rhythm.stacks}/3.`,
          "Resolva o Núcleo da Ponte no Distrito das Operações para alcançar os dois ramos centrais do reino."
        ];
      }

      return [
        "Etapa 2/4: restaure as zonas de estudo.",
        `Inimigos: ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons} necessários (${state.defeatedCommons}/${state.totalCommons} no mapa). Equações: ${state.solvedRequiredEquations}/${state.requiredEquationIds.length}.`,
        state.objective
      ];
    }

    function getMelogGateDialogue() {
      const state = getMathProgressionState();

      if (mathProgress.miniBossDefeated || isRealmGuardianCompleted("reino-matematica")) {
        return [
          "O Selo das Ruínas está quebrado.",
          "A corrupção de Melog perdeu força e o caminho agora aponta para a Fortaleza do Golem."
        ];
      }

      if (state.miniBossUnlocked) {
        return [
          "O Selo das Ruínas se desfez.",
          `Você cumpriu os requisitos: ${state.defeatedCommons}/${state.requiredCommons} inimigos necessários e ${state.solvedRequiredEquations}/${state.requiredEquationIds.length} Equações do Mundo.`,
          "Melog está logo adiante."
        ];
      }

      const missingEnemies = Math.max(0, state.requiredCommons - state.defeatedCommons);
      const missingEquations = Math.max(0, state.requiredEquationIds.length - state.solvedRequiredEquations);
      const requirements = [];
      if (missingEnemies) requirements.push(`derrote mais ${missingEnemies} inimigo${missingEnemies === 1 ? "" : "s"}`);
      if (missingEquations) requirements.push(`estabilize mais ${missingEquations} Equação${missingEquations === 1 ? "" : "ões"} do Mundo`);

      return [
        "A corrupção bloqueia fisicamente o caminho para as Ruínas do Melog.",
        `Requisitos: inimigos ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons} · Equações ${state.solvedRequiredEquations}/${state.requiredEquationIds.length}.`,
        requirements.length ? `Para romper o selo, ${requirements.join(" e ")}.` : "O selo está prestes a ceder."
      ];
    }

    function getGolemGateDialogue() {
      if (isRealmGuardianCompleted("reino-matematica")) {
        return [
          "O Portão do Teorema permanece aberto.",
          "A Fortaleza do Golem já reconheceu que você concluiu o teste desta jornada e recebeu seu diploma."
        ];
      }

      if (isMathBossUnlocked()) {
        return [
          "O Portão do Teorema está aberto.",
          "O Golem dos Cálculos não protege a fortaleza de você; ele está esperando para avaliar o que você aprendeu.",
          "Siga em frente para o teste final."
        ];
      }

      if (mathProgress.miniBossDefeated) {
        return [
          "A energia da corrupção desapareceu, mas o portão ainda está recalculando o caminho.",
          "Aguarde um instante: o teste do Golem está sendo liberado."
        ];
      }

      return [
        "O Portão do Teorema está selado.",
        "A Fortaleza do Golem pode ser vista daqui, mas nenhum caminho atravessa a muralha enquanto Melog corromper o reino.",
        "Primeiro avance pelas Ruínas do Melog."
      ];
    }

    function getMathGuardianCompletedDialogue() {
      return [
        "Seu teste terminou, aluno.",
        "Você não me derrotou. Demonstrou compreensão suficiente para seguir adiante.",
        "O Diploma da Matemática agora faz parte da sua jornada.",
        "Raciocínio Estruturado pode ser usado uma vez por batalha para eliminar uma alternativa incorreta.",
        "Continue aprendendo. Conhecimento que não avança acaba virando pedra."
      ];
    }

    function getPortugueseProgressDialogue() {
      const state = getPortugueseProgressionState();
      const progress = getRuntimeRealmProgress("reino-gramatica");
      if (isRealmGuardianCompleted("reino-gramatica")) return [
        "Status do Reino de Português: concluído.",
        "Ortcepse foi superado e o Espectro da Gramática foi dissipado.",
        "Diploma de Português: conquistado. Competência permanente: Leitura Crítica."
      ];
      if (state.bossUnlocked) return ["Etapa final: Catedral da Gramática.", "Ortcepse foi superado. O Portal da Gramática está aberto ao norte.", "O Espectro aguarda na nave central."];
      if (state.miniBossUnlocked) return ["Etapa 3/4: Arquivo Invertido.", `Requisitos cumpridos: ${state.defeatedCommons}/${state.requiredCommons} inimigos e ${state.solvedRequiredWords}/${state.requiredWordIds.length} Palavras do Mundo.`, "Ortcepse está logo adiante."];
      if (!state.openingStable) return ["Etapa 1/4: reconstrua a Inscrição da Passagem.", "A frase quebrada no Bairro Ortográfico controla o caminho para os dois ramos do reino.", "Leia o contexto antes de escolher a palavra."];
      return ["Etapa 2/4: restaure Semântica e Sintaxe.", `Inimigos: ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons} necessários (${state.defeatedCommons}/${state.totalCommons} no mapa). Palavras do Mundo: ${state.solvedRequiredWords}/${state.requiredWordIds.length}.`, state.objective];
    }

    function getPortugueseMiniGateDialogue() {
      const state = getPortugueseProgressionState();
      const progress = getRuntimeRealmProgress("reino-gramatica");
      if (progress.miniBossDefeated || isRealmGuardianCompleted("reino-gramatica")) return ["O Selo do Arquivo Invertido foi rompido.", "As letras voltaram à ordem e o caminho aponta para a Catedral da Gramática."];
      if (state.miniBossUnlocked) return ["O selo perdeu sua força.", `Você cumpriu os requisitos: ${state.defeatedCommons}/${state.requiredCommons} inimigos e ${state.solvedRequiredWords}/${state.requiredWordIds.length} Palavras do Mundo.`, "Ortcepse está no interior do arquivo."];
      return ["Uma rasura cobre o caminho para o Arquivo Invertido.", `Requisitos: inimigos ${Math.min(state.defeatedCommons, state.requiredCommons)}/${state.requiredCommons} · Palavras ${state.solvedRequiredWords}/${state.requiredWordIds.length}.`, "Reconstrua linguagem suficiente para que o reino consiga ler esse caminho novamente."];
    }

    function getPortugueseBossGateDialogue() {
      const progress = getRuntimeRealmProgress("reino-gramatica");
      if (isRealmGuardianCompleted("reino-gramatica")) return ["A Catedral da Gramática está silenciosa.", "O Espectro foi dissipado e o reino já reconhece seu Diploma de Português."];
      if (isRealmBossUnlocked("reino-gramatica")) return ["O Portal da Gramática está aberto.", "Sem Ortcepse invertendo as estruturas, o caminho até o Espectro finalmente pode ser lido.", "Atravesse e conclua o Reino de Português."];
      if (progress.miniBossDefeated) return ["O arquivo voltou à ordem, e o portal está reorganizando suas inscrições.", "O caminho final está quase legível."];
      return ["A Catedral pode ser vista daqui, mas o texto do portal está completamente invertido.", "Ortcepse precisa ser superado antes que o caminho faça sentido."];
    }

    function renderDialogueLine() {
      if (!currentDialogueNpc) return;

      const lines = getNpcDialogueLines(currentDialogueNpc);
      const currentLine = lines[currentDialogueIndex] || lines[0] || "...";
      const totalLines = Math.max(1, lines.length);
      const currentNumber = Math.min(currentDialogueIndex + 1, totalLines);

      dialogueRole.textContent = currentDialogueNpc.role;
      dialogueName.textContent = currentDialogueNpc.name;
      dialogueText.textContent = currentLine;

      const hasDialoguePortrait = Boolean(currentDialogueNpc.portrait);
      dialogueBox.classList.toggle("dialogue-no-portrait", !hasDialoguePortrait);
      if (dialoguePortrait?.parentElement) {
        dialoguePortrait.parentElement.style.display = hasDialoguePortrait ? "" : "none";
      }
      if (hasDialoguePortrait) {
        dialoguePortrait.src = currentDialogueNpc.portrait;
        dialoguePortrait.alt = `Retrato de ${currentDialogueNpc.name}`;
      } else {
        dialoguePortrait.removeAttribute("src");
        dialoguePortrait.alt = "";
      }

      dialogueFooter.innerHTML = `
        <span class="dialogue-progress">${currentNumber}/${totalLines}</span>
        · Pressione E para avançar ou Esc para fechar.
      `;
    }

    function openNpcDialogue(npc) {
      dialogueOpen = true;
      currentDialogueNpc = npc;
      currentDialogueIndex = 0;

      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();

      renderDialogueLine();
      dialogueBox.classList.add("visible");
      interactionText.textContent = `Conversando com ${npc.name}.`;
    }

    function advanceDialogue() {
      if (!dialogueOpen || !currentDialogueNpc) return;

      const lines = getNpcDialogueLines(currentDialogueNpc);

      if (currentDialogueIndex < lines.length - 1) {
        currentDialogueIndex += 1;
        renderDialogueLine();
        return;
      }

      const shouldOpenRealmPanel = Boolean(currentDialogueNpc && currentDialogueNpc.opensRealmPanel);
      const shouldOpenShop = Boolean(currentDialogueNpc && currentDialogueNpc.opensShop);
      const shouldOpenHallOfFame = Boolean(currentDialogueNpc && currentDialogueNpc.opensHallOfFame);
      const shouldOpenStudentTerminal = Boolean(currentDialogueNpc && currentDialogueNpc.opensStudentTerminal);
      const shouldOpenLibraryArchive = Boolean(currentDialogueNpc && currentDialogueNpc.opensLibraryArchive);
      const sportsMinigameId = currentDialogueNpc?.opensSportsMinigame || "";
      const shouldReturnToVillage = Boolean(currentDialogueNpc && currentDialogueNpc.returnToVillage);
      const shouldResetMath = Boolean(currentDialogueNpc && currentDialogueNpc.resetsMathProgress);
      closeDialogue();

      if (shouldResetMath) {
        resetMathProgress();
      }

      if (shouldOpenRealmPanel) {
        openRealmPanel();
      }

      if (shouldOpenShop) {
        openShopPanel();
      }

      if (shouldOpenHallOfFame) {
        openHallOfFamePanel();
      }

      if (shouldOpenStudentTerminal) {
        openStudentTerminalPanel();
      }

      if (shouldOpenLibraryArchive) {
        openLibraryArchivePanel();
      }

      if (sportsMinigameId) {
        if (sportsMinigameId === "football" && window.VoltzStandaloneSportBridge?.enterFootball) {
          window.VoltzStandaloneSportBridge.enterFootball();
        } else if (sportsMinigameId === "dodgeball" && window.VoltzStandaloneSportBridge?.enterDodgeball) {
          window.VoltzStandaloneSportBridge.enterDodgeball();
        } else {
          window.VoltzSports?.open?.(sportsMinigameId);
        }
      }

      if (shouldReturnToVillage) {
        changeScene(villageScene);
      }
    }

    function closeDialogue() {
      dialogueOpen = false;
      currentDialogueNpc = null;
      currentDialogueIndex = 0;
      dialogueBox.classList.remove("visible");
      updateHint();
    }

    function interactWithNearbyNpc() {
      if (dialogueOpen) {
        advanceDialogue();
        return;
      }

      updateNearbyNpc();

      if (nearbyNpc) {
        openNpcDialogue(nearbyNpc);
      }
    }

    function npcSvg(npc) {
      if (npc.visualType === "guardian" && npc.portrait) {
        return `
          <div class="npc-guardian-image-wrap" role="img" aria-label="${escapeHtml(npc.name)}">
            <div class="npc-guardian-aura"></div>
            <img class="npc-guardian-image" src="${escapeHtml(npc.portrait)}" alt="${escapeHtml(npc.name)}" />
          </div>
        `;
      }

      if (npc.visualType === "terminal") {
        return `
          <svg class="npc-svg npc-svg-terminal" viewBox="0 0 120 150" role="img" aria-label="${npc.name}">
            <ellipse cx="60" cy="128" rx="32" ry="9" fill="rgba(0,0,0,0.34)"></ellipse>
            <rect x="26" y="52" width="68" height="54" rx="12" fill="${npc.colorB}" stroke="rgba(245,251,255,0.86)" stroke-width="4"></rect>
            <rect x="34" y="61" width="52" height="28" rx="6" fill="rgba(2,4,13,0.72)" stroke="${npc.colorA}" stroke-width="3"></rect>
            <path d="M41 76 H79 M47 86 H73" stroke="${npc.colorA}" stroke-width="4" stroke-linecap="round"></path>
            <path d="M46 106 L36 128 M74 106 L84 128" stroke="${npc.colorA}" stroke-width="6" stroke-linecap="round"></path>
            <circle cx="60" cy="37" r="13" fill="${npc.colorA}" stroke="#fff" stroke-width="3"></circle>
            <path d="M52 37 H68 M60 29 V45" stroke="#02040d" stroke-width="4" stroke-linecap="round"></path>
          </svg>
        `;
      }

      if (npc.visualType === "gate") {
        return `
          <svg class="npc-svg npc-svg-gate" viewBox="0 0 120 150" role="img" aria-label="${npc.name}">
            <ellipse cx="60" cy="130" rx="38" ry="10" fill="rgba(0,0,0,0.36)"></ellipse>
            <path d="M28 126 V72 C28 42 44 28 60 28 C76 28 92 42 92 72 V126" fill="rgba(2,4,13,0.44)" stroke="${npc.colorA}" stroke-width="8" stroke-linecap="round"></path>
            <path d="M42 126 V76 C42 55 50 47 60 47 C70 47 78 55 78 76 V126" fill="rgba(255,255,255,0.08)" stroke="${npc.colorB}" stroke-width="5" stroke-linecap="round"></path>
            <circle cx="60" cy="82" r="12" fill="${npc.colorA}" stroke="#fff" stroke-width="3"></circle>
            <path d="M37 58 L24 45 M83 58 L96 45" stroke="${npc.colorB}" stroke-width="6" stroke-linecap="round"></path>
          </svg>
        `;
      }

      return `
        <svg class="npc-svg" viewBox="0 0 120 150" role="img" aria-label="${npc.name}">
          <ellipse cx="60" cy="128" rx="30" ry="10" fill="rgba(0,0,0,0.34)"></ellipse>
          <ellipse cx="60" cy="78" rx="44" ry="52" fill="${npc.aura}" opacity="0.16"></ellipse>
          <path
            d="M36 119 C30 82, 34 48, 60 36 C86 48, 90 82, 84 119 C74 132, 46 132, 36 119Z"
            fill="${npc.colorB}"
            stroke="rgba(245,251,255,0.78)"
            stroke-width="4"
            stroke-linejoin="round"
          ></path>
          <path
            d="M40 92 C48 82, 72 82, 80 92 L77 118 C69 126, 51 126, 43 118Z"
            fill="${npc.colorA}"
            opacity="0.88"
          ></path>
          <circle cx="60" cy="57" r="23" fill="${npc.colorA}" stroke="rgba(245,251,255,0.82)" stroke-width="4"></circle>
          <path d="M43 41 C51 22, 70 22, 78 41" fill="none" stroke="${npc.colorB}" stroke-width="8" stroke-linecap="round"></path>
          <ellipse cx="51" cy="58" rx="5" ry="7" fill="#02040d"></ellipse>
          <ellipse cx="69" cy="58" rx="5" ry="7" fill="#02040d"></ellipse>
          <circle cx="53" cy="55" r="1.8" fill="#78f7ff"></circle>
          <circle cx="71" cy="55" r="1.8" fill="#78f7ff"></circle>
          <path d="M52 72 C57 77, 64 77, 69 72" fill="none" stroke="#02040d" stroke-width="4" stroke-linecap="round"></path>
          <path d="M36 88 C24 94, 25 108, 36 113" fill="none" stroke="${npc.colorA}" stroke-width="6" stroke-linecap="round"></path>
          <path d="M84 88 C96 94, 95 108, 84 113" fill="none" stroke="${npc.colorA}" stroke-width="6" stroke-linecap="round"></path>
          <path d="M50 128 L44 143" stroke="${npc.colorB}" stroke-width="7" stroke-linecap="round"></path>
          <path d="M70 128 L76 143" stroke="${npc.colorB}" stroke-width="7" stroke-linecap="round"></path>
        </svg>
      `;
    }

    function renderDepthLayer() {
      decorLayer.innerHTML = "";
      buildingBaseLayer.innerHTML = "";
      roofLayer.innerHTML = "";
      treeBaseLayer.innerHTML = "";
      canopyLayer.innerHTML = "";

      const decorHtml = decorObjects.map((decor) => {
        const className = getDecorVisualClass(decor);

        const sortY = getDecorSortY(decor);

        return `
          <div
            class="depth-object depth-decor"
            data-sort-y="${sortY}"
            style="left: ${decor.x}px; top: ${decor.y}px; width: ${decor.w}px; height: ${decor.h}px; z-index: ${sortY};"
            aria-hidden="true"
          >
            <div class="decor-object ${className}">
              ${decor.showLabel ? `<span class="decor-label">${decor.label}</span>` : ""}
            </div>
          </div>
        `;
      }).join("");

      const buildingHtml = buildings.map((building) => {
        const sortY = getBuildingSortY(building);

        return `
          <div
            class="depth-object depth-building"
            data-sort-y="${sortY}"
            style="left: ${building.x}px; top: ${building.y}px; width: ${building.w}px; height: ${building.h}px; z-index: ${sortY}; --roof-h: ${building.roofH}px;"
            aria-hidden="true"
          >
            <div class="building-base">
              <div class="building-door"></div>
              <span class="building-label">${building.label}</span>
            </div>

            <div class="building-roof" data-occluder-id="${building.id}-teto"></div>
          </div>
        `;
      }).join("");

      const treeHtml = treeObjects.map((tree) => {
        const sortY = getTreeSortY(tree);

        return `
          <div
            class="depth-object depth-tree"
            data-sort-y="${sortY}"
            style="left: ${tree.x}px; top: ${tree.y}px; width: ${tree.w}px; height: ${tree.h}px; z-index: ${sortY};"
            aria-hidden="true"
          >
            <div class="map-tree-base">
              <div class="tree-shadow"></div>
              <div class="tree-trunk"></div>
            </div>

            <div class="tree-canopy" data-occluder-id="${tree.id}-copa"></div>
          </div>
        `;
      }).join("");

      const worldEquationHtml = worldEquationObjects.map((equation) => {
        const sortY = getWorldEquationSortY(equation);
        const solved = isWorldEquationSolved(equation.id, currentScene?.id);
        const worldMechanic = getLoadedRealmData(currentScene?.id)?.worldMechanic || {};

        return `
          <div
            class="depth-object depth-world-equation ${solved ? "solved" : ""}"
            data-world-equation-id="${equation.id}"
            data-sort-y="${sortY}"
            style="left: ${equation.x}px; top: ${equation.y}px; z-index: ${sortY};"
          >
            <div class="world-equation-shell">
              <div class="world-equation-ring"></div>
              <div class="world-equation-core">
                <span class="world-equation-symbol">${solved ? "✓" : "?"}</span>
                <strong>${escapeHtml(equation.formula)}</strong>
              </div>
              <span class="world-equation-label">${solved ? (worldMechanic.solvedSeal || "Equação Estável") : equation.name}</span>
            </div>
          </div>
        `;
      }).join("");

      const npcHtml = npcObjects.map((npc) => {
        const sortY = getNpcSortY(npc);

        return `
          <div
            class="depth-object depth-npc"
            data-npc-id="${npc.id}"
            data-sort-y="${sortY}"
            style="left: ${npc.x}px; top: ${npc.y}px; z-index: ${sortY};"
          >
            <div class="npc-shell">
              <div class="npc-interaction-ring"></div>
              ${npcSvg(npc)}
              <span class="npc-label">${npc.name}</span>
            </div>
          </div>
        `;
      }).join("");

      const portalHtml = portalObjects.map((portal) => {
        const sortY = getPortalSortY(portal);

        return `
          <div
            class="depth-object depth-portal"
            data-portal-id="${portal.id}"
            data-sort-y="${sortY}"
            style="left: ${portal.x}px; top: ${portal.y}px; z-index: ${sortY};"
          >
            <div class="portal-shell">
              <div class="portal-interaction-ring"></div>
              ${portalSvg(portal)}
              <span class="portal-label">${portal.name}</span>
            </div>
          </div>
        `;
      }).join("");

      const enemyHtml = enemyObjects.map((enemy) => {
        const type = getEnemyType(enemy);
        const sortY = getEnemySortY(enemy);

        return `
          <div
            class="depth-object depth-enemy enemy-type-${enemy.typeId} enemy-rank-${enemy.enemyRank || 'common'} ${enemy.defeatedPending ? 'defeated-pending' : ''}"
            data-enemy-id="${enemy.id}"
            data-direction="${enemy.direction}"
            data-enemy-rank="${enemy.enemyRank || 'common'}"
            data-sort-y="${sortY}"
            style="left: ${enemy.x}px; top: ${enemy.y}px; z-index: ${sortY};"
          >
            <div class="enemy-shell">
              <div class="enemy-interaction-ring"></div>
              ${enemySvg(enemy)}
              <span class="enemy-label">${type.name}</span>
            </div>
          </div>
        `;
      }).join("");

      depthLayer.innerHTML = `${decorHtml}${buildingHtml}${treeHtml}${portalHtml}${worldEquationHtml}${npcHtml}${enemyHtml}`;
      depthLayer.appendChild(player);
    }

    function renderDecorLayer() {
      decorLayer.innerHTML = decorObjects.map((decor) => {
        const className = getDecorVisualClass(decor);

        return `
          <div
            class="decor-object ${className}"
            style="left: ${decor.x}px; top: ${decor.y}px; width: ${decor.w}px; height: ${decor.h}px;"
            aria-hidden="true"
          >${decor.showLabel ? `<span class="decor-label">${decor.label}</span>` : ""}</div>
        `;
      }).join("");
    }

    function renderBuildingLayers() {
      buildingBaseLayer.innerHTML = buildings.map((building) => `
        <div
          class="building-base"
          style="left: ${building.x}px; top: ${building.y + building.roofH - 22}px; width: ${building.w}px; height: ${building.h - building.roofH + 42}px;"
          aria-hidden="true"
        >
          <div class="building-door"></div>
          <span class="building-label">${building.label}</span>
        </div>
      `).join("");

      roofLayer.innerHTML = buildings.map((building) => `
        <div
          class="building-roof"
          data-occluder-id="${building.id}-teto"
          style="left: ${building.x}px; top: ${building.y}px; width: ${building.w}px; height: ${building.roofH}px;"
          aria-hidden="true"
        ></div>
      `).join("");
    }

    function getBuildingPhysicalColliders(building) {
      if (building.solid === false) {
        return [];
      }

      /*
        Colisão de prédio em top-down:
        - teto continua sendo apenas visual/oclusão, sem colisão.
        - colisão começa na base do prédio, onde parede/fundação toca o chão.
        - a porta fica como um pequeno vão visual na frente, mas o corpo do prédio
          continua sólido para o jogador não atravessar a construção inteira.
      */
      const baseX = building.x;
      const baseY = building.y + building.roofH - 22;
      const baseW = building.w;
      const baseH = building.h - building.roofH + 42;

      const paddingX = Math.max(18, baseW * 0.05);
      const sideW = Math.max(38, baseW * 0.12);
      const backH = Math.max(38, baseH * 0.24);
      const frontH = Math.max(42, baseH * 0.28);
      const doorGap = Math.min(104, baseW * 0.26);
      const doorX = baseX + baseW / 2 - doorGap / 2;
      const frontY = baseY + baseH - frontH;
      const innerTopY = baseY + backH;
      const innerH = Math.max(24, frontY - innerTopY);

      const colliders = [
        {
          id: `${building.id}-fundo`,
          label: `${building.label} / fundo`,
          x: baseX + paddingX,
          y: baseY,
          w: baseW - paddingX * 2,
          h: backH
        },
        {
          id: `${building.id}-lateral-esq`,
          label: `${building.label} / lateral E`,
          x: baseX + paddingX,
          y: baseY,
          w: sideW,
          h: baseH
        },
        {
          id: `${building.id}-lateral-dir`,
          label: `${building.label} / lateral D`,
          x: baseX + baseW - paddingX - sideW,
          y: baseY,
          w: sideW,
          h: baseH
        }
      ];

      if (innerH > 28) {
        colliders.push({
          id: `${building.id}-corpo`,
          label: `${building.label} / corpo`,
          x: baseX + paddingX + sideW,
          y: innerTopY,
          w: baseW - (paddingX + sideW) * 2,
          h: innerH
        });
      }

      colliders.push(
        {
          id: `${building.id}-frente-esq`,
          label: `${building.label} / frente E`,
          x: baseX + paddingX,
          y: frontY,
          w: Math.max(24, doorX - (baseX + paddingX)),
          h: frontH
        },
        {
          id: `${building.id}-frente-dir`,
          label: `${building.label} / frente D`,
          x: doorX + doorGap,
          y: frontY,
          w: Math.max(24, baseX + baseW - paddingX - (doorX + doorGap)),
          h: frontH
        }
      );

      return colliders;
    }

    function getDecorPhysicalCollider(decor) {
      if (decor.collider) {
        const collider = decor.collider;

        return {
          id: `${decor.id}-fisico`,
          label: `${decor.label} / base`,
          x: decor.x + collider.x,
          y: decor.y + collider.y,
          w: collider.w,
          h: collider.h
        };
      }

      if (decor.type === "water") {
        return {
          id: decor.id,
          label: `${decor.label} / núcleo`,
          x: decor.x + decor.w * 0.35,
          y: decor.y + decor.h * 0.38,
          w: decor.w * 0.30,
          h: decor.h * 0.24
        };
      }

      if (decor.type === "crystal") {
        return {
          id: decor.id,
          label: `${decor.label} / base`,
          x: decor.x + decor.w * 0.30,
          y: decor.y + decor.h * 0.62,
          w: decor.w * 0.40,
          h: decor.h * 0.30
        };
      }

      return {
        id: decor.id,
        label: decor.label,
        x: decor.x,
        y: decor.y + decor.h * 0.15,
        w: decor.w,
        h: decor.h * 0.70
      };
    }

    function getTreeTrunkCollider(tree) {
      const trunkWidth = Math.max(20, tree.w * 0.20);
      const trunkHeight = Math.max(26, tree.h * 0.28);

      return {
        id: `${tree.id}-tronco`,
        label: tree.label,
        x: tree.x + tree.w / 2 - trunkWidth / 2,
        y: tree.y + tree.h - 10,
        w: trunkWidth,
        h: trunkHeight
      };
    }

    function renderTreeLayers() {
      treeBaseLayer.innerHTML = treeObjects.map((tree) => `
        <div
          class="map-tree-base"
          style="left: ${tree.x}px; top: ${tree.y}px; width: ${tree.w}px; height: ${tree.h}px;"
          aria-hidden="true"
        >
          <div class="tree-shadow"></div>
          <div class="tree-trunk"></div>
        </div>
      `).join("");

      canopyLayer.innerHTML = treeObjects.map((tree) => `
        <div
          class="tree-canopy"
          data-occluder-id="${tree.id}-copa"
          style="left: ${tree.x}px; top: ${tree.y}px; width: ${tree.w}px; height: ${tree.h}px;"
          aria-hidden="true"
        ></div>
      `).join("");
    }

    function renderColliderDebugLayer() {
      if (!colliderLayer) return;

      if (!keys.debugColliders) {
        colliderLayer.innerHTML = "";
        world.classList.remove("show-colliders");
        return;
      }

      colliderLayer.innerHTML = colliders.map((collider) => `
        <div
          class="collider-debug ${collider.debugClass || ""}"
          style="left:${collider.x}px; top:${collider.y}px; width:${collider.w}px; height:${collider.h}px;"
        >${escapeHtml(collider.label || collider.id || "colisor")}</div>
      `).join("");

      world.classList.add("show-colliders");
    }

    function updateVisualTransition() {
      cameraState.zoom += (cameraState.targetZoom - cameraState.zoom) * 0.12;
      playerState.scale += (playerState.targetScale - playerState.scale) * 0.14;

      if (Math.abs(cameraState.targetZoom - cameraState.zoom) < 0.001) {
        cameraState.zoom = cameraState.targetZoom;
      }

      if (Math.abs(playerState.targetScale - playerState.scale) < 0.001) {
        playerState.scale = playerState.targetScale;
      }
    }

    function updateMovement() {
      updateVisualTransition();

      if (dialogueOpen || realmPanelOpen || shopPanelOpen || worldInventoryOpen || hallFamePanelOpen || studentTerminalOpen || libraryArchiveOpen || worldEquationPanelOpen || enemyPanelOpen || window.VoltzSports?.isOpen?.() || window.VoltzDevMenu?.isOpen?.()) {
        playerState.moving = false;
        updatePlayerPosition();
        updatePlayerAnimation();
        updateCamera();
        updateDebug();
        return;
      }

      updateEnemyMovement();

      let dx = 0;
      let dy = 0;

      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      const moving = dx !== 0 || dy !== 0;
      playerState.moving = moving;

      if (moving) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;

        const speed = getCurrentSpeed();
        movePlayerWithCollision(dx * speed, dy * speed);
        updateDirection(dx, dy);
      } else {
        lastCollisionLabel = "livre";
      }

      updateSceneTransitions();
      clampPlayer();
      updatePlayerPosition();
      updatePlayerAnimation();
      updateCamera();
      updateOcclusionVisibility();
      updateNearbyNpc();
      updateNearbyPortal();
      updateNearbyEnemy();
      updateNearbyWorldEquation();
      updateDebug();
      updateHint();
    }

    function getPlayerHitboxAt(x, y) {
      const scaledWidth = playerState.width * playerState.scale;
      const scaledHeight = playerState.height * playerState.scale;
      const hitboxWidth = Math.max(14, scaledWidth * 0.34);
      const hitboxHeight = Math.max(9, scaledHeight * 0.16);

      return {
        x: x - hitboxWidth / 2,
        y: y + scaledHeight * 0.24,
        w: hitboxWidth,
        h: hitboxHeight
      };
    }

    function getPlayerVisualBox() {
      const scaledWidth = playerState.width * playerState.scale;
      const scaledHeight = playerState.height * playerState.scale;

      return {
        x: playerState.x - scaledWidth * 0.38,
        y: playerState.y - scaledHeight * 0.68,
        w: scaledWidth * 0.76,
        h: scaledHeight * 0.94
      };
    }

    function rectanglesOverlap(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    }

    function pointInsideRectangle(point, rect) {
      return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.w &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.h
      );
    }

    function getPlayerFootPoint() {
      return {
        x: playerState.x,
        y: playerState.y + playerState.height * playerState.scale * 0.31
      };
    }

    function getCollisionAt(x, y) {
      const playerBox = getPlayerHitboxAt(x, y);
      return colliders.find((collider) => rectanglesOverlap(playerBox, collider)) || null;
    }

    // Mudanças persistentes do mundo podem criar um novo colisor exatamente onde o
    // jogador está (ex.: o Golem reaparece como NPC amigável após entregar o diploma).
    // Se isso acontecer, o movimento por passos pequenos ficaria preso para sempre.
    // Esta rotina encontra o ponto livre mais próximo sem teleportar o jogador para
    // outra região do mapa.
    function releasePlayerFromCollision() {
      const currentHit = getCollisionAt(playerState.x, playerState.y);
      if (!currentHit) return false;

      const originX = playerState.x;
      const originY = playerState.y;
      const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
        [0.5, 1], [1, 0.5], [-0.5, 1], [-1, 0.5],
        [0.5, -1], [1, -0.5], [-0.5, -1], [-1, -0.5]
      ];

      for (let radius = 12; radius <= 180; radius += 12) {
        for (const [dx, dy] of directions) {
          const candidateX = originX + dx * radius;
          const candidateY = originY + dy * radius;

          if (!getCollisionAt(candidateX, candidateY)) {
            playerState.x = candidateX;
            playerState.y = candidateY;
            clampPlayer();
            lastCollisionLabel = "livre";
            playerState.moving = false;
            updatePlayerPosition();
            updatePlayerAnimation();
            updateCamera();
            updateOcclusionVisibility();
            updateNearbyNpc();
            updateNearbyPortal();
            updateNearbyEnemy();
            updateNearbyWorldEquation();
            updateDebug();
            return true;
          }
        }
      }

      console.warn(`[COLISÃO] Não foi possível liberar o jogador de: ${currentHit.label || currentHit.id || "colisor"}`);
      return false;
    }

    function movePlayerWithCollision(moveX, moveY) {
      lastCollisionLabel = "livre";

      if (moveX !== 0) {
        const nextX = playerState.x + moveX;
        const hitX = getCollisionAt(nextX, playerState.y);

        if (!hitX) {
          playerState.x = nextX;
        } else {
          lastCollisionLabel = hitX.label;
        }
      }

      if (moveY !== 0) {
        const nextY = playerState.y + moveY;
        const hitY = getCollisionAt(playerState.x, nextY);

        if (!hitY) {
          playerState.y = nextY;
        } else {
          lastCollisionLabel = hitY.label;
        }
      }
    }

    function updateOcclusionVisibility() {
      const footPoint = getPlayerFootPoint();
      const visualBox = getPlayerVisualBox();

      const activeOccluder = occluders
        .filter((occluder) => {
          const objectIsInFront = footPoint.y < occluder.sortY;
          const playerTouchesVisual = rectanglesOverlap(visualBox, occluder);
          return objectIsInFront && playerTouchesVisual;
        })
        .sort((a, b) => b.sortY - a.sortY)[0] || null;

      currentOcclusionLabel = activeOccluder ? activeOccluder.label : "nada";

      document.querySelectorAll("[data-occluder-id]").forEach((element) => {
        const occluderId = element.dataset.occluderId;
        const isActive = activeOccluder && activeOccluder.id === occluderId;

        element.classList.toggle("player-under", Boolean(isActive && activeOccluder.kind === "canopy"));
        element.classList.toggle("player-hidden", Boolean(isActive && activeOccluder.kind === "roof"));
      });

      updatePlayerDepth();
      updatePlayerLocator(Boolean(activeOccluder));
    }

    function updatePlayerDepth() {
      const footPoint = getPlayerFootPoint();
      player.style.zIndex = `${Math.round(footPoint.y)}`;
    }

    function updatePlayerLocator(visible) {
      if (!playerLocator) return;
      const screenX = playerState.x - cameraState.x;
      const screenY = playerState.y - cameraState.y - playerState.height * 0.08;

      playerLocator.style.left = `${screenX}px`;
      playerLocator.style.top = `${screenY}px`;
      playerLocator.classList.toggle("visible", visible);
    }

    function toggleColliderDebug() {
      if (!debugMode) return;
      keys.debugColliders = !keys.debugColliders;
      renderColliderDebugLayer();
    }

    function updateDirection(dx, dy) {
      const horizontal = dx > 0.35 ? "direita" : dx < -0.35 ? "esquerda" : "";
      const vertical = dy > 0.35 ? "baixo" : dy < -0.35 ? "cima" : "";

      if (vertical && horizontal) {
        playerState.direction = `${vertical}-${horizontal}`;
        return;
      }

      if (horizontal) {
        playerState.direction = horizontal;
        return;
      }

      if (vertical) {
        playerState.direction = vertical;
      }
    }

    function clampPlayer() {
      const halfWidth = playerState.width * playerState.scale / 2;
      const halfHeight = playerState.height * playerState.scale / 2;

      const minX = halfWidth;
      const maxX = worldState.width - halfWidth;
      const minY = halfHeight;
      const maxY = worldState.height - halfHeight;

      playerState.x = Math.max(minX, Math.min(maxX, playerState.x));
      playerState.y = Math.max(minY, Math.min(maxY, playerState.y));
    }

    function updatePlayerPosition() {
      player.style.left = `${playerState.x}px`;
      player.style.top = `${playerState.y}px`;
      player.style.transform = `translate(-50%, -50%) scale(${playerState.scale})`;

      const isLeftDirection = playerState.direction.includes("esquerda");
      const flip = isLeftDirection ? -1 : 1;

      player.style.setProperty("--player-flip", flip);
      player.dataset.direction = playerState.direction;

      if (playerSvg) {
        playerSvg.setAttribute("aria-label", `Jogador Voltz olhando para ${playerState.direction}`);
      }

      updatePlayerHitboxDebug();
    }

    function updatePlayerHitboxDebug() {
      if (!playerHitboxDebug) return;
      const hitbox = getPlayerHitboxAt(playerState.x, playerState.y);

      playerHitboxDebug.style.left = `${hitbox.x}px`;
      playerHitboxDebug.style.top = `${hitbox.y}px`;
      playerHitboxDebug.style.width = `${hitbox.w}px`;
      playerHitboxDebug.style.height = `${hitbox.h}px`;
    }

    function getCameraTarget() {
      const rect = viewport.getBoundingClientRect();

      const visibleWidth = rect.width / cameraState.zoom;
      const visibleHeight = rect.height / cameraState.zoom;
      const maxCameraX = Math.max(0, worldState.width - visibleWidth);
      const maxCameraY = Math.max(0, worldState.height - visibleHeight);

      const targetX = playerState.x - visibleWidth / 2;
      const targetY = playerState.y - visibleHeight / 2;

      return {
        x: Math.max(0, Math.min(maxCameraX, targetX)),
        y: Math.max(0, Math.min(maxCameraY, targetY))
      };
    }

    function snapCameraToPlayer() {
      const target = getCameraTarget();
      cameraState.x = target.x;
      cameraState.y = target.y;
      applyCameraTransform();
    }

    function updateCamera() {
      const target = getCameraTarget();
      cameraState.x += (target.x - cameraState.x) * cameraState.smoothing;
      cameraState.y += (target.y - cameraState.y) * cameraState.smoothing;
      applyCameraTransform();
    }

    function applyCameraTransform() {
      const translateX = -cameraState.x * cameraState.zoom;
      const translateY = -cameraState.y * cameraState.zoom;
      world.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${cameraState.zoom})`;
    }

    function updatePlayerAnimation() {
      if (playerState.moving) {
        player.classList.add("moving");
      } else {
        player.classList.remove("moving");
      }
    }

    function updateDebug() {
      if (!debugX || !debugY || !debugSpeed || !debugDirection || !debugCameraX || !debugCameraY || !debugCollision || !debugOcclusion) return;
      debugX.textContent = Math.round(playerState.x);
      debugY.textContent = Math.round(playerState.y);
      debugSpeed.textContent = getCurrentSpeed().toFixed(1);
      debugDirection.textContent = playerState.direction;
      debugCameraX.textContent = Math.round(cameraState.x);
      debugCameraY.textContent = Math.round(cameraState.y);
      debugCollision.textContent = lastCollisionLabel;
      debugOcclusion.textContent = currentOcclusionLabel;
    }

    function updateHint() {
      if (lastCollisionLabel !== "livre") {
        interactionText.textContent = `Caminho bloqueado por: ${lastCollisionLabel}.`;
        return;
      }

      if (currentOcclusionLabel !== "nada") {
        interactionText.textContent = `Você está passando por trás de ${currentOcclusionLabel}.`;
        return;
      }

      if (nearbyEnemy) {
        interactionText.textContent = `Pressione E para enfrentar ${getEnemyType(nearbyEnemy).name} (${getEnemyType(nearbyEnemy).role}).`;
        return;
      }

      if (nearbyWorldEquation) {
        interactionText.textContent = isWorldEquationSolved(nearbyWorldEquation.id)
          ? `Pressione E para inspecionar ${nearbyWorldEquation.name} (estabilizada).`
          : `Pressione E para resolver ${nearbyWorldEquation.name}.`;
        return;
      }

      if (nearbyNpc) {
        interactionText.textContent = `Pressione E para conversar com ${nearbyNpc.name}.`;
        return;
      }

      const interiorHint = interiorSystem.getContextHint({
        currentScene,
        footPoint: getPlayerFootPoint()
      });

      if (interiorHint) {
        interactionText.textContent = interiorHint;
        return;
      }

      if (playerState.moving) {
        interactionText.textContent = keys.run
          ? `Correndo para ${playerState.direction}.`
          : `Andando para ${playerState.direction}.`;
      } else {
        interactionText.textContent = currentScene.defaultHint;
      }
    }

    function gameLoop() {
      updateMovement();
      requestAnimationFrame(gameLoop);
    }

    worldInventoryButton?.addEventListener("click", () => {
      if (worldInventoryOpen) {
        closeWorldInventory();
      } else {
        openWorldInventory();
      }
    });

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      if (window.VoltzSports?.isOpen?.()) return;

      if (enemyPanelOpen) {
        if (key === "escape") {
          closeEnemyPanel();
        }

        if ((key === "e" || key === "enter") && !event.repeat && enemyQuestionAnswered) {
          nextEnemyQuestion();
        }

        return;
      }

      if (studentTerminalOpen) {
        if (key === "escape" && !event.repeat) {
          event.preventDefault();
          closeStudentTerminalPanel();
        }
        return;
      }

      if (libraryArchiveOpen) {
        if (key === "escape" && !event.repeat) {
          event.preventDefault();
          closeLibraryArchivePanel();
        }
        return;
      }

      if (hallFamePanelOpen) {
        if (key === "escape" && !event.repeat) {
          event.preventDefault();
          closeHallOfFamePanel();
        }
        return;
      }

      if (worldInventoryOpen) {
        if ((key === "escape" || key === "i") && !event.repeat) {
          event.preventDefault();
          closeWorldInventory();
        }
        return;
      }

      if (worldEquationPanelOpen) {
        if (key === "escape") closeWorldEquationPanel();
        return;
      }

      if (realmPanelOpen) {
        if (key === "escape") {
          closeRealmPanel();
        }

        return;
      }

      if (shopPanelOpen) {
        if (key === "escape") {
          closeShopPanel();
        }

        return;
      }

      if (dialogueOpen) {
        if ((key === "e" || key === "enter") && !event.repeat) {
          advanceDialogue();
        }

        if (key === "escape") {
          closeDialogue();
        }

        return;
      }

      if (key === "i" && !event.repeat) {
        event.preventDefault();
        openWorldInventory();
        return;
      }

      if (key === "w" || key === "arrowup") keys.up = true;
      if (key === "s" || key === "arrowdown") keys.down = true;
      if (key === "a" || key === "arrowleft") keys.left = true;
      if (key === "d" || key === "arrowright") keys.right = true;
      if (key === "shift") keys.run = true;

      if (debugMode && key === "f3" && !event.repeat) {
        event.preventDefault();
        toggleColliderDebug();
      }

      if ((key === "e" || key === "enter") && !event.repeat) {
        const interactedWithEnemy = interactWithNearbyEnemy();
        if (!interactedWithEnemy) {
          const interactedWithEquation = interactWithNearbyWorldEquation();
          if (!interactedWithEquation) interactWithNearbyNpc();
        }
      }

      if (key === "escape" && dialogueOpen) {
        closeDialogue();
      }
    });

    document.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();

      if (key === "w" || key === "arrowup") keys.up = false;
      if (key === "s" || key === "arrowdown") keys.down = false;
      if (key === "a" || key === "arrowleft") keys.left = false;
      if (key === "d" || key === "arrowright") keys.right = false;
      if (key === "shift") keys.run = false;
    });

    window.addEventListener("resize", () => {
      updateWorldSizeFromCss();
      updatePlayerSizeFromCss();
      enemyObjects = getEnemyObjectsForScene(currentScene);
      buildCollisionAndOcclusionData();
      clampPlayer();
      renderDepthLayer();
      renderColliderDebugLayer();
      updatePlayerPosition();
      snapCameraToPlayer();
      updateOcclusionVisibility();
      updateNearbyNpc();
      updateNearbyPortal();
      updateNearbyEnemy();
      updateNearbyWorldEquation();
      updateMathBuffHud();
      updateDebug();
    });

    // ==============================
    // Painel Dev — ponte controlada para testes
    // ==============================
    const mathDevTeleportPoints = {
      praca: { x: 2500, y: 2960, label: "Praça do Infinito" },
      operacoes: { x: 2500, y: 2530, label: "Distrito das Operações" },
      bosque: { x: 1120, y: 1870, label: "Bosque das Potências" },
      fatores: { x: 3880, y: 1870, label: "Campos dos Fatores" },
      melog: { x: 2500, y: 1110, label: "Ruínas do Melog" },
      golem: { x: 2500, y: 470, label: "Fortaleza do Golem" }
    };

    const portugueseDevTeleportPoints = {
      praca: { x: 2500, y: 2960, label: "Praça da Palavra" },
      ortografia: { x: 2500, y: 2530, label: "Bairro Ortográfico" },
      semantica: { x: 1120, y: 1870, label: "Jardim da Semântica" },
      sintaxe: { x: 3880, y: 1870, label: "Distrito Sintático" },
      ortcepse: { x: 2500, y: 1110, label: "Arquivo Invertido" },
      espectro: { x: 2500, y: 470, label: "Catedral da Gramática" }
    };

    const sportsDevTeleportPoints = {
      praca: { x: 2500, y: 2960, label: "Praça dos Atletas" },
      futebol: { x: 1260, y: 2470, label: "Campo das Decisões" },
      basquete: { x: 3740, y: 2470, label: "Quadra do Ritmo" },
      atletismo: { x: 1260, y: 1730, label: "Pista do Impulso" },
      volei: { x: 3740, y: 1730, label: "Quadra da Sequência" },
      queimada: { x: 2500, y: 1050, label: "Arena da Esquiva" },
      estadio: { x: 2500, y: 520, label: "Estádio Voltz" }
    };

    function refreshAfterDevProgressChange() {
      if (currentScene?.id === "reino-matematica") {
        refreshRealmEnemyObjectsAfterProgress("reino-matematica");
        buildCollisionAndOcclusionData();
        renderDepthLayer();
        renderColliderDebugLayer();
        updateNearbyEnemy();
        updateNearbyWorldEquation();
      }
      updateMathBuffHud();
      updateHint();
    }

    async function persistMathDevProgress(message) {
      const saveResult = await persistRealmProgress("reino-matematica");
      refreshAfterDevProgressChange();

      if (saveResult?.persisted === false) {
        interactionText.textContent = `[DEV] ⚠ Alteração apenas local. Supabase NÃO confirmou o save.`;
      } else if (message) {
        interactionText.textContent = `[DEV] ${message}`;
      }

      return {
        ...getMathDevSnapshot(),
        savePersisted: saveResult?.persisted !== false,
        saveError: saveResult?.error?.message || ""
      };
    }

    function getMathDevSnapshot() {
      const progress = getRuntimeRealmProgress("reino-matematica");
      const commonIds = getMathCommonEnemyIds();
      const rhythm = getMathLogicalRhythmState();
      return {
        sceneId: currentScene?.id || "",
        sceneName: currentScene?.name || "",
        x: Math.round(playerState.x),
        y: Math.round(playerState.y),
        commonDefeated: commonIds.filter((id) => progress.defeatedEnemyIds.includes(id)).length,
        commonTotal: commonIds.length,
        miniBossDefeated: Boolean(progress.miniBossDefeated),
        bossDefeated: Boolean(progress.bossDefeated),
        guardianChallengeCompleted: isRealmGuardianCompleted("reino-matematica"),
        diploma: Boolean(window.VoltzProfile?.hasRealmDiploma?.("reino-matematica")),
        completed: Boolean(progress.completed),
        solvedEquations: getSolvedWorldEquationIds("reino-matematica").length,
        totalEquations: mathRealmData.worldEquations?.length || 0,
        rhythmStacks: rhythm.stacks,
        rhythmDevOverride: rhythm.devOverride,
        speedMultiplier: devSpeedMultiplier,
        colliders: Boolean(keys.debugColliders)
      };
    }

    function devCloseBlockingPanels() {
      if (enemyPanelOpen && typeof window.closeEnemyPanel === "function") {
        window.closeEnemyPanel({ force: true });
      }
      if (worldEquationPanelOpen) closeWorldEquationPanel();
      if (realmPanelOpen) closeRealmPanel();
      if (shopPanelOpen) closeShopPanel();
      if (dialogueOpen) closeDialogue();
    }

    function devTeleportPosition(x, y) {
      devCloseBlockingPanels();
      clearMovementKeys();
      playerState.moving = false;
      playerState.x = Number(x) || 0;
      playerState.y = Number(y) || 0;
      clampPlayer();
      updatePlayerPosition();
      updatePlayerAnimation();
      snapCameraToPlayer();
      updateNearbyNpc();
      updateNearbyEnemy();
      updateNearbyWorldEquation();
      updateHint();
    }

    function devTeleportMath(zoneId) {
      devCloseBlockingPanels();
      const point = mathDevTeleportPoints[zoneId] || mathDevTeleportPoints.praca;
      if (currentScene?.id !== "reino-matematica") {
        const scene = getSceneForRealm("reino-matematica");
        if (!scene) return false;
        changeScene(scene, { spawn: { x: point.x, y: point.y } });
      } else {
        devTeleportPosition(point.x, point.y);
      }
      interactionText.textContent = `[DEV] Teleporte: ${point.label}.`;
      return true;
    }

    function devTeleportPortuguese(zoneId) {
      devCloseBlockingPanels();
      const point = portugueseDevTeleportPoints[zoneId] || portugueseDevTeleportPoints.praca;
      if (currentScene?.id !== "reino-gramatica") {
        const scene = getSceneForRealm("reino-gramatica");
        if (!scene) return false;
        changeScene(scene, { spawn: { x: point.x, y: point.y } });
      } else {
        devTeleportPosition(point.x, point.y);
      }
      interactionText.textContent = `[DEV] Teleporte: ${point.label}.`;
      return true;
    }

    function devTeleportSports(zoneId) {
      devCloseBlockingPanels();
      window.VoltzSports?.close?.();
      const point = sportsDevTeleportPoints[zoneId] || sportsDevTeleportPoints.praca;
      if (currentScene?.id !== "reino-educacao-fisica") {
        const scene = getSceneForRealm("reino-educacao-fisica");
        if (!scene) return false;
        changeScene(scene, { spawn: { x: point.x, y: point.y } });
      } else {
        devTeleportPosition(point.x, point.y);
      }
      interactionText.textContent = `[DEV] Teleporte: ${point.label}.`;
      return true;
    }

    function devTeleportVillage() {
      devCloseBlockingPanels();
      changeScene(villageScene);
      interactionText.textContent = "[DEV] Teleporte: Vila Central.";
      return true;
    }

    async function devSetCommonsDefeated(value) {
      devCloseBlockingPanels();

      if (!value && window.VoltzProfile?.resetGuardianChallenge) {
        await window.VoltzProfile.resetGuardianChallenge("reino-matematica");
        syncAllRealmProgressFromProfile();
      }

      const progress = getRuntimeRealmProgress("reino-matematica");
      progress.defeatedEnemyIds = value ? getMathCommonEnemyIds() : [];
      if (!value) {
        progress.miniBossDefeated = false;
        progress.bossDefeated = false;
        progress.guardianChallengeCompleted = false;
        progress.completed = false;
        delete progress.completedAt;
      }
      return persistMathDevProgress(value ? "Todos os inimigos comuns marcados como derrotados." : "Inimigos comuns restaurados e diploma removido.");
    }

    async function devSetMiniBossDefeated(value) {
      devCloseBlockingPanels();

      if (!value && window.VoltzProfile?.resetGuardianChallenge) {
        await window.VoltzProfile.resetGuardianChallenge("reino-matematica");
        syncAllRealmProgressFromProfile();
      }

      const progress = getRuntimeRealmProgress("reino-matematica");
      if (value) {
        // Atalho de teste: marcar Melog derrotado também satisfaz os requisitos
        // anteriores para que o Portão do Teorema abra imediatamente.
        progress.defeatedEnemyIds = getMathCommonEnemyIds();
        progress.solvedWorldEquationIds = (mathRealmData.worldEquations || []).map((equation) => equation.id);
        progress.miniBossDefeated = true;
      } else {
        progress.miniBossDefeated = false;
        progress.bossDefeated = false;
        progress.guardianChallengeCompleted = false;
        progress.completed = false;
        delete progress.completedAt;
      }
      return persistMathDevProgress(value ? "Melog marcado como derrotado." : "Melog restaurado.");
    }

    async function devSetBossDefeated(value) {
      devCloseBlockingPanels();
      const progress = getRuntimeRealmProgress("reino-matematica");

      if (value) {
        progress.defeatedEnemyIds = getMathCommonEnemyIds();
        progress.solvedWorldEquationIds = (mathRealmData.worldEquations || []).map((equation) => equation.id);
        progress.miniBossDefeated = true;
        await persistRealmProgress("reino-matematica");

        const guardianType = enemyTypes["chefe-golem-calculos"] || {};
        const result = await window.VoltzProfile?.completeGuardianChallenge?.(
          "reino-matematica",
          createMathBoss(),
          { xp: 0, coins: 0 },
          guardianType.guardianChallenge?.diploma || {}
        );
        syncAllRealmProgressFromProfile();
        refreshAfterDevProgressChange();
        refreshConditionalNpcObjectsAfterProgress("reino-matematica");
        return {
          ...getMathDevSnapshot(),
          savePersisted: result?.persisted !== false,
          saveError: result?.error?.message || ""
        };
      }

      const result = await window.VoltzProfile?.resetGuardianChallenge?.("reino-matematica");
      syncAllRealmProgressFromProfile();
      refreshAfterDevProgressChange();
      refreshConditionalNpcObjectsAfterProgress("reino-matematica");
      return {
        ...getMathDevSnapshot(),
        savePersisted: result?.persisted !== false,
        saveError: result?.error?.message || ""
      };
    }

    async function devSetEquationsSolved(value) {
      devCloseBlockingPanels();
      const progress = getRuntimeRealmProgress("reino-matematica");
      progress.solvedWorldEquationIds = value
        ? (mathRealmData.worldEquations || []).map((equation) => equation.id)
        : [];
      return persistMathDevProgress(value ? "Todas as Equações do Mundo estabilizadas." : "Equações do Mundo restauradas.");
    }

    async function devDefeatNearestEnemy() {
      devCloseBlockingPanels();
      updateNearbyEnemy();
      if (!nearbyEnemy) return { ok: false, reason: "no-enemy", snapshot: getMathDevSnapshot() };
      const snapshot = cloneData(nearbyEnemy);
      const realmId = currentScene?.id;
      if (!realmId || !getLoadedRealmData(realmId)) {
        return { ok: false, reason: "not-realm", snapshot: getMathDevSnapshot() };
      }

      const progress = getRuntimeRealmProgress(realmId);
      const rank = String(snapshot.enemyRank || "").toLowerCase();
      const isBoss = snapshot.isBoss === true || rank === "boss" || rank === "chefe";
      const isMiniBoss = snapshot.isMiniBoss === true || ["miniboss", "mini-boss", "mini_chefe", "mini-chefe"].includes(rank);

      if (isBoss) {
        const type = getEnemyType(snapshot);
        const result = await window.VoltzProfile?.completeGuardianChallenge?.(
          realmId,
          snapshot,
          { xp: 0, coins: 0 },
          type.guardianChallenge?.diploma || {}
        );
        syncAllRealmProgressFromProfile();
        refreshRealmEnemyObjectsAfterProgress(realmId);
        refreshConditionalNpcObjectsAfterProgress(realmId);
        return {
          ok: true,
          enemyId: snapshot.id,
          persisted: result?.persisted !== false,
          error: result?.error,
          snapshot: getMathDevSnapshot()
        };
      } else if (isMiniBoss) {
        progress.miniBossDefeated = true;
      } else if (snapshot.id && !progress.defeatedEnemyIds.includes(snapshot.id)) {
        progress.defeatedEnemyIds.push(snapshot.id);
      }
      progress.lastVictoryAt = new Date().toISOString();

      const saveResult = await persistRealmProgress(realmId);
      refreshRealmEnemyObjectsAfterProgress(realmId);
      interactionText.textContent = saveResult?.persisted === false
        ? `[DEV] ⚠ ${snapshot.id} alterado apenas localmente. Supabase NÃO confirmou o save.`
        : `[DEV] ${snapshot.id} marcado como derrotado e salvo.`;
      return {
        ok: true,
        enemyId: snapshot.id,
        persisted: saveResult?.persisted !== false,
        error: saveResult?.error,
        snapshot: getMathDevSnapshot()
      };
    }

    function devSetRhythmOverride(stacks) {
      if (stacks === null || stacks === undefined || stacks === "natural") {
        devMathRhythmOverride = null;
      } else {
        devMathRhythmOverride = Math.max(0, Math.min(3, Number(stacks) || 0));
      }
      updateMathBuffHud();
      interactionText.textContent = devMathRhythmOverride === null
        ? "[DEV] Ritmo Lógico voltou ao valor natural do save."
        : `[DEV] Ritmo Lógico temporário: ${devMathRhythmOverride}/3.`;
      return getMathDevSnapshot();
    }

    function devSetSpeed(multiplier) {
      devSpeedMultiplier = Math.max(0.5, Math.min(5, Number(multiplier) || 1));
      interactionText.textContent = `[DEV] Velocidade x${devSpeedMultiplier}.`;
      return getMathDevSnapshot();
    }

    function devToggleColliders() {
      keys.debugColliders = !keys.debugColliders;
      document.body.classList.toggle("dev-colliders", keys.debugColliders && !debugMode);
      renderColliderDebugLayer();
      return getMathDevSnapshot();
    }

    function devPauseMovement() {
      clearMovementKeys();
      playerState.moving = false;
      updatePlayerAnimation();
    }

    window.VoltzDevBridge = {
      getSnapshot: getMathDevSnapshot,
      pauseMovement: devPauseMovement,
      teleportMath: devTeleportMath,
      teleportPortuguese: devTeleportPortuguese,
      teleportSports: devTeleportSports,
      teleportVillage: devTeleportVillage,
      defeatNearestEnemy: devDefeatNearestEnemy,
      setCommonsDefeated: devSetCommonsDefeated,
      setMiniBossDefeated: devSetMiniBossDefeated,
      setBossDefeated: devSetBossDefeated,
      setEquationsSolved: devSetEquationsSolved,
      resetMathProgress: async () => {
        await resetMathProgress();
        refreshAfterDevProgressChange();
        return getMathDevSnapshot();
      },
      setRhythmOverride: devSetRhythmOverride,
      setSpeed: devSetSpeed,
      toggleColliders: devToggleColliders
    };

    window.completeEnemyDefeatFromBattle = completeEnemyDefeatFromBattle;
    window.resetMathProgress = resetMathProgress;
    window.closeRealmPanel = closeRealmPanel;
    window.closeShopPanel = closeShopPanel;
    window.buyShopHint = buyShopHint;
    window.openWorldInventory = openWorldInventory;
    window.closeWorldInventory = closeWorldInventory;
    window.releasePlayerFromCollision = releasePlayerFromCollision;
    window.closeWorldEquationPanel = closeWorldEquationPanel;
    window.answerWorldEquation = answerWorldEquation;
    window.getActiveBattleTimeBonus = getActiveBattleTimeBonus;
    window.selectRealm = selectRealm;
    window.getActiveSceneId = () => currentScene.id;
    window.getActiveRealmProgressKey = () => {
      const realmData = getLoadedRealmData(currentScene?.id);
      return realmData ? getRealmProgressKey(currentScene.id) : currentScene?.id;
    };

    setupPlayer();
    hydrateMathProgress();
    window.addEventListener("voltz:profile-ready", () => {
      hydrateMathProgress();
      updateMathBuffHud();
      updateNearbyWorldEquation();
    }, { once: true });

    // Mantém mapa, HUD, inimigos e NPCs condicionais alinhados ao perfil salvo.
    window.addEventListener("voltz:profile-updated", () => {
      syncAllRealmProgressFromProfile();
      refreshRealmEnemyObjectsAfterProgress(currentScene?.id);
      refreshConditionalNpcObjectsAfterProgress(currentScene?.id);
      updateMathBuffHud();
      updateNearbyWorldEquation();
      updateHint();
      if (shopPanelOpen) renderShopPanel(shopMessage?.textContent || "");
      if (worldInventoryOpen) renderWorldInventory();
      if (studentTerminalOpen) renderStudentTerminal();
      if (libraryArchiveOpen) renderLibraryArchive();
    });
    gameLoop();


// Standalone sport transition bridge · dedicated sport pages
const VOLTZ_STANDALONE_SPORT_RETURN_KEY = "voltz:standalone-sport:return";

function saveStandaloneSportReturnPoint(sportId) {
  if (!sportId || !currentScene?.id) return false;
  try {
    sessionStorage.setItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY, JSON.stringify({
      sportId,
      sceneId: currentScene.id,
      x: Number(playerState.x || 0),
      y: Number(playerState.y || 0),
      direction: playerState.direction || "baixo",
      playerScale: Number(playerState.scale || 1),
      cameraZoom: Number(cameraState.zoom || currentScene.cameraZoom || 1),
      savedAt: Date.now()
    }));
    return true;
  } catch (error) {
    console.warn("[SPORT] Não foi possível salvar o ponto de retorno:", error);
    return false;
  }
}

function enterStandaloneFootball() {
  saveStandaloneSportReturnPoint("football");
  window.location.href = "football.html";
}

function enterStandaloneDodgeball() {
  saveStandaloneSportReturnPoint("dodgeball");
  window.location.href = "dodgeball.html";
}

function restoreStandaloneSportReturnPoint() {
  const url = new URL(window.location.href);
  const returnFrom = url.searchParams.get("returnFrom");
  if (!["football", "dodgeball"].includes(returnFrom)) return false;

  let point = null;
  try {
    point = JSON.parse(sessionStorage.getItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY) || "null");
  } catch {}
  if (!point || point.sportId !== returnFrom) return false;

  const targetScene = currentScene?.id === point.sceneId
    ? currentScene
    : getSceneForRealm(point.sceneId);
  if (!targetScene) return false;

  const spawn = {
    x: Number.isFinite(Number(point.x)) ? Number(point.x) : targetScene.spawn.x,
    y: Number.isFinite(Number(point.y)) ? Number(point.y) : targetScene.spawn.y
  };

  if (currentScene?.id !== targetScene.id) {
    changeScene(targetScene, {
      spawn,
      direction: point.direction || "baixo"
    });
  } else {
    playerState.x = spawn.x;
    playerState.y = spawn.y;
    playerState.direction = point.direction || "baixo";
    playerState.moving = false;
    if (Number.isFinite(Number(point.playerScale))) {
      playerState.scale = Number(point.playerScale);
      playerState.targetScale = Number(point.playerScale);
    }
    clampPlayer();
    updatePlayerPosition();
    updatePlayerAnimation();
  }

  if (Number.isFinite(Number(point.cameraZoom))) {
    cameraState.zoom = Number(point.cameraZoom);
    cameraState.targetZoom = Number(point.cameraZoom);
  }
  snapCameraToPlayer();
  updateOcclusionVisibility();
  updateNearbyNpc();
  updateNearbyPortal();
  updateNearbyEnemy();
  updateNearbyWorldEquation();
  updateHint();

  try { sessionStorage.removeItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY); } catch {}
  url.searchParams.delete("returnFrom");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  interactionText.textContent = returnFrom === "dodgeball"
    ? "Você voltou à Arena da Esquiva exatamente de onde entrou."
    : "Você voltou ao Campo das Decisões exatamente de onde entrou.";
  return true;
}

window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  enterDodgeball: enterStandaloneDodgeball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football"),
  captureDodgeballReturnPoint: () => saveStandaloneSportReturnPoint("dodgeball")
});

window.addEventListener("load", () => {
  window.setTimeout(() => restoreStandaloneSportReturnPoint(), 0);
});
