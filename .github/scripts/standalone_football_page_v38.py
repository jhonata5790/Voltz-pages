from pathlib import Path

repo = Path('.')
openworld_path = repo / 'assets/js/openworld.js'
sports_path = repo / 'assets/js/realms/physical-education/sports-minigames.js'
openworld = openworld_path.read_text(encoding='utf-8')
sports = sports_path.read_text(encoding='utf-8')

# 1) O terminal de futebol passa a abrir a página standalone.
old_open = '''      if (sportsMinigameId) {\n        window.VoltzSports?.open?.(sportsMinigameId);\n      }'''
new_open = '''      if (sportsMinigameId) {\n        if (sportsMinigameId === "football" && window.VoltzStandaloneSportBridge?.enterFootball) {\n          window.VoltzStandaloneSportBridge.enterFootball();\n        } else {\n          window.VoltzSports?.open?.(sportsMinigameId);\n        }\n      }'''
assert old_open in openworld, 'sports minigame dialogue hook not found'
openworld = openworld.replace(old_open, new_open, 1)

# 2) Ponte do mundo: salva cena/posição/direção e restaura ao voltar.
bridge_marker = '// Standalone sport transition bridge · football page V3.8'
if bridge_marker not in openworld:
    openworld += r'''

// Standalone sport transition bridge · football page V3.8
const VOLTZ_STANDALONE_SPORT_RETURN_KEY = "voltz:standalone-sport:return";

function saveStandaloneSportReturnPoint(sportId) {
  if (!sportId || !currentScene?.id) return false;
  try {
    sessionStorage.setItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY, JSON.stringify({
      sportId,
      sceneId: currentScene.id,
      x: Number(playerState.x || 0),
      y: Number(playerState.y || 0),
      direction: playerState.direction || "baixo",
      playerScale: Number(playerState.scale || 1),
      cameraZoom: Number(cameraState.zoom || currentScene.cameraZoom || 1),
      savedAt: Date.now()
    }));
    return true;
  } catch (error) {
    console.warn("[SPORT] Não foi possível salvar o ponto de retorno:", error);
    return false;
  }
}

function enterStandaloneFootball() {
  saveStandaloneSportReturnPoint("football");
  window.location.href = "football.html";
}

function restoreStandaloneSportReturnPoint() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("returnFrom") !== "football") return false;

  let point = null;
  try {
    point = JSON.parse(sessionStorage.getItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY) || "null");
  } catch {}
  if (!point || point.sportId !== "football") return false;

  const targetScene = currentScene?.id === point.sceneId
    ? currentScene
    : getSceneForRealm(point.sceneId);
  if (!targetScene) return false;

  const spawn = {
    x: Number.isFinite(Number(point.x)) ? Number(point.x) : targetScene.spawn.x,
    y: Number.isFinite(Number(point.y)) ? Number(point.y) : targetScene.spawn.y
  };

  if (currentScene?.id !== targetScene.id) {
    changeScene(targetScene, {
      spawn,
      direction: point.direction || "baixo"
    });
  } else {
    playerState.x = spawn.x;
    playerState.y = spawn.y;
    playerState.direction = point.direction || "baixo";
    playerState.moving = false;
    if (Number.isFinite(Number(point.playerScale))) {
      playerState.scale = Number(point.playerScale);
      playerState.targetScale = Number(point.playerScale);
    }
    clampPlayer();
    updatePlayerPosition();
    updatePlayerAnimation();
  }

  if (Number.isFinite(Number(point.cameraZoom))) {
    cameraState.zoom = Number(point.cameraZoom);
    cameraState.targetZoom = Number(point.cameraZoom);
  }
  snapCameraToPlayer();
  updateOcclusionVisibility();
  updateNearbyNpc();
  updateNearbyPortal();
  updateNearbyEnemy();
  updateNearbyWorldEquation();
  updateHint();

  try { sessionStorage.removeItem(VOLTZ_STANDALONE_SPORT_RETURN_KEY); } catch {}
  url.searchParams.delete("returnFrom");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  interactionText.textContent = "Você voltou ao Campo das Decisões exatamente de onde entrou.";
  return true;
}

window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football")
});

window.addEventListener("load", () => {
  window.setTimeout(() => restoreStandaloneSportReturnPoint(), 0);
});
'''

# 3) Sports engine: bloqueia sair durante a partida standalone e devolve ao mundo no resultado.
old_close = '''  function close() {\n    if (state.activeId === "dodgeball" || state.current?.type === "dodgeball") stopDodgeballMusic(280);'''
new_close = '''  function close() {\n    if (state.activeId === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {\n      if (state.current?.type === "football" && state.current?.phase === "play") {\n        global.VoltzStandaloneFootball?.onExitBlocked?.();\n        return;\n      }\n      global.VoltzStandaloneFootball?.returnToWorld?.();\n      return;\n    }\n    if (state.activeId === "dodgeball" || state.current?.type === "dodgeball") stopDodgeballMusic(280);'''
assert old_close in sports, 'sports close() anchor not found'
sports = sports.replace(old_close, new_close, 1)

old_finish = '  async function finishSport(id, success, message) {\n'
new_finish = '''  async function finishSport(id, success, message) {\n    if (id === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {\n      global.VoltzStandaloneFootball?.onMatchFinished?.({ success:Boolean(success) });\n    }\n'''
assert old_finish in sports, 'finishSport anchor not found'
sports = sports.replace(old_finish, new_finish, 1)

openworld_path.write_text(openworld, encoding='utf-8')
sports_path.write_text(sports, encoding='utf-8')

# 4) Página standalone enxuta: sem openworld, battles, interiors ou outros reinos.
football_html = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voltz Education — Campo das Decisões</title>
  <link rel="stylesheet" href="assets/css/sports-minigames.css" />
  <link rel="stylesheet" href="assets/css/football/football-standalone.css" />
</head>
<body class="standalone-football-page">
  <div id="authGate" class="football-auth-gate" role="status" aria-live="polite">
    <div class="football-auth-card">
      <strong>⚡ CAMPO DAS DECISÕES</strong>
      <span id="authGateText">Preparando partida...</span>
    </div>
  </div>

  <div id="footballStandaloneStatus" class="football-standalone-status" aria-live="polite">
    PARTIDA EM ANDAMENTO · finalize a partida para retornar ao reino
  </div>

  <div id="sportsProgressHud" hidden></div>
  <div id="interactionText" hidden></div>

  <main id="sportsMinigamePanel" class="sports-minigame-panel football-standalone-panel" aria-hidden="true">
    <div id="sportsMinigameContent"></div>
  </main>

  <script type="module" src="assets/js/core/game-profile.js"></script>
  <script src="assets/js/core/audio-manager.js" defer></script>
  <script src="assets/js/realms/physical-education/sports-minigames.js" defer></script>
  <script src="assets/js/football/football-standalone.js" defer></script>
</body>
</html>
'''

football_css = r''':root { color-scheme: dark; }
* { box-sizing:border-box; }
html, body { width:100%; height:100%; margin:0; overflow:hidden; background:#030913; }
body.standalone-football-page {
  min-height:100vh;
  background:
    radial-gradient(circle at 50% 16%, rgba(69,163,255,.12), transparent 34%),
    linear-gradient(180deg,#06131d,#02060d 74%);
  color:#f5fbff;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
.football-auth-gate {
  position:fixed; inset:0; z-index:3000; display:grid; place-items:center;
  background:#02060d; transition:opacity .25s ease,visibility .25s ease;
}
.football-auth-gate.hidden { opacity:0; visibility:hidden; pointer-events:none; }
.football-auth-gate.auth-gate-error { color:#ffadb7; }
.football-auth-card {
  display:grid; gap:9px; min-width:min(420px,calc(100vw - 32px)); padding:24px;
  border:1px solid rgba(140,247,255,.22); border-radius:18px;
  background:rgba(7,17,27,.97); text-align:center;
  box-shadow:0 24px 80px rgba(0,0,0,.55);
}
.football-auth-card strong { color:#8cf7ff; letter-spacing:1.4px; }
.football-auth-card span { color:rgba(245,251,255,.66); font-size:.82rem; }
.football-standalone-status {
  position:fixed; z-index:1200; left:50%; top:8px; transform:translateX(-50%);
  padding:6px 12px; border-radius:999px; pointer-events:none;
  border:1px solid rgba(140,247,255,.16); background:rgba(3,10,18,.82);
  color:rgba(220,250,255,.68); font-size:.62rem; font-weight:900; letter-spacing:.7px;
}
.football-standalone-status.is-finished { color:#baffdf; border-color:rgba(99,245,181,.25); }
.football-standalone-panel.sports-minigame-panel {
  position:fixed !important; inset:0 !important; border:0 !important; border-radius:0 !important;
  overflow:hidden !important; background:transparent !important; box-shadow:none !important;
}
.football-standalone-panel .sports-game-shell {
  height:100vh; min-height:0; padding:20px 24px 18px; display:flex; flex-direction:column;
}
.football-standalone-panel .sports-game-topbar { flex:0 0 auto; margin-bottom:10px; }
.football-standalone-panel .sports-game-topbar .sports-close-btn { display:none !important; }
.football-standalone-panel .sports-game-subtitle { margin-top:3px; }
.football-standalone-panel .football-match-card {
  width:min(1500px,100%); max-width:none !important; flex:1 1 auto; min-height:0;
  display:flex; flex-direction:column; padding:14px 18px 12px;
}
.football-standalone-panel .football-field-live { flex:1 1 auto; min-height:420px; }
.football-standalone-panel .sports-result .sports-close-btn { display:inline-flex !important; }
@media(max-width:760px){
  .football-standalone-panel .sports-game-shell { padding:12px; }
  .football-standalone-panel .football-match-card { padding:10px; }
  .football-standalone-status { max-width:90vw; text-align:center; white-space:normal; }
}
'''

football_js = r'''(function initializeStandaloneFootball(global) {
  const RETURN_KEY = "voltz:standalone-sport:return";
  let locked = true;
  let returning = false;
  const status = document.getElementById("footballStandaloneStatus");

  function setStatus(message, finished = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-finished", finished);
  }

  function hasReturnPoint() {
    try {
      const point = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null");
      return Boolean(point && point.sportId === "football");
    } catch {
      return false;
    }
  }

  function isStandalone() { return true; }

  function onExitBlocked() {
    setStatus("PARTIDA EM ANDAMENTO · termine a partida antes de voltar ao reino");
    global.setTimeout(() => {
      if (locked) setStatus("PARTIDA EM ANDAMENTO · finalize a partida para retornar ao reino");
    }, 1700);
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
    global.location.href = "game.html?returnFrom=football";
  }

  global.VoltzStandaloneFootball = Object.freeze({
    isStandalone,
    isLocked: () => locked,
    onExitBlocked,
    onMatchFinished,
    returnToWorld
  });

  // O botão Voltar do navegador não abandona silenciosamente uma partida ativa.
  global.history.replaceState({ footballStandalone:true }, "", global.location.href);
  global.history.pushState({ footballStandalone:true, guard:true }, "", global.location.href);
  global.addEventListener("popstate", () => {
    if (locked) {
      global.history.pushState({ footballStandalone:true, guard:true }, "", global.location.href);
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
      // Acesso direto ainda funciona para teste; o retorno cai no game.html.
      setStatus("MODO DE TESTE · partida standalone sem ponto de retorno salvo");
    }

    const startedAt = performance.now();
    while (!global.VoltzSports && performance.now() - startedAt < 8000) {
      await new Promise((resolve) => global.setTimeout(resolve, 30));
    }
    if (!global.VoltzSports) {
      setStatus("ERRO · não foi possível carregar o motor do futebol");
      return;
    }

    try { await global.VoltzProfile?.ready; } catch {}
    document.getElementById("authGate")?.classList.add("hidden");
    global.VoltzSports.onSceneChanged?.("reino-educacao-fisica");
    global.VoltzSports.open("football");
    global.VoltzSports.start("football");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }
})(window);
'''

(repo / 'football.html').write_text(football_html, encoding='utf-8')
(repo / 'assets/css/football').mkdir(parents=True, exist_ok=True)
(repo / 'assets/css/football/football-standalone.css').write_text(football_css, encoding='utf-8')
(repo / 'assets/js/football').mkdir(parents=True, exist_ok=True)
(repo / 'assets/js/football/football-standalone.js').write_text(football_js, encoding='utf-8')
