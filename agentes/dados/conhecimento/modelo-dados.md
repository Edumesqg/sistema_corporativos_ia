# Modelo de dados

Camada analítica: `gold.horizonte`.

## Dimensões

### dim_unidade

| Campo | Exemplo |
| --- | --- |
| unidade_id | FAB-CTB, CD-SAO, CD-REC |
| unidade_nome | Fábrica Curitiba, Centro São Paulo, Centro Recife |
| tipo_unidade | fabrica, centro_distribuicao |

### dim_familia

| familia_id | familia_nome |
| --- | --- |
| FAM-RES | Residencial |
| FAM-COM | Comercial |
| FAM-CAD | Cadeado |
| FAM-BRU | Chave-bruta |

### dim_perfil

| perfil_id | perfil_codigo | perfil_nome | familia_id |
| --- | --- | --- | --- |
| PF-01 | HZ-R12 | Residencial lisa | FAM-RES |
| PF-02 | HZ-R30 | Residencial tetra | FAM-RES |
| PF-03 | HZ-C04 | Comercial tetra | FAM-COM |
| PF-04 | HZ-C18 | Comercial lisa | FAM-COM |
| PF-05 | HZ-K07 | Cadeado latão | FAM-CAD |
| PF-06 | HZ-B21 | Chave-bruta 2,2 mm | FAM-BRU |

### dim_cliente

| cliente_id | cliente_nome | segmento |
| --- | --- | --- |
| CL-01 | Rede Tranca Sul | Varejo |
| CL-02 | Construtora Laje | Obra |
| CL-03 | Hotelaria Pousos | Hospitalidade |
| CL-04 | Atacado Ferragens Norte | Atacado |

### dim_lote

| lote_id | perfil_id | data_abertura |
| --- | --- | --- |
| LT-2388 | PF-06 | 2026-10-28 |
| LT-2390 | PF-01 | 2026-10-30 |
| LT-2394 | PF-05 | 2026-11-04 |
| LT-2408 | PF-01 | 2026-11-10 |
| LT-2411 | PF-04 | 2026-11-12 |

## Fatos

### fato_vendas

Grão: pedido, unidade, perfil, cliente, dia.

Campos: `data_pedido`, `unidade_id`, `familia_id`, `perfil_id`, `cliente_id`, `quantidade`, `faturamento`, `pedido_atrasado`.

`pedido_atrasado` vale 1 quando o pedido passou do prazo combinado e 0 nos demais.

### fato_producao

Grão: apontamento diário do lote na fábrica.

Campos: `data_apontamento`, `lote_id`, `unidade_id`, `perfil_id`, `pecas_produzidas`, `pecas_refugo`, `tempo_ciclo_min`.

### fato_estoque

Grão: posição diária do perfil na unidade.

Campos: `data_posicao`, `unidade_id`, `perfil_id`, `saldo_pecas`, `cobertura_dias`, `ruptura`.

`ruptura` vale 1 quando o saldo não cobre o próximo dia de venda.

### fato_qualidade

Grão: inspeção do lote.

Campos: `data_inspecao`, `lote_id`, `unidade_id`, `perfil_id`, `pecas_inspecionadas`, `pecas_nao_conformes`, `lote_retido`.

`lote_retido` vale 1 quando o lote ficou segregado.

## Ligações

- Fatos ligam em `dim_unidade` por `unidade_id`.
- `fato_vendas` liga em `dim_familia` por `familia_id` e em `dim_cliente` por `cliente_id`.
- Fatos com `perfil_id` ligam em `dim_perfil`. A família do perfil sai de `dim_perfil.familia_id`.
- `fato_producao` e `fato_qualidade` ligam em `dim_lote` por `lote_id`.
