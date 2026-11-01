/**
 * Confirmação de presença do site → planilha "Planilha_Organizacao_Casamento May e Diego".
 *
 * Como instalar (uma vez só):
 * 1. Abra a planilha > Extensões > Apps Script. Apague o que estiver lá e cole este arquivo.
 * 2. Engrenagem (Configurações do projeto) > Propriedades do script > Adicionar:
 *      TOKEN = (uma senha longa qualquer; a mesma vai no Netlify como RSVP_TOKEN)
 * 3. Implantar > Nova implantação > tipo "App da Web"
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *    Autorize e copie a URL que termina em /exec (vai no Netlify como RSVP_SCRIPT_URL).
 *
 * O site nunca fala direto com este script: as funções do Netlify fazem a ponte e
 * mandam o TOKEN junto. Sem o TOKEN certo, o script não responde nada.
 */

const ABA = '👥 Convidados';

// Colunas que o script lê (pelo nome do cabeçalho na linha 1).
const COL = {
  nome: 'Nome',
  lado: 'Lado',
  grupo: 'Grupo de convite',
  crianca: 'Criança?',
  conviteSite: 'Convite (site)', // opcional: se preenchida, define quem aparece junto no convite
};

// Colunas que o script escreve. Se não existirem, ele usa as "Coluna N" vazias do fim.
const SAIDA = [
  'Presença (site)',
  'Restrição alimentar (site)',
  'Recado (site)',
  'Respondido por (site)',
  'Respondido em (site)',
];

const GRUPOS_FORA = ['noivos'];
const IGNORAR = ['da', 'de', 'do', 'das', 'dos', 'e', 'vo', 'vó', 'tia', 'tio'];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || body.token !== token) return json_({ ok: false, erro: 'nao_autorizado' });
    if (body.acao === 'buscar') return json_(buscar_(String(body.nome || '')));
    if (body.acao === 'responder') return json_(responder_(body));
    return json_({ ok: false, erro: 'acao_invalida' });
  } catch (err) {
    return json_({ ok: false, erro: 'falha', detalhe: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function norm_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens_(s) {
  return norm_(s).split(' ').filter(t => t.length >= 2 && IGNORAR.indexOf(t) < 0);
}

/** Lê a aba e devolve as pessoas convidadas, já com a chave do convite. */
function lerConvidados_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  const dados = sh.getDataRange().getValues();
  const cab = dados[0].map(h => String(h).trim());
  const idx = {};
  Object.keys(COL).forEach(k => { idx[k] = cab.indexOf(COL[k]); });
  const presIdx = cab.indexOf(SAIDA[0]);
  const pessoas = [];
  for (let r = 1; r < dados.length; r++) {
    const row = dados[r];
    const nome = String(row[idx.nome] || '').trim();
    const lado = idx.lado >= 0 ? String(row[idx.lado] || '').trim() : 'x';
    if (!nome || !lado) continue; // linhas de resumo/tabela dinâmica não têm "Lado"
    const conviteSite = idx.conviteSite >= 0 ? String(row[idx.conviteSite] || '').trim() : '';
    const grupo = conviteSite || String(row[idx.grupo] || '').trim();
    if (GRUPOS_FORA.indexOf(norm_(grupo)) >= 0) continue;
    pessoas.push({
      linha: r + 1,
      nome: nome,
      convite: grupo ? 'g:' + norm_(grupo) : 'p:' + (r + 1),
      rotulo: grupo,
      crianca: idx.crianca >= 0 && norm_(row[idx.crianca]) === 'sim',
      presenca: presIdx >= 0 ? String(row[presIdx] || '') : '',
    });
  }
  return pessoas;
}

function buscar_(nome) {
  const q = tokens_(nome);
  if (!q.length || q[0].length < 3) return { ok: true, convites: [] };
  const pessoas = lerConvidados_();
  // casa pelo primeiro nome digitado; se a pessoa digitou nome e sobrenome, o sobrenome ajuda a desempatar
  const achados = pessoas.filter(p => tokens_(p.nome).indexOf(q[0]) >= 0);
  const chaves = [];
  achados.forEach(p => { if (chaves.indexOf(p.convite) < 0) chaves.push(p.convite); });
  const convites = chaves.slice(0, 4).map(ch => ({
    convite: ch,
    membros: pessoas.filter(p => p.convite === ch).map(p => ({ linha: p.linha, nome: p.nome, crianca: p.crianca, presenca: p.presenca })),
  }));
  return { ok: true, convites: convites };
}

function garantirColunas_(sh) {
  const ultima = sh.getLastColumn();
  const cab = sh.getRange(1, 1, 1, ultima).getValues()[0].map(h => String(h).trim());
  const pos = {};
  SAIDA.forEach(nome => {
    let i = cab.indexOf(nome);
    if (i < 0) {
      i = cab.findIndex((h, j) => /^Coluna \d+$/.test(h) && sh.getRange(2, j + 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().every(v => v[0] === ''));
      if (i < 0) { sh.insertColumnAfter(sh.getMaxColumns()); i = sh.getMaxColumns() - 1; }
      sh.getRange(1, i + 1).setValue(nome).setFontWeight('bold');
      cab[i] = nome;
    }
    pos[nome] = i + 1;
  });
  return pos;
}

function responder_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const pessoas = lerConvidados_();
    const convite = String(b.convite || '');
    const membros = pessoas.filter(p => p.convite === convite);
    if (!membros.length) return { ok: false, erro: 'convite_nao_encontrado' };
    const respostas = Array.isArray(b.respostas) ? b.respostas : [];
    const sh = SpreadsheetApp.getActive().getSheetByName(ABA);
    const pos = garantirColunas_(sh);
    const agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    const limpa = (s, n) => String(s || '').replace(/[\r\n]+/g, ' ').replace(/^[=+\-@]/, "'$&").slice(0, n);
    let gravados = 0;
    respostas.forEach(r => {
      const m = membros.find(p => p.linha === Number(r.linha)); // só aceita linhas do próprio convite
      if (!m) return;
      sh.getRange(m.linha, pos[SAIDA[0]]).setValue(r.vai ? 'Vai' : 'Não vai');
      sh.getRange(m.linha, pos[SAIDA[1]]).setValue(limpa(b.restricao, 300));
      sh.getRange(m.linha, pos[SAIDA[2]]).setValue(limpa(b.recado, 600));
      sh.getRange(m.linha, pos[SAIDA[3]]).setValue(limpa(b.respondidoPor, 80));
      sh.getRange(m.linha, pos[SAIDA[4]]).setValue(agora);
      gravados++;
    });
    return { ok: gravados > 0, gravados: gravados };
  } finally {
    lock.releaseLock();
  }
}
