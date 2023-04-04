import Head from 'next/head';
import { useEffect, useState } from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import { api } from 'utils/api';
import { type pageData } from 'server/wssServer';
import { Update } from 'server/api/routers/treeofalpha';

import dynamic from 'next/dynamic';
const AdvancedRealTimeChart = dynamic(
  () =>
    import('react-ts-tradingview-widgets').then((w) => w.AdvancedRealTimeChart),
  { ssr: false },
);

const quoteSymbol = 'USDT';

type parsedUpdates = {
  update: Update;
  symbol: string;
  filtered: boolean;
  checked:  boolean;
}

const DashPage = () => {
  //trpc query for treeofaplha
  const { data: treeOfAlphaData } = api.tree.getUpdates.useQuery();

  const [parsedUpdates, setParsedUpdates] = useState<parsedUpdates[]>([]);

  useEffect (() => {
    setParsedUpdates(treeOfAlphaData?.map((update) => {
      return {
        update:   update,
        symbol:   '',
        filtered: false,
        checked:  false,
      }
    }) || []);
 },[treeOfAlphaData]);

  const order = api.binance.order.useMutation();
  const makeOrder = async () => {
    const res = await order.mutateAsync({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: 10,
    });
    console.log(res);
  };

  const [pageData, setPageData] = useState<pageData>({
    symbol: 'XXXX',
    source: 'UNKNOWN',
    title: '',
    link: '',
    time: 0,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    const source = urlParams.get('source');
    const title = urlParams.get('title');
    const time = urlParams.get('time');
    const link = urlParams.get('link');

    const data: pageData = {
      symbol: symbol ? decodeURIComponent(symbol) : 'XXXX',
      source: source as pageData['source'],
      title: title ? decodeURIComponent(title) : '',
      link: link ? decodeURIComponent(link) : '',
      time: time ? parseInt(decodeURIComponent(time)) : 0,
    };

    if (pageData.source === 'BLOG') {
      data['payload_blog'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_blog') || ''),
      ) as pageData['payload_blog'];
    } else if (pageData.source === 'TWITTER') {
      data['payload_twitter'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_twitter') || ''),
      ) as pageData['payload_twitter'];
    } else if (pageData.source === 'TELEGRAM') {
      data['payload_telegram'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_telegram') || ''),
      ) as pageData['payload_telegram'];
    } else if (pageData.source === 'UNKNOWN') {
    }

    setPageData(data);
  }, []);

  /*
    <Link href="/" className="flex justify-center h-full aspect-square text-2xl  p-2 items-center rounded-md hover:bg-white/5" >
                <IoIosArrowBack />
              </Link>
  */

  return (
    <>
      <Head>
        <title>{pageData.symbol.toUpperCase()}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen bg-slate-900 p-5 gap-5 text-white">
        <div className="flex flex-row gap-5">
          <div className="w-3/5 flex-col bg-white/5 rounded-md p-5">
            <div className="flex flex-row gap-5"></div>
            <div className="flex flex-row gap-5">
              <p className="w-1/12 min-w-max">Type</p>
              <p className="w-3/4">Title</p>
              <p className="w-1/12">Filter</p>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-col overflow-y-auto h-64">
              {treeOfAlphaData?.map((item, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setPageData({...item, symbol: "BTC", source: item.source});
                    }}
                    className={`flex w-full text-start flex-row gap-5 my-1 rounded-md ${
                      index % 2 === 0
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <p className="w-1/12 min-w-max pl-2 overflow-clip">
                      {item.source}
                    </p>
                    <p className="w-full overflow-clip">{item.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-2/5 flex flex-col bg-white/5 rounded-md p-5 gap-5">
            <div className="flex flex-row text-2xl font-bold gap-5">
              <button
                onClick={() => void makeOrder()}
                className="bg-green-500 hover:bg-green-400 rounded-md w-1/6 aspect-square"
              >
                5k
              </button>
              <button className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                20k
              </button>
              <button className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                120k
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                5k
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                20k
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                120k
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-row text-2xl font-bold gap-5 ">
              <button className="flex items-center px-5 hover:bg-white/5 rounded-md">
                {quoteSymbol}
              </button>
              <input
                className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-5 text-right"
                size={1}
              />
              <button className="flex bg-green-500 hover:bg-green-400 rounded-md py-2 px-10">
                Buy
              </button>
              <button className="flex bg-red-500   hover:bg-red-400   rounded-md py-2 px-10">
                Sell
              </button>
            </div>
            <button className="flex bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
              Sell All
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-row gap-5">
          <div className="w-3/5">
            <AdvancedRealTimeChart
              symbol="BTCUSDT"
              theme="dark"
              autosize={true}
            />
          </div>
          <div className="w-2/5 flex-col flex-auto bg-white/5 rounded-md p-5 gap-2">
            <div className="flex flex-row gap-10">
              <div className="flex-1" />
              <h1 className="flex text-lg">
                {pageData.time === 0
                  ? null
                  : new Date(pageData.time).toLocaleTimeString()}
              </h1>
              <a
                href={pageData.link}
                rel="noopener noreferrer"
                target="_blank"
                className="flex text-2xl hover:bg-white/5 rouinded-md px-2"
              >
                {pageData.source}
              </a>
              <h1 className="flex text-2xl font-bold">
                {pageData.symbol.toUpperCase()}
              </h1>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <h1 className="flex text-2xl">{pageData.title}</h1>
            {pageData.payload_blog ? (
              <div className="flex flex-col gap-2">
                {pageData.payload_blog.symbols ? (
                  <div className="flex flex-row gap-5">
                    {pageData.payload_blog.symbols.map((symbol, index) => {
                      return (
                        <h1 key={index} className="flex text-2xl font-bold">
                          {symbol}USDT : {pageData.payload_blog?.prices[index]}{' '}
                        </h1>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : pageData.payload_twitter ? (
              <div className="flex flex-col gap-2">
                <p className="flex text-lg">{pageData.payload_twitter.body}</p>
              </div>
            ) : (
              <p className="flex text-2xl font-bold">
                {pageData.payload_unknown ? pageData.payload_unknown : null}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashPage;
