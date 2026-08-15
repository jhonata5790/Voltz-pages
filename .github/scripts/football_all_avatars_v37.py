from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/sports-minigames.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

start = js.index('  function buildFootballUserAvatarSvg() {')
end = js.index('  function renderFootball() {', start)

builder = r'''  const FOOTBALL_AVATAR_PROFILES = {
    v1: {
      bodyA:"#78f7ff", bodyB:"#9257ff", bodyC:"#00eaff", accent:"#ffd166", coreA:"#ffffff", coreB:"#78f7ff", coreC:"#9257ff",
      bodyPath:"M32 108 C24 77,28 42,60 29 C92 42,96 77,88 108 C79 126,41 126,32 108Z",
      top:'<path d="M43 31 L52 10 L60 29 L68 10 L77 31" fill="none" stroke="__ACCENT__" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    v2: {
      bodyA:"#72ffd1", bodyB:"#20a99d", bodyC:"#2be6ff", accent:"#eafff7", coreA:"#ffffff", coreB:"#63f5b5", coreC:"#237cbf",
      bodyPath:"M36 111 C28 82,31 48,60 31 C89 48,92 82,84 111 C76 127,44 127,36 111Z",
      top:'<path d="M41 36 Q48 16 57 31 Q66 10 78 34" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round"/><circle cx="79" cy="31" r="4" fill="__ACCENT__"/>'
    },
    v3: {
      bodyA:"#65caff", bodyB:"#6047d6", bodyC:"#9b6dff", accent:"#aefcff", coreA:"#ffffff", coreB:"#45a3ff", coreC:"#9257ff",
      bodyPath:"M28 106 C22 78,27 47,60 32 C93 47,98 78,92 106 C82 127,38 127,28 106Z",
      top:'<path d="M38 34 L49 18 L60 31 L72 16 L83 35" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M49 18 L72 16" stroke="__ACCENT__" stroke-width="3" opacity=".55"/>'
    },
    vgk: {
      bodyA:"#ffe28b", bodyB:"#c78a2e", bodyC:"#63f5b5", accent:"#fff8d2", coreA:"#ffffff", coreB:"#ffd166", coreC:"#35b78a",
      bodyPath:"M27 112 C22 78,27 42,60 27 C93 42,98 78,93 112 C82 131,38 131,27 112Z",
      top:'<path d="M34 38 Q60 13 86 38 L79 45 Q60 28 41 45Z" fill="__ACCENT__" opacity=".9"/><path d="M42 40 Q60 27 78 40" fill="none" stroke="#8a6422" stroke-width="4" stroke-linecap="round"/>'
    },
    r1: {
      bodyA:"#ff7b87", bodyB:"#8b2038", bodyC:"#ff3d58", accent:"#ffd0d5", coreA:"#fff2f3", coreB:"#ff6b7a", coreC:"#731a2d",
      bodyPath:"M31 113 L24 81 L34 45 L60 27 L86 45 L96 81 L89 113 C78 128,42 128,31 113Z",
      top:'<path d="M37 40 L42 17 L56 34 L64 13 L78 36 L86 20 L84 44" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    r2: {
      bodyA:"#ff69b4", bodyB:"#7b225f", bodyC:"#c43b91", accent:"#ffd2ec", coreA:"#fff4fb", coreB:"#ff62ad", coreC:"#632253",
      bodyPath:"M35 115 C22 91,29 50,60 28 C91 50,98 91,85 115 C75 129,45 129,35 115Z",
      top:'<path d="M39 38 Q45 18 55 31 Q60 9 66 31 Q78 16 82 40" fill="none" stroke="__ACCENT__" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="17" r="5" fill="__ACCENT__"/>'
    },
    r3: {
      bodyA:"#ff9b54", bodyB:"#9b2d35", bodyC:"#ff5d47", accent:"#ffe0bd", coreA:"#fff7ea", coreB:"#ff9251", coreC:"#8b2531",
      bodyPath:"M28 108 C18 82,25 44,60 34 C95 44,102 82,92 108 C81 127,39 127,28 108Z",
      top:'<path d="M33 43 L47 21 L56 36 L68 17 L87 42" fill="none" stroke="__ACCENT__" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    rgk: {
      bodyA:"#dcadff", bodyB:"#6b3b9d", bodyC:"#ff6b9e", accent:"#f5e5ff", coreA:"#ffffff", coreB:"#d599ff", coreC:"#783f9f",
      bodyPath:"M26 112 C21 77,27 41,60 27 C93 41,99 77,94 112 C83 131,37 131,26 112Z",
      top:'<path d="M33 39 Q60 12 87 39 L80 48 Q60 29 40 48Z" fill="__ACCENT__" opacity=".92"/><path d="M39 41 L81 41" stroke="#6e3a9e" stroke-width="5" stroke-linecap="round"/>'
    }
  };

  function buildFootballAvatarSvg(player) {
    const profile = FOOTBALL_AVATAR_PROFILES[player?.id] || FOOTBALL_AVATAR_PROFILES[player?.team === "rival" ? "r1" : "v2"];
    const gradientId = `footballAvatarBody-${player.id}`;
    const coreId = `footballAvatarCore-${player.id}`;
    const top = String(profile.top || "").replaceAll("__ACCENT__", profile.accent);
    const showNumber = !player.isUserAvatar;
    return `<div class="football-user-avatar-shell" aria-hidden="true">
      <svg class="football-user-avatar" viewBox="0 0 120 150" focusable="false">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${profile.bodyA}"/>
            <stop offset="55%" stop-color="${profile.bodyB}"/>
            <stop offset="100%" stop-color="${profile.bodyC}"/>
          </linearGradient>
          <radialGradient id="${coreId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${profile.coreA}"/>
            <stop offset="48%" stop-color="${profile.coreB}"/>
            <stop offset="100%" stop-color="${profile.coreC}"/>
          </radialGradient>
        </defs>

        <ellipse class="football-avatar-aura" cx="60" cy="82" rx="45" ry="51" fill="${profile.bodyC}"/>
        <g class="football-avatar-body">
          <path d="${profile.bodyPath}" fill="url(#${gradientId})" stroke="#f5fbff" stroke-width="4" stroke-linejoin="round"/>
          ${top}
          <circle class="football-avatar-core" cx="60" cy="82" r="20" fill="url(#${coreId})" stroke="#ffffff" stroke-width="4"/>
          ${showNumber ? `<text class="football-avatar-number" x="60" y="88" text-anchor="middle">${player.number}</text>` : ""}

          <g class="football-face football-face-front">
            <ellipse cx="47" cy="59" rx="7" ry="9" fill="#02040d"/>
            <ellipse cx="73" cy="59" rx="7" ry="9" fill="#02040d"/>
            <circle cx="49" cy="56" r="2.5" fill="${profile.accent}"/>
            <circle cx="75" cy="56" r="2.5" fill="${profile.accent}"/>
            <path d="M49 108 C56 113,64 113,71 108" fill="none" stroke="#02040d" stroke-width="4.5" stroke-linecap="round"/>
          </g>

          <g class="football-face football-face-back">
            <path d="M40 60 C50 52,70 52,80 60" fill="none" stroke="#02040d" stroke-width="5" stroke-linecap="round"/>
            <path d="M46 106 C54 101,66 101,74 106" fill="none" stroke="${profile.accent}" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="60" cy="65" r="7" fill="#050713" stroke="${profile.accent}" stroke-width="3"/>
          </g>

          <g class="football-face football-face-side">
            <ellipse cx="72" cy="60" rx="8" ry="9" fill="#02040d"/>
            <circle cx="75" cy="57" r="2.5" fill="${profile.accent}"/>
            <path d="M64 106 C71 110,78 109,83 104" fill="none" stroke="#02040d" stroke-width="4.5" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    </div>`;
  }

'''

js = js[:start] + builder + js[end:]

old_markup = r'''    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} ${player.keeper ? "is-keeper" : ""} ${player.isUserAvatar ? "is-user-avatar" : ""}" data-id="${player.id}" data-football-facing="right">
        <i class="football-player-shadow" aria-hidden="true"></i>
        ${player.isUserAvatar ? buildFootballUserAvatarSvg() : `
          <div class="football-player-body" aria-hidden="true">
            <i class="football-player-head"></i>
            <i class="football-player-torso"></i>
            <i class="football-player-leg leg-left"></i>
            <i class="football-player-leg leg-right"></i>
            <span>${player.number}</span>
          </div>`}
      </div>`).join("");'''
new_markup = r'''    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} is-svg-avatar ${player.keeper ? "is-keeper" : ""} ${player.isUserAvatar ? "is-user-avatar" : ""}" data-id="${player.id}" data-football-facing="right">
        <i class="football-player-shadow" aria-hidden="true"></i>
        ${buildFootballAvatarSvg(player)}
      </div>`).join("");'''
assert old_markup in js, 'old football markup not found'
js = js.replace(old_markup, new_markup, 1)

old_depth = '''      if (player.isUserAvatar) {\n        const depthScale = clamp(.94 + player.y * .0012, .95, 1.06);\n        el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n      }'''
new_depth = '''      if (el.classList.contains("is-svg-avatar")) {\n        const depthScale = clamp(.94 + player.y * .0012, .95, 1.06);\n        el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));\n      }'''
assert old_depth in js, 'avatar depth block not found'
js = js.replace(old_depth, new_depth, 1)

css_append = r'''

/* Football V3.7 · elenco completo em SVG simples, sem braços ou pernas */
.football-live-player.is-svg-avatar {
  --football-avatar-depth-scale:1;
  width:60px !important;
  height:72px !important;
  z-index:11 !important;
  overflow:visible;
}
.football-live-player.is-svg-avatar.is-keeper {
  width:64px !important;
  height:76px !important;
}
.football-live-player.is-svg-avatar .football-player-shadow {
  left:50% !important;
  top:84% !important;
  width:38px !important;
  height:13px !important;
  border-radius:50% !important;
  background:rgba(0,0,0,.42) !important;
  filter:blur(3px) !important;
  transform:translate(-50%,-50%) !important;
}
.football-live-player.is-svg-avatar.is-keeper .football-player-shadow {
  width:43px !important;
  height:15px !important;
}
.football-live-player.is-svg-avatar .football-user-avatar-shell {
  position:absolute;
  left:50%;
  bottom:4px;
  width:58px;
  height:70px;
  transform:translateX(-50%) scale(var(--football-avatar-depth-scale));
  transform-origin:center bottom;
  pointer-events:none;
}
.football-live-player.is-svg-avatar.is-keeper .football-user-avatar-shell {
  width:62px;
  height:74px;
}
.football-live-player.is-svg-avatar .football-user-avatar {
  width:100%;
  height:100%;
  overflow:visible;
  transform-origin:center bottom;
  filter:drop-shadow(0 5px 5px rgba(0,0,0,.38));
}
.football-live-player.is-svg-avatar.team-voltz .football-user-avatar {
  filter:drop-shadow(0 5px 5px rgba(0,0,0,.38)) drop-shadow(0 0 5px rgba(0,234,255,.18));
}
.football-live-player.is-svg-avatar.team-rival .football-user-avatar {
  filter:drop-shadow(0 5px 5px rgba(0,0,0,.38)) drop-shadow(0 0 5px rgba(255,74,96,.16));
}
.football-live-player.is-svg-avatar .football-avatar-aura {
  opacity:.11;
  filter:blur(6px);
}
.football-live-player.is-svg-avatar .football-face { display:none; }
.football-live-player.is-svg-avatar[data-football-facing="down"] .football-face-front { display:inline; }
.football-live-player.is-svg-avatar[data-football-facing="up"] .football-face-back { display:inline; }
.football-live-player.is-svg-avatar[data-football-facing="right"] .football-face-side,
.football-live-player.is-svg-avatar[data-football-facing="left"] .football-face-side { display:inline; }
.football-live-player.is-svg-avatar[data-football-facing="left"] .football-user-avatar { transform:scaleX(-1); }
.football-avatar-number {
  fill:#071019;
  stroke:rgba(255,255,255,.28);
  stroke-width:.7px;
  paint-order:stroke;
  font:1000 15px/1 system-ui,sans-serif;
  pointer-events:none;
}
.football-live-player.is-svg-avatar.is-controlled::before {
  left:50% !important;
  top:82% !important;
  width:43px !important;
  height:17px !important;
  border:2px solid #8cf7ff !important;
  border-radius:50% !important;
  background:rgba(69,163,255,.035) !important;
  box-shadow:0 0 13px rgba(140,247,255,.72),inset 0 0 8px rgba(140,247,255,.16) !important;
}
.football-live-player.is-svg-avatar.is-controlled::after { display:none !important; }
.football-live-player.is-svg-avatar.has-ball .football-avatar-core {
  filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px rgba(120,247,255,.8));
}
.football-live-player.is-svg-avatar.team-rival.has-ball .football-avatar-core {
  filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px rgba(255,107,122,.72));
}
.football-live-player.is-svg-avatar.is-running .football-user-avatar-shell {
  animation:footballAvatarFloatMove .30s ease-in-out infinite alternate;
}
.football-live-player.is-svg-avatar.is-tackling .football-user-avatar-shell {
  animation:footballAvatarSimpleTackle .25s cubic-bezier(.15,.78,.25,1);
}
.football-live-player.is-svg-avatar.is-recovering .football-user-avatar-shell {
  opacity:.68;
  filter:saturate(.58);
}
@keyframes footballAvatarFloatMove {
  from { transform:translateX(-50%) translateY(0) scale(var(--football-avatar-depth-scale)); }
  to { transform:translateX(-50%) translateY(-2px) scale(var(--football-avatar-depth-scale)); }
}
@keyframes footballAvatarSimpleTackle {
  0% { transform:translateX(-50%) scale(var(--football-avatar-depth-scale)); }
  55% { transform:translateX(-50%) translateY(-3px) scale(calc(var(--football-avatar-depth-scale) * 1.08), calc(var(--football-avatar-depth-scale) * .93)); }
  100% { transform:translateX(-50%) scale(var(--football-avatar-depth-scale)); }
}
'''
if '/* Football V3.7 · elenco completo em SVG simples, sem braços ou pernas */' not in css:
    css += css_append

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
