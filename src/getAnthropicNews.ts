import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';

interface NewsItem {
  title: string;
  category: string;
  date: string;
  url: string;
}

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

    items.push({
      title,
      category,
      date,
      url: `https://www.anthropic.com${href}`,
    });
  });

  await FS.outputFile(path.join(process.cwd(), 'dist', 'anthropic-news.json'), JSON.stringify(items, null, 2));
  console.log(`> dist/anthropic-news.json 共 ${items.length} 条`);
})();
