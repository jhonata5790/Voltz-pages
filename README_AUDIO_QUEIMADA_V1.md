# Áudio global + Queimada V1

Implementado:
- `assets/js/core/audio-manager.js`;
- volumes separados: geral, música e efeitos;
- mute e persistência via localStorage;
- painel de áudio no HUD;
- música procedural original temporária da Queimada;
- intensidade dinâmica no turno do jogador, turno do Rubro e fases finais;
- SFX sintetizados de menu, arremessos, impacto, dano, escudo, finta, ricochete, agarrão, Perfect Catch, contra-ataque, apito, vitória e derrota;
- ducking da música em impactos fortes e Perfect Catch;
- suporte preparado para arquivos reais via `VoltzAudio.registerSfx()` e `VoltzAudio.registerMusic()`.

Nenhum áudio de terceiros foi incluído.
