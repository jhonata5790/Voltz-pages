(function initializeInteriorSystem(global) {
  const registry = global.VoltzInteriors;

  if (!registry) {
    throw new Error("[Voltz Interiors] interior-data.js precisa carregar antes de interior-system.js.");
  }

  function pointInsideRectangle(point, rectangle) {
    return (
      point.x >= rectangle.x &&
      point.x <= rectangle.x + rectangle.w &&
      point.y >= rectangle.y &&
      point.y <= rectangle.y + rectangle.h
    );
  }

  function isInteriorScene(scene) {
    return Boolean(scene?.isInterior && registry.has(scene.id));
  }

  function getScene(interiorId) {
    return registry.get(interiorId);
  }

  function getSceneClassNames() {
    return registry.getAll().map((interior) => interior.className);
  }

  function renderScene(scene, layer) {
    if (!layer) return;

    if (!isInteriorScene(scene)) {
      layer.replaceChildren();
      layer.classList.remove("visible");
      layer.setAttribute("aria-hidden", "true");
      return;
    }

    const markup = typeof scene.render === "function" ? scene.render(scene) : "";
    layer.innerHTML = markup;
    layer.classList.add("visible");
    layer.setAttribute("aria-hidden", "false");
  }

  function applySceneVisualState(scene, elements) {
    const { world, viewport, layer, baseSceneClasses = [] } = elements;
    const removableClasses = ["scene-interior", ...baseSceneClasses, ...getSceneClassNames()];

    world.classList.remove(...new Set(removableClasses));
    if (scene.className) world.classList.add(scene.className);

    const interiorActive = isInteriorScene(scene);
    world.classList.toggle("scene-interior", interiorActive);
    viewport.classList.toggle("interior-active", interiorActive);
    renderScene(scene, layer);
  }

  function movementMatches(keys, movementKey) {
    return !movementKey || Boolean(keys[movementKey]);
  }

  function findTransition({ currentScene, footPoint, keys }) {
    if (isInteriorScene(currentScene)) {
      const exit = currentScene.transitions.exit;

      if (
        movementMatches(keys, exit.movementKey) &&
        pointInsideRectangle(footPoint, exit.trigger)
      ) {
        return {
          kind: "exit",
          targetSceneId: exit.toSceneId,
          options: {
            animateCamera: true,
            spawn: exit.spawn,
            direction: exit.direction || "baixo"
          },
          message: exit.message || `Você saiu de ${currentScene.name}.`
        };
      }

      return null;
    }

    const targetInterior = registry.getAll().find((interior) => {
      const entry = interior.transitions.entry;
      return (
        entry.fromSceneId === currentScene.id &&
        movementMatches(keys, entry.movementKey) &&
        pointInsideRectangle(footPoint, entry.trigger)
      );
    });

    if (!targetInterior) return null;

    const entry = targetInterior.transitions.entry;
    return {
      kind: "enter",
      targetSceneId: targetInterior.id,
      options: {
        animateCamera: true,
        direction: entry.direction || "cima"
      },
      message: entry.message || `Entrando em ${targetInterior.name}...`
    };
  }

  function getContextHint({ currentScene, footPoint }) {
    if (!isInteriorScene(currentScene)) return "";

    const exit = currentScene.transitions.exit;
    if (!pointInsideRectangle(footPoint, exit.trigger)) return "";

    return exit.hint || "Continue em direção à saída.";
  }

  global.VoltzInteriorSystem = Object.freeze({
    getScene,
    getAllScenes: () => registry.getAll(),
    getSceneClassNames,
    isInteriorScene,
    applySceneVisualState,
    findTransition,
    getContextHint
  });
})(window);
