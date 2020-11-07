Github 中国用户排名，全球仓库 Star 最多排名，通过 Github API v3 来生成页面数据，[排行榜预览](https://silver-blue-space.github.iogithub-rank/)，最近还添加了 [SegmentFault 思否近期热门](https://silver-blue-space.github.io/github-rank/sifou-daily.html)、[开发者头条最近热门分享](https://silver-blue-space.github.io/github-rank/toutiao-7.html)、[36Kr 快讯预览](https://silver-blue-space.github.io/github-rank/36kr.html)。

- [Github **全球** 用户 Followers 排名预览](https://silver-blue-space.github.io/github-rank/)
- [Github **中国** 用户 Followers 排名预览](https://silver-blue-space.github.io/github-rank/users.china.html)
- [Github 全球仓库 Star 最多排名预览](https://silver-blue-space.github.io/github-rank/repos.html)
- [Github 社区趋势榜日、周、月预览](https://silver-blue-space.github.io/github-rank/trending.html) [**`日`**](https://silver-blue-space.github.io/github-rank/trending.html) [**`周`**](https://silver-blue-space.github.io/github-rank/trending-weekly.html) [**`月`**](https://silver-blue-space.github.io/github-rank/trending-monthly.html)
- [SegmentFault 思否 - 近期热门](https://silver-blue-space.github.io/github-rank/sifou-daily.html) [**`日`**](https://silver-blue-space.github.io/github-rank/sifou-daily.html) [**`周`**](https://silver-blue-space.github.io/github-rank/sifou-weekly.html) [**`月`**](https://silver-blue-space.github.io/github-rank/sifou-monthly.html)
- [开发者头条 - 最近热门分享](https://silver-blue-space.github.io/github-rank/toutiao-7.html) [**`7天`**](https://silver-blue-space.github.io/github-rank/toutiao-7.html) [**`30天`**](https://silver-blue-space.github.io/github-rank/toutiao-30.html) [**`90天`**](https://silver-blue-space.github.io/github-rank/toutiao-90.html)
- [36Kr - 快讯预览](https://silver-blue-space.github.io/github-rank/36kr.html)

从 `2019年04月20日` 在 [`npm`](https://www.npmjs.com/package/@wcj/github-rank) 上发版，版本号以 `年`、`月`、`日` 来定义，如: `v19.4.20`。

现在每天可以自动更新了，利用 [GitHub Actions Workflows](https://github.com/actions/starter-workflows) 通过定时器，每天 `00:00` (北京时间早上8:00) 触发 GitHub 的工作流，自动爬数据，将生成的 web 页面提交到 `gh-pages` 分支，并且自动发布 [npm](https://www.npmjs.com/package/@wcj/github-rank) 版本.

## 获取数据

```bash
# 获取 Github (中国/全球)用户排行榜(Top 500)
npm run get

# Github 用户获取中途失败，接着获取剩余用户信息
npm run get:users:info

# 获取 Github 趋势榜，Github 仓库排行(Top 500), sifou，36kr，toutiao 的数据
npm run get:o
```
