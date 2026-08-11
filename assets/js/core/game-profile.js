import { supabase } from "../../../supabase.js";

const state = {
  session: null,
  user: null,
  profile: null,
  ready: false
};

const readyResolvers = [];
const ready = new Promise((resolve, reject) => {
  readyResolvers.push({ resolve, reject });
});

function getField(profile, candidates, fallback = 0) {
  for (const key of candidates) {
    if (profile && Object.prototype.hasOwnProperty.call(profile, key)) {
      return profile[key] ?? fallback;
    }
  }
  return fallback;
}

function getFieldName(profile, candidates) {
  return candidates.find((key) => profile && Object.prototype.hasOwnProperty.call(profile, key)) || null;
}

function cloneJson(value, fallback = {}) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function normalizeRealmProgress(realmProgress) {
  const source = realmProgress && typeof realmProgress === "object"
    ? cloneJson(realmProgress)
    : {};

  const defeatedEnemyIds = Array.isArray(source.defeatedEnemyIds)
    ? [...new Set(source.defeatedEnemyIds.filter((id) => typeof id === "string" && id.trim()))]
    : [];

  const solvedWorldEquationIds = Array.isArray(source.solvedWorldEquationIds)
    ? [...new Set(source.solvedWorldEquationIds.filter((id) => typeof id === "string" && id.trim()))]
    : [];

  return {
    ...source,
    defeatedEnemyIds,
    solvedWorldEquationIds,
    miniBossDefeated: Boolean(source.miniBossDefeated),
    bossDefeated: Boolean(source.bossDefeated),
    completed: Boolean(source.completed || source.bossDefeated)
  };
}

function getEncounterKind(enemySnapshot) {
  const rank = String(enemySnapshot?.enemyRank || "").toLowerCase();

  if (
    enemySnapshot?.isBoss === true ||
    rank === "boss" ||
    rank === "chefe" ||
    enemySnapshot?.typeId === "chefe-golem-calculos"
  ) {
    return "boss";
  }

  if (
    enemySnapshot?.isMiniBoss === true ||
    rank === "miniboss" ||
    rank === "mini-boss" ||
    rank === "mini_chefe" ||
    rank === "mini-chefe" ||
    enemySnapshot?.typeId === "mini-chefe-equacao"
  ) {
    return "miniBoss";
  }

  return "common";
}

function isEncounterCompleted(realmProgress, enemySnapshot) {
  const kind = getEncounterKind(enemySnapshot);

  if (kind === "boss") return Boolean(realmProgress.bossDefeated);
  if (kind === "miniBoss") return Boolean(realmProgress.miniBossDefeated);

  return Boolean(
    enemySnapshot?.id &&
    realmProgress.defeatedEnemyIds.includes(enemySnapshot.id)
  );
}

function applyEncounterCompletion(realmProgress, enemySnapshot) {
  const next = normalizeRealmProgress(realmProgress);
  const kind = getEncounterKind(enemySnapshot);

  if (kind === "boss") {
    next.bossDefeated = true;
    next.completed = true;
    next.completedAt = next.completedAt || new Date().toISOString();
  } else if (kind === "miniBoss") {
    next.miniBossDefeated = true;
  } else if (enemySnapshot?.id && !next.defeatedEnemyIds.includes(enemySnapshot.id)) {
    next.defeatedEnemyIds.push(enemySnapshot.id);
  }

  next.lastVictoryAt = new Date().toISOString();
  return next;
}

function normalizeProfile(profile, user) {
  const metadata = user?.user_metadata || {};
  const dbFields = {
    xp: getFieldName(profile, ["xp"]) || "xp",
    coins: getFieldName(profile, ["moedas", "coins"]) || "moedas",
    combo: getFieldName(profile, ["combo"]) || "combo",
    rank: getFieldName(profile, ["rank"]) || "rank",
    progress: getFieldName(profile, ["progresso", "progress"]) || "progresso"
  };

  return {
    ...profile,
    nome: profile?.nome || metadata.nome || user?.email?.split("@")[0] || "Aluno",
    escolaridade: profile?.escolaridade || metadata.escolaridade || "",
    xp: Number(getField(profile, ["xp"], 0)) || 0,
    moedas: Number(getField(profile, ["moedas", "coins"], 0)) || 0,
    combo: Number(getField(profile, ["combo"], 0)) || 0,
    rank: getField(profile, ["rank"], "Iniciante") || "Iniciante",
    progresso: getField(profile, ["progresso", "progress"], {}) || {},
    _dbFields: dbFields
  };
}

function setAuthOverlay(message, isError = false) {
  const overlay = document.getElementById("authGate");
  const text = document.getElementById("authGateText");
  if (text) text.textContent = message;
  if (overlay) overlay.classList.toggle("auth-gate-error", isError);
}

function hideAuthOverlay() {
  const overlay = document.getElementById("authGate");
  if (overlay) overlay.classList.add("hidden");
}

function renderProfileHud() {
  const profile = state.profile;
  if (!profile) return;

  const name = document.getElementById("profileName");
  const xp = document.getElementById("profileXp");
  const coins = document.getElementById("profileCoins");
  const combo = document.getElementById("profileCombo");

  if (name) name.textContent = profile.nome;
  if (xp) xp.textContent = `${profile.xp} XP`;
  if (coins) coins.textContent = `${profile.moedas} moedas`;
  if (combo) combo.textContent = `Combo ${profile.combo}`;
}

async function fetchOrCreateProfile(user) {
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!profile) {
    const metadata = user.user_metadata || {};
    const payload = {
      id: user.id,
      nome: metadata.nome || user.email?.split("@")[0] || "Aluno",
      escolaridade: metadata.escolaridade || ""
    };

    const created = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (created.error) throw created.error;
    profile = created.data;
  }

  return profile;
}

async function updateProfileFields(fields) {
  if (!state.user || !state.profile) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", state.user.id)
    .select("*")
    .single();

  if (error) throw error;

  state.profile = normalizeProfile(data, state.user);
  renderProfileHud();
  window.dispatchEvent(new CustomEvent("voltz:profile-updated", { detail: state.profile }));
  return state.profile;
}

async function addRewards(xpAmount = 0, coinAmount = 0) {
  await ready;
  if (!state.profile) return null;

  const xpField = state.profile._dbFields?.xp || "xp";
  const coinField = state.profile._dbFields?.coins || "moedas";

  const nextXp = Math.max(0, Number(state.profile.xp || 0) + Number(xpAmount || 0));
  const nextCoins = Math.max(0, Number(state.profile.moedas || 0) + Number(coinAmount || 0));

  const fields = {
    [xpField]: nextXp,
    [coinField]: nextCoins
  };

  try {
    return await updateProfileFields(fields);
  } catch (error) {
    console.error("Não foi possível salvar as recompensas no Supabase:", error);
    // Mantém a sessão jogável mesmo se a migration ainda não tiver sido aplicada.
    state.profile.xp = nextXp;
    state.profile.moedas = nextCoins;
    renderProfileHud();
    return state.profile;
  }
}

function getRealmProgress(realmId) {
  const progress = state.profile?.progresso || {};
  const realmProgress = progress[realmId];
  if (!realmProgress || typeof realmProgress !== "object") return null;
  return normalizeRealmProgress(realmProgress);
}

async function setRealmProgress(realmId, realmProgress) {
  await ready;
  if (!state.profile || !realmId) return null;

  const progressField = state.profile._dbFields?.progress || "progresso";
  const currentProgress = state.profile.progresso && typeof state.profile.progresso === "object"
    ? state.profile.progresso
    : {};

  const nextProgress = {
    ...currentProgress,
    [realmId]: JSON.parse(JSON.stringify(realmProgress || {}))
  };

  try {
    const updated = await updateProfileFields({ [progressField]: nextProgress });
    if (updated) updated.progresso = nextProgress;
    return updated;
  } catch (error) {
    console.error(`Não foi possível salvar o progresso de ${realmId}:`, error);
    state.profile.progresso = nextProgress;
    return state.profile;
  }
}


async function resetRealmProgress(realmId) {
  await ready;
  if (!state.profile || !realmId) return { ok: false, persisted: false, reason: "invalid-state" };

  const progressField = state.profile._dbFields?.progress || "progresso";
  const currentProgress = state.profile.progresso && typeof state.profile.progresso === "object"
    ? cloneJson(state.profile.progresso)
    : {};

  const currentWorld = currentProgress._world && typeof currentProgress._world === "object"
    ? cloneJson(currentProgress._world)
    : {};

  const completedRealmIds = Array.isArray(currentWorld.completedRealmIds)
    ? currentWorld.completedRealmIds.filter((id) => id !== realmId)
    : [];

  const nextProgress = {
    ...currentProgress,
    [realmId]: normalizeRealmProgress({}),
    _world: {
      ...currentWorld,
      completedRealmIds,
      lastProgressAt: new Date().toISOString()
    }
  };

  try {
    const updated = await updateProfileFields({ [progressField]: nextProgress });
    if (updated) updated.progresso = nextProgress;
    return { ok: true, persisted: true, profile: updated };
  } catch (error) {
    console.error(`Não foi possível reiniciar o progresso de ${realmId}:`, error);
    state.profile.progresso = nextProgress;
    window.dispatchEvent(new CustomEvent("voltz:profile-updated", { detail: state.profile }));
    return { ok: true, persisted: false, profile: state.profile, error };
  }
}

async function completeEncounter(realmId, enemySnapshot, rewards = {}) {
  await ready;

  if (!state.profile || !realmId || !enemySnapshot) {
    return { ok: false, persisted: false, reason: "invalid-state" };
  }

  const currentProgress = state.profile.progresso && typeof state.profile.progresso === "object"
    ? cloneJson(state.profile.progresso)
    : {};

  const currentRealmProgress = normalizeRealmProgress(currentProgress[realmId]);

  // Idempotência: um inimigo já vencido nunca entrega XP/moedas pela segunda vez.
  if (isEncounterCompleted(currentRealmProgress, enemySnapshot)) {
    return {
      ok: true,
      persisted: true,
      alreadyCompleted: true,
      xpReward: 0,
      coinReward: 0,
      realmProgress: currentRealmProgress,
      profile: state.profile
    };
  }

  const xpReward = Math.max(0, Number(rewards.xp || rewards.xpReward || 0)) || 0;
  const coinReward = Math.max(0, Number(rewards.coins || rewards.coinReward || 0)) || 0;
  const nextRealmProgress = applyEncounterCompletion(currentRealmProgress, enemySnapshot);

  const nextProgress = {
    ...currentProgress,
    [realmId]: nextRealmProgress
  };

  // Mantém também um resumo global útil para ranking/desbloqueios futuros.
  const currentWorld = currentProgress._world && typeof currentProgress._world === "object"
    ? cloneJson(currentProgress._world)
    : {};

  const completedRealmIds = Array.isArray(currentWorld.completedRealmIds)
    ? [...new Set(currentWorld.completedRealmIds.filter((id) => typeof id === "string"))]
    : [];

  if (nextRealmProgress.completed && !completedRealmIds.includes(realmId)) {
    completedRealmIds.push(realmId);
  }

  nextProgress._world = {
    ...currentWorld,
    completedRealmIds,
    lastProgressAt: new Date().toISOString()
  };

  const xpField = state.profile._dbFields?.xp || "xp";
  const coinField = state.profile._dbFields?.coins || "moedas";
  const progressField = state.profile._dbFields?.progress || "progresso";

  const nextXp = Math.max(0, Number(state.profile.xp || 0) + xpReward);
  const nextCoins = Math.max(0, Number(state.profile.moedas || 0) + coinReward);

  try {
    const updated = await updateProfileFields({
      [xpField]: nextXp,
      [coinField]: nextCoins,
      [progressField]: nextProgress
    });

    if (updated) updated.progresso = nextProgress;

    return {
      ok: true,
      persisted: true,
      alreadyCompleted: false,
      xpReward,
      coinReward,
      realmProgress: nextRealmProgress,
      profile: updated
    };
  } catch (error) {
    console.error(`Não foi possível salvar a vitória em ${realmId}:`, error);

    // Mantém a sessão coerente, mas sinaliza que o banco não confirmou.
    state.profile.xp = nextXp;
    state.profile.moedas = nextCoins;
    state.profile.progresso = nextProgress;
    renderProfileHud();
    window.dispatchEvent(new CustomEvent("voltz:profile-updated", { detail: state.profile }));

    return {
      ok: true,
      persisted: false,
      alreadyCompleted: false,
      xpReward,
      coinReward,
      realmProgress: nextRealmProgress,
      profile: state.profile,
      error
    };
  }
}


function getInventory() {
  const progress = state.profile?.progresso;
  const inventory = progress && typeof progress === "object" ? progress._inventory : null;
  return inventory && typeof inventory === "object"
    ? JSON.parse(JSON.stringify(inventory))
    : {};
}

function getItemCount(itemId) {
  if (!itemId) return 0;
  return Math.max(0, Number(getInventory()[itemId] || 0)) || 0;
}

async function saveInventory(nextInventory, extraFields = {}) {
  await ready;
  if (!state.profile) return null;

  const progressField = state.profile._dbFields?.progress || "progresso";
  const currentProgress = state.profile.progresso && typeof state.profile.progresso === "object"
    ? state.profile.progresso
    : {};

  const nextProgress = {
    ...currentProgress,
    _inventory: JSON.parse(JSON.stringify(nextInventory || {}))
  };

  try {
    const updated = await updateProfileFields({
      ...extraFields,
      [progressField]: nextProgress
    });
    if (updated) updated.progresso = nextProgress;
    return updated;
  } catch (error) {
    console.error("Não foi possível salvar o inventário:", error);
    state.profile.progresso = nextProgress;

    const coinField = state.profile._dbFields?.coins || "moedas";
    if (Object.prototype.hasOwnProperty.call(extraFields, coinField)) {
      state.profile.moedas = Math.max(0, Number(extraFields[coinField] || 0));
    }

    renderProfileHud();
    window.dispatchEvent(new CustomEvent("voltz:profile-updated", { detail: state.profile }));
    return state.profile;
  }
}

async function purchaseItem(itemId, unitPrice, quantity = 1) {
  await ready;
  if (!state.profile || !itemId) return { ok: false, reason: "profile" };

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const price = Math.max(0, Number(unitPrice) || 0);
  const total = price * qty;
  const currentCoins = Math.max(0, Number(state.profile.moedas || 0));

  if (currentCoins < total) {
    return {
      ok: false,
      reason: "coins",
      required: total,
      available: currentCoins
    };
  }

  const inventory = getInventory();
  inventory[itemId] = Math.max(0, Number(inventory[itemId] || 0)) + qty;

  const coinField = state.profile._dbFields?.coins || "moedas";
  await saveInventory(inventory, { [coinField]: currentCoins - total });

  return {
    ok: true,
    count: getItemCount(itemId),
    coins: Math.max(0, Number(state.profile?.moedas || 0))
  };
}

async function consumeItem(itemId, quantity = 1) {
  await ready;
  if (!state.profile || !itemId) return { ok: false, reason: "profile" };

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const inventory = getInventory();
  const current = Math.max(0, Number(inventory[itemId] || 0));

  if (current < qty) {
    return { ok: false, reason: "quantity", count: current };
  }

  const nextCount = current - qty;
  if (nextCount > 0) {
    inventory[itemId] = nextCount;
  } else {
    delete inventory[itemId];
  }

  await saveInventory(inventory);
  return { ok: true, count: getItemCount(itemId) };
}

async function logout() {
  try {
    await supabase.auth.signOut();
  } finally {
    window.location.replace("index.html");
  }
}

async function initialize() {
  try {
    setAuthOverlay("Validando sessão do aluno...");

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!data.session?.user) {
      window.location.replace("index.html");
      return;
    }

    state.session = data.session;
    state.user = data.session.user;

    setAuthOverlay("Carregando perfil e progresso...");
    const rawProfile = await fetchOrCreateProfile(state.user);
    state.profile = normalizeProfile(rawProfile, state.user);
    state.ready = true;

    renderProfileHud();
    hideAuthOverlay();
    readyResolvers.splice(0).forEach(({ resolve }) => resolve(state.profile));
    window.dispatchEvent(new CustomEvent("voltz:profile-ready", { detail: state.profile }));
  } catch (error) {
    console.error("Falha ao carregar a sessão/perfil:", error);
    setAuthOverlay("Não foi possível carregar seu perfil. Volte ao login e tente novamente.", true);
    readyResolvers.splice(0).forEach(({ reject }) => reject(error));
  }
}

window.VoltzProfile = {
  state,
  ready,
  addRewards,
  getRealmProgress,
  setRealmProgress,
  resetRealmProgress,
  completeEncounter,
  getInventory,
  getItemCount,
  purchaseItem,
  consumeItem,
  logout
};

document.getElementById("logoutButton")?.addEventListener("click", logout);

initialize();
