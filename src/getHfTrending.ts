import fetch from 'node-fetch';
import FS from 'fs-extra';
import path from 'path';

interface HfRepoData {
  id: string;
  likes?: number;
  pipeline_tag?: string;
  downloads?: number;
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

async function fetchType(type: 'model' | 'dataset' | 'space', limit = 20): Promise<HfTrendingItem[]> {
  const url = `https://huggingface.co/api/trending?limit=${limit}&type=${type}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' } });
  if (!res.ok) throw new Error(`HF ${type} fetch failed: ${res.status}`);
  const json = await res.json();
  const items = (json.recentlyTrending || []) as Array<{ repoData: HfRepoData }>;
  return items.map(({ repoData }) => ({
    type,
    id: repoData.id,
    likes: repoData.likes || 0,
    pipelineTag: repoData.pipeline_tag || '',
    downloads: repoData.downloads || 0,
    lastModified: repoData.lastModified || '',
  }));
}

(async () => {
  const all: HfTrendingItem[] = [];
  for (const t of ['model', 'dataset', 'space'] as const) {
    const items = await fetchType(t);
    console.log(`> HF Trending ${t}: ${items.length} 条`);
    all.push(...items);
  }
  await FS.outputFile(path.join(process.cwd(), 'dist', 'hf-trending.json'), JSON.stringify(all, null, 2));
  console.log(`> dist/hf-trending.json 共 ${all.length} 条`);
})();
