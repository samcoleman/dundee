import { type settings } from "server/api/routers/settings";
import { type Message as Message } from "server/api/routers/treeofalpha";
import { type source } from "./const";

const parseSymbolKeywords = (text: string, settings: settings) => {
  const symbols : string[] = [];
  settings.symbol_keys.forEach((keywords, symbol) => {
    if (keywords.some(key => text.toUpperCase().includes(key))) {
      symbols.push(symbol)
    }})
  return symbols
}

const filterSymbols = (symbolText: string[], settings: settings) => {
  return symbolText.filter(sym => settings.symbols.has(sym))
}

const filter = (text: string, source: source, filter: Map<source, string[]>) => {
  const keywords = filter.get(source);
  if (!keywords) {
    return false
  }
  return keywords.some(key => text.toUpperCase().includes(key))
}


export const parseMessage = (message: Message, settings: settings) => {
  let symbols = message.symbols
  if (!symbols || symbols.length === 0) {
    symbols = parseSymbolKeywords(message.title+message.body, settings)
  }
  
  return {
    symbols: filterSymbols(symbols, settings),
    pos_filter:  filter(message.title+message.body, message.source, settings.pos_filter),
    neg_filter:  filter(message.title+message.body, message.source, settings.neg_filter),
  }
}
