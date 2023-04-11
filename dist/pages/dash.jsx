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
const api_1 = require("utils/api");
const dynamic_1 = __importDefault(require("next/dynamic"));
const optionPicker_1 = __importDefault(require("components/optionPicker"));
const messageParse_1 = require("shared/messageParse");
const AdvancedRealTimeChart = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('react-ts-tradingview-widgets'))).then((w) => w.AdvancedRealTimeChart), { ssr: false });
const DashPage = () => {
    var _a;
    //trpc query for treeofaplha
    const { data: treeOfAlphaData } = api_1.api.tree.getUpdates.useQuery();
    const { data: settings } = api_1.api.settings.getSettings.useQuery();
    const order = api_1.api.binance.order.useMutation();
    const makeOrder = async () => {
        const res = await order.mutateAsync({
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quoteOrderQty: 10,
        });
        console.log(res);
    };
    const [selectedSymbol, setSelectedSymbol] = (0, react_1.useState)();
    const [focus, setFocus] = (0, react_1.useState)(false);
    const [pageMessage, setPageMessage] = (0, react_1.useState)(undefined);
    const [parsedMessages, setParsedMessages] = (0, react_1.useState)([]);
    const messageMap = (0, react_1.useRef)(new Map());
    (0, react_1.useEffect)(() => {
        if (!settings)
            return;
        if (!treeOfAlphaData)
            return;
        // This has to be done in reverse to ensure the most recent messages are at the top
        // Using map entry order to sort -> not great
        for (let index = treeOfAlphaData.length - 1; index >= 0; index--) {
            const message = treeOfAlphaData[index];
            if (!messageMap.current.has(message._id)) {
                messageMap.current.set(message._id, {
                    message: message,
                    parser: (0, messageParse_1.checkMessage)(message, settings),
                });
            }
        }
        updateParsedArray();
        setMessageAndSymbol({
            message: treeOfAlphaData[0],
            parser: (0, messageParse_1.checkMessage)(treeOfAlphaData[0], settings),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [treeOfAlphaData, settings]);
    (0, react_1.useEffect)(() => {
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
                console.log(event.data);
                // This could probably be done simpler
                navigator.serviceWorker.getRegistration().then(function (registration) {
                    registration === null || registration === void 0 ? void 0 : registration.getNotifications().then(function (notifications) {
                        notifications.forEach(notification => notification.close());
                    }).catch((err) => {
                        console.warn('Failed to close notifications:\n', err);
                    });
                }).catch((err) => {
                    console.warn('Failed to get registration:\n', err);
                });
            });
        }
    }, []);
    // Regenerate the array if the map - very inefficient TODO: SLOW
    const updateParsedArray = () => {
        if (messageMap.current.size !== parsedMessages.length) {
            // Due to col-row-reverse auto-scrolling to bottom??? why
            setParsedMessages(Array.from(messageMap.current.values()).reverse());
        }
    };
    // Updates the page to the new message
    const setMessageAndSymbol = (parsedMessage) => {
        if (!settings)
            return;
        if (parsedMessage.parser.symbols.length > 0) {
            setSelectedSymbol(parsedMessage.parser.symbols[0]);
        }
        else if (parsedMessage.message.symbols.length > 0) {
            setSelectedSymbol(parsedMessage.message.symbols[0]);
        }
        else {
            setSelectedSymbol(undefined);
        }
        setPageMessage(parsedMessage);
    };
    // Write function called push show local web notification
    const pushNotification = (message) => {
        if ('Notification' in window) {
            Notification.requestPermission()
                .then(async function (permission) {
                if (permission === 'granted') {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (!reg)
                        return;
                    void reg.showNotification(message.title, {
                        body: message.body,
                        //image: "http://192.168.0.3:3000/example.png",
                        actions: [
                            //
                            { action: 'Buy', title: 'Buy', type: 'text' },
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
    const addMessage = (message) => {
        console.log('Server Delta:' + (Date.now() - message.time).toString());
        void pushNotification(message);
        if (!settings)
            return;
        const parsedMessage = {
            message,
            parser: (0, messageParse_1.checkMessage)(message, settings),
        };
        messageMap.current.set(parsedMessage.message._id, parsedMessage);
        updateParsedArray();
        if (!focus) {
            setMessageAndSymbol(parsedMessage);
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
    /*
      <Link href="/" className="flex justify-center h-full aspect-square text-2xl  p-2 items-center rounded-md hover:bg-white/5" >
                  <IoIosArrowBack />
                </Link>
    */
    return (<>
      <head_1.default>
        <title>{selectedSymbol ? selectedSymbol.toUpperCase() : 'Dash'}</title>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>
      <button onClick={() => {
            if (!pageMessage)
                return;
            void pushNotification(pageMessage === null || pageMessage === void 0 ? void 0 : pageMessage.message);
        }}>
        Notify
      </button>
      <div className="flex flex-col h-screen max-h-full bg-slate-900 p-5 gap-5 text-white overflow-clip">
        <div className="flex flex-row gap-5">
          <div onMouseEnter={() => setFocus(false)} 
    //onMouseLeave={() => setFocus(true)}
    className="flex w-3/5 flex-col bg-white/5 rounded-md p-5 gap-1">
            <div className="flex flex-row gap-5">
              <p className="w-1/12 pl-2">Source</p>
              <p className="w-2/3">Title</p>
              <p className="w-1/12">Filters</p>
            </div>
            <div className="h-0.5 bg-white rounded-full"/>
            <div className="flex flex-col overflow-y-auto h-64 clip">
              {parsedMessages === null || parsedMessages === void 0 ? void 0 : parsedMessages.map((item, index) => {
            var _a;
            return (<button key={index} onClick={() => setMessageAndSymbol(item)} className={`flex text-start flex-row gap-5 py-0.5 my-0.5 rounded-md ${index % 2 === 0 ? 'bg-white/5' : ''} ${(pageMessage === null || pageMessage === void 0 ? void 0 : pageMessage.message._id) === item.message._id
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
          <div className={`w-2/5 flex flex-col justify-between bg-white/5 rounded-md p-5 gap-5 ${focus ? 'outline' : ''}`}>
            <div className="flex flex-row text-2xl font-bold gap-5">
              <button onClick={() => void makeOrder()} className="bg-green-500 hover:bg-green-400 rounded-md w-1/6 aspect-square">
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
            <div className="h-0.5 bg-white rounded-full"/>
            <div className="flex flex-row text-xl font-bold gap-5 items-center">
              <optionPicker_1.default options={settings ? Array.from(settings.symbols.keys()) : []} selectedOption={selectedSymbol} setOption={setSelectedSymbol}/>
              <input className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-5 p-2 text-right" size={1}/>
              <button className="flex bg-green-500 hover:bg-green-400 rounded-md text-2xl px-4 p-2">
                Buy
              </button>
              <button className="flex bg-red-500   hover:bg-red-400   rounded-md text-2xl px-4 p-2">
                Sell
              </button>
            </div>
            <div className="h-0.5 bg-white rounded-full"/>
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
            {selectedSymbol ? (advancedRealtimeChart) : (<div className="flex flex-col h-full justify-center items-center bg-white/5 rounded-md">
                <h1 className="text-2xl">Symbol Not Selected</h1>
              </div>)}
          </div>

          <div className={`w-2/5 flex flex-col flex-auto bg-white/5 rounded-md p-5 gap-2 min-h-0 ${focus ? 'outline' : ''}`}>
            {pageMessage ? (<>
                <div className="h-0.5 bg-white rounded-full"/>
                <a href={pageMessage.message.url} rel="noopener noreferrer" target="_blank" className="flex flex-row justify-between items-center text-lg gap-5 hover:bg-white/5 py-1 rounded-md px-3">
                  {(_a = pageMessage.message.source) === null || _a === void 0 ? void 0 : _a.toUpperCase()}
                  
                  <div className="flex flex-row items-center gap-1">
                    Link <io_1.IoIosArrowForward />
                  </div>
                </a>
                <div className="h-0.5 bg-white rounded-full"/>
                <div className="flex flex-row gap-3 text-lg flex-wrap">
                  <div className={`px-3 rounded-md ${pageMessage.parser.pos_filter
                ? 'bg-green-500'
                : 'bg-red-500'}`}>
                    Positive Filter
                  </div>
                  <div className={`px-3 rounded-md ${pageMessage.parser.neg_filter
                ? 'bg-green-500'
                : 'bg-red-500'}`}>
                    Negative Filter
                  </div>

                  {
            // Combine the symbols from the parser and the message & remove duplicates TODO: SLOW
            new Set([
                ...pageMessage.parser.symbols,
                ...pageMessage.message.symbols,
            ]).size > 0 ? ([
                ...new Set([
                    ...pageMessage.parser.symbols,
                    ...pageMessage.message.symbols,
                ]),
            ].map((symbol, index) => {
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