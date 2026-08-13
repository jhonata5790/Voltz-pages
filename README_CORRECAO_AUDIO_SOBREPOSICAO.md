# Correção — músicas acumulando

Bug corrigido no `AudioManager`.

## Causas

1. `playMusic()` carrega arquivos `.ogg` de forma assíncrona. Uma requisição antiga
   podia terminar de carregar depois de uma troca de cena e começar a tocar fora de hora.

2. `stopMusic()` fazia fade usando um callback que só parava a música se ela ainda
   fosse `currentMusic`. Se uma nova faixa começasse antes do callback, a faixa antiga
   podia ficar tocando sem ser mais rastreada.

## Correção

- Cada pedido de música recebe um `requestId`.
- Qualquer requisição antiga é invalidada quando uma nova música é solicitada.
- Resultado de carregamento obsoleto nunca inicia playback.
- Uma nova faixa cancela fades pendentes e encerra a anterior antes de tocar.
- `stopMusic()` guarda e interrompe explicitamente a fonte que iniciou o fade.
- `stopMusic()` também invalida carregamentos de música ainda pendentes.
- Adicionado `VoltzAudio.getCurrentMusic()` para facilitar testes.

Regra do sistema após a correção: **uma única trilha musical ativa por vez**.
