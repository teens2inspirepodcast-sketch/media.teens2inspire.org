import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  { ignores: [".next/**", ".next-deploy*/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**", "src/types/database.ts"] },
];

export default config;
