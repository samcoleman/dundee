import React, { PropsWithChildren, useState } from 'react';
import { FiCheck, FiEdit2, FiX } from 'react-icons/fi';

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
    function isNumeric(str: string) {
      if (typeof str != 'string') return false; // we only process strings!
      return (
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
      ); // ...and ensure strings of whitespace fail
    }

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
