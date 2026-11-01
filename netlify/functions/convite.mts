import type { Config } from "@netlify/functions";
import { chamarPlanilha, json } from "../lib/planilha.mts";

// GET /api/convite?nome=Vanessa → convites que têm alguém com esse nome
export default async (req: Request) => {
  const nome = (new URL(req.url).searchParams.get("nome") || "").trim().slice(0, 80);
  if (nome.length < 3) return json({ ok: false, erro: "nome_curto" }, 400);
  const r = await chamarPlanilha({ acao: "buscar", nome });
  return json(r.body, r.status);
};

export const config: Config = {
  path: "/api/convite",
  method: "GET",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
