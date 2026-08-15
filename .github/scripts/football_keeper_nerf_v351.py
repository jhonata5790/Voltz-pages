from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')

old_reaction = 'keeper.reactionUntil = Number(g.ball.shotAt || now) + 115 + Math.random() * 55;'
new_reaction = 'keeper.reactionUntil = Number(g.ball.shotAt || now) + 170 + Math.random() * 70;'
old_radius = 'const radius = entry.player.keeper ? (keeperDiving ? 6.6 : 4.4) : ball.z > 1.4 ? 2.25 : 2.65;'
new_radius = 'const radius = entry.player.keeper ? (keeperDiving ? 5.6 : 4.4) : ball.z > 1.4 ? 2.25 : 2.65;'

assert old_reaction in text, 'keeper reaction timing not found'
assert old_radius in text, 'keeper dive radius not found'

text = text.replace(old_reaction, new_reaction, 1)
text = text.replace(old_radius, new_radius, 1)
path.write_text(text, encoding='utf-8')
