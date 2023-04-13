import { type settings } from './types';
import { type source, type Message } from './types';

const parseSymbolKeywords = (text: string, settings: settings) => {
  const symbols: string[] = [];
  settings.symbol_keys.forEach((keywords, symbol) => {
    if (keywords.some((key) => text.toUpperCase().includes(key))) {
      symbols.push(symbol);
    }
  });
  return symbols;
};

const filterSymbols = (symbolText: string[], settings: settings) => {
  return symbolText.filter((sym) => settings.symbols.has(sym));
};

const filter = (
  text: string,
  source: source,
  filter: Map<source, string[]>,
) => {
  const keywords = filter.get(source);
  if (!keywords) {
    return false;
  }
  return keywords.some((key) => text.toUpperCase().includes(key));
};

export const checkMessage = (message: Message, settings: settings) => {
  let symbols = message.symbols;
  if (!symbols || symbols.length === 0) {
    symbols = parseSymbolKeywords(message.title + message.body, settings);
  }

  let symbol_filter = true;
  switch (settings.notifications.symbol) {
    case 'MATCH_LOOKUP':
      symbol_filter = filterSymbols(symbols, settings).length > 0;
      break;
    case 'ANY_MATCH':
      symbol_filter = symbols.length > 0;
      break;
    case 'NO_MATCH':
      symbol_filter = true;
      break;
  }

  const pos_filter = filter(
    message.title + message.body,
    message.source,
    settings.notifications.pos_filter,
  );
  const neg_filter = !filter(
    message.title + message.body,
    message.source,
    settings.notifications.neg_filter,
  );
  const source_filter = settings.notifications.sources.includes(message.source);

  return {
    symbols: symbols,
    symbol_filtered: filterSymbols(symbols, settings),
    pos_filter: pos_filter,
    neg_filter: neg_filter,
    source_filter: source_filter,
    pass_settings: symbol_filter && source_filter && (settings.notifications.pass_pos_filter ? pos_filter : true) && (settings.notifications.pass_neg_filter ? neg_filter : true)
  };
};

export const parseSymbols = (symbols: string[]) => {
  // Remove all symbols not containing USDT
  symbols = symbols.filter((symbol) => {
    return symbol.indexOf('USDT') > 0;
  });
  // Remove _ from symbol
  symbols = symbols.map((symbol) => symbol.replace('_', ''));

  // Remove duplicates
  return [...new Set(symbols)] as string[];
};

export const parseSource = (source: string): source => {
  switch (source.toUpperCase()) {
    case 'BINANCE EN':
      return 'BINANCE';
      break;
    case 'UPBIT':
      return 'UPBIT';
      break;
    case 'USGOV':
      return 'USGOV';
      break;
    case 'BLOGS':
      return 'BLOG';
      break;
    case 'BLOG':
      return 'BLOG';
      break;
    case 'DIRECT':
      return 'TWITTER';
      break;
    case 'TWITTER':
      return 'TWITTER';
      break;
    case 'TELEGRAM':
      return 'TELEGRAM';
      break;
    default:
      return 'UNKNOWN';
      break;
  }
};

export const parseTitle = (title: string) => {
  const titleIndex = title.indexOf(':');
  let titleText = title;
  let bodyText = '';

  if (titleIndex > 0) {
    titleText = title.slice(0, titleIndex);
    bodyText = title.slice(titleIndex + 1, title.length + 1);
  }

  return {
    title: titleText,
    body: bodyText,
  };
};
