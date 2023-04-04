import Head from 'next/head';
import { useEffect, useState } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { api } from 'utils/api';
import { type pageData } from 'server/wssServer';
import { Update } from 'server/api/routers/treeofalpha';

import dynamic from 'next/dynamic';
import SymbolPicker from 'components/symbolPicker';
import { GoSearch } from 'react-icons/go';
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
  checked: boolean;
};

const DashPage = () => {
  //trpc query for treeofaplha
  const { data: treeOfAlphaData } = api.tree.getUpdates.useQuery();

  const { data: settings, refetch: settingsRefetch } =
    api.settings.getSettings.useQuery();

  const [parsedUpdates, setParsedUpdates] = useState<parsedUpdates[]>([]);


  useEffect(() => {
    setParsedUpdates(
      treeOfAlphaData?.map((update) => {
        return {
          update: update,
          symbol: '',
          filtered: false,
          checked: false,
        };
      }) || [],
    );
  }, [treeOfAlphaData]);

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

  const [selectedSymbol, setSelectedSymbol] = useState('');

  const [pageData, setPageData] = useState<pageData | undefined>(undefined);

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

    if (data.source === 'BLOG') {
      data['payload_blog'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_blog') || ''),
      ) as pageData['payload_blog'];
    } else if (data.source === 'TWITTER') {
      data['payload_twitter'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_twitter') || ''),
      ) as pageData['payload_twitter'];
    } else if (data.source === 'TELEGRAM') {
      data['payload_telegram'] = JSON.parse(
        decodeURIComponent(urlParams.get('payload_telegram') || ''),
      ) as pageData['payload_telegram'];
    } else if (data.source === 'UNKNOWN') {
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
        <title>{selectedSymbol.toUpperCase()}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen max-h-full bg-slate-900 p-5 gap-5 text-white overflow-clip">
        <div className="flex flex-row gap-5">
          <div className="flex w-3/5 flex-col bg-white/5 rounded-md p-5 gap-1">
            <div className="flex flex-row gap-5">
              <p className="w-1/12 pl-2">Type</p>
              <p className="w-1/12">Symbol</p>
              <p className="w-2/3">Title</p>
              <p className="w-1/12">Filters</p>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-col overflow-y-auto h-64 clip">
              {treeOfAlphaData?.map((item, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setPageData({
                        ...item,
                        symbol: 'BTC',
                        source: item.source,
                        link: item.url,
                      });
                    }}
                    className={`flex text-start flex-row gap-5 py-0.5 my-0.5 rounded-md hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-white ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <p className="w-1/12 min-w-max pl-2 overflow-hidden">
                      {item.source?.toUpperCase()}
                    </p>
                    <p className="w-1/12 overflow-clip">BTCUSDT</p>
                    <p className="flex-1 overflow-hidden break-all">
                      {item.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-2/5 flex flex-col justify-between bg-white/5 rounded-md p-5 gap-5">
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
            <div className="flex flex-row text-xl font-bold gap-5 items-center">
              <SymbolPicker symbols={settings?.symbols} selectedSymbol={selectedSymbol} setSymbol={setSelectedSymbol} />
              <input
                className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-5 p-2 text-right"
                size={1}
              />
              <button className="flex bg-green-500 hover:bg-green-400 rounded-md text-2xl px-4 p-2">
                Buy
              </button>
              <button className="flex bg-red-500   hover:bg-red-400   rounded-md text-2xl px-4 p-2">
                Sell
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className='flex flex-row gap-5'>
            <button className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
              Close 33%
            </button>
            <button className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
              Close 50%
            </button>
            <button className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
              Close 100%
            </button>
            </div>
        
          </div>
        </div>
        <div className="flex flex-1 flex-row gap-5">
          <div className="w-3/5">
            {selectedSymbol !== '' ? (
              <AdvancedRealTimeChart
                symbol={selectedSymbol}
                theme="dark"
                autosize={true}
              />
            ) : (
              <div className="flex flex-col h-full justify-center items-center bg-white/5 rounded-md">
                <h1 className="text-2xl">Symbol Not Selected</h1>
              </div>
            )}
          </div>
          <div className="w-2/5 flex flex-col flex-auto bg-white/5 rounded-md p-5 gap-2 min-h-0">
            {pageData ? (
              <>
                <div className="flex flex-row gap-10 py-2 items-center">
                  <div className="flex-1" />
                  <h1 className="flex text-lg">
                    {pageData.time !== 0
                      ? new Date(pageData.time).toISOString()
                      : null}
                  </h1>

                  {pageData.source?.toUpperCase()}
                </div>
                <div className="h-0.5 bg-white rounded-full" />
                <h1 className="flex flex-1 text-xl break-all overflow-y-auto min-h-0 ">
                  {pageData.title}
                </h1>
                <div className="h-0.5 bg-white rounded-full" />
                <a
                  href={pageData.link}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="flex flex-row justify-end items-center text-lg gap-5 hover:bg-white/5 py-1 rounded-md"
                >
                  Link <IoIosArrowForward />
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashPage;
