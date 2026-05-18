import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { resolve as resolveUrl } from 'url';

export interface ITrendingData {
  full_name: string;
  language: string;
  color: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forked: string;
  rank: number;
  todayStar: string;
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function parseCount(s: string): string {
  return s.replace(/[\s,]/g, '');
}

export function getTrendingData(type: string = 'daily') {
  const apiUrl = `https://github.com/trending?since=${type}`;
  return fetch(apiUrl)
    .then(res => res.buffer())
    .then((data) => {
      const resultData: ITrendingData[] = [];
      const html = data.toString();
      const $ = cheerio.load(html);
      $('article.Box-row').each(function(idx, item) {
        const titleLink = $(item).find('h1 a, h2 a').first();
        const href = (titleLink.attr('href') || '').trim();
        if (!href) return;
        const fullName = cleanText(titleLink.text()).replace(/\s*\/\s*/, '/');

        const language = cleanText($(item).find('span[itemprop=programmingLanguage]').text());
        const colorEl = $(item).find('span.repo-language-color');
        let color = '';
        if (language && colorEl && colorEl.attr('style')) {
          const m = (colorEl.attr('style') || '').match(/background-color:\s*([^;]+)/);
          if (m) color = m[1].trim();
        }

        const description = cleanText($(item).find('p').first().text());

        const starsText = $(item).find('a[href$="/stargazers"]').first().text();
        const stargazersCount = parseInt(parseCount(starsText), 10) || 0;

        const forksText = $(item).find('a[href$="/forks"]').first().text();
        const forked = parseCount(forksText) || '-';

        const todayStar = cleanText($(item).find('span.float-sm-right').text()).replace(/,/g, '');

        resultData.push({
          full_name: fullName,
          language,
          color,
          description,
          forked,
          stargazers_count: stargazersCount,
          todayStar,
          html_url: resolveUrl(apiUrl, href),
          rank: idx + 1,
        });
      });
      return resultData;
    });
}
