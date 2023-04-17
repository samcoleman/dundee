import Head from 'next/head';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { GiWillowTree } from 'react-icons/gi';
import { GoTerminal, GoSearch } from 'react-icons/go';
import { FiRefreshCcw } from 'react-icons/fi';

import OptionPicker from '../components/optionPicker';
import { sourceObj, type source } from '../shared/types';
import { type settings } from '../shared/types';
import AmountEditor from '../components/amountEditor';

const IndexPage = () => {
  const [toggles, setToggles] = useState<source[]>([]);

  const [symbolkeyCount, setSymbolkeyCount] = useState(0);
  const [poskeyCount, setPoskeyCount] = useState(0);
  const [negkeyCount, setNegkeyCount] = useState(0);

  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();
  const [selectedSourceNeg, setSelectedSourceNeg] = useState<
    string | undefined
  >();
  const [selectedSourcePos, setSelectedSourcePos] = useState<
    string | undefined
  >();

  const [socketStatus, setSocketStatus] = useState(true);
  const [binanceStatus, setBinanceStatus] = useState(true);

  const [symbolInput, setSymbolInput] = useState('');
  const symbolUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolInput(e.target.value.toUpperCase());
  };

  const [keywordInput, setKeywordInput] = useState('');
  const keywordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value.toUpperCase());
  };

  const [posKeyworkInput, setPosKeyworkInput] = useState('');
  const posKeywordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPosKeyworkInput(e.target.value.toUpperCase());
  };

  const [negKeywordInput, setNegKeywordInput] = useState('');
  const negKeywordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNegKeywordInput(e.target.value.toUpperCase());
  };

  const addFeed = api.settings.addSource.useMutation();
  const removeFeed = api.settings.removeSource.useMutation();
  const toggleFeed = async (source: source) => {
    if (settings?.notifications.sources.includes(source)) {
      await removeFeed.mutateAsync({ source });
    } else {
      await addFeed.mutateAsync({ source });
    }
  };

  // SETTINGS
  // Overkill but can move from client to worker / websocket later
  const addSym = api.settings.addSymbol.useMutation();
  const removeSym = api.settings.removeSymbol.useMutation();

  const addSymKey = api.settings.addSymbolKey.useMutation();
  const removeSymKey = api.settings.removeSymbolKey.useMutation();

  const addPosKey = api.settings.addPosKeyword.useMutation();
  const removePosKey = api.settings.removePosKeyword.useMutation();

  const addNegKey = api.settings.addNegKeyword.useMutation();
  const removeNegKey = api.settings.removeNegKeyword.useMutation();

  const setNotificationAction =
    api.settings.setNotificationAction.useMutation();
  const setDashAction = api.settings.setDashAction.useMutation();

  const setPosFilter = api.settings.setPosFilter.useMutation();
  const setNegFilter = api.settings.setNegFilter.useMutation();

  const setSymbolMatch = api.settings.setSymbolMatch.useMutation();
  // SETTINGS END

  const checkSymbols = api.binance.checkSymbols.useMutation();
  const updateSymbols = api.settings.updateSymbols.useMutation();
  const checkSymbolStatus = async () => {
    if (!settings) return;

    const updatedSymbols = await checkSymbols.mutateAsync(settings.symbols);
    if (updatedSymbols) {
      void updateSymbols.mutateAsync(updatedSymbols);
    }
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

  const getSettings = api.settings.getSettings.useMutation();
  const bStatus = api.binance.status.useMutation();
  useEffect(() => {
    console.log(process.env.NEXT_PUBLIC_TREE_COOKIE);
    const checkStatus = async () => {
      try {
        await bStatus.mutateAsync();
        setBinanceStatus(true);
      } catch (e) {
        setBinanceStatus(false);
      }
    };
    //void checkSymbolStatus();
    const interval = setInterval(() => {
      void checkStatus();
    }, 10000 * 6);

    getSettings
      .mutateAsync()
      .then((s) => {
        setSettings(s);
      })
      .catch((e) => {
        console.log(e);
      });

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // create a timer for ever 10 seconds in useEffect
  useEffect(() => {
    setToggles(settings?.notifications.sources || []);

    let keywords = 0;
    settings?.symbol_keys.forEach((s) => {
      keywords += s.length;
    });
    setSymbolkeyCount(keywords);

    keywords = 0;
    settings?.notifications.pos_filter.forEach((s) => {
      keywords += s.length;
    });
    setPoskeyCount(keywords);

    keywords = 0;
    settings?.notifications.neg_filter.forEach((s) => {
      keywords += s.length;
    });
    setNegkeyCount(keywords);
  }, [settings]);

  return (
    <>
      <Head>
        <title>Dundee</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col  bg-slate-900 p-5 gap-5 ">
        <div className="flex flex-1 flex-col gap-5 text-white">
          <div className="flex flex-row gap-5">
            <div className="flex bg-white/5 rounded-md p-5 gap-5 items-center">
              {socketStatus ? (
                <div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500">
                  <GiWillowTree />
                </div>
              ) : (
                <div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500">
                  <GiWillowTree />
                </div>
              )}
              <h1 className="text-lg font-bold">Tree of Alpha: Websocket</h1>
            </div>
            <div className="flex bg-white/5 rounded-md p-5 gap-5 items-center">
              {binanceStatus ? (
                <div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-green-500">
                  <GoTerminal title="Binance: Terminal" />
                </div>
              ) : (
                <div className="flex justify-center h-full aspect-square text-2xl  p-5 items-center rounded-md bg-red-500">
                  <GoTerminal title="Binance: Terminal" />
                </div>
              )}
              <h1 className="text-lg font-bold">Binance</h1>
            </div>
            <div className="flex bg-white/[0.01] rounded-md flex-1"></div>
          </div>

          <div className="grid-cols-2 grid gap-5">
            <h1 className="text-2xl font-bold pl-5">Dash Settings</h1>
            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-2 justify-start text-lg col-span-2">
              <div className="flex flex-row gap-5 items-center flex-wrap">
                <h1 className="font-bold w-24">Amount</h1>
                <AmountEditor
                  action="B_1"
                  value={settings?.dash.actions.B_1}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'B_1', amount });
                  }}
                />
                <AmountEditor
                  action="B_2"
                  value={settings?.dash.actions.B_2}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'B_2', amount });
                  }}
                />
                <AmountEditor
                  action="B_3"
                  value={settings?.dash.actions.B_3}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'B_3', amount });
                  }}
                />
                <AmountEditor
                  action="S_1"
                  value={settings?.dash.actions.S_1}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'S_1', amount });
                  }}
                />
                <AmountEditor
                  action="S_2"
                  value={settings?.dash.actions.S_2}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'S_2', amount });
                  }}
                />
                <AmountEditor
                  action="S_3"
                  value={settings?.dash.actions.S_3}
                  onConfirm={(amount: number) => {
                    setDashAction.mutate({ key: 'S_3', amount });
                  }}
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold pl-5">Notification Settings</h1>
            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-2 justify-start text-lg col-span-2 ">
              <div className="flex flex-row items-center font-bold gap-5">
                <h1 className="font-bold w-24">Keyword</h1>

                <button
                  onClick={() =>
                    setPosFilter.mutate({
                      state: !settings?.notifications.pass_pos_filter,
                    })
                  }
                  className={`px-3 rounded-md ${
                    settings?.notifications.pass_pos_filter
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  MUST PASS POSITIVE
                </button>
                <button
                  onClick={() =>
                    setNegFilter.mutate({
                      state: !settings?.notifications.pass_neg_filter,
                    })
                  }
                  className={`px-3 rounded-md ${
                    settings?.notifications.pass_neg_filter
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  MUST PASS NEGATIVE
                </button>
              </div>

              <div className="flex flex-row gap-5 items-center">
                <h1 className="font-bold  w-24">Symbol</h1>
                <button
                  onClick={() =>
                    setSymbolMatch.mutate({ sym_match: 'MATCH_LOOKUP' })
                  }
                  className={`hover:bg-white/5 px-3 rounded-md ${
                    settings?.notifications.symbol === 'MATCH_LOOKUP'
                      ? ' outline'
                      : ''
                  }`}
                >
                  MATCH SYMBOL LIST
                </button>
                <button
                  onClick={() =>
                    setSymbolMatch.mutate({ sym_match: 'ANY_MATCH' })
                  }
                  className={`hover:bg-white/5 px-3 rounded-md ${
                    settings?.notifications.symbol === 'ANY_MATCH'
                      ? ' outline'
                      : ''
                  }`}
                >
                  ANY FOUND SYMBOL
                </button>
                <button
                  onClick={() =>
                    setSymbolMatch.mutate({ sym_match: 'NO_MATCH' })
                  }
                  className={`hover:bg-white/5 px-3 rounded-md ${
                    settings?.notifications.symbol === 'NO_MATCH'
                      ? ' outline'
                      : ''
                  }`}
                >
                  MATCH NOT REQUIRED
                </button>
              </div>
              <div className="flex flex-row gap-5  items-center">
                <h1 className="font-bold w-24">Source</h1>
                {sourceObj.map((source, index) => (
                  <label
                    key={index}
                    className="flex flex-row gap-2 items-center"
                  >
                    <input
                      type="checkbox"
                      onChange={() => void toggleFeed(source)}
                      checked={toggles.includes(source)}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <p>{source}</p>
                  </label>
                ))}
                <div />
              </div>

              <div className="flex flex-row gap-5  items-center">
                <h1 className="font-bold w-24">Amount</h1>
                <AmountEditor
                  action="B_1"
                  value={settings?.notifications.actions.B_1}
                  onConfirm={(amount: number) => {
                    setNotificationAction.mutate({ key: 'B_1', amount });
                  }}
                />
                <AmountEditor
                  action="S_1"
                  value={settings?.notifications.actions.S_1}
                  onConfirm={(amount: number) => {
                    setNotificationAction.mutate({ key: 'S_1', amount });
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl " />
                <OptionPicker
                  options={Array.from(sourceObj)}
                  selectedOption={selectedSourcePos}
                  setOption={setSelectedSourcePos}
                />
                <input
                  value={posKeyworkInput}
                  onChange={posKeywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (
                        posKeyworkInput === '' ||
                        selectedSourcePos === undefined
                      ) {
                        return;
                      }
                      // Impossible to not be source
                      void addPosKey.mutateAsync({
                        keyword: posKeyworkInput,
                        source: selectedSourcePos as source,
                      });
                      setPosKeyworkInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    if (
                      posKeyworkInput === '' ||
                      selectedSourcePos === undefined
                    )
                      return;
                    void addPosKey.mutateAsync({
                      keyword: posKeyworkInput,
                      source: selectedSourcePos as source,
                    });
                    setPosKeyworkInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
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
                    {settings?.notifications.pos_filter ? (
                      Array.from(settings.notifications.pos_filter.keys())
                        .filter((source) => {
                          if (!selectedSourcePos) {
                            return true;
                          }
                          return source === selectedSourcePos;
                        })
                        .map((source, s_index) => {
                          const keys =
                            settings.notifications.pos_filter.get(source);
                          if (!keys) return null;

                          return keys
                            .filter((keyword) => {
                              return keyword.includes(
                                posKeyworkInput.toUpperCase(),
                              );
                            })
                            .map((keyword, k_index) => {
                              return (
                                //Max 50000 keywords per symbol before repeating keys - will never happen
                                <tr
                                  key={s_index * 50000 + k_index}
                                  className="flex flex-row w-full text-white gap-5"
                                >
                                  <td className="flex text-start w-24">
                                    {source}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button
                                      onClick={() => {
                                        if (!source) return;
                                        void removePosKey.mutateAsync({
                                          keyword,
                                          source,
                                        });
                                      }}
                                      className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                        })
                    ) : (
                      <tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl " />
                <OptionPicker
                  options={Array.from(sourceObj)}
                  selectedOption={selectedSourceNeg}
                  setOption={setSelectedSourceNeg}
                />
                <input
                  value={negKeywordInput}
                  onChange={negKeywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (
                        negKeywordInput === '' ||
                        selectedSourceNeg === undefined
                      )
                        return;
                      void addNegKey.mutateAsync({
                        keyword: negKeywordInput,
                        source: selectedSourceNeg as source,
                      });
                      setNegKeywordInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    if (
                      negKeywordInput === '' ||
                      selectedSourceNeg === undefined
                    )
                      return;
                    void addNegKey.mutateAsync({
                      keyword: negKeywordInput,
                      source: selectedSourceNeg as source,
                    });
                    setNegKeywordInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
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
                    {settings?.notifications.neg_filter ? (
                      Array.from(settings.notifications.neg_filter.keys())
                        .filter((source) => {
                          if (!selectedSourceNeg) {
                            return true;
                          }
                          return source === selectedSourceNeg;
                        })
                        .map((source, s_index) => {
                          const keys =
                            settings.notifications.neg_filter.get(source);
                          if (!keys) return null;

                          return keys
                            .filter((keyword) => {
                              return keyword.includes(
                                negKeywordInput.toUpperCase(),
                              );
                            })
                            .map((keyword, k_index) => {
                              return (
                                //Max 50000 keywords per symbol before repeating keys - will never happen
                                <tr
                                  key={s_index * 50000 + k_index}
                                  className="flex flex-row w-full text-white gap-5"
                                >
                                  <td className="flex text-start w-24">
                                    {source}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button
                                      onClick={() =>
                                        void removeNegKey.mutateAsync({
                                          keyword,
                                          source,
                                        })
                                      }
                                      className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                        })
                    ) : (
                      <tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <h1 className="text-2xl font-bold pl-5 col-span-2">
              Symbol Settings
            </h1>

            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl" />
                <input
                  value={symbolInput}
                  onChange={symbolUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (symbolInput === '') return;
                      void addSym.mutateAsync({
                        symbol: symbolInput,
                      });
                      setSymbolInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    if (symbolInput === '') return;
                    void addSym.mutateAsync({
                      symbol: symbolInput,
                    });
                    setSymbolInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1">
                  <div className="flex-1 text-start">Symbol</div>
                  <button
                    className="flex-1 flex flex-row text-left justify-center items-center gap-2 hover:bg-white/5 rounded-md"
                    onClick={() => void checkSymbolStatus()}
                  >
                    <FiRefreshCcw />
                    Status
                  </button>
                  <div className="flex-1 text-end">
                    {' '}
                    Count: {settings?.symbols?.size || 0}
                  </div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {settings?.symbols ? (
                      Array.from(settings.symbols.keys())
                        .filter((symbol) => {
                          return symbol.includes(symbolInput.toUpperCase());
                        })
                        .map((symbol, index) => {
                          const sym = settings.symbols.get(symbol);
                          if (!sym) return null;
                          return (
                            <tr className="flex flex-row w-full" key={index}>
                              <td className="flex-1 text-start">{symbol}</td>
                              {sym.status === 'TRADING' ? (
                                <td className="flex flex-1 font-bold bg-green-500 rounded-full justify-center">
                                  TRADING
                                </td>
                              ) : sym.status === 'DOWN' ? (
                                <td className="flex flex-1 font-bold bg-red-500 rounded-full justify-center">
                                  DOWN
                                </td>
                              ) : (
                                <td className="flex flex-1 font-bold bg-white/50 rounded-full justify-center">
                                  {sym.status}
                                </td>
                              )}
                              <td className="flex flex-1 justify-end">
                                <button
                                  onClick={() =>
                                    void removeSym.mutateAsync({ symbol })
                                  }
                                  className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl " />
                <OptionPicker
                  options={settings ? Array.from(settings.symbols.keys()) : []}
                  selectedOption={selectedSymbol}
                  setOption={setSelectedSymbol}
                />
                <input
                  value={keywordInput}
                  onChange={keywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (keywordInput === '' || selectedSymbol === undefined)
                        return;
                      void addSymKey.mutateAsync({
                        keyword: keywordInput,
                        symbol: selectedSymbol,
                      });
                      setKeywordInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    if (keywordInput === '' || selectedSymbol === undefined)
                      return;
                    void addSymKey.mutateAsync({
                      keyword: keywordInput,
                      symbol: selectedSymbol,
                    });
                    setKeywordInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
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
                    {settings?.symbol_keys ? (
                      Array.from(settings.symbol_keys.keys())
                        .filter((symbol) => {
                          if (!selectedSymbol) {
                            return true;
                          }
                          return symbol.includes(selectedSymbol);
                        })
                        .map((symbol, s_index) => {
                          const keys = settings.symbol_keys.get(symbol);
                          if (!keys) return null;

                          return keys
                            .filter((keyword) => {
                              return keyword.includes(
                                keywordInput.toUpperCase(),
                              );
                            })
                            .map((keyword, k_index) => {
                              return (
                                //Max 50000 keywords per symbol before repeating keys - will never happen
                                <tr
                                  key={s_index * 50000 + k_index}
                                  className="flex flex-row w-full text-white gap-5"
                                >
                                  <td className="flex text-start w-24">
                                    {symbol}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button
                                      onClick={() =>
                                        void removeSymKey.mutateAsync({
                                          symbol,
                                          keyword,
                                        })
                                      }
                                      className="flex font-bold bg-red-500 hover:bg-red-400 rounded-full justify-center px-5"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                        })
                    ) : (
                      <tr className="flex flex-row w-full">
                        <td className="flex-1 text-start">Loading...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
