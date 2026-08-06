SISTEMA MODULAR DE INTERIORES

Estrutura:
- assets/js/interiors/interior-data.js: registro central dos interiores.
- assets/js/interiors/interior-system.js: entrada, saída, renderização e estado visual genéricos.
- assets/js/interiors/library-interior.js: mapa, móveis, colisores, porta e visual da Biblioteca.
- assets/css/interiors/interior-system.css: aparência comum de qualquer interior.
- assets/css/interiors/library-interior.css: aparência exclusiva da Biblioteca.

Para criar outro interior:
1. Crie um arquivo em assets/js/interiors/.
2. Registre a configuração com window.VoltzInteriors.register(...).
3. Carregue esse arquivo antes de assets/js/openworld.js.

O openworld.js não contém mais regras específicas da Biblioteca.
