import FS from 'fs-extra';
import path from 'path';
import { creatTrendingHTML, ICreateTrendingHTML, creatListHTML } from './createHTML';
import trendingDailyData from '../dist/trending-daily.json';
import trendingWeeklyData from '../dist/trending-weekly.json';
import trendingMonthlyData from '../dist/trending-monthly.json';
import hfTrendingData from '../dist/hf-trending.json';
import hfPapersData from '../dist/hf-papers.json';
import openaiNewsData from '../dist/openai-news.json';

(async () => {
  try {
    let trending: ICreateTrendingHTML[] = [...trendingDailyData];
    let html: string = creatTrendingHTML(trending, 'daily');
    FS.outputFileSync(path.join(process.cwd(), 'web', 'trending.html'), html);
    FS.outputFileSync(path.join(process.cwd(), 'web', 'index.html'), html);
    console.log(`> Trending 日趋势榜，页面生成成功！共${trending.length}条数据！`);

    trending = [...trendingWeeklyData];
    html = creatTrendingHTML(trending, 'weekly');
    FS.outputFileSync(path.join(process.cwd(), 'web', 'trending-weekly.html'), html);
    console.log(`> Trending 周趋势榜，页面生成成功！共${trending.length}条数据！`);

    trending = [...trendingMonthlyData];
    html = creatTrendingHTML(trending, 'monthly');
    FS.outputFileSync(path.join(process.cwd(), 'web', 'trending-monthly.html'), html);
    console.log(`> Trending 月趋势榜，页面生成成功！共${trending.length}条数据！`);

    const hfItems = (hfTrendingData as Array<{ type: string; id: string; likes: number; pipelineTag: string; downloads: number }>).map((d) => ({
      title: d.id,
      subtitle: `[${d.type}]${d.pipelineTag ? ' ' + d.pipelineTag : ''}`,
      meta: `❤ ${d.likes}` + (d.downloads ? ` · ⬇ ${d.downloads}` : ''),
      url: `https://huggingface.co/${d.id}`,
    }));
    html = creatListHTML({ title: 'HuggingFace Trending', tabId: 'hf-trending', items: hfItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'hf-trending.html'), html);
    console.log(`> HF Trending 页面生成成功！共${hfItems.length}条数据！`);

    const paperItems = (hfPapersData as Array<{ title: string; url: string; arxivId: string; upvotes: number }>).map((p) => ({
      title: p.title,
      subtitle: p.arxivId,
      meta: `▲ ${p.upvotes}`,
      url: p.url,
    }));
    html = creatListHTML({ title: 'HuggingFace Daily Papers', tabId: 'hf-papers', items: paperItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'hf-papers.html'), html);
    console.log(`> HF Papers 页面生成成功！共${paperItems.length}条数据！`);

    const openaiItems = (openaiNewsData as Array<{ title: string; category: string; pubDate: string; url: string }>).map((n) => ({
      title: n.title,
      subtitle: n.category,
      meta: n.pubDate,
      url: n.url,
    }));
    html = creatListHTML({ title: 'OpenAI News', tabId: 'openai-news', items: openaiItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'openai-news.html'), html);
    console.log(`> OpenAI News 页面生成成功！共${openaiItems.length}条数据！`);
  } catch (error) {
    console.log(error);
  }
})()
