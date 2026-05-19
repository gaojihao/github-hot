import FS from 'fs-extra';
import path from 'path';
import { creatTrendingHTML, ICreateTrendingHTML, creatListHTML, IListItem, IDateRange } from './createHTML';

type Period = 'daily' | 'weekly' | 'monthly';

const distDir = path.join(process.cwd(), 'dist');
const webDir = path.join(process.cwd(), 'web');

function loadDist<T>(name: string): T[] {
  const full = path.join(distDir, name);
  if (!FS.existsSync(full)) {
    console.warn(`! 缺少 dist/${name}，按空数组渲染`);
    return [];
  }
  try {
    const parsed = JSON.parse(FS.readFileSync(full, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`! dist/${name} 解析失败：${(e as Error).message}`);
    return [];
  }
}

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

const healthIssues: string[] = [];

function renderListPeriod(
  slug: string,
  tabId: string,
  title: string,
  period: Period,
  items: IListItem[],
  label: string,
) {
  if (items.length === 0) healthIssues.push(`${label} ${period}`);
  const html = creatListHTML({
    title,
    tabId,
    items,
    dateRange: dateRangeFor(slug, period),
  });
  FS.outputFileSync(path.join(webDir, fileFor(slug, period)), html);
  console.log(`> ${label} ${period} 页面生成成功！共${items.length}条数据！`);
}

interface HfTrendingItem { type: string; id: string; likes: number; pipelineTag: string; downloads: number; }
interface HfPaperItem { title: string; url: string; arxivId: string; upvotes: number; }
interface OpenaiNewsItem { title: string; category: string; pubDate: string; url: string; }
interface AnthropicNewsItem { title: string; category: string; date: string; url: string; }
interface QbitaiItem { title: string; category: string; author: string; pubDate: string; url: string; }

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

function mapQbitai(data: QbitaiItem[]): IListItem[] {
  return data.map((n) => {
    const date = n.pubDate ? new Date(n.pubDate).toISOString().slice(0, 10) : '';
    const subtitleParts = [n.category, n.author].filter(Boolean);
    return {
      title: n.title,
      subtitle: subtitleParts.join(' · '),
      meta: date,
      url: n.url,
    };
  });
}

(async () => {
  try {
    const trendingDailyData = loadDist<ICreateTrendingHTML>('trending-daily.json');
    const trendingWeeklyData = loadDist<ICreateTrendingHTML>('trending-weekly.json');
    const trendingMonthlyData = loadDist<ICreateTrendingHTML>('trending-monthly.json');

    const renderTrending = (data: ICreateTrendingHTML[], type: Period, file: string, label: string) => {
      if (data.length === 0) healthIssues.push(label);
      const html = creatTrendingHTML(data, type);
      FS.outputFileSync(path.join(webDir, file), html);
      if (type === 'daily') FS.outputFileSync(path.join(webDir, 'index.html'), html);
      console.log(`> ${label}，页面生成成功！共${data.length}条数据！`);
    };
    renderTrending(trendingDailyData,   'daily',   'trending.html',         'Trending 日趋势榜');
    renderTrending(trendingWeeklyData,  'weekly',  'trending-weekly.html',  'Trending 周趋势榜');
    renderTrending(trendingMonthlyData, 'monthly', 'trending-monthly.html', 'Trending 月趋势榜');

    const hfTrendingDailyData   = loadDist<HfTrendingItem>('hf-trending-daily.json');
    const hfTrendingWeeklyData  = loadDist<HfTrendingItem>('hf-trending-weekly.json');
    const hfTrendingMonthlyData = loadDist<HfTrendingItem>('hf-trending-monthly.json');
    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'daily',   mapHfTrending(hfTrendingDailyData),   'HF Trending');
    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'weekly',  mapHfTrending(hfTrendingWeeklyData),  'HF Trending');
    renderListPeriod('hf-trending', 'hf-trending', 'HuggingFace Trending', 'monthly', mapHfTrending(hfTrendingMonthlyData), 'HF Trending');

    const hfPapersDailyData   = loadDist<HfPaperItem>('hf-papers-daily.json');
    const hfPapersWeeklyData  = loadDist<HfPaperItem>('hf-papers-weekly.json');
    const hfPapersMonthlyData = loadDist<HfPaperItem>('hf-papers-monthly.json');
    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'daily',   mapHfPapers(hfPapersDailyData),   'HF Papers');
    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'weekly',  mapHfPapers(hfPapersWeeklyData),  'HF Papers');
    renderListPeriod('hf-papers', 'hf-papers', 'HuggingFace Papers', 'monthly', mapHfPapers(hfPapersMonthlyData), 'HF Papers');

    const openaiNewsDailyData   = loadDist<OpenaiNewsItem>('openai-news-daily.json');
    const openaiNewsWeeklyData  = loadDist<OpenaiNewsItem>('openai-news-weekly.json');
    const openaiNewsMonthlyData = loadDist<OpenaiNewsItem>('openai-news-monthly.json');
    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'daily',   mapOpenaiNews(openaiNewsDailyData),   'OpenAI News');
    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'weekly',  mapOpenaiNews(openaiNewsWeeklyData),  'OpenAI News');
    renderListPeriod('openai-news', 'openai-news', 'OpenAI News', 'monthly', mapOpenaiNews(openaiNewsMonthlyData), 'OpenAI News');

    const anthropicNewsDailyData   = loadDist<AnthropicNewsItem>('anthropic-news-daily.json');
    const anthropicNewsWeeklyData  = loadDist<AnthropicNewsItem>('anthropic-news-weekly.json');
    const anthropicNewsMonthlyData = loadDist<AnthropicNewsItem>('anthropic-news-monthly.json');
    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'daily',   mapAnthropicNews(anthropicNewsDailyData),   'Anthropic News');
    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'weekly',  mapAnthropicNews(anthropicNewsWeeklyData),  'Anthropic News');
    renderListPeriod('anthropic-news', 'anthropic-news', 'Anthropic News', 'monthly', mapAnthropicNews(anthropicNewsMonthlyData), 'Anthropic News');

    const qbitaiDailyData   = loadDist<QbitaiItem>('qbitai-daily.json');
    const qbitaiWeeklyData  = loadDist<QbitaiItem>('qbitai-weekly.json');
    const qbitaiMonthlyData = loadDist<QbitaiItem>('qbitai-monthly.json');
    renderListPeriod('qbitai', 'qbitai', '量子位', 'daily',   mapQbitai(qbitaiDailyData),   '量子位');
    renderListPeriod('qbitai', 'qbitai', '量子位', 'weekly',  mapQbitai(qbitaiWeeklyData),  '量子位');
    renderListPeriod('qbitai', 'qbitai', '量子位', 'monthly', mapQbitai(qbitaiMonthlyData), '量子位');

    // ----- web/feeds/*.json: 把 daily 数据原样落到 web 下，方便 Inoreader/Feedly 这类 JSON Feed 直读 -----
    const feedSlugs: Array<{ slug: string; title: string; items: IListItem[] }> = [
      { slug: 'hf-trending',    title: 'HuggingFace Trending', items: mapHfTrending(hfTrendingDailyData) },
      { slug: 'hf-papers',      title: 'HuggingFace Papers',   items: mapHfPapers(hfPapersDailyData) },
      { slug: 'openai-news',    title: 'OpenAI News',          items: mapOpenaiNews(openaiNewsDailyData) },
      { slug: 'anthropic-news', title: 'Anthropic News',       items: mapAnthropicNews(anthropicNewsDailyData) },
      { slug: 'qbitai',         title: '量子位',                items: mapQbitai(qbitaiDailyData) },
    ];
    const updatedAt = new Date().toISOString();
    const feedsDir = path.join(webDir, 'feeds');
    for (const { slug, title, items } of feedSlugs) {
      const feed = {
        version: 'https://jsonfeed.org/version/1.1',
        title,
        home_page_url: `https://gaojihao.github.io/github-hot/${slug}.html`,
        feed_url: `https://gaojihao.github.io/github-hot/feeds/${slug}.json`,
        items: items.map((it, i) => ({
          id: it.url || `${slug}-${i}`,
          url: it.url,
          title: it.title,
          summary: [it.subtitle, it.meta].filter(Boolean).join(' · '),
          date_published: updatedAt,
        })),
      };
      FS.outputFileSync(path.join(feedsDir, `${slug}.json`), JSON.stringify(feed, null, 2));
    }
    const index = {
      updated_at: updatedAt,
      feeds: feedSlugs.map(({ slug, title }) => ({
        slug,
        title,
        feed_url: `https://gaojihao.github.io/github-hot/feeds/${slug}.json`,
        page_url: `https://gaojihao.github.io/github-hot/${slug}.html`,
      })),
    };
    FS.outputFileSync(path.join(feedsDir, 'index.json'), JSON.stringify(index, null, 2));
    console.log(`> web/feeds/*.json 写入完成（${feedSlugs.length} 个 JSON Feed + index.json）`);

    if (healthIssues.length) {
      console.warn(`! 健康检查：${healthIssues.length} 个页面 0 条数据 — ${healthIssues.join(', ')}`);
    } else {
      console.log(`> 健康检查通过：所有页面均有数据`);
    }
  } catch (error) {
    console.log(error);
  }
})()
