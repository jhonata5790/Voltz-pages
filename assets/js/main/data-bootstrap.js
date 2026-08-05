(function bootstrapVoltzData() {
  const data = window.VoltzData;

  if (!data) {
    console.error("[Voltz] O objeto global VoltzData não foi carregado.");
    return;
  }

  const requiredData = {
    village: data.village,
    villageNpcs: data.villageNpcs,
    villagePortals: data.villagePortals,
    realmOptions: data.realmOptions
  };

  const missingKeys = Object.entries(requiredData)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error(`[Voltz] Dados modulares ausentes: ${missingKeys.join(", ")}.`);
    return;
  }

  const clone = (value) => JSON.parse(JSON.stringify(value));

  buildings = clone(data.village.buildings);
  decorObjects = clone(data.village.decorObjects);
  treeObjects = clone(data.village.treeObjects);
  npcObjects = clone(data.villageNpcs);
  portalObjects = clone(data.villagePortals);

  villageScene.buildings = clone(data.village.buildings);
  villageScene.decorObjects = clone(data.village.decorObjects);
  villageScene.treeObjects = clone(data.village.treeObjects);
  villageScene.npcObjects = clone(data.villageNpcs);
  villageScene.portalObjects = clone(data.villagePortals);

  realmOptions.splice(0, realmOptions.length, ...clone(data.realmOptions));

  changeScene(villageScene);

  data.ready = true;
  console.info("[Voltz] Dados modulares carregados com sucesso.");
})();
