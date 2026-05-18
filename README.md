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

```bash
npm install

# 一次性抓取全部数据源
npm run get:trending
npm run get:hf-trending
npm run get:hf-papers
npm run get:openai-news
npm run get:anthropic-news

# 生成所有静态页面
npm start
```
