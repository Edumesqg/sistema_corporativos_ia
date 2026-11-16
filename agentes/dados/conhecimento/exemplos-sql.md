# Exemplos SQL

Os exemplos abaixo são a forma de referência. As outras combinações seguem `regras.md` com as mesmas tabelas.

## Vendas · 12 meses · unidade + família · três indicadores · todas as unidades

```sql
-- Vendas por unidade · Unidade + família
-- Gerado a partir de agentes/dados/conhecimento

SELECT
  u.unidade_id,
  u.unidade_nome,
  fa.familia_nome,
  SUM(v.quantidade) AS quantidade,
  SUM(v.faturamento) AS faturamento,
  SUM(v.pedido_atrasado) AS pedidos_em_atraso
FROM gold.horizonte.fato_vendas v
JOIN gold.horizonte.dim_unidade u
  ON v.unidade_id = u.unidade_id
JOIN gold.horizonte.dim_familia fa
  ON v.familia_id = fa.familia_id
WHERE v.data_pedido >= add_months(current_date(), -12)
GROUP BY 1, 2, 3
ORDER BY quantidade DESC;
```

## Estoque · 30 dias · perfil + unidade · saldo, cobertura e ruptura

A data filtrada é a posição mais recente. O saldo não é somado dia a dia.

```sql
-- Estoque de chave-bruta · Perfil + unidade
-- Posição mais recente do período. Saldo não é somado.

WITH posicao AS (
  SELECT *
  FROM gold.horizonte.fato_estoque e
  WHERE e.data_posicao = (
    SELECT MAX(e2.data_posicao)
    FROM gold.horizonte.fato_estoque e2
    WHERE e2.data_posicao >= date_sub(current_date(), 30)
  )
)
SELECT
  u.unidade_nome,
  pf.perfil_codigo,
  pf.perfil_nome,
  SUM(e.saldo_pecas) AS saldo_pecas,
  MIN(e.cobertura_dias) AS cobertura_dias,
  MAX(e.ruptura) AS ruptura
FROM posicao e
JOIN gold.horizonte.dim_unidade u
  ON e.unidade_id = u.unidade_id
JOIN gold.horizonte.dim_perfil pf
  ON e.perfil_id = pf.perfil_id
GROUP BY 1, 2, 3
ORDER BY saldo_pecas DESC;
```

## Como executar

1. Abra o editor SQL do ambiente analítico.
2. Selecione o warehouse de leitura.
3. Cole a consulta.
4. Rode primeiro com `LIMIT 100`.
5. Confira nomes de coluna contra este dicionário.
6. Tire o `LIMIT` quando a amostra estiver coerente.
