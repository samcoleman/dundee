import React, {
  type SetStateAction,
  useState,
  type PropsWithChildren,
} from 'react';
import { GoSearch } from 'react-icons/go';
import { type source } from '../shared/types';

// Would be nice with templates
type OptionPickerProps = PropsWithChildren<{
  options?: string[];
  suggestedOptions?: string[];
  selectedOption: source | string | undefined;
  setOption: (value: SetStateAction<source | string | undefined>) => void;
}>;

const OptionPicker = (props: OptionPickerProps) => {
  const [keywordOptionPopup, setKeywordOptionPopup] = useState(false);

  const [keywordOptionInput, setKeywordOptionInput] = useState('');
  const keywordOptionUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordOptionInput(e.target.value);
  };

  return (
    <div
      onMouseEnter={() => setKeywordOptionPopup(true)}
      onMouseLeave={() => {
        setKeywordOptionPopup(false);
        setKeywordOptionInput('');
      }}
    >
      <button className="px-3 hover:bg-white/5 rounded-md">
        {props.selectedOption ? props.selectedOption : 'XXXXXX'}
      </button>
      {keywordOptionPopup ? (
        <div className="absolute h-56 w-72 bg-[#1A2335] outline outline-2 p-3 rounded-md flex flex-col gap-2">
          <div className="flex flex-row items-center gap-3">
            <GoSearch className="text-2xl" />
            <input
              value={keywordOptionInput.toUpperCase()}
              onChange={keywordOptionUpdate}
              className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right"
              size={1}
            />
          </div>
          <div className="h-0.5 bg-white rounded-full" />
          {props.suggestedOptions && props.suggestedOptions.length > 0 ? (
            <>
              <div className="flex flex-row flex-wrap text-lg font-normal">
                {props.suggestedOptions.map((option, index) => {
                  return (
                    <button
                      className={`hover:bg-white/5 rounded-md px-1 ${
                        props.selectedOption === option
                          ? 'outline outline-2 outline-offset-[-2px]'
                          : ''
                      }`}
                      key={index}
                      onClick={() => {
                        if (props.selectedOption === option) {
                          props.setOption(undefined);
                          return;
                        }
                        props.setOption(option);
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="h-0.5 bg-white rounded-full" />
            </>
          ) : null}
          <div className="flex flex-row flex-wrap h-full text-lg font-normal overflow-auto justify-start items-start gap-2 bg-grey-light w-full">
            {props.options ? (
              props.options
                .filter((Option) => {
                  return Option.includes(keywordOptionInput.toUpperCase());
                })
                .map((Option, index) => {
                  return (
                    <button
                      className={`hover:bg-white/5 rounded-md px-1 ${
                        props.selectedOption === Option
                          ? 'outline outline-2 outline-offset-[-2px]'
                          : ''
                      }`}
                      key={index}
                      onClick={() => {
                        if (props.selectedOption === Option) {
                          props.setOption(undefined);
                          return;
                        }
                        props.setOption(Option);
                      }}
                    >
                      {Option}
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

export default OptionPicker;
