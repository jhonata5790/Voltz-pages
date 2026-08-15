from pathlib import Path

p = Path('assets/js/realms/physical-education/sports-minigames.js')
s = p.read_text(encoding='utf-8')

old = '''  // -------------------------------------------------------\n  // Futebol · Campo das Decisões 3v3\n  // -------------------------------------------------------\n  function startFootball() {'''
new = '''  // -------------------------------------------------------\n  // Futebol · Campo das Decisões 3v3\n  // -------------------------------------------------------\n  // Ritmo-base do 3v3: jogadores de linha se movem a 78% do protótipo original.\n  // A bola NÃO usa este multiplicador; assim passe, cruzamento e finalização\n  // continuam rápidos enquanto o jogador ganha mais tempo para ler o campo.\n  const FOOTBALL_OUTFIELD_PACE = 0.78;\n\n  function startFootball() {'''
assert old in s, 'football section anchor not found'
s = s.replace(old, new, 1)

old = '''    const step = Math.min(length, speed * recoveryScale * dt);'''
new = '''    const movementScale = player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE;\n    const step = Math.min(length, speed * movementScale * recoveryScale * dt);'''
assert old in s, 'footballMoveToward step not found'
s = s.replace(old, new, 1)

old = '''    const speed = Number(player.speed || 0);\n    return { x:facing.x * speed, y:facing.y * speed, moving:speed > .1 };'''
new = '''    const speed = Number(player.speed || 0) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);\n    return { x:facing.x * speed, y:facing.y * speed, moving:speed > .1 };'''
assert old in s, 'receiver velocity block not found'
s = s.replace(old, new, 1)

old = '''    const speed = Math.max(12.5, Number(player.speed || 15) * 1.06);'''
new = '''    const speed = Math.max(12.5, Number(player.speed || 15) * 1.06) * (player.keeper ? 1 : FOOTBALL_OUTFIELD_PACE);'''
assert old in s, 'dynamic intercept speed not found'
s = s.replace(old, new, 1)

old = '''      controlled.x += dx / len * controlled.speed * recoveryScale * dt;\n      controlled.y += dy / len * controlled.speed * recoveryScale * dt;'''
new = '''      controlled.x += dx / len * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;\n      controlled.y += dy / len * controlled.speed * FOOTBALL_OUTFIELD_PACE * recoveryScale * dt;'''
assert old in s, 'controlled player movement not found'
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
