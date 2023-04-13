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
  symbols: string[];
  pos_filter: boolean;
  neg_filter: boolean;
};

export type sym = {
  future_id: string;
  status: status;
  active: boolean;
};

export type settings = {
  notifications: {
    adv_notifications: boolean;

    sources: source[];
    pass_pos_filter: boolean;
    pos_filter: Map<source, string[]>;
    pass_neg_filter: boolean;
    neg_filter: Map<source, string[]>;

    symbol: 'MATCH_LOOKUP' | 'ANY_MATCH' | 'NO_MATCH';
    actions: {
      B_1: number;
      S_1: number;
    };
  };
  dash: {
    actions: {
      B_1: number;
      B_2: number;
      B_3: number;
      S_1: number;
      S_2: number;
      S_3: number;
    };
  };

  symbol_keys: Map<string, string[]>;
  symbols: Map<string, sym>;
};