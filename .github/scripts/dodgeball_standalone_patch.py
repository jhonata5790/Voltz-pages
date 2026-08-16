from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
world_path = Path('assets/js/openworld.js')

sports = sports_path.read_text(encoding='utf-8')
world = world_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)

# ------------------------------------------------------------
# Sports engine: standalone Dodgeball lifecycle.
# ------------------------------------------------------------
old = '''    if (state.activeId === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      if (state.current?.type === "football" && state.current?.phase === "play") {
        global.VoltzStandaloneFootball?.onExitBlocked?.();
        return;
      }
      global.VoltzStandaloneFootball?.returnToWorld?.();
      return;
    }
    if (state.activeId === "dodgeball" || state.current?.type === "dodgeball") stopDodgeballMusic(280);
'''
new = '''    if (state.activeId === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      if (state.current?.type === "football" && state.current?.phase === "play") {
        global.VoltzStandaloneFootball?.onExitBlocked?.();
        return;
      }
      global.VoltzStandaloneFootball?.returnToWorld?.();
      return;
    }
    if (state.activeId === "dodgeball" && global.VoltzStandaloneDodgeball?.isStandalone?.()) {
      if (state.current?.type === "dodgeball") {
        global.VoltzStandaloneDodgeball?.onExitBlocked?.();
        return;
      }
      global.VoltzStandaloneDodgeball?.returnToWorld?.();
      return;
    }
    if (state.activeId === "dodgeball" || state.current?.type === "dodgeball") stopDodgeballMusic(280);
'''
sports = replace_once(sports, old, new, 'standalone close routing')

old = '''    if (id === "dodgeball") {
      sportSfx(success ? "victory" : "failure");
'''
new = '''    if (id === "dodgeball") {
      if (global.VoltzStandaloneDodgeball?.isStandalone?.()) {
        global.VoltzStandaloneDodgeball?.onMatchFinished?.({ success:Boolean(success) });
      }
      sportSfx(success ? "victory" : "failure");
'''
sports = replace_once(sports, old, new, 'dodgeball finish hook')

old = '''  function startDodgeball() {
    playDodgeballMusic(state.mode === "championship" ? .72 : .56);
'''
new = '''  function startDodgeball() {
    if (global.VoltzStandaloneDodgeball?.isStandalone?.()) {
      global.VoltzStandaloneDodgeball?.onMatchStarted?.();
    }
    playDodgeballMusic(state.mode === "championship" ? .72 : .56);
'''
sports = replace_once(sports, old, new, 'dodgeball start hook')

sports_path.write_text(sports, encoding='utf-8')

# ------------------------------------------------------------
# Open world bridge: normal station redirects; Pentathlon stays inline.
# ------------------------------------------------------------
old = '''      if (sportsMinigameId) {
        if (sportsMinigameId === "football" && window.VoltzStandaloneSportBridge?.enterFootball) {
          window.VoltzStandaloneSportBridge.enterFootball();
        } else {
          window.VoltzSports?.open?.(sportsMinigameId);
        }
      }
'''
new = '''      if (sportsMinigameId) {
        if (sportsMinigameId === "football" && window.VoltzStandaloneSportBridge?.enterFootball) {
          window.VoltzStandaloneSportBridge.enterFootball();
        } else if (sportsMinigameId === "dodgeball" && window.VoltzStandaloneSportBridge?.enterDodgeball) {
          window.VoltzStandaloneSportBridge.enterDodgeball();
        } else {
          window.VoltzSports?.open?.(sportsMinigameId);
        }
      }
'''
world = replace_once(world, old, new, 'station standalone routing')

world = replace_once(
    world,
    '// Standalone sport transition bridge · football page V3.8',
    '// Standalone sport transition bridge · dedicated sport pages',
    'bridge comment'
)

old = '''function enterStandaloneFootball() {
  saveStandaloneSportReturnPoint("football");
  window.location.href = "football.html";
}

function restoreStandaloneSportReturnPoint() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("returnFrom") !== "football") return false;

  let point = null;
'''
new = '''function enterStandaloneFootball() {
  saveStandaloneSportReturnPoint("football");
  window.location.href = "football.html";
}

function enterStandaloneDodgeball() {
  saveStandaloneSportReturnPoint("dodgeball");
  window.location.href = "dodgeball.html";
}

function restoreStandaloneSportReturnPoint() {
  const url = new URL(window.location.href);
  const returnFrom = url.searchParams.get("returnFrom");
  if (!["football", "dodgeball"].includes(returnFrom)) return false;

  let point = null;
'''
world = replace_once(world, old, new, 'generic restore entry')

world = replace_once(
    world,
    '  if (!point || point.sportId !== "football") return false;',
    '  if (!point || point.sportId !== returnFrom) return false;',
    'generic return point validation'
)

old = '''  url.searchParams.delete("returnFrom");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  interactionText.textContent = "Você voltou ao Campo das Decisões exatamente de onde entrou.";
  return true;
}

window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football")
});
'''
new = '''  url.searchParams.delete("returnFrom");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  interactionText.textContent = returnFrom === "dodgeball"
    ? "Você voltou à Arena da Esquiva exatamente de onde entrou."
    : "Você voltou ao Campo das Decisões exatamente de onde entrou.";
  return true;
}

window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  enterDodgeball: enterStandaloneDodgeball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football"),
  captureDodgeballReturnPoint: () => saveStandaloneSportReturnPoint("dodgeball")
});
'''
world = replace_once(world, old, new, 'bridge exports and message')

world_path.write_text(world, encoding='utf-8')
print('Dodgeball standalone patch applied')
