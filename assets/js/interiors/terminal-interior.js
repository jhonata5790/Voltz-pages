(function registerTerminalInterior(global) {
  const registry = global.VoltzInteriors;
  if (!registry) throw new Error("[Terminal] interior-data.js precisa carregar antes de terminal-interior.js.");

  registry.register({
    id: "interior-terminal",
    name: "Terminal do Aluno",
    className: "scene-terminal-interior",
    plazaLabel: "",
    defaultHint: "Terminal do Aluno: fale com o Voltinho para consultar seu perfil ou com a Arquivista para entender seus registros.",
    spawn: { x: 1250, y: 1000 },
    cameraZoom: 1.18,
    playerScale: 0.72,
    room: { x: 760, y: 320, w: 980, h: 790, title: "TERMINAL DO ALUNO" },
    transitions: {
      entry: {
        fromSceneId: "vila-central",
        trigger: { x: 1190, y: 1485, w: 120, h: 82 },
        movementKey: "up",
        direction: "cima",
        message: "Entrando no Terminal do Aluno..."
      },
      exit: {
        toSceneId: "vila-central",
        trigger: { x: 1185, y: 1050, w: 130, h: 72 },
        movementKey: "down",
        spawn: { x: 1250, y: 1545 },
        direction: "baixo",
        message: "Você saiu do Terminal do Aluno.",
        hint: "Continue para baixo para voltar à Vila Central."
      }
    },
    render(scene) {
      const r = scene.room;
      return `
        <div class="terminal-room" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;">
          <div class="terminal-room-glow"></div>
          <div class="terminal-wall terminal-wall-north"></div>
          <div class="terminal-wall terminal-wall-west"></div>
          <div class="terminal-wall terminal-wall-east"></div>
          <div class="terminal-wall terminal-wall-south terminal-wall-south-left"></div>
          <div class="terminal-wall terminal-wall-south terminal-wall-south-right"></div>
          <div class="terminal-door"><span>VILA CENTRAL</span></div>
          <div class="terminal-title">${r.title}</div>
          <div class="terminal-core-screen"><span>PERFIL VOLTZ</span><strong>◈</strong></div>
          <div class="terminal-floor-lines"></div>
        </div>`;
    },
    customColliders: [
      { id: "terminal-parede-norte", label: "Parede norte do Terminal", x: 760, y: 320, w: 980, h: 38 },
      { id: "terminal-parede-oeste", label: "Parede oeste do Terminal", x: 760, y: 320, w: 38, h: 790 },
      { id: "terminal-parede-leste", label: "Parede leste do Terminal", x: 1702, y: 320, w: 38, h: 790 },
      { id: "terminal-parede-sul-esq", label: "Parede sul do Terminal", x: 760, y: 1072, w: 425, h: 38 },
      { id: "terminal-parede-sul-dir", label: "Parede sul do Terminal", x: 1315, y: 1072, w: 425, h: 38 }
    ],
    decorObjects: [
      { id: "terminal-console-central", label: "Console central", type: "terminal-console-large", x: 1090, y: 470, w: 320, h: 120, solid: true, showLabel: false, collider: { x: 18, y: 70, w: 284, h: 50 } },
      { id: "terminal-console-esq", label: "Progresso dos Reinos", type: "terminal-console", x: 845, y: 620, w: 180, h: 94, solid: true, showLabel: true, collider: { x: 10, y: 52, w: 160, h: 42 } },
      { id: "terminal-console-dir", label: "Diplomas e competências", type: "terminal-console", x: 1475, y: 620, w: 180, h: 94, solid: true, showLabel: true, collider: { x: 10, y: 52, w: 160, h: 42 } },
      { id: "terminal-banco-esq", label: "Assento", type: "terminal-seat", x: 930, y: 845, w: 110, h: 52, solid: true, showLabel: false, collider: { x: 8, y: 24, w: 94, h: 28 } },
      { id: "terminal-banco-dir", label: "Assento", type: "terminal-seat", x: 1460, y: 845, w: 110, h: 52, solid: true, showLabel: false, collider: { x: 8, y: 24, w: 94, h: 28 } }
    ],
    npcObjects: [
      {
        id: "npc-voltinho-terminal",
        name: "Voltinho",
        role: "Guia do Aluno",
        x: 1170,
        y: 770,
        colorA: "#78f7ff",
        colorB: "#00eaff",
        aura: "#78f7ff",
        portrait: "assets/images/sprites/voltinho_explicando.webp",
        opensStudentTerminal: true,
        dialogue: [
          "Esse é o Terminal do Aluno. Aqui seu progresso deixa de ser um monte de números escondidos no save.",
          "Você consegue ver XP, moedas, diplomas, competências permanentes e o estado de cada Reino do Conhecimento.",
          "O Hall da Fama compara jogadores. Este lugar é só seu: serve para entender a própria jornada.",
          "Vou abrir seu painel agora."
        ]
      },
      {
        id: "npc-arquivista-questoes",
        name: "Arquivista das Questões",
        role: "Arquivo de Progresso",
        x: 1370,
        y: 770,
        colorA: "#9257ff",
        colorB: "#78f7ff",
        aura: "#9257ff",
        portrait: "assets/images/npcs/arquivista-das-questoes.webp",
        dialogue: [
          "Eu mantenho os registros que alimentam o Terminal: reinos concluídos, desafios superados e conquistas permanentes.",
          "O Hall da Fama recebe só o resumo necessário para classificação. Seu inventário e os detalhes do save continuam privados.",
          "Quando os outros reinos forem liberados, este terminal vai mostrar a evolução de cada um sem precisar abrir o banco de dados."
        ]
      }
    ],
    buildings: [], treeObjects: [], portalObjects: [], enemyObjects: []
  });
})(window);
