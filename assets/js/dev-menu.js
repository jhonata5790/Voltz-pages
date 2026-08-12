(function initializeVoltzDevMenu() {
  const DEV_CODE = "menu";
  let promptOpen = false;
  let panelOpen = false;
  let busy = false;

  const gate = document.createElement("div");
  gate.id = "devCodeGate";
  gate.className = "dev-code-gate";
  gate.innerHTML = `
    <div class="dev-code-card" role="dialog" aria-modal="true" aria-label="Código de desenvolvedor">
      <div class="dev-code-title"><span>VOLTz // DEV ACCESS</span><small>Esc para fechar</small></div>
      <div class="dev-code-row">
        <input id="devCodeInput" class="dev-code-input" type="password" autocomplete="off" spellcheck="false" placeholder="Digite o código..." />
        <button id="devCodeSubmit" class="dev-code-submit" type="button">Abrir</button>
      </div>
      <div id="devCodeError" class="dev-code-error"></div>
    </div>`;

  const overlay = document.createElement("div");
  overlay.id = "devMenuOverlay";
  overlay.className = "dev-menu-overlay";
  overlay.innerHTML = `
    <aside class="dev-menu" role="dialog" aria-modal="true" aria-label="Painel de desenvolvimento">
      <header class="dev-menu-header">
        <div><div class="dev-menu-kicker">Ferramentas internas</div><h2>Painel Dev</h2></div>
        <button id="devMenuClose" class="dev-close" type="button" title="Fechar">×</button>
      </header>
      <div class="dev-warning"><strong>SESSÃO</strong> não altera o save. Botões marcados como <strong>SAVE</strong> são persistentes no Supabase e existem para testar carregamento de progresso.</div>
      <div id="devStatus" class="dev-status"></div>

      <section class="dev-section">
        <div class="dev-section-title">Teleporte · sessão</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="teleport" data-value="praca">Praça do Infinito</button>
          <button class="dev-btn session" data-action="teleport" data-value="operacoes">Distrito Operações</button>
          <button class="dev-btn session" data-action="teleport" data-value="bosque">Bosque Potências</button>
          <button class="dev-btn session" data-action="teleport" data-value="fatores">Campos Fatores</button>
          <button class="dev-btn session" data-action="teleport" data-value="melog">Ruínas do Melog</button>
          <button class="dev-btn session" data-action="teleport" data-value="golem">Fortaleza Golem</button>
          <button class="dev-btn session" data-action="village">Vila Central</button>
          <button class="dev-btn session" data-action="colliders">Mostrar/ocultar colisores</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Teleporte Português · sessão</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="teleport-port" data-value="praca">Praça da Palavra</button>
          <button class="dev-btn session" data-action="teleport-port" data-value="ortografia">Bairro Ortográfico</button>
          <button class="dev-btn session" data-action="teleport-port" data-value="semantica">Jardim Semântica</button>
          <button class="dev-btn session" data-action="teleport-port" data-value="sintaxe">Distrito Sintático</button>
          <button class="dev-btn session" data-action="teleport-port" data-value="ortcepse">Arquivo Ortcepse</button>
          <button class="dev-btn session" data-action="teleport-port" data-value="espectro">Catedral Espectro</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Buffs · sessão</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="rhythm" data-value="3">Ritmo Lógico 3/3</button>
          <button class="dev-btn session" data-action="rhythm" data-value="natural">Ritmo natural</button>
          <button class="dev-btn session" data-action="speed" data-value="2">Velocidade ×2</button>
          <button class="dev-btn session" data-action="speed" data-value="4">Velocidade ×4</button>
          <button class="dev-btn session" data-action="speed" data-value="1">Velocidade normal</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Progresso Matemática · SAVE</div>
        <div class="dev-grid">
          <button class="dev-btn save" data-action="nearest">Derrotar inimigo próximo</button>
          <button class="dev-btn save" data-action="commons" data-value="1">Derrotar todos comuns</button>
          <button class="dev-btn danger" data-action="commons" data-value="0">Restaurar comuns</button>
          <button class="dev-btn save" data-action="melog" data-value="1">Marcar Melog derrotado</button>
          <button class="dev-btn danger" data-action="melog" data-value="0">Restaurar Melog</button>
          <button class="dev-btn save" data-action="golem" data-value="1">Concluir Golem + Diploma</button>
          <button class="dev-btn danger" data-action="golem" data-value="0">Restaurar Golem</button>
          <button class="dev-btn save" data-action="equations" data-value="1">Resolver todas equações</button>
          <button class="dev-btn danger" data-action="equations" data-value="0">Restaurar equações</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Recursos · SAVE</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn save" data-action="xp">+500 XP</button>
          <button class="dev-btn save" data-action="coins">+500 moedas</button>
          <button class="dev-btn save" data-action="hints">+5 Dicas de Foco</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Diagnóstico do SAVE</div>
        <div class="dev-grid dev-grid-3">
          <button class="dev-btn session" data-action="inspect-save">Comparar local × Supabase</button>
          <button class="dev-btn session" data-action="reload-save">Recarregar SAVE do Supabase</button>
        </div>
      </section>

      <section class="dev-section">
        <div class="dev-section-title">Reset · SAVE</div>
        <div class="dev-grid">
          <button class="dev-btn danger" data-action="reset-math">RESETAR REINO DA MATEMÁTICA</button>
        </div>
      </section>

      <div id="devLog" class="dev-log">Painel pronto.</div>
      <div class="dev-shortcut">P → código <strong>menu</strong> · Esc → fechar painel</div>
    </aside>`;

  document.body.append(gate, overlay);

  const input = gate.querySelector("#devCodeInput");
  const codeError = gate.querySelector("#devCodeError");
  const status = overlay.querySelector("#devStatus");
  const log = overlay.querySelector("#devLog");

  function bridge() { return window.VoltzDevBridge; }
  function profile() { return window.VoltzProfile; }

  function setLog(text, error = false) {
    log.textContent = text;
    log.classList.toggle("error", error);
  }

  function renderStatus() {
    const snap = bridge()?.getSnapshot?.();
    if (!snap) {
      status.innerHTML = `<div class="dev-stat"><span>Motor</span><strong>carregando...</strong></div>`;
      return;
    }
    status.innerHTML = `
      <div class="dev-stat"><span>Cena</span><strong>${escapeDev(snap.sceneName || snap.sceneId)}</strong></div>
      <div class="dev-stat"><span>Posição</span><strong>${snap.x}, ${snap.y}</strong></div>
      <div class="dev-stat"><span>Comuns</span><strong>${snap.commonDefeated}/${snap.commonTotal}</strong></div>
      <div class="dev-stat"><span>Melog</span><strong>${snap.miniBossDefeated ? "✓" : "—"}</strong></div>
      <div class="dev-stat"><span>Golem</span><strong>${snap.guardianChallengeCompleted ? "✓ teste" : "—"}</strong></div>
      <div class="dev-stat"><span>Diploma</span><strong>${snap.diploma ? "✓" : "—"}</strong></div>
      <div class="dev-stat"><span>Equações</span><strong>${snap.solvedEquations}/${snap.totalEquations}</strong></div>
      <div class="dev-stat"><span>Ritmo</span><strong>${snap.rhythmStacks}/3${snap.rhythmDevOverride ? " DEV" : ""}</strong></div>
      <div class="dev-stat"><span>Velocidade</span><strong>×${snap.speedMultiplier}</strong></div>
      <div class="dev-stat"><span>Colisores</span><strong>${snap.colliders ? "ON" : "OFF"}</strong></div>`;
  }

  function escapeDev(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function openGate() {
    if (panelOpen) return;
    promptOpen = true;
    bridge()?.pauseMovement?.();
    input.value = "";
    codeError.textContent = "";
    gate.classList.add("visible");
    requestAnimationFrame(() => input.focus());
  }

  function closeGate() {
    promptOpen = false;
    gate.classList.remove("visible");
    input.blur();
  }

  function openPanel() {
    closeGate();
    panelOpen = true;
    bridge()?.pauseMovement?.();
    overlay.classList.add("visible");
    renderStatus();
    setLog("Painel pronto. Ações SAVE alteram o perfil persistente.");
  }

  function closePanel() {
    panelOpen = false;
    overlay.classList.remove("visible");
  }

  function submitCode() {
    if (input.value.trim().toLowerCase() === DEV_CODE) {
      openPanel();
    } else {
      codeError.textContent = "Código inválido.";
      input.select();
    }
  }

  async function runAction(button) {
    if (busy) return;
    const action = button.dataset.action;
    const value = button.dataset.value;
    const api = bridge();
    if (!api) { setLog("Motor do jogo ainda não está disponível.", true); return; }

    busy = true;
    overlay.querySelectorAll(".dev-btn").forEach((btn) => { btn.disabled = true; });
    try {
      switch (action) {
        case "teleport": api.teleportMath(value); setLog(`Teleporte executado: ${button.textContent.trim()}.`); break;
        case "teleport-port": api.teleportPortuguese(value); setLog(`Teleporte executado: ${button.textContent.trim()}.`); break;
        case "village": api.teleportVillage(); setLog("Teleporte executado: Vila Central."); break;
        case "nearest": {
          const result = await api.defeatNearestEnemy();
          if (!result?.ok) throw new Error("Nenhum inimigo está próximo. Chegue perto de um e tente de novo.");
          if (result.persisted === false) {
            setLog(`⚠ ${result.enemyId} mudou apenas LOCALMENTE. Supabase NÃO confirmou o save: ${result.error?.message || "ver console"}`, true);
          } else {
            setLog(`✓ Inimigo ${result.enemyId} derrotado e confirmado no Supabase.`);
          }
          break;
        }
        case "colliders": api.toggleColliders(); setLog("Visualização de colisores alternada."); break;
        case "rhythm": api.setRhythmOverride(value === "natural" ? "natural" : Number(value)); setLog(value === "natural" ? "Ritmo Lógico voltou ao save." : `Ritmo Lógico temporário ${value}/3.`); break;
        case "speed": api.setSpeed(Number(value)); setLog(`Velocidade temporária ×${value}.`); break;
        case "commons": {
          const result = await api.setCommonsDefeated(value === "1");
          setLog(result?.savePersisted === false ? "⚠ Alteração dos comuns ficou apenas LOCAL. Supabase não confirmou." : (value === "1" ? "✓ SAVE confirmado: comuns derrotados." : "✓ SAVE confirmado: comuns restaurados."), result?.savePersisted === false);
          break;
        }
        case "melog": {
          const result = await api.setMiniBossDefeated(value === "1");
          setLog(result?.savePersisted === false ? "⚠ Alteração do Melog ficou apenas LOCAL. Supabase não confirmou." : (value === "1" ? "✓ SAVE confirmado: Melog derrotado." : "✓ SAVE confirmado: Melog restaurado."), result?.savePersisted === false);
          break;
        }
        case "golem": {
          const result = await api.setBossDefeated(value === "1");
          setLog(result?.savePersisted === false ? "⚠ Alteração do Golem ficou apenas LOCAL. Supabase não confirmou." : (value === "1" ? "✓ SAVE confirmado: guardião concluído." : "✓ SAVE confirmado: Golem restaurado."), result?.savePersisted === false);
          break;
        }
        case "equations": {
          const result = await api.setEquationsSolved(value === "1");
          setLog(result?.savePersisted === false ? "⚠ Alteração das equações ficou apenas LOCAL. Supabase não confirmou." : (value === "1" ? "✓ SAVE confirmado: Equações estabilizadas." : "✓ SAVE confirmado: Equações restauradas."), result?.savePersisted === false);
          break;
        }
        case "xp": await profile()?.addRewards?.(500, 0); setLog("SAVE: +500 XP."); break;
        case "coins": await profile()?.addRewards?.(0, 500); setLog("SAVE: +500 moedas."); break;
        case "hints": await profile()?.addItem?.("dica-foco", 5); setLog("SAVE: +5 Dicas de Foco."); break;
        case "inspect-save": {
          const result = await profile()?.inspectSave?.("reino-matematica");
          if (!result?.ok) {
            throw new Error(`Falha ao ler o Supabase: ${result?.error?.message || result?.reason || "erro desconhecido"}`);
          }

          const localEnemies = result.local?.defeatedEnemyIds?.length || 0;
          const remoteEnemies = result.remote?.defeatedEnemyIds?.length || 0;
          const localEq = result.local?.solvedWorldEquationIds?.length || 0;
          const remoteEq = result.remote?.solvedWorldEquationIds?.length || 0;

          if (result.matches && result.localXp === result.remoteXp && result.localCoins === result.remoteCoins) {
            setLog(`✓ SAVE CONFIRMADO NO SUPABASE · inimigos ${remoteEnemies} · equações ${remoteEq} · XP ${result.remoteXp} · moedas ${result.remoteCoins}`);
          } else {
            setLog(
              `⚠ DIVERGÊNCIA LOCAL × SUPABASE · inimigos ${localEnemies}/${remoteEnemies} · equações ${localEq}/${remoteEq} · XP ${result.localXp}/${result.remoteXp} · moedas ${result.localCoins}/${result.remoteCoins}`,
              true
            );
          }
          break;
        }
        case "reload-save": {
          const result = await profile()?.refreshProfileFromServer?.();
          if (!result?.ok) throw new Error(result?.error?.message || "Não foi possível recarregar o perfil.");
          setLog("SAVE recarregado diretamente do Supabase. O mapa foi sincronizado com o banco.");
          break;
        }
        case "reset-math": {
          if (!window.confirm("Resetar TODO o progresso salvo do Reino da Matemática? XP/moedas/inventário não serão apagados.")) break;
          await api.resetMathProgress();
          setLog("SAVE: Reino da Matemática resetado.");
          break;
        }
      }
      renderStatus();
    } catch (error) {
      console.error("[Voltz Dev Menu]", error);
      setLog(error?.message || "Falha ao executar ação.", true);
    } finally {
      busy = false;
      overlay.querySelectorAll(".dev-btn").forEach((btn) => { btn.disabled = false; });
      renderStatus();
    }
  }

  gate.querySelector("#devCodeSubmit").addEventListener("click", submitCode);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); submitCode(); }
    if (event.key === "Escape") { event.preventDefault(); closeGate(); }
  });
  overlay.querySelector("#devMenuClose").addEventListener("click", closePanel);
  overlay.addEventListener("click", (event) => {
    const button = event.target.closest(".dev-btn[data-action]");
    if (button) runAction(button);
  });

  // Captura antes dos controles do jogo para o menu não movimentar o jogador enquanto aberto.
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);

    if (promptOpen || panelOpen) {
      if (key === "escape" && !typing) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (panelOpen) closePanel(); else closeGate();
        return;
      }
      if (!typing) {
        event.stopImmediatePropagation();
      }
      return;
    }

    if (key === "p" && !event.repeat && !typing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openGate();
    }
  }, true);

  window.addEventListener("voltz:profile-updated", () => {
    if (panelOpen) renderStatus();
  });

  window.VoltzDevMenu = {
    isOpen: () => promptOpen || panelOpen,
    open: openGate,
    close: () => { closeGate(); closePanel(); }
  };
})();
