# Progressão — Reino da Matemática

A progressão é calculada a partir do save; não existe `stage` redundante salvo no banco.

## Fluxo

1. **Ponte das Equações** — estabilizar `equacao-operacoes-01`.
2. **Restauração das zonas** — derrotar pelo menos **6 dos 9** inimigos comuns e estabilizar **as 3 Equações do Mundo**.
3. **Ruínas do Melog** — os requisitos acima removem o selo físico e fazem Melog aparecer.
4. **Fortaleza do Golem** — derrotar Melog abre o Portão do Teorema e libera o Golem.

A regra `6/9` evita obrigar limpeza total do mapa, enquanto as 3 equações garantem que o jogador visite Operações, Fatores e Potências.

## Configuração

Os requisitos ficam em `assets/js/realms/math/math-data.js`, no objeto `progression`. O motor lê essa configuração para decidir spawn dos chefes, colisões dos portões, diálogos e HUD.

## HUD

No Reino da Matemática aparece uma HUD com:

- etapa atual;
- objetivo;
- ponte;
- inimigos necessários;
- Equações do Mundo;
- estado de Melog;
- estado do Golem.

Tudo é reconstruído automaticamente ao carregar o save do Supabase.


## Final do guardião

O Golem não é derrotado. Aos 50% de PV ele encerra o teste, entrega o Diploma da Matemática e desbloqueia Raciocínio Estruturado.
