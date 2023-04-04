import Head from 'next/head';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { GiWillowTree } from 'react-icons/gi';
import { GoTerminal, GoSearch } from 'react-icons/go';
import { FiRefreshCcw } from 'react-icons/fi';

import { type feeds } from 'server/api/routers/settings';
import SymbolPicker from 'components/symbolPicker';


const IndexPage = () => {
  const { data: settings, refetch: settingsRefetch } =
    api.settings.getSettings.useQuery();

  const [toggles, setToggles] = useState<feeds[]>([]);

  const [keywordCount, setKeywordCount] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const [keywordSymbolPopup, setKeywordSymbolPopup] = useState(false);

  const [socketStatus, setSocketStatus] = useState(true);
  const [binanceStatus, setBinanceStatus] = useState(true);

  const [symbolInput, setSymbolInput] = useState('');
  const symbolUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolInput(e.target.value);
  };

  const [keywordInput, setKeywordInput] = useState('');
  const keywordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value);
  };

  const [keywordSymbolInput, setkeywordSymbolInput] = useState('');
  const keywordSymbolUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setkeywordSymbolInput(e.target.value);
  };

  const [negativeKeywordInput, setNegativeKeywordInput] = useState('');
  const negativeKeywordUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNegativeKeywordInput(e.target.value);
  };

  const addFeed = api.settings.addFeed.useMutation();
  const removeFeed = api.settings.removeFeed.useMutation();
  const toggleFeed = async (feed: feeds) => {
    if (settings?.feeds.includes(feed)) {
      const res = await removeFeed.mutateAsync({ feed });
    } else {
      const res = await addFeed.mutateAsync({ feed });
    }
    void settingsRefetch();
  };

  const addSym = api.settings.addSymbol.useMutation();
  const addSymbol = async (symbol: string) => {
    if (symbol === '') return;

    const res = await addSym.mutateAsync({ symbol });
    void settingsRefetch();
  };

  const removeSym = api.settings.removeSymbol.useMutation();
  const removeSymbol = async (symbol: string) => {
    if (symbol === '') return;

    const res = await removeSym.mutateAsync({ symbol });
    void settingsRefetch();
  };

  const addKey = api.settings.addKeyword.useMutation();
  const addKeyword = async (symbol: string, keyword: string) => {
    if (symbol === '' || keyword === '') return;

    const res = await addKey.mutateAsync({ symbol, keyword });
    void settingsRefetch();
  };

  const removeKey = api.settings.removeKeyword.useMutation();
  const removeKeyword = async (symbol: string, keyword: string) => {
    //if (symbol === '' || keyword === '') return;

    const res = await removeKey.mutateAsync({ symbol, keyword });
    void settingsRefetch();
  };

  const addNegativeKey = api.settings.addNegativeKeyword.useMutation();
  const addNegativeKeyword = async (negativeKeyword: string) => {
    if (negativeKeyword === '') return;

    const res = await addNegativeKey.mutateAsync({ negativeKeyword });
    void settingsRefetch();
  };
  const removeNegativeKey = api.settings.removeNegativeKeyword.useMutation();
  const removeNegativeKeyword = async (negativeKeyword: string) => {
    if (negativeKeyword === '') return;

    const res = await removeNegativeKey.mutateAsync({ negativeKeyword });
    void settingsRefetch();
  };

  const checkSymbols = api.binance.checkSymbols.useMutation();
  const updateSymbols = api.settings.updateSymbols.useMutation();
  const checkSymbolStatus = async () => {
    if (!settings) return;
    const res = await checkSymbols.mutateAsync(settings.symbols);
    await updateSymbols.mutateAsync(res);
    void settingsRefetch();
  };

  
  const bStatus = api.binance.status.useMutation();
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res2 = await bStatus.mutateAsync();
        setBinanceStatus(true);
      } catch (e) {
        setBinanceStatus(false);
      }
    };
    void checkSymbolStatus();
    const interval = setInterval(() => {
      void checkStatus();
    }, 10000 * 6);
    return () => clearInterval(interval);
  }, []);

  // create a timer for ever 10 seconds in useEffect
  useEffect(() => {
    setToggles(settings?.feeds || []);

    let keywords = 0;
    settings?.symbols?.forEach((symbol) => {
      keywords += symbol.keywords.length;
    });
    setKeywordCount(keywords);
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
          <h1 className="text-2xl font-bold pl-5">Settings</h1>
          <div className="flex flex-col bg-white/5 rounded-md p-5 gap-2 justify-start">
            <div className="flex flex-row text-lg gap-5">
              <h1 className="font-bold">Notification Feeds</h1>
              <label className="flex flex-row gap-2 items-center">
                <input
                  type="checkbox"
                  onChange={() => void toggleFeed('BLOGS')}
                  checked={toggles.includes('BLOGS')}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <p>Blogs</p>
              </label>
              <label className="flex flex-row gap-2 items-center">
                <input
                  type="checkbox"
                  id="twitter"
                  onChange={() => void toggleFeed('TWITTER')}
                  checked={toggles.includes('TWITTER')}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <p>Twitter</p>
              </label>
              <label className="flex flex-row gap-2 items-center">
                <input
                  type="checkbox"
                  onChange={() => void toggleFeed('TELEGRAM')}
                  checked={toggles.includes('TELEGRAM')}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <p>Telegram</p>
              </label>
              <label className="flex flex-row gap-2 items-center">
                <input
                  type="checkbox"
                  onChange={() => void toggleFeed('UNKNOWN')}
                  checked={toggles.includes('UNKNOWN')}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <p>Unknown</p>
              </label>
              <div />
            </div>
          </div>
          
          <div className="grid-cols-2 grid gap-5">
            <div className="flex flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl" />
                <input
                  value={symbolInput}
                  onChange={symbolUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void addSymbol(symbolInput);
                      setSymbolInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    void addSymbol(symbolInput);
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
                    Count: {settings?.symbols?.length}
                  </div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {settings?.symbols ? (
                      settings.symbols
                        .filter((symbol) => {
                          return symbol.symbol.includes(
                            symbolInput.toUpperCase(),
                          );
                        })
                        .map((symbol, index) => {
                          return (
                            <tr className="flex flex-row w-full" key={index}>
                              <td className="flex-1 text-start">
                                {symbol.symbol}
                              </td>
                              {symbol.status === 'TRADING' ? (
                                <td className="flex flex-1 font-bold bg-green-500 rounded-full justify-center">
                                  TRADING
                                </td>
                              ) : symbol.status === 'DOWN' ? (
                                <td className="flex flex-1 font-bold bg-red-500 rounded-full justify-center">
                                  DOWN
                                </td>
                              ) : (
                                <td className="flex flex-1 font-bold bg-white/50 rounded-full justify-center">
                                  {symbol.status}
                                </td>
                              )}
                              <td className="flex flex-1 justify-end">
                                <button
                                  onClick={() =>
                                    void removeSymbol(symbol.symbol)
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
              <div className="flex flex-row  gap-3">
                <GoSearch className="text-2xl " />
                <SymbolPicker symbols={settings?.symbols} selectedSymbol={selectedSymbol} setSymbol={setSelectedSymbol} />
                <input
                  value={keywordInput}
                  onChange={keywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void addKeyword(selectedSymbol, keywordInput);
                      setKeywordInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    void addKeyword(selectedSymbol, keywordInput);
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
                  <div className="text-end"> Count : {keywordCount}</div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {settings?.symbols ? (
                      settings.symbols
                        .filter((symbol) => {
                          if (selectedSymbol === '') {
                            return true;
                          }
                          return symbol.symbol.includes(selectedSymbol);
                        })
                        .map((symbol, s_index) => {
                          return symbol.keywords
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
                                    {symbol.symbol}
                                  </td>
                                  <td className="flex-1 text-start ">
                                    {keyword}
                                  </td>
                                  <td className="flex justify-end">
                                    <button
                                      onClick={() =>
                                        void removeKeyword(
                                          symbol.symbol,
                                          keyword,
                                        )
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

            <div className="flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl " />
                <input
                  value={negativeKeywordInput}
                  onChange={negativeKeywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void addNegativeKeyword(negativeKeywordInput);
                      setNegativeKeywordInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    void addNegativeKeyword(negativeKeywordInput);
                    setNegativeKeywordInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1">
                  <div className="flex-1 text-start">Negative Keyword</div>
                  <div className="flex-1 text-end">
                    {' '}
                    Count: {settings?.negativeKeywords?.length}
                  </div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {settings?.negativeKeywords ? (
                      settings.negativeKeywords
                        .filter((negativeKeyword) => {
                          return negativeKeyword.includes(
                            negativeKeywordInput.toUpperCase(),
                          );
                        })
                        .map((keyword, index) => {
                          return (
                            <tr
                              key={index}
                              className="flex flex-row w-full text-white"
                            >
                              <td className="flex-1 text-start">{keyword}</td>
                              <td className="flex justify-end">
                                <button
                                  onClick={() =>
                                    void removeNegativeKeyword(keyword)
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

            <div className="flex flex-1 flex-col bg-white/5 rounded-md p-5 gap-5 justify-start h-96">
              <div className="flex flex-row items-center gap-3">
                <GoSearch className="text-2xl " />
                <SymbolPicker symbols={settings?.symbols} selectedSymbol={selectedSymbol} setSymbol={setSelectedSymbol} />
                <input
                  value={negativeKeywordInput}
                  onChange={negativeKeywordUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void addNegativeKeyword(negativeKeywordInput);
                      setNegativeKeywordInput('');
                    }
                  }}
                  className="flex-1 text-lg bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
                  size={1}
                />
                <button
                  onClick={() => {
                    void addNegativeKeyword(negativeKeywordInput);
                    setNegativeKeywordInput('');
                  }}
                  className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-400"
                >
                  ADD
                </button>
              </div>
              <div className="flex flex-1 flex-col h-full">
                <div className="flex flex-row w-full text-white px-3 bg-white/5 rounded-md mb-1">
                  <div className="flex-1 text-start">Symbol</div>
                  <div className="flex-1 text-start">Keyword</div>
                  <div className="flex-1 text-start">Sources</div>
                  <div className="flex-1 text-end">
                    {' '}
                    Count: {settings?.negativeKeywords?.length}
                  </div>
                </div>
                <table className="text-left w-full h-full">
                  <tbody className="bg-grey-light flex h-full gap-1 flex-col overflow-auto w-full px-3">
                    {settings?.negativeKeywords ? (
                      settings.negativeKeywords
                        .filter((negativeKeyword) => {
                          return negativeKeyword.includes(
                            negativeKeywordInput.toUpperCase(),
                          );
                        })
                        .map((keyword, index) => {
                          return (
                            <tr
                              key={index}
                              className="flex flex-row w-full text-white"
                            >
                              <td className="flex-1 text-start">BNBUSDT</td>
                              <td className="flex-1 text-start">CZ_BINANCE</td>
                              <td className="flex-1 text-start">TWITTER</td>
                              <td className="flex-1 flex justify-end">
                                <button
                                  onClick={() =>
                                    void removeNegativeKeyword(keyword)
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


          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
