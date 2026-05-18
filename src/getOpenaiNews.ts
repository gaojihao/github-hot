import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  category: string;
  pubDate: string;
  pubTs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_PAGE = 50;

(async () => {
  const res = await fetch('https://openai.com/news/rss.xml', {
    headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
  });
  if (!res.ok) throw new Error(`OpenAI RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: NewsItem[] = [];

  $('item').each((_idx, el) => {
    const title = $(el).find('title').first().text().trim();
    const link = $(el).find('link').first().text().trim();
    if (!title || !link) return;
    const pubDate = $(el).find('pubDate').first().text().trim();
    const pubTs = pubDate ? new Date(pubDate).getTime() : 0;
    items.push({
      title,
      description: $(el).find('description').first().text().trim(),
      url: link,
      category: $(el).find('category').first().text().trim(),
      pubDate,
      pubTs: Number.isFinite(pubTs) ? pubTs : 0,
    });
  });

  const now = Date.now();
  const sorted = [...items].sort((a, b) => b.pubTs - a.pubTs);
  const withinDays = (days: number) => sorted.filter((n) => n.pubTs && now - n.pubTs <= days * DAY_MS).slice(0, MAX_PER_PAGE);
  // 保底 N 条最近的——这类官方新闻发文稀疏，纯时间过滤经常出空页
  const ensureMin = (arr: NewsItem[], min: number) => arr.length >= min ? arr : sorted.slice(0, min);
  const daily = ensureMin(withinDays(2), 5);
  const weekly = ensureMin(withinDays(7), 10);
  const monthly = ensureMin(withinDays(30), 20);

  const distDir = path.join(process.cwd(), 'dist');
  await FS.outputFile(path.join(distDir, 'openai-news-daily.json'), JSON.stringify(daily, null, 2));
  await FS.outputFile(path.join(distDir, 'openai-news-weekly.json'), JSON.stringify(weekly, null, 2));
  await FS.outputFile(path.join(distDir, 'openai-news-monthly.json'), JSON.stringify(monthly, null, 2));
  console.log(`> OpenAI News daily: ${daily.length} | weekly: ${weekly.length} | monthly: ${monthly.length} (RSS 总 ${items.length})`);
})();
