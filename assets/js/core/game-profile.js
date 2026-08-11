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
  return JSON.parse(JSON.stringify(realmProgress));
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
  logout
};

document.getElementById("logoutButton")?.addEventListener("click", logout);

initialize();
