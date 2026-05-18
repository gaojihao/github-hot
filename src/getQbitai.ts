import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  category: string;
  author: string;
  pubDate: string;
  pubTs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_PAGE = 50;
// qbitai.com 默认 UA 会被 403，必须用浏览器风格 UA
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function pickCategory(cats: string[]): string {
  // 量子位每条文章有多个分类：常见有 资讯 / 首页轮播 / AI / 大模型 / ...
  // 优先选不是 资讯 / 首页轮播 / 业界 的具体话题
  const generic = new Set(['资讯', '首页轮播', '业界', '编辑推荐']);
  const specific = cats.find((c) => !generic.has(c));
  return specific || cats[0] || '';
}

(async () => {
  const res = await fetch('https://www.qbitai.com/feed', {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`Qbitai RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: NewsItem[] = [];

  $('item').each((_idx, el) => {
    const title = $(el).find('title').first().text().trim();
    const link = $(el).find('link').first().text().trim();
    if (!title || !link) return;
    const pubDate = $(el).find('pubDate').first().text().trim();
    const pubTs = pubDate ? new Date(pubDate).getTime() : 0;
    const categories: string[] = [];
    $(el).find('category').each((_i, c) => {
      const t = $(c).text().trim();
      if (t) categories.push(t);
    });
    items.push({
      title,
      description: $(el).find('description').first().text().trim(),
      url: link,
      category: pickCategory(categories),
      author: $(el).find('dc\\:creator').first().text().trim(),
      pubDate,
      pubTs: Number.isFinite(pubTs) ? pubTs : 0,
    });
  });

  const sorted = [...items].sort((a, b) => b.pubTs - a.pubTs);
  const now = Date.now();
  const withinDays = (days: number) => sorted.filter((n) => n.pubTs && now - n.pubTs <= days * DAY_MS).slice(0, MAX_PER_PAGE);
  const ensureMin = (arr: NewsItem[], min: number) => arr.length >= min ? arr : sorted.slice(0, min);
  const daily = ensureMin(withinDays(2), 5);
  const weekly = ensureMin(withinDays(7), 15);
  const monthly = ensureMin(withinDays(30), 30);

  const distDir = path.join(process.cwd(), 'dist');
  await FS.outputFile(path.join(distDir, 'qbitai-daily.json'), JSON.stringify(daily, null, 2));
  await FS.outputFile(path.join(distDir, 'qbitai-weekly.json'), JSON.stringify(weekly, null, 2));
  await FS.outputFile(path.join(distDir, 'qbitai-monthly.json'), JSON.stringify(monthly, null, 2));
  console.log(`> 量子位 daily: ${daily.length} | weekly: ${weekly.length} | monthly: ${monthly.length} (RSS 总 ${items.length})`);
})();
