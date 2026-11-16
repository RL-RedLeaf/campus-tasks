import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 本地开发加载 .env（Node 24 内置能力，不引 dotenv）。
 * 生产环境由 docker compose 注入，找不到文件时静默跳过。
 * 必须最先执行，保证后续模块读到完整环境变量。
 */
export function loadDotenv(): void {
  const candidates = [join(process.cwd(), '.env'), join(process.cwd(), '../../.env')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
  }
}

// main.ts 以副作用方式 import 本模块（import './load-env'），
// 必须在模块加载时自动执行，否则 .env 永远不会被加载（此前仅导出未调用，是死代码）。
loadDotenv();
