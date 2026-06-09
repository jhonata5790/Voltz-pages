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
  timerId: null,
  questionNumber: 1,
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

      enemyPanelOpen = true;
      currentEnemy = enemy;
      enemyQuestionAnswered = false;
      currentEnemyQuestion = getQuestionForEnemy(enemy);

      battleState.active = true;
      battleState.locked = false;
      battleState.playerMaxHp = 100;
      battleState.playerHp = 100;
      battleState.enemyMaxHp = type.maxHp || 100;
      battleState.enemyHp = battleState.enemyMaxHp;
      battleState.timeLimit = type.timeLimit || 30;
      battleState.timeLeft = battleState.timeLimit;
      battleState.questionNumber = (enemy.questionIndex % type.questions.length) + 1;
      battleState.currentTab = "question";
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
      const questionNumber = (currentEnemy.questionIndex % type.questions.length) + 1;
      battleState.questionNumber = questionNumber;

      enemyPanel.innerHTML = `
        <div class="battle-panel-inner enemy-theme-${type.id}">
          <div class="battle-topline">
            <div>
              <div class="enemy-panel-kicker">${escapeHtml(type.role)}</div>
              <div class="enemy-panel-title">${escapeHtml(type.name)}</div>
              <div class="enemy-panel-subtitle">${escapeHtml(type.description)}</div>
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
                  <span>Tempo</span>
                  <strong id="battleTimerText">${battleState.timeLeft}s</strong>
                </div>
                <div class="battle-timer-track">
                  <div class="battle-timer-fill" id="battleTimerFill" style="width: 100%"></div>
                </div>
              </div>

              <div class="enemy-question-card battle-question-card">
                <div class="enemy-question-tip">Dica: ${escapeHtml(q.tip)}</div>
                <div class="battle-question-count">Pergunta ${questionNumber}/${type.questions.length}</div>
                <div class="enemy-question-text">${escapeHtml(q.text)}</div>

                <div class="enemy-question-options" id="enemyQuestionOptions">
                  ${Object.entries(q.options).map(([letter, value]) => `
                    <button class="enemy-option-btn" type="button" onclick="answerEnemyQuestion('${letter}')">
                      <strong>${letter}</strong>
                      <span>${escapeHtml(value)}</span>
                    </button>
                  `).join("")}
                </div>

                <div class="enemy-feedback" id="enemyFeedback"></div>
                <button class="enemy-next-btn" id="enemyNextButton" type="button" onclick="nextEnemyQuestion()">Próxima pergunta</button>
              </div>
              </section>
            </div>
          </div>

          <div id="battleBagTab" class="battle-tab-content">
            <div class="battle-bag-empty">
              <div>
                <strong>Mochila vazia</strong>
                <p>Nenhum item equipado ainda. Esta aba já ficou reservada para dicas, cura e bônus futuros.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      updateBattleHud();
      setBattleTab(battleState.currentTab || "question");
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
        if (!battleState.active || battleState.locked || !enemyPanelOpen) return;

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

      showBattleFeedback("wrong", `Tempo esgotado! Você sofreu ${damage} de dano. Resposta correta: ${currentEnemyQuestion.answer}. ${currentEnemyQuestion.explanation}`);
      triggerBattleEffect("player-hit", `-${damage}`);
      updateBattleHud();

      if (battleState.playerHp <= 0) {
        showBattleDefeat();
        return;
      }

      showBattleNextButton("Continuar");
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

      if (isCorrect) {
        const damage = type.enemyDamageOnCorrect || 25;
        battleState.enemyHp = Math.max(0, battleState.enemyHp - damage);
        showBattleFeedback("correct", `Acertou! ${currentEnemyQuestion.explanation} O ${type.name} sofreu ${damage} de dano.`);
        triggerBattleEffect("enemy-hit", `-${damage}`);
      } else {
        const damage = type.playerDamageOnWrong || 15;
        battleState.playerHp = Math.max(0, battleState.playerHp - damage);
        showBattleFeedback("wrong", `Ainda não. Resposta correta: ${currentEnemyQuestion.answer}. ${currentEnemyQuestion.explanation} Você sofreu ${damage} de dano.`);
        triggerBattleEffect("player-hit", `-${damage}`);
      }

      updateBattleHud();

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

    function showBattleVictory() {
      if (!currentEnemy) return;

      clearBattleTimer();
      const type = getEnemyType(currentEnemy);
      const defeatedEnemySnapshot = { ...currentEnemy };

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
          <div class="battle-reward-row">
            <span>+${type.xpReward || 40} XP</span>
            <span>+${type.coinReward || 12} moedas</span>
          </div>
          <div class="battle-auto-return">Voltando ao mapa em 3 segundos...</div>
        </div>
      `;

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

      currentEnemy.questionIndex = (currentEnemy.questionIndex + 1) % getEnemyType(currentEnemy).questions.length;
      enemyQuestionAnswered = false;
      battleState.locked = false;
      currentEnemyQuestion = getQuestionForEnemy(currentEnemy);
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
      enemyQuestionAnswered = false;
      enemyPanel.classList.remove("visible", "battle-mode", "player-damaged");
      enemyPanel.innerHTML = "";
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
