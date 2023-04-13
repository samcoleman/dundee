import React, { PropsWithChildren, useState } from 'react';
import { FiCheck, FiEdit2, FiX } from 'react-icons/fi';
import { isNumeric } from '../utils/formatNumber';

// Would be nice with templates
type amountEditor = PropsWithChildren<{
  value?: number;
  action: string;
  onConfirm: (amount: number) => void;
}>;

const AmountEditor = ({ value, action, onConfirm, children }: amountEditor) => {
  const [editable, setEditable] = useState(false);

  const [input, setInput] = useState('');
  const inputUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const resetEditor = () => {
    setEditable(false);
    setInput('');
  };

  const onCheck = () => {
    if (!isNumeric(input)) {
      return;
    }

    onConfirm(parseFloat(input));
    resetEditor()
  };

  return (
    <div
      className={`flex flex-row items-center gap-3 rounded-md px-3 py-2 font-bold ${action.includes('B') ? 'bg-green-500' : 'bg-red-500'}`}
      onMouseLeave={resetEditor}
    >
      {action + ' : '}
      {editable ? (
        <>
          <input
            value={input}
            onChange={inputUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCheck();
              }
            }}
            className="bg-transparent hover:bg-white/5 min-w-0 outline outline-2 outline-offset-[-2px] justify-right rounded-md px-2 text-right text-lg"
          />
          <button
            className="hover:bg-white/30 rounded-md  p-2"
            onClick={() => onCheck()}
          >
            <FiCheck />
          </button>
          <button
            className="hover:bg-white/30 rounded-md  p-2"
            onClick={resetEditor}
          >
            <FiX />
          </button>
        </>
      ) : (
        <>
          <p>{value?.toLocaleString()} USDT</p>
          <button
            className="hover:bg-white/30 rounded-md p-2"
            onClick={() => setEditable(true)}
          >
            <FiEdit2 />
          </button>
        </>
      )}
    </div>
  );
};

export default AmountEditor;
