"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_charts_1 = __importDefault(require("image-charts"));
const generateChart = (data, symbol) => {
    const prices = data.map((d) => d.p);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const delta = prices[prices.length - 1] - prices[0];
    const deltaPercent = (delta * 100) / prices[prices.length - 1];
    return new image_charts_1.default()
        .cht('ls')
        .chm('B,76A4FB,0,0,0')
        .chco('76A4FB')
        .chd('a:' + prices.join(','))
        .chxr(`0,${min - (max - min) * 0.05},${max}`)
        .chtt(`BTCUSDT ${prices[prices.length - 1]}: Δ ${delta.toFixed(2)} / ${deltaPercent.toFixed(2)}%`)
        .chts('ffffff,20,l')
        .chf('bg,s,10172A')
        .chdlp('t')
        .chs('800x400')
        .toURL();
};
exports.default = generateChart;
