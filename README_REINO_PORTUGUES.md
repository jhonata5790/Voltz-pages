# Reino de Português

Segundo reino jogável do Voltz Education.

## Progressão

1. Praça da Palavra
2. Bairro Ortográfico
3. Reconstruir a primeira Palavra do Mundo para abrir a Passagem do Sentido
4. Explorar Jardim da Semântica e Distrito Sintático
5. Derrotar pelo menos 6 dos 9 inimigos comuns e reconstruir as 3 Palavras do Mundo
6. Enfrentar Ortcepse no Arquivo Invertido
7. Enfrentar o Espectro da Gramática na Catedral
8. Receber o Diploma de Português

## Conteúdo

- 3 famílias de inimigos comuns
  - Rasura Ortográfica
  - Eco Semântico
  - Fragmento Sintático
- 9 inimigos comuns no mapa
- 15 perguntas por família
- 15 perguntas do Ortcepse
- 15 perguntas do Espectro da Gramática
- total: 75 perguntas de Português
- 3 Palavras do Mundo
- mini-boss: Ortcepse
- boss: Espectro da Gramática

## Palavras do Mundo

São desafios linguísticos que alteram fisicamente o mapa. O jogador precisa escolher a palavra que mantém ortografia, concordância ou sentido do trecho apresentado.

As três Palavras do Mundo são salvas em `solvedWorldEquationIds`, reaproveitando a estrutura genérica já existente de mecanismos persistentes do mundo.

## Diploma

Ao dissipar o Espectro da Gramática:

- Diploma de Português
- competência permanente: **Leitura Crítica**

Leitura Crítica pode ser usada uma vez por batalha e marca uma alternativa incorreta como semanticamente incoerente. Diferente de Raciocínio Estruturado, a alternativa não é removida e ainda pode ser clicada.

## Save

Usa o mesmo campo JSON `progresso` já existente. Não existe migration nova de Supabase.

Chave do reino: `reino-gramatica`.

## Painel DEV

`P` → código `menu`.

Foi adicionada uma seção de teleporte para:

- Praça da Palavra
- Bairro Ortográfico
- Jardim da Semântica
- Distrito Sintático
- Arquivo Invertido
- Catedral da Gramática
