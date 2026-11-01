/**
 * Confirmação de presença do site → aba "Confirmação" da planilha
 * "Planilha_Organizacao_Casamento May e Diego".
 *
 * O site só lê e escreve na aba "Confirmação". A aba "👥 Convidados" é apenas
 * lida, e só quando você usa o menu Casamento > Trazer convidados novos.
 *
 * Como instalar (uma vez só):
 * 1. Abra a planilha > Extensões > Apps Script. Apague o que estiver lá e cole este arquivo.
 * 2. Engrenagem (Configurações do projeto) > Propriedades do script > Adicionar:
 *      TOKEN = (uma senha longa qualquer; a mesma vai no Netlify como RSVP_TOKEN)
 * 3. Implantar > Nova implantação > tipo "App da Web"
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *    Autorize e copie a URL que termina em /exec (vai no Netlify como RSVP_SCRIPT_URL).
 */

const ABA = 'Confirmação';
const ABA_BASE = '👥 Convidados';

// Cabeçalhos da aba Confirmação (o script acha as colunas pelo nome).
const C = {
  id: 'ID',
  nome: 'Nome (aparece no site)',
  convite: 'Convite',
  lado: 'Lado',
  crianca: 'Criança?',
  presenca: 'Presença',
  restricao: 'Restrição alimentar',
  recado: 'Recado',
  por: 'Respondido por',
  em: 'Respondido em',
  obs: 'Observação',
  origem: 'Origem (não editar)',
};

const IGNORAR = ['da', 'de', 'do', 'das', 'dos', 'e', 'vo', 'tia', 'tio'];

/* ---------------- site ---------------- */

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

function aba_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('Aba "' + ABA + '" não encontrada');
  const dados = sh.getDataRange().getValues();
  const cab = dados[0].map(h => String(h).trim());
  const col = {};
  Object.keys(C).forEach(k => { col[k] = cab.indexOf(C[k]); });
  ['nome', 'convite', 'presenca'].forEach(k => { if (col[k] < 0) throw new Error('Coluna "' + C[k] + '" não encontrada na aba ' + ABA); });
  return { sh: sh, dados: dados, col: col };
}

/** Pessoas da aba Confirmação, cada uma com a chave do convite. */
function pessoas_(a) {
  const out = [];
  for (let r = 1; r < a.dados.length; r++) {
    const row = a.dados[r];
    const nome = String(row[a.col.nome] || '').trim();
    if (!nome) continue;
    const convite = String(row[a.col.convite] || '').trim();
    out.push({
      linha: r + 1,
      nome: nome,
      convite: convite ? 'g:' + norm_(convite) : 'p:' + (r + 1),
      crianca: a.col.crianca >= 0 && norm_(row[a.col.crianca]) === 'sim',
      presenca: String(row[a.col.presenca] || ''),
    });
  }
  return out;
}

function buscar_(nome) {
  const q = tokens_(nome);
  if (!q.length || q[0].length < 3) return { ok: true, convites: [] };
  const pessoas = pessoas_(aba_());
  const achados = pessoas.filter(p => tokens_(p.nome).indexOf(q[0]) >= 0);
  const chaves = [];
  achados.forEach(p => { if (chaves.indexOf(p.convite) < 0) chaves.push(p.convite); });
  const convites = chaves.slice(0, 4).map(ch => ({
    convite: ch,
    membros: pessoas.filter(p => p.convite === ch).map(p => ({
      linha: p.linha, nome: p.nome, crianca: p.crianca,
      presenca: /^(vai|não vai)$/i.test(p.presenca) ? p.presenca : '',
    })),
  }));
  return { ok: true, convites: convites };
}

function responder_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const a = aba_();
    const membros = pessoas_(a).filter(p => p.convite === String(b.convite || ''));
    if (!membros.length) return { ok: false, erro: 'convite_nao_encontrado' };
    const respostas = Array.isArray(b.respostas) ? b.respostas : [];
    const agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    const limpa = (s, n) => String(s || '').replace(/[\r\n]+/g, ' ').replace(/^[=+\-@]/, "'$&").slice(0, n);
    const grava = (linha, k, v) => { if (a.col[k] >= 0) a.sh.getRange(linha, a.col[k] + 1).setValue(v); };
    let gravados = 0;
    respostas.forEach(r => {
      const m = membros.find(p => p.linha === Number(r.linha)); // só aceita linhas do próprio convite
      if (!m) return;
      grava(m.linha, 'presenca', r.vai ? 'Vai' : 'Não vai');
      grava(m.linha, 'restricao', limpa(b.restricao, 300));
      grava(m.linha, 'recado', limpa(b.recado, 600));
      grava(m.linha, 'por', limpa(b.respondidoPor, 80));
      grava(m.linha, 'em', agora);
      gravados++;
    });
    return { ok: gravados > 0, gravados: gravados };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- menu da planilha ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Casamento')
    .addItem('Trazer convidados novos da aba Convidados', 'trazerConvidadosNovos')
    .addToUi();
}

/**
 * Copia para a aba Confirmação quem está na aba Convidados e ainda não foi copiado.
 * Não apaga nem altera quem já está na Confirmação (nomes e convites que você ajustou ficam).
 */
function trazerConvidadosNovos() {
  const base = SpreadsheetApp.getActive().getSheetByName(ABA_BASE);
  const dadosBase = base.getDataRange().getValues();
  const cb = dadosBase[0].map(h => String(h).trim());
  const iId = cb.indexOf('ID'), iNome = cb.indexOf('Nome'), iLado = cb.indexOf('Lado'), iGrupo = cb.indexOf('Grupo de convite'), iCri = cb.indexOf('Criança?');
  const a = aba_();
  const ja = {};
  if (a.col.origem >= 0) for (let r = 1; r < a.dados.length; r++) ja[String(a.dados[r][a.col.origem])] = true;

  const largura = Math.max.apply(null, Object.keys(a.col).map(k => a.col[k])) + 1; // só até a última coluna conhecida (o resumo ao lado fica intacto)
  const novas = [];
  for (let r = 1; r < dadosBase.length; r++) {
    const row = dadosBase[r];
    const nome = String(row[iNome] || '').trim();
    const lado = String(row[iLado] || '').trim();
    const grupo = String(row[iGrupo] || '').trim();
    if (!nome || !lado || norm_(grupo) === 'noivos') continue; // sem "Lado" = linhas de resumo
    const id = String(row[iId] || '').trim();
    const origem = id ? 'id:' + id : 'nome:' + nome.toLowerCase();
    if (ja[origem]) continue;
    const linha = new Array(largura).fill('');
    const poe = (k, v) => { if (a.col[k] >= 0) linha[a.col[k]] = v; };
    poe('id', id); poe('nome', nome); poe('convite', grupo); poe('lado', lado);
    poe('crianca', iCri >= 0 ? row[iCri] : ''); poe('presenca', 'Aguardando'); poe('origem', origem);
    poe('obs', grupo ? 'Trazido da aba Convidados.' : 'Trazido da aba Convidados sem grupo: preencha o Convite.');
    novas.push(linha);
    ja[origem] = true;
  }
  if (novas.length) a.sh.getRange(a.sh.getLastRow() + 1, 1, novas.length, largura).setValues(novas);
  SpreadsheetApp.getUi().alert(novas.length ? novas.length + ' convidado(s) novo(s) copiado(s) para a aba Confirmação.' : 'Nenhum convidado novo: a aba Confirmação já está em dia.');
}
