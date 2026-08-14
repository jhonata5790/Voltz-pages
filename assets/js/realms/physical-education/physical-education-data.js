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
    spawn: { x: 2500, y: 3020 },
    cameraZoom: 1,
    playerScale: 1,
    zoneMarkers: [],

    buildings: [
      { id: "estadio-voltz", label: "Estádio Voltz", x: 1850, y: 70, w: 1300, h: 430, roofH: 175, solid: true },
      { id: "centro-treinamento", label: "Centro de Treinamento", x: 2050, y: 1880, w: 900, h: 340, roofH: 145, solid: true },
      { id: "vestiario-oeste", label: "Vestiário Oeste", x: 380, y: 2400, w: 560, h: 300, roofH: 130, solid: true },
      { id: "vestiario-leste", label: "Vestiário Leste", x: 4060, y: 2400, w: 560, h: 300, roofH: 130, solid: true }
    ],

    decorObjects: [
      /* HUB — grande referência visual do reino. */
      { id: "praca-atletas", label: "Praça dos Atletas", type: "sports-plaza", depthMode: "ground", x: 1850, y: 1030, w: 1300, h: 760, solid: false, showLabel: false },
      { id: "titulo-praca-esportes", label: "⚡ PRAÇA DOS ATLETAS", type: "sports-zone-title-hub", x: 2180, y: 1110, w: 640, h: 52, solid: false, showLabel: true },
      { id: "faixa-central-01", label: "MOVIMENTO • TÉCNICA • RITMO • REFLEXO", type: "sports-banner", x: 1960, y: 1700, w: 1080, h: 58, solid: false, showLabel: true },

      /* OBJETIVO FINAL — ao norte, sempre legível pelo eixo principal. */
      { id: "zona-estadio", label: "Estádio Voltz", type: "sports-stadium-zone", depthMode: "ground", x: 1760, y: 35, w: 1480, h: 535, solid: false, showLabel: false },
      { id: "titulo-estadio", label: "🏆 ESTÁDIO VOLTZ · DESAFIO FINAL", type: "sports-zone-title-championship", x: 2010, y: 500, w: 980, h: 52, solid: false, showLabel: true },
      { id: "podio-final", label: "PÓDIO", type: "sports-podium", x: 2290, y: 300, w: 420, h: 155, solid: true, showLabel: false },

      /* PISTA DO IMPULSO — área protegida: decoração apenas fora do retângulo da pista. */
      { id: "zona-atletismo", label: "Pista do Impulso", type: "sports-athletics-track", depthMode: "ground", x: 240, y: 250, w: 1450, h: 680, solid: false, showLabel: false },
      { id: "titulo-atletismo", label: "🏃 PISTA DO IMPULSO", type: "sports-zone-title-athletics", x: 610, y: 270, w: 710, h: 52, solid: false, showLabel: true },
      { id: "placar-atletismo", label: "Placar", type: "sports-prop-scoreboard", x: 590, y: 935, w: 250, h: 145, solid: false, showLabel: false },
      { id: "arquibancada-atletismo", label: "Arquibancada", type: "sports-prop-bleacher", x: 1010, y: 935, w: 390, h: 150, solid: false, showLabel: false },
      { id: "rack-atletismo", label: "Equipamentos", type: "sports-prop-rack", x: 270, y: 945, w: 230, h: 125, solid: false, showLabel: false },

      /* ARENA DA ESQUIVA — identidade roxa, livre de props no interior. */
      { id: "zona-queimada", label: "Arena da Esquiva", type: "sports-dodgeball-zone", depthMode: "ground", x: 3310, y: 250, w: 1450, h: 680, solid: false, showLabel: false },
      { id: "titulo-queimada", label: "🔴 ARENA DA ESQUIVA", type: "sports-zone-title-dodgeball", x: 3670, y: 270, w: 720, h: 52, solid: false, showLabel: true },
      { id: "placar-queimada", label: "Placar", type: "sports-prop-scoreboard", x: 3500, y: 935, w: 250, h: 145, solid: false, showLabel: false },
      { id: "arquibancada-queimada", label: "Arquibancada", type: "sports-prop-bleacher", x: 4000, y: 935, w: 390, h: 150, solid: false, showLabel: false },
      { id: "rack-queimada", label: "Bolas", type: "sports-prop-rack", x: 4440, y: 945, w: 230, h: 125, solid: false, showLabel: false },

      /* CAMPO DAS DECISÕES — compacto o bastante para uma leitura boa na câmera. */
      { id: "zona-futebol", label: "Campo das Decisões", type: "sports-football-field", depthMode: "ground", x: 240, y: 1210, w: 1450, h: 700, solid: false, showLabel: false },
      { id: "titulo-futebol", label: "⚽ CAMPO DAS DECISÕES", type: "sports-zone-title-football", x: 600, y: 1230, w: 720, h: 52, solid: false, showLabel: true },
      { id: "gol-futebol-oeste", label: "Gol Oeste", type: "sports-goal", x: 265, y: 1450, w: 105, h: 245, solid: true, showLabel: false },
      { id: "gol-futebol-leste", label: "Gol Leste", type: "sports-goal", x: 1560, y: 1450, w: 105, h: 245, solid: true, showLabel: false },
      { id: "placar-futebol", label: "Placar", type: "sports-prop-scoreboard", x: 620, y: 1925, w: 250, h: 145, solid: false, showLabel: false },
      { id: "arquibancada-futebol", label: "Arquibancada", type: "sports-prop-bleacher", x: 1000, y: 1925, w: 390, h: 150, solid: false, showLabel: false },

      /* QUADRA DO RITMO — mesmas dimensões do futebol para equilibrar a leitura. */
      { id: "zona-basquete", label: "Quadra do Ritmo", type: "sports-basketball-court", depthMode: "ground", x: 3310, y: 1210, w: 1450, h: 700, solid: false, showLabel: false },
      { id: "titulo-basquete", label: "🏀 QUADRA DO RITMO", type: "sports-zone-title-basketball", x: 3690, y: 1230, w: 690, h: 52, solid: false, showLabel: true },
      { id: "cesta-basquete-oeste", label: "Cesta Oeste", type: "sports-hoop", x: 3335, y: 1455, w: 115, h: 235, solid: true, showLabel: false },
      { id: "cesta-basquete-leste", label: "Cesta Leste", type: "sports-hoop", x: 4620, y: 1455, w: 115, h: 235, solid: true, showLabel: false },
      { id: "placar-basquete", label: "Placar", type: "sports-prop-scoreboard", x: 3500, y: 1925, w: 250, h: 145, solid: false, showLabel: false },
      { id: "arquibancada-basquete", label: "Arquibancada", type: "sports-prop-bleacher", x: 4000, y: 1925, w: 390, h: 150, solid: false, showLabel: false },

      /* CENTRO DE TREINAMENTO — props ficam nas laterais, deixando a entrada limpa. */
      { id: "rack-ct-oeste", label: "Equipamentos", type: "sports-prop-rack", x: 1780, y: 2070, w: 220, h: 120, solid: false, showLabel: false },
      { id: "rack-ct-leste", label: "Equipamentos", type: "sports-prop-rack", x: 3000, y: 2070, w: 220, h: 120, solid: false, showLabel: false },

      /* QUADRA DA SEQUÊNCIA — setor sul central, antes do portal. */
      { id: "zona-volei", label: "Quadra da Sequência", type: "sports-volleyball-court", depthMode: "ground", x: 1650, y: 2350, w: 1700, h: 590, solid: false, showLabel: false },
      { id: "titulo-volei", label: "🏐 QUADRA DA SEQUÊNCIA", type: "sports-zone-title-volleyball", x: 2070, y: 2370, w: 860, h: 52, solid: false, showLabel: true },
      { id: "rede-volei", label: "Rede", type: "sports-net", x: 2460, y: 2465, w: 80, h: 390, solid: true, showLabel: false },
      { id: "placar-volei", label: "Placar", type: "sports-prop-scoreboard", x: 1760, y: 2940, w: 250, h: 145, solid: false, showLabel: false },
      { id: "arquibancada-volei", label: "Arquibancada", type: "sports-prop-bleacher", x: 2800, y: 2940, w: 390, h: 150, solid: false, showLabel: false },

      /* MOBILIÁRIO DO HUB — sempre fora das pistas e dos corredores principais. */
      { id: "banco-praca-no", label: "Banco", type: "sports-prop-bench", x: 1900, y: 1135, w: 180, h: 90, solid: false, showLabel: false },
      { id: "banco-praca-ne", label: "Banco", type: "sports-prop-bench", x: 2920, y: 1135, w: 180, h: 90, solid: false, showLabel: false },
      { id: "banco-praca-so", label: "Banco", type: "sports-prop-bench", x: 1910, y: 1605, w: 180, h: 90, solid: false, showLabel: false },
      { id: "banco-praca-se", label: "Banco", type: "sports-prop-bench", x: 2910, y: 1605, w: 180, h: 90, solid: false, showLabel: false },
      { id: "canteiro-praca-no", label: "Jardim", type: "sports-prop-planter", x: 2110, y: 1085, w: 160, h: 100, solid: false, showLabel: false },
      { id: "canteiro-praca-ne", label: "Jardim", type: "sports-prop-planter", x: 2730, y: 1085, w: 160, h: 100, solid: false, showLabel: false },
      { id: "canteiro-praca-so", label: "Jardim", type: "sports-prop-planter", x: 2110, y: 1660, w: 160, h: 100, solid: false, showLabel: false },
      { id: "canteiro-praca-se", label: "Jardim", type: "sports-prop-planter", x: 2730, y: 1660, w: 160, h: 100, solid: false, showLabel: false },

      /* LUZES — posicionadas nas bordas dos corredores, nunca no centro da circulação. */
      { id: "luz-eixo-01", label: "Luminária", type: "sports-prop-lamp", x: 1770, y: 650, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-eixo-02", label: "Luminária", type: "sports-prop-lamp", x: 3160, y: 650, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-eixo-03", label: "Luminária", type: "sports-prop-lamp", x: 1770, y: 1810, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-eixo-04", label: "Luminária", type: "sports-prop-lamp", x: 3160, y: 1810, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-eixo-05", label: "Luminária", type: "sports-prop-lamp", x: 1500, y: 2140, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-eixo-06", label: "Luminária", type: "sports-prop-lamp", x: 3430, y: 2140, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-portal-oeste", label: "Luminária", type: "sports-prop-lamp", x: 2220, y: 3000, w: 70, h: 150, solid: false, showLabel: false },
      { id: "luz-portal-leste", label: "Luminária", type: "sports-prop-lamp", x: 2710, y: 3000, w: 70, h: 150, solid: false, showLabel: false }
    ],

    /* Árvores só no perímetro. Nada de tronco em pista, quadra ou corredor. */
    treeObjects: [
      { id: "esporte-arvore-01", label: "Árvore 1", x: 70, y: 80, w: 140, h: 130 },
      { id: "esporte-arvore-02", label: "Árvore 2", x: 360, y: 60, w: 130, h: 122 },
      { id: "esporte-arvore-03", label: "Árvore 3", x: 4520, y: 60, w: 132, h: 124 },
      { id: "esporte-arvore-04", label: "Árvore 4", x: 4780, y: 180, w: 140, h: 130 },
      { id: "esporte-arvore-05", label: "Árvore 5", x: 65, y: 1010, w: 132, h: 122 },
      { id: "esporte-arvore-06", label: "Árvore 6", x: 4800, y: 1020, w: 132, h: 122 },
      { id: "esporte-arvore-07", label: "Árvore 7", x: 65, y: 2110, w: 138, h: 128 },
      { id: "esporte-arvore-08", label: "Árvore 8", x: 4790, y: 2110, w: 138, h: 128 },
      { id: "esporte-arvore-09", label: "Árvore 9", x: 80, y: 2940, w: 140, h: 130 },
      { id: "esporte-arvore-10", label: "Árvore 10", x: 420, y: 3020, w: 126, h: 118 },
      { id: "esporte-arvore-11", label: "Árvore 11", x: 4450, y: 3020, w: 126, h: 118 },
      { id: "esporte-arvore-12", label: "Árvore 12", x: 4780, y: 2940, w: 140, h: 130 }
    ],

    npcObjects: [
      {
        id: "npc-guardiao-retorno-esportes",
        name: "Guardião do Portal",
        role: "Retorno à Vila Central",
        x: 2810,
        y: 3020,
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
        x: 2110,
        y: 1740,
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
        x: 1030,
        y: 2020,
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
        x: 3980,
        y: 2020,
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
        x: 1040,
        y: 1025,
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
        x: 2500,
        y: 2890,
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
        x: 3980,
        y: 1025,
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
        y: 610,
        colorA: "#ffd166",
        colorB: "#9257ff",
        aura: "#ffd166",
        opensSportsMinigame: "championship",
        dialogue: ["O Desafio Final combina versões rápidas das cinco modalidades. O registro só aceita atletas que concluíram todas elas."]
      }
    ],

    portalObjects: [
      { id: "portal-retorno-esportes", name: "Portal da Praça dos Atletas", x: 2500, y: 3100, interactionRange: 0, colorA: "#63f5b5", colorB: "#45a3ff" }
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
