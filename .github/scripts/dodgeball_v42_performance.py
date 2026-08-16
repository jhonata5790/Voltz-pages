from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
standalone_js_path = Path('assets/js/dodgeball/dodgeball-standalone.js')
standalone_css_path = Path('assets/css/dodgeball/dodgeball-standalone.css')

sports = sports_path.read_text(encoding='utf-8')
standalone_js = standalone_js_path.read_text(encoding='utf-8')
standalone_css = standalone_css_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)

# ------------------------------------------------------------
# 1) Limita a simulacao defensiva a ~60 updates/s em telas 120/144 Hz.
#    A fisica usa um relogio proprio, portanto o ritmo do jogo nao muda.
# ------------------------------------------------------------
old = '''      } else if (g.phase === "defense") {
        updateDodgeDefense(now, dt / 1000);
      }
'''
new = '''      } else if (g.phase === "defense") {
        const previousDefenseFrame = Number(g.lastDefenseFrameAt || now);
        const defenseElapsed = now - previousDefenseFrame;
        if (defenseElapsed >= 14) {
          g.lastDefenseFrameAt = now;
          updateDodgeDefense(now, Math.min(32, defenseElapsed) / 1000);
        }
      }
'''
sports = replace_once(sports, old, new, 'defense frame cap')

# ------------------------------------------------------------
# 2) Cache de DOM e tamanho da arena. ResizeObserver atualiza apenas quando
#    o layout realmente muda, eliminando getBoundingClientRect por frame.
# ------------------------------------------------------------
marker = '''  function renderDodgeDefense() {
'''
helpers = '''  // Queimada V4.2 · runtime de render otimizado.
  // A arena e seus elementos quentes ficam cacheados durante o turno de esquiva.
  function getDodgeDefenseDom(g) {
    if (!g) return null;
    if (g.dodgeDom?.arena?.isConnected) return g.dodgeDom;
    const arena = document.getElementById("dodgeArena");
    if (!arena) return null;
    g.dodgeDom = {
      arena,
      playerEl: document.getElementById("dodgePlayer"),
      timer: document.getElementById("dodgeTimer")
    };
    return g.dodgeDom;
  }

  function updateDodgeArenaMetrics(g, width, height) {
    if (!g || width <= 0 || height <= 0) return null;
    g.dodgeArenaMetrics = { width:Number(width), height:Number(height) };
    return g.dodgeArenaMetrics;
  }

  function getDodgeArenaMetrics(g, arena) {
    const cached = g?.dodgeArenaMetrics;
    if (cached?.width > 0 && cached?.height > 0) return cached;
    if (!arena) return null;
    const rect = arena.getBoundingClientRect();
    return updateDodgeArenaMetrics(g, rect.width, rect.height);
  }

  function prepareDodgeDefenseDom(g) {
    const dom = getDodgeDefenseDom(g);
    if (!dom?.arena) return null;

    g.dodgeResizeObserver?.disconnect?.();
    const rect = dom.arena.getBoundingClientRect();
    updateDodgeArenaMetrics(g, rect.width, rect.height);

    if (typeof global.ResizeObserver === "function") {
      const observer = new global.ResizeObserver((entries) => {
        const box = entries?.[0]?.contentRect;
        if (box) updateDodgeArenaMetrics(g, box.width, box.height);
      });
      observer.observe(dom.arena);
      g.dodgeResizeObserver = observer;
      state.cleanupFns.push(() => {
        observer.disconnect();
        if (g.dodgeResizeObserver === observer) g.dodgeResizeObserver = null;
      });
    }

    g.lastDefenseFrameAt = performance.now();
    return dom;
  }

  function getDodgeEnemyBallSprite(ball) {
    if (ball.catchable) return DODGEBALL_VISUALS.ballCatch;
    if (ball.style === "bomb") return DODGEBALL_VISUALS.ballBomb;
    if (ball.style === "power") return DODGEBALL_VISUALS.ballPower;
    if (ball.style === "curve") return DODGEBALL_VISUALS.ballCurve;
    return DODGEBALL_VISUALS.ballStraight;
  }

  function syncDodgeEnemyBallDom(ball, arena) {
    if (!ball || !arena) return null;
    if (!ball.el) {
      ball.el = document.createElement("div");
      ball.el.className = `dodge-ball rubro-ball rubro-ball-${ball.style}${ball.catchable ? " is-catchable" : ""}${ball.isRallyFinal ? " is-rally-final" : ""}`;
      ball.el.setAttribute("aria-hidden", "true");
      ball.el.style.left = "0px";
      ball.el.style.top = "0px";
      ball.domCatchable = Boolean(ball.catchable);
      ball.domCatchWindow = false;
      ball.domSprite = "";
      ball.domX = NaN;
      ball.domY = NaN;
      arena.appendChild(ball.el);
    }

    const catchable = Boolean(ball.catchable);
    if (ball.domCatchable !== catchable) {
      ball.el.classList.toggle("is-catchable", catchable);
      ball.domCatchable = catchable;
    }

    const sprite = getDodgeEnemyBallSprite(ball);
    if (ball.domSprite !== sprite) {
      ball.el.style.backgroundImage = `url("${sprite}")`;
      ball.domSprite = sprite;
    }

    // Individual transform property: move a textura na composicao sem disputar
    // o `transform` usado pelas animacoes de impacto/bomba.
    const x = Math.round((ball.x - 12) * 10) / 10;
    const y = Math.round((ball.y - 12) * 10) / 10;
    if (ball.domX !== x || ball.domY !== y) {
      if ("translate" in ball.el.style) {
        ball.el.style.translate = `${x}px ${y}px`;
      } else {
        ball.el.style.left = `${x}px`;
        ball.el.style.top = `${y}px`;
      }
      ball.domX = x;
      ball.domY = y;
    }
    return ball.el;
  }

'''
if marker not in sports:
    raise SystemExit('marker not found: dodge perf helpers')
sports = sports.replace(marker, helpers + marker, 1)

# ------------------------------------------------------------
# 3) Prepara cache assim que a arena de defesa nasce.
# ------------------------------------------------------------
old = '''    updateDodgePlayerDom();
  }

  function setRubroDefenseVisual(side = "center", action = "ready") {
'''
new = '''    prepareDodgeDefenseDom(g);
    updateDodgePlayerDom();
  }

  function setRubroDefenseVisual(side = "center", action = "ready") {
'''
sports = replace_once(sports, old, new, 'prepare defense dom')

# ------------------------------------------------------------
# 4) Remove leitura de layout por frame.
# ------------------------------------------------------------
old = '''  function updateDodgeDefense(now, dt) {
    const g = state.current;
    const arena = document.getElementById("dodgeArena");
    if (!arena || g.enemyAttackDone) return;
    const rect = arena.getBoundingClientRect();
'''
new = '''  function updateDodgeDefense(now, dt) {
    const g = state.current;
    const dom = getDodgeDefenseDom(g);
    const arena = dom?.arena;
    if (!arena || g.enemyAttackDone) return;
    const rect = getDodgeArenaMetrics(g, arena);
    if (!rect) return;
'''
sports = replace_once(sports, old, new, 'cached arena rect')

# ------------------------------------------------------------
# 5) Bolas: background/class somente quando muda + movimento por translate.
# ------------------------------------------------------------
old = '''      if (!ball.el) {
        ball.el = document.createElement("div");
        ball.el.className = `dodge-ball rubro-ball rubro-ball-${ball.style}${ball.catchable ? " is-catchable" : ""}${ball.isRallyFinal ? " is-rally-final" : ""}`;
        const enemySprite = ball.catchable
          ? DODGEBALL_VISUALS.ballCatch
          : ball.style === "bomb"
            ? DODGEBALL_VISUALS.ballBomb
            : ball.style === "power"
              ? DODGEBALL_VISUALS.ballPower
              : ball.style === "curve"
                ? DODGEBALL_VISUALS.ballCurve
                : DODGEBALL_VISUALS.ballStraight;
        ball.el.style.backgroundImage = `url("${enemySprite}")`;
        arena.appendChild(ball.el);
      }

      if (ball.catchable) {
        ball.el.classList.add("is-catchable");
        ball.el.style.backgroundImage = `url("${DODGEBALL_VISUALS.ballCatch}")`;
      }
      ball.el.style.left = `${ball.x - 12}px`;
      ball.el.style.top = `${ball.y - 12}px`;

      const catchDistance = Math.hypot(ball.x - playerX, ball.y - playerY);
      const catchWindowActive = ball.catchable && catchDistance <= DODGE_CATCH_DISTANCE && catchDistance > 22;
      ball.el.classList.toggle("catch-window", catchWindowActive);
'''
new = '''      syncDodgeEnemyBallDom(ball, arena);

      const catchDistance = Math.hypot(ball.x - playerX, ball.y - playerY);
      const catchWindowActive = ball.catchable && catchDistance <= DODGE_CATCH_DISTANCE && catchDistance > 22;
      if (ball.domCatchWindow !== catchWindowActive) {
        ball.el.classList.toggle("catch-window", catchWindowActive);
        ball.domCatchWindow = catchWindowActive;
      }
'''
sports = replace_once(sports, old, new, 'changed only ball dom')

# ------------------------------------------------------------
# 6) Jogador/timer: cache + changed-only writes.
# ------------------------------------------------------------
old = '''    const playerEl = document.getElementById("dodgePlayer");
    if (playerEl) playerEl.classList.toggle("invulnerable", now < g.player.invulnerableUntil);

    const timer = document.getElementById("dodgeTimer");
    const catchableInRange = g.balls.some((ball) => {
      if (!ball.catchable) return false;
      const distance = Math.hypot(ball.x - playerX, ball.y - playerY);
      return distance <= DODGE_CATCH_DISTANCE;
    });

    playerEl?.classList.toggle("dodge-catch-ready", catchableInRange || now <= g.catchBufferedUntil);
    if (timer && !timer.textContent.includes("AGARROU") && !timer.textContent.includes("PERFECT")) {
      timer.textContent = catchableInRange
        ? (g.rallyActive ? "ÚLTIMA BOLA · AGARRA! [ESPAÇO]" : "AGARRA! [ESPAÇO]")
        : `${g.activePattern?.label || "Esquiva"} · padrão em andamento`;
    }
'''
new = '''    const playerEl = dom?.playerEl;
    const invulnerable = now < g.player.invulnerableUntil;
    if (playerEl && g.dodgeDomInvulnerable !== invulnerable) {
      playerEl.classList.toggle("invulnerable", invulnerable);
      g.dodgeDomInvulnerable = invulnerable;
    }

    const timer = dom?.timer;
    const catchableInRange = g.balls.some((ball) => {
      if (!ball.catchable) return false;
      const distance = Math.hypot(ball.x - playerX, ball.y - playerY);
      return distance <= DODGE_CATCH_DISTANCE;
    });

    const catchReady = catchableInRange || now <= g.catchBufferedUntil;
    if (playerEl && g.dodgeDomCatchReady !== catchReady) {
      playerEl.classList.toggle("dodge-catch-ready", catchReady);
      g.dodgeDomCatchReady = catchReady;
    }
    if (timer && !timer.textContent.includes("AGARROU") && !timer.textContent.includes("PERFECT")) {
      const nextTimerText = catchableInRange
        ? (g.rallyActive ? "ÚLTIMA BOLA · AGARRA! [ESPAÇO]" : "AGARRA! [ESPAÇO]")
        : `${g.activePattern?.label || "Esquiva"} · padrão em andamento`;
      if (timer.textContent !== nextTimerText) timer.textContent = nextTimerText;
    }
'''
sports = replace_once(sports, old, new, 'changed only player timer')

# ------------------------------------------------------------
# 7) Jogador: translate em vez de left/top a cada frame.
# ------------------------------------------------------------
old = '''  function updateDodgePlayerDom() {
    const g = state.current;
    const el = document.getElementById("dodgePlayer");
    if (!g || !el) return;
    el.style.left = `calc(${g.player.x}% - 15px)`;
    el.style.top = `calc(${g.player.y}% - 15px)`;
  }
'''
new = '''  function updateDodgePlayerDom() {
    const g = state.current;
    const dom = getDodgeDefenseDom(g);
    const el = dom?.playerEl;
    const arena = dom?.arena;
    if (!g || !el || !arena) return;
    const rect = getDodgeArenaMetrics(g, arena);
    if (!rect) return;

    const x = Math.round((rect.width * g.player.x / 100 - 15) * 10) / 10;
    const y = Math.round((rect.height * g.player.y / 100 - 15) * 10) / 10;
    if (g.dodgePlayerDomX === x && g.dodgePlayerDomY === y) return;

    if ("translate" in el.style) {
      if (!g.dodgePlayerTranslatePrepared) {
        el.style.left = "0px";
        el.style.top = "0px";
        g.dodgePlayerTranslatePrepared = true;
      }
      el.style.translate = `${x}px ${y}px`;
    } else {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
    g.dodgePlayerDomX = x;
    g.dodgePlayerDomY = y;
  }
'''
sports = replace_once(sports, old, new, 'player compositor movement')

# ------------------------------------------------------------
# 8) Chuva vertical: evita left/top no elemento que cai.
# ------------------------------------------------------------
old = '''      if (drop.ballEl) {
        drop.ballEl.style.left = `${drop.x}px`;
        drop.ballEl.style.top = `${drop.y - height}px`;
        drop.ballEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
      }
'''
new = '''      if (drop.ballEl) {
        const dropY = drop.y - height;
        if ("translate" in drop.ballEl.style) {
          if (!drop.translatePrepared) {
            drop.ballEl.style.left = "0px";
            drop.ballEl.style.top = "0px";
            drop.translatePrepared = true;
          }
          drop.ballEl.style.translate = `${Math.round(drop.x * 10) / 10}px ${Math.round(dropY * 10) / 10}px`;
          drop.ballEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
        } else {
          drop.ballEl.style.left = `${drop.x}px`;
          drop.ballEl.style.top = `${dropY}px`;
          drop.ballEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
        }
      }
'''
sports = replace_once(sports, old, new, 'falling ball compositor movement')

# ------------------------------------------------------------
# 9) Pre-decode dos sprites na pagina standalone para evitar engasgos quando
#    uma pose/padrao aparece pela primeira vez.
# ------------------------------------------------------------
boot_marker = '''  async function boot() {
'''
preloader = '''  const DODGEBALL_PRELOAD_SOURCES = Object.freeze([
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

'''
if boot_marker not in standalone_js:
    raise SystemExit('marker not found: standalone boot')
standalone_js = standalone_js.replace(boot_marker, preloader + boot_marker, 1)

old = '''    try { await global.VoltzProfile?.ready; } catch {}
    document.getElementById("authGate")?.classList.add("hidden");
'''
new = '''    try { await global.VoltzProfile?.ready; } catch {}
    await preloadDodgeballSprites();
    document.getElementById("authGate")?.classList.add("hidden");
'''
standalone_js = replace_once(standalone_js, old, new, 'await sprite preload')

# ------------------------------------------------------------
# 10) CSS: isola a arena e congela apenas o filtro gigante do overlay durante
#     esquiva. A imagem/cores permanecem; para de recalcular brightness em tela cheia.
# ------------------------------------------------------------
perf_css = r'''

/* Queimada V4.2 · caminho de render leve para a pagina standalone. */
.dodgeball-standalone-panel .dodgeball-arena {
  contain: paint style;
  isolation: isolate;
}
.dodgeball-standalone-panel .dodge-player,
.dodgeball-standalone-panel .dodge-ball,
.dodgeball-standalone-panel .dodge-falling-ball {
  will-change: translate;
}
.dodgeball-standalone-panel .dodgeball-rival-image {
  will-change: transform, filter;
}
/* O pulso continua nos menus. Durante a chuva de projeteis, a camada fica no
   ponto medio visual para nao aplicar brightness a uma textura grande por frame. */
.dodgeball-standalone-panel .dodgeball-shell-v3.phase-defense .dodgeball-scene-layer.layer-overlay {
  animation: none !important;
  opacity: .42 !important;
  filter: brightness(.98) !important;
}
'''
if 'Queimada V4.2 · caminho de render leve' not in standalone_css:
    standalone_css += perf_css

sports_path.write_text(sports, encoding='utf-8')
standalone_js_path.write_text(standalone_js, encoding='utf-8')
standalone_css_path.write_text(standalone_css, encoding='utf-8')
print('Queimada V4.2 performance patch applied')
