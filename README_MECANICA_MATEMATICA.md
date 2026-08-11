# Reino da Matemática — mapa-jornada e Equações do Mundo

Esta versão transforma o Reino da Matemática em uma jornada por zonas, em vez de um mapa aberto simples.

## Fluxo do reino

1. **Praça do Infinito** — ponto de chegada e retorno à Vila Central.
2. **Distrito das Operações** — Adição e Subtração.
3. **Ponte das Equações** — inicialmente instável e fisicamente bloqueada.
4. A ponte abre a bifurcação para:
   - **Bosque das Potências** — Potenciação e Radiciação;
   - **Campos dos Fatores** — Multiplicação e Divisão.
5. **Ruínas do Melog** — bloqueadas até os inimigos básicos das três zonas serem derrotados.
6. **Fortaleza do Golem** — bloqueada até Melog ser superado.

O Golem fica no extremo norte do mapa e pode ser percebido como objetivo final desde o começo, mesmo sem o jogador conseguir chegar até ele.

## Equações do Mundo

Existem 3 mecanismos interativos:

- Núcleo da Ponte — `18 + ? = 45`
- Engrenagem-Mestra dos Fatores — `6 × ? = 54`
- Cristal-Raiz Ancestral — `√? = 8`

Aproxime-se e pressione `E`. As alternativas são embaralhadas.

A primeira equação não é apenas bônus: ela controla a **Ponte das Equações**. Antes da solução, a ponte possui colisão e impede o avanço. Depois da solução, a colisão desaparece e o caminho é materializado. Esse estado usa o save do jogador.

## Ritmo Lógico

Cada Equação do Mundo estabilizada concede `+2 segundos` por pergunta em batalhas dentro do Reino da Matemática:

- 0/3 = +0s
- 1/3 = +2s
- 2/3 = +4s
- 3/3 = +6s

O bônus não funciona fora do reino e é restaurado automaticamente pelo progresso salvo.

## Bloqueios físicos de progressão

Os bloqueios agora fazem parte do cenário e não são apenas mensagens:

- **Ponte das Equações**: abre após `equacao-operacoes-01`.
- **Selo das Ruínas**: abre quando o mini-chefe é liberado, ou seja, após os inimigos básicos exigidos pelo reino.
- **Portão do Teorema**: abre quando o Golem é liberado após Melog.

Os colliders são recalculados quando o progresso muda e também quando o save é carregado.

## Próxima etapa

O bônus permanente do Diploma da Matemática ainda não foi implementado. Ele deve entrar junto da reformulação do desafio do Golem: a luta termina em 50% de PV, entra em diálogo e entrega o Diploma da Matemática em vez de matar o guardião.
