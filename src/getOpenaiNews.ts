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
}

(async () => {
  const res = await fetch('https://openai.com/news/rss.xml', {
    headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
  });
  if (!res.ok) throw new Error(`OpenAI RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: NewsItem[] = [];

  $('item').each((_idx, el) => {
    if (items.length >= 30) return false;
    const title = $(el).find('title').first().text().trim();
    const link = $(el).find('link').first().text().trim();
    if (!title || !link) return;
    items.push({
      title,
      description: $(el).find('description').first().text().trim(),
      url: link,
      category: $(el).find('category').first().text().trim(),
      pubDate: $(el).find('pubDate').first().text().trim(),
    });
  });

  await FS.outputFile(path.join(process.cwd(), 'dist', 'openai-news.json'), JSON.stringify(items, null, 2));
  console.log(`> dist/openai-news.json 共 ${items.length} 条`);
})();
