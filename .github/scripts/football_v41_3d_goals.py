from pathlib import Path

js_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/football/football-standalone.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# ------------------------------------------------------------
# Futebol V4.1 · gols 3D estáticos seguindo a projeção do campo
# ------------------------------------------------------------
anchor = '''  function footballSvgPath(points, close = false) {\n    if (!points?.length) return '';\n    const projected = points.map(footballSvgPoint);\n    return `M ${projected.join(' L ')}${close ? ' Z' : ''}`;\n  }\n\n'''
assert anchor in js, 'footballSvgPath anchor not found'

helper = r'''  function footballScreenPointFromGround(worldX, worldY, lift = 0) {
    const ground = projectFootballPoint(worldX, worldY);
    return {
      x:ground.x,
      y:ground.y - Number(lift || 0) * ground.scale,
      scale:ground.scale,
      depth:ground.depth
    };
  }

  function footballSvgScreenPath(points, close = false) {
    if (!points?.length) return '';
    const mapped = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    return `M ${mapped.join(' L ')}${close ? ' Z' : ''}`;
  }

  function buildFootballGoal3D(side) {
    const left = side === 'left';
    const frontX = left ? 2 : 98;
    // A profundidade fica para fora da linha do gol, mas ainda dentro da área visível
    // do container. É uma ilusão 3D: a lógica de gol continua exatamente em x=0/100.
    const backX = left ? -3.2 : 103.2;
    const farY = 32;
    const nearY = 68;
    const backFarY = 30;
    const backNearY = 70;
    const goalHeight = 7.8;

    const frontFarBase = footballScreenPointFromGround(frontX, farY, 0);
    const frontNearBase = footballScreenPointFromGround(frontX, nearY, 0);
    const backFarBase = footballScreenPointFromGround(backX, backFarY, 0);
    const backNearBase = footballScreenPointFromGround(backX, backNearY, 0);
    const frontFarTop = footballScreenPointFromGround(frontX, farY, goalHeight);
    const frontNearTop = footballScreenPointFromGround(frontX, nearY, goalHeight);
    const backFarTop = footballScreenPointFromGround(backX, backFarY, goalHeight * .92);
    const backNearTop = footballScreenPointFromGround(backX, backNearY, goalHeight * .92);

    const shadow = footballSvgScreenPath([
      frontFarBase, frontNearBase, backNearBase, backFarBase
    ], true);
    const roof = footballSvgScreenPath([
      frontFarTop, frontNearTop, backNearTop, backFarTop
    ], true);
    const farSide = footballSvgScreenPath([
      frontFarBase, frontFarTop, backFarTop, backFarBase
    ], true);
    const nearSide = footballSvgScreenPath([
      frontNearBase, frontNearTop, backNearTop, backNearBase
    ], true);
    const backNet = footballSvgScreenPath([
      backFarBase, backFarTop, backNearTop, backNearBase
    ], true);

    const mesh = [];
    const lerpPoint = (a, b, t) => ({
      x:a.x + (b.x - a.x) * t,
      y:a.y + (b.y - a.y) * t
    });

    // Malha vertical da rede traseira.
    for (let i = 1; i < 6; i += 1) {
      const t = i / 6;
      const base = lerpPoint(backFarBase, backNearBase, t);
      const top = lerpPoint(backFarTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([base, top])}"/>`);
    }
    // Malha horizontal da rede traseira.
    for (let i = 1; i < 4; i += 1) {
      const t = i / 4;
      const far = lerpPoint(backFarBase, backFarTop, t);
      const near = lerpPoint(backNearBase, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([far, near])}"/>`);
    }
    // Linhas de profundidade no teto e nas laterais.
    for (let i = 1; i < 4; i += 1) {
      const t = i / 4;
      const roofFar = lerpPoint(frontFarTop, backFarTop, t);
      const roofNear = lerpPoint(frontNearTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([roofFar, roofNear])}"/>`);

      const farBase = lerpPoint(frontFarBase, backFarBase, t);
      const farTop = lerpPoint(frontFarTop, backFarTop, t);
      const nearBase = lerpPoint(frontNearBase, backNearBase, t);
      const nearTop = lerpPoint(frontNearTop, backNearTop, t);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([farBase, farTop])}"/>`);
      mesh.push(`<path class="football-goal-3d-net-line" d="${footballSvgScreenPath([nearBase, nearTop])}"/>`);
    }

    return `
      <g class="football-goal-3d football-goal-3d-${side}">
        <path class="football-goal-3d-shadow" d="${shadow}"/>
        <path class="football-goal-3d-net-surface" d="${backNet}"/>
        <path class="football-goal-3d-net-surface is-side" d="${farSide}"/>
        <path class="football-goal-3d-net-surface is-side" d="${nearSide}"/>
        <path class="football-goal-3d-net-surface is-roof" d="${roof}"/>
        ${mesh.join('')}
        <path class="football-goal-3d-frame is-back" d="${footballSvgScreenPath([backFarBase, backFarTop, backNearTop, backNearBase])}"/>
        <path class="football-goal-3d-frame is-depth" d="${footballSvgScreenPath([frontFarTop, backFarTop])}"/>
        <path class="football-goal-3d-frame is-depth" d="${footballSvgScreenPath([frontNearTop, backNearTop])}"/>
        <path class="football-goal-3d-frame is-front" d="${footballSvgScreenPath([frontFarBase, frontFarTop, frontNearTop, frontNearBase])}"/>
      </g>
    `;
  }

'''
js = js.replace(anchor, anchor + helper, 1)

old = '''    const leftBox = [[2,23],[18,23],[18,77],[2,77]];\n    const rightBox = [[98,23],[82,23],[82,77],[98,77]];\n    const leftGoal = [[2,32],[.5,32],[.5,68],[2,68]];\n    const rightGoal = [[98,32],[99.5,32],[99.5,68],[98,68]];\n    const centerSpot = projectFootballPoint(50, 50);\n    const leftSpot = projectFootballPoint(12, 50);\n    const rightSpot = projectFootballPoint(88, 50);\n\n    const netLines = [];\n    [40,50,60].forEach((worldY) => {\n      netLines.push(`<path class="football-pitch-net-line" d="${footballSvgPath([[.5,worldY],[2,worldY]])}"/>`);\n      netLines.push(`<path class="football-pitch-net-line" d="${footballSvgPath([[98,worldY],[99.5,worldY]])}"/>`);\n    });\n'''
new = '''    const leftBox = [[2,23],[18,23],[18,77],[2,77]];\n    const rightBox = [[98,23],[82,23],[82,77],[98,77]];\n    const centerSpot = projectFootballPoint(50, 50);\n    const leftSpot = projectFootballPoint(12, 50);\n    const rightSpot = projectFootballPoint(88, 50);\n    const goals3D = `${buildFootballGoal3D('left')}${buildFootballGoal3D('right')}`;\n'''
assert old in js, 'old flat goal definitions not found'
js = js.replace(old, new, 1)

old_return = '''      <path class="football-pitch-line" d="${footballSvgPath(leftBox, true)}"/>\n      <path class="football-pitch-line" d="${footballSvgPath(rightBox, true)}"/>\n      <path class="football-pitch-goal" d="${footballSvgPath(leftGoal, true)}"/>\n      <path class="football-pitch-goal" d="${footballSvgPath(rightGoal, true)}"/>\n      ${netLines.join('')}\n      <circle class="football-pitch-spot" cx="${centerSpot.x.toFixed(2)}" cy="${centerSpot.y.toFixed(2)}" r=".42"/>'''
new_return = '''      <path class="football-pitch-line" d="${footballSvgPath(leftBox, true)}"/>\n      <path class="football-pitch-line" d="${footballSvgPath(rightBox, true)}"/>\n      ${goals3D}\n      <circle class="football-pitch-spot" cx="${centerSpot.x.toFixed(2)}" cy="${centerSpot.y.toFixed(2)}" r=".42"/>'''
assert old_return in js, 'flat goal render block not found'
js = js.replace(old_return, new_return, 1)

marker = '/* Football V4.1 · gols 3D */'
assert marker not in css, 'V4.1 CSS already present'
css += r'''


/* Football V4.1 · gols 3D */
.football-goal-3d {
  pointer-events:none;
}
.football-goal-3d-shadow {
  fill:rgba(0,0,0,.18);
  stroke:none;
}
.football-goal-3d-net-surface {
  fill:rgba(218,255,244,.035);
  stroke:rgba(231,255,247,.15);
  stroke-width:.8;
  vector-effect:non-scaling-stroke;
}
.football-goal-3d-net-surface.is-side {
  fill:rgba(190,244,231,.028);
}
.football-goal-3d-net-surface.is-roof {
  fill:rgba(238,255,250,.045);
}
.football-goal-3d-net-line {
  fill:none;
  stroke:rgba(224,255,246,.23);
  stroke-width:.72;
  stroke-dasharray:2.2 2.3;
  vector-effect:non-scaling-stroke;
}
.football-goal-3d-frame {
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
  vector-effect:non-scaling-stroke;
}
.football-goal-3d-frame.is-back {
  stroke:rgba(225,252,245,.58);
  stroke-width:2;
}
.football-goal-3d-frame.is-depth {
  stroke:rgba(239,255,251,.78);
  stroke-width:2.25;
}
.football-goal-3d-frame.is-front {
  stroke:#f4fffb;
  stroke-width:3;
}
.football-goal-3d-left .football-goal-3d-frame.is-front,
.football-goal-3d-right .football-goal-3d-frame.is-front {
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.32));
}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('Football V4.1 3D goals patch applied')
