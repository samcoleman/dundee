// Code golf shit to convert number to 1K , 1M etc
export function formatNumber(num: number | undefined, dec: number) {
  if (num === undefined) return '';
  let x = ('' + num).length;
  const d = Math.pow(10, dec);
  x -= x % 3;
  return Math.round((num * d) / Math.pow(10, x)) / d + ' kMGTPE'[x / 3];
}



export function isNumeric(str: string) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}