import { defineConfig } from "vite";
import { RollupOptions } from "rollup";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

import path from "path";

const { VATYPE } = process.env;
const VATYPES = ["hakija", "virkailija", "dev"];

if (!VATYPE || !VATYPES.includes(VATYPE as any)) {
  throw Error(`Unknown VATYPE ${VATYPE}`);
}

const virkailijaPaths = {
  hakemustenArviointi: "/va-virkailija/web/va/index.html",
  hakujenHallinta: "/va-virkailija/web/va/admin.html",
  koodienHallinta: "/va-virkailija/web/va/codevalues.html",
  haku: "/va-virkailija/web/va/search.html",
  yhteenveto: "/va-virkailija/web/va/summary.html",
};

const base = {
  hakija: "/hakija/",
  virkailija: "/virkailija/",
  dev: undefined,
};

const getHtmlFilePath = (url?: string) => {
  if (!url) {
    return;
  }
  if (url === "/" || url.startsWith("/avustushaku")) {
    return virkailijaPaths.hakemustenArviointi;
  }
  if (url.startsWith("/admin-ui/va-code-values")) {
    return virkailijaPaths.koodienHallinta;
  }
  if (url.startsWith("/admin")) {
    return virkailijaPaths.hakujenHallinta;
  }
  if (url.startsWith("/yhteenveto")) {
    return virkailijaPaths.yhteenveto;
  }
  if (url.startsWith("/haku")) {
    return virkailijaPaths.haku;
  }
  return;
};

const serverPath = "http://localhost:8081";

const virkailijaRollupOptions: RollupOptions = {
  input: {
    app: "va-virkailija/web/va/index.html",
    adminApp: "va-virkailija/web/va/admin.html",
    login: path.resolve(__dirname, "va-virkailija/web/va/login.html"),
    codeValues: path.resolve(__dirname, "va-virkailija/web/va/codevalues.html"),
    summaryApp: path.resolve(__dirname, "va-virkailija/web/va/summary.html"),
    search: path.resolve(__dirname, "va-virkailija/web/va/search.html"),
  },
  output: {
    dir: `va-virkailija/resources/public/virkailija/`,
  },
};

const publicAssetsDir =
  VATYPE === "hakija"
    ? "va-hakija/web/va/publicAssets"
    : "va-virkailija/web/va/publicAssets";

const hakijaRollupOptions: RollupOptions = {
  input: {
    hakijaApp: path.resolve(__dirname, "va-hakija/web/va/index.html"),
    selvitysApp: path.resolve(__dirname, "va-hakija/web/va/selvitys.html"),
    hakijaLogin: path.resolve(__dirname, "va-hakija/web/va/login.html"),
    muutoshakemusApp: path.resolve(
      __dirname,
      "va-hakija/web/va/muutoshakemus.html"
    ),
  },
  output: {
    dir: `va-hakija/resources/public/hakija`,
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: base[VATYPE],
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: "rewrite-middleware",
      configureServer(serve) {
        serve.middlewares.use((req, _res, next) => {
          req.url = getHtmlFilePath(req.url) ?? req.url;
          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: serverPath,
      },
      "/environment": {
        target: serverPath,
      },
      "/img": {
        target: serverPath,
      },
      "/favicon.ico": {
        target: serverPath,
      },
    },
  },
  resolve: {
    alias: [
      { find: /^~/, replacement: "" },
      {
        find: /\/soresu-form/,
        replacement: path.resolve(__dirname, "/soresu-form"),
      },
    ],
  },
  publicDir: publicAssetsDir,
  build: {
    sourcemap: "inline",
    emptyOutDir: true,
    rollupOptions:
      VATYPE === "hakija" ? hakijaRollupOptions : virkailijaRollupOptions,
  },
});
