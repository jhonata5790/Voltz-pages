from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/sports-minigames.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

old = '{ id:"v1", team:"voltz", number:"7",  x:24, y:50, homeX:24, homeY:50, speed:22, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },'
new = '{ id:"v1", team:"voltz", number:"7",  x:24, y:50, homeX:24, homeY:50, speed:22, isUserAvatar:true, facingX:1, facingY:0, movingUntil:0, tackleUntil:0, recoverUntil:0, tackleCooldownUntil:0 },'
assert old in js, 'v1 player definition not found'
js = js.replace(old, new, 1)

anchor = '  function renderFootball() {'
assert anchor in js, 'renderFootball anchor not found'
helper = r'''  function buildFootballUserAvatarSvg() {
    return `<div class="football-user-avatar-shell" aria-hidden="true">
      <svg class="football-user-avatar" viewBox="0 0 120 150" focusable="false">
        <defs>
          <linearGradient id="footballUserBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#78f7ff"/>
            <stop offset="55%" stop-color="#9257ff"/>
            <stop offset="100%" stop-color="#00eaff"/>
          </linearGradient>
          <radialGradient id="footballUserCoreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="45%" stop-color="#78f7ff"/>
            <stop offset="100%" stop-color="#9257ff"/>
          </radialGradient>
        </defs>

        <ellipse class="football-avatar-aura" cx="60" cy="79" rx="45" ry="53" fill="#00eaff"/>

        <g class="football-avatar-legs">
          <path class="football-avatar-leg football-avatar-leg-left" d="M45 105 C42 117 41 130 43 141" fill="none" stroke="#176f72" stroke-width="12" stroke-linecap="round"/>
          <path class="football-avatar-leg football-avatar-leg-right" d="M75 105 C78 117 79 130 77 141" fill="none" stroke="#176f72" stroke-width="12" stroke-linecap="round"/>
          <ellipse cx="42" cy="143" rx="10" ry="5" fill="#071b2b" stroke="#78f7ff" stroke-width="2"/>
          <ellipse cx="78" cy="143" rx="10" ry="5" fill="#071b2b" stroke="#78f7ff" stroke-width="2"/>
        </g>

        <g class="football-avatar-body">
          <path d="M32 108 C24 77, 28 42, 60 29 C92 42, 96 77, 88 108 C79 126, 41 126, 32 108Z"
            fill="url(#footballUserBodyGradient)" stroke="#f5fbff" stroke-width="4" stroke-linejoin="round"/>

          <path d="M43 31 L52 10 L60 29 L68 10 L77 31"
            fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

          <circle class="football-avatar-core" cx="60" cy="79" r="21" fill="url(#footballUserCoreGradient)" stroke="#ffffff" stroke-width="4"/>

          <g class="football-face football-face-front">
            <ellipse cx="47" cy="58" rx="7" ry="9" fill="#02040d"/>
            <ellipse cx="73" cy="58" rx="7" ry="9" fill="#02040d"/>
            <circle cx="49" cy="55" r="2.5" fill="#78f7ff"/>
            <circle cx="75" cy="55" r="2.5" fill="#78f7ff"/>
            <path d="M48 101 C55 107,65 107,72 101" fill="none" stroke="#02040d" stroke-width="5" stroke-linecap="round"/>
          </g>

          <g class="football-face football-face-back">
            <path d="M40 58 C50 50,70 50,80 58" fill="none" stroke="#02040d" stroke-width="5" stroke-linecap="round"/>
            <path d="M45 99 C54 93,66 93,75 99" fill="none" stroke="#78f7ff" stroke-width="5" stroke-linecap="round"/>
            <circle cx="60" cy="63" r="8" fill="#050713" stroke="#78f7ff" stroke-width="3"/>
          </g>

          <g class="football-face football-face-side">
            <ellipse cx="72" cy="59" rx="8" ry="9" fill="#02040d"/>
            <circle cx="75" cy="56" r="2.5" fill="#78f7ff"/>
            <path d="M62 101 C70 106,78 105,84 99" fill="none" stroke="#02040d" stroke-width="5" stroke-linecap="round"/>
          </g>

          <g class="football-arms football-arms-front">
            <path d="M31 81 C17 87,14 101,23 112" fill="none" stroke="#78f7ff" stroke-width="7" stroke-linecap="round"/>
            <path d="M89 81 C103 87,106 101,97 112" fill="none" stroke="#78f7ff" stroke-width="7" stroke-linecap="round"/>
          </g>
          <g class="football-arms football-arms-back">
            <path d="M30 85 C17 81,15 67,24 59" fill="none" stroke="#9257ff" stroke-width="7" stroke-linecap="round"/>
            <path d="M90 85 C103 81,105 67,96 59" fill="none" stroke="#9257ff" stroke-width="7" stroke-linecap="round"/>
          </g>
          <g class="football-arms football-arms-side">
            <path d="M34 83 C22 91,22 106,34 113" fill="none" stroke="#78f7ff" stroke-width="7" stroke-linecap="round"/>
            <path d="M88 79 C101 81,106 94,99 105" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    </div>`;
  }

'''
js = js.replace(anchor, helper + anchor, 1)

old_markup = r'''    const playerMarkup = g.players.map((player) => `
      <div id="footballPlayer-${player.id}" class="football-live-player team-${player.team} ${player.keeper ? "is-keeper" : ""}" data-id="${player.id}">
        <i class="football-player-shadow" aria-hidden="true"></i>
        <div class="football-player-body" aria-hidden="true">
          <i class="football-player-head"></i>
          <i class="football-player-torso"></i>
          <i class="football-player-leg leg-left"></i>
          <i class="football-player-leg leg-right"></i>
          <span>${player.number}</span>
        </div>
      </div>`).join("");'''
new_markup = r'''    const playerMarkup = g.players.map((player) => `
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
assert old_markup in js, 'football player markup not found'
js = js.replace(old_markup, new_markup, 1)

old_dom = r'''      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });
      const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;
      el.style.setProperty("--football-facing-angle", `${angle}deg`);'''
new_dom = r'''      const facing = getFootballFacing(player, { x:player.x + (player.team === "voltz" ? 1 : -1), y:player.y });
      const angle = Math.atan2(facing.y, facing.x) * 180 / Math.PI + 90;
      el.style.setProperty("--football-facing-angle", `${angle}deg`);
      const facingName = Math.abs(facing.x) >= Math.abs(facing.y)
        ? (facing.x >= 0 ? "right" : "left")
        : (facing.y >= 0 ? "down" : "up");
      el.dataset.footballFacing = facingName;
      if (player.isUserAvatar) {
        const depthScale = clamp(.94 + player.y * .0012, .95, 1.06);
        el.style.setProperty("--football-avatar-depth-scale", depthScale.toFixed(3));
      }'''
assert old_dom in js, 'football DOM facing block not found'
js = js.replace(old_dom, new_dom, 1)

css_append = r'''

/* Football V3.6 · primeiro avatar SVG 3/4 do personagem do mundo */
.football-live-player.is-user-avatar {
  --football-avatar-depth-scale:1;
  width:60px !important;
  height:76px !important;
  z-index:11 !important;
  overflow:visible;
}
.football-live-player.is-user-avatar .football-player-shadow {
  left:50%;
  top:84%;
  width:38px;
  height:13px;
  background:rgba(0,0,0,.42);
  filter:blur(3px);
  transform:translate(-50%,-50%);
}
.football-user-avatar-shell {
  position:absolute;
  left:50%;
  bottom:5px;
  width:58px;
  height:73px;
  transform:translateX(-50%) scale(var(--football-avatar-depth-scale));
  transform-origin:center bottom;
  pointer-events:none;
}
.football-user-avatar {
  width:100%;
  height:100%;
  overflow:visible;
  transform-origin:center bottom;
  filter:drop-shadow(0 5px 5px rgba(0,0,0,.38)) drop-shadow(0 0 5px rgba(0,234,255,.22));
}
.football-user-avatar .football-avatar-aura {
  opacity:.13;
  filter:blur(6px);
}
.football-user-avatar .football-face,
.football-user-avatar .football-arms { display:none; }
.football-live-player.is-user-avatar[data-football-facing="down"] .football-face-front,
.football-live-player.is-user-avatar[data-football-facing="down"] .football-arms-front { display:inline; }
.football-live-player.is-user-avatar[data-football-facing="up"] .football-face-back,
.football-live-player.is-user-avatar[data-football-facing="up"] .football-arms-back { display:inline; }
.football-live-player.is-user-avatar[data-football-facing="right"] .football-face-side,
.football-live-player.is-user-avatar[data-football-facing="right"] .football-arms-side,
.football-live-player.is-user-avatar[data-football-facing="left"] .football-face-side,
.football-live-player.is-user-avatar[data-football-facing="left"] .football-arms-side { display:inline; }
.football-live-player.is-user-avatar[data-football-facing="left"] .football-user-avatar {
  transform:scaleX(-1);
}
.football-live-player.is-user-avatar.is-controlled::before {
  left:50%;
  top:82%;
  width:43px;
  height:17px;
  border-color:#8cf7ff;
  background:rgba(69,163,255,.035);
  box-shadow:0 0 13px rgba(140,247,255,.72),inset 0 0 8px rgba(140,247,255,.16);
}
.football-live-player.is-user-avatar.is-controlled::after {
  display:none !important;
}
.football-live-player.is-user-avatar.has-ball .football-avatar-core {
  filter:drop-shadow(0 0 7px #fff) drop-shadow(0 0 13px rgba(120,247,255,.95));
}
.football-live-player.is-user-avatar.is-running .football-user-avatar-shell {
  animation:footballAvatarRunBob .28s ease-in-out infinite alternate;
}
.football-live-player.is-user-avatar.is-running .football-avatar-leg-left {
  animation:footballAvatarLegLeft .28s ease-in-out infinite alternate;
  transform-origin:45px 106px;
}
.football-live-player.is-user-avatar.is-running .football-avatar-leg-right {
  animation:footballAvatarLegRight .28s ease-in-out infinite alternate;
  transform-origin:75px 106px;
}
.football-live-player.is-user-avatar.is-tackling .football-user-avatar-shell {
  animation:footballAvatarTackle .25s cubic-bezier(.15,.78,.25,1);
}
.football-live-player.is-user-avatar.is-recovering .football-user-avatar-shell {
  opacity:.68;
  filter:saturate(.58);
}
@keyframes footballAvatarRunBob {
  from { transform:translateX(-50%) translateY(0) scale(var(--football-avatar-depth-scale)); }
  to { transform:translateX(-50%) translateY(-2px) scale(var(--football-avatar-depth-scale)); }
}
@keyframes footballAvatarLegLeft { from{transform:rotate(7deg)} to{transform:rotate(-9deg)} }
@keyframes footballAvatarLegRight { from{transform:rotate(-8deg)} to{transform:rotate(8deg)} }
@keyframes footballAvatarTackle {
  0% { transform:translateX(-50%) scale(var(--football-avatar-depth-scale)); }
  55% { transform:translateX(-50%) translateY(-4px) scale(calc(var(--football-avatar-depth-scale) * 1.08), calc(var(--football-avatar-depth-scale) * .94)); }
  100% { transform:translateX(-50%) scale(var(--football-avatar-depth-scale)); }
}
'''
if '/* Football V3.6 · primeiro avatar SVG 3/4 do personagem do mundo */' not in css:
    css += css_append

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
