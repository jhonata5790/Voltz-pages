window.VoltzData = window.VoltzData || {};

window.VoltzData.libraryInterior = {
  id: "interior-biblioteca",
  name: "Interior da Biblioteca",
  className: "scene-library-interior",
  plazaLabel: "",
  defaultHint: "Biblioteca de Dicas: explore as estantes. Para sair, caminhe pela porta ao sul.",
  spawn: { x: 610, y: 585 },
  cameraZoom: 1.42,
  playerScale: 0.66,

  room: {
    x: 350,
    y: 220,
    w: 520,
    h: 480,
    title: "BIBLIOTECA DE DICAS"
  },

  entranceTrigger: {
    x: 555,
    y: 620,
    w: 110,
    h: 54
  },

  exitTrigger: {
    x: 555,
    y: 638,
    w: 110,
    h: 66
  },

  exteriorReturn: {
    x: 610,
    y: 704,
    direction: "baixo"
  },

  customColliders: [
    { id: "biblioteca-parede-norte", label: "Parede norte da Biblioteca", x: 350, y: 220, w: 520, h: 34 },
    { id: "biblioteca-parede-oeste", label: "Parede oeste da Biblioteca", x: 350, y: 220, w: 34, h: 480 },
    { id: "biblioteca-parede-leste", label: "Parede leste da Biblioteca", x: 836, y: 220, w: 34, h: 480 },
    { id: "biblioteca-parede-sul-esq", label: "Parede sul da Biblioteca", x: 350, y: 666, w: 205, h: 34 },
    { id: "biblioteca-parede-sul-dir", label: "Parede sul da Biblioteca", x: 665, y: 666, w: 205, h: 34 }
  ],

  decorObjects: [
    {
      id: "estante-norte-esq",
      label: "Estante de Lógica",
      type: "library-shelf",
      x: 398,
      y: 268,
      w: 142,
      h: 72,
      solid: true,
      showLabel: true,
      collider: { x: 6, y: 48, w: 130, h: 24 }
    },
    {
      id: "estante-norte-dir",
      label: "Estante de Ciências",
      type: "library-shelf",
      x: 680,
      y: 268,
      w: 142,
      h: 72,
      solid: true,
      showLabel: true,
      collider: { x: 6, y: 48, w: 130, h: 24 }
    },
    {
      id: "estante-oeste",
      label: "Estante de História",
      type: "library-shelf-tall",
      x: 390,
      y: 390,
      w: 72,
      h: 154,
      solid: true,
      showLabel: false,
      collider: { x: 8, y: 106, w: 56, h: 48 }
    },
    {
      id: "estante-leste",
      label: "Estante de Linguagens",
      type: "library-shelf-tall",
      x: 758,
      y: 390,
      w: 72,
      h: 154,
      solid: true,
      showLabel: false,
      collider: { x: 8, y: 106, w: 56, h: 48 }
    },
    {
      id: "mesa-central",
      label: "Mesa de Estudos",
      type: "library-table",
      x: 515,
      y: 395,
      w: 190,
      h: 104,
      solid: true,
      showLabel: false,
      collider: { x: 16, y: 52, w: 158, h: 52 }
    },
    {
      id: "pufe-esq",
      label: "Pufe de leitura",
      type: "library-seat",
      x: 490,
      y: 535,
      w: 64,
      h: 48,
      solid: true,
      showLabel: false,
      collider: { x: 8, y: 20, w: 48, h: 28 }
    },
    {
      id: "pufe-dir",
      label: "Pufe de leitura",
      type: "library-seat",
      x: 666,
      y: 535,
      w: 64,
      h: 48,
      solid: true,
      showLabel: false,
      collider: { x: 8, y: 20, w: 48, h: 28 }
    },
    {
      id: "balcao-biblioteca",
      label: "Balcão da Biblioteca",
      type: "library-counter",
      x: 565,
      y: 290,
      w: 90,
      h: 58,
      solid: true,
      showLabel: false,
      collider: { x: 8, y: 30, w: 74, h: 28 }
    }
  ],

  buildings: [],
  treeObjects: [],
  npcObjects: [],
  portalObjects: [],
  enemyObjects: []
};
