/**
 * Shared contract: module.createState(), module.operations, module.generate()
 * Every frame owns an immutable snapshot, a C++ source-line index, and a reason.
 */
export function cpp(source) {
  const marks = {};
  const lines = source.trim().split('\n').map((raw, index) => {
    const match = raw.match(/\s*\/\/ @(\w+)\s*$/);
    if (match) {
      if (marks[match[1]] !== undefined) throw new Error('Duplicate C++ line marker: '+match[1]);
      marks[match[1]] = index;
    }
    return raw.replace(/\s*\/\/ @\w+\s*$/, '');
  });
  return {lines, marks};
}
export const copy = value => structuredClone(value);
export function traceBuilder(operation) {
  const frames=[];
  return {
    frames,
    add(state, mark, message, extras={}) {
      const line=operation.code.marks[mark];
      if(line===undefined) throw new Error('Missing C++ line marker: '+mark);
      frames.push(copy({state,line,message,active:[],output:[],...extras}));
    },
    finish(state, result, complexity) {
      if(!frames.length) throw new Error('An operation must explain at least one step.');
      return {frames,final:copy(state),result,complexity};
    }
  };
}
export function integer(text) {
  if(!/^[+-]?\d+$/.test(String(text).trim())) throw new Error('Nhập một số nguyên thập phân hợp lệ.');
  const value=Number(text);
  if(!Number.isSafeInteger(value)||value<-2147483648||value>2147483647) throw new Error('Giá trị phải nằm trong phạm vi int C++: −2147483648 đến 2147483647.');
  return value;
}
export function integers(text) {
  if(!String(text).trim()) return [];
  if(/(^,|,$|,\s*,)/.test(String(text).trim())) throw new Error('Mảng không được có phần tử trống giữa các dấu phẩy.');
  const tokens=String(text).split(/[,\s]+/).filter(Boolean);
  if(tokens.length>128) throw new Error('Heapify hỗ trợ tối đa 128 giá trị trong một bài mô phỏng.');
  return tokens.map(integer);
}
export function inputFor(operation,text) {
  return operation.input==='integer'?integer(text):operation.input==='array'?integers(text):undefined;
}
export function operation(label,input,source,mental,predict) {
  return {label,input,code:cpp(source),mental,predict:predict||'Dự đoán kết quả và thứ tự các giá trị.'};
}
export function format(values) {return values.length?values.join(', '):'rỗng';}
export const aux = (time,space,note='')=>({time,space,note});
