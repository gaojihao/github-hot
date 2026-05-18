GitHub Trending 趋势榜（日 / 周 / 月），[预览页面](https://gaojihao.github.io/github-hot/)。

- [Github Trending 日榜](https://gaojihao.github.io/github-hot/trending.html)
- [Github Trending 周榜](https://gaojihao.github.io/github-hot/trending-weekly.html)
- [Github Trending 月榜](https://gaojihao.github.io/github-hot/trending-monthly.html)

每天通过 [GitHub Actions](https://github.com/actions/starter-workflows) 定时触发（北京时间 08:30 / 20:30），抓取 GitHub Trending 数据并将生成的静态页面发布到 `gh-pages` 分支。

## 本地运行

```bash
# 安装依赖
npm install

# 抓取 GitHub Trending 数据（日 / 周 / 月）
npm run get:trending

# 根据 dist/trending-*.json 生成 web/*.html
npm start
```
