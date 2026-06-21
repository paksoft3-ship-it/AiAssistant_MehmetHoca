/// <reference types="vite/client" />

// Vite `?url` imports resolve to a string asset URL at build time.
declare module '*?url' {
  const src: string;
  export default src;
}
