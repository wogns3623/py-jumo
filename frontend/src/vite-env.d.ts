/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_DEVTOOLS: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
