(function initializeStandaloneVolleyball(global) {
  const RETURN_KEY = "voltz:standalone-sport:return";
  let locked = true;
  let returning = false;
  const status = document.getElementById("volleyballStandaloneStatus");

  function setStatus(message, finished = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-finished", finished);
  }

  function hasReturnPoint() {
    try {
      const point = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null");
      return Boolean(point && point.sportId === "volleyball");
    } catch {
      return false;
    }
  }

  function isStandalone() { return true; }

  function onExitBlocked() {
    setStatus("PARTIDA EM ANDAMENTO · termine o desafio antes de voltar ao reino");
    global.setTimeout(() => {
      if (locked) setStatus("PARTIDA EM ANDAMENTO · finalize o desafio para retornar ao reino");
    }, 1700);
  }

  function onMatchStarted() {
    locked = true;
    returning = false;
    setStatus("PARTIDA EM ANDAMENTO · finalize o desafio para retornar ao reino");
  }

  function onMatchFinished() {
    locked = false;
    setStatus("PARTIDA ENCERRADA · você já pode voltar ao reino", true);
  }

  function returnToWorld() {
    if (returning) return;
    if (locked) {
      onExitBlocked();
      return;
    }
    returning = true;
    global.location.href = "game.html?returnFrom=volleyball";
  }

  global.VoltzStandaloneVolleyball = Object.freeze({
    isStandalone,
    isLocked: () => locked,
    onExitBlocked,
    onMatchStarted,
    onMatchFinished,
    returnToWorld
  });

  global.history.replaceState({ volleyballStandalone:true }, "", global.location.href);
  global.history.pushState({ volleyballStandalone:true, guard:true }, "", global.location.href);
  global.addEventListener("popstate", () => {
    if (locked) {
      global.history.pushState({ volleyballStandalone:true, guard:true }, "", global.location.href);
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

  async function boot() {
    if (!hasReturnPoint()) {
      setStatus("MODO DE TESTE · vôlei standalone sem ponto de retorno salvo");
    }

    const startedAt = performance.now();
    while (!global.VoltzSports && performance.now() - startedAt < 8000) {
      await new Promise((resolve) => global.setTimeout(resolve, 30));
    }
    if (!global.VoltzSports) {
      setStatus("ERRO · não foi possível carregar o motor do Vôlei");
      return;
    }

    try { await global.VoltzProfile?.ready; } catch {}
    document.getElementById("authGate")?.classList.add("hidden");
    global.VoltzSports.onSceneChanged?.("reino-educacao-fisica");
    global.VoltzSports.open("volleyball");
    global.VoltzSports.start("volleyball");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }
})(window);
