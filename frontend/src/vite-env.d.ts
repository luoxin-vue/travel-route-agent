/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AMAP_JS_KEY: string;
  readonly VITE_AMAP_JS_SECURITY_CODE: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
