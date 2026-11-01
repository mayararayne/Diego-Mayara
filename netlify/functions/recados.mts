import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import sanitizeHtml from "sanitize-html";
import { json } from "../lib/planilha.mts";

// Mural de recados. Cada recado é um blob JSON separado (sem leitura-e-escrita no mesmo item).

export const LIMITE_TEXTO = 800;
const MAX_FOTOS = 3;
const MAX_FOTO_BYTES = 1_500_000;
const POR_PAGINA = 20;

const recados = () => getStore("recados");
const fotos = () => getStore("recados-fotos");

type Recado = { id: string; nome: string; html: string; fotos: string[]; criadoEm: string };
const publico = (r: Recado) => ({ id: r.id, nome: r.nome, html: r.html, criadoEm: r.criadoEm });

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const textoPuro = (html: string) => decode(sanitizeHtml(html.replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, " "), { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, " ").trim();

const TIPOS: Record<string, (b: Uint8Array) => boolean> = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  gif: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  webp: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
};

async function criar(req: Request) {
  let b: any;
  try { b = await req.json(); } catch { return json({ ok: false, erro: "Não conseguimos ler o recado." }, 400); }
  if (b?.site) return json({ ok: true }); // campo-isca: robôs preenchem, pessoas não veem
  const nome = String(b?.nome || "").replace(/\s+/g, " ").trim();
  if (nome.length < 2 || nome.length > 60) return json({ ok: false, erro: "Escreva seu nome (até 60 letras)." }, 400);

  let html = sanitizeHtml(String(b?.html || "").slice(0, 3_000_000), {
    allowedTags: ["p", "div", "br", "b", "strong", "i", "em", "u", "s", "strike", "ul", "ol", "li", "img"],
    allowedAttributes: { img: ["src"] },
    allowedSchemes: [],
    allowedSchemesByTag: { img: ["data"] },
    allowProtocolRelative: false,
    nonTextTags: ["style", "script", "textarea", "option", "noscript", "video", "audio", "iframe", "object", "embed", "source", "track"],
  });

  const id = crypto.randomUUID();
  const novasFotos: { id: string; bytes: Uint8Array; tipo: string }[] = [];
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /src="data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)"/i.exec(tag);
    if (!m || novasFotos.length >= MAX_FOTOS) return "";
    const tipo = m[1].toLowerCase();
    const bytes = Uint8Array.from(Buffer.from(m[2], "base64"));
    if (bytes.length > MAX_FOTO_BYTES || !TIPOS[tipo](bytes)) return "";
    const fid = crypto.randomUUID();
    novasFotos.push({ id: fid, bytes, tipo });
    return `<img src="/api/recados/foto/${fid}" alt="Foto enviada por ${nome.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}" loading="lazy" />`;
  });
  html = html.replace(/(<p>(\s|<br \/>)*<\/p>|<div>(\s|<br \/>)*<\/div>)+$/g, "").trim();

  const texto = textoPuro(html);
  const tamanho = [...texto].length;
  if (tamanho > LIMITE_TEXTO) return json({ ok: false, erro: `O recado passou do limite de ${LIMITE_TEXTO} caracteres.` }, 400);
  if (tamanho < 2 && !novasFotos.length) return json({ ok: false, erro: "Escreva uma mensagem antes de enviar." }, 400);

  await Promise.all(novasFotos.map((f) => fotos().set(f.id, f.bytes.buffer as ArrayBuffer, { metadata: { tipo: `image/${f.tipo}`, recado: id } })));
  const recado: Recado = { id, nome, html, fotos: novasFotos.map((f) => f.id), criadoEm: new Date().toISOString() };
  await recados().setJSON(`msg/${recado.criadoEm}_${id}`, recado);
  return json({ ok: true, recado: publico(recado) }, 201);
}

async function listar(req: Request) {
  const antes = new URL(req.url).searchParams.get("antes") || "";
  const { blobs } = await recados().list({ prefix: "msg/" });
  const chaves = blobs.map((b) => b.key).sort().reverse().filter((k) => !antes || k < antes);
  const pagina = chaves.slice(0, POR_PAGINA);
  const itens = (await Promise.all(pagina.map((k) => recados().get(k, { type: "json" })))) as (Recado | null)[];
  return json({
    ok: true,
    total: blobs.length,
    recados: itens.filter(Boolean).map((r) => publico(r!)),
    proximo: chaves.length > POR_PAGINA ? pagina[pagina.length - 1] : null,
  });
}

async function apagar(req: Request) {
  const admin = Netlify.env.get("RECADOS_ADMIN_TOKEN");
  if (!admin || req.headers.get("x-admin-token") !== admin) return json({ ok: false }, 401);
  const id = new URL(req.url).searchParams.get("id") || "";
  const { blobs } = await recados().list({ prefix: "msg/" });
  const chave = blobs.map((b) => b.key).find((k) => k.endsWith(`_${id}`));
  if (!chave) return json({ ok: false }, 404);
  const r = (await recados().get(chave, { type: "json" })) as Recado | null;
  await Promise.all((r?.fotos || []).map((f) => fotos().delete(f)));
  await recados().delete(chave);
  return json({ ok: true });
}

export default async (req: Request, _context: Context) => {
  try {
    if (req.method === "POST") return await criar(req);
    if (req.method === "DELETE") return await apagar(req);
    return await listar(req);
  } catch (err) {
    console.error("recados", err);
    return json({ ok: false, erro: "O mural está fora do ar agora. Tente de novo em instantes." }, 500);
  }
};

export const config: Config = {
  path: "/api/recados",
  method: ["GET", "POST", "DELETE"],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
