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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const go_1 = require("react-icons/go");
const OptionPicker = (props) => {
    const [keywordOptionPopup, setKeywordOptionPopup] = (0, react_1.useState)(false);
    const [keywordOptionInput, setKeywordOptionInput] = (0, react_1.useState)('');
    const keywordOptionUpdate = (e) => {
        setKeywordOptionInput(e.target.value);
    };
    return (<div onMouseEnter={() => setKeywordOptionPopup(true)} onMouseLeave={() => {
            setKeywordOptionPopup(false);
            setKeywordOptionInput('');
        }}>
      <button className="px-3 hover:bg-white/5 rounded-md">
        {props.selectedOption ? props.selectedOption : 'XXXXXX'}
      </button>
      {keywordOptionPopup ? (<div className="absolute h-56 w-72 bg-[#1A2335] outline outline-2 p-3 rounded-md flex flex-col gap-2">
          <div className="flex flex-row items-center gap-3">
            <go_1.GoSearch className="text-2xl"/>
            <input value={keywordOptionInput.toUpperCase()} onChange={keywordOptionUpdate} className="flex-1 bg-transparent hover:bg-white/5 min-w-0 outline outline-2 justify-right rounded-md px-2 text-right" size={1}/>
          </div>
          <div className="h-0.5 bg-white rounded-full"/>
          {props.suggestedOptions && props.suggestedOptions.length > 0
                ?
                    (<>
                <div className="flex flex-row flex-wrap text-lg font-normal">
                  {props.suggestedOptions.map((option, index) => {
                            return (<button className={`hover:bg-white/5 rounded-md px-1 ${props.selectedOption === option
                                    ? 'outline outline-2 outline-offset-[-2px]'
                                    : ''}`} key={index} onClick={() => {
                                    if (props.selectedOption === option) {
                                        props.setOption(undefined);
                                        return;
                                    }
                                    props.setOption(option);
                                }}>
                        {option}
                      </button>);
                        })}
                </div>
                <div className="h-0.5 bg-white rounded-full"/>
              </>)
                :
                    null}
          <div className="flex flex-row flex-wrap h-full text-lg font-normal overflow-auto justify-start items-start gap-2 bg-grey-light w-full">
            {props.options ? (props.options
                .filter((Option) => {
                return Option.includes(keywordOptionInput.toUpperCase());
            })
                .map((Option, index) => {
                return (<button className={`hover:bg-white/5 rounded-md px-1 ${props.selectedOption === Option
                        ? 'outline outline-2 outline-offset-[-2px]'
                        : ''}`} key={index} onClick={() => {
                        if (props.selectedOption === Option) {
                            props.setOption(undefined);
                            return;
                        }
                        props.setOption(Option);
                    }}>
                      {Option}
                    </button>);
            })) : (<td className="flex-1 text-start">Loading...</td>)}
          </div>
        </div>) : null}
    </div>);
};
exports.default = OptionPicker;
