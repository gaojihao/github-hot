# AI 每日动态聚合：数据源扩展设计

## Context

github-hot 项目当前只保留 GitHub Trending 抓取与页面生成。用户作为 AI Agent 开发工程师，希望每天通过这套项目了解三类信息：

1. **AI / GitHub 相关开源项目**
2. **AI Agent 开发技术**
3. **大模型公司最新新闻**

偏好中文资料；英文优质源（arxiv、OpenAI/Anthropic 等）也纳入，但不做翻译。

本设计在现有"一源一 HTML 页面 → gh-pages 静态发布"的架构上扩展，新增 10 个数据源，分两阶段实施。

## 目标

- 不改变现有部署形态（仍是 gh-pages 静态站点 + 每日 CI 抓取）
- 新增 10 个数据源，按用户的 3 个关注点分组导航
- Phase 1（MVP）只做 4 个有稳定 RSS/JSON API 的源，验证"新增一源"的工作流
- Phase 2 补充 6 个需要 HTML 抓取的国内媒体与 arxiv

## 数据源清单

### 📦 开源项目

| ID | 源 | 入口 | Phase | 说明 |
|---|---|---|---|---|
| `trending` | GitHub Trending | `github.com/trending` | ✅ 已有 | 日/周/月三页 |
| `hf-trending` | HuggingFace Trending | `huggingface.co/api/trending` | 1 | JSON API 最稳；models/datasets/spaces |
| `github-repos` | GitHub AI Topic Repos | `api.github.com/search/repositories?q=topic:llm+stars:>500` | 2 | 复用 octokit；按 topic 聚焦 AI |

### 🤖 AI Agent 技术

| ID | 源 | 入口 | Phase | 说明 |
|---|---|---|---|---|
| `arxiv` | arxiv cs.AI / cs.CL | `arxiv.org/list/cs.AI/new` | 2 | 每天 100+ 条，取前 N 或按关键词筛 |
| `hf-papers` | HuggingFace Daily Papers | `huggingface.co/papers` | 1 | 社区精选，含 upvote 信噪比高 |
| `juejin` | 掘金 AI 标签 | `juejin.cn/tag/AI` | 2 | 国内开发者实战文章 |

### 📰 大模型新闻

| ID | 源 | 入口 | Phase | 说明 |
|---|---|---|---|---|
| `jiqizhixin` | 机器之心 | `jiqizhixin.com` | 2 | 国内 AI 媒体头部 |
| `qbitai` | 量子位 | `qbitai.com` | 2 | 与机器之心并列 |
| `openai-news` | OpenAI Blog | `openai.com/news/` | 1 | 有 RSS |
| `anthropic-news` | Anthropic News | `anthropic.com/news` | 1 | 有 RSS |

## Non-goals（明确不做）

- LLM 翻译 / 摘要
- 微信公众号抓取
- 国内大模型公司官博（智谱 / 月之暗面 / MiniMax 等）—— 入口分散、结构不稳定，等核心稳定后再单独评估
- 36Kr / CSDN / 思否 —— 信噪比低于机器之心 + 量子位
- 邮件 / Slack 推送（仍是浏览器访问 gh-pages）
- 用户级个性化过滤

## 架构

复用 `src/getTrending.ts` 的模式，每新增一源所需的代码 footprint：

```
src/getXxx.ts            # 抓取：HTTP → cheerio/JSON 解析 → dist/xxx.json
src/createHTML.ts        # +1 个 creatXxxHTML（或全部统一走 creatListHTML）
src/build.ts             # +1 个 outputFileSync 调用
package.json             # +1 个 npm run get:xxx 脚本
.github/workflows/ci.yml # +1 个 run 步骤
```

### 通用列表模板

非 trending 的源结构高度相似（标题 + 副标题 + 元信息 + 链接），新增一个共用模板 `src/html/list.ejs`，对外接口：

```ts
interface IGenericListItem {
  title: string;
  subtitle?: string;   // 作者 / 标签 / 模型 task
  meta?: string;       // "★ 1.2k" / "10 likes" / "2 days ago"
  url: string;
}

interface IListPageProps {
  title: string;       // 页面标题
  tabId: string;       // 用于 header 的 active tab 标识
  items: IGenericListItem[];
  dateRange?: { current: 'daily'|'weekly'|'monthly', urls: { ... } };  // 仅多周期源用
}
```

trending 保留独立 `trending.ejs`（字段较特殊：语言色块 / fork / star 增量）。

### 导航分组

`header.ejs` 改造：tabs 从平铺改为按三类分组渲染。

```ejs
<%
const navGroups = [
  { icon: '📦', label: '项目', tabs: [
    { id: 'trending',     href: 'trending.html',     label: 'GitHub Trending' },
    { id: 'hf-trending',  href: 'hf-trending.html',  label: 'HF Trending' },
    { id: 'github-repos', href: 'github-repos.html', label: 'GitHub Repos' },
  ]},
  { icon: '🤖', label: '技术', tabs: [
    { id: 'arxiv',     href: 'arxiv.html',     label: 'arxiv' },
    { id: 'hf-papers', href: 'hf-papers.html', label: 'HF Papers' },
    { id: 'juejin',    href: 'juejin.html',    label: '掘金 AI' },
  ]},
  { icon: '📰', label: '新闻', tabs: [
    { id: 'jiqizhixin',     href: 'jiqizhixin.html',     label: '机器之心' },
    { id: 'qbitai',         href: 'qbitai.html',         label: '量子位' },
    { id: 'openai-news',    href: 'openai-news.html',    label: 'OpenAI' },
    { id: 'anthropic-news', href: 'anthropic-news.html', label: 'Anthropic' },
  ]},
];
%>
```

Phase 1 时 Phase 2 的 tab 暂不渲染（或灰显），避免死链。

## 数据流

```
CI cron (每 12 小时)
  npm ci
  ├─ npm run get:trending        (已有)
  ├─ npm run get:hf-trending     ┐
  ├─ npm run get:hf-papers       │ Phase 1 MVP
  ├─ npm run get:openai-news     │
  └─ npm run get:anthropic-news  ┘
  npm run start                  → web/*.html
  peaceiris/actions-gh-pages     → gh-pages 分支
```

抓取串行执行；10 个源全跑预计 ≤ 90 秒，CI 单 job 完全够用。

## Phase 1 各源具体抓法

### hf-trending
- **端点**：`GET https://huggingface.co/api/trending?limit=25&type=model`（同样 type=dataset / type=space）
- **解析**：JSON，无需 cheerio
- **页面**：一页内 3 个 section（Models / Datasets / Spaces），每 section 25 条
- **字段映射**：
  - `title = item.repoData.id`
  - `subtitle = item.repoData.pipeline_tag || item.repoData.task || ''`
  - `meta = '❤ ' + item.repoData.likes`
  - `url = 'https://huggingface.co/' + item.repoData.id`

### hf-papers
- **端点**：`GET https://huggingface.co/papers`（HTML）
- **选择器**：`article` 节点（具体选择器抓取时确认）
- **字段映射**：
  - `title` = 论文标题
  - `subtitle` = 第一作者 + ' et al.'
  - `meta` = '▲ ' + upvotes
  - `url` = `https://huggingface.co/papers/<arxivId>`

### openai-news
- **端点**：尝试 `https://openai.com/news/rss/`；若 404 则改抓 `/news/` HTML
- **字段映射**：
  - `title` = `<item><title>` 或 H2 文本
  - `subtitle` = 分类标签
  - `meta` = 发布日期（格式化为 `YYYY-MM-DD`）
  - `url` = 原文链接

### anthropic-news
- **端点**：`https://www.anthropic.com/news/rss.xml`（抓取时验证；若无 RSS 改 HTML）
- **字段映射**：同 openai-news

## 关键文件路径

| 路径 | 操作 |
|---|---|
| `src/getHfTrending.ts` | 新增 |
| `src/getHfPapers.ts` | 新增 |
| `src/getOpenaiNews.ts` | 新增 |
| `src/getAnthropicNews.ts` | 新增 |
| `src/createHTML.ts` | 加 `creatListHTML` |
| `src/build.ts` | 渲染 4 个新页 |
| `src/html/list.ejs` | 新增通用模板 |
| `src/html/header.ejs` | 改造导航为分组结构 |
| `package.json` | 加 4 个 `get:*` 脚本 |
| `.github/workflows/ci.yml` | 加 4 个抓取 step |
| `README.md` | 加新页链接 |

## 验证

1. `npm run build` 全编译通过
2. `npm run get:hf-trending` 等 4 个抓取命令各写出对应 `dist/*.json`（每个 ≥ 10 条）
3. `npm start` 生成 `web/hf-trending.html`、`hf-papers.html`、`openai-news.html`、`anthropic-news.html`
4. 浏览器打开每个新页：列表渲染正常 / 链接可点 / 导航栏正确分组 / 当前 tab 高亮正确
5. CI dry-run（推到分支）：观察 gh-pages 部署成功，访问公开 URL 检查

## 风险与备注

- **HuggingFace API 未公开文档**：字段名可能变，需做容错（缺字段时 fallback 到空字符串而非 crash）
- **OpenAI RSS 可能不存在**：fetcher 写两条路径（先 RSS 后 HTML）并加日志说明实际走了哪条
- **CI 抓取共用 IP**：HF/arxiv/openai 在 CI 网段不易被限速，但需在请求里加 UA（`User-Agent: github-hot/1.0 (+repo url)`）以避免被默认拦截
- **静态站点 12 小时陈旧度**：用户接受（早晚两次刷新）
- **trending 抓取脆弱性**：刚修过 GitHub HTML 结构升级；后续 hf-papers 等也会面临类似风险，每加一个 HTML 抓取源就要做好"半年内可能需要修"的预期

## Phase 2（不在本 spec 实施范围）

待 Phase 1 部署稳定 2 周后，再用一个独立 spec 评估 Phase 2 的 6 个源（arxiv / github-repos / juejin / jiqizhixin / qbitai）。届时重点确认：
- 国内站点是否有 RSS（机器之心确认有 RSS：`https://www.jiqizhixin.com/rss`，量子位类似）—— 改用 RSS 后 Phase 2 抓取难度可能降到与 Phase 1 持平
- arxiv 每日条数太多，是否要加关键词过滤（`agent` / `LLM` / `RAG` 等）
- 是否引入定时器之外的 trigger（比如 RSS hub）
