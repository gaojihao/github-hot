# CLAUDE.md

给未来 AI 协作者（也含本人 30 天后回来读）的项目导读。

## 项目作用

每天定时抓取 GitHub Trending + 4 个 AI 资讯源（HF Trending / HF Papers / OpenAI / Anthropic / 量子位），生成 19 个静态 HTML + 6 个 JSON Feed，由 GitHub Actions 发布到 gh-pages。

- 入口（= Trending 日榜）：https://gaojihao.github.io/github-hot/
- JSON Feed 索引：`/feeds/index.json`

## 数据流

```
CI cron 0:30 / 12:30 UTC（或 push 到 master）
  ├─ npm ci
  ├─ npm run get:trending          → dist/trending-{daily,weekly,monthly}.json
  ├─ npm run get:hf-trending       → dist/hf-trending-*.json
  ├─ npm run get:hf-papers         → dist/hf-papers-*.json
  ├─ npm run get:openai-news       → dist/openai-news-*.json
  ├─ npm run get:anthropic-news    → dist/anthropic-news-*.json
  ├─ npm run get:qbitai            → dist/qbitai-*.json
  ├─ npm start (= node lib/build.js) → web/*.html + web/feeds/*.json
  └─ peaceiris/actions-gh-pages → gh-pages 分支
```

`dist/*.json` 已 gitignore——CI 每次跑都覆盖，本地需要时跑 `npm run get:*` 重新生成。

## 关键文件

| 路径 | 作用 |
|---|---|
| `src/get*.ts` | 6 个 fetcher，每个独立运行 + 写 dist JSON |
| `src/utils/runFetcher.ts` | 顶层错误兜底：失败 → stderr + 空占位 + exit 0 |
| `src/utils/index.ts` | GitHub Trending HTML 抓取与解析 |
| `src/createHTML.ts` | EJS 渲染函数 + `IListItem` / `IListPageOptions` / `IDateRange` 接口 |
| `src/build.ts` | 读所有 dist JSON → 调渲染函数 → 写 web HTML + feeds |
| `src/html/header.ejs` | 公共头：CSS 变量、暗色模式、tabs 导航 |
| `src/html/footer.ejs` | 公共脚 |
| `src/html/list.ejs` | 通用列表模板（含过滤搜索框 JS） |
| `src/html/trending.ejs` | trending 专用模板（语言色块/star/fork） |
| `.github/workflows/ci.yml` | CI 编排 |

## 关键约定

### 编译
- `tsbb build` 把 `src/*.ts` → `lib/*.js`，**EJS 文件会被复制到 `lib/html/`**
- 改完 TS 必须 `npm run build` 才生效（CI 的 `npm ci` 会触发 `prepare` → `build`）

### 添加新数据源（5 步）
1. 写 `src/getXxx.ts`，用 `runFetcher('Xxx', [outputs], async () => {...})` 包裹
2. `package.json` scripts 加 `"get:xxx": "node lib/getXxx.js"`
3. `.github/workflows/ci.yml` 加 `- run: npm run get:xxx` + `continue-on-error: true`
4. `src/build.ts` 加 import + 渲染调用 + (如适用) 加入 feedSlugs 列表
5. `src/html/header.ejs` 加导航 tab

### 时间维度（Today / Week / Month）
每个非 trending 源生成 3 份 JSON：`xxx-daily.json` / `xxx-weekly.json` / `xxx-monthly.json`，对应 3 个 HTML 页面。新闻类 fetcher 应用 `ensureMin(arr, N)` 兜底空页。

### 抓取的两条原则
- **数据稀疏**：用 `ensureMin` 保底 N 条，避免 daily 页空白
- **失败兜底**：`runFetcher` 不抛错，CI 个别源挂掉不会影响其他源出页

## 易踩的坑

- **HF API `?limit=` 上限是 20**，写 25 直接 400
- **HF datasets `?sort=likes30d` 服务端 504**，要靠 `runFetcher` 跳过
- **量子位默认 UA 被 403**，必须用浏览器 UA
- **HF Papers `[class*="leading-none"]`** 第一个匹配可能是 "Submitted by " 而非数字；要 `/^\d+$/.test()` 过滤
- **CSS 类名含 hash**（HF、Anthropic）：用 `[class*="__title"]` 属性包含选择器，别写完整类名
- **机器之心 /rss 已商业化**，重定向到付费数据服务页，不要再尝试加它

## 风格指南

- TypeScript，无 test framework（小项目，靠 `npm run get:* && npm start` 端到端验证）
- EJS 模板里数据走 `<%= %>`（默认 HTML 转义），属性上下文是安全的
- CSS 用 `:root` 变量 + `prefers-color-scheme: dark` 自动适配暗色
- 提交风格：`<scope>: <summary>` 或直接动词起头小写英文。每个 commit 末尾加 `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`
- 不写多行注释；行内单行解释 "why" 而非 "what"

## 不要做的事

- 不要把 `dist/*.json` 重新 git add 进来
- 不要给 `creatTrendingHTML` / `trending.ejs` 加 `IListItem` 兼容层 —— 它故意独立保留语言色块/star/fork 结构
- 不要给抓取脚本加重试循环 —— `runFetcher` 单次失败就跳过；下次 CI 跑（12 小时后）自然恢复
- 不要加更多源 —— 6 个已足够覆盖日常 AI 阅读，再多边际递减

## 还没做的可能优化

- 暗色模式还是跟系统走，没加手动切换按钮
- 历史归档（看"持续上榜"）—— 是新功能不是优化
- arxiv 源 —— 数据量大噪声多，需要关键词过滤设计
