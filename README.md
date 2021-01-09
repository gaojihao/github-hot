Github 中国用户排名，全球仓库 Star 最多排名，通过 Github API v3 来生成页面数据，[排行榜预览](https://gaojihao.github.io/github-hot/)，最近还添加了 [SegmentFault 思否近期热门](https://gaojihao.github.io/github-hot/sifou-daily.html)、[开发者头条最近热门分享](https://gaojihao.github.io/github-hot/toutiao-7.html)、[36Kr 快讯预览](https://gaojihao.github.io/github-hot/36kr.html)。

- [Github **全球** 用户 Followers 排名预览](https://gaojihao.github.io/github-hot)
- [Github **中国** 用户 Followers 排名预览](https://gaojihao.github.io/github-hot/users.china.html)
- [Github 全球仓库 Star 最多排名预览](https://gaojihao.github.io/github-hot/repos.html)
- [Github 社区趋势榜日、周、月预览](https://gaojihao.github.io/github-hot/trending.html) [**`日`**](https://gaojihao.github.io/github-hot/trending.html) [**`周`**](https://gaojihao.github.io/github-hot/trending-weekly.html) [**`月`**](https://gaojihao.github.io/github-hot/trending-monthly.html)
- [SegmentFault 思否 - 近期热门](https://gaojihao.github.io/github-hot/sifou-daily.html) [**`日`**](https://gaojihao.github.io/github-hot/sifou-daily.html) [**`周`**](https://silver-blue-space.github.io/github-rank/sifou-weekly.html) [**`月`**](https://gaojihao.github.io/github-hot/sifou-monthly.html)
- [开发者头条 - 最近热门分享](https://gaojihao.github.io/github-hot/toutiao-7.html) [**`7天`**](https://gaojihao.github.io/github-hot/toutiao-7.html) [**`30天`**](https://gaojihao.github.io/github-hot/toutiao-30.html) [**`90天`**](https://gaojihao.github.io/github-hot/toutiao-90.html)
- [36Kr - 快讯预览](https://gaojihao.github.io/github-hot/36kr.html)

现在每天可以自动更新了，利用 [GitHub Actions Workflows](https://github.com/actions/starter-workflows) 通过定时器，每天 `00:00` (北京时间早上8:00) 触发 GitHub 的工作流，自动爬数据，将生成的 web 页面提交到 `gh-pages` 分支.

## 获取数据

```bash
# 获取 Github (中国/全球)用户排行榜(Top 500)
npm run get

# Github 用户获取中途失败，接着获取剩余用户信息
npm run get:users:info

# 获取 Github 趋势榜，Github 仓库排行(Top 500), sifou，36kr，toutiao 的数据
npm run get:o
```
