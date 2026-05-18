import fetch from 'node-fetch';
import cheerio from 'cheerio';
import FS from 'fs-extra';
import path from 'path';
import { runFetcher } from './utils/runFetcher';

interface HfPaper {
  title: string;
  url: string;
  arxivId: string;
  upvotes: number;
}

function isoWeek(d: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getUTCFullYear();
  return { year, week };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function parsePapers(html: string): HfPaper[] {
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
  return papers;
}

async function fetchAndParse(url: string, label: string): Promise<HfPaper[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' },
  });
  if (!res.ok) throw new Error(`HF papers ${label} fetch failed (${url}): ${res.status}`);
  const html = await res.text();
  const papers = parsePapers(html);
  console.log(`> HF Papers ${label}: ${papers.length} 篇 (${url})`);
  return papers;
}

runFetcher('HF Papers', ['hf-papers-daily.json', 'hf-papers-weekly.json', 'hf-papers-monthly.json'], async () => {
  const now = new Date();
  const { year, week } = isoWeek(now);
  const weekStr = `${year}-W${pad2(week)}`;
  const monthStr = `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;

  const daily = await fetchAndParse('https://huggingface.co/papers', 'daily');
  const weekly = await fetchAndParse(`https://huggingface.co/papers/week/${weekStr}`, 'weekly');
  const monthly = await fetchAndParse(`https://huggingface.co/papers/month/${monthStr}`, 'monthly');

  const distDir = path.join(process.cwd(), 'dist');
  await FS.outputFile(path.join(distDir, 'hf-papers-daily.json'), JSON.stringify(daily, null, 2));
  await FS.outputFile(path.join(distDir, 'hf-papers-weekly.json'), JSON.stringify(weekly, null, 2));
  await FS.outputFile(path.join(distDir, 'hf-papers-monthly.json'), JSON.stringify(monthly, null, 2));
  console.log(`> dist/hf-papers-{daily,weekly,monthly}.json 写入完成`);
});
