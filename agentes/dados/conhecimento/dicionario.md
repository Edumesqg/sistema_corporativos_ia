# Dicionário de dados

Nomes canônicos. Um nome que não está nesta lista não entra na consulta.

| Campo | Tabela | Significado | Unidade |
| --- | --- | --- | --- |
| unidade_id | dim_unidade | Código da unidade | texto |
| unidade_nome | dim_unidade | Nome da unidade | texto |
| tipo_unidade | dim_unidade | fabrica ou centro_distribuicao | texto |
| familia_id | dim_familia | Código da família | texto |
| familia_nome | dim_familia | Nome da família | texto |
| perfil_id | dim_perfil | Código interno do perfil | texto |
| perfil_codigo | dim_perfil | Código de catálogo, prefixo HZ- | texto |
| perfil_nome | dim_perfil | Nome do perfil | texto |
| cliente_id | dim_cliente | Código do cliente | texto |
| cliente_nome | dim_cliente | Nome do cliente | texto |
| segmento | dim_cliente | Varejo, obra, hospitalidade ou atacado | texto |
| lote_id | dim_lote | Código do lote | texto |
| data_abertura | dim_lote | Data de abertura do lote | data |
| data_pedido | fato_vendas | Data do pedido | data |
| quantidade | fato_vendas | Peças pedidas | peça |
| faturamento | fato_vendas | Valor do pedido | real |
| pedido_atrasado | fato_vendas | 1 se o pedido atrasou | flag |
| data_apontamento | fato_producao | Data do apontamento | data |
| pecas_produzidas | fato_producao | Peças aprovadas no apontamento | peça |
| pecas_refugo | fato_producao | Peças descartadas no apontamento | peça |
| tempo_ciclo_min | fato_producao | Tempo médio do ciclo | minuto |
| data_posicao | fato_estoque | Data da posição de estoque | data |
| saldo_pecas | fato_estoque | Saldo naquela data | peça |
| cobertura_dias | fato_estoque | Dias de venda cobertos pelo saldo | dia |
| ruptura | fato_estoque | 1 se o saldo não cobre o dia seguinte | flag |
| data_inspecao | fato_qualidade | Data da inspeção | data |
| pecas_inspecionadas | fato_qualidade | Peças inspecionadas | peça |
| pecas_nao_conformes | fato_qualidade | Peças fora do especificado | peça |
| lote_retido | fato_qualidade | 1 se o lote foi segregado | flag |

## Nomes que não existem

| Nome pedido | Campo certo |
| --- | --- |
| qtd_venda | quantidade |
| qtd_boa | pecas_produzidas |
| estoque_atual | saldo_pecas |
| ppm | não é coluna. Calcular com a regra de qualidade |

PPM = `pecas_nao_conformes / pecas_inspecionadas × 1.000.000`, quando `pecas_inspecionadas` é maior que zero.
