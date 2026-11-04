import type { Config } from "@netlify/functions";
import { chamarPlanilha, json, PRAZO_RSVP } from "../lib/planilha.mts";

// POST /api/rsvp { convite, respostas:[{linha, vai}], restricao, recado, respondidoPor }
export default async (req: Request) => {
  let b: any;
  try { b = await req.json(); } catch { return json({ ok: false, erro: "json_invalido" }, 400); }
  if (Date.now() > Date.parse(PRAZO_RSVP)) return json({ ok: false, erro: "prazo_encerrado" }, 400);
  const respostas = Array.isArray(b?.respostas) ? b.respostas.slice(0, 20) : [];
  if (!b?.convite || !respostas.length) return json({ ok: false, erro: "dados_incompletos" }, 400);
  const r = await chamarPlanilha({
    acao: "responder",
    convite: String(b.convite).slice(0, 200),
    respostas: respostas.map((x: any) => ({ linha: Number(x?.linha), vai: Boolean(x?.vai), ...(x?.idade !== undefined && x?.idade !== null && x?.idade !== "" ? { idade: Math.max(0, Math.min(16, Math.round(Number(x.idade)) || 0)) } : {}) })),
    restricao: String(b.restricao || "").slice(0, 300),
    recado: String(b.recado || "").slice(0, 600),
    respondidoPor: String(b.respondidoPor || "").slice(0, 80),
  });
  return json(r.body, r.status);
};

export const config: Config = {
  path: "/api/rsvp",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
