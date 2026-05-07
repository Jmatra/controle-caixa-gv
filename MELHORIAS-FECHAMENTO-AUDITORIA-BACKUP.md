# Melhorias adicionadas — Fechamento, auditoria e backup

## 1. Fechamento de Caixa

Foi adicionada a seção **Fechamento de Caixa** no menu lateral e no menu mobile.

Funcionalidades:

- selecionar a data do fechamento;
- ver resumo do dia: loja, quantidade de lançamentos, vendas, despesas e lucro;
- fechar o caixa do dia;
- reabrir o caixa fechado;
- listar os últimos fechamentos.

Ao fechar o caixa, o sistema cria um registro em:

```txt
caixa_gv/fechamentos_caixa/{lojaId}/{data}
```

## 2. Bloqueio de alterações em caixa fechado

Depois que uma data é fechada, o sistema bloqueia:

- novo lançamento para aquela data;
- edição de lançamento daquela data;
- exclusão de lançamento daquela data.

Para alterar uma data fechada, um administrador precisa reabrir o caixa na seção **Fechamento de Caixa**.

## 3. Histórico de alterações / auditoria

O sistema agora registra ações importantes em:

```txt
caixa_gv/auditoria/{lojaId}/{auditId}
```

Ações registradas:

- criação de lançamento;
- edição de lançamento;
- exclusão de lançamento;
- fechamento de caixa;
- reabertura de caixa;
- geração de backup JSON.

A seção **Fechamento de Caixa** mostra os últimos registros de auditoria da loja ativa.

## 4. Backup JSON da loja ativa

Foi adicionado o botão **Backup JSON** na seção Fechamento de Caixa.

O arquivo exporta:

- lançamentos da loja ativa;
- fornecedores;
- funcionários;
- pagamentos de funcionários;
- contas a pagar;
- fechamentos de caixa;
- últimos registros de auditoria.

O backup é baixado no navegador como arquivo `.json`.

## 5. Regras do Firebase atualizadas

O arquivo `firebase-database.rules.json` foi atualizado com permissões para:

- `fechamentos_caixa`;
- `auditoria`;
- `backups`.

Aplique essas regras no Firebase Console em:

```txt
Realtime Database > Rules
```

## 6. Cache do PWA atualizado

O `sw.js` foi atualizado para a versão de cache `v4`, ajudando o navegador a puxar a versão nova depois de publicar no GitHub Pages.
