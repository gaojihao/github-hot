import FS from 'fs-extra';
import path from 'path';
import ejs from 'ejs';

const rootPath: string = path.join(__dirname, 'html');

const SHANGHAI = 'Asia/Shanghai';

export function formatDateTimeZh(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (!d.getTime() || Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const m: Record<string, string> = {};
  parts.forEach((p) => { m[p.type] = p.value; });
  return `${m.year}年${m.month}月${m.day}日 ${m.hour}:${m.minute}`;
}

export function formatDateZh(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (!d.getTime() || Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const m: Record<string, string> = {};
  parts.forEach((p) => { m[p.type] = p.value; });
  return `${m.year}年${m.month}月${m.day}日`;
}

const dateStr: string = formatDateTimeZh(new Date());

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

export interface IDateRange {
  current: 'daily' | 'weekly' | 'monthly';
  daily: string;
  weekly: string;
  monthly: string;
}

export interface IListPageOptions {
  title: string;
  tabId: string;
  items: IListItem[];
  dateRange?: IDateRange;
}

export function creatListHTML(opts: IListPageOptions): string {
  const filename: string = path.join(rootPath, 'list.ejs');
  const tmpStr: string = FS.readFileSync(filename).toString();
  return ejs.render(tmpStr, { ...opts, date: dateStr }, { filename });
}
