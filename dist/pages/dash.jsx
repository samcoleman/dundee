"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const head_1 = __importDefault(require("next/head"));
const react_1 = __importStar(require("react"));
const io_1 = require("react-icons/io");
const api_1 = require("../utils/api");
const dynamic_1 = __importDefault(require("next/dynamic"));
const optionPicker_1 = __importDefault(require("../components/optionPicker"));
const messageParse_1 = require("../shared/messageParse");
const generateChart_1 = __importDefault(require("../utils/generateChart"));
const pushNotification_1 = __importDefault(require("../utils/pushNotification"));
const formatNumber_1 = require("../utils/formatNumber");
const react_notifications_component_1 = require("react-notifications-component");
const AdvancedRealTimeChart = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('react-ts-tradingview-widgets'))).then((w) => w.AdvancedRealTimeChart), { ssr: false });
const DashPage = () => {
    var _a;
    //trpc query for treeofaplha
    const treeLoaded = (0, react_1.useRef)(false);
    const [selectedSymbol, setSelectedSymbol] = (0, react_1.useState)();
    const { data: treeOfAlphaData } = api_1.api.tree.getMessages.useQuery(undefined, {
        enabled: !treeLoaded.current,
    });
    // Create a map of symbolInfo
    const symbolInfoMap = (0, react_1.useRef)(new Map());
    const { data: symbolInfo } = api_1.api.binance.getSymbolInfo.useQuery();
    (0, react_1.useEffect)(() => {
        if (!symbolInfo)
            return;
        symbolInfo.forEach((info) => {
            symbolInfoMap.current.set(info.symbol, info);
        });
    }, [symbolInfo]);
    // Create a map of symbolInfo
    const positionsMap = (0, react_1.useRef)(new Map());
    const { data: positions, refetch: refetchPositions } = api_1.api.binance.getPositions.useQuery({});
    (0, react_1.useEffect)(() => {
        if (!positions)
            return;
        positions.forEach((pos) => {
            positionsMap.current.set(pos.symbol, pos);
        });
    }, [positions]);
    const getPriceHistory = api_1.api.binance.getPriceHistory.useMutation();
    const order = api_1.api.binance.order.useMutation();
    const price = api_1.api.binance.getSymbolPrice.useMutation();
    const makeOrder = async (side, symbol, quote_amount) => {
        react_notifications_component_1.Store.addNotification({
            title: 'Order',
            message: `Making ${side} order for ${symbol} with ${quote_amount} quote amount`,
            type: 'info',
            insert: 'top',
            container: 'bottom-right',
            dismiss: {
                duration: 5000,
                onScreen: true
            }
        });
        if (!symbol || !quote_amount)
            return;
        const symbolInfo = symbolInfoMap.current.get(symbol);
        if (!symbolInfo || symbolInfo.status !== 'TRADING')
            return;
        // ONLY WORKS IF POSITION IS OPEN
        //const market_price = positionsMap.current.get(symbol)?.markPrice;
        //if (!market_price) return;
        const market_price = await price.mutateAsync({
            symbol: symbol,
        });
        let market;
        if (Array.isArray(market_price)) {
            market = market_price[0];
        }
        else {
            market = market_price;
        }
        if (!market)
            return;
        const mp = parseFloat(market.markPrice);
        // Round to correct sf
        const quant = Math.round((quote_amount / mp + Number.EPSILON) *
            Math.pow(10, symbolInfo.quantityPrecision)) / Math.pow(10, symbolInfo.quantityPrecision);
        const res_order = await order.mutateAsync({
            symbol: symbol,
            side: side,
            type: 'MARKET',
            quantity: quant,
        });
        console.log(res_order);
    };
    // proportion is between 0 and 1
    const closePosition = async (symbol, proportion) => {
        var _a;
        if (!symbol || proportion < 0 || proportion > 1.05)
            return;
        const symbolInfo = symbolInfoMap.current.get(symbol);
        if (!symbolInfo || symbolInfo.status !== 'TRADING')
            return;
        const position_amount = (_a = positionsMap.current.get(symbol)) === null || _a === void 0 ? void 0 : _a.positionAmt;
        if (!position_amount)
            return;
        const pm = parseFloat(position_amount);
        const quant = Math.round(pm * proportion * Math.pow(10, symbolInfo.quantityPrecision)) /
            Math.pow(10, symbolInfo.quantityPrecision);
        const res_order = await order.mutateAsync({
            symbol: symbol,
            side: pm > 0 ? 'SELL' : 'BUY',
            type: 'MARKET',
            quantity: quant,
        });
        console.log(res_order);
    };
    const [focus, setFocus] = (0, react_1.useState)(false);
    const [useSettingFilter, setUseSettingFilter] = (0, react_1.useState)(true);
    const [orderAmount, setOrderAmount] = (0, react_1.useState)('');
    const updateOrderAmount = (e) => {
        setOrderAmount(e.target.value);
    };
    const [pageMessage, setPageMessage] = (0, react_1.useState)(undefined);
    const [parsedMessages, setParsedMessages] = (0, react_1.useState)([]);
    const messageMap = (0, react_1.useRef)(new Map());
    // Dumb but state doesnt update otherwise
    const updateParsedMessages = () => {
        setParsedMessages([...messageMap.current.values()].reverse());
    };
    const [settings, setSettings] = (0, react_1.useState)();
    //subscribe to settings updates
    api_1.api.settings.onUpdate.useSubscription(undefined, {
        onData(settingsUpdate) {
            setSettings(settingsUpdate);
        },
        onError(err) {
            console.error('Subscription error:', err);
            // we might have missed a message - invalidate cache
        },
    });
    // Load all data
    (0, react_1.useEffect)(() => {
        if (!treeOfAlphaData || !settings || treeLoaded.current)
            return;
        // iterate over treeofalpha in reverse
        for (let i = treeOfAlphaData.length - 1; i >= 0; i--) {
            const message = treeOfAlphaData[i];
            if (!message)
                continue;
            const parsedMessage = {
                message: message,
                ...(0, messageParse_1.checkMessage)(message, settings),
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
    const getSettings = api_1.api.settings.getSettings.useMutation();
    (0, react_1.useEffect)(() => {
        getSettings
            .mutateAsync()
            .then((s) => {
            setSettings(s);
        })
            .catch((e) => {
            console.log(e);
        });
        // Create an inveral of 1s to refetch positions
        const interval = setInterval(() => {
            refetchPositions();
        }, 2000);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('./sw.js')
                .then(function (registration) {
                console.log('Successfully registered Service Worker (scope: %s)', registration.scope);
            }, function (err) {
                console.warn('Failed to register Service Worker:\n', err);
            })
                .catch((err) => {
                console.warn('Failed to register Service Worker:\n', err);
            });
            navigator.serviceWorker.addEventListener('message', function (event) {
                console.log('client-notification');
                const response = event.data;
                console.log(response);
            });
        }
        return () => {
            clearInterval(interval);
        };
    }, []);
    // On settings change update the map
    (0, react_1.useEffect)(() => {
        if (!settings)
            return;
        let count = 0;
        messageMap.current.forEach((value, key) => {
            const newParsedMessage = {
                message: value.message,
                ...(0, messageParse_1.checkMessage)(value.message, settings),
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
    const generateNotification = async (message, settings, symbol) => {
        let image_url;
        if (symbol) {
            const data = await getPriceHistory.mutateAsync({
                symbol: symbol,
                startTime: Date.now() - 60 * 1000,
                endTime: Date.now(),
                limit: 100,
            });
            image_url = data ? (0, generateChart_1.default)(data, symbol) : undefined;
        }
        void (0, pushNotification_1.default)(message, settings, image_url);
    };
    // Called when a new message is received
    const addMessage = async (message) => {
        if (!settings)
            return;
        console.log('Server Delta:' + (Date.now() - message.time).toString());
        const parsedMessage = {
            message,
            ...(0, messageParse_1.checkMessage)(message, settings),
        };
        generateNotification(message, settings, parsedMessage.symbols[0]);
        messageMap.current.set(message._id, parsedMessage);
        // Trigger re-render
        updateParsedMessages();
        if ( /*!focus && */parsedMessage.pass_settings) {
            // Set focus
            setPageMessage(parsedMessage);
            setSelectedSymbol(parsedMessage.symbols[0]);
        }
    };
    api_1.api.tree.onMessage.useSubscription(undefined, {
        onData(message) {
            addMessage(message);
        },
        onError(err) {
            console.error('Subscription error:', err);
            // we might have missed a message - invalidate cache
        },
    });
    // Weird but stops the chart from re-rendering on ANY state change
    const [advancedRealtimeChart, setChart] = (0, react_1.useState)();
    (0, react_1.useEffect)(() => {
        const widgetChart = (<AdvancedRealTimeChart symbol={selectedSymbol} theme="dark" autosize={true}/>);
        setChart(widgetChart);
    }, [selectedSymbol]);
    return (<>
      <head_1.default>
        <title>{selectedSymbol ? selectedSymbol.toUpperCase() : 'Dash'}</title>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>
      <button onClick={() => {
            if (!pageMessage || !settings)
                return;
            void generateNotification(pageMessage.message, settings, pageMessage.symbols[0]);
        }}>
        Notify
      </button>
      <div className="flex flex-col h-screen max-h-full bg-slate-900 p-5 gap-5 text-white overflow-clip">
        <div className="flex flex-row gap-5">
          <div onMouseEnter={() => setFocus(false)} className="flex w-3/5 flex-col bg-white/5 rounded-md p-5 gap-1">
            <div className="flex flex-row gap-5">
              <p className="w-1/12 pl-2">Source</p>
              <p className="w-2/3">Title</p>
              <div className="w-1/12 flex flex-1 flex-row justify-end px-3 items-center gap-2">
                <input checked={useSettingFilter} onClick={() => {
            setUseSettingFilter(!useSettingFilter);
        }} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" type="checkbox"/>
                <p>Filter</p>
              </div>
            </div>
            <div className="h-0.5 bg-white rounded-full"/>
            <div className="flex flex-col overflow-y-auto h-72 clip">
              {parsedMessages
            .filter((message) => {
            return message.pass_settings || !useSettingFilter;
        })
            .map((item, index) => {
            var _a;
            return (<button key={index} onClick={() => {
                    setPageMessage(item);
                    setSelectedSymbol(item.symbols[0]);
                }} className={`flex text-start flex-row gap-5 py-0.5 my-0.5 rounded-md ${index % 2 === 0 ? 'bg-white/5' : ''} ${(pageMessage === null || pageMessage === void 0 ? void 0 : pageMessage.message._id) === item.message._id
                    ? 'outline outline-2 outline-offset-[-2px] outline-blue-500'
                    : 'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-white'}`}>
                      <p className="w-1/12 min-w-max pl-2 overflow-hidden">
                        {(_a = item.message.source) === null || _a === void 0 ? void 0 : _a.toUpperCase()}
                      </p>
                      <div className="flex-1 overflow-hidden break-all">
                        <p>{item.message.title}</p>
                        <p>{item.message.body}</p>
                      </div>
                    </button>);
        })}
            </div>
          </div>
          <div className={`w-2/5 flex flex-col bg-white/5 rounded-md p-5 gap-2 ${focus ? 'outline' : ''}`}>
            <div className="flex flex-row text-xl font-bold gap-5 items-center">
              <optionPicker_1.default options={settings ? Array.from(settings.symbols.keys()) : []} suggestedOptions={pageMessage === null || pageMessage === void 0 ? void 0 : pageMessage.symbols} selectedOption={selectedSymbol} setOption={setSelectedSymbol}/>
              <input value={orderAmount} onChange={(e) => updateOrderAmount(e)} className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2  p-1 justify-right rounded-md px-5 text-right" size={1}/>
              <button onClick={() => {
            if ((0, formatNumber_1.isNumeric)(orderAmount)) {
                void makeOrder('BUY', selectedSymbol, parseFloat(orderAmount));
            }
        }} className="flex bg-green-500 hover:bg-green-400 rounded-md text-2xl px-4 p-1">
                Buy
              </button>
              <button onClick={() => {
            if ((0, formatNumber_1.isNumeric)(orderAmount)) {
                void makeOrder('SELL', selectedSymbol, parseFloat(orderAmount));
            }
        }} className="flex bg-red-500   hover:bg-red-400   rounded-md text-2xl px-4  p-1">
                Sell
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full"/>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row text-sm">
                <div className="w-32 overflow-clip text-end">SYMBOL</div>
                <div className="w-2 h-full ml-2"/>
                <div className="flex-1 overflow-clip text-end">SIZE</div>
                <div className="flex-1 overflow-clip text-end">(MARK) PNL</div>
                <div className="w-24 overflow-clip text-end">ENTRY PRICE</div>
                <div className="w-24 overflow-clip text-end">MARK PRICE</div>
                <div className="w-20 overflow-clip text-end"/>
              </div>
              <div className="h-0.5 bg-white rounded-full"/>
              <div className={`flex flex-col ${selectedSymbol ? '' : 'h-52 overflow-y-auto'} gap-1`}>
                {[...positionsMap.current.values()]
            .filter((position) => {
            return selectedSymbol
                ? position.symbol === selectedSymbol
                : position.notional != 0;
        })
            .sort((a, b) => {
            return (Math.abs(b.notional) -
                Math.abs(a.notional));
        })
            .map((position, key, arr) => {
            var _a, _b, _c, _d;
            return arr.length == 0 ? (<div className="text-center">No active position(s)</div>) : (<button disabled={selectedSymbol !== undefined} onClick={() => {
                    setSelectedSymbol(position.symbol);
                }} className={`flex flex-row text-sm rounded-md ${!selectedSymbol &&
                    'hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-white'} ${key % 2 === 0 && !selectedSymbol && 'bg-white/5'}`}>
                        <div className="w-32 overflow-clip text-end py-1">
                          {position.symbol}
                        </div>
                        <div className={`w-2 h-full ml-2 rounded-sm ${position.notional < 0
                    ? 'bg-red-500'
                    : 'bg-green-500'}`}/>
                        <div className={`flex-1 overflow-clip text-end py-1 ${position.notional < 0
                    ? 'text-red-500'
                    : 'text-green-500'}`}>
                          {parseFloat(position.notional).toFixed(2)}
                        </div>
                        <div className={`flex-1 overflow-clip text-end py-1 ${position.unRealizedProfit < 0
                    ? 'text-red-500'
                    : 'text-green-500'}`}>
                          {parseFloat(position.unRealizedProfit).toFixed(2)}
                        </div>
                        <div className="w-24 overflow-clip text-end py-1">
                          {parseFloat(position.entryPrice).toFixed(((_a = symbolInfoMap.current.get(position.symbol)) === null || _a === void 0 ? void 0 : _a.quantityPrecision) || ((_b = symbolInfoMap.current.get(position.symbol)) === null || _b === void 0 ? void 0 : _b.quotePrecision))}
                        </div>
                        <div className="w-24 overflow-clip text-end py-1">
                          {parseFloat(position.markPrice).toFixed(((_c = symbolInfoMap.current.get(position.symbol)) === null || _c === void 0 ? void 0 : _c.quantityPrecision) || ((_d = symbolInfoMap.current.get(position.symbol)) === null || _d === void 0 ? void 0 : _d.quotePrecision))}
                        </div>
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
                <button onClick={() => {
                        void closePosition(position.symbol, 1);
                    }} className="bg-red-500 hover:bg-red-400 py-1 rounded-md px-3">
                              CLOSE
                            </button>)}
                        </div>
                      </button>);
        })}
              </div>
            </div>

            {selectedSymbol ? (<>
                <div className="h-0.5 bg-white rounded-full"/>
                <div className="flex flex-row text-lg font-bold gap-5">
                  <button onClick={() => void makeOrder('BUY', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_1)} className="bg-green-500 hover:bg-green-400 rounded-md w-1/6 aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_1, 4)}
                  </button>
                  <button onClick={() => void makeOrder('BUY', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_2)} className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_2, 4)}
                  </button>
                  <button onClick={() => void makeOrder('BUY', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_3)} className="bg-green-500 hover:bg-green-400 w-1/6 rounded-md aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.B_3, 4)}
                  </button>
                  <button onClick={() => void makeOrder('SELL', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_1)} className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_1, 4)}
                  </button>
                  <button onClick={() => void makeOrder('SELL', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_2)} className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_2, 4)}
                  </button>
                  <button onClick={() => void makeOrder('SELL', selectedSymbol, settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_3)} className="bg-red-500   hover:bg-red-400  w-1/6 rounded-md aspect-square">
                    {(0, formatNumber_1.formatNumber)(settings === null || settings === void 0 ? void 0 : settings.dash.actions.S_3, 4)}
                  </button>
                </div>
                <div className="h-0.5 bg-white rounded-full"/>

                <div className="flex flex-row gap-5">
                  <button onClick={() => {
                void closePosition(selectedSymbol, 0.33);
            }} className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
                    Close 33%
                  </button>
                  <button onClick={() => {
                void closePosition(selectedSymbol, 0.5);
            }} className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
                    Close 50%
                  </button>
                  <button onClick={() => void closePosition(selectedSymbol, 1)} className="flex-1 bg-red-500 justify-center  hover:bg-red-400 rounded-md py-2 text-2xl font-bold">
                    Close 100%
                  </button>
                </div>
              </>) : null}
          </div>
        </div>
        <div className="flex flex-1 flex-row gap-5">
          <div className={`w-3/5 rounded-md ${focus ? 'outline' : ''}`}>
            {selectedSymbol ? (advancedRealtimeChart) : (<div className="flex flex-col h-full justify-center items-center bg-white/5 rounded-md">
                <h1 className="text-2xl">Symbol Not Selected</h1>
              </div>)}
          </div>

          <div className={`w-2/5 flex flex-col flex-auto bg-white/5 rounded-md p-5 gap-2 min-h-0 ${focus ? 'outline' : ''}`}>
            {pageMessage ? (<>
                <div className="h-0.5 bg-white rounded-full"/>
                <a href={pageMessage.message.url} rel="noopener noreferrer" target="_blank" className="flex flex-row justify-between items-center text-lg gap-5 hover:bg-white/5 rounded-md">
                  <div className={`rounded-md px-3 ${pageMessage.source_filter ? 'bg-green-500' : 'bg-red-500'}`}>
                    {(_a = pageMessage.message.source) === null || _a === void 0 ? void 0 : _a.toUpperCase()}
                  </div>

                  <div className="flex flex-row items-center gap-1 pr-3">
                    Link <io_1.IoIosArrowForward />
                  </div>
                </a>
                <div className="h-0.5 bg-white rounded-full"/>
                <div className="flex flex-row gap-3 text-lg flex-wrap">
                  <div className={`px-3 rounded-md ${pageMessage.pos_filter ? 'bg-green-500' : 'bg-red-500'}`}>
                    Positive Filter
                  </div>
                  <div className={`px-3 rounded-md ${pageMessage.neg_filter ? 'bg-green-500' : 'bg-red-500'}`}>
                    Negative Filter
                  </div>

                  {pageMessage.symbols.length > 0 ? (pageMessage.symbols.map((symbol, index) => {
                return (<button className={`rounded-md hover:bg-white/5 px-3 ${symbol === selectedSymbol
                        ? 'outline outline-2 outline-offset-[-2px outline-white'
                        : ''}`} key={index} onClick={() => void setSelectedSymbol(symbol)}>
                          {symbol}
                        </button>);
            })) : (<p>No Symbols Found</p>)}
                </div>
                <div className="h-0.5 bg-white rounded-full"/>
                <h1 className="flex text-xl break-all">
                  {pageMessage.message.title}
                </h1>
                <p className="flex flex-1 text-xl break-all overflow-y-auto min-h-0 ">
                  {pageMessage.message.body}
                </p>
              </>) : null}
          </div>
        </div>
      </div>
    </>);
};
exports.default = DashPage;
