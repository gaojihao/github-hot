import FS from 'fs-extra';
import path from 'path';
import ejs from 'ejs';

const rootPath: string = path.join(__dirname, 'html');
const dateStr: string = `${new Date().getFullYear()}/${(new Date().getMonth()) + 1}/${new Date().getDate()}`;

export interface ICreateTrendingHTML {
  html_url: string;
  full_name: string;
  language: string;
  stargazers_count: number;
  todayStar: string;
  description: string;
}

export function creatTrendingHTML(trendingData: ICreateTrendingHTML[], type: string = 'daily') {
  const filename: string = path.join(rootPath, 'trending.ejs');
  const tmpStr: string = FS.readFileSync(filename).toString();
  return ejs.render(tmpStr, { title: 'Github Repositories Trending', trending: trendingData, date: dateStr, type }, { filename });
}

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
