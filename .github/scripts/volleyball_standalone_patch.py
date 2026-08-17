from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
world_path = Path('assets/js/openworld.js')

sports = sports_path.read_text(encoding='utf-8')
world = world_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)

# Sports engine: standalone close guard.
old = '''    if (state.activeId === "dodgeball" && global.VoltzStandaloneDodgeball?.isStandalone?.()) {
'''
new = '''    if (state.activeId === "volleyball" && global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      if (state.current?.type === "volleyball") {
        global.VoltzStandaloneVolleyball?.onExitBlocked?.();
        return;
      }
      global.VoltzStandaloneVolleyball?.returnToWorld?.();
      return;
    }
    if (state.activeId === "dodgeball" && global.VoltzStandaloneDodgeball?.isStandalone?.()) {
'''
sports = replace_once(sports, old, new, 'volleyball close guard')

# Sports engine: standalone lifecycle starts locked on every replay.
old = '''  function startVolleyball() {
    const length = state.mode === "championship" ? 4 : 8;
'''
new = '''  function startVolleyball() {
    if (global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      global.VoltzStandaloneVolleyball?.onMatchStarted?.();
    }
    const length = state.mode === "championship" ? 4 : 8;
'''
sports = replace_once(sports, old, new, 'volleyball match start')

# Sports engine: unlock return after either success or failure.
old = '''    if (id === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      global.VoltzStandaloneFootball?.onMatchFinished?.({ success:Boolean(success) });
    }
    if (id === "dodgeball") {
'''
new = '''    if (id === "football" && global.VoltzStandaloneFootball?.isStandalone?.()) {
      global.VoltzStandaloneFootball?.onMatchFinished?.({ success:Boolean(success) });
    }
    if (id === "volleyball" && global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      global.VoltzStandaloneVolleyball?.onMatchFinished?.({ success:Boolean(success) });
    }
    if (id === "dodgeball") {
'''
sports = replace_once(sports, old, new, 'volleyball match finish')

# World dialogue: only the normal volleyball station leaves the world page.
old = '''        } else if (sportsMinigameId === "dodgeball" && window.VoltzStandaloneSportBridge?.enterDodgeball) {
          window.VoltzStandaloneSportBridge.enterDodgeball();
        } else {
'''
new = '''        } else if (sportsMinigameId === "dodgeball" && window.VoltzStandaloneSportBridge?.enterDodgeball) {
          window.VoltzStandaloneSportBridge.enterDodgeball();
        } else if (sportsMinigameId === "volleyball" && window.VoltzStandaloneSportBridge?.enterVolleyball) {
          window.VoltzStandaloneSportBridge.enterVolleyball();
        } else {
'''
world = replace_once(world, old, new, 'volleyball dialogue routing')

# World bridge: dedicated volleyball page.
old = '''function enterStandaloneDodgeball() {
  saveStandaloneSportReturnPoint("dodgeball");
  window.location.href = "dodgeball.html";
}

function restoreStandaloneSportReturnPoint() {
'''
new = '''function enterStandaloneDodgeball() {
  saveStandaloneSportReturnPoint("dodgeball");
  window.location.href = "dodgeball.html";
}

function enterStandaloneVolleyball() {
  saveStandaloneSportReturnPoint("volleyball");
  window.location.href = "volleyball.html";
}

function restoreStandaloneSportReturnPoint() {
'''
world = replace_once(world, old, new, 'volleyball bridge function')

old = '''  if (!["football", "dodgeball"].includes(returnFrom)) return false;
'''
new = '''  if (!["football", "dodgeball", "volleyball"].includes(returnFrom)) return false;
'''
world = replace_once(world, old, new, 'volleyball return allowlist')

old = '''  interactionText.textContent = returnFrom === "dodgeball"
    ? "Você voltou à Arena da Esquiva exatamente de onde entrou."
    : "Você voltou ao Campo das Decisões exatamente de onde entrou.";
'''
new = '''  interactionText.textContent = returnFrom === "dodgeball"
    ? "Você voltou à Arena da Esquiva exatamente de onde entrou."
    : returnFrom === "volleyball"
      ? "Você voltou à Quadra da Sequência exatamente de onde entrou."
      : "Você voltou ao Campo das Decisões exatamente de onde entrou.";
'''
world = replace_once(world, old, new, 'volleyball return message')

old = '''window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  enterDodgeball: enterStandaloneDodgeball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football"),
  captureDodgeballReturnPoint: () => saveStandaloneSportReturnPoint("dodgeball")
});
'''
new = '''window.VoltzStandaloneSportBridge = Object.freeze({
  enterFootball: enterStandaloneFootball,
  enterDodgeball: enterStandaloneDodgeball,
  enterVolleyball: enterStandaloneVolleyball,
  captureReturnPoint: () => saveStandaloneSportReturnPoint("football"),
  captureDodgeballReturnPoint: () => saveStandaloneSportReturnPoint("dodgeball"),
  captureVolleyballReturnPoint: () => saveStandaloneSportReturnPoint("volleyball")
});
'''
world = replace_once(world, old, new, 'volleyball bridge exports')

sports_path.write_text(sports, encoding='utf-8')
world_path.write_text(world, encoding='utf-8')
