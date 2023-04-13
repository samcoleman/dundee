import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { IoIosArrowForward } from 'react-icons/io';
import { api } from '../utils/api';
import { type parsedMessage, type Message } from '../shared/types';

import dynamic from 'next/dynamic';
import OptionPicker from '../components/optionPicker';
import { checkMessage } from '../shared/messageParse';
import { settings } from '../shared/types';

import ImageCharts from 'image-charts';

const AdvancedRealTimeChart = dynamic(
  () =>
    import('react-ts-tradingview-widgets').then((w) => w.AdvancedRealTimeChart),
  { ssr: false },
);

const DashPage = () => {
  //trpc query for treeofaplha
  const treeLoaded = useRef<boolean>(false);
  const { data: treeOfAlphaData } = api.tree.getMessages.useQuery(undefined, {
    enabled: !treeLoaded.current,
  });

  const getPriceHistory = api.binance.getPriceHistory.useMutation();

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

  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();

  const [focus, setFocus] = useState<boolean>(false);
  const [useSettingFilter, setUseSettingFilter] = useState<boolean>(true);

  const [pageMessage, setPageMessage] = useState<parsedMessage | undefined>(
    undefined,
  );

  const [parsedMessages, setParsedMessages] = useState<parsedMessage[]>([]);
  const messageMap = useRef<Map<string, parsedMessage>>(
    new Map<string, parsedMessage>(),
  );

  // Dumb but state doesnt update otherwise
  const updateParsedMessages = () => {
    setParsedMessages([...messageMap.current.values()].reverse());
  };

  const [settings, setSettings] = useState<settings | undefined>();
  //subscribe to settings updates
  api.settings.onUpdate.useSubscription(undefined, {
    onData(settingsUpdate) {
      setSettings(settingsUpdate);
    },
    onError(err) {
      console.error('Subscription error:', err);
      // we might have missed a message - invalidate cache
    },
  });

  // Load all data
  useEffect(() => {
    if (!treeOfAlphaData || !settings || treeLoaded.current) return;

    // iterate over treeofalpha in reverse
    for (let i = treeOfAlphaData.length - 1; i >= 0; i--) {
      const message = treeOfAlphaData[i];
      if (!message) continue;

      const parsedMessage = {
        message: message,
        ...checkMessage(message, settings),
      };

      // Do not overwrite as this call has less data
      if (!messageMap.current.has(message._id)) {
        messageMap.current.set(message._id, parsedMessage);
      }
    }
    treeLoaded.current = true;

    updateParsedMessages();
  }, [treeOfAlphaData, settings]);

  // Load settings and service worker
  const getSettings = api.settings.getSettings.useMutation();
  useEffect(() => {
    getSettings
      .mutateAsync()
      .then((s) => {
        setSettings(s);
      })
      .catch((e) => {
        console.log(e);
      });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .then(
          function (registration) {
            console.log(
              'Successfully registered Service Worker (scope: %s)',
              registration.scope,
            );
          },
          function (err) {
            console.warn('Failed to register Service Worker:\n', err);
          },
        )
        .catch((err) => {
          console.warn('Failed to register Service Worker:\n', err);
        });

      navigator.serviceWorker.addEventListener('message', function (event) {
        console.log('client-notification');

        const response = event.data as {
          reply: string | null;
          action: string;
          data: Message;
        };
        console.log(response);
      });
    }
  }, []);

  // On settings change update the map
  useEffect(() => {
    if (!settings) return;

    let count = 0;
    messageMap.current.forEach((value, key) => {
      const newParsedMessage = {
        message: value.message,
        ...checkMessage(value.message, settings),
      };
      messageMap.current.set(key, newParsedMessage);
      if (count === messageMap.current.size - 1) {
        setSelectedSymbol(newParsedMessage.symbols[0]);
        setPageMessage(newParsedMessage);
      }
    });

    updateParsedMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Write function called push show local web notification
  const pushNotification = (message: Message) => {
    if (!settings) return;

    const filter = checkMessage(message, settings);

    if ('Notification' in window) {
      Notification.requestPermission()
        .then(async function (permission) {
          if (permission === 'granted') {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return;

            const data = await getPriceHistory.mutateAsync({
              symbol: 'BTCUSDT',
              startTime: Date.now() - 15 * 1000,
              endTime: Date.now(),
              limit: 100,
            });
            if (!data) return;

            console.log(data);
            const prices = data.map((d) => d.p);

            const max = Math.max(...prices);
            const min = Math.min(...prices);
            console.log(max);

            const delta = prices[prices.length - 1] - prices[0];
            const deltaPercent = (delta * 100) / prices[prices.length - 1];

            const url = new ImageCharts()
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

            console.log(url);

            void reg.showNotification(message.title, {
              body: message.body,
              data: message,
              image: url,
              actions: [
                //
                {
                  action: 'Buy',
                  title: 'Buy',
                  type: 'text',
                } as NotificationAction,
                { action: 'Sell', title: 'Sell' },
              ],
            });
          }
        })
        .catch((err) => {
          console.warn('Failed to register Service Worker:\n', err);
        });
    }
  };

  // Called when a new message is received
  const addMessage = (message: Message) => {
    if (!settings) return;

    console.log('Server Delta:' + (Date.now() - message.time).toString());
    void pushNotification(message);
    const parsedMessage: parsedMessage = {
      message,
      ...checkMessage(message, settings),
    };

    messageMap.current.set(message._id, parsedMessage);

    // Trigger re-render
    updateParsedMessages();
    if (/*!focus && */ parsedMessage.pass_settings) {
      // Set focus
      setPageMessage(parsedMessage);
      setSelectedSymbol(parsedMessage.symbols[0]);
    }
  };

  api.tree.onMessage.useSubscription(undefined, {
    onData(message) {
      addMessage(message);
    },
    onError(err) {
      console.error('Subscription error:', err);
      // we might have missed a message - invalidate cache
    },
  });

  // Weird but stops the chart from re-rendering on ANY state change
  const [advancedRealtimeChart, setChart] = useState<JSX.Element>();

  useEffect(() => {
    const widgetChart = (
      <AdvancedRealTimeChart
        symbol={selectedSymbol}
        theme="dark"
        autosize={true}
      />
    );

    setChart(widgetChart);
  }, [selectedSymbol]);

  /*
    <Link href="/" className="flex justify-center h-full aspect-square text-2xl  p-2 items-center rounded-md hover:bg-white/5" >
                <IoIosArrowBack />
              </Link>
  */

  // Code golf shit to convert number to 1K , 1M etc
  function format(num: number | undefined, dec: number) {
    if (num === undefined) return;
    let x = ('' + num).length;
    const d = Math.pow(10, dec);
    x -= x % 3;
    return Math.round((num * d) / Math.pow(10, x)) / d + ' kMGTPE'[x / 3];
  }

  return (
    <>
      <Head>
        <title>{selectedSymbol ? selectedSymbol.toUpperCase() : 'Dash'}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <button
        onClick={() => {
          if (!pageMessage) return;
          void pushNotification(pageMessage?.message);
        }}
      >
        Notify
      </button>
      <div className="flex flex-col h-screen max-h-full bg-slate-900 p-5 gap-5 text-white overflow-clip">
        <div className="flex flex-row gap-5">
          <div
            onMouseEnter={() => setFocus(false)}
            className="flex w-3/5 flex-col bg-white/5 rounded-md p-5 gap-1"
          >
            <div className="flex flex-row gap-5">
              <p className="w-1/12 pl-2">Source</p>
              <p className="w-2/3">Title</p>
              <div className="w-1/12 flex flex-1 flex-row justify-end px-3 items-center gap-2">
                <input
                  checked={useSettingFilter}
                  onClick={() => {
                    setUseSettingFilter(!useSettingFilter);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  type="checkbox"
                />
                <p>Filter</p>
              </div>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-col overflow-y-auto h-64 clip">
              {parsedMessages
                .filter((message) => {
                  return message.pass_settings || !useSettingFilter;
                })
                .map((item, index) => {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setPageMessage(item);
                        setSelectedSymbol(item.symbols[0]);
                      }}
                      className={`flex text-start flex-row gap-5 py-0.5 my-0.5 rounded-md ${
                        index % 2 === 0 ? 'bg-white/5' : ''
                      } ${
                        pageMessage?.message._id === item.message._id
                          ? 'outline outline-2 outline-offset-[-2px] outline-blue-500'
                          : 'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-white'
                      }`}
                    >
                      <p className="w-1/12 min-w-max pl-2 overflow-hidden">
                        {item.message.source?.toUpperCase()}
                      </p>
                      <div className="flex-1 overflow-hidden break-all">
                        <p>{item.message.title}</p>
                        <p>{item.message.body}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
          <div
            className={`w-2/5 flex flex-col justify-between bg-white/5 rounded-md p-5 gap-5 ${
              focus ? 'outline' : ''
            }`}
          >
            <div className="flex flex-row text-lg font-bold gap-5">
              <button
                onClick={() => void makeOrder()}
                className="bg-green-500 hover:bg-green-400 rounded-md w-1/6 aspect-square"
              >
                {format(settings?.dash.actions.B_1, 4)}
              </button>
              <button className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                {format(settings?.dash.actions.B_2, 4)}
              </button>
              <button className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                {format(settings?.dash.actions.B_3, 4)}
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                {format(settings?.dash.actions.S_1, 4)}
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                {format(settings?.dash.actions.S_2, 4)}
              </button>
              <button className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                {format(settings?.dash.actions.S_3, 4)}
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-row text-xl font-bold gap-5 items-center">
              <OptionPicker
                options={settings ? Array.from(settings.symbols.keys()) : []}
                suggestedOptions={pageMessage?.symbols}
                selectedOption={selectedSymbol}
                setOption={setSelectedSymbol}
              />
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
            <div className="flex flex-row gap-5">
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
          <div className={`w-3/5 rounded-md ${focus ? 'outline' : ''}`}>
            {selectedSymbol ? (
              advancedRealtimeChart
            ) : (
              <div className="flex flex-col h-full justify-center items-center bg-white/5 rounded-md">
                <h1 className="text-2xl">Symbol Not Selected</h1>
              </div>
            )}
          </div>

          <div
            className={`w-2/5 flex flex-col flex-auto bg-white/5 rounded-md p-5 gap-2 min-h-0 ${
              focus ? 'outline' : ''
            }`}
          >
            {pageMessage ? (
              <>
                <div className="h-0.5 bg-white rounded-full" />
                <a
                  href={pageMessage.message.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="flex flex-row justify-between items-center text-lg gap-5 hover:bg-white/5 rounded-md"
                >
                  <div
                    className={`rounded-md px-3 ${
                      pageMessage.source_filter ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {pageMessage.message.source?.toUpperCase()}
                  </div>

                  <div className="flex flex-row items-center gap-1 pr-3">
                    Link <IoIosArrowForward />
                  </div>
                </a>
                <div className="h-0.5 bg-white rounded-full" />
                <div className="flex flex-row gap-3 text-lg flex-wrap">
                  <div
                    className={`px-3 rounded-md ${
                      pageMessage.pos_filter ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    Positive Filter
                  </div>
                  <div
                    className={`px-3 rounded-md ${
                      pageMessage.neg_filter ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    Negative Filter
                  </div>

                  {pageMessage.symbols.length > 0 ? (
                    pageMessage.symbols.map((symbol, index) => {
                      return (
                        <button
                          className={`rounded-md hover:bg-white/5 px-3 ${
                            symbol === selectedSymbol
                              ? 'outline outline-2 outline-offset-[-2px outline-white'
                              : ''
                          }`}
                          key={index}
                          onClick={() => void setSelectedSymbol(symbol)}
                        >
                          {symbol}
                        </button>
                      );
                    })
                  ) : (
                    <p>No Symbols Found</p>
                  )}
                </div>
                <div className="h-0.5 bg-white rounded-full" />
                <h1 className="flex text-xl break-all">
                  {pageMessage.message.title}
                </h1>
                <p className="flex flex-1 text-xl break-all overflow-y-auto min-h-0 ">
                  {pageMessage.message.body}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashPage;
