import quiz from './stack.quiz.js';
import {operation,traceBuilder,copy,format,aux} from '../core/contracts.js';
const support=`#include <iostream>
#include <optional>
#include <cstddef>

struct StackNode {
    int value;
    StackNode* next;
};
struct Stack {
    StackNode* top = nullptr;
    std::size_t size = 0;
    std::optional<std::size_t> capacity = std::nullopt;
    Stack() = default;
    Stack(const Stack&) = delete;
    Stack& operator=(const Stack&) = delete;
    ~Stack() {
        while (top != nullptr) {
            StackNode* old = top;
            top = top->next;
            delete old;
        }
    }
};`;
const operations={
 push:operation('Push','integer',`
bool push(Stack& s, int value) {
    if (s.capacity && s.size >= *s.capacity) return false; // @capacity
    StackNode* node = new StackNode{value, s.top}; // @allocate
    s.top = node; // @top
    ++s.size; // @size
    return true; // @done
}`,'LIFO: node mới nối tới top cũ rồi trở thành top. Chỉ báo overflow khi bật capacity.'),
 pop:operation('Pop','none',`
std::optional<int> pop(Stack& s) {
    if (s.top == nullptr) return std::nullopt; // @empty
    StackNode* old = s.top; // @save
    int value = old->value; // @value
    s.top = old->next; // @top
    delete old; // @free
    --s.size; // @size
    return value; // @done
}`,'Lấy phần tử trên cùng. Stack rỗng trả về std::nullopt, không đọc pointer rỗng.','Dự đoán giá trị lấy ra và top mới.'),
 peek:operation('Peek / Top','none',`
std::optional<int> peek(const Stack& s) {
    if (s.top == nullptr) return std::nullopt; // @empty
    return s.top->value; // @done
}`,'Đọc top mà không loại bỏ phần tử.','Dự đoán top hiện tại; stack có thay đổi không?'),
 traverse:operation('Traverse','none',`
void traverse(const Stack& s) {
    StackNode* current = s.top; // @start
    while (current != nullptr) { // @check
        std::cout << current->value << " "; // @visit
        current = current->next; // @move
    }
}`,'Duyệt từ top xuống đáy theo next.','Dự đoán thứ tự in từ top xuống đáy.')
};
function createState(empty=false,config={}){const sample=[12,24,36].slice(0,config.capacityEnabled?config.capacity:3);const nodes=empty?[]:sample.map((value,id)=>({id:id+1,value}));return {nodes,nextId:4,size:nodes.length};}
function configure(state,config){
 if(config.capacityEnabled&&(!Number.isInteger(config.capacity)||config.capacity<1||config.capacity>10000))throw new Error('Capacity phải là số nguyên từ 1 đến 10000.');
 if(config.capacityEnabled&&state.nodes.length>config.capacity)throw new Error('Capacity không thể nhỏ hơn số phần tử hiện tại.');
 return state;
}
function generate(original,key,value,config={capacityEnabled:false,capacity:8}){
 configure(original,config);
 const state=copy(original),t=traceBuilder(operations[key]),nodes=state.nodes;
 const top=()=>nodes.length?[nodes.at(-1).id]:[];
 if(key==='push'){
  const full=config.capacityEnabled&&nodes.length>=config.capacity;
  t.add(state,'capacity',full?'Capacity đã đầy: trả về false, không cấp phát node.':config.capacityEnabled?'Còn chỗ trong capacity.':'Capacity tắt: stack tăng theo nhu cầu.');
  if(full)return t.finish(state,'Stack overflow: capacity '+config.capacity+' đã đầy.',aux('O(1)','O(1)'));
  const node={id:state.nextId++,value};
  t.add(state,'allocate','Node mới giữ next là top cũ.',{pending:node});
  nodes.push(node);
  t.add(state,'top','top chuyển tới node mới.',{active:top()});
  state.size++;
  t.add(state,'size','Tăng số phần tử thành '+nodes.length+'.',{active:top()});
  t.add(state,'done','Push hoàn tất.',{active:top()});
  return t.finish(state,'Top: '+value+' · Stack (đáy → top): '+format(nodes.map(n=>n.value)),aux('O(1)','O(1)'));
 }
 if(key==='pop'||key==='peek'){
  t.add(state,'empty',nodes.length?'top khác nullptr: có thể đọc.':'Stack rỗng: trả về std::nullopt.',{active:top()});
  if(!nodes.length)return t.finish(state,'Stack rỗng: std::nullopt',aux('O(1)','O(1)'));
  const old=nodes.at(-1);
  if(key==='peek'){t.add(state,'done','Đọc '+old.value+' tại top; stack không đổi.',{active:top()});return t.finish(state,'Top: '+old.value,aux('O(1)','O(1)'));}
  t.add(state,'save','Lưu pointer old để giải phóng sau.',{active:top()});
  t.add(state,'value','Giữ giá trị '+old.value+' trước khi xóa node.',{active:top()});
  nodes.pop();
  t.add(state,'top',nodes.length?'top chuyển xuống node tiếp theo.':'Phần tử cuối đã tách: top là nullptr.',{active:top(),removed:old});
  t.add(state,'free','delete old: giải phóng node vừa lấy ra.');
  state.size--;
  t.add(state,'size','Giảm số phần tử thành '+nodes.length+'.');
  t.add(state,'done','Trả về '+old.value+'.',{active:top()});
  return t.finish(state,'Đã pop: '+old.value+' · Top mới: '+(nodes.at(-1)?.value??'nullptr'),aux('O(1)','O(1)'));
 }
 const output=[];
 t.add(state,'start','current bắt đầu tại top.',{active:top()});
 for(let i=nodes.length-1;i>=0;i--){
  t.add(state,'check','current khác nullptr: còn phần tử.',{active:[nodes[i].id],output});
  output.push(nodes[i].value);
  t.add(state,'visit','In '+nodes[i].value+' từ top xuống đáy.',{active:[nodes[i].id],output});
  t.add(state,'move','Theo next xuống phần tử dưới.',{active:i?[nodes[i-1].id]:[],output});
 }
 t.add(state,'check','current là nullptr: đã đến đáy.',{output});
 return t.finish(state,'Thứ tự duyệt: '+format(output),aux('O(n)','O(1)','Không tính đầu ra.'));
}
export default {quiz,id:'stack',name:'Stack',tag:'LIFO · vào sau, ra trước',kind:'stack',mental:'Hình dung chồng sách: chỉ thêm, lấy và xem ở đỉnh. top luôn trỏ tới phần tử được thêm sau cùng.',support,operations,createState,generate,configure,settings:[{key:'capacityEnabled',type:'boolean',label:'Bật capacity'},{key:'capacity',type:'integer',label:'Capacity',when:'capacityEnabled'}],defaultConfig:{capacityEnabled:false,capacity:8},values:s=>s.nodes.map(n=>n.value)};
