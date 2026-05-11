import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

// 基础数据
const engines = [
  'Webkit',
  'Gecko',
  'Trident',
  'Presto',
  'Misc',
  'Tasman',
  'Other browsers',
];

const browsers = [
  'Chrome',
  'Firefox',
  'Internet Explorer',
  'Opera',
  'Safari',
  'IE Mobile',
  'PSP browser',
  'Lynx',
  'Links',
  'Dillo 0.8',
  'NetFront 3.4',
  'NetFront 3.1',
  'All others',
];

const platforms = [
  'Win',
  'Mac',
  'Linux',
  'iPhone/Mobile',
  'Android',
  'Windows Mobile 6',
  'Windows Mobile',
  'PSP',
  'Embedded devices',
  'Text only',
  'Mac OS 8-X',
  'Mac OS 7.6-9',
  '-',
];

const grades = ['A', 'B', 'C', 'U', 'X'];

// 生成随机字符串
const generateRandomString = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 生成单条数据
const generateRow = (id: number) => {
  const engine = engines[Math.floor(Math.random() * engines.length)];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  const grade = grades[Math.floor(Math.random() * grades.length)];

  return {
    engine: `${engine} - ${generateRandomString()}`,
    browser,
    platform,
    version: Math.random() > 0.5 ? `${Math.floor(Math.random() * 10)}` : '-',
    grade,
    id,
  };
};

async function getSample(req: Request, res: Response) {
  const { orderBy = 'id', orderDir = 'desc', perPage = '10', waitSeconds = '0' } = req.query;

  const perPageNum = parseInt(perPage as string, 10);
  const waitSecondsNum = parseInt(waitSeconds as string, 10);

  // 模拟延迟
  if (waitSecondsNum > 0) {
    await waitTime(waitSecondsNum * 1000);
  }

  // 总数据量
  const totalCount = 1710;

  // 生成数据
  const rows = [];
  const startId = orderDir === 'desc' ? totalCount : 1;

  for (let i = 0; i < perPageNum; i++) {
    const id = orderDir === 'desc' ? startId - i : startId + i;
    if (id > 0 && id <= totalCount) {
      rows.push(generateRow(id));
    }
  }

  // 排序
  if (orderBy) {
    rows.sort((a: any, b: any) => {
      const aValue = a[orderBy as string];
      const bValue = b[orderBy as string];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return orderDir === 'desc' ? bValue - aValue : aValue - bValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return orderDir === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });
  }

  return res.json({
    count: totalCount,
    rows,
  });
}

export default {
  'GET /api/mock2/sample': getSample,
};
