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
const fi_1 = require("react-icons/fi");
const formatNumber_1 = require("../utils/formatNumber");
const AmountEditor = ({ value, action, onConfirm, children }) => {
    const [editable, setEditable] = (0, react_1.useState)(false);
    const [input, setInput] = (0, react_1.useState)('');
    const inputUpdate = (e) => {
        setInput(e.target.value);
    };
    const resetEditor = () => {
        setEditable(false);
        setInput('');
    };
    const onCheck = () => {
        if (!(0, formatNumber_1.isNumeric)(input)) {
            return;
        }
        onConfirm(parseFloat(input));
        resetEditor();
    };
    return (<div className={`flex flex-row items-center gap-3 rounded-md px-3 py-2 font-bold ${action.includes('B') ? 'bg-green-500' : 'bg-red-500'}`} onMouseLeave={resetEditor}>
      {action + ' : '}
      {editable ? (<>
          <input value={input} onChange={inputUpdate} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onCheck();
                }
            }} className="bg-transparent hover:bg-white/5 min-w-0 outline outline-2 outline-offset-[-2px] justify-right rounded-md px-2 text-right text-lg"/>
          <button className="hover:bg-white/30 rounded-md  p-2" onClick={() => onCheck()}>
            <fi_1.FiCheck />
          </button>
          <button className="hover:bg-white/30 rounded-md  p-2" onClick={resetEditor}>
            <fi_1.FiX />
          </button>
        </>) : (<>
          <p>{value === null || value === void 0 ? void 0 : value.toLocaleString()} USDT</p>
          <button className="hover:bg-white/30 rounded-md p-2" onClick={() => setEditable(true)}>
            <fi_1.FiEdit2 />
          </button>
        </>)}
    </div>);
};
exports.default = AmountEditor;
