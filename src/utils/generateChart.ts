import { type Kline } from "binance";
import ImageCharts from "image-charts";


const generateChart = (symbol: string, data: Kline[]) => {
  const prices = data.map((d) => d[4]) as number[];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  
  const first = prices[0];
  const last = prices[prices.length - 1];

  const delta = last && first ? last - first : undefined
  const deltaPercent = delta && last ? (delta * 100) / last : undefined

  return new ImageCharts()
    .cht('ls')
    .chm('B,76A4FB,0,0,0')
    .chco('76A4FB')
    .chd('a:' + prices.join(','))
    .chxr(`0,${min - (max - min) * 0.05},${max}`)
    .chtt(
      `${symbol} ${last || "???"}: Δ ${delta?.toPrecision(
        5,
      ) || "???"} / ${deltaPercent?.toFixed(2) || "???"}% | ${data.length}m`,
    )
    .chts('ffffff,20,l')
    .chf('bg,s,10172A')
    .chdlp('t')
    .chs('800x400')
    .toURL();
}
export default generateChart
