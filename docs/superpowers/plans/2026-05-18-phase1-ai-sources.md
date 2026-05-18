# Phase 1 实施计划：HF Trending / HF Papers / OpenAI News / Anthropic News

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 github-hot 上新增 4 个数据源（HuggingFace Trending、HuggingFace Daily Papers、OpenAI News、Anthropic News），每个源生成一个独立的静态 HTML 页面，按"项目 / 技术 / 新闻"三类分组渲染到顶部导航。

**Architecture:** 复用现有 `src/getTrending.ts` 模式，每个源一个抓取脚本（fetcher）写入 `dist/*.json`；非 trending 的源共用一个通用列表模板 `src/html/list.ejs`，由 `creatListHTML` 渲染；`build.ts` 读所有 JSON 并输出到 `web/*.html`；CI 串行抓取后用 `peaceiris/actions-gh-pages` 发布。

**Tech Stack:** TypeScript (`tsbb` 编译) / `node-fetch` / `cheerio`（HTML 抓取）/ `ejs`（模板）/ GitHub Actions

---

## 文件结构

新增：
- `src/getHfTrending.ts` — HF Trending JSON API 抓取
- `src/getHfPapers.ts` — HF Papers HTML 抓取
- `src/getOpenaiNews.ts` — OpenAI RSS 抓取
- `src/getAnthropicNews.ts` — Anthropic News HTML 抓取
- `src/html/list.ejs` — 通用列表模板（标题 + 副标题 + meta + 链接）
- `dist/hf-trending.json` / `hf-papers.json` / `openai-news.json` / `anthropic-news.json`（由抓取脚本生成）

修改：
- `src/createHTML.ts` — 新增 `creatListHTML(items, opts)`
- `src/build.ts` — 渲染 4 个新页（`hf-trending.html`、`hf-papers.html`、`openai-news.html`、`anthropic-news.html`）
- `src/html/header.ejs` — 重构 tabs 为按"项目 / 技术 / 新闻"分组
- `package.json` — 新增 4 个 `get:*` 脚本
- `.github/workflows/ci.yml` — 新增 4 个抓取 step
- `README.md` — 新增 4 个页面链接

不修改：`src/getTrending.ts` / `src/html/trending.ejs` / `src/utils/index.ts`（trending 完全独立）

---

## Task 1: 通用列表数据接口与模板

**Files:**
- Create: `src/html/list.ejs`
- Modify: `src/createHTML.ts`

通用模板要承接 4 个源的输出，所以先定义统一的 item 接口和渲染函数。trending 不动。

- [ ] **Step 1: 在 `src/createHTML.ts` 顶部加上接口和渲染函数**

把以下代码追加到文件末尾（保留已有的 `creatTrendingHTML`）：

```ts
export interface IListItem {
  title: string;
  subtitle?: string;
  meta?: string;
  url: string;
}

export interface IListPageOptions {
  title: string;
  tabId: string;
  items: IListItem[];
}

export function creatListHTML(opts: IListPageOptions): string {
  const filename: string = path.join(rootPath, 'list.ejs');
  const tmpStr: string = FS.readFileSync(filename).toString();
  return ejs.render(tmpStr, { ...opts, date: dateStr }, { filename });
}
```

- [ ] **Step 2: 创建 `src/html/list.ejs`**

```ejs
<%- include('header', { tabCls: tabId }); %>
<ul class="list">
  <li class="rank-title">
    <span><%= title %></span>
  </li>
  <% items.forEach(function(item, idx){ %>
  <li>
    <div class="info">
      <div class="rank">
        <span title="Ranking <%= idx + 1 %>"><%= idx + 1 %></span>
        <a href="<%= item.url %>" target="_blank" title="<%= item.title %>"><%= item.title %></a>
      </div>
      <% if (item.subtitle || item.meta) { %>
      <div class="sub-title followers">
        <% if (item.subtitle) { %><span class="star"><%= item.subtitle %></span><% } %>
        <% if (item.meta) { %><span class="star"><%= item.meta %></span><% } %>
      </div>
      <% } %>
    </div>
  </li>
  <% }); %>
</ul>
<%- include('footer', { }); %>
```

- [ ] **Step 3: 构建确认编译通过**

Run: `npm run build`
Expected: 输出包含 `src/createHTML.ts -> lib/createHTML.js`，无报错。

- [ ] **Step 4: 在 Node REPL 里手测渲染（可选但推荐）**

Run:
```bash
node -e "
const { creatListHTML } = require('./lib/createHTML');
const html = creatListHTML({
  title: 'Test',
  tabId: 'trending',
  items: [{ title: 'Hello', subtitle: 'sub', meta: 'meta', url: 'https://example.com' }],
});
console.log(html.length, html.includes('Hello') ? 'OK' : 'FAIL');
"
```
Expected: 输出形如 `2345 OK`（长度非 0 且包含 'Hello'）。

- [ ] **Step 5: Commit**

```bash
git add src/createHTML.ts src/html/list.ejs
git commit -m "add shared list template and creatListHTML

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: header.ejs 重构为分组导航

**Files:**
- Modify: `src/html/header.ejs`

当前 header.ejs 只有一个 `Trending` tab。重构为按"项目 / 技术 / 新闻"分组，先把 Phase 1 的 4 个新 tab 加进去；Phase 2 的源暂不写入。

- [ ] **Step 1: 替换 `src/html/header.ejs` 中的 `<div class="tabs">` 段**

把当前的：
```html
<div class="tabs">
  <a class="active" href="trending.html">Trending</a>
</div>
```

替换为：
```html
<div class="tabs">
  <span class="tab-group">📦
    <a class="<%= tabCls === 'trending' ? 'active' : '' %>" href="trending.html">GitHub Trending</a>
    <a class="<%= tabCls === 'hf-trending' ? 'active' : '' %>" href="hf-trending.html">HF Trending</a>
  </span>
  <span class="tab-group">🤖
    <a class="<%= tabCls === 'hf-papers' ? 'active' : '' %>" href="hf-papers.html">HF Papers</a>
  </span>
  <span class="tab-group">📰
    <a class="<%= tabCls === 'openai-news' ? 'active' : '' %>" href="openai-news.html">OpenAI</a>
    <a class="<%= tabCls === 'anthropic-news' ? 'active' : '' %>" href="anthropic-news.html">Anthropic</a>
  </span>
</div>
```

- [ ] **Step 2: 在 `<style>` 块里给 `.tab-group` 加样式**

在已有 `.tabs a.active { ... }` 行后面插入：
```css
.tab-group { display: inline-block; margin: 0 6px; font-size: 14px; color: #999; }
.tab-group a { margin-left: 6px; }
```

- [ ] **Step 3: 构建并验证 trending 页仍然正常**

Run:
```bash
npm run build && npm start
```
Expected:
- 输出包含 `> Trending 日趋势榜，页面生成成功！共N条数据！` 三条
- `web/trending.html` 存在

- [ ] **Step 4: 抽查渲染出来的 tabs HTML**

Run: `grep -A 12 'class="tabs"' web/trending.html | head -20`
Expected: 看到 3 个 `<span class="tab-group">`，且 `<a class="active" href="trending.html">` 命中，其他 tab 链接存在但未 active。

- [ ] **Step 5: Commit**

```bash
git add src/html/header.ejs
git commit -m "regroup nav tabs by category (projects/tech/news)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: HF Trending 抓取与页面

**Files:**
- Create: `src/getHfTrending.ts`
- Modify: `src/build.ts`, `package.json`, `.github/workflows/ci.yml`

数据源：`https://huggingface.co/api/trending?limit=25&type=<model|dataset|space>`，返回 `{ recentlyTrending: [{ repoData: {...}, repoType: '...' }, ...] }`。`repoData` 关键字段：`id`、`likes`、`pipeline_tag`、`downloads`、`lastModified`。

页面一页内分 3 个 section（models / datasets / spaces），但通用模板只接受单 items 数组。采取的做法：3 种类型 flatten 成一个 items 数组，subtitle 里写明类型（如 `[model] image-text-to-text`）。

- [ ] **Step 1: 创建 `src/getHfTrending.ts`**

```ts
import fetch from 'node-fetch';
import FS from 'fs-extra';
import path from 'path';

interface HfRepoData {
  id: string;
  likes?: number;
  pipeline_tag?: string;
  downloads?: number;
  lastModified?: string;
}

interface HfTrendingItem {
  type: 'model' | 'dataset' | 'space';
  id: string;
  likes: number;
  pipelineTag: string;
  downloads: number;
  lastModified: string;
}

async function fetchType(type: 'model' | 'dataset' | 'space', limit = 25): Promise<HfTrendingItem[]> {
  const url = `https://huggingface.co/api/trending?limit=${limit}&type=${type}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'github-hot/1.0 (+https://github.com/silver-blue-space/github-rank)' } });
  if (!res.ok) throw new Error(`HF ${type} fetch failed: ${res.status}`);
  const json = await res.json();
  const items = (json.recentlyTrending || []) as Array<{ repoData: HfRepoData }>;
  return items.map(({ repoData }) => ({
    type,
    id: repoData.id,
    likes: repoData.likes || 0,
    pipelineTag: repoData.pipeline_tag || '',
    downloads: repoData.downloads || 0,
    lastModified: repoData.lastModified || '',
  }));
}

(async () => {
  const all: HfTrendingItem[] = [];
  for (const t of ['model', 'dataset', 'space'] as const) {
    const items = await fetchType(t);
    console.log(`> HF Trending ${t}: ${items.length} 条`);
    all.push(...items);
  }
  await FS.outputFile(path.join(process.cwd(), 'dist', 'hf-trending.json'), JSON.stringify(all, null, 2));
  console.log(`> dist/hf-trending.json 共 ${all.length} 条`);
})();
```

- [ ] **Step 2: 构建并运行抓取**

Run:
```bash
npm run build
node lib/getHfTrending.js
```
Expected:
- 控制台输出 `> HF Trending model: 25 条` / `dataset: 25 条` / `space: 25 条` / `dist/hf-trending.json 共 75 条`
- 文件 `dist/hf-trending.json` 存在

- [ ] **Step 3: 抽查 JSON 数据**

Run:
```bash
node -e "const d=require('./dist/hf-trending.json'); console.log(d.length, JSON.stringify(d[0], null, 2));"
```
Expected: 第一行打印 `75 {...}`，对象包含 `type`、`id`、`likes`、`pipelineTag` 等字段。

- [ ] **Step 4: 把抓取脚本加入 `package.json` scripts**

在 `package.json` 的 `scripts` 段，在 `"get:trending"` 行下方加：
```json
"get:hf-trending": "node lib/getHfTrending.js",
```

- [ ] **Step 5: 把抓取步骤加入 `.github/workflows/ci.yml`**

在 `- run: npm run get:trending` 行下方加：
```yaml
    - run: npm run get:hf-trending
```

- [ ] **Step 6: 修改 `src/build.ts` 添加 hf-trending 页面渲染**

在 `src/build.ts` 顶部 import 段最后加：
```ts
import { creatListHTML } from './createHTML';
import hfTrendingData from '../dist/hf-trending.json';
```

在 `(async () => { try {` 块的最后（`console.log` 第三条之后、`} catch` 之前），加入：

```ts
    const hfItems = (hfTrendingData as Array<{ type: string; id: string; likes: number; pipelineTag: string; downloads: number }>).map((d) => ({
      title: d.id,
      subtitle: `[${d.type}]${d.pipelineTag ? ' ' + d.pipelineTag : ''}`,
      meta: `❤ ${d.likes}` + (d.downloads ? ` · ⬇ ${d.downloads}` : ''),
      url: `https://huggingface.co/${d.id}`,
    }));
    html = creatListHTML({ title: 'HuggingFace Trending', tabId: 'hf-trending', items: hfItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'hf-trending.html'), html);
    console.log(`> HF Trending 页面生成成功！共${hfItems.length}条数据！`);
```

- [ ] **Step 7: 重新构建并跑完整 build**

Run:
```bash
npm run build && npm start
```
Expected: 控制台多出一行 `> HF Trending 页面生成成功！共75条数据！`，`web/hf-trending.html` 存在。

- [ ] **Step 8: 浏览器验证（可选）**

Run: `open web/hf-trending.html`（macOS）
Expected: 看到 75 条仓库列表，每条点链接跳到 huggingface.co；顶部导航出现"📦 GitHub Trending HF Trending / 🤖 HF Papers / 📰 OpenAI Anthropic"且 HF Trending 高亮。

- [ ] **Step 9: Commit**

```bash
git add src/getHfTrending.ts src/build.ts package.json .github/workflows/ci.yml
git commit -m "add HuggingFace Trending source

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: HF Papers 抓取与页面

**Files:**
- Create: `src/getHfPapers.ts`
- Modify: `src/build.ts`, `package.json`, `.github/workflows/ci.yml`

数据源：`https://huggingface.co/papers`（HTML）。结构（已确认）：
- 每条论文是一个 `<article class="relative ...">`
- 标题在 `<a class="line-clamp-3 ...">` 文本（href 形如 `/papers/2605.xxxx`）
- 点赞数在节点 `<* class="leading-none">N` 中（每条论文紧挨着标题）

HF 的 CSS 类名含 hash 串，会随构建变化，所以选择器用 `[class*="line-clamp-3"]`、`[class*="leading-none"]` 这类"包含"匹配。

- [ ] **Step 1: 创建 `src/getHfPapers.ts`**

```ts
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
    const upvoteText = $(article).find('[class*="leading-none"]').first().text().trim();
    const upvotes = parseInt(upvoteText, 10) || 0;
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
```

- [ ] **Step 2: 构建并运行抓取**

Run:
```bash
npm run build
node lib/getHfPapers.js
```
Expected: `> dist/hf-papers.json 共 N 条`，N ≥ 10。

- [ ] **Step 3: 抽查 JSON**

Run:
```bash
node -e "const d=require('./dist/hf-papers.json'); console.log(d.length); console.log(JSON.stringify(d[0], null, 2));"
```
Expected: 长度 ≥ 10；第一条对象有非空 `title`、`url`、`arxivId`、`upvotes`。

- [ ] **Step 4: 加入 `package.json` scripts**

在 `"get:hf-trending"` 行下方加：
```json
"get:hf-papers": "node lib/getHfPapers.js",
```

- [ ] **Step 5: 加入 CI**

在 `- run: npm run get:hf-trending` 行下方加：
```yaml
    - run: npm run get:hf-papers
```

- [ ] **Step 6: 修改 `src/build.ts` 添加 hf-papers 渲染**

在 import 段加：
```ts
import hfPapersData from '../dist/hf-papers.json';
```

在 hf-trending 渲染块之后加：
```ts
    const paperItems = (hfPapersData as Array<{ title: string; url: string; arxivId: string; upvotes: number }>).map((p) => ({
      title: p.title,
      subtitle: p.arxivId,
      meta: `▲ ${p.upvotes}`,
      url: p.url,
    }));
    html = creatListHTML({ title: 'HuggingFace Daily Papers', tabId: 'hf-papers', items: paperItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'hf-papers.html'), html);
    console.log(`> HF Papers 页面生成成功！共${paperItems.length}条数据！`);
```

- [ ] **Step 7: 构建并跑 build**

Run: `npm run build && npm start`
Expected: 控制台多出 `> HF Papers 页面生成成功！共N条数据！`，`web/hf-papers.html` 存在。

- [ ] **Step 8: Commit**

```bash
git add src/getHfPapers.ts src/build.ts package.json .github/workflows/ci.yml
git commit -m "add HuggingFace Daily Papers source

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: OpenAI News 抓取与页面

**Files:**
- Create: `src/getOpenaiNews.ts`
- Modify: `src/build.ts`, `package.json`, `.github/workflows/ci.yml`

数据源：`https://openai.com/news/rss.xml`（RSS XML，已验证 200 OK）。结构：
```xml
<item>
  <title><![CDATA[...]]></title>
  <description><![CDATA[...]]></description>
  <link>https://openai.com/index/...</link>
  <category><![CDATA[Product]]></category>
  <pubDate>Sat, 16 May 2026 00:00:00 GMT</pubDate>
</item>
```

不引入新依赖，用 cheerio 的 XML 模式解析。

- [ ] **Step 1: 创建 `src/getOpenaiNews.ts`**

```ts
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
```

- [ ] **Step 2: 构建并跑抓取**

Run:
```bash
npm run build
node lib/getOpenaiNews.js
```
Expected: `> dist/openai-news.json 共 N 条`，N ≥ 5。

- [ ] **Step 3: 抽查 JSON**

Run:
```bash
node -e "const d=require('./dist/openai-news.json'); console.log(d.length); console.log(JSON.stringify(d[0], null, 2));"
```
Expected: 第一条 `title`、`url`、`pubDate` 非空。

- [ ] **Step 4: 加入 `package.json`**

```json
"get:openai-news": "node lib/getOpenaiNews.js",
```

- [ ] **Step 5: 加入 CI**

```yaml
    - run: npm run get:openai-news
```

- [ ] **Step 6: 修改 `src/build.ts`**

import:
```ts
import openaiNewsData from '../dist/openai-news.json';
```

新渲染块：
```ts
    const openaiItems = (openaiNewsData as Array<{ title: string; category: string; pubDate: string; url: string }>).map((n) => ({
      title: n.title,
      subtitle: n.category,
      meta: n.pubDate,
      url: n.url,
    }));
    html = creatListHTML({ title: 'OpenAI News', tabId: 'openai-news', items: openaiItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'openai-news.html'), html);
    console.log(`> OpenAI News 页面生成成功！共${openaiItems.length}条数据！`);
```

- [ ] **Step 7: 构建并跑 build**

Run: `npm run build && npm start`
Expected: 控制台多出 `> OpenAI News 页面生成成功！共N条数据！`。

- [ ] **Step 8: Commit**

```bash
git add src/getOpenaiNews.ts src/build.ts package.json .github/workflows/ci.yml
git commit -m "add OpenAI News source via RSS

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Anthropic News 抓取与页面

**Files:**
- Create: `src/getAnthropicNews.ts`
- Modify: `src/build.ts`, `package.json`, `.github/workflows/ci.yml`

数据源：`https://www.anthropic.com/news`（HTML，无 RSS）。CSS 类名含 hash（`KxYrHG`），用属性包含选择器。

页面里有两种结构：
1. **FeaturedGrid** 顶部 4 条 —— 标题在 `<a [class*=FeaturedGrid]>` 里的 `h2/h4 [class*=Title]`
2. **PublicationList** 主列表 —— 标题在 `<a [class*=PublicationList]>` 里的 `span [class*=__title]`，日期在 `time [class*=__date]`，分类在 `span [class*=__subject]`

抓取策略：抓所有 `a[href^="/news/"]`，对每个 anchor 抽出文本/日期/分类（兼容两种结构）。

- [ ] **Step 1: 创建 `src/getAnthropicNews.ts`**

```ts
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

    // 标题：优先 PublicationList title，其次 FeaturedGrid title，最后 h2/h4 文本
    let title =
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
```

- [ ] **Step 2: 构建并跑抓取**

Run:
```bash
npm run build
node lib/getAnthropicNews.js
```
Expected: `> dist/anthropic-news.json 共 N 条`，N ≥ 8。

- [ ] **Step 3: 抽查 JSON**

Run:
```bash
node -e "const d=require('./dist/anthropic-news.json'); console.log(d.length); console.log(JSON.stringify(d.slice(0,3), null, 2));"
```
Expected: 前 3 条对象都有非空 `title`、`url`；至少几条带 `category` 和 `date`（首页 featured 几条可能没有 date 字段，可以接受）。

- [ ] **Step 4: 加入 `package.json`**

```json
"get:anthropic-news": "node lib/getAnthropicNews.js",
```

- [ ] **Step 5: 加入 CI**

```yaml
    - run: npm run get:anthropic-news
```

- [ ] **Step 6: 修改 `src/build.ts`**

import:
```ts
import anthropicNewsData from '../dist/anthropic-news.json';
```

新渲染块：
```ts
    const anthropicItems = (anthropicNewsData as Array<{ title: string; category: string; date: string; url: string }>).map((n) => ({
      title: n.title,
      subtitle: n.category,
      meta: n.date,
      url: n.url,
    }));
    html = creatListHTML({ title: 'Anthropic News', tabId: 'anthropic-news', items: anthropicItems });
    FS.outputFileSync(path.join(process.cwd(), 'web', 'anthropic-news.html'), html);
    console.log(`> Anthropic News 页面生成成功！共${anthropicItems.length}条数据！`);
```

- [ ] **Step 7: 构建并跑 build**

Run: `npm run build && npm start`
Expected: 控制台多出 `> Anthropic News 页面生成成功！共N条数据！`，`web/anthropic-news.html` 存在。

- [ ] **Step 8: Commit**

```bash
git add src/getAnthropicNews.ts src/build.ts package.json .github/workflows/ci.yml
git commit -m "add Anthropic News source

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: 更新 README 与端到端验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 `README.md`**

把全文替换为：

```markdown
GitHub Trending 与 AI 资讯每日聚合，[预览页面](https://gaojihao.github.io/github-hot/)。

## 项目

- [GitHub Trending（日 / 周 / 月）](https://gaojihao.github.io/github-hot/trending.html)
- [HuggingFace Trending](https://gaojihao.github.io/github-hot/hf-trending.html)

## 技术

- [HuggingFace Daily Papers](https://gaojihao.github.io/github-hot/hf-papers.html)

## 新闻

- [OpenAI News](https://gaojihao.github.io/github-hot/openai-news.html)
- [Anthropic News](https://gaojihao.github.io/github-hot/anthropic-news.html)

每天 GitHub Actions 自动抓取并发布到 `gh-pages` 分支。

## 本地运行

\`\`\`bash
npm install

# 一次性抓取全部数据源
npm run get:trending
npm run get:hf-trending
npm run get:hf-papers
npm run get:openai-news
npm run get:anthropic-news

# 生成所有静态页面
npm start
\`\`\`
```

注意：把上面 \\` 替换为真实的反引号。

- [ ] **Step 2: 端到端干跑**

Run:
```bash
npm run build
npm run get:trending
npm run get:hf-trending
npm run get:hf-papers
npm run get:openai-news
npm run get:anthropic-news
npm start
```
Expected:
- 每个抓取脚本输出非零计数
- `npm start` 末尾输出 5 段"页面生成成功"日志（Trending 三页 + HF Trending + HF Papers + OpenAI + Anthropic）

- [ ] **Step 3: 检查 web 目录产物**

Run: `ls web/`
Expected: 看到
```
index.html
trending.html
trending-weekly.html
trending-monthly.html
hf-trending.html
hf-papers.html
openai-news.html
anthropic-news.html
```

- [ ] **Step 4: 验证导航分组**

Run: `grep -A 1 'tab-group' web/hf-papers.html | head -10`
Expected: 看到 3 个 `<span class="tab-group">`，HF Papers 的 `<a>` 上有 `class="active"`。

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "update README with new AI source pages

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 自检

- **Spec 覆盖**：4 个 Phase 1 源（HF Trending / HF Papers / OpenAI News / Anthropic News）✓；通用 list.ejs 模板 ✓；导航分组 ✓；CI 接入 ✓；README 更新 ✓。Phase 2 源（arxiv / 掘金 / 机器之心 / 量子位 / github-repos）按设计文档明确推迟到后续 spec，不在本计划范围。
- **占位符扫描**：无 TBD / TODO；每个步骤的代码块都是完整可执行内容。
- **类型一致性**：`IListItem` 在 Task 1 定义，后续 Task 3-6 的 `creatListHTML` 调用全部使用 `{ title, subtitle, meta, url }` 一致结构。`tabId` 串与 header.ejs 中的 `tabCls === 'xxx'` 判断一一对应（trending / hf-trending / hf-papers / openai-news / anthropic-news）。
- **依赖**：未引入新 npm 包；OpenAI RSS 用 cheerio 的 `xmlMode: true` 解析即可。

## 风险

- **HF Papers / Anthropic 选择器**：CSS 类名含 hash，已用属性包含选择器（`[class*="..."]`）缓解；若几个月后页面重构仍可能需要修，与 trending 抓取同类。
- **数据可靠性**：每个抓取脚本失败时直接 throw，导致 CI 一整步失败但其他源不会被回滚；这是有意为之——发布的是部分更新好过发布出错版本。
