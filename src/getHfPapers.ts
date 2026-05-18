import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';

interface HfPaper {
  title: string;
  url: string;
  arxivId: string;
  upvotes: number;
}

(async () => {
  const res = await fetch('https://huggingface.co/papers', {
    headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
  });
  if (!res.ok) throw new Error(`HF papers fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const papers: HfPaper[] = [];

  $('article').each((_idx, article) => {
    const titleLink = $(article).find('a[class*="line-clamp-3"]').first();
    const href = (titleLink.attr('href') || '').trim();
    const title = titleLink.text().trim();
    if (!href || !title) return;
    const arxivId = href.replace('/papers/', '');
    let upvotes = 0;
    $(article).find('[class*="leading-none"]').each((_i, el) => {
      const txt = $(el).text().trim();
      if (/^\d+$/.test(txt)) {
        upvotes = parseInt(txt, 10);
        return false;
      }
    });
    papers.push({
      title,
      url: `https://huggingface.co${href}`,
      arxivId,
      upvotes,
    });
  });

  await FS.outputFile(path.join(process.cwd(), 'dist', 'hf-papers.json'), JSON.stringify(papers, null, 2));
  console.log(`> dist/hf-papers.json 共 ${papers.length} 条`);
})();
