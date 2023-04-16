import { AggregateFuturesTrade } from "binance";
import ImageCharts from "image-charts";


const generateChart = (data: AggregateFuturesTrade[], symbol: string) => {
  const prices = data.map((d) => d.p) as number[];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  
  const delta = prices[prices.length - 1] - prices[0];
  const deltaPercent = (delta * 100) / prices[prices.length - 1];

  return new ImageCharts()
    .cht('ls')
    .chm('B,76A4FB,0,0,0')
    .chco('76A4FB')
    .chd('a:' + prices.join(','))
    .chxr(`0,${min - (max - min) * 0.05},${max}`)
    .chtt(
      `BTCUSDT ${prices[prices.length - 1]}: Δ ${delta.toFixed(
        2,
      )} / ${deltaPercent.toFixed(2)}%`,
    )
    .chts('ffffff,20,l')
    .chf('bg,s,10172A')
    .chdlp('t')
    .chs('800x400')
    .toURL();
}
export default generateChart
