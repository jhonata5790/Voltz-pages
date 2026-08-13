# Correção — trilha da Vila Central no carregamento inicial

A Vila Central já possuía a faixa `voltz-vila.ogg`, porém a música só era solicitada em `changeScene()`. Como o jogador nasce diretamente na Vila, a cena inicial não passava por essa função.

Correções:
- `setupPlayer()` agora registra imediatamente a música da cena inicial;
- a solicitação fica pendente enquanto a política de autoplay do navegador bloqueia áudio;
- no primeiro clique/tecla, `AudioManager.unlock()` inicia a faixa pendente;
- fallback adicional restaura a música da cena ativa caso não exista pedido pendente.

Resultado: a Vila começa com seu tema assim que o primeiro gesto do jogador libera o áudio.
