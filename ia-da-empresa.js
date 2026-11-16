/* IA da Empresa — demo da Horizonte Fechaduras
   Roteiros: agentes/dados/conversa.md, agentes/normas/conversa.md, agentes/estudio/conversa.md */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const Model = {
    id: 'preciso',
    label() { return this.id === 'preciso' ? 'Horizonte Preciso' : 'Horizonte Direto'; },
    note() {
      return this.id === 'preciso'
        ? 'Horizonte Preciso responde com a pasta deste agente e registra a fonte.'
        : 'Horizonte Direto usa a mesma pasta e entrega o mesmo artefato, com menos texto.';
    },
    set(id) {
      this.id = id === 'direto' ? 'direto' : 'preciso';
      $$('.model-select').forEach((s) => { s.value = this.id; });
      toast(this.note());
    }
  };

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function openModal(id) { $('#' + id).classList.remove('hidden'); }
  function closeModal(id) { $('#' + id).classList.add('hidden'); }

  function openDrawer(title, html) {
    $('#drawer-title').textContent = title;
    $('#drawer-body').innerHTML = html;
    $('#drawer').classList.remove('hidden');
    $('#drawer-backdrop').classList.remove('hidden');
  }
  function closeDrawer() {
    $('#drawer').classList.add('hidden');
    $('#drawer-backdrop').classList.add('hidden');
  }

  let currentPage = 'home';

  function navigate(page) {
    if (!page) return;
    currentPage = page;
    $$('.page').forEach((p) => p.classList.toggle('active', p.dataset.page === page));
    $$('.nav-btn[data-page]').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
    $('#sidebar')?.classList.remove('open');
    if (page === 'conhecimento') CC.ensureWelcome();
    if (page === 'normas') NP.ensureWelcome();
    if (page === 'estudio') ES.ensureWelcome();
    if (page === 'minhas') mirrorMinhas();
    const main = $('#main');
    if (main) main.scrollTop = 0;
    main?.querySelector('.page.active')?.scrollTo?.(0, 0);
  }

  function mirrorMinhas() {
    const src = $('#page-home .ia-grid');
    const dst = $('#minhas-mirror');
    if (src && dst) dst.innerHTML = src.innerHTML;
  }

  function av(user) {
    return user ? '<div class="av">EM</div>' : '<div class="av">IA</div>';
  }

  function appendMsg(inner, html, user = false) {
    const el = document.createElement('div');
    el.className = 'msg ' + (user ? 'user' : 'bot');
    el.innerHTML = av(user) + '<div class="bubble">' + html + '</div>';
    inner.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
  }

  async function thinking(inner, steps, each = 650) {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.innerHTML = av(false) + `<div class="bubble"><div class="wow-loading">${
      steps.map((s, i) => `<div class="think-s${i === 0 ? ' on' : ''}"><span class="tdot"></span>${s}</div>`).join('')
    }</div></div>`;
    inner.appendChild(wrap);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
    const items = $$('.think-s', wrap);
    for (let i = 0; i < items.length; i++) {
      items.forEach((it, j) => {
        it.classList.toggle('on', j === i);
        it.classList.toggle('done', j < i);
      });
      await sleep(each);
    }
    items.forEach((it) => { it.classList.remove('on'); it.classList.add('done'); });
    await sleep(220);
    wrap.remove();
  }

  function disableActs(root) {
    if (!root) return;
    $$('.act, .choice, .chk-opt, .chip', root).forEach((b) => { b.disabled = true; });
    $$('.chk-opt input', root).forEach((b) => { b.disabled = true; });
  }

  function choices(attr, items) {
    return `<div class="choice-grid">${items.map((it) =>
      `<button type="button" class="choice" ${attr}="${it.k}">${it.label}</button>`
    ).join('')}</div>`;
  }

  function pseudo(lines) {
    return `<ol class="pseudo-list">${lines.map((t, i) =>
      `<li><span class="pseudo-n">${i + 1}</span><span>${t}</span></li>`
    ).join('')}</ol>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ── Dados gerais ── */
  const PERIODS = {
    d30: { label: 'Últimos 30 dias', predicate: (col) => `${col} >= date_sub(current_date(), 30)` },
    d90: { label: 'Últimos 90 dias', predicate: (col) => `${col} >= date_sub(current_date(), 90)` },
    m12: { label: 'Últimos 12 meses', predicate: (col) => `${col} >= add_months(current_date(), -12)` },
    ytd: { label: 'Ano corrente', predicate: (col) => `year(${col}) = year(current_date())` }
  };

  const SCOPES = {
    todas: { label: 'Todas as unidades', where: '' },
    fabrica: { label: 'Só a fábrica (Curitiba)', where: "u.tipo_unidade = 'fabrica'" },
    cd: { label: 'Só o Centro São Paulo', where: "u.unidade_id = 'CD-SAO'" }
  };

  const THEMES = {
    vendas: {
      label: 'Vendas por unidade',
      from: 'gold.horizonte.fato_vendas v',
      date: 'v.data_pedido',
      unitJoin: 'JOIN gold.horizonte.dim_unidade u ON v.unidade_id = u.unidade_id',
      metrics: [
        { id: 'quantidade', label: 'Quantidade', sql: 'SUM(v.quantidade) AS quantidade', order: 'quantidade DESC' },
        { id: 'faturamento', label: 'Faturamento', sql: 'SUM(v.faturamento) AS faturamento', order: 'faturamento DESC' },
        { id: 'atraso', label: 'Pedidos em atraso', sql: 'SUM(v.pedido_atrasado) AS pedidos_em_atraso', order: 'pedidos_em_atraso DESC' }
      ],
      grains: {
        uf: {
          label: 'Unidade + família',
          selects: ['u.unidade_id', 'u.unidade_nome', 'fa.familia_nome'],
          joins: [
            'JOIN gold.horizonte.dim_unidade u ON v.unidade_id = u.unidade_id',
            'JOIN gold.horizonte.dim_familia fa ON v.familia_id = fa.familia_id'
          ]
        },
        um: {
          label: 'Unidade + mês',
          selects: ['u.unidade_nome', "date_trunc('month', v.data_pedido) AS mes"],
          joins: ['JOIN gold.horizonte.dim_unidade u ON v.unidade_id = u.unidade_id']
        },
        cf: {
          label: 'Cliente + família',
          selects: ['cl.cliente_nome', 'fa.familia_nome'],
          joins: [
            'JOIN gold.horizonte.dim_cliente cl ON v.cliente_id = cl.cliente_id',
            'JOIN gold.horizonte.dim_familia fa ON v.familia_id = fa.familia_id'
          ]
        }
      },
      wrong: {
        error: 'COLUMN_NOT_FOUND: qtd_venda',
        text: 'O dicionário de <code>fato_vendas</code> registra <strong>quantidade</strong>. Não existe <code>qtd_venda</code>.'
      }
    },
    producao: {
      label: 'Produção por lote',
      from: 'gold.horizonte.fato_producao prd',
      date: 'prd.data_apontamento',
      unitJoin: 'JOIN gold.horizonte.dim_unidade u ON prd.unidade_id = u.unidade_id',
      metrics: [
        { id: 'pecas', label: 'Peças produzidas', sql: 'SUM(prd.pecas_produzidas) AS pecas_produzidas', order: 'pecas_produzidas DESC' },
        { id: 'refugo', label: 'Refugo', sql: 'SUM(prd.pecas_refugo) AS pecas_refugo', order: 'pecas_refugo DESC' },
        { id: 'ciclo', label: 'Tempo de ciclo', sql: 'AVG(prd.tempo_ciclo_min) AS tempo_ciclo_min', order: 'tempo_ciclo_min DESC' }
      ],
      grains: {
        lote: {
          label: 'Lote',
          selects: ['lt.lote_id', 'pf.perfil_codigo'],
          joins: [
            'JOIN gold.horizonte.dim_lote lt ON prd.lote_id = lt.lote_id',
            'JOIN gold.horizonte.dim_perfil pf ON prd.perfil_id = pf.perfil_id'
          ]
        },
        dia: {
          label: 'Centro + dia',
          selects: ['u.unidade_nome', 'prd.data_apontamento'],
          joins: ['JOIN gold.horizonte.dim_unidade u ON prd.unidade_id = u.unidade_id']
        },
        pm: {
          label: 'Produto + mês',
          selects: ['pf.perfil_codigo', "date_trunc('month', prd.data_apontamento) AS mes"],
          joins: ['JOIN gold.horizonte.dim_perfil pf ON prd.perfil_id = pf.perfil_id']
        }
      },
      wrong: {
        error: 'COLUMN_NOT_FOUND: qtd_boa',
        text: 'O dicionário de <code>fato_producao</code> registra <strong>pecas_produzidas</strong>. Não existe <code>qtd_boa</code>.'
      }
    },
    estoque: {
      label: 'Estoque de chave-bruta',
      from: 'gold.horizonte.fato_estoque e',
      date: 'e.data_posicao',
      snapshot: true,
      unitJoin: 'JOIN gold.horizonte.dim_unidade u ON e.unidade_id = u.unidade_id',
      metrics: [
        { id: 'saldo', label: 'Saldo', sql: 'SUM(e.saldo_pecas) AS saldo_pecas', order: 'saldo_pecas DESC' },
        { id: 'cobertura', label: 'Cobertura em dias', sql: 'MIN(e.cobertura_dias) AS cobertura_dias', order: 'cobertura_dias ASC' },
        { id: 'ruptura', label: 'Ruptura', sql: 'MAX(e.ruptura) AS ruptura', order: 'ruptura DESC' }
      ],
      grains: {
        pu: {
          label: 'Perfil + unidade',
          selects: ['u.unidade_nome', 'pf.perfil_codigo', 'pf.perfil_nome'],
          joins: [
            'JOIN gold.horizonte.dim_unidade u ON e.unidade_id = u.unidade_id',
            'JOIN gold.horizonte.dim_perfil pf ON e.perfil_id = pf.perfil_id'
          ]
        },
        fu: {
          label: 'Família + unidade',
          selects: ['u.unidade_nome', 'fa.familia_nome'],
          joins: [
            'JOIN gold.horizonte.dim_unidade u ON e.unidade_id = u.unidade_id',
            'JOIN gold.horizonte.dim_perfil pf ON e.perfil_id = pf.perfil_id',
            'JOIN gold.horizonte.dim_familia fa ON pf.familia_id = fa.familia_id'
          ]
        }
      },
      wrong: {
        error: 'COLUMN_NOT_FOUND: estoque_atual',
        text: 'O dicionário de <code>fato_estoque</code> registra <strong>saldo_pecas</strong>. Não existe <code>estoque_atual</code>.'
      }
    },
    qualidade: {
      label: 'Não conformidade',
      from: 'gold.horizonte.fato_qualidade ql',
      date: 'ql.data_inspecao',
      unitJoin: 'JOIN gold.horizonte.dim_unidade u ON ql.unidade_id = u.unidade_id',
      metrics: [
        { id: 'insp', label: 'Peças inspecionadas', sql: 'SUM(ql.pecas_inspecionadas) AS pecas_inspecionadas', order: 'pecas_inspecionadas DESC' },
        { id: 'nc', label: 'Não conformes', sql: 'SUM(ql.pecas_nao_conformes) AS pecas_nao_conformes', order: 'pecas_nao_conformes DESC' },
        { id: 'retido', label: 'Lotes retidos', sql: 'SUM(ql.lote_retido) AS lotes_retidos', order: 'lotes_retidos DESC' }
      ],
      grains: {
        lote: {
          label: 'Lote',
          selects: ['lt.lote_id', 'pf.perfil_codigo'],
          joins: [
            'JOIN gold.horizonte.dim_lote lt ON ql.lote_id = lt.lote_id',
            'JOIN gold.horizonte.dim_perfil pf ON ql.perfil_id = pf.perfil_id'
          ]
        },
        fm: {
          label: 'Família + mês',
          selects: ['fa.familia_nome', "date_trunc('month', ql.data_inspecao) AS mes"],
          joins: [
            'JOIN gold.horizonte.dim_perfil pf ON ql.perfil_id = pf.perfil_id',
            'JOIN gold.horizonte.dim_familia fa ON pf.familia_id = fa.familia_id'
          ]
        },
        um: {
          label: 'Unidade + mês',
          selects: ['u.unidade_nome', "date_trunc('month', ql.data_inspecao) AS mes"],
          joins: ['JOIN gold.horizonte.dim_unidade u ON ql.unidade_id = u.unidade_id']
        }
      },
      wrong: {
        error: 'COLUMN_NOT_FOUND: ppm',
        text: '<strong>ppm</strong> não é coluna. A regra manda calcular <code>pecas_nao_conformes / pecas_inspecionadas × 1.000.000</code>.'
      }
    }
  };

  function formatQuery({ comments, selects, from, joins, wheres, groupCount, orderBy }) {
    const selectSql = selects.map((s) => '  ' + s).join(',\n');
    const joinSql = joins.map((j) => {
      const cut = j.indexOf(' ON ');
      return j.slice(0, cut) + '\n  ON ' + j.slice(cut + 4);
    }).join('\n');
    let whereSql = 'WHERE ' + wheres[0];
    for (let i = 1; i < wheres.length; i++) whereSql += '\n  AND ' + wheres[i];
    const groupSql = 'GROUP BY ' + Array.from({ length: groupCount }, (_, i) => String(i + 1)).join(', ');
    return `${comments}\n\nSELECT\n${selectSql}\nFROM ${from}\n${joinSql}\n${whereSql}\n${groupSql}\nORDER BY ${orderBy};`;
  }

  function buildSql(state) {
    const theme = THEMES[state.theme];
    const grain = theme.grains[state.grain];
    const period = PERIODS[state.period];
    const scope = SCOPES[state.scope];
    const metrics = theme.metrics.filter((m) => state.metrics.includes(m.id));
    const joins = grain.joins.slice();
    if (scope.where && !joins.includes(theme.unitJoin)) joins.push(theme.unitJoin);
    const comments = [
      `-- ${theme.label} · ${grain.label}`,
      theme.snapshot
        ? '-- Posição mais recente do período. Saldo não é somado.'
        : '-- Gerado a partir de agentes/dados/conhecimento'
    ].join('\n');

    if (theme.snapshot) {
      const inner = period.predicate('e2.data_posicao');
      const selectSql = grain.selects.concat(metrics.map((m) => m.sql)).map((s) => '  ' + s).join(',\n');
      const joinSql = joins.map((j) => {
        const cut = j.indexOf(' ON ');
        return j.slice(0, cut) + '\n  ON ' + j.slice(cut + 4);
      }).join('\n');
      const whereSql = scope.where ? `WHERE ${scope.where}\n` : '';
      const groupSql = 'GROUP BY ' + grain.selects.map((_, i) => String(i + 1)).join(', ');
      return `${comments}\n\nWITH posicao AS (\n  SELECT *\n  FROM gold.horizonte.fato_estoque e\n  WHERE e.data_posicao = (\n    SELECT MAX(e2.data_posicao)\n    FROM gold.horizonte.fato_estoque e2\n    WHERE ${inner}\n  )\n)\nSELECT\n${selectSql}\nFROM posicao e\n${joinSql}\n${whereSql}${groupSql}\nORDER BY ${metrics[0].order};`;
    }

    return formatQuery({
      comments,
      selects: grain.selects.concat(metrics.map((m) => m.sql)),
      from: theme.from,
      joins,
      wheres: [period.predicate(theme.date)].concat(scope.where ? [scope.where] : []),
      groupCount: grain.selects.length,
      orderBy: metrics[0].order
    });
  }

  const CC = {
    started: false,
    step: 'idle',
    theme: '',
    period: '',
    grain: '',
    metrics: [],
    scope: '',

    sources: [
      { ico: '🗄', name: 'modelo-dados.md', type: 'Modelo', upd: '4 fatos · 5 dimensões' },
      { ico: '📖', name: 'dicionario.md', type: 'Dicionário', upd: 'Nomes canônicos' },
      { ico: '📐', name: 'regras.md', type: 'Regras', upd: 'Agregação e recorte' },
      { ico: '💾', name: 'exemplos-sql.md', type: 'SQL', upd: 'Forma de referência' }
    ],

    ensureWelcome() {
      this.renderSources();
      if (this.started) return;
      this.started = true;
      this.step = 'await';
      const inner = $('#cc-stream-inner');
      inner.innerHTML = '';
      appendMsg(inner, `
        <p>Olá. Estou no contexto <strong>Dados gerais</strong> da Horizonte Fechaduras.</p>
        <p>Monto a consulta com o modelo, o dicionário e as regras desta pasta. O SQL sai no final, com as escolhas que você fizer.</p>`);
      $('#cc-chips').innerHTML = `<button type="button" class="chip" data-cc="start">Preciso de uma consulta para acompanhar a operação.</button>`;
    },

    renderSources() {
      $('#cc-source-list').innerHTML = this.sources.map((s) => `
        <div class="source-item">
          <div class="src-ico">${s.ico}</div>
          <div>
            <div class="src-nm">${s.name}</div>
            <div class="src-mt">${s.type} · ${s.upd}</div>
            <div class="src-st">Conectada</div>
          </div>
        </div>`).join('');
    },

    async start() {
      if (this.step !== 'await') return;
      const inner = $('#cc-stream-inner');
      appendMsg(inner, 'Preciso de uma consulta para acompanhar a operação.', true);
      $('#cc-chips').innerHTML = '';
      this.step = 'theme';
      await sleep(320);
      appendMsg(inner, `
        <p>Qual recorte da operação você quer ler?</p>
        ${choices('data-cc-theme', [
          { k: 'vendas', label: 'Vendas por unidade' },
          { k: 'producao', label: 'Produção por lote' },
          { k: 'estoque', label: 'Estoque de chave-bruta' },
          { k: 'qualidade', label: 'Não conformidade' }
        ])}`);
    },

    async onTheme(key, btn) {
      if (this.step !== 'theme') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.theme = key;
      const inner = $('#cc-stream-inner');
      appendMsg(inner, THEMES[key].label, true);
      this.step = 'period';
      await sleep(280);
      appendMsg(inner, `
        <p>Qual período entra no filtro?</p>
        ${choices('data-cc-period', [
          { k: 'd30', label: 'Últimos 30 dias' },
          { k: 'd90', label: 'Últimos 90 dias' },
          { k: 'm12', label: 'Últimos 12 meses' },
          { k: 'ytd', label: 'Ano corrente' }
        ])}`);
    },

    async onPeriod(key, btn) {
      if (this.step !== 'period') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.period = key;
      const theme = THEMES[this.theme];
      const inner = $('#cc-stream-inner');
      appendMsg(inner, PERIODS[key].label, true);
      this.step = 'grain';
      await sleep(280);
      const grains = Object.entries(theme.grains).map(([k, g]) => ({ k, label: g.label }));
      appendMsg(inner, `
        <p>Qual é a granularidade de <strong>${theme.label.toLowerCase()}</strong>?</p>
        ${choices('data-cc-grain', grains)}`);
    },

    async onGrain(key, btn) {
      if (this.step !== 'grain') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.grain = key;
      const theme = THEMES[this.theme];
      const inner = $('#cc-stream-inner');
      appendMsg(inner, theme.grains[key].label, true);
      this.step = 'metrics';
      await sleep(280);
      appendMsg(inner, `
        <p>Quais indicadores entram na consulta? Marque um ou mais.</p>
        <div class="chk-list" id="kpi-checks">
          ${theme.metrics.map((m, i) => `
            <label class="chk-opt${i === 0 ? ' selected' : ''}">
              <input type="checkbox" value="${m.id}"${i === 0 ? ' checked' : ''}/> ${m.label}
            </label>`).join('')}
        </div>
        <div class="acts"><button type="button" class="act p" data-cc="metrics-ok">Confirmar indicadores</button></div>`);
    },

    async onMetrics(btn) {
      if (this.step !== 'metrics') return;
      const selected = $$('#kpi-checks input:checked').map((i) => i.value);
      if (!selected.length) return toast('Marque ao menos um indicador.');
      this.metrics = selected;
      disableActs(btn.closest('.bubble'));
      const labels = THEMES[this.theme].metrics.filter((m) => selected.includes(m.id)).map((m) => m.label);
      const inner = $('#cc-stream-inner');
      appendMsg(inner, labels.join(', '), true);
      this.step = 'scope';
      await sleep(280);
      appendMsg(inner, `
        <p>Qual recorte de unidade?</p>
        ${choices('data-cc-scope', [
          { k: 'todas', label: 'Todas as unidades' },
          { k: 'fabrica', label: 'Só a fábrica (Curitiba)' },
          { k: 'cd', label: 'Só o Centro São Paulo' }
        ])}`);
    },

    async onScope(key, btn) {
      if (this.step !== 'scope') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.scope = key;
      const theme = THEMES[this.theme];
      const grain = theme.grains[this.grain];
      const metrics = theme.metrics.filter((m) => this.metrics.includes(m.id));
      const inner = $('#cc-stream-inner');
      appendMsg(inner, SCOPES[key].label, true);
      this.step = 'confirm';
      await sleep(320);
      const fields = grain.selects.map((s) => s.split(' AS ').pop().split('.').pop());
      const metricNames = metrics.map((m) => m.sql.split(' AS ').pop());
      appendMsg(inner, `
        <div class="ibox blue">
          <div class="ibox-lbl">Leitura da pasta</div>
          <ul>
            <li><strong>Tema:</strong> ${theme.label}</li>
            <li><strong>Período:</strong> ${PERIODS[this.period].label}</li>
            <li><strong>Granularidade:</strong> ${grain.label}</li>
            <li><strong>Indicadores:</strong> ${metrics.map((m) => m.label).join(', ')}</li>
            <li><strong>Recorte:</strong> ${SCOPES[key].label}</li>
          </ul>
        </div>
        <p>Campos da consulta: ${fields.concat(metricNames).map((f) => `<code>${f}</code>`).join(', ')}.</p>
        ${theme.snapshot ? '<p>Estoque usa a posição mais recente do período. O saldo não é somado dia a dia.</p>' : ''}
        <p>Sigo com essa estrutura?</p>
        <div class="acts"><button type="button" class="act p" data-cc="confirm">Sim, continuar</button></div>`);
    },

    async onConfirm() {
      if (this.step !== 'confirm') return;
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Sim, continuar', true);
      this.step = 'logic';
      const theme = THEMES[this.theme];
      const metrics = theme.metrics.filter((m) => this.metrics.includes(m.id));
      await sleep(300);
      const lines = [
        `Ler ${theme.from.split(' ').pop() === 'e' ? 'fato_estoque' : theme.from.split(' ')[0].split('.').pop()}`,
        `Filtrar ${PERIODS[this.period].label.toLowerCase()}`,
        `Recortar ${SCOPES[this.scope].label.toLowerCase()}`,
        `Agrupar por ${theme.grains[this.grain].label.toLowerCase()}`,
        `Calcular ${metrics.map((m) => m.label.toLowerCase()).join(', ')}`
      ];
      if (theme.snapshot) lines.push('Estoque: maior data_posicao do período, sem somar saldo');
      lines.push('Entregar a consulta');
      appendMsg(inner, `
        <p>Lógica antes do SQL.</p>
        ${pseudo(lines)}
        <div class="acts"><button type="button" class="act p" data-cc="sql">Gerar SQL</button></div>`);
    },

    async onSql() {
      if (this.step !== 'logic') return;
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Gerar SQL', true);
      this.step = 'sql';
      const steps = Model.id === 'direto'
        ? ['Montando a consulta com a pasta do agente...']
        : ['Lendo modelo-dados.md...', 'Conferindo dicionario.md...', 'Aplicando regras.md...'];
      await thinking(inner, steps, 620);
      const sql = buildSql(this);
      this.sql = sql;
      appendMsg(inner, `
        <div class="ibox-lbl" style="color:var(--blue);font-weight:800;font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">SQL · ${Model.label()}</div>
        <div class="code-block">${escapeHtml(sql)}</div>
        <div class="ibox green">
          <div class="ibox-lbl">Fontes</div>
          <ul>
            <li>modelo-dados.md</li>
            <li>dicionario.md</li>
            <li>regras.md</li>
            <li>exemplos-sql.md</li>
          </ul>
        </div>
        <p>Um chat sem esta pasta devolveria um texto plausível. Esta consulta usa tabela, campo e regra que existem no contexto.</p>
        <div class="acts">
          <button type="button" class="act p" data-cc="validar">Validar no ambiente analítico</button>
          <button type="button" class="act g" data-cc="encerrar">Encerrar</button>
        </div>`);
    },

    async onValidar() {
      if (this.step !== 'sql') return;
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Validar no ambiente analítico', true);
      this.step = 'run';
      await sleep(280);
      appendMsg(inner, `
        <p><strong>Ambiente analítico</strong></p>
        ${pseudo([
          'Abra o editor SQL',
          'Selecione o warehouse de leitura',
          'Cole a consulta',
          'Rode primeiro com LIMIT 100',
          'Confira os nomes no dicionário',
          'Tire o LIMIT quando a amostra estiver coerente'
        ])}
        <div class="acts"><button type="button" class="act g" data-cc="erro">A consulta voltou com erro</button></div>`);
    },

    async onErro() {
      if (this.step !== 'run') return;
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'A consulta voltou com erro', true);
      this.step = 'erro';
      const wrong = THEMES[this.theme].wrong;
      await sleep(260);
      appendMsg(inner, `<p>Cole a mensagem.</p>`);
      $('#cc-chips').innerHTML = `<button type="button" class="chip" data-cc="colar">${wrong.error}</button>`;
    },

    async onColar() {
      if (this.step !== 'erro') return;
      const wrong = THEMES[this.theme].wrong;
      const inner = $('#cc-stream-inner');
      appendMsg(inner, wrong.error, true);
      $('#cc-chips').innerHTML = '';
      this.step = 'fim';
      await sleep(320);
      appendMsg(inner, `
        <div class="ibox orange">
          <div class="ibox-lbl">Dicionário</div>
          <p>${wrong.text}</p>
          <p style="margin-top:8px">Fonte: dicionario.md</p>
        </div>
        <p>A consulta já entregue permanece. O nome do erro não entra no SQL.</p>
        <div class="acts"><button type="button" class="act p" data-cc="manter">Manter o SQL do dicionário</button></div>`);
    },

    onManter() {
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Manter o SQL do dicionário', true);
      appendMsg(inner, `<p>Consulta preservada no contexto <strong>Dados gerais</strong>. Modelo registrado: <strong>${Model.label()}</strong>.</p>`);
      this.step = 'done';
    },

    onEncerrar() {
      const inner = $('#cc-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Encerrar', true);
      appendMsg(inner, `<p>Contexto preservado. A consulta continua disponível nesta conversa.</p>`);
      this.step = 'done';
    }
  };

  /* ── Normas ── */
  const LOTS = {
    dimensional: {
      label: 'Dimensional',
      lote: 'LT-2408',
      perfil: 'HZ-R12 Residencial lisa',
      desvio: 'Espessura medida em 2,05 mm. O especificado é 2,20 mm ± 0,05.',
      evidencia: 'medição de espessura, ombro e comprimento contra a especificação do perfil',
      registro: 'expedido',
      fora: true,
      texto: 'O LQP-014 registra 400 peças expedidas em 12/11/2026 para a Rede Tranca Sul.'
    },
    acabamento: {
      label: 'Acabamento',
      lote: 'LT-2394',
      perfil: 'HZ-K07 Cadeado latão',
      desvio: 'Mancha no banho.',
      evidencia: 'registro visual do banho e a quantidade segregada',
      registro: 'fabrica',
      fora: false,
      texto: 'O LQP-014 registra o lote na Fábrica Curitiba, sem nota de saída.'
    },
    perfil: {
      label: 'Perfil trocado',
      lote: 'LT-2411',
      perfil: 'HZ-C18 Comercial lisa',
      desvio: 'Apontado como HZ-C04 e conferido como HZ-C18.',
      evidencia: 'código apontado, código conferido e a ordem de produção',
      registro: 'sem_nota',
      fora: true,
      texto: 'O LQP-014 registra a última leitura no Centro São Paulo, sem nota de saída.'
    },
    mistura: {
      label: 'Mistura de lote',
      lote: 'LT-2388 e LT-2390',
      perfil: 'HZ-B21 e HZ-R12',
      desvio: 'LT-2388 e LT-2390 encontrados na mesma caixa.',
      evidencia: 'os dois códigos de lote e a quantidade de cada um',
      registro: 'parcial',
      fora: true,
      texto: 'O LQP-014 registra 120 peças do LT-2388 no Centro Recife. O restante e o LT-2390 estão na fábrica.'
    }
  };

  const EXPED = {
    sim: 'Sim, já saiu da fábrica',
    nao: 'Não, ainda está na fábrica',
    naosei: 'Não sei informar'
  };

  const URGENCIA = {
    linha: { label: 'Linha parada', prazo: 'Contenção em 4 horas' },
    cliente: { label: 'Cliente aguardando', prazo: 'Comunicação no mesmo dia útil' },
    rotina: { label: 'Rotina', prazo: 'Triagem em 2 dias úteis' }
  };

  function confronto(lot, answer) {
    if (answer === 'naosei') {
      return { ok: false, box: 'orange', titulo: 'Registro do LQP-014', texto: lot.texto + ' Sigo o registro.' };
    }
    const bate = (lot.registro === 'expedido' && answer === 'sim')
      || (lot.registro === 'fabrica' && answer === 'nao')
      || (lot.registro === 'parcial' && answer === 'sim');
    if (bate) {
      return { ok: true, box: 'green', titulo: 'Registro confere', texto: lot.texto };
    }
    return { ok: false, box: 'orange', titulo: 'O registro prevalece', texto: lot.texto + ' A trilha segue o documento, não a lembrança.' };
  }

  const NP = {
    started: false,
    step: 'idle',
    cats: ['Qualidade', 'Produção', 'Segurança', 'Manutenção', 'RH', 'Expedição'],
    active: 'Qualidade',
    lot: null,
    exped: '',
    urg: '',

    ensureWelcome() {
      this.renderCats();
      if (this.started) return;
      this.started = true;
      this.step = 'await';
      const inner = $('#np-stream-inner');
      inner.innerHTML = '';
      appendMsg(inner, `
        <p>Você está em <strong>Normas &amp; Processos</strong>, categoria Qualidade.</p>
        <p>Eu respondo com o LQP-014, revisão 2, vigente desde 03/11/2026.</p>`);
      $('#np-chips').innerHTML = `<button type="button" class="chip" data-np="start">Um lote de chaves saiu com medida fora do especificado. Por onde começo?</button>`;
    },

    renderCats() {
      $('#np-cat-list').innerHTML = this.cats.map((c) => `
        <button type="button" class="cat-btn${c === this.active ? ' active' : ''}" data-np-cat="${c}">${c}</button>
      `).join('');
    },

    setCat(c) {
      if (c !== 'Qualidade') {
        toast('Nesta demo, o fluxo completo está em Qualidade.');
      }
      this.active = 'Qualidade';
      this.renderCats();
    },

    async start() {
      if (this.step !== 'await') return;
      const inner = $('#np-stream-inner');
      appendMsg(inner, 'Um lote de chaves saiu com medida fora do especificado. Por onde começo?', true);
      $('#np-chips').innerHTML = '';
      this.step = 'tipo';
      await thinking(inner, ['Abrindo o LQP-014...', 'Separando o tipo de desvio...'], 640);
      appendMsg(inner, `
        <p>O método é o <strong>LQP-014 — Liberação de lote de produção</strong>.</p>
        <p>O tipo muda a evidência e o lote desta revisão. Qual é o desvio?</p>
        ${choices('data-np-tipo', [
          { k: 'dimensional', label: 'Dimensional' },
          { k: 'acabamento', label: 'Acabamento' },
          { k: 'perfil', label: 'Perfil trocado' },
          { k: 'mistura', label: 'Mistura de lote' }
        ])}`);
    },

    async onTipo(key, btn) {
      if (this.step !== 'tipo') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.lot = LOTS[key];
      const inner = $('#np-stream-inner');
      appendMsg(inner, this.lot.label, true);
      this.step = 'exped';
      await sleep(300);
      appendMsg(inner, `
        <div class="ibox blue">
          <div class="ibox-lbl">${this.lot.lote}</div>
          <p>${this.lot.perfil}. ${this.lot.desvio}</p>
        </div>
        <p>Esse lote já saiu da fábrica?</p>
        ${choices('data-np-exped', [
          { k: 'sim', label: EXPED.sim },
          { k: 'nao', label: EXPED.nao },
          { k: 'naosei', label: EXPED.naosei }
        ])}`);
    },

    async onExped(key, btn) {
      if (this.step !== 'exped') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.exped = key;
      const inner = $('#np-stream-inner');
      appendMsg(inner, EXPED[key], true);
      const c = confronto(this.lot, key);
      this.step = 'urg';
      await sleep(300);
      appendMsg(inner, `
        <div class="ibox ${c.box}">
          <div class="ibox-lbl">${c.titulo}</div>
          <p>${c.texto}</p>
        </div>
        <p>Qual é a urgência?</p>
        ${choices('data-np-urg', [
          { k: 'linha', label: 'Linha parada' },
          { k: 'cliente', label: 'Cliente aguardando' },
          { k: 'rotina', label: 'Rotina' }
        ])}`);
    },

    async onUrg(key, btn) {
      if (this.step !== 'urg') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.urg = URGENCIA[key];
      const inner = $('#np-stream-inner');
      appendMsg(inner, this.urg.label, true);
      this.step = 'overview';
      await thinking(inner, ['Montando a trilha do seu caso...', 'Cruzando prazo e responsável...'], 600);
      appendMsg(inner, `
        <div class="ibox blue">
          <div class="ibox-lbl">Seu caso</div>
          <ul>
            <li><strong>Lote:</strong> ${this.lot.lote}</li>
            <li><strong>Desvio:</strong> ${this.lot.label}</li>
            <li><strong>Urgência:</strong> ${this.urg.label} · ${this.urg.prazo}</li>
          </ul>
        </div>
        <p>O LQP-014 é o método para segregar, dispor e liberar um lote quando a inspeção encontra desvio. O lote só volta ao fluxo com disposição registrada.</p>
        <div class="acts"><button type="button" class="act p" data-np="etapas">Sim, mostrar as etapas</button></div>`);
    },

    async showEtapas() {
      if (this.step !== 'overview') return;
      const inner = $('#np-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Sim, mostrar as etapas', true);
      this.step = 'etapas';
      const steps = [
        'Registro da ocorrência',
        'Segregação do lote',
        'Contenção no estoque e no cliente',
        'Disposição',
        'Análise de causa',
        'Ação corretiva',
        'Reinspeção',
        'Encerramento e lição registrada'
      ];
      await sleep(300);
      appendMsg(inner, `
        <p><strong>LQP-014</strong> · 8 etapas</p>
        <div class="flow-viz">
          ${steps.map((s, i, a) => `<div class="flow-step">${i + 1}. ${s}</div>${i < a.length - 1 ? '<div class="flow-arrow">↓</div>' : ''}`).join('')}
        </div>
        ${this.lot.fora ? '<p>Há peça fora da fábrica ou saldo em centro. A contenção acontece antes da disposição.</p>' : '<p>O registro mantém o lote na fábrica. A contenção é interna, e a disposição vem em seguida.</p>'}
        <div class="acts"><button type="button" class="act p" data-np="passo1">Como executo a etapa 1 agora?</button></div>`);
    },

    async showPasso1() {
      if (this.step !== 'etapas') return;
      const inner = $('#np-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Como executo a etapa 1 agora?', true);
      this.step = 'passo1';
      await sleep(280);
      appendMsg(inner, `
        <p><strong>Etapa 1 — Registro da ocorrência</strong></p>
        ${pseudo([
          'Abrir Qualidade → Ocorrência de lote → tipo Liberação',
          `Informar ${this.lot.lote}, ${this.lot.perfil} e a quantidade inspecionada`,
          `Anexar a evidência: ${this.lot.evidencia}`,
          'Informar a expedição com o texto do registro, não de memória',
          `Marcar a urgência: ${this.urg.label}`,
          'Enviar à Qualidade de Processo'
        ])}
        <div class="ibox green">
          <div class="ibox-lbl">Checklist para não voltar</div>
          <ul>
            <li>Lote e perfil com o código HZ-</li>
            <li>Evidência do tipo de desvio</li>
            <li>Status de expedição igual ao LQP-014</li>
            <li>Analista da Qualidade de Processo indicado</li>
          </ul>
        </div>
        <div class="acts">
          <button type="button" class="act p" data-np="fonte">Mostrar responsável e fonte</button>
          <button type="button" class="act g" data-np="etapa2">O que acontece na etapa 2?</button>
        </div>`);
    },

    async showEtapa2() {
      const inner = $('#np-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'O que acontece na etapa 2?', true);
      await sleep(280);
      appendMsg(inner, `
        <p><strong>Etapa 2 — Segregação do lote</strong></p>
        <p>O analista identifica o lote na unidade, afasta a peça do fluxo e impede o retorno antes da disposição.</p>
        ${this.lot.fora ? '<p>Como há saldo fora da fábrica, a etapa 3 avisa estoque e cliente antes de qualquer disposição.</p>' : '<p>Sem nota de saída, a segregação fica na Fábrica Curitiba.</p>'}
        <div class="acts"><button type="button" class="act p" data-np="fonte">Mostrar responsável e fonte</button></div>`);
    },

    async showFonte() {
      const inner = $('#np-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Mostrar responsável e fonte', true);
      this.step = 'done';
      await sleep(280);
      appendMsg(inner, `
        <div class="owner-box">
          <strong>Operação do caso</strong>
          <span>Analista da Qualidade de Processo</span>
        </div>
        <div class="owner-box" style="margin-top:8px">
          <strong>Guardião do método</strong>
          <span>Coordenação de Qualidade · Fábrica Curitiba</span>
        </div>
        <div class="doc-official">
          <h4>Fonte oficial</h4>
          <p><strong>LQP-014</strong> — Liberação de lote de produção</p>
          <div class="meta-row">
            <span class="badge blue">Rev. 2</span>
            <span class="badge green">Vigente</span>
            <span>Desde 03/11/2026</span>
          </div>
          <p style="font-size:12px;color:var(--text2);margin-top:8px">Modelo usado: ${Model.label()}. Prazo deste caso: ${this.urg.prazo}.</p>
          <div class="acts"><button type="button" class="act p" data-np="help">Quem pode me ajudar?</button></div>
        </div>`);
    },

    showHelp() {
      openDrawer('Quem pode me ajudar', `
        <div class="field"><label>Guardião do método</label><div>Coordenação de Qualidade</div></div>
        <div class="field"><label>Operação do caso</label><div>Analista da Qualidade de Processo</div></div>
        <div class="field"><label>E-mail</label><div>qualidade.processo@horizontefechaduras.demo</div></div>
        <div class="field"><label>Documento</label><div>LQP-014 · Rev. 2 · vigente desde 03/11/2026</div></div>
        <div class="field"><label>Lote deste caso</label><div>${this.lot ? this.lot.lote : '—'}</div></div>
        <p style="font-size:13px;color:var(--text2);margin:12px 0 16px">A resposta aponta o processo, a etapa, a fonte e a pessoa que opera o caso.</p>
        <button type="button" class="btn-primary" id="btn-abrir-chamado">Abrir chamado</button>
      `);
      $('#btn-abrir-chamado')?.addEventListener('click', () => {
        closeDrawer();
        openModal('modal-chamado');
      }, { once: true });
    }
  };

  function renderOnboarding() {
    $('#onb-timeline').innerHTML = [
      { w: 'Semana 1', t: 'A área', items: ['o que a Qualidade libera', 'o que retém', 'quem guarda o método'] },
      { w: 'Semana 2', t: 'O LQP-014', items: ['oito etapas', 'contenção', 'disposição'] },
      { w: 'Semana 3', t: 'O registro', items: ['lote', 'perfil HZ-', 'nota de saída'] },
      { w: 'Semana 4', t: 'Primeira ocorrência', items: ['abrir o caso', 'checklist', 'revisar com o analista'] }
    ].map((x) => `
      <div class="tl-card">
        <strong>${x.w}</strong>
        <h4>${x.t}</h4>
        <ul>${x.items.map((i) => `<li>${i}</li>`).join('')}</ul>
      </div>`).join('');
    $('#onb-cards').innerHTML = ['LQP-014', 'Lotes', 'Glossário', 'Pessoas-chave', 'Checklist']
      .map((c) => `<div class="onb-card">${c}</div>`).join('');
  }

  /* ── Estúdio ── */
  const BRIEFING = `Seguinte, preciso de um slide da Horizonte.
A gente fabrica chave, fechadura e chave-bruta. Tem a fábrica em Curitiba e dois centros, São Paulo e Recife.
O problema agora não é venda caindo. É perfil acabando. Tem uns com cobertura de poucos dias.
Queria mostrar que a maior parte está estável, e que o risco está num grupo pequeno.
Usa o acompanhamento: 48 perfis ativos, 31 estáveis, 11 em atenção e 6 com cobertura abaixo de 7 dias.
Os mais curtos são o HZ-B21, chave-bruta, com 3 dias no Centro Recife; o HZ-R12, residencial lisa, com 4 dias em São Paulo; o HZ-C04, comercial tetra, com 6 dias na fábrica; e o HZ-K07, cadeado latão, com 9 dias em São Paulo.
Não quero só alarme. A operação já reteve um pedido grande do HZ-R12, já puxou a ordem do HZ-B21 e está olhando transferência entre centros. A cobertura mínima de 14 dias voltou para a rotina semanal.
No final precisa ficar o que a sala decide. Se for a diretoria: priorizar esses perfis, autorizar compra emergencial da chave-bruta e do HZ-R12, e não prometer prazo em cima de cobertura curta.
Um slide. A pessoa bate o olho e entende onde está o risco.`;

  const AUDIENCE = {
    diretoria: {
      label: 'Diretoria',
      items: [
        'Priorizar a reposição dos seis perfis',
        'Autorizar a compra emergencial de HZ-B21 e HZ-R12',
        'Manter a cobertura mínima de 14 dias antes de prometer prazo'
      ]
    },
    gerencia: {
      label: 'Gerência industrial',
      items: [
        'Abrir turno extra na usinagem do HZ-C04',
        'Antecipar a ordem do HZ-B21',
        'Redistribuir o saldo do Centro Recife'
      ]
    },
    comercial: {
      label: 'Comercial',
      items: [
        'Avisar a Rede Tranca Sul sobre o HZ-R12',
        'Segurar a promessa de prazo do HZ-B21',
        'Oferecer o HZ-K07 onde ele cobre o uso'
      ]
    }
  };

  const TIME = {
    t5: { label: '5 minutos', note: 'O slide se sustenta sozinho.' },
    t10: { label: '10 minutos', note: 'A fala percorre os quatro perfis.' },
    t15: { label: '15 minutos', note: 'A fala acrescenta a causa. O slide não vira relatório.' }
  };

  const COUNT = {
    um: { label: '1 slide', mark: 'Slide único' },
    tres: { label: '3 slides', mark: 'Slide 2 de 3' }
  };

  const ACOES = [
    'Pedido grande do HZ-R12 retido até a reposição',
    'Ordem do HZ-B21 puxada na fábrica',
    'Transferência entre centros em leitura',
    'Cobertura mínima de 14 dias na rotina semanal'
  ];

  const PERFIS = [
    ['HZ-B21', 'Chave-bruta 2,2 mm', '3 dias', 'Centro Recife'],
    ['HZ-R12', 'Residencial lisa', '4 dias', 'Centro São Paulo'],
    ['HZ-C04', 'Comercial tetra', '6 dias', 'Fábrica Curitiba'],
    ['HZ-K07', 'Cadeado latão', '9 dias', 'Centro São Paulo']
  ];

  function boardSlide(state) {
    const aud = AUDIENCE[state.aud];
    const time = TIME[state.time];
    const count = COUNT[state.count];
    return `
      <article class="board-slide">
        <div class="bs-top">
          <div>
            <p class="bs-co">Horizonte Fechaduras</p>
            <h3>Risco de ruptura | Perfis críticos</h3>
            <p class="bs-msg">A carteira permanece estável. Seis perfis concentram o risco das próximas duas semanas.</p>
          </div>
          <div class="bs-meta">
            <span>${aud.label}</span>
            <span>${time.label}</span>
            <span>${count.mark}</span>
          </div>
        </div>
        <div class="bs-kpis">
          <div class="bs-kpi"><strong>48</strong><span>perfis ativos</span></div>
          <div class="bs-kpi ok"><strong>31</strong><span>estáveis</span></div>
          <div class="bs-kpi warn"><strong>11</strong><span>em atenção</span></div>
          <div class="bs-kpi bad"><strong>6</strong><span>abaixo de 7 dias</span></div>
          <div class="bs-kpi"><strong>3</strong><span>unidades</span></div>
        </div>
        <div class="bs-cols">
          <section class="bs-col">
            <h4>Onde está o risco</h4>
            ${PERFIS.map((p) => `<div class="bs-row"><b>${p[0]}</b><span>${p[2]} · ${p[3]}</span><small>${p[1]}</small></div>`).join('')}
          </section>
          <section class="bs-col">
            <h4>Já em curso</h4>
            <ol>${ACOES.map((a) => `<li>${a}</li>`).join('')}</ol>
          </section>
          <section class="bs-col">
            <h4>Decisão · ${aud.label}</h4>
            <ol>${aud.items.map((a) => `<li>${a}</li>`).join('')}</ol>
          </section>
        </div>
        <p class="bs-note">${time.note} Fonte: identidade-do-slide.md · Modelo: ${Model.label()}</p>
      </article>`;
  }

  const ES = {
    started: false,
    step: 'idle',
    aud: '',
    time: '',
    count: '',
    slideHtml: '',

    ensureWelcome() {
      if (this.started) return;
      this.started = true;
      this.step = 'await';
      const inner = $('#es-stream-inner');
      inner.innerHTML = '';
      appendMsg(inner, `<p>O slide segue o padrão da casa: situação, exposição, risco, o que já está em curso e a decisão.</p>`);
      $('#es-chips').innerHTML = `<button type="button" class="chip" data-es="need">Preciso de um slide sobre o risco de ruptura dos perfis.</button>`;
    },

    async start() {
      if (this.step !== 'await') return;
      const inner = $('#es-stream-inner');
      appendMsg(inner, 'Preciso de um slide sobre o risco de ruptura dos perfis.', true);
      $('#es-chips').innerHTML = '';
      this.step = 'aud';
      await sleep(280);
      appendMsg(inner, `
        <p>Quem vai assistir? A coluna de decisão muda com a sala.</p>
        ${choices('data-es-aud', [
          { k: 'diretoria', label: 'Diretoria' },
          { k: 'gerencia', label: 'Gerência industrial' },
          { k: 'comercial', label: 'Comercial' }
        ])}`);
    },

    async onAud(key, btn) {
      if (this.step !== 'aud') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.aud = key;
      const inner = $('#es-stream-inner');
      appendMsg(inner, AUDIENCE[key].label, true);
      this.step = 'time';
      await sleep(260);
      appendMsg(inner, `
        <p>Quanto tempo você terá?</p>
        ${choices('data-es-time', [
          { k: 't5', label: '5 minutos' },
          { k: 't10', label: '10 minutos' },
          { k: 't15', label: '15 minutos' }
        ])}`);
    },

    async onTime(key, btn) {
      if (this.step !== 'time') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.time = key;
      const inner = $('#es-stream-inner');
      appendMsg(inner, TIME[key].label, true);
      this.step = 'count';
      await sleep(260);
      appendMsg(inner, `
        <p>Quantos slides?</p>
        ${choices('data-es-count', [
          { k: 'um', label: '1 slide' },
          { k: 'tres', label: '3 slides' }
        ])}`);
    },

    async onCount(key, btn) {
      if (this.step !== 'count') return;
      disableActs(btn.closest('.bubble'));
      btn.classList.add('selected');
      this.count = key;
      const inner = $('#es-stream-inner');
      appendMsg(inner, COUNT[key].label, true);
      this.step = 'mode';
      await sleep(260);
      const extra = key === 'tres'
        ? '<p>Em três slides, a capa e o anexo de causa ficam de fora deste artefato. Eu entrego o slide de decisão, marcado como 2 de 3.</p>'
        : '<p>O material é um slide só.</p>';
      appendMsg(inner, `
        ${extra}
        <p>Você já tem estrutura ou explica do seu jeito?</p>
        <div class="acts"><button type="button" class="act p" data-es="mode">Vou explicar do meu jeito</button></div>`);
    },

    async onMode() {
      if (this.step !== 'mode') return;
      const inner = $('#es-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Vou explicar do meu jeito', true);
      this.step = 'brief';
      await sleep(240);
      appendMsg(inner, `<p>Pode mandar informal. Eu separo o que entra no slide.</p>`);
      $('#es-chips').innerHTML = `<button type="button" class="chip" data-es="brief">Enviar briefing</button>`;
    },

    async onBrief() {
      if (this.step !== 'brief') return;
      const inner = $('#es-stream-inner');
      const el = document.createElement('div');
      el.className = 'msg user';
      el.innerHTML = av(true) + `<div class="bubble briefing">${escapeHtml(BRIEFING)}</div>`;
      inner.appendChild(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      $('#es-chips').innerHTML = '';
      this.step = 'line';
      await thinking(inner, ['Lendo o padrão de narrativa...', 'Separando número de pedido...', 'Reservando a decisão para a sala...'], 640);
      appendMsg(inner, `
        <p>O slide responde cinco perguntas, nesta ordem.</p>
        <div class="q-cards">
          <div class="q-card"><em>1</em>O que está estável?</div>
          <div class="q-card"><em>2</em>Qual é o tamanho da exposição?</div>
          <div class="q-card"><em>3</em>Onde está o risco?</div>
          <div class="q-card"><em>4</em>O que já está em curso?</div>
          <div class="q-card"><em>5</em>O que ${AUDIENCE[this.aud].label} decide?</div>
        </div>
        <div class="acts"><button type="button" class="act p" data-es="line">Sim, seguir essa linha</button></div>`);
    },

    async onLine() {
      if (this.step !== 'line') return;
      const inner = $('#es-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Sim, seguir essa linha', true);
      this.step = 'controle';
      await sleep(280);
      appendMsg(inner, `
        <p>A abertura é esta: <em>a maior parte dos perfis permanece estável. O risco está concentrado.</em></p>
        <p>Abrir pelos 6 perfis curtos, sem essa frase, faz a carteira inteira parecer em crise.</p>
        <div class="consolida"><div class="kpi-mini">
          <span>48 ativos</span><span>31 estáveis</span><span>11 atenção</span><span>6 abaixo de 7 dias</span><span>3 unidades</span>
        </div></div>
        <div class="acts"><button type="button" class="act p" data-es="controle">Quero número e sensação de controle</button></div>`);
    },

    async onControle() {
      if (this.step !== 'controle') return;
      const inner = $('#es-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Quero número e sensação de controle', true);
      this.step = 'split';
      await sleep(280);
      const aud = AUDIENCE[this.aud];
      appendMsg(inner, `
        <p>As ações em curso ficam separadas do que a sala decide. Se tudo for próximo passo, a leitura é que a operação esperou a reunião.</p>
        <div class="grid2">
          <div class="ibox green"><div class="ibox-lbl">Já em curso</div>
            <ol>${ACOES.map((a) => `<li>${a}</li>`).join('')}</ol>
          </div>
          <div class="ibox blue"><div class="ibox-lbl">Decisão · ${aud.label}</div>
            <ol>${aud.items.map((a) => `<li>${a}</li>`).join('')}</ol>
          </div>
        </div>
        <div class="acts"><button type="button" class="act p" data-es="todo">Como fica o slide inteiro?</button></div>`);
    },

    async onTodo() {
      if (this.step !== 'split') return;
      const inner = $('#es-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Como fica o slide inteiro?', true);
      this.step = 'ready';
      await sleep(280);
      const aud = AUDIENCE[this.aud];
      appendMsg(inner, `
        <div class="consolida">
          <h4>Estrutura pronta</h4>
          <p><strong>Título</strong> — Risco de ruptura | Perfis críticos</p>
          <p><strong>Público</strong> — ${aud.label} · ${TIME[this.time].label} · ${COUNT[this.count].mark}</p>
          <p><strong>Mensagem</strong> — A carteira permanece estável. Seis perfis concentram o risco das próximas duas semanas.</p>
          <p><strong>Perfis</strong> — HZ-B21 3 dias · HZ-R12 4 dias · HZ-C04 6 dias · HZ-K07 9 dias</p>
          <p><strong>Decisão</strong> — ${aud.items.join(' · ')}</p>
          <p><strong>Fala</strong> — ${TIME[this.time].note}</p>
        </div>
        <div class="acts"><button type="button" class="act p" data-es="gerar">Gerar slide</button></div>`);
    },

    async onGerar() {
      if (this.step !== 'ready') return;
      const inner = $('#es-stream-inner');
      disableActs(inner);
      appendMsg(inner, 'Gerar slide', true);
      await thinking(inner, ['Aplicando a identidade do slide...', 'Encaixando números e decisão...', 'Fechando a tela...'], 700);
      this.slideHtml = boardSlide(this);
      this.step = 'done';
      appendMsg(inner, `
        <p><strong>Slide · ${Model.label()}</strong></p>
        <div class="slide-preview">${this.slideHtml}</div>
        <p>Números, perfis e decisão saíram de identidade-do-slide.md. O briefing não criou dado novo.</p>
        <div class="acts"><button type="button" class="act p" data-es="fs">Abrir em tela cheia</button></div>`);
    },

    openFs() {
      if (!this.slideHtml) return;
      $('#slide-fs-mount').innerHTML = this.slideHtml;
      openModal('slide-fs');
    }
  };

  /* ── Governança ── */
  const GOV_ROWS = [
    { ia: 'Dados da Operação', owner: 'Dados', fontes: 4, users: 22, q: 186, custo: 'R$ 640', status: 'saudavel', label: 'Saudável' },
    { ia: 'Normas de Qualidade', owner: 'Qualidade', fontes: 3, users: 41, q: 312, custo: 'R$ 480', status: 'saudavel', label: 'Saudável' },
    { ia: 'Estúdio de Apresentações', owner: 'Comunicação', fontes: 3, users: 14, q: 96, custo: 'R$ 390', status: 'revisar', label: 'Revisar' },
    { ia: 'Assistente de RH', owner: 'RH', fontes: 11, users: 18, q: 40, custo: 'R$ 120', status: 'baixo', label: 'Baixo uso' }
  ];

  const TRACES = {
    hero: {
      ia: 'Normas de Qualidade',
      pergunta: 'Um lote de chaves saiu com medida fora do especificado. Por onde começo?',
      resposta: 'LQP-014 Rev. 2. Lote LT-2408, espessura 2,05 mm, 400 peças expedidas para a Rede Tranca Sul. Contenção antes da disposição.',
      fonte: 'LQP-014 · matriz-responsaveis.md · checklist-abertura.md',
      quando: '14/11/2026 · 09:40',
      modelo: 'Horizonte Preciso',
      tokens: '1.620',
      custo: 'R$ 0,16',
      tempo: '2,1 s'
    }
  };

  function renderGov() {
    $('#gov-kpis').innerHTML = [
      { v: '12', l: 'IAs publicadas' },
      { v: '86', l: 'Fontes nas pastas' },
      { v: '634', l: 'Consultas esta semana' },
      { v: '98%', l: 'Respostas com fonte' },
      { v: 'R$ 3.470', l: 'Custo estimado no mês', hint: 'R$ 5,47 por consulta' }
    ].map((k) => `
      <div class="kpi-card">
        <div class="v">${k.v}</div>
        <div class="l">${k.l}</div>
        ${k.hint ? `<div class="hint">${k.hint}</div>` : ''}
      </div>`).join('');

    $('#cost-chart').innerHTML = [
      { n: 'Produção', p: 82, v: 'R$ 1.420' },
      { n: 'Qualidade', p: 64, v: 'R$ 980' },
      { n: 'Comercial', p: 48, v: 'R$ 760' },
      { n: 'RH', p: 22, v: 'R$ 310' }
    ].map((r) => `
      <div class="cost-row">
        <span>${r.n}</span>
        <div class="cost-bar-track"><div class="cost-bar" style="width:${r.p}%"></div></div>
        <em>${r.v}</em>
      </div>`).join('');

    const t = TRACES.hero;
    $('#trace-table tbody').innerHTML = `
      <tr>
        <td>Eduardo Mesquita</td>
        <td>${t.ia}</td>
        <td>${t.pergunta}</td>
        <td>LQP-014</td>
        <td>${t.quando}</td>
        <td>${t.tokens}</td>
        <td>${t.custo}</td>
        <td><span class="badge green">Respondido com fonte</span></td>
      </tr>`;

    filterGovTable('all');
  }

  function filterGovTable(f) {
    const rows = GOV_ROWS.filter((r) => f === 'all' || r.status === f);
    const badge = (r) => r.status === 'saudavel' ? 'green' : r.status === 'revisar' ? 'orange' : 'blue';
    $('#gov-table tbody').innerHTML = rows.map((r) => `
      <tr data-gov-row="${r.ia}">
        <td>${r.ia}</td><td>${r.owner}</td><td>${r.fontes}</td><td>${r.users}</td>
        <td>${r.q}</td><td>${r.custo}</td>
        <td><span class="badge ${badge(r)}">${r.label}</span></td>
      </tr>`).join('');
  }

  function showTrace(ia) {
    const t = TRACES.hero;
    if (ia && ia !== t.ia) {
      const row = GOV_ROWS.find((r) => r.ia === ia);
      if (!row) return;
      openDrawer('Rastreabilidade', `
        <div class="field"><label>IA</label><div>${row.ia}</div></div>
        <div class="field"><label>Área</label><div>${row.owner}</div></div>
        <div class="field"><label>Fontes na pasta</label><div>${row.fontes}</div></div>
        <div class="field"><label>Consultas no mês</label><div>${row.q}</div></div>
        <div class="field"><label>Custo no mês</label><div>${row.custo}</div></div>
        <div class="field"><label>Modelo</label><div>Horizonte Preciso</div></div>
        <div class="field"><label>Status</label><div>${row.label}</div></div>`);
      return;
    }
    openDrawer('Rastreabilidade', `
      <div class="field"><label>IA</label><div>${t.ia}</div></div>
      <div class="field"><label>Pergunta</label><div>${t.pergunta}</div></div>
      <div class="field"><label>Resposta</label><div>${t.resposta}</div></div>
      <div class="field"><label>Usuário</label><div>Eduardo Mesquita</div></div>
      <div class="field"><label>Horário</label><div>${t.quando}</div></div>
      <div class="field"><label>Modelo</label><div>${t.modelo}</div></div>
      <div class="field"><label>Fontes</label><div>${t.fonte}</div></div>
      <div class="field"><label>Custo</label><div>${t.custo} · ${t.tokens} tokens</div></div>
      <div class="field"><label>Tempo de resposta</label><div>${t.tempo}</div></div>`);
  }

  function bind() {
    $$('.nav-btn[data-page]').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.page)));

    document.addEventListener('click', (e) => {
      const pageBtn = e.target.closest('[data-page]');
      if (pageBtn && !pageBtn.classList.contains('nav-btn')) {
        e.preventDefault();
        navigate(pageBtn.dataset.page);
      }

      if (e.target.closest('#btn-sobre')) openModal('modal-sobre');

      const criar = e.target.closest('[data-action="criar-ia"]');
      if (criar) { e.preventDefault(); openModal('modal-criar'); }

      const openCard = e.target.closest('.ia-card[data-open]');
      if (openCard && !criar) navigate(openCard.dataset.open);

      const close = e.target.closest('[data-close]');
      if (close) closeModal(close.dataset.close);

      const ccTheme = e.target.closest('[data-cc-theme]');
      if (ccTheme) CC.onTheme(ccTheme.dataset.ccTheme, ccTheme);
      const ccPeriod = e.target.closest('[data-cc-period]');
      if (ccPeriod) CC.onPeriod(ccPeriod.dataset.ccPeriod, ccPeriod);
      const ccGrain = e.target.closest('[data-cc-grain]');
      if (ccGrain) CC.onGrain(ccGrain.dataset.ccGrain, ccGrain);
      const ccScope = e.target.closest('[data-cc-scope]');
      if (ccScope) CC.onScope(ccScope.dataset.ccScope, ccScope);

      const cc = e.target.closest('[data-cc]');
      if (cc) {
        const a = cc.dataset.cc;
        if (a === 'start') CC.start();
        if (a === 'metrics-ok') CC.onMetrics(cc);
        if (a === 'confirm') CC.onConfirm();
        if (a === 'sql') CC.onSql();
        if (a === 'validar') CC.onValidar();
        if (a === 'erro') CC.onErro();
        if (a === 'colar') CC.onColar();
        if (a === 'manter') CC.onManter();
        if (a === 'encerrar') CC.onEncerrar();
      }

      const npCat = e.target.closest('[data-np-cat]');
      if (npCat) NP.setCat(npCat.dataset.npCat);
      const npTipo = e.target.closest('[data-np-tipo]');
      if (npTipo) NP.onTipo(npTipo.dataset.npTipo, npTipo);
      const npExped = e.target.closest('[data-np-exped]');
      if (npExped) NP.onExped(npExped.dataset.npExped, npExped);
      const npUrg = e.target.closest('[data-np-urg]');
      if (npUrg) NP.onUrg(npUrg.dataset.npUrg, npUrg);
      const np = e.target.closest('[data-np]');
      if (np) {
        const a = np.dataset.np;
        if (a === 'start') NP.start();
        if (a === 'etapas') NP.showEtapas();
        if (a === 'passo1') NP.showPasso1();
        if (a === 'etapa2') NP.showEtapa2();
        if (a === 'fonte') NP.showFonte();
        if (a === 'help') NP.showHelp();
      }

      if (e.target.closest('#btn-onboarding')) {
        renderOnboarding();
        openModal('modal-onboarding');
      }

      const esAud = e.target.closest('[data-es-aud]');
      if (esAud) ES.onAud(esAud.dataset.esAud, esAud);
      const esTime = e.target.closest('[data-es-time]');
      if (esTime) ES.onTime(esTime.dataset.esTime, esTime);
      const esCount = e.target.closest('[data-es-count]');
      if (esCount) ES.onCount(esCount.dataset.esCount, esCount);
      const es = e.target.closest('[data-es]');
      if (es) {
        const a = es.dataset.es;
        if (a === 'need') ES.start();
        if (a === 'mode') ES.onMode();
        if (a === 'brief') ES.onBrief();
        if (a === 'line') ES.onLine();
        if (a === 'controle') ES.onControle();
        if (a === 'todo') ES.onTodo();
        if (a === 'gerar') ES.onGerar();
        if (a === 'fs') ES.openFs();
      }

      const filter = e.target.closest('.chip-filter');
      if (filter) {
        $$('.chip-filter').forEach((c) => c.classList.toggle('active', c === filter));
        filterGovTable(filter.dataset.filter);
      }

      const govRow = e.target.closest('[data-gov-row]');
      if (e.target.closest('#btn-trace') || e.target.closest('#trace-table tbody tr')) showTrace();
      else if (govRow) showTrace(govRow.dataset.govRow);
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('model-select')) Model.set(e.target.value);
      if (e.target.matches('.chk-opt input')) {
        e.target.closest('.chk-opt').classList.toggle('selected', e.target.checked);
      }
    });

    $('#mob-toggle')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#drawer-close')?.addEventListener('click', closeDrawer);
    $('#drawer-backdrop')?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.overlay:not(.hidden)').forEach((o) => o.classList.add('hidden'));
        closeDrawer();
      }
    });
  }

  renderGov();
  bind();
})();
