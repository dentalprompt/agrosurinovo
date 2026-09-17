import {
  findPublicCatalogItemBySlug,
  findPublicTrackingByCode,
  listPublicCatalogItems
} from "../src/admin/repository.js";
import { getQueryParam, handleOptions, sendJson } from "./_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(req, res, 405, { message: "Método não permitido." });

  const action = getQueryParam(req, "action");

  try {
    if (action === "items") {
      const items = await listPublicCatalogItems({
        section: getQueryParam(req, "section")?.trim() || null,
        category: getQueryParam(req, "category")?.trim() || null,
        search: getQueryParam(req, "search")?.trim() || null,
        excludeSlug: getQueryParam(req, "excludeSlug")?.trim() || null,
        limit: getQueryParam(req, "limit") ? Number(getQueryParam(req, "limit")) : null
      });
      return sendJson(req, res, 200, { items });
    }

    if (action === "detail") {
      const slug = getQueryParam(req, "slug")?.trim() || "";
      if (!slug) return sendJson(req, res, 400, { message: "Slug do item não informado." });
      const item = await findPublicCatalogItemBySlug(slug);
      return item
        ? sendJson(req, res, 200, { item })
        : sendJson(req, res, 404, { message: "Item não encontrado." });
    }

    if (action === "tracking") {
      const code = getQueryParam(req, "code")?.trim().toUpperCase() || "";
      if (!code) return sendJson(req, res, 400, { message: "Código de rastreio não informado." });
      const tracking = await findPublicTrackingByCode(code);
      return tracking
        ? sendJson(req, res, 200, { tracking })
        : sendJson(req, res, 404, { message: "Rastreio não encontrado." });
    }

    return sendJson(req, res, 404, { message: "Rota pública não encontrada." });
  } catch (error) {
    console.error(error);
    return sendJson(req, res, 500, { message: "Erro ao consultar dados públicos." });
  }
}
