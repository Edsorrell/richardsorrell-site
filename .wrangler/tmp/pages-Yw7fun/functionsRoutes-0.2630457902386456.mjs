import { onRequestGet as __drawings__slug__js_onRequestGet } from "/home/claude/richardsorrell-site/functions/drawings/[slug].js"
import { onRequestGet as __paintings__slug__js_onRequestGet } from "/home/claude/richardsorrell-site/functions/paintings/[slug].js"
import { onRequestGet as __about_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/about.js"
import { onRequestGet as __archive_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/archive.js"
import { onRequestGet as __exhibitions_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/exhibitions.js"
import { onRequestGet as __llms_txt_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/llms.txt.js"
import { onRequestGet as __sitemap_xml_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/sitemap.xml.js"
import { onRequestGet as __index_js_onRequestGet } from "/home/claude/richardsorrell-site/functions/index.js"

export const routes = [
    {
      routePath: "/drawings/:slug",
      mountPath: "/drawings",
      method: "GET",
      middlewares: [],
      modules: [__drawings__slug__js_onRequestGet],
    },
  {
      routePath: "/paintings/:slug",
      mountPath: "/paintings",
      method: "GET",
      middlewares: [],
      modules: [__paintings__slug__js_onRequestGet],
    },
  {
      routePath: "/about",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__about_js_onRequestGet],
    },
  {
      routePath: "/archive",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__archive_js_onRequestGet],
    },
  {
      routePath: "/exhibitions",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__exhibitions_js_onRequestGet],
    },
  {
      routePath: "/llms.txt",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__llms_txt_js_onRequestGet],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__sitemap_xml_js_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__index_js_onRequestGet],
    },
  ]