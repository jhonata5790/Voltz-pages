# Áudio Voltz

A primeira versão usa **Web Audio API** para SFX e uma música procedural original da Queimada, portanto funciona sem arquivos externos.

Pastas reservadas:
- `music/` para faixas definitivas `.ogg/.mp3`;
- `sfx/` para efeitos definitivos.

Para substituir um efeito sintetizado por arquivo:
```js
VoltzAudio.registerSfx("impact", "assets/audio/sfx/impacto.ogg");
```

Para substituir a música procedural:
```js
VoltzAudio.registerMusic("dodgeball", "assets/audio/music/queimada.ogg");
```

Volumes e mute são salvos em `localStorage`.
