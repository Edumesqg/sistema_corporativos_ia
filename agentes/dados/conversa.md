# Roteiro da conversa

A demo implementa este roteiro. Cada clique grava uma decisão. O SQL final usa só essas decisões e os arquivos de `conhecimento/`.

1. A pessoa pede uma consulta para acompanhar a operação.
2. Escolhe o tema: vendas, produção, estoque ou não conformidade.
3. Escolhe o período: 30 dias, 90 dias, 12 meses ou ano corrente.
4. Escolhe a granularidade daquele tema.
5. Marca um ou mais indicadores e confirma.
6. Escolhe o recorte: todas as unidades, fábrica de Curitiba ou Centro São Paulo.
7. O assistente mostra a leitura: período, granularidade, indicadores, recorte e campos.
8. A pessoa confirma. O assistente lista a lógica, inclusive a regra da posição de estoque quando o tema for estoque.
9. A pessoa pede o SQL. A consulta chega com as fontes: modelo, dicionário, regras e exemplos.
10. A linha de fechamento registra o modelo usado, Horizonte Preciso ou Horizonte Direto. O artefato é o mesmo.
11. Opcional: validar no ambiente analítico e informar um erro de coluna. O erro de cada tema está no dicionário (`qtd_venda`, `qtd_boa`, `estoque_atual`, `ppm`). O assistente cita o campo certo e mantém a consulta.
