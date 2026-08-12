# Correção — Palavras do Mundo

As três Palavras do Mundo do Reino de Português estavam registradas sem coordenadas `x`/`y`.
Isso fazia a distância de interação virar `NaN`, portanto a tecla **E** nunca reconhecia a Palavra como próxima.

## Corrigido

- Inscrição da Passagem: `(2500, 2390)`
- Jardim das Conexões: `(1260, 1760)`
- Mural da Concordância: `(3740, 1760)`
- alcance de interação: `145`
- o sistema genérico agora ignora mecanismos com coordenadas inválidas e aceita `interactionRange` por mecanismo.

Nenhuma alteração de banco/Supabase é necessária.
