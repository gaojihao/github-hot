import FS from 'fs-extra';
import path from 'path';

/**
 * 在 fetcher 顶层包一层：失败时为指定 JSON 写空数组（如尚未存在），打印错误，exit 0。
 * 这样某一个源临时挂掉不会导致 CI 整个失败，build 步骤仍能基于上次的数据出页面。
 */
export async function runFetcher(
  name: string,
  outputs: string[],
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const msg = (err as Error).stack || (err as Error).message || String(err);
    console.error(`! [${name}] 抓取失败：${msg}`);
    const distDir = path.join(process.cwd(), 'dist');
    for (const file of outputs) {
      const full = path.join(distDir, file);
      if (!FS.existsSync(full)) {
        await FS.outputFile(full, '[]');
        console.error(`! [${name}] 占位写入 dist/${file}（首次失败，无历史数据）`);
      } else {
        console.error(`! [${name}] 保留 dist/${file} 历史数据`);
      }
    }
    // 故意不 throw / 不 exit non-zero，确保 build 步骤继续
  }
}
