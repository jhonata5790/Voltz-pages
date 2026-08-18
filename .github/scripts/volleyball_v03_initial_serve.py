from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')
old = '''    renderVolleyballDynamic();

    let last = performance.now();
'''
new = '''    renderVolleyballDynamic();
    // A primeira bola da partida tambem passa pela preparacao de saque:
    // o rival aparece na linha de fundo com a bola antes do contato.
    volleyballPrepareServe(state.current, "rival");

    let last = performance.now();
'''
if old not in text:
    raise SystemExit('inicio do loop do Volei V0.3 nao encontrado')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
