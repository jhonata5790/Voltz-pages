(function initializeInteriorRegistry(global) {
  const interiors = new Map();

  function validateInterior(interior) {
    if (!interior || typeof interior !== "object") {
      throw new TypeError("[Voltz Interiors] O interior precisa ser um objeto.");
    }

    if (!interior.id || !interior.name || !interior.className) {
      throw new Error("[Voltz Interiors] Todo interior precisa de id, name e className.");
    }

    if (!interior.transitions?.entry || !interior.transitions?.exit) {
      throw new Error(`[Voltz Interiors] O interior ${interior.id} precisa de entrada e saída.`);
    }
  }

  const registry = {
    register(interior) {
      validateInterior(interior);

      if (interiors.has(interior.id)) {
        throw new Error(`[Voltz Interiors] O interior ${interior.id} já foi registrado.`);
      }

      interior.isInterior = true;
      interiors.set(interior.id, interior);
      return interior;
    },

    get(interiorId) {
      return interiors.get(interiorId) || null;
    },

    getAll() {
      return Array.from(interiors.values());
    },

    has(interiorId) {
      return interiors.has(interiorId);
    },

    get size() {
      return interiors.size;
    }
  };

  global.VoltzInteriors = registry;
})(window);
