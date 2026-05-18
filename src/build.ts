import FS from 'fs-extra';
import path from 'path';
import { creatTrendingHTML, ICreateTrendingHTML, creatListHTML, IListItem, IDateRange } from './createHTML';
import trendingDailyData from '../dist/trending-daily.json';
import trendingWeeklyData from '../dist/trending-weekly.json';
import trendingMonthlyData from '../dist/trending-monthly.json';
import hfTrendingDailyData from '../dist/hf-trending-daily.json';
import hfTrendingWeeklyData from '../dist/hf-trending-weekly.json';
import hfTrendingMonthlyData from '../dist/hf-trending-monthly.json';
import hfPapersDailyData from '../dist/hf-papers-daily.json';
import hfPapersWeeklyData from '../dist/hf-papers-weekly.json';
import hfPapersMonthlyData from '../dist/hf-papers-monthly.json';
import openaiNewsDailyData from '../dist/openai-news-daily.json';
import openaiNewsWeeklyData from '../dist/openai-news-weekly.json';
import openaiNewsMonthlyData from '../dist/openai-news-monthly.json';
import anthropicNewsDailyData from '../dist/anthropic-news-daily.json';
import anthropicNewsWeeklyData from '../dist/anthropic-news-weekly.json';
import anthropicNewsMonthlyData from '../dist/anthropic-news-monthly.json';

type Period = 'daily' | 'weekly' | 'monthly';

function dateRangeFor(slug: string, current: Period): IDateRange {
  return {
    current,
    daily: `${slug}.html`,
    weekly: `${slug}-weekly.html`,
    monthly: `${slug}-monthly.html`,
  };
}

function fileFor(slug: string, period: Period): string {
  return period === 'daily' ? `${slug}.html` : `${slug}-${period}.html`;
}

function renderListPeriod(
  slug: string,
  tabId: string,
  title: string,
  period: Period,
  items: IListItem[],
  label: string,
) {
  const html = creatListHTML({
    title,
    tabId,
    items,
    dateRange: dateRangeFor(slug, period),
  });
  FS.outputFileSync(path.join(process.cwd(), 'web', fileFor(slug, period)), html);
  console.log(`> ${label} ${period} 页面生成成功！共${items.length}条数据！`);
}

interface HfTrendingItem { type: string; id: string; likes: number; pipelineTag: string; downloads: number; }
interface HfPaperItem { title: string; url: string; arxivId: string; upvotes: number; }
interface OpenaiNewsItem { title: string; category: string; pubDate: string; url: string; }
interface AnthropicNewsItem { title: string; category: string; date: string; url: string; }

function mapHfTrending(data: HfTrendingItem[]): IListItem[] {
  return data.map((d) => ({
    title: d.id,
    subtitle: `[${d.type}]${d.pipelineTag ? ' ' + d.pipelineTag : ''}`,
    meta: `❤ ${d.likes}` + (d.downloads ? ` · ⬇ ${d.downloads}` : ''),
    url: `https://huggingface.co/${d.id}`,
  }));
}

function mapHfPapers(data: HfPaperItem[]): IListItem[] {
  return data.map((p) => ({
    title: p.title,
    subtitle: p.arxivId,
    meta: `▲ ${p.upvotes}`,
    url: p.url,
  }));
}

function mapOpenaiNews(data: OpenaiNewsItem[]): IListItem[] {
  return data.map((n) => ({
    title: n.title,
    subtitle: n.category,
    meta: n.pubDate,
    url: n.url,
  }));
}

function mapAnthropicNews(data: AnthropicNewsItem[]): IListItem[] {
  return data.map((n) => ({
    title: n.title,
    subtitle: n.category,
    meta: n.date,
    url: n.url,
  }));
}

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

    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'daily',   mapHfTrending(hfTrendingDailyData as HfTrendingItem[]),   'HF Trending');
    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'weekly',  mapHfTrending(hfTrendingWeeklyData as HfTrendingItem[]),  'HF Trending');
    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'monthly', mapHfTrending(hfTrendingMonthlyData as HfTrendingItem[]), 'HF Trending');

    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'daily',   mapHfPapers(hfPapersDailyData as HfPaperItem[]),   'HF Papers');
    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'weekly',  mapHfPapers(hfPapersWeeklyData as HfPaperItem[]),  'HF Papers');
    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'monthly', mapHfPapers(hfPapersMonthlyData as HfPaperItem[]), 'HF Papers');

    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'daily',   mapOpenaiNews(openaiNewsDailyData as OpenaiNewsItem[]),   'OpenAI News');
    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'weekly',  mapOpenaiNews(openaiNewsWeeklyData as OpenaiNewsItem[]),  'OpenAI News');
    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'monthly', mapOpenaiNews(openaiNewsMonthlyData as OpenaiNewsItem[]), 'OpenAI News');

    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'daily',   mapAnthropicNews(anthropicNewsDailyData as AnthropicNewsItem[]),   'Anthropic News');
    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'weekly',  mapAnthropicNews(anthropicNewsWeeklyData as AnthropicNewsItem[]),  'Anthropic News');
    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'monthly', mapAnthropicNews(anthropicNewsMonthlyData as AnthropicNewsItem[]), 'Anthropic News');
  } catch (error) {
    console.log(error);
  }
})()
