import { type settings, type sym } from "server/api/routers/settings";
import { type Message as Message } from "server/api/routers/treeofalpha";

const parseSymbolKeywords = (text: string) => {
  const symbols : string[] = [];
  return symbols
}

const filterSymbols = (symbolText: string[], symbols: sym[]) => {
  return symbols.filter(symbol => {
    return symbolText.includes(symbol.symbol)
  })
}

const containsNegKeyword = (text: string, neg_keywords: string[]) => {
  return neg_keywords.some(neg_key => text.includes(neg_key))
}

const filterMessage = (text: string, settings: settings) => {
  const correctSource = settings.feeds.includes(message.source);

  if (!correctSource) {
    return false
  }

  
  const neg_keyword = containsNegKeyword(text, settings.negativeKeywords)
  return false
}


export const parseMessage = (message: Message, settings: settings) => {
  let symbolText = message.symbols
  if (!symbolText) {
    symbolText = parseSymbolKeywords(message.body)
  }
  
  return {
    symbols: filterSymbols(symbolText, settings.symbols),
    filter:  filterMessage(message.body, settings),
  }
}
