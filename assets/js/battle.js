/* Voltz Education — sistema de combate separado.
   O mapa continua em openworld.js; esta camada cuida da tela de batalha, timer, PV, perguntas e mochila. */

const battleState = {
  active: false,
  locked: false,
  playerMaxHp: 100,
  playerHp: 100,
  enemyMaxHp: 100,
  enemyHp: 100,
  timeLimit: 30,
  timeLeft: 30,
  timeBonus: 0,
  timerId: null,
  questionNumber: 1,
  questionDeck: [],
  questionDeckIndex: 0,
  questionsAsked: 0,
  hintRevealed: false,
  hintBusy: false,
  bagMessage: "",
  structuredReasoningUsed: false,
  eliminatedOptionLetter: "",
  guardianRecognitionActive: false,
  guardianDialogueIndex: 0,
  guardianSaveResult: null,
  currentTab: "question",
  outcomeTimerId: null,
  resultMode: false
};


function clearBattleTimer() {
      if (battleState.timerId) {
        window.clearInterval(battleState.timerId);
        battleState.timerId = null;
      }
    }

    function shuffleBattleItems(items) {
      const shuffled = [...items];

      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    }

    function prepareBattleQuestion(question) {
      if (!question) return null;

      const sourceOptions = Object.entries(question.options || {}).map(([letter, value]) => ({
        value,
        correct: letter === question.answer
      }));

      const shuffledOptions = shuffleBattleItems(sourceOptions);
      const letters = ["A", "B", "C", "D"];
      const options = {};
      let answer = "";

      shuffledOptions.forEach((option, index) => {
        const letter = letters[index];
        if (!letter) return;

        options[letter] = option.value;
        if (option.correct) answer = letter;
      });

      return {
        ...question,
        options,
        answer
      };
    }

    function resetBattleQuestionDeck(type) {
      battleState.questionDeck = shuffleBattleItems(type.questions || []);
      battleState.questionDeckIndex = 0;
      battleState.questionsAsked = 0;
      battleState.questionNumber = 1;
    }

    function drawNextBattleQuestion(type) {
      const questions = type.questions || [];
      if (!questions.length) return null;

      if (!battleState.questionDeck.length || battleState.questionDeckIndex >= battleState.questionDeck.length) {
        const previousText = currentEnemyQuestion?.text || "";
        battleState.questionDeck = shuffleBattleItems(questions);
        battleState.questionDeckIndex = 0;

        if (
          battleState.questionDeck.length > 1 &&
          previousText &&
          battleState.questionDeck[0]?.text === previousText
        ) {
          [battleState.questionDeck[0], battleState.questionDeck[1]] = [
            battleState.questionDeck[1],
            battleState.questionDeck[0]
          ];
        }
      }

      const rawQuestion = battleState.questionDeck[battleState.questionDeckIndex];
      battleState.questionDeckIndex += 1;
      battleState.questionsAsked += 1;
      battleState.questionNumber = battleState.questionsAsked;

      return prepareBattleQuestion(rawQuestion);
    }

    function clearBattleOutcomeTimer() {
      if (battleState.outcomeTimerId) {
        window.clearTimeout(battleState.outcomeTimerId);
        battleState.outcomeTimerId = null;
      }
    }

    function scheduleBattleAutoReturn(callback) {
      clearBattleOutcomeTimer();
      battleState.outcomeTimerId = window.setTimeout(() => {
        battleState.outcomeTimerId = null;
        if (typeof callback === "function") callback();
      }, 3000);
    }

    function openEnemyEncounter(enemy) {
      if (!enemy) return;
      clearBattleOutcomeTimer();
      const type = getEnemyType(enemy);

      window.closeWorldInventory?.();
      document.body.classList.add("battle-active");
      enemyPanelOpen = true;
      currentEnemy = enemy;
      enemyQuestionAnswered = false;
      resetBattleQuestionDeck(type);
      currentEnemyQuestion = drawNextBattleQuestion(type);

      battleState.active = true;
      battleState.locked = false;
      battleState.playerMaxHp = 100;
      battleState.playerHp = 100;
      battleState.enemyMaxHp = type.maxHp || 100;
      battleState.enemyHp = battleState.enemyMaxHp;
      battleState.timeBonus = Math.max(0, Number(window.getActiveBattleTimeBonus?.() || 0));
      battleState.timeLimit = (type.timeLimit || 30) + battleState.timeBonus;
      battleState.timeLeft = battleState.timeLimit;
      battleState.currentTab = "question";
      battleState.hintRevealed = false;
      battleState.hintBusy = false;
      battleState.bagMessage = "";
      battleState.structuredReasoningUsed = false;
      battleState.eliminatedOptionLetter = "";
      battleState.guardianRecognitionActive = false;
      battleState.guardianDialogueIndex = 0;
      battleState.guardianSaveResult = null;
      battleState.resultMode = false;

      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.run = false;
      playerState.moving = false;
      updatePlayerAnimation();

      renderBattleScreen();
      enemyPanel.classList.add("visible", "battle-mode");
      startBattleTimer();
      interactionText.textContent = `Combate iniciado contra ${type.name}. Responda antes do tempo acabar!`;
    }

    function renderBattleScreen() {
      if (!currentEnemy || !currentEnemyQuestion) return;

      const type = getEnemyType(currentEnemy);
      const q = currentEnemyQuestion;
      const questionNumber = battleState.questionNumber;
      const hintCount = Math.max(0, Number(window.VoltzProfile?.getItemCount?.("dica-foco") || 0));
      const isTrainingBattle = Boolean(currentEnemy?.trainingBattle);
      const canUseHint = !isTrainingBattle && hintCount > 0 && !battleState.hintRevealed && !battleState.locked && !battleState.hintBusy;
      const hasStructuredReasoning = Boolean(window.VoltzProfile?.hasRealmDiploma?.("reino-matematica"));
      const canUseStructuredReasoning = hasStructuredReasoning && !battleState.structuredReasoningUsed && !battleState.locked;

      enemyPanel.innerHTML = `
        <div class="battle-panel-inner enemy-theme-${type.id}">
          <div class="battle-topline">
            <div>
              <div class="enemy-panel-kicker">${escapeHtml(type.role)}</div>
              <div class="enemy-panel-title">${escapeHtml(type.name)}</div>
              <div class="enemy-panel-subtitle">${escapeHtml(type.description)}${isTrainingBattle ? " · Treino sem recompensas e sem alteração de progresso." : ""}</div>
            </div>

            <button class="enemy-close-btn" type="button" onclick="closeEnemyPanel()">Voltar ao mapa</button>
          </div>

          <div class="battle-tabs">
            <button id="battleTabQuestionBtn" class="battle-tab-btn active" type="button" onclick="setBattleTab('question')">Combate</button>
            <button id="battleTabBagBtn" class="battle-tab-btn" type="button" onclick="setBattleTab('bag')">Mochila</button>
          </div>

          <div id="battleQuestionTab" class="battle-tab-content active">
            <div class="battle-layout">
              <section class="battle-enemy-stage" id="battleEnemyStage">
              <div class="battle-enemy-aura"></div>
              ${getBattleEnemySvg(type)}
              <div class="battle-damage-float" id="battleDamageFloat"></div>
            </section>

            <section class="battle-info-stage">
              <div class="battle-bars">
                <div class="battle-bar-card enemy-hp-card">
                  <div class="battle-bar-label">
                    <span>PV do Inimigo</span>
                    <strong id="battleEnemyHpText">${battleState.enemyHp}/${battleState.enemyMaxHp}</strong>
                  </div>
                  <div class="battle-bar-track">
                    <div class="battle-bar-fill enemy-fill" id="battleEnemyHpFill" style="width: ${getHpPercent(battleState.enemyHp, battleState.enemyMaxHp)}%"></div>
                  </div>
                </div>

                <div class="battle-bar-card player-hp-card">
                  <div class="battle-bar-label">
                    <span>PV do Jogador</span>
                    <strong id="battlePlayerHpText">${battleState.playerHp}/${battleState.playerMaxHp}</strong>
                  </div>
                  <div class="battle-bar-track">
                    <div class="battle-bar-fill player-fill" id="battlePlayerHpFill" style="width: ${getHpPercent(battleState.playerHp, battleState.playerMaxHp)}%"></div>
                  </div>
                </div>
              </div>

              <div class="battle-timer-card">
                <div class="battle-timer-label">
                  <span>Tempo ${battleState.timeBonus > 0 ? `<small class="battle-time-bonus">Ritmo Lógico +${battleState.timeBonus}s</small>` : ""}</span>
                  <strong id="battleTimerText">${battleState.timeLeft}s</strong>
                </div>
                <div class="battle-timer-track">
                  <div class="battle-timer-fill" id="battleTimerFill" style="width: 100%"></div>
                </div>
              </div>

              <div class="enemy-question-card battle-question-card">
                ${battleState.hintRevealed ? `<div class="enemy-question-tip battle-hint-revealed">💡 Dica: ${escapeHtml(q.tip)}</div>` : ""}
                <div class="battle-question-count">Pergunta ${questionNumber} • banco com ${type.questions.length}</div>
                <div class="enemy-question-text">${escapeHtml(q.text)}</div>

                <div class="enemy-question-options" id="enemyQuestionOptions">
                  ${Object.entries(q.options).map(([letter, value]) => {
                    const eliminated = battleState.eliminatedOptionLetter === letter;
                    return `
                      <button class="enemy-option-btn ${eliminated ? "eliminated" : ""}" type="button" onclick="answerEnemyQuestion('${letter}')" ${eliminated ? "disabled" : ""}>
                        <strong>${letter}</strong>
                        <span>${eliminated ? "Alternativa eliminada" : escapeHtml(value)}</span>
                      </button>
                    `;
                  }).join("")}
                </div>

                <div class="enemy-feedback" id="enemyFeedback"></div>
                <button class="enemy-next-btn" id="enemyNextButton" type="button" onclick="nextEnemyQuestion()">Próxima pergunta</button>
              </div>
              </section>
            </div>
          </div>

          <div id="battleBagTab" class="battle-tab-content">
            <div class="battle-bag">
              <article class="battle-bag-item">
                <div class="battle-bag-item-icon">💡</div>
                <div class="battle-bag-item-copy">
                  <div class="battle-bag-item-name">Dica de Foco</div>
                  <p>Revela a dica da pergunta atual. Cada uso consome 1 unidade.</p>
                  <span class="battle-bag-item-count">Na mochila: ${hintCount}</span>
                </div>
                <button
                  id="battleUseHintButton"
                  class="battle-item-use-btn"
                  type="button"
                  onclick="useBattleHint()"
                  ${canUseHint ? "" : "disabled"}
                >
                  ${battleState.hintBusy
                    ? "Usando..."
                    : battleState.hintRevealed
                      ? "Dica já usada"
                      : isTrainingBattle
                        ? "Protegido no treino"
                        : hintCount > 0
                          ? "Usar dica"
                          : "Sem dicas"}
                </button>
              </article>

              ${hasStructuredReasoning ? `
                <article class="battle-bag-item battle-bag-item-permanent">
                  <div class="battle-bag-item-icon">🧠</div>
                  <div class="battle-bag-item-copy">
                    <div class="battle-bag-item-name">Raciocínio Estruturado</div>
                    <p>Competência do Diploma da Matemática. Elimina uma alternativa incorreta da pergunta atual.</p>
                    <span class="battle-bag-item-count">Permanente · 1 uso por batalha</span>
                  </div>
                  <button
                    class="battle-item-use-btn"
                    type="button"
                    onclick="useStructuredReasoning()"
                    ${canUseStructuredReasoning ? "" : "disabled"}
                  >
                    ${battleState.structuredReasoningUsed ? "Usado nesta batalha" : "Eliminar alternativa"}
                  </button>
                </article>
              ` : ""}

              <div id="battleBagMessage" class="battle-bag-message ${battleState.bagMessage ? "visible" : ""}">
                ${escapeHtml(battleState.bagMessage || (isTrainingBattle
                  ? "Arena de Treino: consumíveis ficam protegidos e não podem ser gastos nesta simulação."
                  : hintCount > 0
                    ? "Use a Dica de Foco apenas quando precisar. O item é consumido imediatamente."
                    : "Sua mochila não tem dicas. Compre novas unidades com o Mercador de Foco na Loja Voltz."))}
              </div>
            </div>
          </div>
        </div>
      `;

      updateBattleHud();
      setBattleTab(battleState.currentTab || "question");
    }

    async function useBattleHint() {
      if (currentEnemy?.trainingBattle) {
        battleState.bagMessage = "Treino da Arena não consome Dicas de Foco. Seus itens continuam guardados.";
        battleState.currentTab = "bag";
        renderBattleScreen();
        return;
      }

      if (
        !battleState.active ||
        battleState.locked ||
        battleState.hintBusy ||
        battleState.hintRevealed ||
        !currentEnemyQuestion
      ) {
        return;
      }

      const count = Math.max(0, Number(window.VoltzProfile?.getItemCount?.("dica-foco") || 0));
      if (count <= 0) {
        battleState.bagMessage = "Você não possui Dicas de Foco. Compre mais na Loja Voltz.";
        renderBattleScreen();
        setBattleTab("bag");
        return;
      }

      if (!window.VoltzProfile?.consumeItem) {
        battleState.bagMessage = "Seu inventário não está disponível agora.";
        renderBattleScreen();
        setBattleTab("bag");
        return;
      }

      battleState.hintBusy = true;
      battleState.locked = true;
      battleState.bagMessage = "Abrindo a Dica de Foco...";

      try {
        const result = await window.VoltzProfile.consumeItem("dica-foco", 1);

        if (!result?.ok) {
          battleState.bagMessage = "Não foi possível usar a dica. Verifique seu inventário e tente novamente.";
          return;
        }

        battleState.hintRevealed = true;
        battleState.bagMessage = "";
        battleState.currentTab = "question";
      } catch (error) {
        console.error("Falha ao usar Dica de Foco:", error);
        battleState.bagMessage = "Não foi possível usar a dica agora. Tente novamente.";
        battleState.currentTab = "bag";
      } finally {
        battleState.hintBusy = false;
        battleState.locked = false;
        renderBattleScreen();
        setBattleTab(battleState.currentTab);
      }
    }

    function useStructuredReasoning() {
      if (
        !battleState.active ||
        battleState.locked ||
        battleState.structuredReasoningUsed ||
        !currentEnemyQuestion ||
        !window.VoltzProfile?.hasRealmDiploma?.("reino-matematica")
      ) return;

      const wrongLetters = Object.keys(currentEnemyQuestion.options || {}).filter(
        (letter) => letter !== currentEnemyQuestion.answer
      );
      if (!wrongLetters.length) return;

      battleState.structuredReasoningUsed = true;
      battleState.eliminatedOptionLetter = wrongLetters[Math.floor(Math.random() * wrongLetters.length)];
      battleState.bagMessage = "Raciocínio Estruturado eliminou uma alternativa incorreta. A competência já foi usada nesta batalha.";
      battleState.currentTab = "question";
      renderBattleScreen();
      setBattleTab("question");
    }

    function setBattleTab(tab) {
      battleState.currentTab = tab;

      const questionTab = document.getElementById("battleQuestionTab");
      const bagTab = document.getElementById("battleBagTab");
      const questionBtn = document.getElementById("battleTabQuestionBtn");
      const bagBtn = document.getElementById("battleTabBagBtn");

      if (questionTab) questionTab.classList.toggle("active", tab === "question");
      if (bagTab) bagTab.classList.toggle("active", tab === "bag");
      if (questionBtn) questionBtn.classList.toggle("active", tab === "question");
      if (bagBtn) bagBtn.classList.toggle("active", tab === "bag");
    }

    function getHpPercent(value, maxValue) {
      if (!maxValue) return 0;
      return Math.max(0, Math.min(100, (value / maxValue) * 100));
    }

    function updateBattleHud() {
      const enemyHpText = document.getElementById("battleEnemyHpText");
      const enemyHpFill = document.getElementById("battleEnemyHpFill");
      const playerHpText = document.getElementById("battlePlayerHpText");
      const playerHpFill = document.getElementById("battlePlayerHpFill");
      const timerText = document.getElementById("battleTimerText");
      const timerFill = document.getElementById("battleTimerFill");

      if (enemyHpText) enemyHpText.textContent = `${battleState.enemyHp}/${battleState.enemyMaxHp}`;
      if (enemyHpFill) enemyHpFill.style.width = `${getHpPercent(battleState.enemyHp, battleState.enemyMaxHp)}%`;
      if (playerHpText) playerHpText.textContent = `${battleState.playerHp}/${battleState.playerMaxHp}`;
      if (playerHpFill) playerHpFill.style.width = `${getHpPercent(battleState.playerHp, battleState.playerMaxHp)}%`;
      if (timerText) timerText.textContent = `${battleState.timeLeft}s`;
      if (timerFill) timerFill.style.width = `${getHpPercent(battleState.timeLeft, battleState.timeLimit)}%`;
    }

    function startBattleTimer() {
      clearBattleTimer();
      battleState.timeLeft = battleState.timeLimit;
      updateBattleHud();

      battleState.timerId = window.setInterval(() => {
        if (!battleState.active || battleState.locked || !enemyPanelOpen || window.VoltzDevMenu?.isOpen?.()) return;

        battleState.timeLeft -= 1;
        updateBattleHud();

        if (battleState.timeLeft <= 0) {
          handleBattleTimeout();
        }
      }, 1000);
    }

    function handleBattleTimeout() {
      if (!battleState.active || battleState.locked || !currentEnemy) return;

      clearBattleTimer();
      battleState.locked = true;
      enemyQuestionAnswered = true;

      const type = getEnemyType(currentEnemy);
      const damage = type.playerDamageOnTimeout || 5;
      battleState.playerHp = Math.max(0, battleState.playerHp - damage);

      document.querySelectorAll(".enemy-option-btn").forEach((button) => {
        button.disabled = true;
        const buttonLetter = button.querySelector("strong")?.textContent;
        if (buttonLetter === currentEnemyQuestion.answer) button.classList.add("correct");
      });

      const correctText = currentEnemyQuestion.options[currentEnemyQuestion.answer];
      showBattleFeedback("wrong", `Tempo esgotado! Você sofreu ${damage} de dano. Resposta correta: ${currentEnemyQuestion.answer}) ${correctText}. ${currentEnemyQuestion.explanation}`);
      triggerBattleEffect("player-hit", `-${damage}`);
      updateBattleHud();

      if (battleState.playerHp <= 0) {
        showBattleDefeat();
        return;
      }

      showBattleNextButton("Continuar");
    }

    function getGuardianThresholdHp(type) {
      const percent = Number(type?.guardianChallenge?.stopAtPercent);
      if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return null;
      return Math.round((battleState.enemyMaxHp * percent) / 100);
    }

    function shouldTriggerGuardianRecognition(type, nextHp) {
      const threshold = getGuardianThresholdHp(type);
      return Boolean(
        threshold !== null &&
        !battleState.guardianRecognitionActive &&
        nextHp <= threshold
      );
    }

    async function beginGuardianRecognition(type) {
      if (!currentEnemy || battleState.guardianRecognitionActive) return;

      clearBattleTimer();
      battleState.guardianRecognitionActive = true;
      battleState.locked = true;
      battleState.active = false;
      battleState.resultMode = true;
      battleState.guardianDialogueIndex = 0;
      enemyQuestionAnswered = false;

      const guardianSnapshot = { ...currentEnemy };
      const challenge = type.guardianChallenge || {};
      const realmId = typeof window.getActiveRealmProgressKey === "function"
        ? window.getActiveRealmProgressKey()
        : "reino-matematica";

      enemyPanel.innerHTML = `
        <div class="battle-result-card guardian-recognition-card">
          <div class="battle-result-icon guardian-recognition-icon">∑</div>
          <div class="enemy-panel-kicker">O combate foi interrompido</div>
          <div class="enemy-panel-title">${escapeHtml(type.name)} ergue a mão.</div>
          <p>O guardião alcançou o ponto que precisava para avaliar sua jornada.</p>
          <div class="battle-auto-return">Registrando o resultado do teste...</div>
        </div>
      `;

      try {
        battleState.guardianSaveResult = await window.VoltzProfile?.completeGuardianChallenge?.(
          realmId,
          guardianSnapshot,
          { xp: type.xpReward || 0, coins: type.coinReward || 0 },
          challenge.diploma || {}
        );
      } catch (error) {
        console.error("Falha ao concluir desafio do guardião:", error);
        battleState.guardianSaveResult = { ok: false, persisted: false, error };
      }

      renderGuardianDialogue(type);
    }

    function renderGuardianDialogue(type) {
      const challenge = type.guardianChallenge || {};
      const lines = Array.isArray(challenge.dialogue) && challenge.dialogue.length
        ? challenge.dialogue
        : ["Basta.", "Seu teste foi concluído."];
      const index = Math.min(battleState.guardianDialogueIndex, lines.length);

      if (index >= lines.length) {
        renderGuardianDiploma(type);
        return;
      }

      enemyPanel.innerHTML = `
        <div class="battle-result-card guardian-dialogue-card">
          <div class="battle-result-icon guardian-recognition-icon">∑</div>
          <div class="enemy-panel-kicker">${escapeHtml(type.name)}</div>
          <div class="guardian-dialogue-quote">“${escapeHtml(lines[index])}”</div>
          <div class="guardian-dialogue-progress">${index + 1}/${lines.length}</div>
          <button class="guardian-continue-btn" type="button" onclick="advanceGuardianDialogue()">Continuar</button>
        </div>
      `;
    }

    function renderGuardianDiploma(type) {
      const diploma = type.guardianChallenge?.diploma || {};
      const saveResult = battleState.guardianSaveResult;
      const saveText = saveResult?.persisted === false
        ? "⚠ O progresso ficou apenas local. Verifique a conexão com o Supabase."
        : "✓ Diploma e conclusão do reino salvos no Supabase.";
      const rewardText = saveResult?.alreadyCompleted
        ? "Conclusão já registrada"
        : `+${type.xpReward || 0} XP · +${type.coinReward || 0} moedas`;

      enemyPanel.innerHTML = `
        <div class="battle-result-card guardian-diploma-card">
          <div class="guardian-diploma-seal">📜</div>
          <div class="enemy-panel-kicker">Reino da Matemática concluído</div>
          <div class="enemy-panel-title">${escapeHtml(diploma.name || "Diploma da Matemática")}</div>
          <p>O Golem não foi derrotado. Ele reconheceu que você demonstrou compreensão suficiente para concluir seu teste.</p>
          <div class="guardian-ability-card">
            <span>🧠</span>
            <div>
              <strong>${escapeHtml(diploma.abilityName || "Raciocínio Estruturado")}</strong>
              <small>${escapeHtml(diploma.abilityDescription || "Uma vez por batalha, elimina uma alternativa incorreta.")}</small>
            </div>
          </div>
          <div class="battle-reward-row"><span>${escapeHtml(rewardText)}</span></div>
          <div class="battle-auto-return ${saveResult?.persisted === false ? "save-warning" : ""}">${escapeHtml(saveText)}</div>
          <button class="guardian-continue-btn guardian-finish-btn" type="button" onclick="finishGuardianRecognition()">Receber diploma e voltar ao mapa</button>
        </div>
      `;
    }

    function advanceGuardianDialogue() {
      if (!currentEnemy || !battleState.guardianRecognitionActive) return;
      battleState.guardianDialogueIndex += 1;
      renderGuardianDialogue(getEnemyType(currentEnemy));
    }

    function finishGuardianRecognition() {
      if (!battleState.guardianRecognitionActive) return;
      closeEnemyPanel({ force: true, skipProgressUpdate: true });
      interactionText.textContent = "Diploma da Matemática conquistado. Raciocínio Estruturado foi desbloqueado permanentemente!";
    }

    function answerEnemyQuestion(letter) {
      if (!enemyPanelOpen || !currentEnemy || !currentEnemyQuestion || battleState.locked) return;

      clearBattleTimer();
      battleState.locked = true;
      enemyQuestionAnswered = true;

      const type = getEnemyType(currentEnemy);
      const isCorrect = letter === currentEnemyQuestion.answer;

      document.querySelectorAll(".enemy-option-btn").forEach((button) => {
        button.disabled = true;
        const buttonLetter = button.querySelector("strong")?.textContent;

        if (buttonLetter === currentEnemyQuestion.answer) {
          button.classList.add("correct");
        }

        if (buttonLetter === letter && !isCorrect) {
          button.classList.add("wrong");
        }
      });

      let guardianRecognitionTriggered = false;

      if (isCorrect) {
        const damage = type.enemyDamageOnCorrect || 25;
        const rawNextHp = Math.max(0, battleState.enemyHp - damage);
        guardianRecognitionTriggered = shouldTriggerGuardianRecognition(type, rawNextHp);
        const thresholdHp = getGuardianThresholdHp(type);
        battleState.enemyHp = guardianRecognitionTriggered && thresholdHp !== null ? thresholdHp : rawNextHp;
        showBattleFeedback("correct", guardianRecognitionTriggered
          ? `Acertou! ${currentEnemyQuestion.explanation} O ${type.name} interrompeu o combate.`
          : `Acertou! ${currentEnemyQuestion.explanation} O ${type.name} sofreu ${damage} de dano.`);
        triggerBattleEffect("enemy-hit", guardianRecognitionTriggered ? "50%" : `-${damage}`);
      } else {
        const damage = type.playerDamageOnWrong || 15;
        battleState.playerHp = Math.max(0, battleState.playerHp - damage);
        const correctText = currentEnemyQuestion.options[currentEnemyQuestion.answer];
        showBattleFeedback("wrong", `Ainda não. Resposta correta: ${currentEnemyQuestion.answer}) ${correctText}. ${currentEnemyQuestion.explanation} Você sofreu ${damage} de dano.`);
        triggerBattleEffect("player-hit", `-${damage}`);
      }

      updateBattleHud();

      if (guardianRecognitionTriggered) {
        // Bloqueia o fechamento manual durante a breve transição até o diálogo.
        battleState.resultMode = true;
        window.setTimeout(() => beginGuardianRecognition(type), 650);
        return;
      }

      if (battleState.enemyHp <= 0) {
        showBattleVictory();
        return;
      }

      if (battleState.playerHp <= 0) {
        showBattleDefeat();
        return;
      }

      showBattleNextButton("Próxima pergunta");
    }

    function showBattleFeedback(kind, text) {
      const feedback = document.getElementById("enemyFeedback");
      if (!feedback) return;

      feedback.className = `enemy-feedback visible ${kind}`;
      feedback.textContent = text;
    }

    function showBattleNextButton(text) {
      const nextButton = document.getElementById("enemyNextButton");
      if (!nextButton) return;

      nextButton.textContent = text;
      nextButton.classList.add("visible");
    }

    function triggerBattleEffect(kind, text) {
      const stage = document.getElementById("battleEnemyStage");
      const float = document.getElementById("battleDamageFloat");
      const panel = enemyPanel;

      if (kind === "enemy-hit" && stage) {
        stage.classList.remove("enemy-damaged");
        void stage.offsetWidth;
        stage.classList.add("enemy-damaged");
      }

      if (kind === "player-hit" && panel) {
        panel.classList.remove("player-damaged");
        void panel.offsetWidth;
        panel.classList.add("player-damaged");
      }

      if (float) {
        float.textContent = text;
        float.classList.remove("visible");
        void float.offsetWidth;
        float.classList.add("visible");
      }
    }

    async function showBattleVictory() {
      if (!currentEnemy) return;

      clearBattleTimer();
      const type = getEnemyType(currentEnemy);
      const defeatedEnemySnapshot = { ...currentEnemy };
      const realmId = typeof window.getActiveRealmProgressKey === "function"
        ? window.getActiveRealmProgressKey()
        : (typeof window.getActiveSceneId === "function" ? window.getActiveSceneId() : "");
      const xpReward = type.xpReward || 40;
      const coinReward = type.coinReward || 12;

      if (defeatedEnemySnapshot.trainingBattle) {
        battleState.locked = true;
        battleState.active = false;
        battleState.resultMode = true;
        enemyQuestionAnswered = false;

        enemyPanel.innerHTML = `
          <div class="battle-result-card victory battle-auto-result">
            <div class="battle-result-icon battle-result-icon-victory">◇</div>
            <div class="enemy-panel-kicker">Simulação concluída</div>
            <div class="enemy-panel-title">Treino finalizado!</div>
            <p>Você venceu o ${escapeHtml(type.name)}. Nenhum XP, moeda, consumível ou progresso do mundo foi alterado.</p>
            <div class="battle-auto-return">Reiniciando o Núcleo de Treino e voltando à Arena em 3 segundos...</div>
          </div>`;

        scheduleBattleAutoReturn(() => {
          closeEnemyPanel({ force: true, skipProgressUpdate: true });
        });
        return;
      }

      battleState.locked = true;
      battleState.active = false;
      battleState.resultMode = true;
      enemyQuestionAnswered = false;

      enemyPanel.innerHTML = `
        <div class="battle-result-card victory battle-auto-result">
          <div class="battle-result-icon battle-result-icon-victory">⚡</div>
          <div class="enemy-panel-kicker">Vitória</div>
          <div class="enemy-panel-title">${escapeHtml(type.name)} derrotado!</div>
          <p>Você venceu o desafio de ${escapeHtml(type.role)}.</p>
          <div class="battle-reward-row" id="battleRewardRow">
            <span>+${xpReward} XP</span>
            <span>+${coinReward} moedas</span>
          </div>
          <div class="battle-auto-return" id="battleSaveStatus">Salvando progresso...</div>
        </div>
      `;

      let saveResult = null;

      try {
        if (window.VoltzProfile?.completeEncounter && realmId) {
          saveResult = await window.VoltzProfile.completeEncounter(
            realmId,
            defeatedEnemySnapshot,
            { xp: xpReward, coins: coinReward }
          );
        } else if (window.VoltzProfile?.addRewards) {
          await window.VoltzProfile.addRewards(xpReward, coinReward);
          saveResult = { ok: true, persisted: true, alreadyCompleted: false };
        }
      } catch (error) {
        console.error("Falha ao registrar vitória:", error);
        saveResult = { ok: false, persisted: false, error };
      }

      const saveStatus = document.getElementById("battleSaveStatus");
      const rewardRow = document.getElementById("battleRewardRow");

      if (saveResult?.alreadyCompleted) {
        if (rewardRow) {
          rewardRow.innerHTML = "<span>Vitória já registrada</span>";
        }
        if (saveStatus) {
          saveStatus.textContent = "Esse inimigo já estava salvo como derrotado. Voltando ao mapa em 3 segundos...";
        }
      } else if (saveResult?.persisted === false) {
        if (saveStatus) {
          saveStatus.textContent = "⚠ Não foi possível confirmar o salvamento no banco. Voltando ao mapa em 3 segundos...";
        }
      } else if (saveStatus) {
        saveStatus.textContent = "✓ Progresso salvo. Voltando ao mapa em 3 segundos...";
      }

      scheduleBattleAutoReturn(() => {
        closeEnemyPanel({ force: true, skipProgressUpdate: true });
        if (typeof completeEnemyDefeatFromBattle === "function") {
          completeEnemyDefeatFromBattle(defeatedEnemySnapshot);
        }
      });
    }


    function showBattleDefeat() {
      clearBattleTimer();
      battleState.locked = true;
      battleState.active = false;
      battleState.resultMode = true;
      enemyQuestionAnswered = false;

      enemyPanel.innerHTML = `
        <div class="battle-result-card defeat battle-auto-result">
          <div class="battle-result-icon battle-result-icon-defeat">◇</div>
          <div class="enemy-panel-kicker">Energia esgotada</div>
          <div class="enemy-panel-title">Você recuou do combate</div>
          <p>O Voltinho estabilizou sua energia. Volte ao mapa, respire e tente outro desafio quando estiver pronto.</p>
          <div class="battle-auto-return">Voltando ao mapa em 3 segundos...</div>
        </div>
      `;

      scheduleBattleAutoReturn(() => {
        closeEnemyPanel({ force: true });
      });
    }

    function nextEnemyQuestion() {
      if (!currentEnemy || !battleState.active) return;

      const type = getEnemyType(currentEnemy);
      enemyQuestionAnswered = false;
      battleState.locked = false;
      battleState.hintRevealed = false;
      battleState.hintBusy = false;
      battleState.bagMessage = "";
      battleState.eliminatedOptionLetter = "";
      currentEnemyQuestion = drawNextBattleQuestion(type);
      renderBattleScreen();
      startBattleTimer();
    }

    function closeEnemyPanel(options = {}) {
      if (battleState.resultMode && !options.force) return;
      clearBattleTimer();
      clearBattleOutcomeTimer();
      battleState.active = false;
      battleState.locked = false;
      battleState.resultMode = false;
      enemyPanelOpen = false;
      currentEnemy = null;
      currentEnemyQuestion = null;
      battleState.questionDeck = [];
      battleState.questionDeckIndex = 0;
      battleState.questionsAsked = 0;
      battleState.hintRevealed = false;
      battleState.hintBusy = false;
      battleState.bagMessage = "";
      battleState.structuredReasoningUsed = false;
      battleState.eliminatedOptionLetter = "";
      battleState.guardianRecognitionActive = false;
      battleState.guardianDialogueIndex = 0;
      battleState.guardianSaveResult = null;
      enemyQuestionAnswered = false;
      enemyPanel.classList.remove("visible", "battle-mode", "player-damaged");
      enemyPanel.innerHTML = "";
      document.body.classList.remove("battle-active");

      // O estado salvo pode ter feito um NPC/objeto surgir no ponto onde a batalha
      // começou. Garante que o jogador nunca volte ao mapa preso dentro do novo colisor.
      window.releasePlayerFromCollision?.();
      updateHint();
    }

    function getBattleEnemySvg(type) {
      if (type.battleImage) {
        return getBattleEnemyImage(type);
      }

      if (type.id === "multiplicacao-divisao") return getFatorBattleSvg(type);
      if (type.id === "potencia-radiciacao") return getRaizBattleSvg(type);
      return getSomaBattleSvg(type);
    }

    function getBattleEnemyImage(type) {
      const rankClass = type.id === "chefe-golem-calculos" ? "battle-enemy-img-boss" : "battle-enemy-img-miniboss";
      return `
        <div class="battle-enemy-image-wrap ${rankClass}">
          <img class="battle-enemy-image" src="${escapeHtml(type.battleImage)}" alt="${escapeHtml(type.name)}" />
        </div>
      `;
    }

    function getSomaBattleSvg(type) {
      return `
        <svg class="battle-enemy-svg" viewBox="0 0 360 300" role="img" aria-label="${escapeHtml(type.name)}">
          <ellipse cx="180" cy="248" rx="94" ry="22" fill="rgba(0,0,0,0.32)"></ellipse>
          <circle cx="180" cy="135" r="78" fill="rgba(0,234,255,0.88)" stroke="rgba(255,255,255,0.9)" stroke-width="8"></circle>
          <circle cx="180" cy="135" r="46" fill="rgba(255,209,102,0.9)" stroke="rgba(2,4,13,0.55)" stroke-width="6"></circle>
          <path d="M180 68 L198 30 L209 73" fill="none" stroke="rgba(255,209,102,0.95)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M91 130 C44 110, 41 72, 84 53" fill="none" stroke="rgba(120,247,255,0.88)" stroke-width="13" stroke-linecap="round"></path>
          <path d="M269 130 C316 110, 319 72, 276 53" fill="none" stroke="rgba(255,209,102,0.82)" stroke-width="13" stroke-linecap="round"></path>
          <text x="90" y="66" text-anchor="middle" fill="#02040d" font-size="46" font-weight="900">+</text>
          <text x="270" y="66" text-anchor="middle" fill="#02040d" font-size="54" font-weight="900">−</text>
          <circle cx="155" cy="126" r="10" fill="#02040d"></circle>
          <circle cx="205" cy="126" r="10" fill="#02040d"></circle>
          <path d="M151 167 C167 181, 194 181, 210 167" fill="none" stroke="#02040d" stroke-width="9" stroke-linecap="round"></path>
          <path d="M143 219 L116 260" stroke="rgba(255,255,255,0.86)" stroke-width="13" stroke-linecap="round"></path>
          <path d="M217 219 L244 260" stroke="rgba(255,255,255,0.86)" stroke-width="13" stroke-linecap="round"></path>
        </svg>
      `;
    }

    function getFatorBattleSvg(type) {
      return `
        <svg class="battle-enemy-svg" viewBox="0 0 360 300" role="img" aria-label="${escapeHtml(type.name)}">
          <ellipse cx="180" cy="250" rx="104" ry="22" fill="rgba(0,0,0,0.34)"></ellipse>
          <path d="M105 112 C105 55, 157 42, 180 86 C203 42, 255 55, 255 112 C255 177, 218 217, 180 231 C142 217, 105 177, 105 112Z" fill="rgba(146,87,255,0.9)" stroke="rgba(255,255,255,0.9)" stroke-width="8"></path>
          <path d="M180 82 V226" stroke="rgba(120,247,255,0.7)" stroke-width="7" stroke-linecap="round"></path>
          <circle cx="145" cy="125" r="36" fill="rgba(0,234,255,0.8)"></circle>
          <circle cx="215" cy="125" r="36" fill="rgba(255,209,102,0.84)"></circle>
          <text x="145" y="140" text-anchor="middle" fill="#02040d" font-size="46" font-weight="900">×</text>
          <text x="215" y="140" text-anchor="middle" fill="#02040d" font-size="46" font-weight="900">÷</text>
          <circle cx="151" cy="179" r="9" fill="#02040d"></circle>
          <circle cx="209" cy="179" r="9" fill="#02040d"></circle>
          <path d="M153 205 C169 216, 191 216, 207 205" fill="none" stroke="#02040d" stroke-width="8" stroke-linecap="round"></path>
          <path d="M104 149 L54 123" stroke="rgba(120,247,255,0.88)" stroke-width="13" stroke-linecap="round"></path>
          <path d="M256 149 L306 123" stroke="rgba(255,209,102,0.88)" stroke-width="13" stroke-linecap="round"></path>
        </svg>
      `;
    }

    function getRaizBattleSvg(type) {
      return `
        <svg class="battle-enemy-svg" viewBox="0 0 360 300" role="img" aria-label="${escapeHtml(type.name)}">
          <ellipse cx="180" cy="250" rx="96" ry="22" fill="rgba(0,0,0,0.34)"></ellipse>
          <path d="M180 36 L267 97 L236 220 L180 262 L124 220 L93 97Z" fill="rgba(255,209,102,0.86)" stroke="rgba(255,255,255,0.9)" stroke-width="8" stroke-linejoin="round"></path>
          <path d="M180 55 L242 101 L220 201 L180 231 L140 201 L118 101Z" fill="rgba(146,87,255,0.84)" stroke="rgba(120,247,255,0.72)" stroke-width="6" stroke-linejoin="round"></path>
          <path d="M119 128 H160 L176 190 L231 91" fill="none" stroke="rgba(120,247,255,0.96)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"></path>
          <text x="239" y="91" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-size="38" font-weight="900">²</text>
          <circle cx="158" cy="158" r="9" fill="#02040d"></circle>
          <circle cx="202" cy="158" r="9" fill="#02040d"></circle>
          <path d="M157 194 C169 204, 191 204, 203 194" fill="none" stroke="#02040d" stroke-width="8" stroke-linecap="round"></path>
          <path d="M119 95 C78 83, 58 50, 83 24" fill="none" stroke="rgba(120,247,255,0.74)" stroke-width="10" stroke-linecap="round"></path>
          <path d="M241 95 C282 83, 302 50, 277 24" fill="none" stroke="rgba(255,209,102,0.76)" stroke-width="10" stroke-linecap="round"></path>
        </svg>
      `;
    }


    function getMiniBossBattleSvg(type) {
      return `
        <svg class="battle-enemy-svg battle-enemy-svg-miniboss" viewBox="0 0 360 300" role="img" aria-label="${escapeHtml(type.name)}">
          <ellipse cx="180" cy="253" rx="112" ry="24" fill="rgba(0,0,0,0.36)"></ellipse>
          <path d="M180 38 L274 90 L260 188 L180 260 L100 188 L86 90Z" fill="rgba(255,77,125,0.86)" stroke="rgba(255,255,255,0.92)" stroke-width="8" stroke-linejoin="round"></path>
          <path d="M180 64 L239 99 L230 171 L180 219 L130 171 L121 99Z" fill="rgba(0,234,255,0.38)" stroke="rgba(255,209,102,0.74)" stroke-width="6" stroke-linejoin="round"></path>
          <text x="180" y="151" text-anchor="middle" fill="#02040d" font-size="60" font-weight="950">=?</text>
          <circle cx="144" cy="183" r="10" fill="#02040d"></circle>
          <circle cx="216" cy="183" r="10" fill="#02040d"></circle>
          <path d="M146 214 C163 226, 197 226, 214 214" fill="none" stroke="#02040d" stroke-width="8" stroke-linecap="round"></path>
          <path d="M91 105 C47 82, 42 45, 72 21" fill="none" stroke="rgba(120,247,255,0.9)" stroke-width="12" stroke-linecap="round"></path>
          <path d="M269 105 C313 82, 318 45, 288 21" fill="none" stroke="rgba(255,209,102,0.9)" stroke-width="12" stroke-linecap="round"></path>
        </svg>
      `;
    }

    function getMathBossBattleSvg(type) {
      return `
        <svg class="battle-enemy-svg battle-enemy-svg-boss" viewBox="0 0 380 310" role="img" aria-label="${escapeHtml(type.name)}">
          <ellipse cx="190" cy="266" rx="128" ry="26" fill="rgba(0,0,0,0.4)"></ellipse>
          <path d="M95 242 L122 83 L190 34 L258 83 L285 242 C258 282 122 282 95 242Z" fill="rgba(146,87,255,0.9)" stroke="rgba(255,255,255,0.92)" stroke-width="9" stroke-linejoin="round"></path>
          <path d="M125 229 L145 102 L190 70 L235 102 L255 229 C229 251 151 251 125 229Z" fill="rgba(255,209,102,0.82)" stroke="rgba(120,247,255,0.72)" stroke-width="7" stroke-linejoin="round"></path>
          <text x="190" y="160" text-anchor="middle" fill="#02040d" font-size="68" font-weight="950">∑</text>
          <text x="122" y="96" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="35" font-weight="950">+</text>
          <text x="258" y="96" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="35" font-weight="950">×</text>
          <circle cx="159" cy="188" r="11" fill="#02040d"></circle>
          <circle cx="221" cy="188" r="11" fill="#02040d"></circle>
          <path d="M158 223 C177 237, 203 237, 222 223" fill="none" stroke="#02040d" stroke-width="9" stroke-linecap="round"></path>
          <path d="M88 150 L36 104" stroke="rgba(120,247,255,0.9)" stroke-width="15" stroke-linecap="round"></path>
          <path d="M292 150 L344 104" stroke="rgba(255,209,102,0.9)" stroke-width="15" stroke-linecap="round"></path>
          <path d="M151 55 L170 17 L190 51 L210 17 L229 55" fill="none" stroke="rgba(255,209,102,0.96)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      `;
    }

window.closeEnemyPanel = closeEnemyPanel;
window.answerEnemyQuestion = answerEnemyQuestion;
window.nextEnemyQuestion = nextEnemyQuestion;
window.setBattleTab = setBattleTab;
window.useBattleHint = useBattleHint;
window.useStructuredReasoning = useStructuredReasoning;
window.advanceGuardianDialogue = advanceGuardianDialogue;
window.finishGuardianRecognition = finishGuardianRecognition;
