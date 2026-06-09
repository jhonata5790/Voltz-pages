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

    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      run: false,
      debugColliders: false
    };

    const worldState = {
      width: 2500,
      height: 1600
    };

    const cameraState = {
      x: 0,
      y: 0,
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
      moving: false
    };

    let buildings = [
      { id: "portal", label: "Portal dos Reinos", x: 980, y: 115, w: 540, h: 290, roofH: 138, collider: { x: 0, y: 0, w: 0, h: 0 } },
      { id: "biblioteca", label: "Biblioteca de Dicas", x: 410, y: 360, w: 400, h: 280, roofH: 144, collider: { x: 0, y: 0, w: 0, h: 0 } },
      { id: "arena", label: "Arena de Treino", x: 1690, y: 360, w: 430, h: 300, roofH: 152, collider: { x: 0, y: 0, w: 0, h: 0 } },
      { id: "loja", label: "Loja Voltz", x: 430, y: 965, w: 400, h: 290, roofH: 150, collider: { x: 0, y: 0, w: 0, h: 0 } },
      { id: "ranking", label: "Central de Ranking", x: 1690, y: 965, w: 430, h: 290, roofH: 150, collider: { x: 0, y: 0, w: 0, h: 0 } },
      { id: "terminal", label: "Terminal do Aluno", x: 1025, y: 1250, w: 450, h: 270, roofH: 140, collider: { x: 0, y: 0, w: 0, h: 0 } }
    ];

    let decorObjects = [
      { id: "cristal-portal-esq", label: "Cristal", type: "crystal", x: 910, y: 275, w: 72, h: 104, solid: true },
      { id: "cristal-portal-dir", label: "Cristal", type: "crystal", x: 1520, y: 275, w: 72, h: 104, solid: true },
      { id: "cristal-praca-esq", label: "Cristal", type: "crystal", x: 1030, y: 575, w: 58, h: 86, solid: true },
      { id: "cristal-praca-dir", label: "Cristal", type: "crystal", x: 1415, y: 575, w: 58, h: 86, solid: true },
      { id: "banco-norte-esq", label: "Banco", type: "wall", x: 960, y: 610, w: 140, h: 34, solid: true },
      { id: "banco-norte-dir", label: "Banco", type: "wall", x: 1400, y: 610, w: 140, h: 34, solid: true },
      { id: "banco-sul-esq", label: "Banco", type: "wall", x: 960, y: 960, w: 140, h: 34, solid: true },
      { id: "banco-sul-dir", label: "Banco", type: "wall", x: 1400, y: 960, w: 140, h: 34, solid: true },
      { id: "muro-noroeste", label: "Muro", type: "wall", x: 195, y: 330, w: 120, h: 58, solid: true },
      { id: "muro-nordeste", label: "Muro", type: "wall", x: 2185, y: 330, w: 120, h: 58, solid: true },
      { id: "muro-sudoeste", label: "Muro", type: "wall", x: 195, y: 1200, w: 120, h: 58, solid: true },
      { id: "muro-sudeste", label: "Muro", type: "wall", x: 2185, y: 1200, w: 120, h: 58, solid: true }
    ];

    let treeObjects = [
      { id: "arvore-01", label: "Tronco 1", x: 105, y: 90, w: 138, h: 126 },
      { id: "arvore-02", label: "Tronco 2", x: 270, y: 135, w: 116, h: 108 },
      { id: "arvore-03", label: "Tronco 3", x: 760, y: 125, w: 118, h: 110 },
      { id: "arvore-04", label: "Tronco 4", x: 1650, y: 120, w: 118, h: 110 },
      { id: "arvore-05", label: "Tronco 5", x: 2150, y: 115, w: 138, h: 126 },
      { id: "arvore-06", label: "Tronco 6", x: 2315, y: 190, w: 116, h: 108 },
      { id: "arvore-07", label: "Tronco 7", x: 95, y: 560, w: 130, h: 120 },
      { id: "arvore-08", label: "Tronco 8", x: 245, y: 660, w: 112, h: 104 },
      { id: "arvore-09", label: "Tronco 9", x: 2220, y: 560, w: 130, h: 120 },
      { id: "arvore-10", label: "Tronco 10", x: 2370, y: 680, w: 112, h: 104 },
      { id: "arvore-11", label: "Tronco 11", x: 125, y: 1390, w: 136, h: 126 },
      { id: "arvore-12", label: "Tronco 12", x: 310, y: 1325, w: 116, h: 108 },
      { id: "arvore-13", label: "Tronco 13", x: 770, y: 1430, w: 118, h: 110 },
      { id: "arvore-14", label: "Tronco 14", x: 1605, y: 1430, w: 118, h: 110 },
      { id: "arvore-15", label: "Tronco 15", x: 2170, y: 1320, w: 136, h: 126 },
      { id: "arvore-16", label: "Tronco 16", x: 2325, y: 1400, w: 116, h: 108 },
      { id: "arvore-17", label: "Tronco 17", x: 640, y: 675, w: 108, h: 100 },
      { id: "arvore-18", label: "Tronco 18", x: 1760, y: 675, w: 108, h: 100 }
    ];



    let npcObjects = [
      {
        id: "npc-guardiao-portal",
        name: "Guardião do Portal",
        role: "Portal dos Reinos",
        x: 1250,
        y: 505,
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "#00eaff",
        portrait: "assets/images/npcs/guardiao-do-portal.png",
        opensRealmPanel: true,
        dialogue: [
          "Bem-vindo à Vila Central, aprendiz. Eu sou o responsável por abrir o caminho entre os Reinos do Conhecimento.",
          "O portal atrás de mim é apenas a passagem. Para escolher um destino, fale comigo primeiro.",
          "Nesta versão, somente o Reino da Matemática está liberado. Os outros reinos aparecem como promessa visual do projeto."
        ]
      },
      {
        id: "npc-professora-sintaxe",
        name: "Professora Sintaxe",
        role: "Biblioteca de Dicas",
        x: 870,
        y: 675,
        colorA: "#ffd166",
        colorB: "#78f7ff",
        aura: "#ffd166",
        portrait: "assets/images/npcs/professora-sintaxe.png",
        dialogue: [
          "Antes de enfrentar uma questão, respire e leia com atenção. Muitas respostas se escondem no próprio enunciado.",
          "Aqui na Biblioteca, as dicas aparecem antes e depois das perguntas para transformar erro em aprendizado.",
          "Conhecimento não é decorar tudo. É entender o caminho até a resposta."
        ]
      },
      {
        id: "npc-treinador-energia",
        name: "Treinador de Energia",
        role: "Arena de Treino",
        x: 1640,
        y: 690,
        colorA: "#ff4d7d",
        colorB: "#9257ff",
        aura: "#ff4d7d",
        portrait: "assets/images/npcs/treinador-de-energia.png",
        dialogue: [
          "Na arena, cada resposta vira movimento. Acertou, você ataca. Errou, aprende e tenta de novo.",
          "O tempo existe para testar domínio, não para te humilhar. Quanto mais você entende, mais rápido sua energia flui.",
          "Treine sem medo. Evolução também conta como vitória."
        ]
      },
      {
        id: "npc-mercador-foco",
        name: "Mercador de Foco",
        role: "Loja Voltz",
        x: 875,
        y: 1195,
        colorA: "#00eaff",
        colorB: "#ffd166",
        aura: "#ffd166",
        portrait: "assets/images/npcs/mercador-de-foco.png",
        dialogue: [
          "Moedas não servem só para brilhar. Com elas, você poderá comprar dicas, recuperação e bônus de jornada.",
          "Um bom aventureiro não vence só com força. Ele usa recurso, estratégia e foco.",
          "Quando a loja abrir oficialmente, passe aqui antes dos chefes. Vai por mim."
        ]
      },
      {
        id: "npc-arquivista-questoes",
        name: "Arquivista das Questões",
        role: "Arquivo de Progresso",
        x: 1645,
        y: 1195,
        colorA: "#9257ff",
        colorB: "#78f7ff",
        aura: "#9257ff",
        portrait: "assets/images/npcs/arquivista-das-questoes.png",
        dialogue: [
          "Eu organizo as perguntas, justificativas e registros de progresso da sua jornada.",
          "Cada erro deixa uma pista. Cada acerto deixa uma marca. O arquivo nunca esquece sua evolução.",
          "Quando o ranking estiver completo, você poderá ver não só pontuação, mas constância e crescimento."
        ]
      },
      {
        id: "npc-voltinho-terminal",
        name: "Voltinho",
        role: "Guia do Aluno",
        x: 1505,
        y: 1355,
        colorA: "#78f7ff",
        colorB: "#00eaff",
        aura: "#78f7ff",
        portrait: "assets/images/sprites/voltinho_explicando.png",
        dialogue: [
          "Ei! Eu sou o Voltinho, seu guia nessa jornada pelo Reino do Conhecimento.",
          "Seu perfil vai guardar XP, moedas, progresso por reino e tudo que você conquistar.",
          "A ideia é simples: estudar, explorar, batalhar, errar, aprender e evoluir."
        ]
      }
    ];



    let portalObjects = [
      {
        id: "portal-dos-reinos",
        name: "Portal dos Reinos",
        x: 1250,
        y: 360,
        interactionRange: 0,
        colorA: "#00eaff",
        colorB: "#9257ff"
      }
    ];

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
      }
    };

    function createMathEnemies() {
      return [
        { id: "soma-01", typeId: "soma-subtracao", x: 790, y: 780, patrol: "horizontal", rangeX: 120, rangeY: 34, speed: 0.0014, phase: 0.1, questionIndex: 0 },
        { id: "soma-02", typeId: "soma-subtracao", x: 1180, y: 955, patrol: "circle", rangeX: 74, rangeY: 52, speed: 0.0012, phase: 1.6, questionIndex: 1 },
        { id: "soma-03", typeId: "soma-subtracao", x: 620, y: 1130, patrol: "vertical", rangeX: 38, rangeY: 112, speed: 0.0011, phase: 2.9, questionIndex: 2 },

        { id: "fator-01", typeId: "multiplicacao-divisao", x: 1685, y: 795, patrol: "horizontal", rangeX: 135, rangeY: 38, speed: 0.0011, phase: 0.7, questionIndex: 0 },
        { id: "fator-02", typeId: "multiplicacao-divisao", x: 1885, y: 1110, patrol: "circle", rangeX: 82, rangeY: 66, speed: 0.0012, phase: 2.1, questionIndex: 1 },
        { id: "fator-03", typeId: "multiplicacao-divisao", x: 1325, y: 1070, patrol: "vertical", rangeX: 44, rangeY: 125, speed: 0.0013, phase: 3.2, questionIndex: 2 },

        { id: "raiz-01", typeId: "potencia-radiciacao", x: 925, y: 515, patrol: "circle", rangeX: 78, rangeY: 58, speed: 0.0013, phase: 0.4, questionIndex: 0 },
        { id: "raiz-02", typeId: "potencia-radiciacao", x: 1585, y: 520, patrol: "circle", rangeX: 78, rangeY: 58, speed: 0.0013, phase: 1.9, questionIndex: 1 },
        { id: "raiz-03", typeId: "potencia-radiciacao", x: 1515, y: 925, patrol: "horizontal", rangeX: 118, rangeY: 42, speed: 0.0010, phase: 2.6, questionIndex: 2 }
      ].map((enemy) => ({
        ...enemy,
        originX: enemy.x,
        originY: enemy.y,
        lastX: enemy.x,
        lastY: enemy.y,
        direction: "baixo"
      }));
    }

    const realmOptions = [
      {
        id: "reino-matematica",
        name: "Reino da Matemática",
        icon: "➗",
        unlocked: true,
        status: "Disponível",
        description: "Primeiro reino jogável do protótipo. Aqui operações, raciocínio e problemas viram energia de exploração."
      },
      {
        id: "reino-gramatica",
        name: "Reino da Gramática",
        icon: "📘",
        unlocked: false,
        status: "Visual futuro",
        description: "Área futura de Português, interpretação, classes gramaticais e construção de frases."
      },
      {
        id: "reino-ciencias",
        name: "Reino do Laboratório",
        icon: "🧪",
        unlocked: false,
        status: "Visual futuro",
        description: "Área futura de Ciências, Biologia, Química e experimentos de energia."
      },
      {
        id: "reino-tempo",
        name: "Reino do Tempo",
        icon: "⏳",
        unlocked: false,
        status: "Visual futuro",
        description: "Área futura de História, com linhas do tempo, eventos e guardiões do passado."
      },
      {
        id: "reino-mapas",
        name: "Reino dos Mapas",
        icon: "🗺️",
        unlocked: false,
        status: "Visual futuro",
        description: "Área futura de Geografia, com territórios, clima, mapas e exploração."
      },
      {
        id: "reino-idiomas",
        name: "Reino dos Idiomas",
        icon: "💬",
        unlocked: false,
        status: "Visual futuro",
        description: "Área futura de Inglês e linguagem, com palavras-chave, tradução e interpretação."
      }
    ];

    const cloneData = (data) => JSON.parse(JSON.stringify(data));

    const villageScene = {
      id: "vila-central",
      name: "Vila Central",
      className: "scene-village",
      plazaLabel: "PRAÇA<br>VOLTZ",
      defaultHint: "Vila Central: fale com o Guardião do Portal para viajar ao Reino da Matemática.",
      spawn: { x: 1250, y: 1120 },
      buildings: cloneData(buildings),
      decorObjects: cloneData(decorObjects),
      treeObjects: cloneData(treeObjects),
      npcObjects: cloneData(npcObjects),
      portalObjects: cloneData(portalObjects),
      enemyObjects: []
    };

    const mathScene = {
      id: "reino-matematica",
      name: "Reino da Matemática",
      className: "scene-math",
      plazaLabel: "REINO DA<br>MATEMÁTICA",
      defaultHint: "Reino da Matemática: encontre inimigos de operações, chegue perto e pressione E para responder perguntas.",
      spawn: { x: 1250, y: 1275 },
      buildings: [
        { id: "portal-retorno", label: "Portal de Retorno", x: 980, y: 115, w: 540, h: 290, roofH: 138, collider: { x: 0, y: 0, w: 0, h: 0 } },
        { id: "observatorio-numeros", label: "Observatório dos Números", x: 375, y: 365, w: 455, h: 285, roofH: 145, collider: { x: 0, y: 0, w: 0, h: 0 } },
        { id: "oficina-calculos", label: "Oficina dos Cálculos", x: 1665, y: 365, w: 455, h: 285, roofH: 145, collider: { x: 0, y: 0, w: 0, h: 0 } },
        { id: "arquivo-formulas", label: "Arquivo das Fórmulas", x: 430, y: 965, w: 400, h: 290, roofH: 150, collider: { x: 0, y: 0, w: 0, h: 0 } },
        { id: "torre-problemas", label: "Torre dos Problemas", x: 1690, y: 965, w: 430, h: 290, roofH: 150, collider: { x: 0, y: 0, w: 0, h: 0 } }
      ],
      decorObjects: [
        { id: "numero-portal-esq", label: "Número Cristalizado", type: "crystal", x: 900, y: 280, w: 72, h: 104, solid: true },
        { id: "numero-portal-dir", label: "Número Cristalizado", type: "crystal", x: 1530, y: 280, w: 72, h: 104, solid: true },
        { id: "cristal-algebra-esq", label: "Cristal de Álgebra", type: "crystal", x: 1030, y: 575, w: 58, h: 86, solid: true },
        { id: "cristal-algebra-dir", label: "Cristal de Geometria", type: "crystal", x: 1415, y: 575, w: 58, h: 86, solid: true },
        { id: "linha-equacao-oeste", label: "Linha de Equação", type: "wall", x: 940, y: 615, w: 165, h: 28, solid: true },
        { id: "linha-equacao-leste", label: "Linha de Equação", type: "wall", x: 1395, y: 615, w: 165, h: 28, solid: true },
        { id: "banco-math-sul-esq", label: "Banco Numérico", type: "wall", x: 960, y: 960, w: 140, h: 34, solid: true },
        { id: "banco-math-sul-dir", label: "Banco Numérico", type: "wall", x: 1400, y: 960, w: 140, h: 34, solid: true },
        { id: "muro-math-noroeste", label: "Muro dos Dígitos", type: "wall", x: 195, y: 330, w: 120, h: 58, solid: true },
        { id: "muro-math-nordeste", label: "Muro dos Dígitos", type: "wall", x: 2185, y: 330, w: 120, h: 58, solid: true },
        { id: "muro-math-sudoeste", label: "Muro dos Dígitos", type: "wall", x: 195, y: 1200, w: 120, h: 58, solid: true },
        { id: "muro-math-sudeste", label: "Muro dos Dígitos", type: "wall", x: 2185, y: 1200, w: 120, h: 58, solid: true }
      ],
      treeObjects: [
        { id: "arvore-math-01", label: "Cálculo-Raiz 1", x: 110, y: 110, w: 128, h: 118 },
        { id: "arvore-math-02", label: "Cálculo-Raiz 2", x: 300, y: 150, w: 112, h: 104 },
        { id: "arvore-math-03", label: "Cálculo-Raiz 3", x: 2100, y: 120, w: 130, h: 120 },
        { id: "arvore-math-04", label: "Cálculo-Raiz 4", x: 2290, y: 210, w: 112, h: 104 },
        { id: "arvore-math-05", label: "Cálculo-Raiz 5", x: 95, y: 620, w: 128, h: 118 },
        { id: "arvore-math-06", label: "Cálculo-Raiz 6", x: 2260, y: 620, w: 128, h: 118 },
        { id: "arvore-math-07", label: "Cálculo-Raiz 7", x: 120, y: 1380, w: 128, h: 118 },
        { id: "arvore-math-08", label: "Cálculo-Raiz 8", x: 310, y: 1325, w: 112, h: 104 },
        { id: "arvore-math-09", label: "Cálculo-Raiz 9", x: 2170, y: 1320, w: 128, h: 118 },
        { id: "arvore-math-10", label: "Cálculo-Raiz 10", x: 2325, y: 1400, w: 112, h: 104 }
      ],
      npcObjects: [
        {
          id: "npc-guardiao-retorno",
          name: "Guardião do Portal",
          role: "Retorno à Vila Central",
          x: 1250,
          y: 505,
          colorA: "#78f7ff",
          colorB: "#9257ff",
          aura: "#00eaff",
          portrait: "assets/images/npcs/guardiao-do-portal.png",
          returnToVillage: true,
          dialogue: [
            "Este é o Reino da Matemática, o primeiro destino aberto pelo Portal dos Reinos.",
            "Agora este reino tem inimigos básicos de matemática andando pelo mapa.",
            "Vou te levar de volta para a Vila Central para continuarmos a jornada."
          ]
        },
        {
          id: "npc-voltinho-math",
          name: "Voltinho",
          role: "Guia da Matemática",
          x: 1510,
          y: 1185,
          colorA: "#78f7ff",
          colorB: "#00eaff",
          aura: "#78f7ff",
          portrait: "assets/images/sprites/voltinho_explicando.png",
          dialogue: [
            "Mapa do Reino da Matemática carregado com sucesso!",
            "A próxima evolução pode ser colocar inimigos matemáticos aqui, mas hoje a prioridade é mostrar que a viagem entre mapas funciona.",
            "Chegue perto de um inimigo e pressione E para responder uma pergunta."
          ]
        }
      ],
      portalObjects: [
        {
          id: "portal-retorno-math",
          name: "Portal de Retorno",
          x: 1250,
          y: 360,
          interactionRange: 0,
          colorA: "#ffd166",
          colorB: "#00eaff"
        }
      ],
      enemyObjects: createMathEnemies()
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
    let dialogueOpen = false;
    let currentDialogueNpc = null;
    let currentDialogueIndex = 0;

    let colliders = [];
    let occluders = [];
    let lastCollisionLabel = "livre";
    let currentOcclusionLabel = "nada";

    function setupPlayer() {
      updateWorldSizeFromCss();
      updatePlayerSizeFromCss();
      enemyObjects = cloneData(currentScene.enemyObjects || []);
      buildCollisionAndOcclusionData();

      applySceneVisualState(currentScene);
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
      const rect = player.getBoundingClientRect();
      playerState.width = rect.width || 72;
      playerState.height = rect.height || 92;
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
        ...npcColliders
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

    function getDecorSortY(decor) {
      if (decor.type === "water") {
        return Math.round(decor.y + decor.h * 0.58);
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

    function applySceneVisualState(scene) {
      world.classList.remove("scene-village", "scene-math");
      world.classList.add(scene.className);

      const centerPlaza = document.querySelector(".center-plaza");
      if (centerPlaza) {
        centerPlaza.innerHTML = scene.plazaLabel;
      }

      const brandSubtitle = document.querySelector(".brand span");
      if (brandSubtitle) {
        brandSubtitle.textContent = scene.name.toUpperCase();
      }
    }

    function changeScene(scene) {
      currentScene = scene;
      buildings = cloneData(scene.buildings);
      decorObjects = cloneData(scene.decorObjects);
      treeObjects = cloneData(scene.treeObjects);
      npcObjects = cloneData(scene.npcObjects);
      portalObjects = cloneData(scene.portalObjects);
      enemyObjects = cloneData(scene.enemyObjects || []);

      nearbyNpc = null;
      nearbyEnemy = null;
      nearbyPortal = null;
      lastCollisionLabel = "livre";
      currentOcclusionLabel = "nada";

      applySceneVisualState(scene);
      buildCollisionAndOcclusionData();

      playerState.x = scene.spawn.x;
      playerState.y = scene.spawn.y;
      playerState.direction = "baixo";
      playerState.moving = false;
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;

      renderDepthLayer();
      renderColliderDebugLayer();
      updatePlayerPosition();
      updatePlayerAnimation();
      snapCameraToPlayer();
      updateOcclusionVisibility();
      updateNearbyNpc();
      updateNearbyPortal();
      updateNearbyEnemy();
      updateDebug();
      interactionText.textContent = scene.defaultHint;
    }

    function selectRealm(realmId) {
      const realm = realmOptions.find((item) => item.id === realmId);
      if (!realm || !realm.unlocked) return;

      if (realmId === "reino-matematica") {
        realmMessage.textContent = "Carregando Reino da Matemática...";
        closeRealmPanel();
        changeScene(mathScene);
        return;
      }

      realmMessage.textContent = `${realm.name}: este reino ainda é apenas visual futuro.`;
    }

    function interactWithNearbyPortal() {
      // O portal é visual nesta etapa. A seleção de reinos acontece conversando com o Guardião.
      return false;
    }


    function getEnemyType(enemy) {
      return enemyTypes[enemy.typeId] || enemyTypes["soma-subtracao"];
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

    function openEnemyEncounter(enemy) {
      enemyPanelOpen = true;
      currentEnemy = enemy;
      enemyQuestionAnswered = false;
      currentEnemyQuestion = getQuestionForEnemy(enemy);

      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();

      renderEnemyQuestion();
      enemyPanel.classList.add("visible");
      interactionText.textContent = `Desafio iniciado contra ${getEnemyType(enemy).name}.`;
    }

    function renderEnemyQuestion() {
      if (!currentEnemy || !currentEnemyQuestion) return;

      const type = getEnemyType(currentEnemy);
      const q = currentEnemyQuestion;
      const questionNumber = (currentEnemy.questionIndex % type.questions.length) + 1;

      enemyPanelKicker.textContent = type.role;
      enemyPanelTitle.textContent = `${type.name} — pergunta ${questionNumber}/${type.questions.length}`;
      enemyPanelSubtitle.textContent = type.description;
      enemyQuestionTip.textContent = `Dica: ${q.tip}`;
      enemyQuestionText.textContent = q.text;
      enemyFeedback.textContent = "";
      enemyFeedback.className = "enemy-feedback";
      enemyNextButton.classList.remove("visible");

      enemyQuestionOptions.innerHTML = Object.entries(q.options).map(([letter, value]) => `
        <button class="enemy-option-btn" type="button" onclick="answerEnemyQuestion('${letter}')">
          <strong>${letter}</strong>
          <span>${value}</span>
        </button>
      `).join("");
    }

    function answerEnemyQuestion(letter) {
      if (!enemyPanelOpen || !currentEnemy || !currentEnemyQuestion || enemyQuestionAnswered) return;

      enemyQuestionAnswered = true;
      const isCorrect = letter === currentEnemyQuestion.answer;

      document.querySelectorAll(".enemy-option-btn").forEach((button) => {
        button.disabled = true;
        const buttonLetter = button.querySelector("strong")?.textContent;

        if (buttonLetter === currentEnemyQuestion.answer) {
          button.classList.add("correct");
        }

        if (buttonLetter === letter && !isCorrect) {
          button.classList.add("wrong");
        }
      });

      enemyFeedback.className = `enemy-feedback visible ${isCorrect ? "correct" : "wrong"}`;
      enemyFeedback.textContent = isCorrect
        ? `Acertou! ${currentEnemyQuestion.explanation}`
        : `Ainda não. Resposta correta: ${currentEnemyQuestion.answer}. ${currentEnemyQuestion.explanation}`;

      enemyNextButton.classList.add("visible");
    }

    function nextEnemyQuestion() {
      if (!currentEnemy) return;

      currentEnemy.questionIndex = (currentEnemy.questionIndex + 1) % getEnemyType(currentEnemy).questions.length;
      enemyQuestionAnswered = false;
      currentEnemyQuestion = getQuestionForEnemy(currentEnemy);
      renderEnemyQuestion();
    }

    function closeEnemyPanel() {
      enemyPanelOpen = false;
      currentEnemy = null;
      currentEnemyQuestion = null;
      enemyQuestionAnswered = false;
      enemyPanel.classList.remove("visible");
      updateHint();
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
      if (Array.isArray(npc.dialogue)) {
        return npc.dialogue;
      }

      return [npc.dialogue || "..."];
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
      const shouldReturnToVillage = Boolean(currentDialogueNpc && currentDialogueNpc.returnToVillage);
      closeDialogue();

      if (shouldOpenRealmPanel) {
        openRealmPanel();
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
        const className = decor.type === "water"
          ? "decor-water"
          : decor.type === "crystal"
            ? "decor-crystal"
            : "decor-wall";

        const sortY = getDecorSortY(decor);

        return `
          <div
            class="depth-object depth-decor"
            data-sort-y="${sortY}"
            style="left: ${decor.x}px; top: ${decor.y}px; width: ${decor.w}px; height: ${decor.h}px; z-index: ${sortY};"
            aria-hidden="true"
          >
            <div class="decor-object ${className}"></div>
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
            class="depth-object depth-enemy enemy-type-${enemy.typeId}"
            data-enemy-id="${enemy.id}"
            data-direction="${enemy.direction}"
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
        const className = decor.type === "water"
          ? "decor-water"
          : decor.type === "crystal"
            ? "decor-crystal"
            : "decor-wall";

        return `
          <div
            class="decor-object ${className}"
            style="left: ${decor.x}px; top: ${decor.y}px; width: ${decor.w}px; height: ${decor.h}px;"
            aria-hidden="true"
          ></div>
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
      const debugColliders = [
        ...colliders,
        ...enemyObjects.map(getEnemyCollider)
      ];

      colliderLayer.innerHTML = debugColliders.map((collider) => `
        <div
          class="collider-debug ${collider.debugClass || ""}"
          style="left: ${collider.x}px; top: ${collider.y}px; width: ${collider.w}px; height: ${collider.h}px;"
        >${collider.label}</div>
      `).join("");
    }

    function updateMovement() {
      if (dialogueOpen || realmPanelOpen || enemyPanelOpen) {
        playerState.moving = false;
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
      const hitboxWidth = Math.max(20, playerState.width * 0.34);
      const hitboxHeight = Math.max(12, playerState.height * 0.16);

      return {
        x: x - hitboxWidth / 2,
        y: y + playerState.height * 0.24,
        w: hitboxWidth,
        h: hitboxHeight
      };
    }

    function getPlayerVisualBox() {
      return {
        x: playerState.x - playerState.width * 0.38,
        y: playerState.y - playerState.height * 0.68,
        w: playerState.width * 0.76,
        h: playerState.height * 0.94
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
        y: playerState.y + playerState.height * 0.31
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
      const screenX = playerState.x - cameraState.x;
      const screenY = playerState.y - cameraState.y - playerState.height * 0.08;

      playerLocator.style.left = `${screenX}px`;
      playerLocator.style.top = `${screenY}px`;
      playerLocator.classList.toggle("visible", visible);
    }

    function toggleColliderDebug() {
      keys.debugColliders = !keys.debugColliders;
      world.classList.toggle("show-colliders", keys.debugColliders);

      interactionText.textContent = keys.debugColliders
        ? "Colisores visíveis: rosa = físico, amarelo = pés. A profundidade visual usa o Y dos pés."
        : "Colisores ocultos. Movimento normal.";
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
      const halfWidth = playerState.width / 2;
      const halfHeight = playerState.height / 2;

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
      player.style.transform = "translate(-50%, -50%)";

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
      const hitbox = getPlayerHitboxAt(playerState.x, playerState.y);

      playerHitboxDebug.style.left = `${hitbox.x}px`;
      playerHitboxDebug.style.top = `${hitbox.y}px`;
      playerHitboxDebug.style.width = `${hitbox.w}px`;
      playerHitboxDebug.style.height = `${hitbox.h}px`;
    }

    function getCameraTarget() {
      const rect = viewport.getBoundingClientRect();

      const maxCameraX = Math.max(0, worldState.width - rect.width);
      const maxCameraY = Math.max(0, worldState.height - rect.height);

      const targetX = playerState.x - rect.width / 2;
      const targetY = playerState.y - rect.height / 2;

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
      world.style.transform = `translate3d(${-cameraState.x}px, ${-cameraState.y}px, 0)`;
    }

    function updatePlayerAnimation() {
      if (playerState.moving) {
        player.classList.add("moving");
      } else {
        player.classList.remove("moving");
      }
    }

    function updateDebug() {
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
        interactionText.textContent = `Bloqueado por: ${lastCollisionLabel}. Aperte C para ver colisores.`;
        return;
      }

      if (currentOcclusionLabel !== "nada") {
        interactionText.textContent = `Você está atrás/debaixo de: ${currentOcclusionLabel}. O círculo mostra sua posição.`;
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

      if (playerState.moving) {
        interactionText.textContent = keys.run
          ? `Correndo para ${playerState.direction}. Profundidade por Y ativa; pés decidem frente/atrás.`
          : `Andando para ${playerState.direction}. Câmera suave, hitbox nos pés e ordem visual dinâmica.`;
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

      if (key === "c" && !event.repeat) {
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
      enemyObjects = cloneData(currentScene.enemyObjects || []);
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

    window.closeRealmPanel = closeRealmPanel;
    window.selectRealm = selectRealm;
    window.closeEnemyPanel = closeEnemyPanel;
    window.answerEnemyQuestion = answerEnemyQuestion;
    window.nextEnemyQuestion = nextEnemyQuestion;

    setupPlayer();
    gameLoop();
