"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_charts_1 = __importDefault(require("image-charts"));
const generateChart = (symbol, data) => {
    const prices = data.map((d) => d[4]);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const first = prices[0];
    console.log(first);
    const last = prices[prices.length - 1];
    console.log(last);
    const delta = last && first ? last - first : undefined;
    const deltaPercent = delta && last ? (delta * 100) / last : undefined;
    return new image_charts_1.default()
        .cht('ls')
        .chm('B,76A4FB,0,0,0')
        .chco('76A4FB')
        .chd('a:' + prices.join(','))
        .chxr(`0,${min - (max - min) * 0.05},${max}`)
        .chtt(`${symbol} ${last || "???"}: Δ ${(delta === null || delta === void 0 ? void 0 : delta.toPrecision(5)) || "???"} / ${(deltaPercent === null || deltaPercent === void 0 ? void 0 : deltaPercent.toFixed(2)) || "???"}% | ${data.length}m`)
        .chts('ffffff,20,l')
        .chf('bg,s,10172A')
        .chdlp('t')
        .chs('800x400')
        .toURL();
};
exports.default = generateChart;
