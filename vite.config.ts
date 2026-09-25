import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import { SEO_ROUTES, SEO_BASE_URL, SEO_IMAGE } from "./src/config/seoRoutes";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Sitemap (dev + build) e HTML por rota pública com head próprio (build). Fonte: seoRoutes.ts */
const seoPlugin = () => ({
  name: "compsmart-seo",
  buildStart() {
    const urls = SEO_ROUTES.map((r) =>
      `  <url>\n    <loc>${SEO_BASE_URL}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
    ).join("\n");
    fs.writeFileSync(
      path.resolve(__dirname, "public/sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  },
  closeBundle() {
    const dist = path.resolve(__dirname, "dist");
    const basePath = path.join(dist, "index.html");
    if (!fs.existsSync(basePath)) return;
    const base = fs.readFileSync(basePath, "utf8");
    for (const r of SEO_ROUTES) {
      const url = `${SEO_BASE_URL}${r.path}`;
      const t = esc(r.title), d = esc(r.description);
      const html = base
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${d}" />\n    <link rel="canonical" href="${url}" />`)
        .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${t}" />`)
        .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${d}" />`)
        .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${SEO_IMAGE}" />`)
        .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${t}" />`)
        .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${d}" />`);
      const out = r.path === "/" ? basePath : path.join(dist, r.path.slice(1), "index.html");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), seoPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "ui-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "charts-vendor": ["recharts"],
          "motion-vendor": ["framer-motion"],
          "supabase-vendor": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
