from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
game_path = Path('game.html')
volley_html_path = Path('volleyball.html')
volley_css_path = Path('assets/css/volleyball/volleyball-standalone.css')

sports = sports_path.read_text(encoding='utf-8')
game = game_path.read_text(encoding='utf-8')
volley_html = volley_html_path.read_text(encoding='utf-8')
css = volley_css_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)

# 1) Fallback de roteamento: mesmo que o fluxo do NPC caia em VoltzSports.open,
# o modo normal do volei entra na pagina dedicada. Championship continua inline.
old = '''  function open(id) {
    if (!panel || !content) return;
    clearRuntime();
'''
new = '''  function open(id) {
    if (!panel || !content) return;
    if (
      id === "volleyball" &&
      !global.VoltzStandaloneVolleyball?.isStandalone?.() &&
      global.VoltzStandaloneSportBridge?.enterVolleyball
    ) {
      global.VoltzStandaloneSportBridge.enterVolleyball();
      return;
    }
    clearRuntime();
'''
sports = replace_once(sports, old, new, 'volleyball open fallback')

# 2) Atualiza texto da introducao para o prototipo real.
sports = sports.replace(
    'volleyball: "Uma sequência de comandos representa recepção, levantamento e ataque. Pressione cada tecla antes do tempo acabar.",',
    'volleyball: "Construa a jogada em três toques: mova a recepção com WASD, use J no contato, escolha o levantamento com A/S/D e ataque no tempo certo.",',
    1
)

# 3) Insere o primeiro loop jogavel antes do minigame legado.
marker = '''  function startVolleyball() {
'''
prototype = r'''  // Volei V0.2 · primeiro prototipo jogavel real.
  // O modo normal standalone usa Recepcao -> Levantamento -> Ataque.
  // O Pentatlo continua no minigame curto legado por enquanto.
  const VOLLEY_LANES = Object.freeze({
    a: { id:"left", label:"ESQUERDA", x:27 },
    s: { id:"middle", label:"MEIO", x:50 },
    d: { id:"right", label:"DIREITA", x:73 }
  });

  function volleyballLaneFromKey(key) {
    return VOLLEY_LANES[String(key || "").toLowerCase()] || null;
  }

  function getVolleyballPrototypeDom() {
    return {
      court: document.getElementById("volleyballPrototypeCourt"),
      receiver: document.getElementById("volleyballReceiver"),
      ball: document.getElementById("volleyballPrototypeBall"),
      target: document.getElementById("volleyballReceiveTarget"),
      blocker: document.getElementById("volleyballBlocker"),
      phase: document.getElementById("volleyballPrototypePhase"),
      instruction: document.getElementById("volleyballPrototypeInstruction"),
      feedback: document.getElementById("volleyballPrototypeFeedback"),
      score: document.getElementById("volleyballPrototypeScore"),
      setLane: document.getElementById("volleyballSetLane"),
      attackLane: document.getElementById("volleyballAttackLane"),
      meter: document.getElementById("volleyballAttackCursor")
    };
  }

  function volleyballPhaseCopy(g) {
    if (g.phase === "reception") return {
      label:"1º TOQUE · RECEPÇÃO",
      instruction:"WASD / Setas para chegar sob a bola · J para fazer a manchete no contato."
    };
    if (g.phase === "set") return {
      label:"2º TOQUE · LEVANTAMENTO",
      instruction:"Escolha rápido: A = esquerda · S = meio · D = direita."
    };
    if (g.phase === "attack") return {
      label:"3º TOQUE · ATAQUE",
      instruction:"A/S/D escolhe a direção · J corta perto do topo do salto. Leia o bloqueio."
    };
    return { label:"RALLY", instruction:"Prepare a próxima bola." };
  }

  function renderVolleyballPrototype() {
    const g = state.current;
    if (!g?.prototype) return;
    openPanelShell(
      "🏐 Vôlei · Três Toques",
      "Quadra da Sequência",
      "Receba, construa e finalize. Cada toque muda as opções do próximo.",
      `<div class="sports-game-card volleyball-prototype-card">
        <div class="volleyball-prototype-score" id="volleyballPrototypeScore">
          <span>VOLTZ <b>${g.score}</b></span>
          <strong>PRIMEIRO A 3</strong>
          <span>VISITANTE <b>${g.rivalScore}</b></span>
        </div>
        <div class="volleyball-prototype-phase" id="volleyballPrototypePhase"></div>
        <div class="volleyball-prototype-court" id="volleyballPrototypeCourt">
          <div class="volleyball-court-line line-center"></div>
          <div class="volleyball-net"></div>
          <div class="volleyball-team-label rival">VISITANTE</div>
          <div class="volleyball-team-label voltz">VOLTZ</div>

          <div class="volleyball-player rival-player rival-left" aria-hidden="true"></div>
          <div class="volleyball-player rival-player rival-right" aria-hidden="true"></div>
          <div class="volleyball-player rival-player rival-blocker" id="volleyballBlocker" aria-label="Bloqueador adversário"></div>

          <div class="volleyball-player teammate-player mate-left" aria-hidden="true"></div>
          <div class="volleyball-player teammate-player mate-right" aria-hidden="true"></div>
          <div class="volleyball-player teammate-player active" id="volleyballReceiver" aria-label="Jogador controlado"></div>

          <div class="volleyball-receive-target" id="volleyballReceiveTarget"></div>
          <div class="volleyball-prototype-ball" id="volleyballPrototypeBall">🏐</div>
        </div>

        <div class="volleyball-prototype-controls">
          <div class="volleyball-control-copy" id="volleyballPrototypeInstruction"></div>
          <div class="volleyball-lane-readout">
            <span>LEVANTAMENTO <b id="volleyballSetLane">—</b></span>
            <span>ATAQUE <b id="volleyballAttackLane">—</b></span>
          </div>
          <div class="volleyball-attack-meter" aria-label="Tempo do ataque">
            <div class="volleyball-attack-perfect"></div>
            <div class="volleyball-attack-cursor" id="volleyballAttackCursor"></div>
          </div>
          <div class="sports-feedback" id="volleyballPrototypeFeedback">${escapeHtml(g.message || "Prepare a recepção.")}</div>
          <div class="sports-help">Protótipo V0.2 · habilidades especiais entram depois que o toque básico estiver gostoso.</div>
        </div>
      </div>`
    );
    syncVolleyballPrototypeDom(performance.now());
  }

  function beginVolleyballReception(g, message = "Leia a trajetória e chegue embaixo da bola.") {
    const now = performance.now();
    g.phase = "reception";
    g.phaseStartedAt = now;
    g.phaseDuration = 1850;
    g.receiver.x = 50;
    g.receiver.y = 82;
    g.receiveTarget = {
      x: 22 + Math.random() * 56,
      y: 72 + Math.random() * 14
    };
    g.ball = {
      startX: 26 + Math.random() * 48,
      startY: 10,
      x: 50,
      y: 10
    };
    g.receptionQuality = 0;
    g.setLane = null;
    g.attackLane = null;
    g.blockLane = null;
    g.attackCursor = 0;
    g.message = message;
    renderVolleyballPrototype();
  }

  function volleyballPrototypePoint(g, team, message) {
    if (!g?.prototype || g.phase === "rally-result") return;
    if (team === "voltz") g.score += 1;
    else g.rivalScore += 1;
    g.phase = "rally-result";
    g.phaseStartedAt = performance.now();
    g.lockUntil = g.phaseStartedAt + 780;
    g.message = message;
    sportSfx(team === "voltz" ? "success" : "failure");
    syncVolleyballPrototypeDom(g.phaseStartedAt);
  }

  function volleyballReceptionAction() {
    const g = state.current;
    if (!g?.prototype || g.phase !== "reception") return;
    const now = performance.now();
    const progress = clamp((now - g.phaseStartedAt) / g.phaseDuration, 0, 1.2);
    const distance = Math.hypot(g.receiver.x - g.receiveTarget.x, g.receiver.y - g.receiveTarget.y);
    const timingQuality = clamp(1 - Math.abs(progress - .92) / .28, 0, 1);
    const positionQuality = clamp(1 - distance / 19, 0, 1);
    const quality = timingQuality * .52 + positionQuality * .48;

    if (progress < .60 || quality < .34) {
      volleyballPrototypePoint(g, "rival", distance > 16
        ? "Você não chegou embaixo da bola. Ponto visitante."
        : "Contato fora do tempo. Ponto visitante.");
      return;
    }

    g.receptionQuality = quality;
    g.phase = "set";
    g.phaseStartedAt = now;
    g.phaseDuration = 1800;
    g.ball.x = g.receiver.x;
    g.ball.y = g.receiver.y - 4;
    g.message = quality >= .82
      ? "Recepção perfeita! O levantador tem todas as opções."
      : quality >= .58
        ? "Boa recepção. Escolha onde montar o ataque."
        : "Recepção quebrada, mas a bola ficou viva. Decida rápido.";
    syncVolleyballPrototypeDom(now);
  }

  function volleyballPrototypeDirection(key) {
    const g = state.current;
    if (!g?.prototype) return;
    const lane = volleyballLaneFromKey(key);
    if (!lane) return;

    if (g.phase === "set") {
      g.setLane = lane;
      g.phase = "attack";
      g.phaseStartedAt = performance.now();
      g.phaseDuration = 1450;
      g.attackLane = lane;
      const blockOptions = Object.values(VOLLEY_LANES);
      const readChance = g.receptionQuality >= .78 ? .56 : .40;
      g.blockLane = Math.random() < readChance
        ? lane
        : blockOptions[Math.floor(Math.random() * blockOptions.length)];
      g.message = `Levantamento para ${lane.label.toLowerCase()}. Leia o bloqueio e escolha onde bater.`;
      syncVolleyballPrototypeDom(g.phaseStartedAt);
      return;
    }

    if (g.phase === "attack") {
      g.attackLane = lane;
      g.message = `Ataque mirando ${lane.label.toLowerCase()}. Agora acerte o tempo com J.`;
      syncVolleyballPrototypeDom(performance.now());
    }
  }

  function volleyballAttackAction() {
    const g = state.current;
    if (!g?.prototype || g.phase !== "attack") return;
    const lane = g.attackLane || g.setLane || VOLLEY_LANES.s;
    const cursor = Number(g.attackCursor || 0);
    const timingQuality = clamp(1 - Math.abs(cursor - 82) / 42, 0, 1);
    const blockMatched = g.blockLane?.id === lane.id;
    const receptionBonus = g.receptionQuality * .18;
    const attackPower = timingQuality + receptionBonus;

    if (timingQuality < .28) {
      volleyballPrototypePoint(g, "rival", "Você pegou a bola fora do topo do salto. Ponto visitante.");
      return;
    }

    if (blockMatched && attackPower < 1.02) {
      volleyballPrototypePoint(g, "rival", `O bloqueio fechou ${lane.label.toLowerCase()}. Sua cortada voltou.`);
      return;
    }

    const perfect = timingQuality >= .86;
    volleyballPrototypePoint(
      g,
      "voltz",
      blockMatched
        ? "NO TOPO! Você explorou o bloqueio mesmo com a linha fechada."
        : perfect
          ? "Cortada limpa no ponto mais alto. PONTO VOLTZ!"
          : `Você encontrou o espaço em ${lane.label.toLowerCase()}. PONTO VOLTZ!`
    );
  }

  function volleyballPrototypeAction() {
    const g = state.current;
    if (!g?.prototype) return;
    if (g.phase === "reception") volleyballReceptionAction();
    else if (g.phase === "attack") volleyballAttackAction();
  }

  function syncVolleyballPrototypeDom(now) {
    const g = state.current;
    if (!g?.prototype) return;
    const dom = getVolleyballPrototypeDom();
    if (!dom.court) return;
    const copy = volleyballPhaseCopy(g);
    if (dom.phase) dom.phase.textContent = copy.label;
    if (dom.instruction) dom.instruction.textContent = copy.instruction;
    if (dom.feedback && dom.feedback.textContent !== g.message) dom.feedback.textContent = g.message || "";
    if (dom.score) dom.score.innerHTML = `<span>VOLTZ <b>${g.score}</b></span><strong>PRIMEIRO A 3</strong><span>VISITANTE <b>${g.rivalScore}</b></span>`;
    if (dom.setLane) dom.setLane.textContent = g.setLane?.label || "—";
    if (dom.attackLane) dom.attackLane.textContent = g.attackLane?.label || "—";

    if (dom.receiver) {
      dom.receiver.style.left = `${g.receiver.x}%`;
      dom.receiver.style.top = `${g.receiver.y}%`;
      dom.receiver.classList.toggle("is-setting", g.phase === "set");
      dom.receiver.classList.toggle("is-attacking", g.phase === "attack");
    }
    if (dom.target) {
      dom.target.style.left = `${g.receiveTarget?.x ?? 50}%`;
      dom.target.style.top = `${g.receiveTarget?.y ?? 80}%`;
      dom.target.classList.toggle("visible", g.phase === "reception");
    }
    if (dom.ball) {
      dom.ball.style.left = `${g.ball?.x ?? 50}%`;
      dom.ball.style.top = `${g.ball?.y ?? 50}%`;
      dom.ball.classList.toggle("is-attack", g.phase === "attack");
    }
    if (dom.blocker) {
      const blockX = g.blockLane?.x ?? 50;
      dom.blocker.style.left = `${blockX}%`;
      dom.blocker.classList.toggle("reading", g.phase === "attack");
    }
    if (dom.meter) {
      dom.meter.style.left = `${clamp(Number(g.attackCursor || 0), 0, 100)}%`;
      dom.meter.parentElement?.classList.toggle("visible", g.phase === "attack");
    }
  }

  function updateVolleyballPrototype(now, dt) {
    const g = state.current;
    if (!g?.prototype) return;

    if (g.phase === "rally-result") {
      if (now >= g.lockUntil) {
        if (g.score >= g.targetScore) {
          finishSport("volleyball", true, `Vitória ${g.score}x${g.rivalScore}. Você conectou recepção, levantamento e ataque.`);
          return;
        }
        if (g.rivalScore >= g.targetScore) {
          finishSport("volleyball", false, `Derrota ${g.score}x${g.rivalScore}. A sequência quebrou antes do ataque.`);
          return;
        }
        beginVolleyballReception(g, "Nova bola. Leia primeiro, corra depois.");
      }
      return;
    }

    if (g.phase === "reception") {
      const speed = 38;
      let dx = 0, dy = 0;
      if (state.pressed.has("a") || state.pressed.has("arrowleft")) dx -= 1;
      if (state.pressed.has("d") || state.pressed.has("arrowright")) dx += 1;
      if (state.pressed.has("w") || state.pressed.has("arrowup")) dy -= 1;
      if (state.pressed.has("s") || state.pressed.has("arrowdown")) dy += 1;
      if (dx && dy) { dx *= .70710678; dy *= .70710678; }
      g.receiver.x = clamp(g.receiver.x + dx * speed * dt, 10, 90);
      g.receiver.y = clamp(g.receiver.y + dy * speed * dt, 58, 91);

      const progress = clamp((now - g.phaseStartedAt) / g.phaseDuration, 0, 1.15);
      const eased = 1 - Math.pow(1 - clamp(progress, 0, 1), 2);
      g.ball.x = g.ball.startX + (g.receiveTarget.x - g.ball.startX) * eased;
      g.ball.y = g.ball.startY + (g.receiveTarget.y - g.ball.startY) * eased;
      if (progress >= 1.04) {
        volleyballPrototypePoint(g, "rival", "A bola caiu sem recepção. Ponto visitante.");
      }
    } else if (g.phase === "set") {
      const elapsed = now - g.phaseStartedAt;
      g.ball.x += (50 - g.ball.x) * Math.min(1, dt * 5.4);
      g.ball.y += (54 - g.ball.y) * Math.min(1, dt * 5.4);
      if (elapsed >= g.phaseDuration) volleyballPrototypePoint(g, "rival", "A jogada morreu sem levantamento. Ponto visitante.");
    } else if (g.phase === "attack") {
      const progress = clamp((now - g.phaseStartedAt) / g.phaseDuration, 0, 1.15);
      g.attackCursor = clamp(progress * 100, 0, 100);
      const targetX = g.setLane?.x ?? 50;
      g.ball.x += (targetX - g.ball.x) * Math.min(1, dt * 7.2);
      g.ball.y += (48 - g.ball.y) * Math.min(1, dt * 7.2);
      if (progress >= 1.04) volleyballPrototypePoint(g, "rival", "Você deixou o levantamento cair. Ponto visitante.");
    }

    syncVolleyballPrototypeDom(now);
  }

  function startVolleyballPrototype() {
    global.VoltzStandaloneVolleyball?.onMatchStarted?.();
    sportSfx("whistle");
    state.current = {
      type:"volleyball",
      prototype:true,
      phase:"reception",
      score:0,
      rivalScore:0,
      targetScore:3,
      receiver:{ x:50, y:82 },
      receiveTarget:{ x:50, y:80 },
      ball:{ startX:50, startY:10, x:50, y:10 },
      receptionQuality:0,
      setLane:null,
      attackLane:null,
      blockLane:null,
      attackCursor:0,
      phaseStartedAt:performance.now(),
      phaseDuration:1850,
      lockUntil:0,
      message:"Prepare a recepção."
    };
    beginVolleyballReception(state.current);

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || !state.current?.prototype || state.current?.type !== "volleyball") return;
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      updateVolleyballPrototype(now, dt);
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

'''
if marker not in sports:
    raise SystemExit('marker not found: startVolleyball')
sports = sports.replace(marker, prototype + marker, 1)

# 4) Normal standalone usa prototipo; campeonato continua legado.
old = '''  function startVolleyball() {
    if (global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      global.VoltzStandaloneVolleyball?.onMatchStarted?.();
    }
    const length = state.mode === "championship" ? 4 : 8;
'''
new = '''  function startVolleyball() {
    if (state.mode !== "championship" && global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      startVolleyballPrototype();
      return;
    }
    if (global.VoltzStandaloneVolleyball?.isStandalone?.()) {
      global.VoltzStandaloneVolleyball?.onMatchStarted?.();
    }
    const length = state.mode === "championship" ? 4 : 8;
'''
sports = replace_once(sports, old, new, 'start prototype branch')

# 5) Teclado: prototipo usa WASD para movimento, A/S/D para decisoes e J para contato.
old = '''    if (game.type === "athletics" && ["a","d"].includes(key)) athleticsStep(key);
    if (game.type === "volleyball" && ["a","s","d"].includes(key)) volleyballInput(key);
'''
new = '''    if (game.type === "athletics" && ["a","d"].includes(key)) athleticsStep(key);
    if (game.type === "volleyball") {
      if (game.prototype) {
        if (["a","s","d"].includes(key) && !event.repeat && game.phase !== "reception") volleyballPrototypeDirection(key);
        if (key === "j" && !event.repeat) volleyballPrototypeAction();
      } else if (["a","s","d"].includes(key)) {
        volleyballInput(key);
      }
    }
'''
sports = replace_once(sports, old, new, 'volleyball prototype keyboard')

# 6) Cache bust no mundo e na pagina standalone para garantir que a rota nova chegue ao navegador.
game = game.replace('assets/js/realms/physical-education/sports-minigames.js" defer', 'assets/js/realms/physical-education/sports-minigames.js?v=volleyball-v02" defer', 1)
game = game.replace('assets/js/openworld.js" defer', 'assets/js/openworld.js?v=volleyball-v02" defer', 1)
volley_html = volley_html.replace('assets/css/volleyball/volleyball-standalone.css"', 'assets/css/volleyball/volleyball-standalone.css?v=volleyball-v02"', 1)
volley_html = volley_html.replace('assets/js/realms/physical-education/sports-minigames.js" defer', 'assets/js/realms/physical-education/sports-minigames.js?v=volleyball-v02" defer', 1)
volley_html = volley_html.replace('assets/js/volleyball/volleyball-standalone.js" defer', 'assets/js/volleyball/volleyball-standalone.js?v=volleyball-v02" defer', 1)

# 7) Visual leve do prototipo.
css_marker = '/* Volei V0.2 prototype */'
if css_marker not in css:
    css += r'''

/* Volei V0.2 prototype */
.volleyball-prototype-card { width:min(1040px,100%) !important; }
.volleyball-prototype-score {
  display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px;
  margin-bottom:12px; font-weight:1000; text-align:center;
}
.volleyball-prototype-score span { padding:8px 12px; border-radius:12px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.09); }
.volleyball-prototype-score span:first-child { color:#baffdf; }
.volleyball-prototype-score span:last-child { color:#ffbdc4; }
.volleyball-prototype-score b { font-size:1.35rem; margin-left:8px; }
.volleyball-prototype-score strong { color:#ffd166; font-size:.68rem; letter-spacing:1.4px; }
.volleyball-prototype-phase { text-align:center; color:#ffd166; font-weight:1000; letter-spacing:1.2px; margin:6px 0 10px; }
.volleyball-prototype-court {
  position:relative; width:min(880px,100%); aspect-ratio:16/9; margin:0 auto;
  overflow:hidden; border-radius:18px; border:2px solid rgba(99,245,181,.32);
  background:
    linear-gradient(90deg, transparent 49.8%, rgba(255,255,255,.09) 50%, transparent 50.2%),
    repeating-linear-gradient(0deg, rgba(255,255,255,.015) 0 48px, rgba(255,255,255,.035) 49px 50px),
    linear-gradient(180deg, rgba(255,107,122,.08) 0 49.4%, rgba(99,245,181,.09) 50.6% 100%),
    #07131a;
  box-shadow:inset 0 0 60px rgba(0,0,0,.32);
  contain:layout paint style;
}
.volleyball-net { position:absolute; z-index:4; left:4%; right:4%; top:49.4%; height:7px; transform:translateY(-50%); background:#eefcff; box-shadow:0 0 11px rgba(255,255,255,.45); }
.volleyball-court-line.line-center { position:absolute; left:50%; top:0; bottom:0; width:1px; background:rgba(255,255,255,.07); }
.volleyball-team-label { position:absolute; z-index:1; left:12px; font-size:.55rem; font-weight:1000; letter-spacing:1.5px; opacity:.42; }
.volleyball-team-label.rival { top:10px; color:#ffadb7; }
.volleyball-team-label.voltz { bottom:10px; color:#baffdf; }
.volleyball-player { position:absolute; z-index:5; width:27px; height:27px; margin:-13.5px 0 0 -13.5px; border-radius:50%; transition:left .18s ease, top .18s ease, transform .15s ease; }
.volleyball-player.rival-player { background:#ff6b7a; border:3px solid #ffd6db; box-shadow:0 0 16px rgba(255,107,122,.25); }
.volleyball-player.teammate-player { background:#63f5b5; border:3px solid #dfffee; box-shadow:0 0 16px rgba(99,245,181,.22); }
.rival-left { left:28%; top:27%; opacity:.68; }
.rival-right { left:72%; top:27%; opacity:.68; }
.rival-blocker { left:50%; top:43%; }
.rival-blocker.reading { transform:scale(1.18); box-shadow:0 0 0 7px rgba(255,107,122,.09),0 0 18px rgba(255,107,122,.35); }
.mate-left { left:27%; top:62%; opacity:.55; }
.mate-right { left:73%; top:62%; opacity:.55; }
.volleyball-player.active { width:33px; height:33px; margin:-16.5px 0 0 -16.5px; background:#45a3ff; border-color:#fff; box-shadow:0 0 0 8px rgba(69,163,255,.08),0 0 20px rgba(69,163,255,.42); transition:none; }
.volleyball-player.active.is-setting { background:#ffd166; }
.volleyball-player.active.is-attacking { background:#ff9c45; transform:scale(1.13); }
.volleyball-receive-target { position:absolute; z-index:2; width:54px; height:28px; margin:-14px 0 0 -27px; border-radius:50%; border:3px dashed rgba(255,209,102,.82); opacity:0; transform:scale(.8); transition:opacity .12s ease,transform .12s ease; }
.volleyball-receive-target.visible { opacity:1; transform:scale(1); }
.volleyball-prototype-ball { position:absolute; z-index:8; width:30px; height:30px; margin:-15px 0 0 -15px; display:grid; place-items:center; font-size:1.35rem; filter:drop-shadow(0 5px 7px rgba(0,0,0,.45)); will-change:left,top; }
.volleyball-prototype-ball.is-attack { filter:drop-shadow(0 5px 7px rgba(0,0,0,.45)) drop-shadow(0 0 8px rgba(255,156,69,.3)); }
.volleyball-prototype-controls { margin-top:13px; }
.volleyball-control-copy { min-height:22px; text-align:center; color:rgba(245,251,255,.78); font-weight:900; font-size:.78rem; }
.volleyball-lane-readout { display:flex; justify-content:center; gap:22px; margin:9px 0; font-size:.65rem; color:rgba(245,251,255,.52); }
.volleyball-lane-readout b { color:#ffd166; margin-left:5px; }
.volleyball-attack-meter { position:relative; display:none; width:min(620px,92%); height:24px; margin:10px auto 0; border-radius:999px; background:linear-gradient(90deg,rgba(255,107,122,.15),rgba(255,209,102,.15),rgba(99,245,181,.20)); border:1px solid rgba(255,255,255,.10); }
.volleyball-attack-meter.visible { display:block; }
.volleyball-attack-perfect { position:absolute; left:72%; width:20%; top:0; bottom:0; background:rgba(99,245,181,.16); border-left:1px solid rgba(99,245,181,.4); border-right:1px solid rgba(99,245,181,.4); }
.volleyball-attack-cursor { position:absolute; top:3px; width:7px; height:18px; border-radius:999px; background:#fff; transform:translateX(-50%); box-shadow:0 0 11px rgba(255,255,255,.7); }
@media(max-width:700px){
  .volleyball-prototype-score { grid-template-columns:1fr 1fr; }
  .volleyball-prototype-score strong { grid-column:1/-1; grid-row:1; }
  .volleyball-prototype-court { aspect-ratio:4/3; }
  .volleyball-control-copy { font-size:.68rem; }
}
'''

sports_path.write_text(sports, encoding='utf-8')
game_path.write_text(game, encoding='utf-8')
volley_html_path.write_text(volley_html, encoding='utf-8')
volley_css_path.write_text(css, encoding='utf-8')
