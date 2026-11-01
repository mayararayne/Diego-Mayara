import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// GET /api/recados/foto/:id → foto de um recado do mural
export default async (_req: Request, context: Context) => {
  const id = context.params.id || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Não encontrada", { status: 404 });
  const foto = await getStore("recados-fotos").getWithMetadata(id, { type: "arrayBuffer" });
  if (!foto) return new Response("Não encontrada", { status: 404 });
  const tipo = String(foto.metadata?.tipo || "image/jpeg");
  return new Response(foto.data, {
    headers: {
      "content-type": /^image\/(jpeg|png|webp|gif)$/.test(tipo) ? tipo : "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
};

export const config: Config = { path: "/api/recados/foto/:id", method: "GET" };
