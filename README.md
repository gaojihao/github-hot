GitHub Trending 与 AI 资讯每日聚合，[预览页面](https://gaojihao.github.io/github-hot/)。

每个数据源支持 **Today / Week / Month** 三种时间维度，点页面顶端切换。

## 项目

- [GitHub Trending](https://gaojihao.github.io/github-hot/trending.html) [日](https://gaojihao.github.io/github-hot/trending.html) / [周](https://gaojihao.github.io/github-hot/trending-weekly.html) / [月](https://gaojihao.github.io/github-hot/trending-monthly.html)
- [HuggingFace Trending](https://gaojihao.github.io/github-hot/hf-trending.html) [日](https://gaojihao.github.io/github-hot/hf-trending.html) / [周](https://gaojihao.github.io/github-hot/hf-trending-weekly.html) / [月](https://gaojihao.github.io/github-hot/hf-trending-monthly.html)

## 技术

- [HuggingFace Daily Papers](https://gaojihao.github.io/github-hot/hf-papers.html) [日](https://gaojihao.github.io/github-hot/hf-papers.html) / [周](https://gaojihao.github.io/github-hot/hf-papers-weekly.html) / [月](https://gaojihao.github.io/github-hot/hf-papers-monthly.html)

## 新闻

- [OpenAI News](https://gaojihao.github.io/github-hot/openai-news.html) [日](https://gaojihao.github.io/github-hot/openai-news.html) / [周](https://gaojihao.github.io/github-hot/openai-news-weekly.html) / [月](https://gaojihao.github.io/github-hot/openai-news-monthly.html)
- [Anthropic News](https://gaojihao.github.io/github-hot/anthropic-news.html) [日](https://gaojihao.github.io/github-hot/anthropic-news.html) / [周](https://gaojihao.github.io/github-hot/anthropic-news-weekly.html) / [月](https://gaojihao.github.io/github-hot/anthropic-news-monthly.html)
- [量子位](https://gaojihao.github.io/github-hot/qbitai.html) [日](https://gaojihao.github.io/github-hot/qbitai.html) / [周](https://gaojihao.github.io/github-hot/qbitai-weekly.html) / [月](https://gaojihao.github.io/github-hot/qbitai-monthly.html)

每天 GitHub Actions 自动抓取并发布到 `gh-pages` 分支。

## 本地运行

```bash
npm install

# 一次性抓取全部数据源（每个写出 daily / weekly / monthly 三份 JSON）
npm run get:trending
npm run get:hf-trending
npm run get:hf-papers
npm run get:openai-news
npm run get:anthropic-news
npm run get:qbitai

# 生成所有静态页面（16 个 HTML）
npm start
```
