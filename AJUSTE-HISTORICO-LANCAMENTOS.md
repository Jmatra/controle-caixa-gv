# Ajuste do histórico completo dos lançamentos

Correção aplicada após identificar que o histórico de alterações mostrava apenas eventos registrados depois da instalação da auditoria.

## O que mudou

- A auditoria agora carrega todos os registros salvos em `auditoria/{loja}`; foi removido o limite de 100 registros.
- O backup JSON agora inclui `auditoriaCompleta` em vez de apenas os últimos 100 registros.
- A tela **Fechamento de Caixa** recebeu a tabela **Histórico completo dos lançamentos**, que lê diretamente os dados existentes em `lancamentos_loja/{loja}`.
- Foi adicionado o botão **Puxar histórico antigo**, que cria registros retroativos de auditoria para os lançamentos que já existiam antes da melhoria.
- A importação retroativa usa IDs determinísticos no formato `mig_lanc_{idDoLancamento}`, evitando duplicidade caso o botão seja usado mais de uma vez.
- O resumo diário da sidebar foi ajustado para somar todos os lançamentos do dia, e não apenas o primeiro registro encontrado.
- Cache do PWA atualizado para `v5`.

## Como usar

1. Suba esta versão no GitHub.
2. Abra o sistema e force atualização com `Ctrl + F5`.
3. Vá em **Fechamento de Caixa**.
4. Confira a tabela **Histórico completo dos lançamentos**.
5. Clique em **Puxar histórico antigo** para registrar os lançamentos antigos também no histórico de alterações/auditoria.

## Observação

O histórico de alterações/auditoria não existia antes desta melhoria. Por isso, os lançamentos antigos não apareciam automaticamente como “criados” na auditoria. A nova tabela mostra todos os lançamentos diretamente, e o botão de sincronização cria a auditoria retroativa.
