from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
standalone_path = Path('assets/js/football/football-standalone.js')
sports = sports_path.read_text(encoding='utf-8')
standalone = standalone_path.read_text(encoding='utf-8')

old_start = '''  function startFootball() {\n    const compact = state.mode === "championship";'''
new_start = '''  function startFootball() {\n    if (global.VoltzStandaloneFootball?.isStandalone?.()) {\n      global.VoltzStandaloneFootball?.onMatchStarted?.();\n    }\n    const compact = state.mode === "championship";'''
assert old_start in sports, 'startFootball anchor not found'
sports = sports.replace(old_start, new_start, 1)

old_hook = '''  function onMatchFinished() {\n    locked = false;\n    setStatus("PARTIDA ENCERRADA · você já pode voltar ao reino", true);\n  }'''
new_hook = '''  function onMatchStarted() {\n    locked = true;\n    returning = false;\n    setStatus("PARTIDA EM ANDAMENTO · finalize a partida para retornar ao reino");\n  }\n\n  function onMatchFinished() {\n    locked = false;\n    setStatus("PARTIDA ENCERRADA · você já pode voltar ao reino", true);\n  }'''
assert old_hook in standalone, 'standalone finish hook not found'
standalone = standalone.replace(old_hook, new_hook, 1)

old_export = '''    onExitBlocked,\n    onMatchFinished,\n    returnToWorld'''
new_export = '''    onExitBlocked,\n    onMatchStarted,\n    onMatchFinished,\n    returnToWorld'''
assert old_export in standalone, 'standalone export hook not found'
standalone = standalone.replace(old_export, new_export, 1)

sports_path.write_text(sports, encoding='utf-8')
standalone_path.write_text(standalone, encoding='utf-8')
