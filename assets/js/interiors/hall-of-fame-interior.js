(function registerHallOfFameInterior(global) {
  const registry = global.VoltzInteriors;

  if (!registry) {
    throw new Error("[Hall da Fama] interior-data.js precisa carregar antes de hall-of-fame-interior.js.");
  }

  registry.register({
    id: "interior-hall-fama",
    name: "Hall da Fama",
    className: "scene-hall-of-fame-interior",
    plazaLabel: "",
    defaultHint: "Hall da Fama: aproxime-se do Curador para consultar o ranking global. Saída ao sul.",
    spawn: { x: 1250, y: 1050 },
    cameraZoom: 1.18,
    playerScale: 0.72,

    room: { x: 720, y: 300, w: 1060, h: 860, title: "HALL DA FAMA" },

    transitions: {
      entry: {
        fromSceneId: "vila-central",
        trigger: { x: 1848, y: 1208, w: 114, h: 88 },
        movementKey: "up",
        direction: "cima",
        message: "Entrando no Hall da Fama..."
      },
      exit: {
        toSceneId: "vila-central",
        trigger: { x: 1180, y: 1090, w: 140, h: 82 },
        movementKey: "down",
        spawn: { x: 1905, y: 1325 },
        direction: "baixo",
        message: "Você saiu do Hall da Fama.",
        hint: "Continue para baixo para voltar à Vila Central."
      }
    },

    render(scene) {
      const room = scene.room;
      return `
        <div class="hall-room" style="left:${room.x}px;top:${room.y}px;width:${room.w}px;height:${room.h}px;">
          <div class="hall-room-glow"></div>
          <div class="hall-wall hall-wall-north"></div>
          <div class="hall-wall hall-wall-west"></div>
          <div class="hall-wall hall-wall-east"></div>
          <div class="hall-wall hall-wall-south hall-wall-south-left"></div>
          <div class="hall-wall hall-wall-south hall-wall-south-right"></div>
          <div class="hall-door"><span>VILA CENTRAL</span></div>
          <div class="hall-title">${room.title}</div>
          <div class="hall-motto">CONCLUSÃO · DIPLOMAS · EXPERIÊNCIA</div>
          <div class="hall-banner hall-banner-left">★</div>
          <div class="hall-banner hall-banner-right">★</div>
          <div class="hall-stage">
            <div class="hall-stage-ring"></div>
            <div class="hall-podium-label hall-podium-label-second">2</div>
            <div class="hall-podium-label hall-podium-label-first">1</div>
            <div class="hall-podium-label hall-podium-label-third">3</div>
          </div>
          <div class="hall-ranking-wall">
            <strong>REGISTRO GLOBAL</strong>
            <span>O Hall reconhece quem conclui a jornada antes de contar diplomas e XP.</span>
          </div>
          <div class="hall-floor-lines"></div>
        </div>
      `;
    },

    customColliders: [
      { id: "hall-parede-norte", label: "Parede norte do Hall", x: 720, y: 300, w: 1060, h: 38 },
      { id: "hall-parede-oeste", label: "Parede oeste do Hall", x: 720, y: 300, w: 38, h: 860 },
      { id: "hall-parede-leste", label: "Parede leste do Hall", x: 1742, y: 300, w: 38, h: 860 },
      { id: "hall-parede-sul-esq", label: "Parede sul do Hall", x: 720, y: 1122, w: 460, h: 38 },
      { id: "hall-parede-sul-dir", label: "Parede sul do Hall", x: 1320, y: 1122, w: 460, h: 38 }
    ],

    decorObjects: [
      { id: "hall-podio-segundo", label: "Segundo Lugar", type: "hall-podium-second", x: 1012, y: 610, w: 132, h: 116, solid: true, showLabel: false, collider: { x: 8, y: 70, w: 116, h: 46 } },
      { id: "hall-podio-primeiro", label: "Primeiro Lugar", type: "hall-podium-first", x: 1184, y: 555, w: 132, h: 171, solid: true, showLabel: false, collider: { x: 8, y: 125, w: 116, h: 46 } },
      { id: "hall-podio-terceiro", label: "Terceiro Lugar", type: "hall-podium-third", x: 1356, y: 640, w: 132, h: 86, solid: true, showLabel: false, collider: { x: 8, y: 40, w: 116, h: 46 } },
      { id: "hall-console-esq", label: "Arquivo Histórico", type: "hall-console", x: 815, y: 795, w: 160, h: 78, solid: true, showLabel: true, collider: { x: 8, y: 44, w: 144, h: 34 } },
      { id: "hall-console-dir", label: "Registro de Diplomas", type: "hall-console", x: 1525, y: 795, w: 160, h: 78, solid: true, showLabel: true, collider: { x: 8, y: 44, w: 144, h: 34 } }
    ],

    buildings: [],
    treeObjects: [],
    portalObjects: [],
    enemyObjects: [],

    npcObjects: [{
      id: "npc-curador-hall",
      name: "Curador do Hall",
      role: "Hall da Fama",
      x: 1250,
      y: 835,
      colorA: "#ffd166",
      colorB: "#9257ff",
      aura: "#ffd166",
      portrait: "assets/images/npcs/arquivista-das-questoes.webp",
      opensHallOfFame: true,
      dialogue: [
        "Bem-vindo ao Hall da Fama. Aqui não basta acumular pontos: a jornada vem primeiro.",
        "Nossa ordem é absoluta: conclusões completas, depois diplomas conquistados e, por fim, experiência.",
        "O painel registra apenas o necessário para o ranking. Seu inventário e seu progresso detalhado continuam privados.",
        "Vou abrir o Registro Global para você."
      ]
    }]
  });
})(window);
