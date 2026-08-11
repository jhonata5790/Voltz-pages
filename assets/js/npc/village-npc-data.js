window.VoltzData = window.VoltzData || {};

window.VoltzData.villageNpcs = [
  {
    id: "npc-guardiao-portal",
    name: "Guardião do Portal",
    role: "Portal dos Reinos",
    x: 1250,
    y: 505,
    colorA: "#78f7ff",
    colorB: "#9257ff",
    aura: "#00eaff",
    portrait: "assets/images/npcs/guardiao-do-portal.webp",
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
    portrait: "assets/images/npcs/professora-sintaxe.webp",
    resetsMathProgress: true,
    dialogue: [
      "Antes de enfrentar uma questão, respire e leia com atenção. Muitas respostas se escondem no próprio enunciado.",
      "Aqui na Biblioteca, as dicas aparecem antes e depois das perguntas para transformar erro em aprendizado.",
      "Conhecimento não é decorar tudo. É entender o caminho até a resposta.",
      "Se você já limpou o Reino da Matemática e quiser tentar de novo, fale comigo até o fim. Eu reinicio os desafios para você."
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
    portrait: "assets/images/npcs/treinador-de-energia.webp",
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
    portrait: "assets/images/npcs/mercador-de-foco.webp",
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
    portrait: "assets/images/npcs/arquivista-das-questoes.webp",
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
    portrait: "assets/images/sprites/voltinho_explicando.webp",
    dialogue: [
      "Ei! Eu sou o Voltinho, seu guia nessa jornada pelo Reino do Conhecimento.",
      "Seu perfil vai guardar XP, moedas, progresso por reino e tudo que você conquistar.",
      "A ideia é simples: estudar, explorar, batalhar, errar, aprender e evoluir."
    ]
  }
];
