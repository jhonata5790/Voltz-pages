(function initializePhysicalEducationRealmData(global) {
  /* Voltz Education — Reino de Educação Física.
     Terceiro reino jogável. Em vez de batalhas por perguntas, a progressão
     acontece através de minigames esportivos com identidades mecânicas próprias. */

  global.VoltzData = global.VoltzData || {};
  global.VoltzData.realms = global.VoltzData.realms || {};

  const minigames = [
    {
      id: "football",
      name: "Desafio de Futebol",
      icon: "⚽",
      zone: "Campo das Decisões",
      description: "Cobranças de pênalti com escolha de canto e controle de força."
    },
    {
      id: "basketball",
      name: "Desafio de Basquete",
      icon: "🏀",
      zone: "Quadra do Ritmo",
      description: "Arremessos guiados por uma janela precisa de timing."
    },
    {
      id: "athletics",
      name: "Desafio de Atletismo",
      icon: "🏃",
      zone: "Pista do Impulso",
      description: "Largada por reação e corrida com alternância de passadas."
    },
    {
      id: "volleyball",
      name: "Desafio de Vôlei",
      icon: "🏐",
      zone: "Quadra da Sequência",
      description: "Recepção, levantamento e ataque em uma sequência rítmica."
    },
    {
      id: "dodgeball",
      name: "Desafio de Queimada",
      icon: "🔴",
      zone: "Arena da Esquiva",
      description: "Turnos de arremesso alternados com uma fase de esquiva em arena."
    }
  ];

  const scene = {
    id: "reino-educacao-fisica",
    name: "Reino de Educação Física",
    className: "scene-physical-education",
    plazaLabel: "PRAÇA DOS<br>ATLETAS",
    defaultHint: "Reino de Educação Física: conclua as cinco modalidades e prove que movimento também é conhecimento.",
    spawn: { x: 2500, y: 2960 },
    cameraZoom: 1,
    playerScale: 1,
    zoneMarkers: [],

    buildings: [
      { id: "vestiario-oeste", label: "Vestiário Oeste", x: 360, y: 2520, w: 500, h: 290, roofH: 130 },
      { id: "vestiario-leste", label: "Vestiário Leste", x: 4140, y: 2520, w: 500, h: 290, roofH: 130 },
      { id: "centro-treinamento", label: "Centro de Treinamento", x: 2100, y: 2480, w: 800, h: 300, roofH: 135, solid: false },
      { id: "arquibancada-oeste", label: "Arquibancada Oeste", x: 160, y: 1080, w: 620, h: 300, roofH: 120, solid: false },
      { id: "arquibancada-leste", label: "Arquibancada Leste", x: 4220, y: 1080, w: 620, h: 300, roofH: 120, solid: false },
      { id: "estadio-voltz", label: "Estádio Voltz", x: 1675, y: 80, w: 1650, h: 520, roofH: 175, solid: false }
    ],

    decorObjects: [
      { id: "praca-atletas", label: "Praça dos Atletas", type: "sports-plaza", sport: "hub", x: 1850, y: 2740, w: 1300, h: 420, solid: false, showLabel: false },
      { id: "titulo-praca-esportes", label: "⚡ PRAÇA DOS ATLETAS", type: "sports-zone-title", sport: "hub", x: 2200, y: 3070, w: 600, h: 48, solid: false, showLabel: true },

      { id: "zona-futebol", label: "Campo das Decisões", type: "sports-field", sport: "football", x: 330, y: 2020, w: 1900, h: 650, solid: false, showLabel: false },
      { id: "titulo-futebol", label: "⚽ CAMPO DAS DECISÕES", type: "sports-zone-title", sport: "football", x: 880, y: 2550, w: 660, h: 48, solid: false, showLabel: true },
      { id: "gol-futebol", label: "GOL", type: "sports-goal", sport: "football", x: 970, y: 2080, w: 600, h: 145, solid: true, showLabel: false },
      { id: "marca-penalti", label: "●", type: "sports-mark", sport: "football", x: 1210, y: 2390, w: 120, h: 70, solid: false, showLabel: true },

      { id: "zona-basquete", label: "Quadra do Ritmo", type: "sports-court", sport: "basketball", x: 2770, y: 2020, w: 1900, h: 650, solid: false, showLabel: false },
      { id: "titulo-basquete", label: "🏀 QUADRA DO RITMO", type: "sports-zone-title", sport: "basketball", x: 3350, y: 2550, w: 650, h: 48, solid: false, showLabel: true },
      { id: "cesta-basquete", label: "CESTA", type: "sports-hoop", sport: "basketball", x: 3500, y: 2070, w: 420, h: 160, solid: true, showLabel: false },

      { id: "zona-atletismo", label: "Pista do Impulso", type: "sports-track", sport: "athletics", x: 260, y: 1280, w: 1900, h: 650, solid: false, showLabel: false },
      { id: "titulo-atletismo", label: "🏃 PISTA DO IMPULSO", type: "sports-zone-title", sport: "athletics", x: 820, y: 1820, w: 660, h: 48, solid: false, showLabel: true },
      { id: "linha-largada", label: "LARGADA", type: "sports-start-line", sport: "athletics", x: 530, y: 1470, w: 170, h: 300, solid: false, showLabel: true },
      { id: "linha-chegada", label: "CHEGADA", type: "sports-finish-line", sport: "athletics", x: 1730, y: 1470, w: 170, h: 300, solid: false, showLabel: true },

      { id: "zona-volei", label: "Quadra da Sequência", type: "sports-court", sport: "volleyball", x: 2840, y: 1280, w: 1900, h: 650, solid: false, showLabel: false },
      { id: "titulo-volei", label: "🏐 QUADRA DA SEQUÊNCIA", type: "sports-zone-title", sport: "volleyball", x: 3330, y: 1820, w: 760, h: 48, solid: false, showLabel: true },
      { id: "rede-volei", label: "REDE", type: "sports-net", sport: "volleyball", x: 3650, y: 1400, w: 240, h: 420, solid: true, showLabel: false },

      { id: "zona-queimada", label: "Arena da Esquiva", type: "sports-dodgeball-zone", sport: "dodgeball", x: 1680, y: 720, w: 1640, h: 520, solid: false, showLabel: false },
      { id: "titulo-queimada", label: "🔴 ARENA DA ESQUIVA", type: "sports-zone-title", sport: "dodgeball", x: 2180, y: 1130, w: 640, h: 48, solid: false, showLabel: true },
      { id: "linha-meio-queimada", label: "", type: "sports-center-line", sport: "dodgeball", x: 2470, y: 820, w: 60, h: 310, solid: false, showLabel: false },

      { id: "zona-estadio", label: "Estádio Voltz", type: "sports-stadium-zone", sport: "championship", x: 1580, y: 60, w: 1840, h: 620, solid: false, showLabel: false },
      { id: "titulo-estadio", label: "🏆 ESTÁDIO VOLTZ · DESAFIO FINAL", type: "sports-zone-title", sport: "championship", x: 2000, y: 590, w: 1000, h: 48, solid: false, showLabel: true },
      { id: "podio-final", label: "PÓDIO", type: "sports-podium", sport: "championship", x: 2240, y: 250, w: 520, h: 210, solid: true, showLabel: false },

      { id: "faixa-central-01", label: "MOVIMENTO", type: "sports-banner", sport: "hub", x: 2250, y: 2620, w: 500, h: 60, solid: false, showLabel: true },
      { id: "faixa-central-02", label: "TÉCNICA • RITMO • REFLEXO", type: "sports-banner", sport: "hub", x: 2020, y: 2690, w: 960, h: 60, solid: false, showLabel: true }
    ],

    treeObjects: [
      { id: "esporte-arvore-01", label: "Árvore 1", x: 90, y: 2870, w: 120, h: 110 },
      { id: "esporte-arvore-02", label: "Árvore 2", x: 4700, y: 2860, w: 120, h: 110 },
      { id: "esporte-arvore-03", label: "Árvore 3", x: 80, y: 700, w: 118, h: 108 },
      { id: "esporte-arvore-04", label: "Árvore 4", x: 4740, y: 700, w: 118, h: 108 }
    ],

    npcObjects: [
      {
        id: "npc-guardiao-retorno-esportes",
        name: "Guardião do Portal",
        role: "Retorno à Vila Central",
        x: 2920,
        y: 2960,
        colorA: "#63f5b5",
        colorB: "#45a3ff",
        aura: "#ffd166",
        portrait: "assets/images/npcs/guardiao-do-portal.webp",
        returnToVillage: true,
        dialogue: [
          "Bem-vindo ao Reino de Educação Física. Aqui conhecimento não fica parado em uma caixa de alternativas.",
          "Cada área testa uma habilidade diferente: precisão, ritmo, reação, coordenação e leitura de movimento.",
          "Conclua as cinco modalidades. Quando todas estiverem registradas, o Estádio Voltz abrirá o Desafio Final."
        ]
      },
      {
        id: "npc-treinador-reino-esportes",
        name: "Treinador de Energia",
        role: "Mestre do Movimento",
        x: 2070,
        y: 2930,
        colorA: "#63f5b5",
        colorB: "#ffd166",
        aura: "#45a3ff",
        portrait: "assets/images/npcs/treinador-de-energia.webp",
        dialogue: [
          "Na Arena da Vila eu ensino o básico. Aqui você vai provar que consegue aplicar.",
          "Não existe ordem obrigatória para as cinco modalidades. Experimente, erre, entenda a mecânica e tente de novo.",
          "A Queimada é diferente de tudo que você enfrentou até agora: você ataca em um turno e, no seguinte, precisa sobreviver aos arremessos."
        ]
      },
      {
        id: "estacao-futebol",
        name: "Estação de Futebol",
        role: "Campo das Decisões",
        visualType: "terminal",
        x: 1260,
        y: 2470,
        colorA: "#63f5b5",
        colorB: "#1f9b5f",
        aura: "#63f5b5",
        opensSportsMinigame: "football",
        dialogue: ["Precisão e leitura do goleiro. Escolha o canto, controle a força e converta pelo menos três cobranças."]
      },
      {
        id: "estacao-basquete",
        name: "Estação de Basquete",
        role: "Quadra do Ritmo",
        visualType: "terminal",
        x: 3740,
        y: 2470,
        colorA: "#ffb347",
        colorB: "#9b4d18",
        aura: "#ffb347",
        opensSportsMinigame: "basketball",
        dialogue: ["O arremesso depende do tempo certo. Solte a bola dentro da janela de precisão e converta pelo menos três cestas."]
      },
      {
        id: "estacao-atletismo",
        name: "Estação de Atletismo",
        role: "Pista do Impulso",
        visualType: "terminal",
        x: 1260,
        y: 1730,
        colorA: "#8cf7ff",
        colorB: "#2871c8",
        aura: "#8cf7ff",
        opensSportsMinigame: "athletics",
        dialogue: ["Espere o sinal de largada. Depois alterne A e D para construir velocidade sem perder o ritmo."]
      },
      {
        id: "estacao-volei",
        name: "Estação de Vôlei",
        role: "Quadra da Sequência",
        visualType: "terminal",
        x: 3740,
        y: 1730,
        colorA: "#ffd166",
        colorB: "#7f5ed5",
        aura: "#ffd166",
        opensSportsMinigame: "volleyball",
        dialogue: ["Recepção, levantamento e ataque. Leia a sequência e pressione os comandos antes que cada janela termine."]
      },
      {
        id: "estacao-queimada",
        name: "Estação de Queimada",
        role: "Arena da Esquiva",
        visualType: "terminal",
        x: 2500,
        y: 1050,
        colorA: "#ff6b7a",
        colorB: "#7b2945",
        aura: "#ff6b7a",
        opensSportsMinigame: "dodgeball",
        dialogue: ["Seu turno: acerte o arremesso. Turno adversário: mova o Núcleo Voltz com WASD e desvie das bolas dentro da arena."]
      },
      {
        id: "estacao-campeonato",
        name: "Registro do Campeonato",
        role: "Estádio Voltz",
        visualType: "terminal",
        x: 2500,
        y: 520,
        colorA: "#ffd166",
        colorB: "#9257ff",
        aura: "#ffd166",
        opensSportsMinigame: "championship",
        dialogue: ["O Desafio Final combina versões rápidas das cinco modalidades. O registro só aceita atletas que concluíram todas elas."]
      }
    ],

    portalObjects: [
      { id: "portal-retorno-esportes", name: "Portal da Praça dos Atletas", x: 2500, y: 3050, interactionRange: 0, colorA: "#63f5b5", colorB: "#45a3ff" }
    ],

    worldEquations: [],
    enemyObjects: []
  };

  global.VoltzData.realms.physicalEducation = {
    id: "reino-educacao-fisica",
    progressKey: "reino-educacao-fisica",
    name: "Reino de Educação Física",
    enemyTypes: {},
    commonEnemies: [],
    miniBoss: null,
    boss: null,
    minigames,
    scene
  };
})(window);
