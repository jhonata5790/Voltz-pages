(function initializeStandaloneDodgeball(global) {
  const RETURN_KEY = "voltz:standalone-sport:return";
  let locked = true;
  let returning = false;
  const status = document.getElementById("dodgeballStandaloneStatus");

  function setStatus(message, finished = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-finished", finished);
  }

  function hasReturnPoint() {
    try {
      const point = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null");
      return Boolean(point && point.sportId === "dodgeball");
    } catch {
      return false;
    }
  }

  function isStandalone() { return true; }

  function onExitBlocked() {
    setStatus("DUELO EM ANDAMENTO · termine a partida antes de voltar ao reino");
    global.setTimeout(() => {
      if (locked) setStatus("DUELO EM ANDAMENTO · finalize a partida para retornar ao reino");
    }, 1700);
  }

  function onMatchStarted() {
    locked = true;
    returning = false;
    setStatus("DUELO EM ANDAMENTO · finalize a partida para retornar ao reino");
  }

  function onMatchFinished() {
    locked = false;
    setStatus("DUELO ENCERRADO · você já pode voltar ao reino", true);
  }

  function returnToWorld() {
    if (returning) return;
    if (locked) {
      onExitBlocked();
      return;
    }
    returning = true;
    global.location.href = "game.html?returnFrom=dodgeball";
  }

  global.VoltzStandaloneDodgeball = Object.freeze({
    isStandalone,
    isLocked: () => locked,
    onExitBlocked,
    onMatchStarted,
    onMatchFinished,
    returnToWorld
  });

  global.history.replaceState({ dodgeballStandalone:true }, "", global.location.href);
  global.history.pushState({ dodgeballStandalone:true, guard:true }, "", global.location.href);
  global.addEventListener("popstate", () => {
    if (locked) {
      global.history.pushState({ dodgeballStandalone:true, guard:true }, "", global.location.href);
      onExitBlocked();
    } else {
      returnToWorld();
    }
  });

  global.addEventListener("beforeunload", (event) => {
    if (!locked || returning) return;
    event.preventDefault();
    event.returnValue = "";
  });

  const DODGEBALL_PRELOAD_SOURCES = Object.freeze([
    "assets/images/realms/physical-education/dodgeball/arena-bg.webp",
    "assets/images/realms/physical-education/dodgeball/arena-stands.webp",
    "assets/images/realms/physical-education/dodgeball/arena-floor.webp",
    "assets/images/realms/physical-education/dodgeball/arena-overlay.webp",
    "assets/images/realms/physical-education/dodgeball/ball-straight.webp",
    "assets/images/realms/physical-education/dodgeball/ball-curve.webp",
    "assets/images/realms/physical-education/dodgeball/ball-power.webp",
    "assets/images/realms/physical-education/dodgeball/ball-catch.webp",
    "assets/images/realms/physical-education/dodgeball/ball-bomb.webp",
    "assets/images/realms/physical-education/dodgeball/ball-trail.webp",
    "assets/images/realms/physical-education/dodgeball/impact-light.webp",
    "assets/images/realms/physical-education/dodgeball/impact-power.webp",
    "assets/images/realms/physical-education/dodgeball/soul-1.webp",
    "assets/images/realms/physical-education/dodgeball/soul-2.webp",
    "assets/images/realms/physical-education/dodgeball/soul-3.webp",
    "assets/images/rivals/capitao-rubro.png",
    "assets/images/rivals/capitao-rubro-ataque.png",
    "assets/images/rivals/capitao-rubro-fase2.png"
  ]);
  const dodgeballPreloadedImages = [];

  async function preloadDodgeballSprites() {
    setStatus("CARREGANDO ARENA · preparando sprites para evitar travadas...");
    const jobs = DODGEBALL_PRELOAD_SOURCES.map((src) => new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try { await image.decode?.(); } catch {}
        resolve();
      };
      image.onerror = resolve;
      image.src = src;
      dodgeballPreloadedImages.push(image);
    }));
    await Promise.race([
      Promise.allSettled(jobs),
      new Promise((resolve) => global.setTimeout(resolve, 3500))
    ]);
  }

  async function boot() {
    if (!hasReturnPoint()) {
      setStatus("MODO DE TESTE · duelo standalone sem ponto de retorno salvo");
    }

    const startedAt = performance.now();
    while (!global.VoltzSports && performance.now() - startedAt < 8000) {
      await new Promise((resolve) => global.setTimeout(resolve, 30));
    }
    if (!global.VoltzSports) {
      setStatus("ERRO · não foi possível carregar o motor da Queimada");
      return;
    }

    try { await global.VoltzProfile?.ready; } catch {}
    await preloadDodgeballSprites();
    document.getElementById("authGate")?.classList.add("hidden");
    global.VoltzSports.onSceneChanged?.("reino-educacao-fisica");
    global.VoltzSports.open("dodgeball");
    global.VoltzSports.start("dodgeball");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }
})(window);
