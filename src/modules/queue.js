import quiz from './queue.quiz.js';
import {operation,traceBuilder,copy,format,aux} from '../core/contracts.js';
const support=`#include <iostream>
#include <optional>

struct QueueNode {
    int value;
    QueueNode* next;
};
struct Queue {
    QueueNode* front = nullptr;
    QueueNode* rear = nullptr;
    Queue() = default;
    Queue(const Queue&) = delete;
    Queue& operator=(const Queue&) = delete;
    ~Queue() {
        while (front != nullptr) {
            QueueNode* old = front;
            front = front->next;
            delete old;
        }
    }
};`;
const operations={
 enqueue:operation('Enqueue','integer',`
void enqueue(Queue& q, int value) {
    QueueNode* node = new QueueNode{value, nullptr}; // @allocate
    if (q.rear == nullptr) q.front = node; // @empty
    else q.rear->next = node; // @link
    q.rear = node; // @rear
}`,'FIFO: thêm tại rear. Khi queue rỗng, front và rear cùng trỏ tới node mới.'),
 dequeue:operation('Dequeue','none',`
std::optional<int> dequeue(Queue& q) {
    if (q.front == nullptr) return std::nullopt; // @empty
    QueueNode* old = q.front; // @save
    int value = old->value; // @value
    q.front = old->next; // @front
    if (q.front == nullptr) q.rear = nullptr; // @rear
    delete old; // @free
    return value; // @done
}`,'Lấy node tại front. Xóa phần tử cuối phải đưa cả front và rear về nullptr.','Dự đoán giá trị lấy ra, front và rear mới.'),
 front:operation('Front','none',`
std::optional<int> front(const Queue& q) {
    if (q.front == nullptr) return std::nullopt; // @empty
    return q.front->value; // @done
}`,'Xem phần tử sẽ được lấy ra tiếp theo, không thay đổi queue.','Dự đoán giá trị ở front.'),
 rear:operation('Rear','none',`
std::optional<int> rear(const Queue& q) {
    if (q.rear == nullptr) return std::nullopt; // @empty
    return q.rear->value; // @done
}`,'Xem phần tử được thêm cuối cùng, không thay đổi queue.','Dự đoán giá trị ở rear.'),
 traverse:operation('Traverse','none',`
void traverse(const Queue& q) {
    QueueNode* current = q.front; // @start
    while (current != nullptr) { // @check
        std::cout << current->value << " "; // @visit
        current = current->next; // @move
    }
}`,'Duyệt theo thứ tự phục vụ: front tới rear.','Dự đoán thứ tự front → rear.')
};
function createState(empty=false){const nodes=empty?[]:[12,24,36].map((value,id)=>({id:id+1,value}));return {nodes,nextId:4,front:nodes[0]?.id??null,rear:nodes.at(-1)?.id??null};}
function generate(original,key,value){
 const state=copy(original),nodes=state.nodes,t=traceBuilder(operations[key]);
 const first=()=>nodes.length?[nodes[0].id]:[],last=()=>nodes.length?[nodes.at(-1).id]:[];
 if(key==='enqueue'){
  const node={id:state.nextId++,value},wasEmpty=!nodes.length;
  t.add(state,'allocate','Cấp phát node có next là nullptr.',{pending:node});
  t.add(state,'empty',wasEmpty?'rear là nullptr: front sẽ trỏ tới node mới.':'rear khác nullptr: nối sau rear.',{pending:node,active:last()});
  nodes.push(node);
  if(wasEmpty)state.front=node.id;
  t.add(state,wasEmpty?'empty':'link',wasEmpty?'front trỏ tới node đầu tiên.':'rear->next nối tới node mới.',{active:[node.id]});
  state.rear=node.id;
  t.add(state,'rear','rear cập nhật tới node mới.',{active:last()});
  return t.finish(state,'Queue: '+format(nodes.map(n=>n.value)),aux('O(1)','O(1)'));
 }
 if(key==='dequeue'||key==='front'||key==='rear'){
  const active=key==='rear'?last():first();
  t.add(state,'empty',nodes.length?'Queue có phần tử: pointer có thể đọc.':'Queue rỗng: trả về std::nullopt.',{active});
  if(!nodes.length)return t.finish(state,'Queue rỗng: std::nullopt',aux('O(1)','O(1)'));
  const node=key==='rear'?nodes.at(-1):nodes[0];
  if(key!=='dequeue'){t.add(state,'done','Đọc '+node.value+'; queue không thay đổi.',{active});return t.finish(state,(key==='rear'?'Rear: ':'Front: ')+node.value,aux('O(1)','O(1)'));}
  t.add(state,'save','Lưu old tại front.',{active:first()});
  t.add(state,'value','Giữ giá trị '+node.value+' trước khi giải phóng.',{active:first()});
  nodes.shift();state.front=nodes[0]?.id??null;
  t.add(state,'front','front chuyển tới old->next.',{active:first(),removed:node});
  if(!nodes.length)state.rear=null;
  t.add(state,'rear',nodes.length?'front còn node: giữ nguyên rear.':'front là nullptr: rear cũng phải là nullptr.',{active:last(),removed:node});
  t.add(state,'free','delete old: giải phóng node đã lấy ra.');
  t.add(state,'done','Trả về '+node.value+'.',{active:first()});
  return t.finish(state,'Đã dequeue: '+node.value+' · Queue: '+format(nodes.map(n=>n.value)),aux('O(1)','O(1)'));
 }
 const output=[];
 t.add(state,'start','current bắt đầu tại front.',{active:first()});
 for(let i=0;i<nodes.length;i++){
  t.add(state,'check','current khác nullptr: tiếp tục.',{active:[nodes[i].id],output});
  output.push(nodes[i].value);
  t.add(state,'visit','In '+nodes[i].value+' theo FIFO.',{active:[nodes[i].id],output});
  t.add(state,'move','Theo next tới node sau.',{active:i<nodes.length-1?[nodes[i+1].id]:[],output});
 }
 t.add(state,'check','Đã đến nullptr: kết thúc.',{output});
 return t.finish(state,'Thứ tự duyệt: '+format(output),aux('O(n)','O(1)','Không tính đầu ra.'));
}
export default {quiz,id:'queue',name:'Queue',tag:'FIFO · vào trước, ra trước',kind:'queue',mental:'Hình dung hàng chờ: thêm ở rear và phục vụ ở front. Một phần tử thì front và rear cùng trỏ tới nó.',support,operations,createState,generate,values:s=>s.nodes.map(n=>n.value)};
