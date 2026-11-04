import { INDEXED_ROUTES, SITE_URL } from "./lib/site";

export default function sitemap() {
  return INDEXED_ROUTES.map((route) => ({ url: `${SITE_URL}${route}` }));
}
