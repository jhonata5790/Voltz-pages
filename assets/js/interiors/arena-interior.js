(function registerArenaInterior(global) {
  const registry = global.VoltzInteriors;
  if (!registry) throw new Error("[Arena] interior-data.js precisa carregar antes de arena-interior.js.");

  const trainingQuestions = [
    { text: "Quanto é 18 + 27?", options: { A: "35", B: "45", C: "55", D: "46" }, answer: "B", tip: "Some as dezenas e depois as unidades.", explanation: "18 + 27 = 45." },
    { text: "Quanto é 9 × 7?", options: { A: "56", B: "63", C: "72", D: "49" }, answer: "B", tip: "Pense em 7 grupos de 9.", explanation: "9 × 7 = 63." },
    { text: "Qual número completa 64 ÷ ? = 8?", options: { A: "6", B: "7", C: "8", D: "9" }, answer: "C", tip: "Procure o divisor que transforma 64 em 8.", explanation: "64 ÷ 8 = 8." },
    { text: "Qual é √81?", options: { A: "7", B: "8", C: "9", D: "10" }, answer: "C", tip: "Qual número multiplicado por ele mesmo resulta em 81?", explanation: "9 × 9 = 81, então √81 = 9." },
    { text: "Se x + 12 = 30, quanto vale x?", options: { A: "16", B: "18", C: "20", D: "42" }, answer: "B", tip: "Retire 12 dos dois lados.", explanation: "x = 30 - 12 = 18." }
  ];

  registry.register({
    id: "interior-arena",
    name: "Arena de Treino",
    className: "scene-arena-interior",
    plazaLabel: "",
    defaultHint: "Arena: fale com o Treinador ou pressione E perto do Núcleo de Treino para praticar sem alterar o progresso.",
    spawn: { x: 1250, y: 1110 },
    cameraZoom: 1.05,
    playerScale: 0.74,
    room: { x: 610, y: 235, w: 1280, h: 985, title: "ARENA DE TREINO" },
    transitions: {
      entry: {
        fromSceneId: "vila-central",
        trigger: { x: 1845, y: 615, w: 120, h: 80 },
        movementKey: "up",
        direction: "cima",
        message: "Entrando na Arena de Treino..."
      },
      exit: {
        toSceneId: "vila-central",
        trigger: { x: 1180, y: 1155, w: 140, h: 78 },
        movementKey: "down",
        spawn: { x: 1905, y: 720 },
        direction: "baixo",
        message: "Você saiu da Arena de Treino.",
        hint: "Continue para baixo para sair da Arena."
      }
    },
    render(scene) {
      const r = scene.room;
      return `
        <div class="arena-room" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;">
          <div class="arena-room-glow"></div>
          <div class="arena-wall arena-wall-north"></div>
          <div class="arena-wall arena-wall-west"></div>
          <div class="arena-wall arena-wall-east"></div>
          <div class="arena-wall arena-wall-south arena-wall-south-left"></div>
          <div class="arena-wall arena-wall-south arena-wall-south-right"></div>
          <div class="arena-door"><span>VILA CENTRAL</span></div>
          <div class="arena-title">${r.title}</div>
          <div class="arena-ring"><span>SIMULAÇÃO</span></div>
          <div class="arena-scoreboard"><strong>PROTOCOLO DE TREINO</strong><span>Sem XP · Sem moedas · Sem alteração de progresso</span></div>
          <div class="arena-floor-grid"></div>
        </div>`;
    },
    customColliders: [
      { id: "arena-parede-norte", label: "Parede norte da Arena", x: 610, y: 235, w: 1280, h: 40 },
      { id: "arena-parede-oeste", label: "Parede oeste da Arena", x: 610, y: 235, w: 40, h: 985 },
      { id: "arena-parede-leste", label: "Parede leste da Arena", x: 1850, y: 235, w: 40, h: 985 },
      { id: "arena-parede-sul-esq", label: "Parede sul da Arena", x: 610, y: 1180, w: 570, h: 40 },
      { id: "arena-parede-sul-dir", label: "Parede sul da Arena", x: 1320, y: 1180, w: 570, h: 40 }
    ],
    decorObjects: [
      { id: "arena-barreira-esq", label: "Barreira de treino", type: "arena-barrier", x: 760, y: 520, w: 130, h: 54, solid: true, showLabel: false, collider: { x: 8, y: 24, w: 114, h: 30 } },
      { id: "arena-barreira-dir", label: "Barreira de treino", type: "arena-barrier", x: 1610, y: 520, w: 130, h: 54, solid: true, showLabel: false, collider: { x: 8, y: 24, w: 114, h: 30 } },
      { id: "arena-console", label: "Console de simulação", type: "arena-console", x: 775, y: 880, w: 170, h: 86, solid: true, showLabel: true, collider: { x: 10, y: 46, w: 150, h: 40 } },
      { id: "arena-armario", label: "Equipamentos", type: "arena-locker", x: 1570, y: 845, w: 180, h: 120, solid: true, showLabel: true, collider: { x: 12, y: 66, w: 156, h: 54 } }
    ],
    npcObjects: [{
      id: "npc-treinador-energia",
      name: "Treinador de Energia",
      role: "Arena de Treino",
      x: 940,
      y: 760,
      colorA: "#ff4d7d",
      colorB: "#9257ff",
      aura: "#ff4d7d",
      portrait: "assets/images/npcs/treinador-de-energia.webp",
      dialogue: [
        "Aqui dentro o combate é simulado. Você pode praticar quantas vezes quiser sem mexer no seu save.",
        "Acertou, você ataca. Errou ou deixou o tempo acabar, você recebe dano como em um Reino de verdade.",
        "O Núcleo de Treino no centro usa perguntas mistas de Matemática. Nem XP, nem moedas, nem inimigos derrotados são registrados.",
        "E seus consumíveis ficam bloqueados durante a simulação. Treino é treino; recurso de jornada é outra coisa."
      ]
    }],
    enemyObjects: [{
      id: "arena-nucleo-treino",
      typeId: "soma-subtracao",
      enemyRank: "training",
      trainingBattle: true,
      x: 1450,
      y: 720,
      originX: 1450,
      originY: 720,
      patrol: "circle",
      rangeX: 28,
      rangeY: 22,
      speed: 0.00075,
      phase: 1.1,
      direction: "baixo",
      typeOverride: {
        id: "nucleo-treino",
        name: "Núcleo de Treino",
        role: "Simulação educativa",
        description: "Uma projeção da Arena criada para praticar o sistema de batalha sem alterar o progresso.",
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "rgba(0,234,255,0.22)",
        maxHp: 150,
        timeLimit: 35,
        playerDamageOnWrong: 12,
        enemyDamageOnCorrect: 34,
        xpReward: 0,
        coinReward: 0,
        questions: trainingQuestions
      }
    }],
    buildings: [], treeObjects: [], portalObjects: []
  });
})(window);
