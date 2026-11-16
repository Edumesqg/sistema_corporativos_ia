# Comandos

O bate-papo só oferece estas escolhas. Não há campo livre.

| Momento | Comando | Efeito |
| --- | --- | --- |
| Abertura | Preciso de uma consulta para acompanhar a operação | Inicia o roteiro |
| Tema | Vendas por unidade | Lê `fato_vendas` |
| Tema | Produção por lote | Lê `fato_producao` |
| Tema | Estoque de chave-bruta | Lê `fato_estoque` na posição mais recente |
| Tema | Não conformidade | Lê `fato_qualidade` |
| Período | Últimos 30 dias | `date_sub(current_date(), 30)` |
| Período | Últimos 90 dias | `date_sub(current_date(), 90)` |
| Período | Últimos 12 meses | `add_months(current_date(), -12)` |
| Período | Ano corrente | `year(coluna) = year(current_date())` |
| Granularidade | Conforme o tema | Define colunas e `GROUP BY` |
| Indicadores | Um ou mais | Entram no `SELECT`. Pelo menos um |
| Recorte | Todas as unidades | Sem filtro de unidade |
| Recorte | Só a fábrica (Curitiba) | `u.tipo_unidade = 'fabrica'` |
| Recorte | Só o Centro São Paulo | `u.unidade_id = 'CD-SAO'` |
| Confirmação | Sim, continuar | Monta a lógica em passos |
| Consulta | Gerar SQL | Entrega a consulta |
| Validação | Validar no ambiente analítico | Mostra o roteiro de execução |
| Validação | A consulta voltou com erro | Confronta o erro com o dicionário |
| Fecho | Manter o SQL do dicionário | Encerra com a consulta já entregue |
| Fecho | Encerrar | Preserva o contexto |

Granularidade por tema:

- Vendas: Unidade + família, Unidade + mês, Cliente + família
- Produção: Lote, Centro + dia, Produto + mês
- Estoque: Perfil + unidade, Família + unidade
- Não conformidade: Lote, Família + mês, Unidade + mês
