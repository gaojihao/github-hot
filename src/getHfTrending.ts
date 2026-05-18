import fetch from 'node-fetch';
import FS from 'fs-extra';
import path from 'path';

type RepoType = 'models' | 'datasets' | 'spaces';
type Period = 'daily' | 'weekly' | 'monthly';

interface HfApiItem {
  id: string;
  likes?: number;
  downloads?: number;
  pipeline_tag?: string;
  lastModified?: string;
}

interface HfTrendingItem {
  type: 'model' | 'dataset' | 'space';
  id: string;
  likes: number;
  pipelineTag: string;
  downloads: number;
  lastModified: string;
}

const SORT_BY_PERIOD: Record<Period, string> = {
  daily: 'trendingScore',
  weekly: 'likes7d',
  monthly: 'likes30d',
};

const SINGULAR: Record<RepoType, 'model' | 'dataset' | 'space'> = {
  models: 'model',
  datasets: 'dataset',
  spaces: 'space',
};

async function fetchTypePeriod(type: RepoType, period: Period, limit = 20): Promise<HfTrendingItem[]> {
  const sort = SORT_BY_PERIOD[period];
  const url = `https://huggingface.co/api/${type}?sort=${sort}&limit=${limit}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
    });
    if (!res.ok) {
      console.log(`! HF ${type}/${period} HTTP ${res.status}; 跳过`);
      return [];
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      console.log(`! HF ${type}/${period} 返回非数组（${(json && json.error) || 'unknown'}）；跳过`);
      return [];
    }
    return (json as HfApiItem[]).map((it) => ({
      type: SINGULAR[type],
      id: it.id,
      likes: it.likes || 0,
      pipelineTag: it.pipeline_tag || '',
      downloads: it.downloads || 0,
      lastModified: it.lastModified || '',
    }));
  } catch (e) {
    console.log(`! HF ${type}/${period} 错误: ${(e as Error).message}; 跳过`);
    return [];
  }
}

async function buildPeriod(period: Period): Promise<HfTrendingItem[]> {
  const all: HfTrendingItem[] = [];
  for (const t of ['models', 'datasets', 'spaces'] as const) {
    const items = await fetchTypePeriod(t, period);
    console.log(`> HF Trending ${period}/${t}: ${items.length} 条`);
    all.push(...items);
  }
  return all;
}

(async () => {
  const daily = await buildPeriod('daily');
  const weekly = await buildPeriod('weekly');
  const monthly = await buildPeriod('monthly');
  const distDir = path.join(process.cwd(), 'dist');
  await FS.outputFile(path.join(distDir, 'hf-trending-daily.json'), JSON.stringify(daily, null, 2));
  await FS.outputFile(path.join(distDir, 'hf-trending-weekly.json'), JSON.stringify(weekly, null, 2));
  await FS.outputFile(path.join(distDir, 'hf-trending-monthly.json'), JSON.stringify(monthly, null, 2));
  console.log(`> dist/hf-trending-{daily,weekly,monthly}.json 写入完成（${daily.length}/${weekly.length}/${monthly.length}）`);
})();
