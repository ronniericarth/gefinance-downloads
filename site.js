'use strict';

const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* números contando até o valor final (o valor final já está no HTML: sem script, aparece direto) */
function contar(el) {
  const fim = Number(el.dataset.contar), prefixo = el.dataset.prefixo || '';
  if (calmo || !isFinite(fim)) return;
  const fmt = v => prefixo + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const t0 = performance.now(), dur = 1100;
  const passo = t => {
    const k = Math.min(1, (t - t0) / dur), suave = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(fim * suave);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* abertura: o extrato sendo classificado, em casa ou na empresa */
(function () {
  const extrato = document.querySelector('.extrato');
  const lista = document.getElementById('extratoLinhas');
  const botoes = [...document.querySelectorAll('.troca button')];
  if (!extrato || !lista || !botoes.length) return;
  const exemplos = {
    casa: {
      conta: 'Conta pessoal, novembro', saldo: '+3.695,45', vence: ['Fatura do cartão', 'R$ 1.284,30'],
      linhas: [
        ['03/11', 'COMPRA CARTAO SUPERM SAO JOAO', 'Supermercado', '−478,15', 'saida'],
        ['05/11', 'CRED SALARIO 0001 FOLHA PGTO', 'Salário', '+6.200,00', 'entrada'],
        ['05/11', 'PAG BOLETO COND RES DAS FLORES', 'Condomínio', '−780,00', 'saida'],
        ['06/11', 'DEB AUTOMATICO COLEGIO ABC', 'Escola das crianças', '−1.150,00', 'saida'],
        ['07/11', 'COMPRA DEB DROGARIA CENTRAL', 'Farmácia', '−96,40', 'saida'],
      ],
    },
    empresa: {
      conta: 'Conta PJ, novembro', saldo: '+7.678,50', vence: ['Energia elétrica', 'R$ 412,90'],
      linhas: [
        ['03/11', 'COMPRA CARTAO PAPELARIA CENTRAL', 'Material de escritório', '−478,15', 'saida'],
        ['05/11', 'TED RECEBIDA 0341 CLIENTE LTDA', 'Serviços prestados', '+9.800,00', 'entrada'],
        ['05/11', 'PAG BOLETO IMOBILIARIA CENTRO', 'Aluguel da loja', '−2.200,00', 'saida'],
        ['06/11', 'COMPRA DEB AUTO POSTO RIO', 'Combustível', '−295,02', 'saida'],
        ['07/11', 'PIX RECEBIDO M SOUZA', 'Venda de produtos', '+851,67', 'entrada'],
      ],
    },
  };
  const animar = () => {
    if (calmo) return;
    extrato.classList.remove('animar');
    void extrato.offsetWidth;          // reinicia as animações
    extrato.classList.add('animar');
  };
  const mostrar = nome => {
    const ex = exemplos[nome];
    botoes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.exemplo === nome)));
    document.getElementById('extratoConta').textContent = ex.conta;
    document.getElementById('extratoSaldo').textContent = ex.saldo;
    const vence = document.getElementById('venceLinha');
    vence.children[0].textContent = ex.vence[0];
    vence.children[1].textContent = ex.vence[1];
    lista.replaceChildren(...ex.linhas.map(([dia, bruto, classe, valor, tipo], i) => {
      const li = document.createElement('li');
      li.dataset.tipo = tipo;
      li.style.setProperty('--i', i);
      const span = (cls, txt) => { const s = document.createElement('span'); s.className = cls; if (txt) s.textContent = txt; return s; };
      const desc = span('desc');
      desc.append(span('bruto', bruto), span('classe', classe));
      li.append(span('dia', dia), desc, span('valor', valor));
      return li;
    }));
    animar();
  };
  let mexeu = false;
  botoes.forEach(b => b.addEventListener('click', () => { mexeu = true; mostrar(b.dataset.exemplo); }));
  animar();
  // uma única troca sozinha, depois que a primeira classificação termina: mostra que serve aos dois
  if (!calmo) setTimeout(() => {
    const topo = extrato.getBoundingClientRect();
    if (!mexeu && topo.bottom > 0 && topo.top < innerHeight) mostrar('empresa');
  }, 6500);
  document.querySelectorAll('.celular [data-contar]').forEach(contar);
})();

/* peças que se mostram em ação quando entram na tela (uma vez) */
(function () {
  const pecas = document.querySelectorAll('.peca, .publico');
  if (!('IntersectionObserver' in window)) { pecas.forEach(p => p.classList.add('visto')); return; }
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visto');
    e.target.querySelectorAll('[data-contar]').forEach(contar);
    obs.unobserve(e.target);
  }), { threshold: 0.45 });
  pecas.forEach(p => obs.observe(p));
})();

/* telas: abas com teclado (setas, Home, End); as que têm vídeo tocam sozinhas, sem som, só quando visíveis */
(function () {
  const abas = [...document.querySelectorAll('.abas [role="tab"]')];
  const img = document.getElementById('imgTela');
  const vid = document.getElementById('vidTela');
  const btn = document.getElementById('btnVideo');
  const legenda = document.getElementById('legendaTela');
  const painel = document.getElementById('painel-tela');
  if (!abas.length || !img) return;
  let visivel = false, pausadoPelaPessoa = calmo;

  function atualizarBotao() {
    const parado = vid.paused;
    btn.classList.toggle('parado', parado);
    btn.setAttribute('aria-label', parado ? 'Reproduzir vídeo' : 'Pausar vídeo');
  }
  function tocarSePuder() {
    if (vid.hidden) return;
    if (visivel && !pausadoPelaPessoa) vid.play().catch(() => {}); else vid.pause();
  }

  function escolher(aba, foco) {
    abas.forEach(a => {
      const sel = a === aba;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
    });
    const tela = aba.dataset.tela;
    img.src = `img/tela-${tela}.webp`;
    img.alt = 'Tela do GeFinance: ' + aba.textContent;
    legenda.textContent = aba.dataset.legenda;
    painel.setAttribute('aria-labelledby', aba.id);
    if (aba.dataset.video) {
      vid.poster = `img/tela-${tela}.webp`;
      vid.src = `video/${aba.dataset.video}.mp4`;
      vid.setAttribute('aria-label', 'Vídeo: ' + aba.dataset.legenda);
      vid.hidden = false; img.hidden = true; btn.hidden = false;
      tocarSePuder();
    } else {
      vid.pause(); vid.removeAttribute('src'); vid.load();
      vid.hidden = true; img.hidden = false; btn.hidden = true;
    }
    atualizarBotao();
    if (foco) aba.focus();
  }
  abas.forEach((a, i) => {
    a.addEventListener('click', () => escolher(a));
    a.addEventListener('keydown', ev => {
      const n = abas.length;
      const alvo = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[ev.key];
      if (alvo === undefined) return;
      ev.preventDefault();
      escolher(abas[alvo], true);
    });
  });
  btn.addEventListener('click', () => {
    pausadoPelaPessoa = !vid.paused;
    if (pausadoPelaPessoa) vid.pause(); else vid.play().catch(() => {});
  });
  vid.addEventListener('play', atualizarBotao);
  vid.addEventListener('pause', atualizarBotao);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visivel = es[0].isIntersecting; tocarSePuder(); }, { threshold: 0.35 }).observe(painel);
  } else visivel = true;
  escolher(abas[0]);
  // pré-carrega as imagens das outras abas depois da página
  addEventListener('load', () => abas.slice(1).forEach(a => { const p = new Image(); p.src = `img/tela-${a.dataset.tela}.webp`; }));
})();

/* plano mensal: link de pagamento, quando houver (data-link); sem ele, o botão abre um e-mail */
(function () {
  const a = document.getElementById('lnkMensal');
  if (a && /^https:\/\//.test(a.dataset.link || '')) { a.href = a.dataset.link; a.target = '_blank'; a.rel = 'noopener'; }
})();

/* downloads: liga direto aos arquivos da última versão publicada */
(function () {
  fetch('https://api.github.com/repos/ronniericarth/gefinance-downloads/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => (r.ok ? r.json() : null))
    .then(rel => {
      if (!rel || !Array.isArray(rel.assets)) return;
      const versao = (rel.tag_name || '').replace(/^v/, '');
      const achar = re => rel.assets.find(x => re.test(x.name));
      const ligar = (id, arq) => {
        const el = document.getElementById(id);
        if (!el || !arq) return;
        el.href = arq.browser_download_url;
        const v = document.createElement('span');
        v.className = 'ver';
        v.textContent = `Baixar versão ${versao} (${Math.round(arq.size / 1048576)} MB)`;
        el.appendChild(v);
      };
      ligar('dlWindows', achar(/\.exe$/i));
      ligar('dlLinux', achar(/\.rpm$/i));
      if (versao) document.getElementById('versaoAtual').textContent =
        `Versão ${versao}, com teste grátis de 7 dias.`;
    })
    .catch(() => { /* fica o link para a página de versões */ });
})();

/* barra fixa no celular: aparece depois da abertura e some quando a chamada final ou o rodapé entram na tela */
(function () {
  const barra = document.getElementById('barraFixa');
  const abertura = document.querySelector('.abertura');
  const fim = document.getElementById('chamadaFinal');
  if (!barra || !abertura || !('IntersectionObserver' in window)) return;
  const estreita = matchMedia('(max-width: 760px)');
  let passouAbertura = false, noFim = false;
  const atualizar = () => {
    barra.hidden = !estreita.matches;
    barra.classList.toggle('visivel', estreita.matches && passouAbertura && !noFim);
  };
  new IntersectionObserver(es => { passouAbertura = !es[0].isIntersecting; atualizar(); }).observe(abertura);
  if (fim) new IntersectionObserver(es => { noFim = es[0].isIntersecting || es[0].boundingClientRect.top < 0; atualizar(); }).observe(fim);
  estreita.addEventListener('change', atualizar);
  atualizar();
})();
