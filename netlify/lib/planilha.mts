// Ponte entre o site e o Apps Script da planilha de convidados.
// RSVP_SCRIPT_URL e RSVP_TOKEN ficam nas variáveis de ambiente do Netlify (escopo: Functions).

export const PRAZO_RSVP = "2027-03-01T23:59:59-03:00";

export async function chamarPlanilha(payload: Record<string, unknown>) {
  const url = Netlify.env.get("RSVP_SCRIPT_URL");
  const token = Netlify.env.get("RSVP_TOKEN");
  if (!url || !token) return { status: 503, body: { ok: false, erro: "nao_configurado" } };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, token }),
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json();
    if (data?.erro === "nao_autorizado") return { status: 503, body: { ok: false, erro: "nao_configurado" } };
    return { status: data?.ok ? 200 : 400, body: data };
  } catch (err) {
    console.error("planilha", err);
    return { status: 502, body: { ok: false, erro: "planilha_indisponivel" } };
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
