import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { IoIosArrowForward } from 'react-icons/io';
import { api } from '../utils/api';
import { type parsedMessage, type Message } from '../shared/types';

import dynamic from 'next/dynamic';
import OptionPicker from '../components/optionPicker';
import { checkMessage } from '../shared/messageParse';
import { type settings } from '../shared/types';

import generateChart from '../utils/generateChart';
import pushNotification from '../utils/pushNotification';
import { formatNumber, isNumeric } from '../utils/formatNumber';
import { type numberInString } from 'binance';

import { TbSettings } from 'react-icons/tb';
import { Store, type iNotification } from 'react-notifications-component';
import Link from 'next/link';



const AdvancedRealTimeChart = dynamic(
  () =>
    import('react-ts-tradingview-widgets').then((w) => w.AdvancedRealTimeChart),
  { ssr: false },
);

const notificationProps : iNotification = {
  insert: 'top',
  container: 'bottom-right',
  slidingEnter: {
    duration: 50,
    timingFunction: 'ease-out',
    delay: 0,
  },
  slidingExit: {
    duration: 50,
    timingFunction: 'ease-out',
    delay: 0,
  },
}

const DashPage = () => {
  //trpc query for treeofaplha
  const treeLoaded = useRef<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();

  const { data: treeOfAlphaData } = api.tree.getMessages.useQuery(undefined, {
    enabled: !treeLoaded.current,
  });

  // Create a map of symbolInfo
  const { data: symbolInfo } = api.binance.getSymbolInfo.useQuery();
  const symbolInfoMap = useRef<
    Map<string, NonNullable<typeof symbolInfo>[number]>
  >(new Map<string, NonNullable<typeof symbolInfo>[number]>());

  useEffect(() => {
    if (!symbolInfo) return;
    symbolInfo.forEach((info) => {
      symbolInfoMap.current.set(info.symbol, info);
    });
  }, [symbolInfo]);

  const { data: positions, refetch: refetchPositions } =
    api.binance.getPositions.useQuery({});
  // Create a map of symbolInfo
  const positionsMap = useRef<
    Map<string, NonNullable<typeof positions>[number]>
  >(new Map<string, NonNullable<typeof positions>[number]>());

  useEffect(() => {
    if (!positions) return;
    positions.forEach((pos) => {
      positionsMap.current.set(pos.symbol, pos);
    });
  }, [positions]);

  const getPriceHistory = api.binance.getPriceHistory.useMutation();
  const order = api.binance.order.useMutation();
  const price = api.binance.getSymbolPrice.useMutation();

  const makeOrder = async (
    side: 'BUY' | 'SELL',
    symbol: string | undefined,
    quote_amount: number | undefined,
  ) => {
    const id = Store.addNotification({
      ...notificationProps,
      title: 'Placing Order',
      message: `${side} ${quote_amount || ''} USDT ${symbol || ''}`,
      type: 'info',
      dismiss: {
        duration: 10000,
      },
    });

    try {
      if (!symbol) {
        throw new Error('Symbol Undefined');
      }
      if (!quote_amount) {
        throw new Error('Quote Amount Undefined');
      }

      const symbolInfo = symbolInfoMap.current.get(symbol);
      if (!symbolInfo || symbolInfo.status !== 'TRADING') {
        throw new Error('Symbol not trading');
      }

      let market: numberInString | undefined =
        positionsMap.current.get(symbol)?.markPrice;

      // If current price isnt stored in positions, get it from api
      if (!market || market == 0) {
        const market_price = await price.mutateAsync({
          symbol: symbol,
        });

        if (Array.isArray(market_price)) {
          throw new Error('Multiple Mark Prices Returned');
        } else {
          market = market_price.markPrice;
        }
      }

      if (!market) {
        throw new Error('Could not find market_price to calc quantity');
      }

      const mp = parseFloat(market as string);
      // Round to correct sf
      const quant =
        Math.round(
          (quote_amount / mp + Number.EPSILON) *
            Math.pow(10, symbolInfo.quantityPrecision),
        ) / Math.pow(10, symbolInfo.quantityPrecision);

      await order.mutateAsync({
        symbol: symbol,
        side: side,
        quantity: quant,
      });

      Store.removeNotification(id);
      Store.addNotification({
        ...notificationProps,
        title: 'New Order Placed',
        message: `${side} ${quote_amount} USDT ${symbol}`,
        type: 'success',
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });

      void refetchPositions();
    } catch (e) {
      Store.removeNotification(id);
      let message = 'UNKNOWN_ERROR';
      if (e instanceof Error) {
        message = e.message;
      }

      Store.addNotification({
        ...notificationProps,
        title: 'New Order Failure',
        message: `${side} ${quote_amount || ''} USDT ${
          symbol || ''
        }: ${message}`,
        type: 'danger',
        dismiss: {
          duration: 10000,
          onScreen: true,
        },
      });
    }
  };

  // proportion is between 0 and 1
  const closePosition = async (
    symbol: string | undefined,
    proportion: number,
  ) => {
    const id = Store.addNotification({
      ...notificationProps,
      title: 'Closing Position',
      message: `Close ${proportion.toLocaleString(undefined, {
        style: 'percent',
        minimumFractionDigits: 0,
      })} ${symbol || ''}`,
      type: 'info',
      dismiss: {
        duration: 10000,
      },
    });

    try {
      if (!symbol) {
        throw new Error('Symbol Undefined');
      }
      if (proportion < 0 || proportion > 1.05) {
        throw new Error('Proportion out of range');
      }

      const symbolInfo = symbolInfoMap.current.get(symbol);
      if (!symbolInfo || symbolInfo.status !== 'TRADING') {
        throw new Error('Symbol not trading');
      }

      const position_amount = positionsMap.current.get(symbol)?.positionAmt;
      if (!position_amount) {
        throw new Error('Could not find postion');
      }

      const pm = parseFloat(position_amount as string);

      const quant =
        Math.round(
          pm * proportion * Math.pow(10, symbolInfo.quantityPrecision),
        ) / Math.pow(10, symbolInfo.quantityPrecision);
      console.log(quant)
      await order.mutateAsync({
        symbol: symbol,
        side: pm > 0 ? 'SELL' : 'BUY',
        quantity: Math.abs(quant),
      });

      Store.removeNotification(id);
      Store.addNotification({
        ...notificationProps,
        title: 'Close Position Placed',
        message: `Close ${proportion.toLocaleString(undefined, {
          style: 'percent',
          minimumFractionDigits: 0,
        })} ${symbol}`,
        type: 'success',
        dismiss: {
          duration: 5000,
          onScreen: true,
        },
      });
      void refetchPositions();
    } catch (e) {
      Store.removeNotification(id);
      let message = 'UNKNOWN_ERROR';
      if (e instanceof Error) {
        message = e.message;
      }

      Store.addNotification({
        ...notificationProps,
        title: 'Close Position Failure',
        message: `Close ${proportion.toLocaleString(undefined, {
          style: 'percent',
          minimumFractionDigits: 0,
        })} ${symbol || ''}: ${message}`,
        type: 'danger',
        dismiss: {
          duration: 10000,
          onScreen: true,
        },
      });
    }
  };

  const [focus, setFocus] = useState<boolean>(false);
  const [useSettingFilter, setUseSettingFilter] = useState<boolean>(true);
  const [orderAmount, setOrderAmount] = useState<string>('');
  const updateOrderAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderAmount(e.target.value);
  };

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

  const { data: settings, refetch: refetchSettings } =
    api.settings.getSettingsQuery.useQuery();

  api.settings.onUpdate.useSubscription(undefined, {
    onData() {
      void refetchSettings();
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

  const lastNotificationMessage = useRef<Message | undefined>(undefined);
  useEffect(() => {
    // Create an inveral of 1s to refetch positions
    const interval = setInterval(() => {
      void refetchPositions();
    }, 2000);

    const onMessage = (event: MessageEvent) => {
      const response = event.data as {
        reply: string | null;
        action: string;
        data: Message;
      };
      
      if (!settings) return;
      // Do not act on the same notification twice
      if (!lastNotificationMessage.current || lastNotificationMessage.current._id !== response.data._id) {
        console.log('client-notification');
        lastNotificationMessage.current = response.data;

        if (response.action == 'B_1') {
          const amount =
            response.reply !== null
              ? parseFloat(response.reply)
              : settings?.notifications.actions.B_1;
          void makeOrder('BUY', response.data.symbols[0], amount);

          const parsedMessage = checkMessage(response.data, settings);
          setPageMessage({message: response.data, ...parsedMessage})
          setSelectedSymbol(response.data.symbols[0])
        } else if (response.action == 'S_1') {
          const amount =
            response.reply !== null
              ? parseFloat(response.reply)
              : settings?.notifications.actions.S_1;
          void makeOrder('SELL', response.data.symbols[0], amount);

          const parsedMessage = checkMessage(response.data, settings);
          setPageMessage({message: response.data, ...parsedMessage})
          setSelectedSymbol(response.data.symbols[0])
        }
      }
      lastNotificationMessage.current = response.data;
    }

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


      navigator.serviceWorker.addEventListener('message', onMessage);
    }

    return () => {
      clearInterval(interval);
      removeEventListener('message', onMessage)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      count++;
    });

    updateParsedMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const generateNotification = async (
    message: Message,
    settings: settings,
    symbol: string | undefined,
  ) => {
    console.log('Generating Notification');
    let image_url: string | undefined;

    // Check symbol is defined and exists in the map
    if (symbol) {
      const timer = Date.now();
      const data = await getPriceHistory.mutateAsync({
        symbol: symbol,
        limit: 15,
      });
      console.log('Image generation delay: ' + (Date.now() - timer).toString());
      image_url =
        data && data.length !== 0 ? generateChart(symbol, data) : undefined;
      console.log(image_url);
    }

    void pushNotification(message, settings, symbol, image_url);
  };

  // Called when a new message is received
  const addMessage = (message: Message) => {
    console.log('Server Delta:' + (Date.now() - message.time).toString());

    if (settings === undefined) {
      console.log('no settings');
      return;
    }
    const parsedMessage: parsedMessage = {
      message,
      ...checkMessage(message, settings),
    };

    // Trigger re-render
    messageMap.current.set(message._id, parsedMessage);
    updateParsedMessages();

    // If message doesnt pass settings do nothing

    if (!parsedMessage.pass_settings) return;

    void generateNotification(message, settings, parsedMessage.symbols[0]);

    // If we are already focused on a order section do nothing
    if (focus) return;

    setPageMessage(parsedMessage);
    setSelectedSymbol(parsedMessage.symbols[0]);
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
        symbol={selectedSymbol?.replace('1000', '')}
        theme="dark"
        autosize={true}
      />
    );

    setChart(widgetChart);
  }, [selectedSymbol]);

  return (
    <>
      <Head>
        <title>{selectedSymbol ? selectedSymbol.toUpperCase() : 'Dash'}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-screen max-h-full bg-slate-900 p-5 gap-5 text-white overflow-clip">
        <div className="flex flex-row gap-5">
          <div className="flex w-3/5 flex-col bg-white/5 rounded-md p-5 gap-1">
            <div className="flex flex-row gap-5">
              <p className="w-1/12 pl-2">Source</p>
              <p className="w-2/3">Title</p>
              <Link
                href="/"
                className="rounded-md hover:bg-white/5 flex flex-row gap-2 px-3"
              >
                Settings
                <TbSettings className="text-2xl" />
              </Link>
              <div className="w-1/12 flex flex-1 flex-row justify-end px-3 items-center gap-2">
                <input
                  checked={useSettingFilter}
                  onChange={() => {
                    setUseSettingFilter(!useSettingFilter);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  type="checkbox"
                />
                <p>Filter</p>
              </div>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-col overflow-y-auto h-72 clip">
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
            onMouseEnter={() => setFocus(true)}
            onMouseLeave={() => setFocus(false)}
            className={`w-2/5 flex flex-col bg-white/5 rounded-md p-5 gap-2 ${
              focus ? 'outline' : ''
            }`}
          >
            <div className="flex flex-row text-lg font-bold gap-5 items-center">
              <OptionPicker
                options={settings ? Array.from(settings.symbols.keys()) : []}
                suggestedOptions={pageMessage?.symbols}
                selectedOption={selectedSymbol}
                setOption={setSelectedSymbol}
              />
              <input
                value={orderAmount}
                onChange={(e) => updateOrderAmount(e)}
                className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2  p-1 justify-right rounded-md px-5 text-right"
                size={1}
              />
              <button
                onClick={() => {
                  if (isNumeric(orderAmount)) {
                    void makeOrder(
                      'BUY',
                      selectedSymbol,
                      parseFloat(orderAmount),
                    );
                  }
                }}
                className="flex bg-green-500 hover:bg-green-400 rounded-md text-2xl px-4 p-1"
              >
                Buy
              </button>
              <button
                onClick={() => {
                  if (isNumeric(orderAmount)) {
                    void makeOrder(
                      'SELL',
                      selectedSymbol,
                      parseFloat(orderAmount),
                    );
                  }
                }}
                className="flex bg-red-500   hover:bg-red-400   rounded-md text-2xl px-4  p-1"
              >
                Sell
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-row text-sm">
                <div className="w-28 overflow-clip text-end">SYMBOL</div>
                <div className="w-2 h-full ml-2" />
                <div className="flex-1 overflow-clip text-end">SIZE</div>
                <div className="flex-1 overflow-clip text-end">PNL</div>
                <div className="w-20 overflow-clip text-end">ENTRY</div>
                <div className="w-20 overflow-clip text-end">MARK</div>
                <div className="w-20 overflow-clip text-end" />
              </div>
              <div className="h-0.5 bg-white rounded-full" />
              <div
                className={`flex flex-col ${
                  selectedSymbol ? '' : 'h-52 overflow-y-auto'
                } gap-1`}
              >
                {
                  //This is dumb
                  positions &&
                  positions?.filter((position) => {
                    return selectedSymbol
                      ? position.symbol === selectedSymbol
                      : position.notional != 0;
                  }).length > 0 ? (
                    positions
                      ?.filter((position) => {
                        return selectedSymbol
                          ? position.symbol === selectedSymbol
                          : position.notional != 0;
                      })
                      .sort((a, b) => {
                        return (
                          Math.abs(b.notional as number) -
                          Math.abs(a.notional as number)
                        );
                      })
                      .map((position, key, arr) => {
                        return arr.length == 0 ? (
                          <div key={key} className="text-center">
                            No active position(s)
                          </div>
                        ) : (
                          <div
                            key={key}
                            className={`flex flex-row text-sm rounded-md ${
                              !selectedSymbol
                                ? 'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-white'
                                : ''
                            } ${
                              key % 2 === 0 && !selectedSymbol
                                ? 'bg-white/5'
                                : ''
                            }`}
                          >
                            <button
                              className="flex flex-row flex-1"
                              disabled={selectedSymbol !== undefined}
                              onClick={() => {
                                setSelectedSymbol(position.symbol);
                              }}
                            >
                              <div className="w-28 overflow-clip text-end py-1">
                                {position.symbol}
                              </div>
                              <div
                                className={`w-2 h-full ml-2 rounded-sm ${
                                  (position.notional as number) < 0
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                                }`}
                              />
                              <div
                                className={`flex-1 overflow-clip text-end py-1 ${
                                  (position.notional as number) < 0
                                    ? 'text-red-500'
                                    : 'text-green-500'
                                }`}
                              >
                                {parseFloat(
                                  position.notional as string,
                                ).toFixed(2)}
                              </div>
                              <div
                                className={`flex-1 overflow-clip text-end py-1 ${
                                  (position.unRealizedProfit as number) < 0
                                    ? 'text-red-500'
                                    : 'text-green-500'
                                }`}
                              >
                                {parseFloat(
                                  position.unRealizedProfit as string,
                                ).toFixed(2)}
                              </div>
                              <div className="w-20 overflow-clip text-end py-1">
                                {parseFloat(
                                  position.entryPrice as string,
                                ).toFixed(
                                  Math.min(
                                    symbolInfoMap.current.get(position.symbol)
                                      ?.quantityPrecision || 4,
                                    4,
                                  ),
                                )}
                              </div>
                              <div className="w-20 overflow-clip text-end py-1">
                                {parseFloat(
                                  position.markPrice as string,
                                ).toFixed(
                                  Math.min(
                                    symbolInfoMap.current.get(position.symbol)
                                      ?.quantityPrecision || 4,
                                    4,
                                  ),
                                )}
                              </div>
                            </button>
                            <div className="w-20 overflow-clip text-end h-7 flex items-center justify-end ">
                              {selectedSymbol ? null : (
                                /*<button
                              onClick={() => {
                                setSelectedSymbol(undefined);
                              }}
                              className="flex hover:bg-white/5 aspect-square  w-fit h-4 rounded-full justify-center items-center text-4xl"
                            >
                              <RxCross2 />
                            </button>
                            */
                                <button
                                  onClick={() => {
                                    void closePosition(position.symbol, 1);
                                  }}
                                  className="bg-red-500 hover:bg-red-400 py-1 rounded-md px-3"
                                >
                                  CLOSE
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-1">No position(s)</div>
                  )
                }
              </div>
            </div>

            {selectedSymbol ? (
              <>
                <div className="h-0.5 bg-white rounded-full" />
                <div className="flex flex-row text-lg font-bold gap-5">
                  <button
                    onClick={() =>
                      void makeOrder(
                        'BUY',
                        selectedSymbol,
                        settings?.dash.actions.B_1,
                      )
                    }
                    className="bg-green-500 hover:bg-green-400 rounded-md w-1/6 aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.B_1, 4)}
                  </button>
                  <button
                    onClick={() =>
                      void makeOrder(
                        'BUY',
                        selectedSymbol,
                        settings?.dash.actions.B_2,
                      )
                    }
                    className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.B_2, 4)}
                  </button>
                  <button
                    onClick={() =>
                      void makeOrder(
                        'BUY',
                        selectedSymbol,
                        settings?.dash.actions.B_3,
                      )
                    }
                    className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.B_3, 4)}
                  </button>
                  <button
                    onClick={() =>
                      void makeOrder(
                        'SELL',
                        selectedSymbol,
                        settings?.dash.actions.S_1,
                      )
                    }
                    className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.S_1, 4)}
                  </button>
                  <button
                    onClick={() =>
                      void makeOrder(
                        'SELL',
                        selectedSymbol,
                        settings?.dash.actions.S_2,
                      )
                    }
                    className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.S_2, 4)}
                  </button>
                  <button
                    onClick={() =>
                      void makeOrder(
                        'SELL',
                        selectedSymbol,
                        settings?.dash.actions.S_3,
                      )
                    }
                    className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square"
                  >
                    {formatNumber(settings?.dash.actions.S_3, 4)}
                  </button>
                </div>
                <div className="h-0.5 bg-white rounded-full" />

                <div className="flex flex-row gap-5">
                  <button
                    onClick={() => {
                      void closePosition(selectedSymbol, 0.33);
                    }}
                    className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold"
                  >
                    Close 33%
                  </button>
                  <button
                    onClick={() => {
                      void closePosition(selectedSymbol, 0.5);
                    }}
                    className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold"
                  >
                    Close 50%
                  </button>
                  <button
                    onClick={() => void closePosition(selectedSymbol, 1)}
                    className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold"
                  >
                    Close 100%
                  </button>
                </div>
              </>
            ) : null}
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
      <button
        onClick={() => {
          if (!pageMessage || !settings) return;
          // Reset this so I can test the same message again
          lastNotificationMessage.current = undefined
          void generateNotification(
            pageMessage.message,
            settings,
            pageMessage.symbols[0],
          );
        }}
      >
        Notify
      </button>
    </>
  );
};

export default DashPage;
