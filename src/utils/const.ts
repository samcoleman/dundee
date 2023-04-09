// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"
//export type feeds = 'BLOG' | "BINANCE" | "UPBIT" | "USGOV" | 'TWITTER' | 'TELEGRAM' | 'UNKNOWN';
export const sourceObj = [
  'BLOG',
  'BINANCE',
  'UPBIT',
  'USGOV',
  'TWITTER',
  'TELEGRAM',
  'UNKNOWN',
] as const;
export type source = (typeof sourceObj)[number];

export const statusObj = ['TRADING', 'DOWN', 'NOT_FOUND', 'UNKNOWN'] as const;
export type status = (typeof statusObj)[number];