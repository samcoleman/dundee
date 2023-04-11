"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const head_1 = __importDefault(require("next/head"));
const react_1 = require("react");
const api_1 = require("../utils/api");
const gi_1 = require("react-icons/gi");
const go_1 = require("react-icons/go");
const fi_1 = require("react-icons/fi");
const optionPicker_1 = __importDefault(require("components/optionPicker"));
const types_1 = require("../shared/types");
const IndexPage = () => {
    var _a;
    const { data: settings, refetch: settingsRefetch } = api_1.api.settings.getSettings.useQuery();
    const [toggles, setToggles] = (0, react_1.useState)([]);
    const [symbolkeyCount, setSymbolkeyCount] = (0, react_1.useState)(0);
    const [poskeyCount, setPoskeyCount] = (0, react_1.useState)(0);
    const [negkeyCount, setNegkeyCount] = (0, react_1.useState)(0);
    const [selectedSymbol, setSelectedSymbol] = (0, react_1.useState)();
    const [selectedSourceNeg, setSelectedSourceNeg] = (0, react_1.useState)();
    const [selectedSourcePos, setSelectedSourcePos] = (0, react_1.useState)();
    const [socketStatus, setSocketStatus] = (0, react_1.useState)(true);
    const [binanceStatus, setBinanceStatus] = (0, react_1.useState)(true);
    const [symbolInput, setSymbolInput] = (0, react_1.useState)('');
    const symbolUpdate = (e) => {
        setSymbolInput(e.target.value);
    };
    const [keywordInput, setKeywordInput] = (0, react_1.useState)('');
    const keywordUpdate = (e) => {
        setKeywordInput(e.target.value);
    };
    const [posKeyworkInput, setPosKeyworkInput] = (0, react_1.useState)('');
    const posKeywordUpdate = (e) => {
        setPosKeyworkInput(e.target.value);
    };
    const [negKeywordInput, setNegKeywordInput] = (0, react_1.useState)('');
    const negKeywordUpdate = (e) => {
        setNegKeywordInput(e.target.value);
    };
    const addFeed = api_1.api.settings.addSource.useMutation();
    const removeFeed = api_1.api.settings.removeSource.useMutation();
    const toggleFeed = async (source) => {
        if (settings === null || settings === void 0 ? void 0 : settings.notifications.sources.includes(source)) {
            await removeFeed.mutateAsync({ source });
        }
        else {
            await addFeed.mutateAsync({ source });
        }
        void settingsRefetch();
    };
    const addSym = api_1.api.settings.addSymbol.useMutation();
    const addSymbol = async (symbol) => {
        if (symbol === '')
            return;
        await addSym.mutateAsync({ symbol });
        void settingsRefetch();
    };
    const removeSym = api_1.api.settings.removeSymbol.useMutation();
    const removeSymbol = async (symbol) => {
        if (symbol === '')
            return;
        await removeSym.mutateAsync({ symbol });
        void settingsRefetch();
    };
    const addSymKey = api_1.api.settings.addSymbolKey.useMutation();
    const addSymbolKey = async (keyword, symbol) => {
        if (!symbol)
            return;
        if (keyword === '')
            return;
        await addSymKey.mutateAsync({ symbol, keyword });
        void settingsRefetch();
    };
    const removeSymKey = api_1.api.settings.removeSymbolKey.useMutation();
    const removeSymbolKey = async (symbol, keyword) => {
        if (symbol === '' || keyword === '')
            return;
        await removeSymKey.mutateAsync({ symbol, keyword });
        void settingsRefetch();
    };
    const addPosKey = api_1.api.settings.addPosKeyword.useMutation();
    const addPosKeyword = async (keyword, source) => {
        if (keyword === '')
            return;
        await addPosKey.mutateAsync({ keyword, source });
        void settingsRefetch();
    };
    const removePosKey = api_1.api.settings.removePosKeyword.useMutation();
    const removePosKeyword = async (keyword, source) => {
        if (keyword === '')
            return;
        await removePosKey.mutateAsync({ keyword, source });
        void settingsRefetch();
    };
    const addNegKey = api_1.api.settings.addNegKeyword.useMutation();
    const addNegKeyword = async (keyword, source) => {
        if (keyword === '')
            return;
        await addNegKey.mutateAsync({ keyword, source });
        void settingsRefetch();
    };
    const removeNegKey = api_1.api.settings.removeNegKeyword.useMutation();
    const removeNegKeyword = async (keyword, source) => {
        if (keyword === '')
            return;
        await removeNegKey.mutateAsync({ keyword, source });
        void settingsRefetch();
    };
    const checkSymbols = api_1.api.binance.checkSymbols.useMutation();
    const updateSymbols = api_1.api.settings.updateSymbols.useMutation();
    const checkSymbolStatus = async () => {
        if (!settings)
            return;
        const res = await checkSymbols.mutateAsync(settings.symbols);
        await updateSymbols.mutateAsync(res);
        void settingsRefetch();
    };
    const bStatus = api_1.api.binance.status.useMutation();
    (0, react_1.useEffect)(() => {
        const checkStatus = async () => {
            try {
                await bStatus.mutateAsync();
                setBinanceStatus(true);
            }
            catch (e) {
                setBinanceStatus(false);
            }
        };
        void checkSymbolStatus();
        const interval = setInterval(() => {
            void checkStatus();
        }, 10000 * 6);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // create a timer for ever 10 seconds in useEffect
    (0, react_1.useEffect)(() => {
        setToggles((settings === null || settings === void 0 ? void 0 : settings.notifications.sources) || []);
        let keywords = 0;
        settings === null || settings === void 0 ? void 0 : settings.symbol_keys.forEach((s) => {
            keywords += s.length;
        });
        setSymbolkeyCount(keywords);
        keywords = 0;
        settings === null || settings === void 0 ? void 0 : settings.notifications.pos_filter.forEach((s) => {
            keywords += s.length;
        });
        setPoskeyCount(keywords);
        keywords = 0;
        settings === null || settings === void 0 ? void 0 : settings.notifications.neg_filter.forEach((s) => {
            keywords += s.length;
        });
        setNegkeyCount(keywords);
    }, [settings]);
    return (<>
      <head_1.default>
        <title>Dundee</title>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>
      <div className="flex flex-col  bg-slate-900 p-5 gap-5 ">
        <div className="flex flex-1 flex-col gap-5 text-white">
          <div className="flex flex-row gap-5">
            <div className="flex bg-white/5 rounded-md p-5 gap-5 items-center">
              {socketStatus ? (<div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500">
                  <gi_1.GiWillowTree />
                </div>) : (<div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500">
                  <gi_1.GiWillowTree />
                </div>)}
              <h1 className="text-lg font-bold">Tree of Alpha: Websocket</h1>
            </div>
            <div className="flex bg-white/5 rounded-md p-5 gap-5 items-center">
              {binanceStatus ? (<div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500">
                  <go_1.GoTerminal title="Binance: Terminal"/>
                </div>) : (<div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500">
                  <go_1.GoTerminal title="Binance: Terminal"/>
                </div>)}
              <h1 className="text-lg font-bold">Binance</h1>
            </div>
            <div className="flex bg-white/[0.01] rounded-md flex-1"></div>
          </div>
          <h1 className="text-2xl font-bold pl-5">Settings</h1>
          <div className="flex flex-col bg-white/5 rounded-md p-5 gap-2 justify-start">
            <div className="flex flex-row text-lg gap-5">
              <h1 className="font-bold">Notification Feeds</h1>
              {types_1.sourceObj.map((source, index) => (<label key={index} className="flex flex-row gap-2 items-center">
                  <input type="checkbox" onChange={() => void toggleFeed(source)} checked={toggles.includes(source)} className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"/>
                  <p>{source}</p>
                </label>))}
              <div />
            </div>
          </div>

          <div className="grid-cols-2 grid gap-5">
            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <go_1.GoSearch className="text-2xl"/>
                <input value={symbolInput} onChange={symbolUpdate} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                void addSymbol(symbolInput);
                setSymbolInput('');
            }
        }} className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right" size={1}/>
                <button onClick={() => {
            void addSymbol(symbolInput);
            setSymbolInput('');
        }} className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400">
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1">
                  <div className="flex-1 text-start">Symbol</div>
                  <button className="flex-1 flex flex-row text-left justify-center items-center gap-2 hover:bg-white/5 rounded-md" onClick={() => void checkSymbolStatus()}>
                    <fi_1.FiRefreshCcw />
                    Status
                  </button>
                  <div className="flex-1 text-end">
                    {' '}
                    Count: {((_a = settings === null || settings === void 0 ? void 0 : settings.symbols) === null || _a === void 0 ? void 0 : _a.size) || 0}
                  </div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {(settings === null || settings === void 0 ? void 0 : settings.symbols) ? (Array.from(settings.symbols.keys())
            .filter((symbol) => {
            return symbol.includes(symbolInput.toUpperCase());
        })
            .map((symbol, index) => {
            const sym = settings.symbols.get(symbol);
            if (!sym)
                return null;
            return (<tr className="flex flex-row w-full" key={index}>
                              <td className="flex-1 text-start">{symbol}</td>
                              {sym.status === 'TRADING' ? (<td className="flex flex-1 font-bold bg-green-500 rounded-full justify-center">
                                  TRADING
                                </td>) : sym.status === 'DOWN' ? (<td className="flex flex-1 font-bold bg-red-500 rounded-full justify-center">
                                  DOWN
                                </td>) : (<td className="flex flex-1 font-bold bg-white/50 rounded-full justify-center">
                                  {sym.status}
                                </td>)}
                              <td className="flex flex-1 justify-end">
                                <button onClick={() => void removeSymbol(symbol)} className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5">
                                  Remove
                                </button>
                              </td>
                            </tr>);
        })) : (<tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start">
              <div className="flex flex-row  gap-3">
                <go_1.GoSearch className="text-2xl "/>
                <optionPicker_1.default options={settings ? Array.from(settings.symbols.keys()) : []} selectedOption={selectedSymbol} setOption={setSelectedSymbol}/>
                <input value={keywordInput} onChange={keywordUpdate} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                void addSymbolKey(keywordInput, selectedSymbol);
                setKeywordInput('');
            }
        }} className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right" size={1}/>
                <button onClick={() => {
            void addSymbolKey(keywordInput, selectedSymbol);
            setKeywordInput('');
        }} className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400">
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1 gap-5">
                  <div className="flex text-start w-24">Symbol</div>
                  <div className="flex-1 text-start">Keyword</div>
                  <div className="text-end"> Count : {symbolkeyCount}</div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {(settings === null || settings === void 0 ? void 0 : settings.symbol_keys) ? (Array.from(settings.symbol_keys.keys())
            .filter((symbol) => {
            if (!selectedSymbol) {
                return true;
            }
            return symbol.includes(selectedSymbol);
        })
            .map((symbol, s_index) => {
            const keys = settings.symbol_keys.get(symbol);
            if (!keys)
                return null;
            return keys
                .filter((keyword) => {
                return keyword.includes(keywordInput.toUpperCase());
            })
                .map((keyword, k_index) => {
                return (
                //Max 50000 keywords per symbol before repeating keys - will never happen
                <tr key={s_index * 50000 + k_index} className="flex flex-row w-full text-white gap-5">
                                  <td className="flex text-start w-24">
                                    {symbol}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button onClick={() => void removeSymbolKey(symbol, keyword)} className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5">
                                      Remove
                                    </button>
                                  </td>
                                </tr>);
            });
        })) : (<tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start">
              <div className="flex flex-row  gap-3">
                <go_1.GoSearch className="text-2xl "/>
                <optionPicker_1.default options={Array.from(types_1.sourceObj)} selectedOption={selectedSourcePos} setOption={setSelectedSourcePos}/>
                <input value={posKeyworkInput} onChange={posKeywordUpdate} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                void addPosKeyword(posKeyworkInput, selectedSourcePos);
                setPosKeyworkInput('');
            }
        }} className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right" size={1}/>
                <button onClick={() => {
            void addPosKeyword(posKeyworkInput, selectedSourcePos);
            setPosKeyworkInput('');
        }} className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400">
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1 gap-5">
                  <div className="flex text-start w-24">Source</div>
                  <div className="flex-1 text-start">Pos Keyword</div>
                  <div className="text-end"> Count : {poskeyCount}</div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {(settings === null || settings === void 0 ? void 0 : settings.notifications.pos_filter) ? (Array.from(settings.notifications.pos_filter.keys())
            .filter((source) => {
            if (!selectedSourcePos) {
                return true;
            }
            return source === selectedSourcePos;
        })
            .map((source, s_index) => {
            const keys = settings.notifications.pos_filter.get(source);
            if (!keys)
                return null;
            return keys
                .filter((keyword) => {
                return keyword.includes(posKeyworkInput.toUpperCase());
            })
                .map((keyword, k_index) => {
                return (
                //Max 50000 keywords per symbol before repeating keys - will never happen
                <tr key={s_index * 50000 + k_index} className="flex flex-row w-full text-white gap-5">
                                  <td className="flex text-start w-24">
                                    {source}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button onClick={() => {
                        if (!source)
                            return;
                        void removePosKeyword(keyword, source);
                    }} className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5">
                                      Remove
                                    </button>
                                  </td>
                                </tr>);
            });
        })) : (<tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <go_1.GoSearch className="text-2xl "/>
                <optionPicker_1.default options={Array.from(types_1.sourceObj)} selectedOption={selectedSourceNeg} setOption={setSelectedSourceNeg}/>
                <input value={negKeywordInput} onChange={negKeywordUpdate} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                void addNegKeyword(negKeywordInput, selectedSourceNeg);
                setNegKeywordInput('');
            }
        }} className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right" size={1}/>
                <button onClick={() => {
            void addNegKeyword(negKeywordInput, selectedSourceNeg);
            setNegKeywordInput('');
        }} className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400">
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1">
                  <div className="flex text-start w-24">Source</div>
                  <div className="flex-1 text-start">Neg Keyword</div>
                  <div className="text-end"> Count : {negkeyCount}</div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {(settings === null || settings === void 0 ? void 0 : settings.notifications.neg_filter) ? (Array.from(settings.notifications.neg_filter.keys())
            .filter((source) => {
            if (!selectedSourceNeg) {
                return true;
            }
            return source === selectedSourceNeg;
        })
            .map((source, s_index) => {
            const keys = settings.notifications.neg_filter.get(source);
            if (!keys)
                return null;
            return keys
                .filter((keyword) => {
                return keyword.includes(negKeywordInput.toUpperCase());
            })
                .map((keyword, k_index) => {
                return (
                //Max 50000 keywords per symbol before repeating keys - will never happen
                <tr key={s_index * 50000 + k_index} className="flex flex-row w-full text-white gap-5">
                                  <td className="flex text-start w-24">
                                    {source}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button onClick={() => void removeNegKeyword(keyword, source)} className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5">
                                      Remove
                                    </button>
                                  </td>
                                </tr>);
            });
        })) : (<tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);
};
exports.default = IndexPage;
