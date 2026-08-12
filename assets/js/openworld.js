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

    const equationPanel = document.getElementById("equationPanel");
    const equationPanelKicker = document.getElementById("equationPanelKicker");
    const equationPanelTitle = document.getElementById("equationPanelTitle");
    const equationFormula = document.getElementById("equationFormula");
    const equationPrompt = document.getElementById("equationPrompt");
    const equationOptions = document.getElementById("equationOptions");
    const equationFeedback = document.getElementById("equationFeedback");
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
        completed: Boolean(source.completed || source.bossDefeated)
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

    function isRealmMiniBossUnlocked(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);

      return Boolean(
        realmData?.miniBoss &&
        areAllRealmCommonsDefeated(realmId) &&
        !progress.miniBossDefeated &&
        !progress.bossDefeated
      );
    }

    function isRealmBossUnlocked(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);

      if (!realmData?.boss || progress.bossDefeated || !areAllRealmCommonsDefeated(realmId)) {
        return false;
      }

      return realmData.miniBoss ? progress.miniBossDefeated : true;
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

    function getMathProgressMessage() {
      const total = getMathCommonEnemyIds().length;
      const defeated = getDefeatedCommonCount();
      const rhythm = getMathLogicalRhythmState();

      if (mathProgress.bossDefeated) {
        return "Reino da Matemática concluído. A Fortaleza do Golem reconheceu seu progresso e o estado do reino foi salvo.";
      }

      if (isMathBossUnlocked()) {
        return "Melog foi superado. O Portão do Teorema abriu o caminho até a Fortaleza do Golem.";
      }

      if (isMathMiniBossUnlocked()) {
        return "As três zonas foram limpas. A corrupção cedeu e as Ruínas do Melog estão acessíveis.";
      }

      if (!isWorldEquationSolved("equacao-operacoes-01")) {
        return `Ritmo Lógico ${rhythm.stacks}/3. Estabilize a Equação do Mundo no Distrito das Operações para materializar a Ponte das Equações.`;
      }

      return `Inimigos básicos derrotados: ${defeated}/${total}. Ritmo Lógico ${rhythm.stacks}/3. Explore o Bosque das Potências e os Campos dos Fatores.`;
    }

    function getGenericRealmProgressMessage(realmId) {
      const realmData = getLoadedRealmData(realmId);
      const progress = getRuntimeRealmProgress(realmId);
      const total = getRealmCommonEnemyIds(realmId).length;
      const defeated = getRealmDefeatedCommonCount(realmId);
      const realmName = realmData?.scene?.name || realmData?.name || "Reino";

      if (progress.bossDefeated) {
        return `${realmName} concluído. Seu progresso foi salvo.`;
      }

      if (isRealmBossUnlocked(realmId)) {
        return `Mini-chefe superado. O guardião final de ${realmName} foi liberado.`;
      }

      if (isRealmMiniBossUnlocked(realmId)) {
        return `Todos os inimigos básicos foram derrotados. O mini-chefe de ${realmName} apareceu!`;
      }

      return `Inimigos básicos derrotados: ${defeated}/${total}.`;
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
        if (!progress.bossDefeated) {
          progress.bossDefeated = true;
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
        if (isBoss) return "Guardião superado! O Reino da Matemática foi concluído.";
        if (isMiniBoss) return "Melog eliminado! O Golem dos Cálculos liberou o teste final.";
        if (isMathMiniBossUnlocked()) {
          return "Todos os inimigos básicos foram derrotados. Melog apareceu na Arena Anti-Estudo!";
        }
        return getMathProgressMessage();
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

        if (realmId === "reino-matematica") {
          interactionText.textContent = message || getMathProgressMessage();
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
        { label: "Ranking", x: 1745, y: 1248 }
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
          progress.bossDefeated
        );
      }

      if (gate.type === "boss-unlocked") {
        return Boolean(isRealmBossUnlocked(realmId) || progress.bossDefeated);
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
        "zone-title"
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
        .map((equation) => ({ equation, distance: getWorldEquationDistance(equation) }))
        .filter((entry) => entry.distance <= 105)
        .sort((a, b) => a.distance - b.distance)[0]?.equation || null;
    }

    function getSolvedWorldEquationIds(realmId = "reino-matematica") {
      const progress = getRuntimeRealmProgress(realmId);
      return Array.isArray(progress.solvedWorldEquationIds) ? progress.solvedWorldEquationIds : [];
    }

    function isWorldEquationSolved(equationId) {
      return getSolvedWorldEquationIds().includes(equationId);
    }

    function getMathLogicalRhythmState() {
      const total = mathRealmData.worldEquations?.length || 0;
      const solved = mathRealmData.worldEquations
        ? mathRealmData.worldEquations.filter((equation) => isWorldEquationSolved(equation.id)).length
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

    function updateMathBuffHud() {
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
      nearbyWorldEquation = currentScene?.id === "reino-matematica"
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
      const solved = isWorldEquationSolved(equation.id);
      const rhythm = getMathLogicalRhythmState();

      if (equationPanelKicker) equationPanelKicker.textContent = equation.area || "Equação do Mundo";
      if (equationPanelTitle) equationPanelTitle.textContent = equation.name || "Equação do Mundo";
      if (equationFormula) equationFormula.textContent = equation.formula || "?";
      if (equationPrompt) {
        equationPrompt.textContent = solved
          ? `Mecanismo estabilizado. Ritmo Lógico ativo: +${rhythm.bonusSeconds}s por pergunta neste reino.`
          : (equation.prompt || "Complete a equação para estabilizar esta parte do reino.");
      }

      if (equationOptions) {
        if (solved) {
          equationOptions.innerHTML = `<div class="equation-solved-seal">✓ EQUAÇÃO ESTABILIZADA</div>`;
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
      interactionText.textContent = `${equation.name}: resolva a equação para estabilizar o mundo.`;
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
      if (isWorldEquationSolved(equation.id)) {
        renderWorldEquationPanel("Esta Equação do Mundo já está estável.");
        return;
      }

      const buttons = equationPanel?.querySelectorAll(".equation-option-btn") || [];
      buttons.forEach((button) => { button.disabled = true; });

      if (String(value) !== String(equation.answer)) {
        buttons.forEach((button) => { button.disabled = false; });
        if (equationFeedback) {
          equationFeedback.className = "equation-feedback visible wrong";
          equationFeedback.textContent = "Ainda não. Releia a igualdade e tente descobrir qual valor mantém os dois lados equivalentes.";
        }
        return;
      }

      const progress = getRuntimeRealmProgress("reino-matematica");
      progress.solvedWorldEquationIds = Array.isArray(progress.solvedWorldEquationIds)
        ? progress.solvedWorldEquationIds
        : [];

      if (!progress.solvedWorldEquationIds.includes(equation.id)) {
        progress.solvedWorldEquationIds.push(equation.id);
        progress.lastWorldEquationAt = new Date().toISOString();
        await persistRealmProgress("reino-matematica");
      }

      const rhythm = getMathLogicalRhythmState();
      renderWorldEquationPanel(`${equation.explanation} Ritmo Lógico ${rhythm.stacks}/3: +${rhythm.bonusSeconds}s por pergunta.`);
      updateMathBuffHud();
      buildCollisionAndOcclusionData();
      renderDepthLayer();
      updateNearbyWorldEquation();
      interactionText.textContent = `Equação estabilizada! Ritmo Lógico ${rhythm.stacks}/3 (+${rhythm.bonusSeconds}s por pergunta neste reino).`;
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

    function changeScene(scene, options = {}) {
      currentScene = scene;
      buildings = cloneData(scene.buildings);
      decorObjects = cloneData(scene.decorObjects);
      treeObjects = cloneData(scene.treeObjects);
      npcObjects = cloneData(scene.npcObjects);
      portalObjects = cloneData(scene.portalObjects);
      worldEquationObjects = cloneData(scene.worldEquations || []);
      enemyObjects = getEnemyObjectsForScene(scene);

      if (worldEquationPanelOpen) closeWorldEquationPanel();
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

      if (Array.isArray(npc.dialogue)) {
        return npc.dialogue;
      }

      return [npc.dialogue || "..."];
    }

    function getMathProgressDialogue() {
      const total = getMathCommonEnemyIds().length;
      const defeated = getDefeatedCommonCount();
      const rhythm = getMathLogicalRhythmState();
      const bridgeStable = isWorldEquationSolved("equacao-operacoes-01");

      if (mathProgress.bossDefeated) {
        return [
          "Status do Reino da Matemática: concluído.",
          "A Praça do Infinito, as três zonas de estudo, as Ruínas do Melog e a Fortaleza do Golem registram sua passagem.",
          `Ritmo Lógico estabilizado em ${rhythm.stacks}/3 nesta jornada.`
        ];
      }

      if (isMathBossUnlocked()) {
        return [
          "Status: Fortaleza do Golem acessível.",
          "Melog foi superado e o Portão do Teorema se abriu ao norte.",
          "O Golem dos Cálculos aguarda no último pátio."
        ];
      }

      if (isMathMiniBossUnlocked()) {
        return [
          "Status: Ruínas do Melog acessíveis.",
          `Todos os ${total} inimigos básicos foram derrotados. A corrupção que selava o norte perdeu força.`,
          "Atravesse o selo e encontre Melog nas ruínas."
        ];
      }

      if (!bridgeStable) {
        return [
          `Status: ${defeated}/${total} inimigos básicos derrotados. Ritmo Lógico ${rhythm.stacks}/3.`,
          "A Ponte das Equações ainda está instável e impede o acesso à bifurcação do reino.",
          "Resolva o Núcleo da Ponte no Distrito das Operações para materializar o caminho."
        ];
      }

      return [
        `Status: ${defeated}/${total} inimigos básicos derrotados. Ritmo Lógico ${rhythm.stacks}/3.`,
        "A Ponte das Equações está estável. À esquerda fica o Bosque das Potências; à direita, os Campos dos Fatores.",
        "Limpe as três zonas para enfraquecer o selo das Ruínas do Melog."
      ];
    }

    function getMelogGateDialogue() {
      if (mathProgress.miniBossDefeated || mathProgress.bossDefeated) {
        return [
          "O selo das Ruínas está quebrado.",
          "A corrupção de Melog perdeu força e o caminho agora aponta para a Fortaleza do Golem."
        ];
      }

      if (isMathMiniBossUnlocked()) {
        return [
          "O selo das Ruínas se desfez.",
          "A lógica das três zonas foi restaurada o bastante para atravessar a corrupção.",
          "Melog está logo adiante."
        ];
      }

      const total = getMathCommonEnemyIds().length;
      const defeated = getDefeatedCommonCount();
      return [
        "A corrupção bloqueia fisicamente o caminho para as Ruínas do Melog.",
        `Progresso atual: ${defeated}/${total} inimigos básicos derrotados.`,
        "Restaure as três zonas do reino para enfraquecer este selo."
      ];
    }

    function getGolemGateDialogue() {
      if (mathProgress.bossDefeated) {
        return [
          "O Portão do Teorema permanece aberto.",
          "A Fortaleza do Golem já reconheceu que você concluiu o teste desta jornada."
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

    function renderDialogueLine() {
      if (!currentDialogueNpc) return;

      const lines = getNpcDialogueLines(currentDialogueNpc);
      const currentLine = lines[currentDialogueIndex] || lines[0] || "...";
      const totalLines = Math.max(1, lines.length);
      const currentNumber = Math.min(currentDialogueIndex + 1, totalLines);

      dialogueRole.textContent = currentDialogueNpc.role;
      dialogueName.textContent = currentDialogueNpc.name;
      dialogueText.textContent = currentLine;
      dialoguePortrait.src = currentDialogueNpc.portrait;
      dialoguePortrait.alt = `Retrato de ${currentDialogueNpc.name}`;

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
        const solved = isWorldEquationSolved(equation.id);

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
              <span class="world-equation-label">${solved ? "Equação Estável" : equation.name}</span>
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

      if (dialogueOpen || realmPanelOpen || shopPanelOpen || worldEquationPanelOpen || enemyPanelOpen || window.VoltzDevMenu?.isOpen?.()) {
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

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      if (enemyPanelOpen) {
        if (key === "escape") {
          closeEnemyPanel();
        }

        if ((key === "e" || key === "enter") && !event.repeat && enemyQuestionAnswered) {
          nextEnemyQuestion();
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

    function devTeleportVillage() {
      devCloseBlockingPanels();
      changeScene(villageScene);
      interactionText.textContent = "[DEV] Teleporte: Vila Central.";
      return true;
    }

    async function devSetCommonsDefeated(value) {
      devCloseBlockingPanels();
      const progress = getRuntimeRealmProgress("reino-matematica");
      progress.defeatedEnemyIds = value ? getMathCommonEnemyIds() : [];
      if (!value) {
        progress.miniBossDefeated = false;
        progress.bossDefeated = false;
        progress.completed = false;
        delete progress.completedAt;
      }
      return persistMathDevProgress(value ? "Todos os inimigos comuns marcados como derrotados." : "Inimigos comuns restaurados.");
    }

    async function devSetMiniBossDefeated(value) {
      devCloseBlockingPanels();
      const progress = getRuntimeRealmProgress("reino-matematica");
      if (value) {
        progress.defeatedEnemyIds = getMathCommonEnemyIds();
        progress.miniBossDefeated = true;
      } else {
        progress.miniBossDefeated = false;
        progress.bossDefeated = false;
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
        progress.miniBossDefeated = true;
        progress.bossDefeated = true;
        progress.completed = true;
        progress.completedAt = progress.completedAt || new Date().toISOString();
      } else {
        progress.bossDefeated = false;
        progress.completed = false;
        delete progress.completedAt;
      }
      return persistMathDevProgress(value ? "Golem/guardião marcado como concluído." : "Desafio do Golem restaurado.");
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
        progress.bossDefeated = true;
        progress.completed = true;
        progress.completedAt = progress.completedAt || new Date().toISOString();
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

    // Mantém o estado do mapa alinhado ao perfil após qualquer escrita/leitura do Supabase.
    // Isso também evita uma segunda gravação redundante após a vitória em batalha.
    window.addEventListener("voltz:profile-updated", () => {
      syncAllRealmProgressFromProfile();
      refreshRealmEnemyObjectsAfterProgress(currentScene?.id);
      updateMathBuffHud();
      updateNearbyWorldEquation();
      updateHint();
    });
    window.addEventListener("voltz:profile-updated", () => {
      syncAllRealmProgressFromProfile();
      refreshRealmEnemyObjectsAfterProgress(currentScene?.id);
      updateMathBuffHud();
      if (currentScene?.id === "reino-matematica") {
        renderDepthLayer();
        updateNearbyWorldEquation();
      }
      if (shopPanelOpen) renderShopPanel(shopMessage?.textContent || "");
    });
    gameLoop();
