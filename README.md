# IA da Empresa

Hub demonstrativo de assistentes corporativos. Cada assistente tem a própria pasta, os próprios comandos e o próprio conhecimento. A conversa só entrega o que essa pasta documenta.

A empresa da tela é fictícia: **Horizonte Fechaduras**, fabricante de chaves, fechaduras e chave-bruta. Não há modelo conectado, banco nem dado de cliente.

Desenvolvido por [Eduardo Mesquita](https://www.linkedin.com/in/engeduardomesquita/).

[English](#english)

## O problema

Um chat único em cima da empresa inteira responde qualquer coisa, inclusive o que a área não definiu. A pessoa não sabe qual fonte sustentou o número, qual procedimento estava vigente nem quanto aquela interação custou.

Este repositório mostra o desenho oposto: um hub em que cada assistente é uma pasta. Papel, comandos, conhecimento e roteiro ficam versionados junto com a tela.

## Quem usa

Na empresa fictícia, três trabalhos do dia:

- quem acompanha a operação e precisa de uma consulta, não de um número solto;
- quem recebe um lote fora do especificado e precisa do próximo passo do procedimento;
- quem vai para uma reunião e precisa transformar um briefing informal em um slide.

A tela de governança é para quem administra o hub: qual assistente, qual modelo, qual fonte e qual custo.

## O que os assistentes fazem

| Pasta | Entrega |
| --- | --- |
| `agentes/dados` | SQL da base `gold.horizonte`, montado com tema, período, granularidade, indicadores e recorte |
| `agentes/normas` | Trilha do procedimento LQP-014, com responsável, checklist e fonte |
| `agentes/estudio` | Um slide executivo desenhado a partir do briefing, no padrão de narrativa da casa |

Em cada pasta:

- `agente.md` define papel, entrega e limite
- `comandos.md` lista os botões do bate-papo
- `conhecimento/` é a única fonte
- `conversa.md` é o roteiro que a tela executa

O seletor oferece **Horizonte Preciso** e **Horizonte Direto**. Os dois leem a mesma pasta. O artefato final não muda. A governança registra qual modelo foi usado.

Há um freio em cada entrega. A consulta é mostrada, não executada num warehouse. O chamado de qualidade ganha um protocolo simulado e não é enviado. O slide fica na tela. Criar uma IA nova está fechado de propósito: a demo mostra o caminho de publicação, não um cadastro infinito.

## O que eles não fazem

- Não chamam um modelo de linguagem. As respostas estão no roteiro.
- Não inventam coluna, etapa, prazo, responsável ou número fora de `conhecimento/`.
- Não executam o SQL, não gravam disposição de lote e não publicam o slide num deck.
- Não medem precisão, latência nem custo real. Os cartões de governança (consultas, tokens, reais) são ilustrativos.

Se a pessoa disser que o lote já saiu da fábrica e o registro disser o contrário, a resposta aponta a divergência e segue o registro.

## Como abrir

Abra `index.html` no navegador. Não há servidor, instalação nem chave de API. A fonte Inter está em `fonts/`. Nada é carregado de uma CDN.

Os três roteiros são guiados por cliques. Não há campo livre: a próxima fala já está no botão, e cada botão está em `comandos.md`.

Para publicar no GitHub Pages, sirva a raiz do repositório. A página de entrada é `index.html`.

## O que foi conferido

A checagem desta versão é de percurso, não de avaliação estatística. Não há conjunto de perguntas medido, nem nota de precisão.

O que a demo sustenta, e dá para repetir abrindo a tela:

1. A consulta de dados só usa tabela, campo e agregado escritos no dicionário. Estoque não soma saldo ao longo dos dias: usa a posição mais recente.
2. A trilha de normas cita o LQP-014 revisão 2 e confronta a fala da pessoa com o registro do lote.
3. O slide repete os números do briefing. Trocar o público troca a coluna de decisão. Não troca cobertura nem código de perfil.
4. Trocar o modelo não troca o artefato.

Uma avaliação com modelo real, fonte citada em tempo de execução e custo por consulta fica fora deste corte.

## De onde veio a arquitetura

A separação entre pasta de conhecimento, comandos fechados e artefato verificável faz parte de uma pesquisa de mestrado em Administração em andamento na ESALQ/USP. Este repositório é uma aplicação prática dessa organização. Não traz hipótese fechada nem resultado de pesquisa.

## Licença

MIT. Veja `LICENSE`.

A fonte Inter, em `fonts/`, permanece sob a SIL Open Font License. Veja `fonts/OFL.txt`.

---

## English

Corporate assistant hub, shown as a demo. Each assistant has its own folder, its own commands, and its own knowledge. The conversation only returns what that folder documents.

The company on screen is fictional: **Horizonte Fechaduras**, a maker of keys, locks, and key blanks. There is no connected model, no database, and no client data.

Built by [Eduardo Mesquita](https://www.linkedin.com/in/engeduardomesquita/).

### The problem

One chat window over a whole company will answer anything, including figures and steps the business never defined. The person cannot tell which source backed the number, which procedure was in force, or what the interaction cost.

This repository shows the opposite shape: a hub where each assistant is a folder. Role, commands, knowledge, and script are versioned next to the screen.

### Who uses it

Inside the fictional company, three jobs from a working day:

- someone watching the operation who needs a query, not a loose number;
- someone facing a lot out of specification who needs the next step of the procedure;
- someone heading into a meeting who needs to turn an informal brief into one slide.

The governance screen is for whoever runs the hub: which assistant, which model, which source, and which cost.

### What the assistants do

| Folder | What they return |
| --- | --- |
| `agentes/dados` | SQL for the `gold.horizonte` base, built from theme, period, grain, metrics, and scope |
| `agentes/normas` | The LQP-014 procedure path, with owner, checklist, and source |
| `agentes/estudio` | One executive slide drawn from the brief, in the house narrative |

Each folder has:

- `agente.md` for role, output, and limit
- `comandos.md` for the chat buttons
- `conhecimento/` as the only source
- `conversa.md` as the script the screen runs

The picker offers **Horizonte Preciso** and **Horizonte Direto**. Both read the same folder. The final artifact does not change. Governance records which model was selected.

Each delivery has a brake. The query is shown and is not run on a warehouse. The quality ticket receives a simulated protocol and is not sent. The slide stays on the page. Creating a new assistant is closed on purpose: the demo shows the publication path, not an endless catalog.

### What they do not do

- They do not call a language model. The replies live in the script.
- They do not invent a column, step, deadline, owner, or number outside `conhecimento/`.
- They do not execute the SQL, record a lot disposition, or publish the slide into a deck.
- They do not measure precision, latency, or real cost. The governance cards (queries, tokens, currency) are illustrative.

If the person says the lot already left the plant and the record says otherwise, the reply points out the gap and follows the record.

### How to open it

Open `index.html` in a browser. There is no server, no install, and no API key. The Inter font is in `fonts/`. Nothing is loaded from a CDN.

The three paths are click-guided. There is no free-text box: the next line is already a button, and each button is listed in `comandos.md`.

To publish with GitHub Pages, serve the repository root. The entry page is `index.html`.

### What was checked

This version was checked by walking the paths, not by a statistical evaluation. There is no scored question set and no precision figure.

What the demo holds, and what you can repeat by opening the screen:

1. The data query only uses tables, fields, and aggregates written in the dictionary. Inventory does not sum stock across days: it uses the latest position.
2. The norms path cites LQP-014 revision 2 and checks the person's statement against the lot record.
3. The slide repeats the numbers from the brief. Changing the audience changes the decision column. It does not change coverage or profile codes.
4. Changing the model does not change the artifact.

An evaluation with a live model, a source cited at runtime, and a cost per query is outside this cut.

### Where the architecture comes from

Splitting a knowledge folder, closed commands, and a checkable artifact is part of ongoing master's research in Management at ESALQ/USP. This repository is a practical application of that organization. It does not state a closed hypothesis or a research result.

### License

MIT. See `LICENSE`.

The Inter font, in `fonts/`, remains under the SIL Open Font License. See `fonts/OFL.txt`.
