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

    const mathProgress = {
      defeatedEnemyIds: [],
      miniBossDefeated: false,
      bossDefeated: false
    };

    function getMathProgressSnapshot() {
      return {
        defeatedEnemyIds: [...mathProgress.defeatedEnemyIds],
        miniBossDefeated: Boolean(mathProgress.miniBossDefeated),
        bossDefeated: Boolean(mathProgress.bossDefeated)
      };
    }

    function persistMathProgress() {
      if (!window.VoltzProfile?.setRealmProgress) return;
      window.VoltzProfile
        .setRealmProgress("reino-matematica", getMathProgressSnapshot())
        .catch((error) => console.error("Falha ao salvar progresso da Matemática:", error));
    }

    function hydrateMathProgress() {
      if (!window.VoltzProfile?.ready) return;

      window.VoltzProfile.ready
        .then(() => {
          const saved = window.VoltzProfile.getRealmProgress?.("reino-matematica");
          if (!saved || typeof saved !== "object") return;

          mathProgress.defeatedEnemyIds = Array.isArray(saved.defeatedEnemyIds)
            ? [...new Set(saved.defeatedEnemyIds.filter((id) => typeof id === "string"))]
            : [];
          mathProgress.miniBossDefeated = Boolean(saved.miniBossDefeated);
          mathProgress.bossDefeated = Boolean(saved.bossDefeated);

          if (currentScene?.id === "reino-matematica") {
            refreshMathEnemyObjectsAfterProgress();
          }
        })
        .catch((error) => console.error("Falha ao carregar progresso da Matemática:", error));
    }

    function isEnemyDefeated(enemyId) {
      return mathProgress.defeatedEnemyIds.includes(enemyId);
    }

    function getMathCommonEnemies() {
      return createMathEnemies();
    }

    function getMathCommonEnemyIds() {
      return getMathCommonEnemies().map((enemy) => enemy.id);
    }

    function getDefeatedCommonCount() {
      const commonIds = getMathCommonEnemyIds();
      return commonIds.filter((id) => isEnemyDefeated(id)).length;
    }

    function areAllMathCommonsDefeated() {
      const commonIds = getMathCommonEnemyIds();
      return commonIds.length > 0 && commonIds.every((id) => isEnemyDefeated(id));
    }

    function isMathMiniBossUnlocked() {
      return areAllMathCommonsDefeated() && !mathProgress.miniBossDefeated;
    }

    function isMathBossUnlocked() {
      return areAllMathCommonsDefeated() && mathProgress.miniBossDefeated && !mathProgress.bossDefeated;
    }

    function createMathMiniBoss() {
      return cloneData(mathRealmData.miniBoss);
    }

    function createMathBoss() {
      return cloneData(mathRealmData.boss);
    }

    function getMathEnemyObjectsByProgress() {
      const commonEnemies = getMathCommonEnemies().filter((enemy) => !isEnemyDefeated(enemy.id));

      if (isMathBossUnlocked()) {
        return [...commonEnemies, createMathBoss()];
      }

      if (isMathMiniBossUnlocked()) {
        return [...commonEnemies, createMathMiniBoss()];
      }

      return commonEnemies;
    }

    function getMathProgressMessage() {
      const total = getMathCommonEnemyIds().length;
      const defeated = getDefeatedCommonCount();

      if (mathProgress.bossDefeated) {
        return "Todos os desafios do Reino da Matemática foram concluídos. Fale com a Professora Sintaxe na Vila Central para reiniciar a jornada.";
      }

      if (isMathBossUnlocked()) {
        return "Melog foi derrotado. O Golem dos Cálculos liberou o Santuário Final para testar seu domínio.";
      }

      if (isMathMiniBossUnlocked()) {
        return "Ameaça liberada! Melog apareceu na Arena Anti-Estudo para tentar destruir a lógica do reino.";
      }

      if (mathProgress.miniBossDefeated) {
        return "Mini-chefe eliminado. O Chefe da Matemática está surgindo no núcleo do reino.";
      }

      return `Inimigos básicos derrotados: ${defeated}/${total}. Derrote todos para revelar Melog, a ameaça anti-estudo.`;
    }

    function registerEnemyDefeat(enemySnapshot) {
      if (!enemySnapshot) return "";

      if (enemySnapshot.enemyRank === "miniBoss" || enemySnapshot.typeId === "mini-chefe-equacao") {
        mathProgress.miniBossDefeated = true;
        persistMathProgress();
        return "Melog eliminado! O Golem dos Cálculos liberou o teste final.";
      }

      if (enemySnapshot.enemyRank === "boss" || enemySnapshot.typeId === "chefe-golem-calculos") {
        mathProgress.bossDefeated = true;
        persistMathProgress();
        return "Guardião superado! O Reino da Matemática foi concluído.";
      }

      if (!mathProgress.defeatedEnemyIds.includes(enemySnapshot.id)) {
        mathProgress.defeatedEnemyIds.push(enemySnapshot.id);
      }

      persistMathProgress();

      if (isMathMiniBossUnlocked()) {
        return "Todos os inimigos básicos foram derrotados. Melog apareceu na Arena Anti-Estudo!";
      }

      return getMathProgressMessage();
    }

    function resetMathProgress() {
      mathProgress.defeatedEnemyIds = [];
      mathProgress.miniBossDefeated = false;
      mathProgress.bossDefeated = false;
      persistMathProgress();

      if (currentScene && currentScene.id === "reino-matematica") {
        enemyObjects = getMathEnemyObjectsByProgress();
        renderSceneObjects();
        updateNearbyEnemy();
        if (keys.debugColliders) renderColliderDebugLayer();
      }

      interactionText.textContent = "Jornada da Matemática reiniciada. Todos os inimigos voltaram ao mapa.";
    }

    function refreshMathEnemyObjectsAfterProgress() {
      if (!currentScene || currentScene.id !== "reino-matematica") return;

      enemyObjects = getMathEnemyObjectsByProgress();
      renderSceneObjects();
      updateNearbyEnemy();
      if (keys.debugColliders) renderColliderDebugLayer();
    }

    function completeEnemyDefeatFromBattle(enemySnapshot) {
      if (!enemySnapshot) return;

      const liveEnemy = enemyObjects.find((enemy) => enemy.id === enemySnapshot.id);
      if (liveEnemy) liveEnemy.defeatedPending = true;

      const element = document.querySelector(`[data-enemy-id="${enemySnapshot.id}"]`);
      const finish = () => {
        const message = registerEnemyDefeat(enemySnapshot);
        refreshMathEnemyObjectsAfterProgress();
        interactionText.textContent = message || getMathProgressMessage();
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
      enemyObjects: getMathEnemyObjectsByProgress()
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
      enemyObjects = currentScene.id === "reino-matematica" ? getMathEnemyObjectsByProgress() : cloneData(currentScene.enemyObjects || []);
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
      return keys.run ? playerState.runSpeed : playerState.baseSpeed;
    }

    function buildCollisionAndOcclusionData() {
      const buildingColliders = buildings.flatMap(getBuildingPhysicalColliders);
      const decorColliders = decorObjects
        .filter((decor) => decor.solid)
        .map(getDecorPhysicalCollider);

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

    function getDecorVisualClass(decor) {
      const baseClass = decor.type ? `decor-${decor.type}` : "decor-wall";
      const operationClass = decor.operation ? `operation-${decor.operation}` : "";
      return `${baseClass} ${operationClass}`.trim();
    }

    function getDecorSortY(decor) {
      if (decor.type === "water") {
        return Math.round(decor.y + decor.h * 0.58);
      }

      if (decor.type === "math-pad" || decor.type === "math-symbol" || decor.type === "number-line") {
        return Math.round(decor.y + decor.h * 0.52);
      }

      return Math.round(decor.y + decor.h);
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
      enemyObjects = scene.id === "reino-matematica" ? getMathEnemyObjectsByProgress() : cloneData(scene.enemyObjects || []);

      nearbyNpc = null;
      nearbyEnemy = null;
      nearbyPortal = null;
      lastCollisionLabel = "livre";
      currentOcclusionLabel = "nada";

      applySceneVisualState(scene);
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

      if (mathProgress.bossDefeated) {
        return [
          "Status do Reino da Matemática: concluído.",
          "Você derrotou os inimigos básicos, venceu Melog e superou o teste do Golem dos Cálculos.",
          "Para repetir a jornada, volte à Vila Central e fale com a Professora Sintaxe."
        ];
      }

      if (isMathBossUnlocked()) {
        return [
          "Status: Golem dos Cálculos liberado.",
          "Melog foi eliminado. O Santuário do Golem está pronto para o teste final.",
          "Vá ao norte do reino e enfrente o Guardião Final da Matemática."
        ];
      }

      if (isMathMiniBossUnlocked()) {
        return [
          "Status: Melog revelado.",
          "Todos os inimigos básicos foram derrotados. A ameaça anti-estudo apareceu na arena central.",
          "Derrote Melog para liberar o Golem dos Cálculos."
        ];
      }

      return [
        `Status: ${defeated}/${total} inimigos básicos derrotados.`,
        "Complete as três áreas: Adição/Subtração, Multiplicação/Divisão e Potenciação/Radiciação.",
        "Quando todos forem derrotados, Melog aparecerá na Arena Anti-Estudo."
      ];
    }

    function getMelogGateDialogue() {
      if (mathProgress.miniBossDefeated || mathProgress.bossDefeated) {
        return [
          "O Portão do Melog está aberto e silencioso.",
          "A ameaça anti-estudo já foi derrotada. Agora o caminho aponta para o Golem dos Cálculos."
        ];
      }

      if (isMathMiniBossUnlocked()) {
        return [
          "O Portão do Melog está aberto.",
          "Melog odeia contas, estudo e qualquer coisa que organize pensamento.",
          "Entre na arena central e derrote essa ameaça para proteger o Reino da Matemática."
        ];
      }

      const total = getMathCommonEnemyIds().length;
      const defeated = getDefeatedCommonCount();
      return [
        "O Portão do Melog está bloqueado.",
        `Progresso atual: ${defeated}/${total} inimigos básicos derrotados.`,
        "Derrote todos os inimigos básicos para revelar a ameaça anti-estudo."
      ];
    }

    function getGolemGateDialogue() {
      if (mathProgress.bossDefeated) {
        return [
          "O Santuário do Golem está calmo.",
          "Você já superou o teste final da Matemática. O reino reconhece seu progresso."
        ];
      }

      if (isMathBossUnlocked()) {
        return [
          "O Santuário do Golem está aberto.",
          "O Golem dos Cálculos não é uma ameaça: ele é o guardião final do reino.",
          "Enfrente-o para provar que dominou a Matemática desta primeira jornada."
        ];
      }

      if (isMathMiniBossUnlocked()) {
        return [
          "O Santuário do Golem continua fechado.",
          "Antes do teste final, o reino precisa ser protegido de Melog.",
          "Derrote a ameaça anti-estudo na arena central."
        ];
      }

      return [
        "O Santuário do Golem está selado.",
        "O Guardião dos Cálculos só desperta quando o caminho básico do reino é concluído.",
        "Primeiro derrote os inimigos das três áreas de treino."
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

      depthLayer.innerHTML = `${decorHtml}${buildingHtml}${treeHtml}${portalHtml}${npcHtml}${enemyHtml}`;
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

      if (dialogueOpen || realmPanelOpen || shopPanelOpen || enemyPanelOpen) {
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
          interactWithNearbyNpc();
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
      enemyObjects = currentScene.id === "reino-matematica" ? getMathEnemyObjectsByProgress() : cloneData(currentScene.enemyObjects || []);
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
      updateDebug();
    });

    window.completeEnemyDefeatFromBattle = completeEnemyDefeatFromBattle;
    window.resetMathProgress = resetMathProgress;
    window.closeRealmPanel = closeRealmPanel;
    window.closeShopPanel = closeShopPanel;
    window.buyShopHint = buyShopHint;
    window.selectRealm = selectRealm;
    window.getActiveSceneId = () => currentScene.id;

    setupPlayer();
    hydrateMathProgress();
    window.addEventListener("voltz:profile-ready", hydrateMathProgress, { once: true });
    window.addEventListener("voltz:profile-updated", () => {
      if (shopPanelOpen) renderShopPanel(shopMessage?.textContent || "");
    });
    gameLoop();
