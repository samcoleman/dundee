"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTitle = exports.parseSource = exports.parseSymbols = exports.checkMessage = void 0;
const parseSymbolKeywords = (text, settings) => {
    const symbols = [];
    settings.symbol_keys.forEach((keywords, symbol) => {
        if (keywords.some(key => text.toUpperCase().includes(key))) {
            symbols.push(symbol);
        }
    });
    return symbols;
};
const filterSymbols = (symbolText, settings) => {
    return symbolText.filter(sym => settings.symbols.has(sym));
};
const filter = (text, source, filter) => {
    const keywords = filter.get(source);
    if (!keywords) {
        return false;
    }
    return keywords.some(key => text.toUpperCase().includes(key));
};
const checkMessage = (message, settings) => {
    let symbols = message.symbols;
    if (!symbols || symbols.length === 0) {
        symbols = parseSymbolKeywords(message.title + message.body, settings);
    }
    return {
        symbols: filterSymbols(symbols, settings),
        pos_filter: filter(message.title + message.body, message.source, settings.notifications.pos_filter),
        neg_filter: !filter(message.title + message.body, message.source, settings.notifications.neg_filter),
    };
};
exports.checkMessage = checkMessage;
const parseSymbols = (symbols) => {
    // Remove all symbols not containing USDT
    symbols = symbols.filter((symbol) => {
        return symbol.indexOf('USDT') > 0;
    });
    // Remove _ from symbol
    symbols = symbols.map((symbol) => symbol.replace('_', ''));
    // Remove duplicates
    return [...new Set(symbols)];
};
exports.parseSymbols = parseSymbols;
const parseSource = (source) => {
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
exports.parseSource = parseSource;
const parseTitle = (title) => {
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
exports.parseTitle = parseTitle;
