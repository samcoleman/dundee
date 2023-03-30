import Head from 'next/head';
import { useEffect, useState } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { IoIosArrowBack } from 'react-icons/io';
import { api } from 'utils/api';

type source = {
  link: string;
  symbols?: string[];
  price?: number[];
};

type direct = {
  body: string;
  icon: string;
  link: string;
  image?: string;
};

type pageData = {
  symbol: string;
  source: 'SOURCE' | 'DIRECT' | 'UNKNOWN';
  title: string;
  time: number;
  payload_source?: source | undefined;
  payload_direct?: direct | undefined;
  unknown_payload?: string;
};

const DashPage = () => {
  const order = api.binance.order.useMutation()
  const makeOrder = async () => {
    const res = await order.mutateAsync({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    })
    console.log(res)
  }

  const [pageData, setPageData] = useState<pageData>({
    symbol: 'XXXX',
    source: 'UNKNOWN',
    title: '',
    time: 0,
  });
  const [inputSymbol, setInputSymbol] = useState('usdt');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    const source = urlParams.get('source');
    const title = urlParams.get('title');
    const time = urlParams.get('time');
    const payload = urlParams.get('payload');

    let payloadObj: source | direct | undefined;
    try {
      if (payload) {
        payloadObj = JSON.parse(decodeURIComponent(payload)) as source | direct;
      }
    } catch (err) {
      console.log(err);
    }

    if (source && title && time) {
      setPageData({
        symbol: symbol ? decodeURIComponent(symbol) : 'XXXX',
        source: source as 'SOURCE' | 'DIRECT' | 'UNKNOWN',
        title: decodeURIComponent(title),
        payload_source:
          source === 'SOURCE' && payloadObj
            ? (payloadObj as source)
            : undefined,
        payload_direct:
          source === 'DIRECT' && payloadObj
            ? (payloadObj as direct)
            : undefined,
        unknown_payload: source === 'UNKNOWN' && payload ? payload : undefined,
        time: parseInt(decodeURIComponent(time)),
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>{pageData.symbol.toUpperCase()}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen bg-slate-900 p-5 gap-5 ">
        <div className="flex flex-row gap-5 text-white">
          <div className="flex flex-col flex-1 bg-white/5 rounded-md p-5 gap-2">
            <div className="flex flex-row gap-10">
              <button className="flex justify-center h-full aspect-square text-2xl  p-2 items-center rounded-md hover:bg-white/5">
                <IoIosArrowBack />
              </button>
              <div className="flex-1" />
              <h1 className="flex text-2xl">
                {new Date(pageData.time).toISOString()}
              </h1>
              <h1 className="flex text-2xl">{pageData.source}</h1>
              <h1 className="flex text-2xl font-bold">
                {pageData.symbol.toUpperCase()} / USDT
              </h1>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <h1 className="flex text-2xl">{pageData.title}</h1>
            {pageData.payload_source ? (
              <div className="flex flex-col gap-2">
                {pageData.payload_source.symbols ? (
                  <div className="flex flex-row gap-5">
                    {pageData.payload_source.symbols.map((symbol, index) => {
                      return (
                        <h1 key={index} className="flex text-2xl font-bold">
                          {symbol} / USDT :{' '}
                          {pageData.payload_blog?.price[index]}{' '}
                        </h1>
                      );
                    })}
                  </div>
                ) : null}
                <a
                  href={pageData.payload_source.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Goto Source
                </a>
              </div>
            ) : pageData.payload_direct ? (
              <div className="flex flex-col gap-2">
                <p className="flex text-lg">{pageData.payload_direct.body}</p>
                <a
                  href={pageData.payload_direct.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Goto Direct
                </a>
              </div>
            ) : (
              <p className="flex text-2xl font-bold">
                {pageData.unknown_payload ? pageData.unknown_payload : null}
              </p>
            )}
          </div>
          <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5">
            <div className="flex flex-row text-4xl font-bold gap-5">
              <button onClick={() => void makeOrder()} className="bg-green-500 hover:bg-green-400 rounded-md w-28 aspect-square">
                5k
              </button>
              <button className="bg-green-500 hover:bg-green-400 rounded-md w-28 aspect-square">
                20k
              </button>
              <button className="bg-green-500 hover:bg-green-400 rounded-md w-28 aspect-square">
                120k
              </button>
              <button className="bg-red-500   hover:bg-red-400   rounded-md w-28 aspect-square">
                5k
              </button>
              <button className="bg-red-500   hover:bg-red-400   rounded-md w-28 aspect-square">
                20k
              </button>
              <button className="bg-red-500   hover:bg-red-400   rounded-md w-28 aspect-square">
                120k
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-row text-4xl font-bold gap-5 ">
              <button
                className="flex items-center px-5 hover:bg-white/5 rounded-md"
                onClick={() => {
                  if (inputSymbol !== 'usdt') {
                    setInputSymbol('usdt');
                  } else {
                    setInputSymbol(pageData.symbol);
                  }
                }}
              >
                {inputSymbol.toUpperCase()}
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
            <button className="flex bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-4xl font-bold">
              Sell All
            </button>
          </div>
        </div>
        <AdvancedRealTimeChart symbol="btcusdt" theme="dark" autosize />
      </div>
    </>
  );
};

export default DashPage;
