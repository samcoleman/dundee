import React, { type SetStateAction, useState } from 'react';
import { GoSearch } from 'react-icons/go';
import { type sym } from 'server/api/routers/settings';

type SymbolPickerProps = {
  symbols?: sym[];
  selectedSymbol: string;
  setSymbol: (value: SetStateAction<string>) => void;
};

const SymbolPicker: React.FC<SymbolPickerProps> = (
  props: SymbolPickerProps,
) => {
  const [keywordSymbolPopup, setKeywordSymbolPopup] = useState(false);

  const [keywordSymbolInput, setKeywordSymbolInput] = useState('');
  const keywordSymbolUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordSymbolInput(e.target.value);
  };

  return (
    <div
      onMouseEnter={() => setKeywordSymbolPopup(true)}
      onMouseLeave={() => {
        setKeywordSymbolPopup(false);
        setKeywordSymbolInput('')
      }}
    >
      <button className="px-3 hover:bg-white/5 rounded-md">
        {props.selectedSymbol === '' ? 'XXXXXX' : props.selectedSymbol}
      </button>
      {keywordSymbolPopup ? (
        <div className="absolute h-56 w-72 bg-[#1A2335] outline outline-2 p-3 rounded-md flex flex-col gap-4">
          <div className="flex flex-row items-center gap-3">
            <GoSearch className="text-2xl" />
            <input
              value={keywordSymbolInput}
              onChange={keywordSymbolUpdate}
              className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
              size={1}
            />
          </div>
          <div className="h-0.5 bg-white rounded-full" />
          <div className="flex flex-row flex-wrap h-full overflow-auto justify-start items-start gap-2 bg-grey-light w-full">
            {props.symbols ? (
              props.symbols
                .filter((symbol) => {
                  return symbol.symbol.includes(
                    keywordSymbolInput.toUpperCase(),
                  );
                })
                .map((symbol, index) => {
                  return (
                    <button
                      className={`hover:bg-white/5 rounded-md px-1 ${
                        props.selectedSymbol === symbol.symbol
                          ? 'outline outline-2 outline-offset-[-2px]'
                          : ''
                      }`}
                      key={index}
                      onClick={() => {
                        if (props.selectedSymbol === symbol.symbol) {
                          props.setSymbol('');
                          return;
                        }
                        props.setSymbol(symbol.symbol);
                      }}
                    >
                      {symbol.symbol}
                    </button>
                  );
                })
            ) : (
              <td className="flex-1 text-start">Loading...</td>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SymbolPicker;
