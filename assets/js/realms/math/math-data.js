(function initializeMathRealmData(global) {
  /* Voltz Education — dados do Reino da Matemática.
     Este arquivo contém conteúdo e configuração do reino, não regras do motor.
     Use este formato como molde para Português, Ciências, História e Geografia. */

  global.VoltzData = global.VoltzData || {};
  global.VoltzData.realms = global.VoltzData.realms || {};

  const enemyTypes = {
    "soma-subtracao": {
      id: "soma-subtracao",
      name: "Somador Errante",
      role: "Adição e Subtração",
      icon: "+ −",
      colorA: "#00eaff",
      colorB: "#ffd166",
      aura: "rgba(0,234,255,0.22)",
      description: "Criatura numérica que mistura sinais simples para testar cálculo rápido.",
      maxHp: 100,
      playerDamageOnWrong: 12,
      playerDamageOnTimeout: 5,
      enemyDamageOnCorrect: 25,
      timeLimit: 35,
      xpReward: 40,
      coinReward: 12,
      questions: [
        {
          tip: "Some primeiro as dezenas e depois as unidades.",
          text: "Quanto é 18 + 27?",
          options: { A: "35", B: "45", C: "44", D: "55" },
          answer: "B",
          explanation: "18 + 27 = 45."
        },
        {
          tip: "Na subtração, pense quanto falta de 46 até 90.",
          text: "Quanto é 90 − 46?",
          options: { A: "34", B: "40", C: "44", D: "54" },
          answer: "C",
          explanation: "90 − 46 = 44."
        },
        {
          tip: "Resolva da esquerda para a direita: soma e depois subtrai.",
          text: "Quanto é 125 + 75 − 50?",
          options: { A: "100", B: "125", C: "150", D: "200" },
          answer: "C",
          explanation: "125 + 75 = 200; 200 − 50 = 150."
        },
        {
          tip: "Junte perdas e ganhos na ordem da história.",
          text: "Sofia tinha 32 moedas, perdeu 9 e ganhou 14. Com quantas moedas ela ficou?",
          options: { A: "37", B: "38", C: "39", D: "41" },
          answer: "A",
          explanation: "32 − 9 = 23; 23 + 14 = 37."
        },
        {
          tip: "Subtraia primeiro e depois some o bônus final.",
          text: "Quanto é 300 − 125 + 40?",
          options: { A: "175", B: "205", C: "215", D: "225" },
          answer: "C",
          explanation: "300 − 125 = 175; 175 + 40 = 215."
        }
      ]
    },
    "multiplicacao-divisao": {
      id: "multiplicacao-divisao",
      name: "Fator Duplo",
      role: "Multiplicação e Divisão",
      icon: "× ÷",
      colorA: "#9257ff",
      colorB: "#78f7ff",
      aura: "rgba(146,87,255,0.24)",
      description: "Entidade de fatores que transforma grupos iguais em desafio.",
      maxHp: 120,
      playerDamageOnWrong: 15,
      playerDamageOnTimeout: 6,
      enemyDamageOnCorrect: 24,
      timeLimit: 30,
      xpReward: 55,
      coinReward: 16,
      questions: [
        {
          tip: "Lembre da tabuada do 8.",
          text: "Quanto é 8 × 7?",
          options: { A: "48", B: "54", C: "56", D: "64" },
          answer: "C",
          explanation: "8 × 7 = 56."
        },
        {
          tip: "Dividir por 12 é procurar qual número multiplicado por 12 dá 96.",
          text: "Quanto é 96 ÷ 12?",
          options: { A: "6", B: "7", C: "8", D: "9" },
          answer: "C",
          explanation: "12 × 8 = 96, então 96 ÷ 12 = 8."
        },
        {
          tip: "Multiplicação vem antes da adição.",
          text: "Quanto é 15 × 4 + 20?",
          options: { A: "60", B: "70", C: "80", D: "100" },
          answer: "C",
          explanation: "15 × 4 = 60; 60 + 20 = 80."
        },
        {
          tip: "Pense em 6 grupos iguais formando 144.",
          text: "Quanto é 144 ÷ 6?",
          options: { A: "22", B: "24", C: "26", D: "28" },
          answer: "B",
          explanation: "6 × 24 = 144, então 144 ÷ 6 = 24."
        },
        {
          tip: "Multiplique primeiro e depois divida.",
          text: "Quanto é 9 × 6 ÷ 3?",
          options: { A: "12", B: "15", C: "18", D: "27" },
          answer: "C",
          explanation: "9 × 6 = 54; 54 ÷ 3 = 18."
        }
      ]
    },
    "potencia-radiciacao": {
      id: "potencia-radiciacao",
      name: "Raiz Arcana",
      role: "Potenciação e Radiciação",
      icon: "x² √",
      colorA: "#ffd166",
      colorB: "#9257ff",
      aura: "rgba(255,209,102,0.22)",
      description: "Cristal vivo que guarda quadrados perfeitos, potências e raízes.",
      questions: [
        {
          tip: "2 elevado a 5 significa multiplicar cinco fatores 2.",
          text: "Quanto é 2⁵?",
          options: { A: "10", B: "16", C: "25", D: "32" },
          answer: "D",
          explanation: "2⁵ = 2 × 2 × 2 × 2 × 2 = 32."
        },
        {
          tip: "Procure o número que multiplicado por ele mesmo dá 81.",
          text: "Qual é a raiz quadrada de 81?",
          options: { A: "7", B: "8", C: "9", D: "10" },
          answer: "C",
          explanation: "9 × 9 = 81, então √81 = 9."
        },
        {
          tip: "Resolva a potência e a raiz separadamente, depois some.",
          text: "Quanto é 3³ + √16?",
          options: { A: "27", B: "29", C: "31", D: "35" },
          answer: "C",
          explanation: "3³ = 27 e √16 = 4; 27 + 4 = 31."
        },
        {
          tip: "Quadrado de um número é ele vezes ele mesmo.",
          text: "Quanto é 5²?",
          options: { A: "10", B: "20", C: "25", D: "50" },
          answer: "C",
          explanation: "5² = 5 × 5 = 25."
        },
        {
          tip: "Calcule a raiz primeiro e depois divida.",
          text: "Quanto é √144 ÷ 3?",
          options: { A: "3", B: "4", C: "6", D: "12" },
          answer: "B",
          explanation: "√144 = 12; 12 ÷ 3 = 4."
        }
      ]
    },
    "mini-chefe-equacao": {
      id: "mini-chefe-equacao",
      name: "Melog",
      role: "Ameaça Anti-Estudo",
      icon: "∅",
      colorA: "#ff4d7d",
      colorB: "#9257ff",
      aura: "rgba(255,77,125,0.24)",
      battleImage: "assets/images/mini-bosses/melog.webp",
      description: "Inimigo do Golem dos Cálculos. Melog odeia estudar, bagunça contas e tenta quebrar a lógica do reino.",
      maxHp: 180,
      playerDamageOnWrong: 18,
      playerDamageOnTimeout: 8,
      enemyDamageOnCorrect: 30,
      timeLimit: 28,
      xpReward: 120,
      coinReward: 35,
      questions: [
        {
          tip: "Resolva multiplicação antes da soma.",
          text: "Quanto é 12 + 4 × 5?",
          options: { A: "32", B: "80", C: "44", D: "60" },
          answer: "A",
          explanation: "4 × 5 = 20; 12 + 20 = 32."
        },
        {
          tip: "Faça a divisão primeiro e depois subtraia.",
          text: "Quanto é 90 − 36 ÷ 6?",
          options: { A: "9", B: "84", C: "54", D: "86" },
          answer: "B",
          explanation: "36 ÷ 6 = 6; 90 − 6 = 84."
        },
        {
          tip: "Potência antes da soma.",
          text: "Quanto é 5² + 15?",
          options: { A: "25", B: "30", C: "40", D: "45" },
          answer: "C",
          explanation: "5² = 25; 25 + 15 = 40."
        },
        {
          tip: "Raiz primeiro, depois multiplicação.",
          text: "Quanto é √64 × 3?",
          options: { A: "18", B: "21", C: "24", D: "30" },
          answer: "C",
          explanation: "√64 = 8; 8 × 3 = 24."
        },
        {
          tip: "Resolva por partes: parênteses, potência e divisão.",
          text: "Quanto é (18 − 6) + 2³ ÷ 2?",
          options: { A: "14", B: "16", C: "18", D: "20" },
          answer: "B",
          explanation: "18 − 6 = 12; 2³ = 8; 8 ÷ 2 = 4; 12 + 4 = 16."
        }
      ]
    },
    "chefe-golem-calculos": {
      id: "chefe-golem-calculos",
      name: "Golem dos Cálculos",
      role: "Guardião Final da Matemática",
      icon: "∑",
      colorA: "#ffd166",
      colorB: "#9257ff",
      aura: "rgba(255,209,102,0.28)",
      battleImage: "assets/images/bosses/golem-dos-calculos.webp",
      description: "Guardião do Reino da Matemática. Ele não odeia o jogador: ele testa se você dominou o caminho dos cálculos.",
      maxHp: 240,
      playerDamageOnWrong: 22,
      playerDamageOnTimeout: 10,
      enemyDamageOnCorrect: 32,
      timeLimit: 25,
      xpReward: 260,
      coinReward: 80,
      questions: [
        {
          tip: "Resolva potência, multiplicação e soma na ordem correta.",
          text: "Quanto é 3² + 6 × 4?",
          options: { A: "33", B: "36", C: "45", D: "60" },
          answer: "A",
          explanation: "3² = 9; 6 × 4 = 24; 9 + 24 = 33."
        },
        {
          tip: "Raiz e divisão antes da subtração.",
          text: "Quanto é 100 − √81 − 24 ÷ 6?",
          options: { A: "83", B: "87", C: "90", D: "95" },
          answer: "B",
          explanation: "√81 = 9 e 24 ÷ 6 = 4; 100 − 9 − 4 = 87."
        },
        {
          tip: "Resolva o parêntese primeiro.",
          text: "Quanto é (14 + 6) × 3 − 10?",
          options: { A: "40", B: "50", C: "60", D: "70" },
          answer: "B",
          explanation: "14 + 6 = 20; 20 × 3 = 60; 60 − 10 = 50."
        },
        {
          tip: "Calcule as potências e depois divida.",
          text: "Quanto é 4² + 2⁴ ÷ 4?",
          options: { A: "18", B: "20", C: "24", D: "32" },
          answer: "B",
          explanation: "4² = 16; 2⁴ = 16; 16 ÷ 4 = 4; 16 + 4 = 20."
        },
        {
          tip: "Faça raiz, multiplicação e depois soma/subtração.",
          text: "Quanto é √144 + 7 × 5 − 20?",
          options: { A: "17", B: "27", C: "37", D: "47" },
          answer: "B",
          explanation: "√144 = 12; 7 × 5 = 35; 12 + 35 − 20 = 27."
        }
      ]
    }
  };

  function createCommonEnemies() {
    return [
      { id: "soma-01", typeId: "soma-subtracao", x: 680, y: 840, patrol: "horizontal", rangeX: 105, rangeY: 30, speed: 0.00125, phase: 0.1, questionIndex: 0 },
      { id: "soma-02", typeId: "soma-subtracao", x: 820, y: 930, patrol: "circle", rangeX: 68, rangeY: 46, speed: 0.0012, phase: 1.6, questionIndex: 1 },
      { id: "soma-03", typeId: "soma-subtracao", x: 935, y: 810, patrol: "vertical", rangeX: 28, rangeY: 82, speed: 0.0011, phase: 2.9, questionIndex: 2 },

      { id: "fator-01", typeId: "multiplicacao-divisao", x: 1605, y: 835, patrol: "horizontal", rangeX: 110, rangeY: 34, speed: 0.0011, phase: 0.7, questionIndex: 0 },
      { id: "fator-02", typeId: "multiplicacao-divisao", x: 1760, y: 930, patrol: "circle", rangeX: 70, rangeY: 52, speed: 0.00118, phase: 2.1, questionIndex: 1 },
      { id: "fator-03", typeId: "multiplicacao-divisao", x: 1880, y: 810, patrol: "vertical", rangeX: 30, rangeY: 90, speed: 0.0012, phase: 3.2, questionIndex: 2 },

      { id: "raiz-01", typeId: "potencia-radiciacao", x: 1110, y: 560, patrol: "circle", rangeX: 66, rangeY: 50, speed: 0.00124, phase: 0.4, questionIndex: 0 },
      { id: "raiz-02", typeId: "potencia-radiciacao", x: 1255, y: 645, patrol: "horizontal", rangeX: 95, rangeY: 30, speed: 0.00105, phase: 1.9, questionIndex: 1 },
      { id: "raiz-03", typeId: "potencia-radiciacao", x: 1395, y: 555, patrol: "circle", rangeX: 66, rangeY: 50, speed: 0.00124, phase: 2.6, questionIndex: 2 }
    ].map((enemy) => ({
      ...enemy,
      originX: enemy.x,
      originY: enemy.y,
      lastX: enemy.x,
      lastY: enemy.y,
      direction: "baixo"
    }));
  }

  const miniBoss = {
    id: "mini-chefe-equacao",
    typeId: "mini-chefe-equacao",
    x: 1250,
    y: 760,
    patrol: "circle",
    rangeX: 96,
    rangeY: 62,
    speed: 0.00102,
    phase: 0.3,
    questionIndex: 0,
    originX: 1250,
    originY: 760,
    lastX: 1250,
    lastY: 760,
    direction: "baixo",
    enemyRank: "miniBoss"
  };

  const boss = {
    id: "chefe-golem-calculos",
    typeId: "chefe-golem-calculos",
    x: 1250,
    y: 455,
    patrol: "vertical",
    rangeX: 0,
    rangeY: 48,
    speed: 0.00088,
    phase: 1.4,
    questionIndex: 0,
    originX: 1250,
    originY: 560,
    lastX: 1250,
    lastY: 560,
    direction: "baixo",
    enemyRank: "boss"
  };

  const scene = {
    id: "reino-matematica",
    name: "Reino da Matemática",
    className: "scene-math",
    plazaLabel: "NÚCLEO<br>NUMÉRICO",
    defaultHint: "Reino da Matemática: enfrente os inimigos espalhados pelo reino e proteja o conhecimento.",
    spawn: { x: 1250, y: 1305 },
    zoneMarkers: [],
    buildings: [
      { id: "portico-retorno", label: "Pórtico de Retorno", x: 1015, y: 115, w: 470, h: 260, roofH: 120, solid: false },
      { id: "arquivo-numeros", label: "Arquivo dos Números", x: 285, y: 330, w: 430, h: 270, roofH: 136 },
      { id: "forja-fatores", label: "Forja dos Fatores", x: 1785, y: 330, w: 430, h: 270, roofH: 136 },
      { id: "laboratorio-raizes", label: "Laboratório de Raízes", x: 990, y: 820, w: 520, h: 275, roofH: 140 },
      { id: "mural-equacoes", label: "Mural de Equações", x: 260, y: 1120, w: 390, h: 235, roofH: 118 },
      { id: "torre-problemas", label: "Torre dos Problemas", x: 1850, y: 1120, w: 390, h: 235, roofH: 118 }
    ],
    decorObjects: [
      { id: "arena-soma", label: "Adição e Subtração", type: "math-pad", operation: "soma", x: 555, y: 742, w: 430, h: 250, solid: false, showLabel: false },
      { id: "arena-fator", label: "Multiplicação e Divisão", type: "math-pad", operation: "fator", x: 1515, y: 742, w: 430, h: 250, solid: false, showLabel: false },
      { id: "arena-raiz", label: "Potências e Raízes", type: "math-pad", operation: "raiz", x: 1035, y: 455, w: 430, h: 250, solid: false, showLabel: false },
      { id: "arena-melog", label: "Arena Anti-Estudo", type: "boss-pad", operation: "melog", x: 1040, y: 690, w: 420, h: 220, solid: false, showLabel: false },
      { id: "santuario-golem", label: "Santuário do Golem", type: "boss-pad", operation: "golem", x: 1030, y: 250, w: 440, h: 230, solid: false, showLabel: false },
      { id: "portao-melog-visual", label: "Portão do Melog", type: "gate", operation: "melog", x: 1130, y: 910, w: 240, h: 58, solid: false, showLabel: false },
      { id: "portao-golem-visual", label: "Portão do Golem", type: "gate", operation: "golem", x: 1120, y: 525, w: 260, h: 58, solid: false, showLabel: false },

      { id: "linha-soma-a", label: "+ −", type: "math-symbol", operation: "soma", x: 705, y: 695, w: 110, h: 44, solid: false, showLabel: false },
      { id: "linha-fator-a", label: "× ÷", type: "math-symbol", operation: "fator", x: 1685, y: 695, w: 110, h: 44, solid: false, showLabel: false },
      { id: "linha-raiz-a", label: "x² √", type: "math-symbol", operation: "raiz", x: 1195, y: 405, w: 120, h: 44, solid: false, showLabel: false },

      { id: "trilha-numero-oeste", label: "", type: "number-line", x: 690, y: 1038, w: 420, h: 32, solid: false },
      { id: "trilha-numero-leste", label: "", type: "number-line", x: 1390, y: 1038, w: 420, h: 32, solid: false },
      { id: "trilha-numero-norte", label: "", type: "number-line", x: 1040, y: 332, w: 420, h: 32, solid: false },

      { id: "numero-portal-esq", label: "Número Cristalizado", type: "crystal", x: 905, y: 278, w: 70, h: 100, solid: true },
      { id: "numero-portal-dir", label: "Número Cristalizado", type: "crystal", x: 1530, y: 278, w: 70, h: 100, solid: true },
      { id: "cristal-soma-esq", label: "Cristal de Soma", type: "crystal", x: 455, y: 830, w: 58, h: 86, solid: true },
      { id: "cristal-soma-dir", label: "Cristal de Subtração", type: "crystal", x: 1030, y: 830, w: 58, h: 86, solid: true },
      { id: "cristal-fator-esq", label: "Cristal de Multiplicação", type: "crystal", x: 1410, y: 830, w: 58, h: 86, solid: true },
      { id: "cristal-fator-dir", label: "Cristal de Divisão", type: "crystal", x: 1988, y: 830, w: 58, h: 86, solid: true },
      { id: "cristal-raiz-esq", label: "Cristal de Potência", type: "crystal", x: 970, y: 580, w: 58, h: 86, solid: true },
      { id: "cristal-raiz-dir", label: "Cristal de Raiz", type: "crystal", x: 1475, y: 580, w: 58, h: 86, solid: true },

      { id: "muro-math-noroeste", label: "Muro dos Dígitos", type: "wall", x: 170, y: 250, w: 130, h: 54, solid: true },
      { id: "muro-math-nordeste", label: "Muro dos Dígitos", type: "wall", x: 2200, y: 250, w: 130, h: 54, solid: true },
      { id: "muro-math-sudoeste", label: "Muro dos Dígitos", type: "wall", x: 170, y: 1380, w: 130, h: 54, solid: true },
      { id: "muro-math-sudeste", label: "Muro dos Dígitos", type: "wall", x: 2200, y: 1380, w: 130, h: 54, solid: true }
    ],
    treeObjects: [
      { id: "arvore-math-01", label: "Cálculo-Raiz 1", x: 110, y: 110, w: 128, h: 118 },
      { id: "arvore-math-02", label: "Cálculo-Raiz 2", x: 300, y: 150, w: 112, h: 104 },
      { id: "arvore-math-03", label: "Cálculo-Raiz 3", x: 2100, y: 120, w: 130, h: 120 },
      { id: "arvore-math-04", label: "Cálculo-Raiz 4", x: 2290, y: 210, w: 112, h: 104 },
      { id: "arvore-math-05", label: "Cálculo-Raiz 5", x: 90, y: 635, w: 128, h: 118 },
      { id: "arvore-math-06", label: "Cálculo-Raiz 6", x: 2280, y: 635, w: 128, h: 118 },
      { id: "arvore-math-07", label: "Cálculo-Raiz 7", x: 90, y: 1470, w: 128, h: 118 },
      { id: "arvore-math-08", label: "Cálculo-Raiz 8", x: 310, y: 1425, w: 112, h: 104 },
      { id: "arvore-math-09", label: "Cálculo-Raiz 9", x: 2170, y: 1420, w: 128, h: 118 },
      { id: "arvore-math-10", label: "Cálculo-Raiz 10", x: 2325, y: 1480, w: 112, h: 104 },
      { id: "arvore-math-11", label: "Cálculo-Raiz 11", x: 790, y: 205, w: 108, h: 104 },
      { id: "arvore-math-12", label: "Cálculo-Raiz 12", x: 1600, y: 205, w: 108, h: 104 }
    ],
    npcObjects: [
      {
        id: "npc-guardiao-retorno",
        name: "Guardião do Portal",
        role: "Retorno à Vila Central",
        x: 1250,
        y: 405,
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "#00eaff",
        portrait: "assets/images/npcs/guardiao-do-portal.webp",
        returnToVillage: true,
        dialogue: [
          "Este é o Reino da Matemática, o primeiro destino aberto pelo Portal dos Reinos.",
          "As três áreas representam operações diferentes: soma/subtração, multiplicação/divisão e potências/raízes.",
          "Quando quiser voltar, fale comigo de novo e eu reabrirei o caminho para a Vila Central."
        ]
      },
      {
        id: "npc-voltinho-math",
        name: "Voltinho",
        role: "Guia da Matemática",
        x: 1250,
        y: 1185,
        colorA: "#78f7ff",
        colorB: "#00eaff",
        aura: "#78f7ff",
        portrait: "assets/images/sprites/voltinho_explicando.webp",
        dialogue: [
          "Agora o Reino da Matemática está dividido por áreas de treino.",
          "Os inimigos básicos abrem caminho até Melog, a ameaça que odeia estudar.",
          "Depois de derrotar Melog, o Golem dos Cálculos aparece como guardião final do reino."
        ]
      },
      {
        id: "terminal-progresso-math",
        name: "Terminal de Progresso",
        role: "Status do Reino",
        x: 1030,
        y: 1245,
        visualType: "terminal",
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "#00eaff",
        portrait: "assets/images/sprites/voltinho_pensando.webp",
        dynamicDialogue: "math-progress"
      },
      {
        id: "portao-melog-math",
        name: "Portão do Melog",
        role: "Bloqueio da Ameaça",
        x: 1250,
        y: 950,
        visualType: "gate",
        colorA: "#ff4d7d",
        colorB: "#9257ff",
        aura: "#ff4d7d",
        portrait: "assets/images/mini-bosses/melog.webp",
        dynamicDialogue: "melog-gate"
      },
      {
        id: "portao-golem-math",
        name: "Santuário do Golem",
        role: "Teste Final",
        x: 1250,
        y: 560,
        visualType: "gate",
        colorA: "#ffd166",
        colorB: "#00eaff",
        aura: "#ffd166",
        portrait: "assets/images/bosses/golem-dos-calculos.webp",
        dynamicDialogue: "golem-gate"
      }
    ],
    portalObjects: [
      {
        id: "portal-retorno-math",
        name: "Portal de Retorno",
        x: 1250,
        y: 315,
        interactionRange: 0,
        colorA: "#ffd166",
        colorB: "#00eaff"
      }
    ],
    enemyObjects: []
  };

  global.VoltzData.realms.mathematics = {
    id: "reino-matematica",
    progressKey: "reino-matematica",
    enemyTypes,
    commonEnemies: createCommonEnemies(),
    miniBoss,
    boss,
    scene
  };
})(window);
