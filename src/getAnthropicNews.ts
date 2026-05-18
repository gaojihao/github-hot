import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';

interface NewsItem {
  title: string;
  category: string;
  date: string;
  dateTs: number;
  url: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

(async () => {
  const res = await fetch('https://www.anthropic.com/news', {
    headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
  });
  if (!res.ok) throw new Error(`Anthropic news fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];
  const seen = new Set<string>();

  $('a[href^="/news/"]').each((_idx, el) => {
    const href = $(el).attr('href') || '';
    if (!href.startsWith('/news/') || href === '/news') return;
    if (seen.has(href)) return;
    seen.add(href);

    const title =
      $(el).find('[class*="__title"]').first().text().trim() ||
      $(el).find('h2, h3, h4').first().text().trim();
    if (!title) return;

    const category =
      $(el).find('[class*="__subject"]').first().text().trim() ||
      $(el).find('[class*="bold"]').first().text().trim();
    const date =
      $(el).find('time').first().text().trim() ||
      $(el).find('[class*="__date"]').first().text().trim();
    const dateTs = date ? new Date(date).getTime() : 0;

    items.push({
      title,
      category,
      date,
      dateTs: Number.isFinite(dateTs) ? dateTs : 0,
      url: `https://www.anthropic.com${href}`,
    });
  });

  const sorted = [...items].sort((a, b) => b.dateTs - a.dateTs);
  const now = Date.now();
  const withinDays = (days: number) => sorted.filter((n) => n.dateTs && now - n.dateTs <= days * DAY_MS);
  const ensureMin = (arr: NewsItem[], min: number) => arr.length >= min ? arr : sorted.slice(0, min);
  const daily = ensureMin(withinDays(2), 5);
  const weekly = ensureMin(withinDays(7), 10);
  const monthly = ensureMin(withinDays(30), 20);

  const distDir = path.join(process.cwd(), 'dist');
  await FS.outputFile(path.join(distDir, 'anthropic-news-daily.json'), JSON.stringify(daily, null, 2));
  await FS.outputFile(path.join(distDir, 'anthropic-news-weekly.json'), JSON.stringify(weekly, null, 2));
  await FS.outputFile(path.join(distDir, 'anthropic-news-monthly.json'), JSON.stringify(monthly, null, 2));
  console.log(`> Anthropic News daily: ${daily.length} | weekly: ${weekly.length} | monthly: ${monthly.length} (页面总 ${items.length})`);
})();
