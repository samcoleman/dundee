// source: "Blog" / source: "Binance EN" / source: "Upbit" / source: "usGov"

import { type checkMessage } from "./messageParse";

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

export type Message = {
  title: string;
  body: string;
  source: source;
  url: string;
  time: number;
  _id: string;
  symbols: string[];
  icon?: string;
  image?: string;
};

export type parsedMessage = {
  message: Message;
  parser: ReturnType<typeof checkMessage>;
};