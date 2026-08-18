from pathlib import Path

repo = Path('.')
sports_path = repo / 'assets/js/realms/physical-education/sports-minigames.js'
dev_path = repo / 'assets/js/dev-menu.js'
dev_css_path = repo / 'assets/css/dev-menu.css'
mobile_js_path = repo / 'assets/js/mobile-controls.js'
readme_path = repo / 'README_PAINEL_DEV.md'

sports = sports_path.read_text(encoding='utf-8')
dev = dev_path.read_text(encoding='utf-8')
dev_css = dev_css_path.read_text(encoding='utf-8')
mobile_js = mobile_js_path.read_text(encoding='utf-8')

# -----------------------------------------------------------------------------
# SPORTS DEV API: progresso individual + final + snapshot.
# -----------------------------------------------------------------------------
marker = '''  async function devReset() {
    const result = await global.VoltzProfile?.resetGuardianChallenge?.(REALM_ID);
    await global.VoltzProfile?.setRealmProgress?.(REALM_ID, {
      defeatedEnemyIds: [],
      solvedWorldEquationIds: [],
      miniBossDefeated: false,
      bossDefeated: false,
      guardianChallengeCompleted: false,
      completed: false,
      completedMinigameIds: []
    });
    updateHud();
    return result || { ok: true };
  }
'''
if marker not in sports:
    raise SystemExit('devReset marker not found')
extra = marker + r'''

  async function devSetSportCompleted(id, completed = true) {
    if (!SPORT_IDS.includes(id)) return { ok:false, message:"Modalidade inválida." };
    const current = getProgress();
    const ids = new Set(current.completedMinigameIds);
    if (completed) ids.add(id);
    else ids.delete(id);
    const next = {
      ...current,
      completedMinigameIds:[...ids],
      lastSportCompletedAt:new Date().toISOString()
    };
    if (!completed) {
      next.guardianChallengeCompleted = false;
      next.bossDefeated = false;
      next.completed = false;
    }
    const result = await global.VoltzProfile?.setRealmProgress?.(REALM_ID, next);
    updateHud();
    return { ok:result?.ok !== false, persisted:result?.persisted, id, completed, progress:getProgress() };
  }

  async function devSetGuardianCompleted(completed = true) {
    if (completed) {
      await devCompleteAll();
      const result = await global.VoltzProfile?.completeGuardianChallenge?.(
        REALM_ID,
        { id:"campeonato-voltz-dev", enemyRank:"guardian", name:"Pentatlo Voltz · DEV" },
        { xp:0, coins:0 },
        {
          id:"diploma-educacao-fisica",
          name:"Diploma de Educação Física",
          abilityId:"reflexos-treinados",
          abilityName:"Reflexos Treinados",
          abilityDescription:"Uma vez por batalha, adiciona 6 segundos ao cronômetro da pergunta atual."
        }
      );
      updateHud();
      return result || { ok:true, persisted:false };
    }

    const sportsDone = [...getProgress().completedMinigameIds];
    const reset = await global.VoltzProfile?.resetGuardianChallenge?.(REALM_ID);
    await global.VoltzProfile?.setRealmProgress?.(REALM_ID, {
      ...getProgress(),
      completedMinigameIds:sportsDone,
      guardianChallengeCompleted:false,
      bossDefeated:false,
      completed:false
    });
    updateHud();
    return reset || { ok:true };
  }

  function devGetSnapshot() {
    const progress = getProgress();
    return {
      completedMinigameIds:[...progress.completedMinigameIds],
      completedCount:progress.completedMinigameIds.length,
      total:SPORT_IDS.length,
      guardianChallengeCompleted:Boolean(progress.guardianChallengeCompleted),
      open:Boolean(state.open),
      activeId:state.activeId || "",
      mode:state.mode || "normal",
      currentType:state.current?.type || ""
    };
  }
'''
sports = sports.replace(marker, extra, 1)

export_old = '''    allSportsCompleted,
    devCompleteAll,
    devReset
  });'''
export_new = '''    allSportsCompleted,
    devCompleteAll,
    devReset,
    devSetSportCompleted,
    devSetGuardianCompleted,
    devGetSnapshot
  });'''
if export_old not in sports:
    raise SystemExit('VoltzSports export marker not found')
sports = sports.replace(export_old, export_new, 1)

# -----------------------------------------------------------------------------
# DEV MENU: replace old Sports section with current test center.
# -----------------------------------------------------------------------------
start = dev.find('      <section class="dev-section">\n        <div class="dev-section-title">Teleporte Educação Física · sessão</div>')
end = dev.find('      <section class="dev-section">\n        <div class="dev-section-title">Batalha · sessão</div>', start)
if start < 0 or end < 0:
    raise SystemExit('sports dev menu section markers not found')
new_sports_section = r'''      <section class="dev-section dev-section-sports">
        <div class="dev-section-title">Educação Física · teste atual</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="teleport-sports" data-value="praca">Praça dos Atletas</button>
          <button class="dev-btn session" data-action="sport-page" data-value="football.html">⚽ Futebol standalone</button>
          <button class="dev-btn session" data-action="sports-open" data-value="basketball">🏀 Basquete</button>
          <button class="dev-btn session" data-action="sports-open" data-value="athletics">🏃 Atletismo</button>
          <button class="dev-btn session" data-action="sport-page" data-value="volleyball.html">🏐 Vôlei V0.3</button>
          <button class="dev-btn session" data-action="sport-page" data-value="dodgeball.html">🔴 Queimada standalone</button>
          <button class="dev-btn session" data-action="teleport-sports" data-value="estadio">🏟 Estádio Voltz</button>
          <button class="dev-btn session" data-action="sports-championship">🏆 Abrir Pentatlo</button>
        </div>

        <div class="dev-subtitle">Progresso individual · SAVE</div>
        <div class="dev-sport-progress-grid">
          <button class="dev-btn save" data-action="sports-set" data-value="football">✓ Futebol</button>
          <button class="dev-btn danger" data-action="sports-unset" data-value="football">↺ Futebol</button>
          <button class="dev-btn save" data-action="sports-set" data-value="basketball">✓ Basquete</button>
          <button class="dev-btn danger" data-action="sports-unset" data-value="basketball">↺ Basquete</button>
          <button class="dev-btn save" data-action="sports-set" data-value="athletics">✓ Atletismo</button>
          <button class="dev-btn danger" data-action="sports-unset" data-value="athletics">↺ Atletismo</button>
          <button class="dev-btn save" data-action="sports-set" data-value="volleyball">✓ Vôlei</button>
          <button class="dev-btn danger" data-action="sports-unset" data-value="volleyball">↺ Vôlei</button>
          <button class="dev-btn save" data-action="sports-set" data-value="dodgeball">✓ Queimada</button>
          <button class="dev-btn danger" data-action="sports-unset" data-value="dodgeball">↺ Queimada</button>
        </div>

        <div class="dev-subtitle">Final / ferramentas</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn save" data-action="sports-complete-all">✓ Concluir 5 modalidades</button>
          <button class="dev-btn save" data-action="sports-final" data-value="1">🎓 Dar diploma + final</button>
          <button class="dev-btn danger" data-action="sports-final" data-value="0">↺ Resetar só final</button>
          <button class="dev-btn session" data-action="sports-rally">🔥 Forçar Rally Rubro</button>
          <button class="dev-btn session" data-action="sports-perfect-return">⚡ Devolução Perfeita</button>
          <button class="dev-btn danger" data-action="sports-reset">RESET Educação Física</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Mobile · teste</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="mobile-toggle">🎮 Ligar/desligar touch</button>
          <button class="dev-btn session" data-action="mobile-on">📱 Forçar touch ON</button>
          <button class="dev-btn session" data-action="reload-page">↻ Recarregar página</button>
        </div>
        <div class="dev-section-note">No celular, o botão DEV substitui o atalho P. Para minigames esportivos, a interface troca os botões automaticamente.</div>
      </section>

'''
dev = dev[:start] + new_sports_section + dev[end:]

# Status: append Sports and Mobile before battle status.
status_marker = '''      <div class="dev-stat"><span>Colisores</span><strong>${snap.colliders ? "ON" : "OFF"}</strong></div>
      ${(() => {
        const battle = window.VoltzBattleDev?.getSnapshot?.();'''
status_replacement = '''      <div class="dev-stat"><span>Colisores</span><strong>${snap.colliders ? "ON" : "OFF"}</strong></div>
      ${(() => {
        const sports = window.VoltzSports?.devGetSnapshot?.();
        return sports
          ? `<div class="dev-stat"><span>Esportes</span><strong>${sports.completedCount}/${sports.total}${sports.guardianChallengeCompleted ? " · 🎓" : ""}</strong></div>`
          : `<div class="dev-stat"><span>Esportes</span><strong>—</strong></div>`;
      })()}
      <div class="dev-stat"><span>Touch</span><strong>${window.VoltzMobileControls?.isEnabled?.() ? "ON" : "OFF"}</strong></div>
      ${(() => {
        const battle = window.VoltzBattleDev?.getSnapshot?.();'''
if status_marker not in dev:
    raise SystemExit('dev status marker not found')
dev = dev.replace(status_marker, status_replacement, 1)

# Actions: insert new cases after teleport-sports.
action_marker = '''        case "teleport-sports": api.teleportSports(value); setLog(`Teleporte executado: ${button.textContent.trim()}.`); break;
        case "sports-complete-all":'''
action_replacement = '''        case "teleport-sports": api.teleportSports(value); setLog(`Teleporte executado: ${button.textContent.trim()}.`); break;
        case "sport-page": window.location.href = value; return;
        case "sports-open": { closePanel(); window.VoltzSports?.open?.(value); break; }
        case "sports-championship": {
          if (!window.VoltzSports?.allSportsCompleted?.()) throw new Error("Conclua as cinco modalidades ou use o cheat de conclusão antes do Pentatlo.");
          closePanel();
          window.VoltzSports?.open?.("championship");
          break;
        }
        case "sports-set": { const result = await window.VoltzSports?.devSetSportCompleted?.(value, true); if (!result?.ok) throw new Error(result?.message || "Falha ao concluir modalidade."); setLog(`✓ ${value} marcado como concluído.`); break; }
        case "sports-unset": { const result = await window.VoltzSports?.devSetSportCompleted?.(value, false); if (!result?.ok) throw new Error(result?.message || "Falha ao restaurar modalidade."); setLog(`↺ ${value} restaurado.`); break; }
        case "sports-final": { const result = await window.VoltzSports?.devSetGuardianCompleted?.(value === "1"); if (result?.ok === false) throw new Error(result?.message || "Falha ao alterar o final."); setLog(value === "1" ? "🎓 Final concluído e diploma aplicado." : "↺ Final de Educação Física restaurado."); break; }
        case "mobile-toggle": { const on = window.VoltzMobileControls?.toggle?.(); setLog(`Controles touch ${on ? "ON" : "OFF"}.`); break; }
        case "mobile-on": { window.VoltzMobileControls?.setEnabled?.(true); setLog("Controles touch forçados ON."); break; }
        case "reload-page": window.location.reload(); return;
        case "sports-complete-all":'''
if action_marker not in dev:
    raise SystemExit('dev action insertion marker not found')
dev = dev.replace(action_marker, action_replacement, 1)

# Shortcut text now reflects mobile access.
dev = dev.replace(
    '<div class="dev-shortcut">P → código <strong>menu</strong> · Esc → fechar painel</div>',
    '<div class="dev-shortcut">PC: P · Mobile: DEV → código <strong>menu</strong> · Esc/× → fechar</div>'
)

# -----------------------------------------------------------------------------
# DEV CSS mobile ergonomics.
# -----------------------------------------------------------------------------
css_marker = '/* V0.4 · Painel Dev atualizado + mobile */'
if css_marker not in dev_css:
    dev_css += r'''

/* V0.4 · Painel Dev atualizado + mobile */
.dev-subtitle {
  margin:10px 0 7px;
  color:rgba(255,255,255,.48);
  font-size:10px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.dev-sport-progress-grid {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
}
@media (max-width:700px), (pointer:coarse) {
  .dev-menu-overlay { justify-content:center; }
  .dev-menu {
    width:100vw;
    max-width:none;
    padding:max(14px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));
    border-left:0;
    border-radius:0;
  }
  .dev-menu-header { position:sticky; top:0; z-index:3; padding:8px 0 10px; background:rgba(6,11,24,.95); }
  .dev-close { width:48px;height:48px;font-size:22px; }
  .dev-btn { min-height:48px;padding:10px 11px;font-size:12px;text-align:center; }
  .dev-grid.dev-grid-3 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .dev-sport-progress-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .dev-status { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .dev-code-gate { align-items:center;padding:16px; }
  .dev-code-card { width:min(520px,100%); }
  .dev-code-row { grid-template-columns:1fr; }
  .dev-code-input { min-height:48px;font-size:16px; }
  .dev-code-submit { min-height:48px; }
}
'''

# -----------------------------------------------------------------------------
# MOBILE controls explicit saved OFF must win on reload.
# -----------------------------------------------------------------------------
old_enable = '''  const forced = params.get("mobile") === "1";
  const disabledByUrl = params.get("mobile") === "0";
  let enabled = disabledByUrl ? false : forced || coarse || narrow || localStorage.getItem(STORAGE_KEY) === "on";'''
new_enable = '''  const forced = params.get("mobile") === "1";
  const disabledByUrl = params.get("mobile") === "0";
  const storedPreference = localStorage.getItem(STORAGE_KEY);
  let enabled = disabledByUrl
    ? false
    : forced
      ? true
      : storedPreference === "on"
        ? true
        : storedPreference === "off"
          ? false
          : Boolean(coarse || narrow);'''
if old_enable not in mobile_js:
    raise SystemExit('mobile enable marker not found')
mobile_js = mobile_js.replace(old_enable, new_enable, 1)

# -----------------------------------------------------------------------------
# HTML wiring.
# -----------------------------------------------------------------------------
def wire_html(path: Path, standalone=False):
    text = path.read_text(encoding='utf-8')
    if 'assets/css/mobile-controls.css' not in text:
        anchor = '<link rel="stylesheet" href="assets/css/dev-menu.css" />' if not standalone else '<link rel="stylesheet" href="assets/css/sports-minigames.css" />'
        if anchor not in text:
            raise SystemExit(f'css anchor missing in {path}')
        text = text.replace(anchor, anchor + '\n  <link rel="stylesheet" href="assets/css/mobile-controls.css?v=mobile-v1" />', 1)
    if 'assets/js/mobile-controls.js' not in text:
        if not standalone:
            anchor = '<script src="assets/js/dev-menu.js" defer></script>'
            repl = anchor + '\n  <script src="assets/js/mobile-controls.js?v=mobile-v1" defer></script>'
        else:
            anchor = '</body>'
            repl = '  <script src="assets/js/mobile-controls.js?v=mobile-v1" defer></script>\n' + anchor
        if anchor not in text:
            raise SystemExit(f'js anchor missing in {path}')
        text = text.replace(anchor, repl, 1)
    path.write_text(text, encoding='utf-8')

wire_html(repo / 'game.html', standalone=False)
wire_html(repo / 'volleyball.html', standalone=True)
wire_html(repo / 'football.html', standalone=True)
wire_html(repo / 'dodgeball.html', standalone=True)

# Cache-bust dev menu/css on game page.
game_path = repo / 'game.html'
game = game_path.read_text(encoding='utf-8')
game = game.replace('assets/css/dev-menu.css"', 'assets/css/dev-menu.css?v=dev-v4"')
game = game.replace('assets/js/dev-menu.js"', 'assets/js/dev-menu.js?v=dev-v4"')
game_path.write_text(game, encoding='utf-8')

# -----------------------------------------------------------------------------
# Documentation.
# -----------------------------------------------------------------------------
readme = '''# Painel Dev — Voltz Education\n\nFerramenta interna para acelerar testes do jogo.\n\n## Abrir\n\n### PC\n1. Dentro de `game.html`, pressione **P**.\n2. Digite `menu`.\n3. Pressione Enter.\n\n### Celular\n1. Abra o jogo normalmente no celular.\n2. Os controles touch aparecem automaticamente em telas pequenas/dispositivos touch.\n3. Toque em **DEV** no canto superior.\n4. Digite `menu`.\n\nTambém é possível forçar a interface mobile adicionando `?mobile=1` ao endereço. `?mobile=0` desativa na sessão atual.\n\n## Painel atualizado\n\nO Painel Dev agora inclui:\n- teleporte dos reinos já implementados;\n- conclusão/restauração individual das 5 modalidades de Educação Física;\n- atalhos diretos para Futebol, Vôlei V0.3 e Queimada standalone;\n- abertura rápida de Basquete, Atletismo e Pentatlo;\n- controle separado do final/diploma de Educação Física;\n- Rally Rubro e Devolução Perfeita;\n- toggle dos controles touch;\n- recursos, buffs, batalha e diagnóstico do SAVE.\n\n## Sessão x SAVE\n\n- **Sessão:** teleporte, velocidade, Ritmo Lógico, colisores, abertura de testes e controles mobile. Não persiste progresso.\n- **SAVE:** progresso de inimigos/bosses/equações, modalidades, diplomas, XP, moedas e itens. Essas ações usam o perfil real no Supabase.\n\n> O código `menu` serve apenas para esconder a ferramenta da interface normal. Como o projeto é front-end e público, isso não é um mecanismo de segurança.\n'''
readme_path.write_text(readme, encoding='utf-8')

sports_path.write_text(sports, encoding='utf-8')
dev_path.write_text(dev, encoding='utf-8')
dev_css_path.write_text(dev_css, encoding='utf-8')
mobile_js_path.write_text(mobile_js, encoding='utf-8')
