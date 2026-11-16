# Regras da consulta

1. Toda coluna do `SELECT` existe no dicionário, ou é um agregado de uma coluna do dicionário.
2. O período filtra a data do fato: `data_pedido`, `data_apontamento`, `data_posicao` ou `data_inspecao`.
3. Vendas, produção e qualidade somam o período. Estoque não soma saldo ao longo dos dias.
4. Estoque usa a maior `data_posicao` dentro do período. Essa posição é a foto vigente.
5. `cobertura_dias` agrega com `MIN`. O número mostrado é a pior cobertura do grupo.
6. `ruptura` e `lote_retido` agregam com `MAX`. O grupo marca 1 se qualquer linha marcou 1.
7. `tempo_ciclo_min` agrega com `AVG`. Os demais indicadores de quantidade e valor agregam com `SUM`.
8. O recorte de unidade entra no `WHERE` depois do período.
   - Fábrica: `u.tipo_unidade = 'fabrica'`
   - Centro São Paulo: `u.unidade_id = 'CD-SAO'`
9. O `GROUP BY` cobre só as colunas de dimensão, na ordem em que aparecem.
10. O `ORDER BY` usa o primeiro indicador escolhido. Cobertura ordena do menor para o maior. Os demais, do maior para o menor.
11. Um erro com nome fora do dicionário não altera a consulta. A resposta cita o campo canônico e mantém o SQL já entregue.
