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
        },
        {
          tip: "Some as dezenas e depois ajuste as unidades.",
          text: "Quanto é 47 + 38?",
          options: { A: "75", B: "83", C: "85", D: "95" },
          answer: "C",
          explanation: "47 + 38 = 85."
        },
        {
          tip: "Quebre 68 em 60 + 8 para facilitar a subtração.",
          text: "Quanto é 150 − 68?",
          options: { A: "72", B: "82", C: "88", D: "92" },
          answer: "B",
          explanation: "150 − 68 = 82."
        },
        {
          tip: "Observe que 240 e 160 completam quatro centenas.",
          text: "Quanto é 240 + 160?",
          options: { A: "360", B: "380", C: "400", D: "420" },
          answer: "C",
          explanation: "240 + 160 = 400."
        },
        {
          tip: "Subtraia 200 e depois 75.",
          text: "Quanto é 500 − 275?",
          options: { A: "215", B: "225", C: "235", D: "275" },
          answer: "B",
          explanation: "500 − 275 = 225."
        },
        {
          tip: "Faça 63 + 29 antes de tirar 17.",
          text: "Quanto é 63 + 29 − 17?",
          options: { A: "65", B: "75", C: "85", D: "95" },
          answer: "B",
          explanation: "63 + 29 = 92; 92 − 17 = 75."
        },
        {
          tip: "Pense em quanto falta de 458 até 1000.",
          text: "Quanto é 1000 − 458?",
          options: { A: "532", B: "542", C: "552", D: "562" },
          answer: "B",
          explanation: "1000 − 458 = 542."
        },
        {
          tip: "Acompanhe primeiro o que saiu e depois o que entrou.",
          text: "Ana tinha 85 figurinhas, deu 27 e ganhou 19. Com quantas ficou?",
          options: { A: "67", B: "75", C: "77", D: "81" },
          answer: "C",
          explanation: "85 − 27 = 58; 58 + 19 = 77."
        },
        {
          tip: "Some 376 com 200 e depois com 49.",
          text: "Quanto é 376 + 249?",
          options: { A: "615", B: "625", C: "635", D: "645" },
          answer: "B",
          explanation: "376 + 249 = 625."
        },
        {
          tip: "Faça as duas subtrações em sequência.",
          text: "Quanto é 720 − 180 − 95?",
          options: { A: "435", B: "445", C: "455", D: "545" },
          answer: "B",
          explanation: "720 − 180 = 540; 540 − 95 = 445."
        },
        {
          tip: "Somar 1 a 999 forma 1000; depois retire 250.",
          text: "Quanto é 999 + 1 − 250?",
          options: { A: "650", B: "700", C: "750", D: "850" },
          answer: "C",
          explanation: "999 + 1 = 1000; 1000 − 250 = 750."
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
        },
        {
          tip: "Use a tabuada do 12 ou decomponha 12 × 9.",
          text: "Quanto é 12 × 9?",
          options: { A: "96", B: "108", C: "112", D: "120" },
          answer: "B",
          explanation: "12 × 9 = 108."
        },
        {
          tip: "Procure qual número vezes 15 resulta em 225.",
          text: "Quanto é 225 ÷ 15?",
          options: { A: "12", B: "15", C: "18", D: "20" },
          answer: "B",
          explanation: "15 × 15 = 225, então 225 ÷ 15 = 15."
        },
        {
          tip: "Faça a multiplicação antes de somar 6.",
          text: "Quanto é 7 × 8 + 6?",
          options: { A: "56", B: "60", C: "62", D: "68" },
          answer: "C",
          explanation: "7 × 8 = 56; 56 + 6 = 62."
        },
        {
          tip: "Pense em 9 grupos iguais formando 180.",
          text: "Quanto é 180 ÷ 9?",
          options: { A: "18", B: "20", C: "22", D: "24" },
          answer: "B",
          explanation: "9 × 20 = 180, então 180 ÷ 9 = 20."
        },
        {
          tip: "Multiplique 14 por 5 e depois divida por 7.",
          text: "Quanto é 14 × 5 ÷ 7?",
          options: { A: "8", B: "10", C: "12", D: "14" },
          answer: "B",
          explanation: "14 × 5 = 70; 70 ÷ 7 = 10."
        },
        {
          tip: "Use 25 × 10 mais 25 × 2.",
          text: "Quanto é 25 × 12?",
          options: { A: "250", B: "275", C: "300", D: "325" },
          answer: "C",
          explanation: "25 × 12 = 300."
        },
        {
          tip: "Dividir 360 por 12 é encontrar quantos grupos de 12 cabem nele.",
          text: "Quanto é 360 ÷ 12?",
          options: { A: "20", B: "25", C: "30", D: "36" },
          answer: "C",
          explanation: "12 × 30 = 360, então 360 ÷ 12 = 30."
        },
        {
          tip: "Multiplique a quantidade de caixas pela quantidade em cada caixa.",
          text: "Há 8 caixas com 6 cristais em cada uma. Quantos cristais há ao todo?",
          options: { A: "42", B: "46", C: "48", D: "54" },
          answer: "C",
          explanation: "8 × 6 = 48 cristais."
        },
        {
          tip: "Faça a divisão primeiro e depois some 5.",
          text: "Quanto é 144 ÷ 12 + 5?",
          options: { A: "12", B: "15", C: "17", D: "19" },
          answer: "C",
          explanation: "144 ÷ 12 = 12; 12 + 5 = 17."
        },
        {
          tip: "Multiplicação e divisão vêm antes da subtração.",
          text: "Quanto é 18 × 4 − 24 ÷ 6?",
          options: { A: "64", B: "68", C: "72", D: "76" },
          answer: "B",
          explanation: "18 × 4 = 72 e 24 ÷ 6 = 4; 72 − 4 = 68."
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
        },
        {
          tip: "3⁴ é 3 multiplicado por ele mesmo quatro vezes.",
          text: "Quanto é 3⁴?",
          options: { A: "27", B: "64", C: "81", D: "243" },
          answer: "C",
          explanation: "3⁴ = 3 × 3 × 3 × 3 = 81."
        },
        {
          tip: "Procure o número cujo quadrado é 121.",
          text: "Qual é a raiz quadrada de 121?",
          options: { A: "9", B: "10", C: "11", D: "12" },
          answer: "C",
          explanation: "11 × 11 = 121, então √121 = 11."
        },
        {
          tip: "Calcule 10² e √36 separadamente.",
          text: "Quanto é 10² − √36?",
          options: { A: "84", B: "90", C: "94", D: "96" },
          answer: "C",
          explanation: "10² = 100 e √36 = 6; 100 − 6 = 94."
        },
        {
          tip: "4³ significa 4 × 4 × 4.",
          text: "Quanto é 4³?",
          options: { A: "16", B: "32", C: "48", D: "64" },
          answer: "D",
          explanation: "4³ = 64."
        },
        {
          tip: "Procure o número que multiplicado por ele mesmo dá 225.",
          text: "Qual é a raiz quadrada de 225?",
          options: { A: "13", B: "14", C: "15", D: "16" },
          answer: "C",
          explanation: "15 × 15 = 225, então √225 = 15."
        },
        {
          tip: "Cada potência de 2 dobra o resultado anterior.",
          text: "Quanto é 2⁶?",
          options: { A: "32", B: "48", C: "64", D: "128" },
          answer: "C",
          explanation: "2⁶ = 64."
        },
        {
          tip: "Faça a raiz antes da soma.",
          text: "Quanto é √196 + 6?",
          options: { A: "18", B: "20", C: "22", D: "26" },
          answer: "B",
          explanation: "√196 = 14; 14 + 6 = 20."
        },
        {
          tip: "Calcule os dois quadrados e depois subtraia.",
          text: "Quanto é 6² − 5²?",
          options: { A: "9", B: "10", C: "11", D: "12" },
          answer: "C",
          explanation: "6² = 36 e 5² = 25; 36 − 25 = 11."
        },
        {
          tip: "Descubra √169 e depois multiplique por 2.",
          text: "Quanto é √169 × 2?",
          options: { A: "22", B: "24", C: "26", D: "28" },
          answer: "C",
          explanation: "√169 = 13; 13 × 2 = 26."
        },
        {
          tip: "Resolva a potência antes da divisão.",
          text: "Quanto é 5³ ÷ 25?",
          options: { A: "5", B: "10", C: "20", D: "25" },
          answer: "A",
          explanation: "5³ = 125; 125 ÷ 25 = 5."
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
        },
        {
          tip: "Multiplicação e divisão têm a mesma prioridade; resolva da esquerda para a direita.",
          text: "Quanto é 7 × 6 + 18 ÷ 3?",
          options: { A: "44", B: "46", C: "48", D: "54" },
          answer: "C",
          explanation: "7 × 6 = 42 e 18 ÷ 3 = 6; 42 + 6 = 48."
        },
        {
          tip: "Resolva o parêntese antes de dividir.",
          text: "Quanto é (45 − 21) ÷ 6?",
          options: { A: "3", B: "4", C: "5", D: "6" },
          answer: "B",
          explanation: "45 − 21 = 24; 24 ÷ 6 = 4."
        },
        {
          tip: "Potência e raiz vêm antes da soma.",
          text: "Quanto é 2⁴ + √49?",
          options: { A: "21", B: "23", C: "25", D: "30" },
          answer: "B",
          explanation: "2⁴ = 16 e √49 = 7; 16 + 7 = 23."
        },
        {
          tip: "Faça divisão e potência antes da soma.",
          text: "Quanto é 120 ÷ 10 + 3²?",
          options: { A: "18", B: "19", C: "21", D: "24" },
          answer: "C",
          explanation: "120 ÷ 10 = 12 e 3² = 9; 12 + 9 = 21."
        },
        {
          tip: "Parênteses primeiro, depois multiplicação e subtração.",
          text: "Quanto é (8 + 4) × 5 − 16?",
          options: { A: "40", B: "44", C: "50", D: "56" },
          answer: "B",
          explanation: "8 + 4 = 12; 12 × 5 = 60; 60 − 16 = 44."
        },
        {
          tip: "Resolva raiz e multiplicação antes da soma.",
          text: "Quanto é √100 + 6 × 7?",
          options: { A: "46", B: "50", C: "52", D: "60" },
          answer: "C",
          explanation: "√100 = 10 e 6 × 7 = 42; 10 + 42 = 52."
        },
        {
          tip: "Potência e multiplicação vêm antes da subtração.",
          text: "Quanto é 200 − 5² × 4?",
          options: { A: "90", B: "100", C: "125", D: "180" },
          answer: "B",
          explanation: "5² = 25; 25 × 4 = 100; 200 − 100 = 100."
        },
        {
          tip: "Resolva cada parêntese antes de multiplicar.",
          text: "Quanto é (72 ÷ 8) × (15 − 9)?",
          options: { A: "45", B: "48", C: "54", D: "63" },
          answer: "C",
          explanation: "72 ÷ 8 = 9 e 15 − 9 = 6; 9 × 6 = 54."
        },
        {
          tip: "Faça potência e divisão antes de somar e subtrair.",
          text: "Quanto é 3³ + 64 ÷ 8 − 5?",
          options: { A: "28", B: "30", C: "32", D: "35" },
          answer: "B",
          explanation: "3³ = 27 e 64 ÷ 8 = 8; 27 + 8 − 5 = 30."
        },
        {
          tip: "Resolva a raiz, depois a divisão e por fim a soma.",
          text: "Quanto é √256 ÷ 4 + 11?",
          options: { A: "13", B: "14", C: "15", D: "16" },
          answer: "C",
          explanation: "√256 = 16; 16 ÷ 4 = 4; 4 + 11 = 15."
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
        },
        {
          tip: "Parênteses primeiro; depois potência e soma.",
          text: "Quanto é (25 − 7) × 4 + 2³?",
          options: { A: "72", B: "76", C: "80", D: "88" },
          answer: "C",
          explanation: "25 − 7 = 18; 18 × 4 = 72; 2³ = 8; 72 + 8 = 80."
        },
        {
          tip: "Potência, raiz e divisão vêm antes da soma e subtração.",
          text: "Quanto é 3⁴ − √121 + 18 ÷ 3?",
          options: { A: "70", B: "74", C: "76", D: "82" },
          answer: "C",
          explanation: "3⁴ = 81, √121 = 11 e 18 ÷ 3 = 6; 81 − 11 + 6 = 76."
        },
        {
          tip: "Resolva tudo dentro do parêntese antes de multiplicar por 2.",
          text: "Quanto é (96 ÷ 8 + 4²) × 2?",
          options: { A: "48", B: "52", C: "56", D: "64" },
          answer: "C",
          explanation: "96 ÷ 8 = 12 e 4² = 16; 12 + 16 = 28; 28 × 2 = 56."
        },
        {
          tip: "Calcule raiz e potência antes de somar e subtrair.",
          text: "Quanto é √225 + 5² − 7?",
          options: { A: "31", B: "33", C: "35", D: "40" },
          answer: "B",
          explanation: "√225 = 15 e 5² = 25; 15 + 25 − 7 = 33."
        },
        {
          tip: "Potência, divisão e raiz são resolvidas antes da soma/subtração.",
          text: "Quanto é 2⁵ + 144 ÷ 12 − √49?",
          options: { A: "35", B: "37", C: "39", D: "44" },
          answer: "B",
          explanation: "2⁵ = 32, 144 ÷ 12 = 12 e √49 = 7; 32 + 12 − 7 = 37."
        },
        {
          tip: "Resolva o parêntese antes da divisão.",
          text: "Quanto é (7² − 13) ÷ 6?",
          options: { A: "5", B: "6", C: "7", D: "8" },
          answer: "B",
          explanation: "7² = 49; 49 − 13 = 36; 36 ÷ 6 = 6."
        },
        {
          tip: "Faça raiz, multiplicação e potência antes da soma/subtração.",
          text: "Quanto é √324 + 8 × 7 − 3²?",
          options: { A: "61", B: "63", C: "65", D: "67" },
          answer: "C",
          explanation: "√324 = 18, 8 × 7 = 56 e 3² = 9; 18 + 56 − 9 = 65."
        },
        {
          tip: "Resolva o parêntese, depois a divisão e a potência.",
          text: "Quanto é (150 − 30) ÷ 5 + 2⁴?",
          options: { A: "36", B: "40", C: "44", D: "48" },
          answer: "B",
          explanation: "150 − 30 = 120; 120 ÷ 5 = 24; 2⁴ = 16; 24 + 16 = 40."
        },
        {
          tip: "Potência e multiplicação antes da raiz e das somas/subtrações.",
          text: "Quanto é 5³ − 9 × 8 + √361?",
          options: { A: "68", B: "70", C: "72", D: "74" },
          answer: "C",
          explanation: "5³ = 125, 9 × 8 = 72 e √361 = 19; 125 − 72 + 19 = 72."
        },
        {
          tip: "Resolva a raiz e a potência dentro do parêntese antes de dividir.",
          text: "Quanto é (√196 + 6²) ÷ 5?",
          options: { A: "8", B: "9", C: "10", D: "12" },
          answer: "C",
          explanation: "√196 = 14 e 6² = 36; 14 + 36 = 50; 50 ÷ 5 = 10."
        }
      ]
    }
  };

  function createCommonEnemies() {
    return [
      // Distrito das Operações — primeira etapa, ao sul da Ponte das Equações.
      { id: "soma-01", typeId: "soma-subtracao", x: 940, y: 1135, patrol: "horizontal", rangeX: 92, rangeY: 28, speed: 0.00125, phase: 0.1, questionIndex: 0 },
      { id: "soma-02", typeId: "soma-subtracao", x: 1250, y: 1215, patrol: "circle", rangeX: 70, rangeY: 44, speed: 0.0012, phase: 1.6, questionIndex: 1 },
      { id: "soma-03", typeId: "soma-subtracao", x: 1560, y: 1135, patrol: "horizontal", rangeX: 92, rangeY: 28, speed: 0.0011, phase: 2.9, questionIndex: 2 },

      // Campos dos Fatores — ramo leste da bifurcação.
      { id: "fator-01", typeId: "multiplicacao-divisao", x: 1650, y: 790, patrol: "horizontal", rangeX: 96, rangeY: 30, speed: 0.0011, phase: 0.7, questionIndex: 0 },
      { id: "fator-02", typeId: "multiplicacao-divisao", x: 1880, y: 865, patrol: "circle", rangeX: 72, rangeY: 48, speed: 0.00118, phase: 2.1, questionIndex: 1 },
      { id: "fator-03", typeId: "multiplicacao-divisao", x: 2080, y: 745, patrol: "vertical", rangeX: 26, rangeY: 78, speed: 0.0012, phase: 3.2, questionIndex: 2 },

      // Bosque das Potências — ramo oeste da bifurcação.
      { id: "raiz-01", typeId: "potencia-radiciacao", x: 430, y: 775, patrol: "circle", rangeX: 64, rangeY: 46, speed: 0.00124, phase: 0.4, questionIndex: 0 },
      { id: "raiz-02", typeId: "potencia-radiciacao", x: 650, y: 870, patrol: "horizontal", rangeX: 92, rangeY: 28, speed: 0.00105, phase: 1.9, questionIndex: 1 },
      { id: "raiz-03", typeId: "potencia-radiciacao", x: 855, y: 745, patrol: "circle", rangeX: 62, rangeY: 46, speed: 0.00124, phase: 2.6, questionIndex: 2 }
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
    y: 505,
    patrol: "circle",
    rangeX: 88,
    rangeY: 54,
    speed: 0.00102,
    phase: 0.3,
    questionIndex: 0,
    originX: 1250,
    originY: 505,
    lastX: 1250,
    lastY: 505,
    direction: "baixo",
    enemyRank: "miniBoss"
  };

  const boss = {
    id: "chefe-golem-calculos",
    typeId: "chefe-golem-calculos",
    x: 1250,
    y: 205,
    patrol: "vertical",
    rangeX: 0,
    rangeY: 30,
    speed: 0.00088,
    phase: 1.4,
    questionIndex: 0,
    originX: 1250,
    originY: 205,
    lastX: 1250,
    lastY: 205,
    direction: "baixo",
    enemyRank: "boss"
  };

  const worldEquations = [
    {
      id: "equacao-operacoes-01",
      name: "Núcleo da Ponte das Equações",
      area: "Distrito das Operações",
      x: 1250,
      y: 1045,
      formula: "18 + ? = 45",
      prompt: "Qual número estabiliza a Ponte das Equações?",
      options: ["27", "17", "36", "63"],
      answer: "27",
      explanation: "18 + 27 = 45. A Ponte das Equações se materializou e abriu a bifurcação do reino."
    },
    {
      id: "equacao-fatores-01",
      name: "Engrenagem-Mestra dos Fatores",
      area: "Campos dos Fatores",
      x: 1900,
      y: 925,
      formula: "6 × ? = 54",
      prompt: "Qual fator completa a engrenagem?",
      options: ["7", "8", "9", "12"],
      answer: "9",
      explanation: "6 × 9 = 54. As engrenagens dos Campos dos Fatores voltaram a girar em sincronia."
    },
    {
      id: "equacao-potencias-01",
      name: "Cristal-Raiz Ancestral",
      area: "Bosque das Potências",
      x: 600,
      y: 925,
      formula: "√? = 8",
      prompt: "Qual valor deve alimentar o cristal?",
      options: ["16", "32", "64", "81"],
      answer: "64",
      explanation: "√64 = 8. As raízes cristalinas do bosque recuperaram sua forma perfeita."
    }
  ];

  const scene = {
    id: "reino-matematica",
    name: "Reino da Matemática",
    className: "scene-math",
    plazaLabel: "PRAÇA DO<br>INFINITO",
    defaultHint: "Reino da Matemática: estabilize a lógica do mundo, domine as três zonas e avance até o guardião final.",
    spawn: { x: 1250, y: 1450 },
    zoneMarkers: [],
    buildings: [
      { id: "arquivo-operacoes", label: "Arquivo das Operações", x: 245, y: 1085, w: 430, h: 260, roofH: 128 },
      { id: "observatorio-operacoes", label: "Observatório dos Sinais", x: 1825, y: 1085, w: 430, h: 260, roofH: 128 },
      { id: "torre-potencias", label: "Torre dos Expoentes", x: 160, y: 590, w: 370, h: 245, roofH: 120 },
      { id: "forja-fatores", label: "Forja dos Fatores", x: 1970, y: 590, w: 370, h: 245, roofH: 120 },
      { id: "ruina-melog-oeste", label: "Ruína da Igualdade", x: 725, y: 385, w: 330, h: 205, roofH: 105, solid: false },
      { id: "ruina-melog-leste", label: "Ruína da Ordem", x: 1445, y: 385, w: 330, h: 205, roofH: 105, solid: false },
      { id: "fortaleza-golem", label: "Fortaleza do Golem", x: 900, y: 18, w: 700, h: 260, roofH: 124, solid: false }
    ],
    decorObjects: [
      // Pisos/landmarks principais. Eles não têm colisão: definem visualmente as zonas.
      { id: "praca-infinito-floor", label: "Praça do Infinito", type: "infinity-plaza", x: 955, y: 1290, w: 590, h: 250, solid: false, showLabel: false },
      { id: "zona-operacoes-floor", label: "Distrito das Operações", type: "math-zone", operation: "soma", x: 640, y: 1010, w: 1220, h: 300, solid: false, showLabel: false },
      { id: "zona-potencias-floor", label: "Bosque das Potências", type: "math-zone", operation: "raiz", x: 310, y: 670, w: 760, h: 315, solid: false, showLabel: false },
      { id: "zona-fatores-floor", label: "Campos dos Fatores", type: "math-zone", operation: "fator", x: 1430, y: 670, w: 760, h: 315, solid: false, showLabel: false },
      { id: "zona-melog-floor", label: "Ruínas do Melog", type: "corruption-zone", operation: "melog", x: 930, y: 375, w: 640, h: 290, solid: false, showLabel: false },
      { id: "zona-golem-floor", label: "Fortaleza do Golem", type: "fortress-court", operation: "golem", x: 940, y: 80, w: 620, h: 250, solid: false, showLabel: false },

      // Títulos de região — visíveis mesmo no modo oficial.
      { id: "titulo-praca", label: "∞  PRAÇA DO INFINITO", type: "zone-title", operation: "infinito", x: 1060, y: 1510, w: 380, h: 46, solid: false, showLabel: true },
      { id: "titulo-operacoes", label: "+ −  DISTRITO DAS OPERAÇÕES", type: "zone-title", operation: "soma", x: 1050, y: 1260, w: 400, h: 46, solid: false, showLabel: true },
      { id: "titulo-potencias", label: "x² √  BOSQUE DAS POTÊNCIAS", type: "zone-title", operation: "raiz", x: 470, y: 965, w: 440, h: 46, solid: false, showLabel: true },
      { id: "titulo-fatores", label: "× ÷  CAMPOS DOS FATORES", type: "zone-title", operation: "fator", x: 1595, y: 965, w: 410, h: 46, solid: false, showLabel: true },
      { id: "titulo-melog", label: "≠  RUÍNAS DO MELOG", type: "zone-title", operation: "melog", x: 1080, y: 640, w: 340, h: 46, solid: false, showLabel: true },
      { id: "titulo-golem", label: "∑  FORTALEZA DO GOLEM", type: "zone-title", operation: "golem", x: 1060, y: 310, w: 380, h: 46, solid: false, showLabel: true },

      // A primeira barreira cria uma progressão física: só a equação das Operações materializa a ponte.
      { id: "abismo-equacoes-oeste", label: "Abismo das Equações", type: "math-chasm", x: 0, y: 920, w: 1120, h: 92, solid: true, showLabel: false },
      { id: "abismo-equacoes-leste", label: "Abismo das Equações", type: "math-chasm", x: 1380, y: 920, w: 1120, h: 92, solid: true, showLabel: false },
      {
        id: "ponte-das-equacoes",
        label: "Ponte das Equações",
        type: "equation-bridge",
        operation: "soma",
        x: 1120,
        y: 920,
        w: 260,
        h: 92,
        solid: true,
        showLabel: false,
        progressGate: { type: "world-equation", equationId: "equacao-operacoes-01" }
      },

      // Selo do Melog: os três setores precisam ser limpos antes das ruínas aceitarem o jogador.
      { id: "corrupcao-melog-oeste", label: "Corrupção do Melog", type: "corruption-wall", operation: "melog", x: 0, y: 575, w: 1120, h: 82, solid: true, showLabel: false },
      { id: "corrupcao-melog-leste", label: "Corrupção do Melog", type: "corruption-wall", operation: "melog", x: 1380, y: 575, w: 1120, h: 82, solid: true, showLabel: false },
      {
        id: "portao-melog-visual",
        label: "Selo do Melog",
        type: "gate",
        operation: "melog",
        x: 1120,
        y: 575,
        w: 260,
        h: 82,
        solid: true,
        showLabel: false,
        progressGate: { type: "mini-boss-unlocked" }
      },

      // O Golem permanece visível ao longe, mas o acesso só existe depois de Melog.
      { id: "muralha-golem-oeste", label: "Muralha do Teorema", type: "fortress-wall", operation: "golem", x: 0, y: 300, w: 1120, h: 72, solid: true, showLabel: false },
      { id: "muralha-golem-leste", label: "Muralha do Teorema", type: "fortress-wall", operation: "golem", x: 1380, y: 300, w: 1120, h: 72, solid: true, showLabel: false },
      {
        id: "portao-golem-visual",
        label: "Portão do Teorema",
        type: "gate",
        operation: "golem",
        x: 1120,
        y: 300,
        w: 260,
        h: 72,
        solid: true,
        showLabel: false,
        progressGate: { type: "boss-unlocked" }
      },

      // Elementos do Distrito das Operações.
      { id: "arena-soma", label: "Adição e Subtração", type: "math-pad", operation: "soma", x: 790, y: 1070, w: 920, h: 205, solid: false, showLabel: false },
      { id: "linha-operacoes", label: "", type: "number-line", x: 825, y: 1028, w: 850, h: 34, solid: false, showLabel: false },
      { id: "simbolo-operacoes-a", label: "+  18  −  7  +  24", type: "math-symbol", operation: "soma", x: 1070, y: 1070, w: 360, h: 50, solid: false, showLabel: true },
      { id: "obelisco-op-01", label: "Obelisco +", type: "math-obelisk", operation: "soma", x: 720, y: 1145, w: 62, h: 112, solid: true, showLabel: false },
      { id: "obelisco-op-02", label: "Obelisco −", type: "math-obelisk", operation: "soma", x: 1718, y: 1145, w: 62, h: 112, solid: true, showLabel: false },

      // Campos dos Fatores: repetição, agrupamento e engrenagens.
      { id: "arena-fator", label: "Multiplicação e Divisão", type: "math-pad", operation: "fator", x: 1500, y: 715, w: 620, h: 220, solid: false, showLabel: false },
      { id: "pilar-fator-01", label: "Fator 2", type: "factor-pillar", operation: "fator", x: 1510, y: 735, w: 76, h: 116, solid: true, showLabel: false },
      { id: "pilar-fator-02", label: "Fator 3", type: "factor-pillar", operation: "fator", x: 2110, y: 735, w: 76, h: 116, solid: true, showLabel: false },
      { id: "pilar-fator-03", label: "Fator 6", type: "factor-pillar", operation: "fator", x: 1780, y: 690, w: 76, h: 116, solid: true, showLabel: false },
      { id: "simbolo-fator-a", label: "3 × 4 = 12   •   24 ÷ 6 = 4", type: "math-symbol", operation: "fator", x: 1680, y: 705, w: 360, h: 50, solid: false, showLabel: true },

      // Bosque das Potências: cristais e crescimento exponencial.
      { id: "arena-raiz", label: "Potências e Raízes", type: "math-pad", operation: "raiz", x: 380, y: 715, w: 620, h: 220, solid: false, showLabel: false },
      { id: "cristal-potencia-01", label: "Cristal 2²", type: "crystal", x: 355, y: 775, w: 62, h: 94, solid: true, showLabel: false },
      { id: "cristal-potencia-02", label: "Cristal 2³", type: "crystal", x: 970, y: 765, w: 70, h: 108, solid: true, showLabel: false },
      { id: "cristal-potencia-03", label: "Cristal √", type: "crystal", x: 720, y: 690, w: 58, h: 88, solid: true, showLabel: false },
      { id: "simbolo-raiz-a", label: "2  →  2²  →  2³  →  2⁴", type: "math-symbol", operation: "raiz", x: 500, y: 705, w: 380, h: 50, solid: false, showLabel: true },

      // Ruínas do Melog — equações propositalmente erradas no cenário.
      { id: "arena-melog", label: "Arena Anti-Estudo", type: "boss-pad", operation: "melog", x: 1030, y: 405, w: 440, h: 200, solid: false, showLabel: false },
      { id: "erro-melog-01", label: "2 + 2 = 7", type: "corrupt-equation", operation: "melog", x: 820, y: 455, w: 220, h: 58, solid: false, showLabel: true },
      { id: "erro-melog-02", label: "8 × 4 = 12", type: "corrupt-equation", operation: "melog", x: 1460, y: 455, w: 220, h: 58, solid: false, showLabel: true },
      { id: "erro-melog-03", label: "√81 = 4", type: "corrupt-equation", operation: "melog", x: 1140, y: 390, w: 220, h: 58, solid: false, showLabel: true },

      // Fortaleza do Golem — geometria limpa, simétrica e monumental.
      { id: "santuario-golem", label: "Santuário do Golem", type: "boss-pad", operation: "golem", x: 1040, y: 105, w: 420, h: 180, solid: false, showLabel: false },
      { id: "obelisco-golem-01", label: "Teorema I", type: "math-obelisk", operation: "golem", x: 975, y: 135, w: 66, h: 126, solid: true, showLabel: false },
      { id: "obelisco-golem-02", label: "Teorema II", type: "math-obelisk", operation: "golem", x: 1459, y: 135, w: 66, h: 126, solid: true, showLabel: false },
      { id: "simbolo-golem", label: "∑   ∆   √   π", type: "math-symbol", operation: "golem", x: 1110, y: 92, w: 280, h: 50, solid: false, showLabel: true },

      // Cristais de borda dão silhueta ao percurso sem criar um corredor totalmente fechado.
      { id: "cristal-borda-01", label: "Cristal Limite", type: "crystal", x: 85, y: 1030, w: 66, h: 102, solid: true, showLabel: false },
      { id: "cristal-borda-02", label: "Cristal Limite", type: "crystal", x: 2345, y: 1030, w: 66, h: 102, solid: true, showLabel: false },
      { id: "cristal-borda-03", label: "Cristal Limite", type: "crystal", x: 90, y: 455, w: 66, h: 102, solid: true, showLabel: false },
      { id: "cristal-borda-04", label: "Cristal Limite", type: "crystal", x: 2340, y: 455, w: 66, h: 102, solid: true, showLabel: false }
    ],
    treeObjects: [
      // Bosque das Potências — concentração maior de árvores no ramo oeste.
      { id: "arvore-math-01", label: "Árvore Fractal 1", x: 120, y: 675, w: 128, h: 118 },
      { id: "arvore-math-02", label: "Árvore Fractal 2", x: 260, y: 845, w: 112, h: 104 },
      { id: "arvore-math-03", label: "Árvore Fractal 3", x: 505, y: 620, w: 122, h: 112 },
      { id: "arvore-math-04", label: "Árvore Fractal 4", x: 780, y: 620, w: 116, h: 108 },
      { id: "arvore-math-05", label: "Árvore Fractal 5", x: 955, y: 845, w: 122, h: 112 },
      { id: "arvore-math-06", label: "Árvore Fractal 6", x: 150, y: 925, w: 116, h: 108 },

      // Moldura externa / profundidade do reino.
      { id: "arvore-math-07", label: "Cálculo-Raiz 7", x: 105, y: 1330, w: 128, h: 118 },
      { id: "arvore-math-08", label: "Cálculo-Raiz 8", x: 330, y: 1400, w: 112, h: 104 },
      { id: "arvore-math-09", label: "Cálculo-Raiz 9", x: 2110, y: 1390, w: 128, h: 118 },
      { id: "arvore-math-10", label: "Cálculo-Raiz 10", x: 2315, y: 1320, w: 112, h: 104 },
      { id: "arvore-math-11", label: "Cálculo-Raiz 11", x: 720, y: 210, w: 108, h: 104 },
      { id: "arvore-math-12", label: "Cálculo-Raiz 12", x: 1675, y: 210, w: 108, h: 104 }
    ],
    npcObjects: [
      {
        id: "npc-guardiao-retorno",
        name: "Guardião do Portal",
        role: "Retorno à Vila Central",
        x: 1450,
        y: 1435,
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "#00eaff",
        portrait: "assets/images/npcs/guardiao-do-portal.webp",
        returnToVillage: true,
        dialogue: [
          "Você chegou pela Praça do Infinito. Dela, o Reino da Matemática inteiro se estende ao norte.",
          "Comece pelo Distrito das Operações e estabilize a Ponte das Equações. Depois o caminho se divide entre os Campos dos Fatores e o Bosque das Potências.",
          "Quando quiser voltar para a Vila Central, fale comigo novamente."
        ]
      },
      {
        id: "npc-voltinho-math",
        name: "Voltinho",
        role: "Guia da Matemática",
        x: 1080,
        y: 1405,
        colorA: "#78f7ff",
        colorB: "#00eaff",
        aura: "#78f7ff",
        portrait: "assets/images/sprites/voltinho_explicando.webp",
        dialogue: [
          "Agora o reino reage ao que você aprende. A primeira Equação do Mundo controla a Ponte das Equações logo depois do Distrito das Operações.",
          "Depois da ponte, escolha a ordem: Campos dos Fatores à direita ou Bosque das Potências à esquerda. As duas áreas precisam ser dominadas para enfraquecer a corrupção de Melog.",
          "Cada Equação do Mundo estabilizada também fortalece seu Ritmo Lógico em +2 segundos por pergunta enquanto você estiver aqui."
        ]
      },
      {
        id: "terminal-progresso-math",
        name: "Terminal de Progresso",
        role: "Status do Reino",
        x: 1250,
        y: 1345,
        visualType: "terminal",
        colorA: "#78f7ff",
        colorB: "#9257ff",
        aura: "#00eaff",
        portrait: "assets/images/sprites/voltinho_pensando.webp",
        dynamicDialogue: "math-progress"
      },
      {
        id: "portao-melog-math",
        name: "Selo das Ruínas",
        role: "Acesso ao Melog",
        x: 1000,
        y: 625,
        visualType: "gate",
        colorA: "#ff4d7d",
        colorB: "#9257ff",
        aura: "#ff4d7d",
        portrait: "assets/images/mini-bosses/melog.webp",
        dynamicDialogue: "melog-gate"
      },
      {
        id: "portao-golem-math",
        name: "Portão do Teorema",
        role: "Acesso ao Guardião Final",
        x: 1000,
        y: 350,
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
        name: "Portal da Praça do Infinito",
        x: 1250,
        y: 1490,
        interactionRange: 0,
        colorA: "#ffd166",
        colorB: "#00eaff"
      }
    ],
    worldEquations,
    enemyObjects: []
  };

  global.VoltzData.realms.mathematics = {
    id: "reino-matematica",
    progressKey: "reino-matematica",
    enemyTypes,
    commonEnemies: createCommonEnemies(),
    miniBoss,
    boss,
    worldEquations,
    scene
  };
})(window);
