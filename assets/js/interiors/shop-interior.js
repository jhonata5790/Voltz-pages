(function registerShopInterior(global) {
  const registry = global.VoltzInteriors;
  if (!registry) throw new Error("[Loja] interior-data.js precisa carregar antes de shop-interior.js.");

  registry.register({
    id: "interior-loja",
    name: "Loja Voltz",
    className: "scene-shop-interior",
    plazaLabel: "",
    defaultHint: "Loja Voltz: fale com o Mercador de Foco. Para sair, caminhe pela porta ao sul.",
    spawn: { x: 1250, y: 980 },
    cameraZoom: 1.2,
    playerScale: 0.72,
    room: { x: 800, y: 350, w: 900, h: 740, title: "LOJA VOLTZ" },
    transitions: {
      entry: {
        fromSceneId: "vila-central",
        trigger: { x: 570, y: 1210, w: 120, h: 80 },
        movementKey: "up",
        direction: "cima",
        message: "Entrando na Loja Voltz..."
      },
      exit: {
        toSceneId: "vila-central",
        trigger: { x: 1185, y: 1030, w: 130, h: 72 },
        movementKey: "down",
        spawn: { x: 630, y: 1315 },
        direction: "baixo",
        message: "Você saiu da Loja Voltz.",
        hint: "Continue para baixo para sair da Loja Voltz."
      }
    },
    render(scene) {
      const r = scene.room;
      return `
        <div class="shop-room" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;">
          <div class="shop-room-glow"></div>
          <div class="shop-wall shop-wall-north"></div>
          <div class="shop-wall shop-wall-west"></div>
          <div class="shop-wall shop-wall-east"></div>
          <div class="shop-wall shop-wall-south shop-wall-south-left"></div>
          <div class="shop-wall shop-wall-south shop-wall-south-right"></div>
          <div class="shop-door"><span>VILA CENTRAL</span></div>
          <div class="shop-title">${r.title}</div>
          <div class="shop-sign">FOCO · PREPARO · ESTRATÉGIA</div>
          <div class="shop-counter-backdrop"></div>
          <div class="shop-floor-lines"></div>
        </div>`;
    },
    customColliders: [
      { id: "loja-parede-norte", label: "Parede norte da Loja", x: 800, y: 350, w: 900, h: 36 },
      { id: "loja-parede-oeste", label: "Parede oeste da Loja", x: 800, y: 350, w: 36, h: 740 },
      { id: "loja-parede-leste", label: "Parede leste da Loja", x: 1664, y: 350, w: 36, h: 740 },
      { id: "loja-parede-sul-esq", label: "Parede sul da Loja", x: 800, y: 1054, w: 385, h: 36 },
      { id: "loja-parede-sul-dir", label: "Parede sul da Loja", x: 1315, y: 1054, w: 385, h: 36 }
    ],
    decorObjects: [
      { id: "loja-balcao", label: "Balcão do Mercador", type: "shop-counter", x: 1010, y: 505, w: 480, h: 96, solid: true, showLabel: false, collider: { x: 14, y: 54, w: 452, h: 42 } },
      { id: "loja-prateleira-esq", label: "Prateleira de recursos", type: "shop-shelf", x: 855, y: 450, w: 120, h: 340, solid: true, showLabel: true, collider: { x: 12, y: 250, w: 96, h: 90 } },
      { id: "loja-prateleira-dir", label: "Prateleira de recursos", type: "shop-shelf", x: 1525, y: 450, w: 120, h: 340, solid: true, showLabel: true, collider: { x: 12, y: 250, w: 96, h: 90 } },
      { id: "loja-caixa-esq", label: "Caixas de suprimentos", type: "shop-crates", x: 930, y: 835, w: 120, h: 82, solid: true, showLabel: false, collider: { x: 10, y: 40, w: 100, h: 42 } },
      { id: "loja-caixa-dir", label: "Caixas de suprimentos", type: "shop-crates", x: 1450, y: 835, w: 120, h: 82, solid: true, showLabel: false, collider: { x: 10, y: 40, w: 100, h: 42 } },
      { id: "loja-mesa-expositor", label: "Expositor", type: "shop-display", x: 1135, y: 735, w: 230, h: 115, solid: true, showLabel: false, collider: { x: 18, y: 62, w: 194, h: 53 } }
    ],
    npcObjects: [{
      id: "npc-mercador-foco",
      name: "Mercador de Foco",
      role: "Loja Voltz",
      x: 1250,
      y: 665,
      colorA: "#00eaff",
      colorB: "#ffd166",
      aura: "#ffd166",
      portrait: "assets/images/npcs/mercador-de-foco.webp",
      opensShop: true,
      dialogue: [
        "Bem-vindo. Agora a loja finalmente tem paredes, estoque e um balcão digno das suas moedas.",
        "A Dica de Foco vai para sua mochila e pode revelar a dica da pergunta atual durante uma batalha.",
        "Cada unidade custa 15 moedas. Em treino da Arena, seus consumíveis ficam protegidos e não podem ser gastos.",
        "Se quiser comprar, eu abro o catálogo agora."
      ]
    }],
    buildings: [], treeObjects: [], portalObjects: [], enemyObjects: []
  });
})(window);
