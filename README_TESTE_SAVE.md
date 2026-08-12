# Teste do SAVE

Abra o Painel Dev:

1. Pressione `P`.
2. Digite `menu`.
3. Em **Progresso Matemática · SAVE**, altere algum estado.
4. O painel agora informa se o Supabase confirmou ou se a mudança ficou apenas local.
5. Em **Diagnóstico do SAVE**, clique em **Comparar local × Supabase**.
6. Se aparecer `✓ SAVE CONFIRMADO NO SUPABASE`, recarregue a página e volte ao reino.
7. Se aparecer `⚠ DIVERGÊNCIA LOCAL × SUPABASE`, o problema está na persistência/banco, não no desenho do mapa.
8. **Recarregar SAVE do Supabase** descarta o estado local e força o jogo a mostrar exatamente o que está salvo no banco.

Se a escrita falhar, abra o console do navegador (F12) para ver a mensagem retornada pelo Supabase. Confira também se `supabase/001_profile_progress.sql` já foi executado no projeto correto.
