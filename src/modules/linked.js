import quiz from './linked.quiz.js';
import {operation,traceBuilder,copy,format,aux} from '../core/contracts.js';
export const address=id=>id==null?'NULL':'0x'+(id*16+15).toString(16).toUpperCase();
const support=`#include <iostream>
#include <vector>

struct Node {
    int Info;
    Node* pNext;
};
struct LIST {
    Node* pHead;
    Node* pTail;
};`;
const nodeCode=`Node* CreateNode(int x) {
    Node* p = new Node; // @allocate
    p->Info = x; // @info
    p->pNext = nullptr; // @next
    return p; // @created
}`;
const initialize=`void CreateList(LIST &l) {
    l.pHead = nullptr; // @head
    l.pTail = nullptr; // @tail
}`;
const operations={
 head:operation('Insert Head','integer',nodeCode+`

void InsertHead(LIST &l, int x) {
    Node* p = CreateNode(x); // @create
    if (l.pHead == nullptr) { // @empty
        l.pHead = p; // @head
        l.pTail = p; // @tail
    } else {
        p->pNext = l.pHead; // @link
        l.pHead = p; // @attach
    }
}`,'Node mới nằm ngoài list. Nối p->pNext tới đầu cũ trước, rồi đổi pHead.','pHead và pTail thay đổi thế nào?'),
 tail:operation('Insert Tail','integer',nodeCode+`

void InsertTail(LIST &l, int x) {
    Node* p = CreateNode(x); // @create
    if (l.pHead == nullptr) { // @empty
        l.pHead = p; // @head
        l.pTail = p; // @tail
    } else {
        l.pTail->pNext = p; // @link
        l.pTail = p; // @attach
    }
}`,'LIST giữ pTail: nối pTail->pNext tới node mới, sau đó chuyển pTail.','pTail->pNext và pTail sẽ chứa địa chỉ nào?'),
 createList:operation('Khởi tạo danh sách','none',initialize+`

// Don dep node cu truoc khi khoi tao lai trong lab.
void ResetList(LIST &l, std::vector<Node*>& independent) {
    while (l.pHead != nullptr) { // @clearCheck
        Node* p = l.pHead; // @clearSave
        l.pHead = p->pNext; // @clearMove
        delete p; // @clearFree
    }
    for (Node* p : independent) { // @looseCheck
        delete p; // @looseFree
    }
    independent.clear(); // @looseClear
    CreateList(l); // @initialize
}`,'CreateList gán hai pointer bằng nullptr. Khi khởi tạo lại trong lab, giải phóng node cũ trước để tránh mất vùng nhớ.','Khi danh sách rỗng, pHead và pTail bằng gì?'),
 createNode:operation('Tạo node','integer',nodeCode,'Cấp phát vùng nhớ, gán Info và pNext. Node trả về chưa thuộc LIST; người gọi sở hữu và phải giải phóng khi không dùng.','Node mới chứa Info và pNext gì? Nó đã thuộc list chưa?'),
 deleteHead:operation('Delete Head','none',`
void DeleteHead(LIST &l) {
    if (l.pHead == nullptr) return; // @empty
    Node* p = l.pHead; // @start
    l.pHead = l.pHead->pNext; // @unlink
    delete p; // @free
    if (l.pHead == nullptr) // @last
        l.pTail = nullptr; // @tail
}`,'Giữ node cũ bằng p; đổi pHead trước rồi mới delete. Xóa node duy nhất thì pTail cũng trở thành nullptr.','p giữ node nào? pTail có phải đổi không?'),
 deleteAfter:operation('Delete sau q','node',`
void DeleteAfter(LIST &l, Node* q) {
    if (q == nullptr || q->pNext == nullptr) return; // @empty
    Node* p = q->pNext; // @start
    q->pNext = p->pNext; // @unlink
    if (p == l.pTail) // @last
        l.pTail = q; // @tail
    delete p; // @free
}`,'Ta nối vòng qua node cần xóa trước, sau đó mới delete. q là node đã biết, không cần tìm lại.','q->pNext sẽ chứa gì? pTail có chuyển tới q không?'),
 delete:operation('Delete theo Info','integer',`
void DeleteValue(LIST &l, int x) {
    Node* p = l.pHead; // @start
    Node* q = nullptr; // @previous
    while (p != nullptr && p->Info != x) { // @check
        q = p; // @save
        p = p->pNext; // @move
    }
    if (p == nullptr) return; // @missing
    if (q == nullptr) l.pHead = p->pNext; // @head
    else q->pNext = p->pNext; // @unlink
    if (p == l.pTail) l.pTail = q; // @tail
    delete p; // @free
}`,'Tìm lần khớp đầu tiên bằng p, giữ node trước bằng q; nối vòng qua p, cập nhật tail rồi delete.','Node nào bị xóa? pHead, pTail và q->pNext thay đổi thế nào?'),
 search:operation('Search','integer',`
Node* Search(LIST l, int x) {
    Node* p = l.pHead; // @start
    while (p != nullptr && p->Info != x) // @check
        p = p->pNext; // @move
    return p; // @result
}`,'p bắt đầu tại pHead, so sánh Info rồi đi theo pNext. Search trả về pointer tới node đầu tiên khớp, hoặc nullptr.','Dự đoán địa chỉ minh họa của node tìm thấy, hoặc nullptr.'),
 traverse:operation('Traverse','none',`
void Traverse(LIST l) {
    Node* p = l.pHead; // @start
    while (p != nullptr) { // @check
        std::cout << p->Info << " "; // @visit
        p = p->pNext; // @move
    }
}`,'Di chuyển pointer p theo pNext; Info không đổi. Dừng khi p = nullptr.','Dự đoán thứ tự Info được in và giá trị cuối của p.')
};
const all=s=>[...s.nodes,...s.detached];
const get=(s,id)=>all(s).find(n=>n.id===id);
function sync(s){
 const pool=all(s),map=new Map(pool.map(n=>[n.id,n])),chain=[],seen=new Set();
 let id=s.pHead;
 while(id!==null){if(seen.has(id)||!map.has(id))throw new Error('Liên kết mô phỏng không hợp lệ.');seen.add(id);const n=map.get(id);chain.push(n);id=n.pNext;}
 s.nodes=chain;s.detached=pool.filter(n=>!seen.has(n.id));
}
function free(s,id){s.nodes=s.nodes.filter(n=>n.id!==id);s.detached=s.detached.filter(n=>n.id!==id);}
function createState(empty=false){
 const nodes=empty?[]:[12,24,36,48].map((value,i)=>({id:i+1,value,pNext:i===3?null:i+2}));
 return {nodes,detached:[],pHead:nodes[0]?.id??null,pTail:nodes.at(-1)?.id??null,nextId:empty?1:5};
}
function generate(original,key,input){
 const state=copy(original),op=operations[key];if(!op)throw new Error('Thao tác không hợp lệ.');
 const t=traceBuilder(op),variables={},output=[];
 const step=(mark,message,extra={})=>t.add(state,mark,message,{variables:{...variables},output:[...output],active:Object.values(variables).filter(id=>id!=null),...extra});
 const finish=(result,time='O(1)',note='')=>t.finish(state,result,aux(time,'O(1)',note));
 const allocate=()=>{
  const node={id:state.nextId++,value:null,pNext:undefined};state.detached.push(node);variables.p=node.id;
  step('allocate','Cấp phát vùng nhớ node '+address(node.id)+'. Info và pNext chưa được gán.');
  node.value=input;step('info','Gán p->Info = '+input+'.');
  node.pNext=null;step('next','Gán p->pNext = nullptr: node độc lập chưa nối tới node nào.');
  step('created','Trả về p = '+address(node.id)+'. Node vẫn chưa thuộc LIST.');return node;
 };
 if(key==='createNode'){const node=allocate();return finish('Node độc lập tại '+address(node.id)+' · Info = '+input+' · pNext = nullptr');}
 if(key==='head'||key==='tail'){
  step('create','Gọi CreateNode(x) để tạo node p bên ngoài danh sách.');const node=allocate();
  step('create','Người gọi nhận p = '+address(node.id)+'.');
  step('empty',state.pHead===null?'List rỗng: cần gán cả pHead và pTail.':'List không rỗng: nối lại pointer.');
  if(state.pHead===null){state.pHead=node.id;sync(state);step('head','pHead chuyển tới p; pTail vẫn nullptr cho đến dòng tiếp theo.');state.pTail=node.id;step('tail','pTail cũng trỏ p: list có đúng một node.');}
  else if(key==='head'){node.pNext=state.pHead;step('link','p->pNext chứa '+address(state.pHead)+' (đầu cũ); pHead chưa đổi.');state.pHead=node.id;sync(state);step('attach','pHead chuyển tới p. pTail không đổi.');}
  else{get(state,state.pTail).pNext=node.id;sync(state);step('link','pTail->pNext đổi từ NULL sang '+address(node.id)+'. pTail vẫn ở node cũ.');state.pTail=node.id;step('attach','pTail chuyển tới node mới. pTail->pNext = nullptr.');}
  return finish('Danh sách: '+format(state.nodes.map(n=>n.value)),'O(1)',key==='tail'?'Nếu chỉ lưu pHead mà không có pTail thì thêm cuối thường cần duyệt danh sách, O(n).':'');
 }
 if(key==='createList'){
  const count=all(state).length;
  while(state.pHead!==null){step('clearCheck','List cũ còn node: giải phóng trước khi khởi tạo lại.');variables.p=state.pHead;step('clearSave','p giữ node cũ '+address(variables.p)+'.');state.pHead=get(state,variables.p).pNext;sync(state);step('clearMove','pHead chuyển tiếp; node cũ vẫn tồn tại ngoài list.');free(state,variables.p);step('clearFree','delete p: vùng nhớ cũ được giải phóng.',{released:[variables.p]});delete variables.p;}
  step('clearCheck','pHead = nullptr: đã dọn hết node thuộc list.');
  for(const node of [...state.detached]){variables.p=node.id;step('looseCheck','Dọn node độc lập '+address(node.id)+' do lab sở hữu.');free(state,node.id);step('looseFree','delete p: giải phóng node độc lập.',{released:[node.id]});delete variables.p;}
  step('looseClear','Danh sách các node độc lập đã rỗng.');delete variables.p;
  step('initialize','Gọi CreateList(l).');state.pHead=null;step('head','l.pHead = nullptr.');state.pTail=null;step('tail','l.pTail = nullptr. List đã khởi tạo.');
  return finish('pHead = nullptr · pTail = nullptr · không có node',count?'O(n)':'O(1)','CreateList riêng: O(1). Khởi tạo lại trong lab gồm dọn n node cũ để tránh mất vùng nhớ.');
 }
 if(key==='search'||key==='traverse'||key==='delete'){
  variables.p=state.pHead;step('start','p nhận địa chỉ pHead: '+address(variables.p)+'.');
  if(key==='delete'){variables.q=null;step('previous','q = nullptr: chưa có node đứng trước p.');}
  while(variables.p!==null){const node=get(state,variables.p);
   step('check',key==='traverse'?'p khác nullptr: có thể xử lý Info.':node.value===input?'p->Info = '+input+': kết thúc tìm.':'p->Info = '+node.value+' khác '+input+': đi tiếp.');
   if(key!=='traverse'&&node.value===input)break;
   if(key==='traverse'){output.push(node.value);step('visit','In p->Info = '+node.value+'.');}
   if(key==='delete'){variables.q=variables.p;step('save','q giữ địa chỉ p trước khi p đi tiếp.');}
   variables.p=node.pNext;step('move','p = p->pNext: p chuyển tới '+address(variables.p)+'.');
  }
  if(key==='traverse'){step('check','p = nullptr: kết thúc duyệt.');return finish('Thứ tự duyệt: '+format(output),'O(n)');}
  if(key==='search'){if(variables.p===null)step('check','p = nullptr: điều kiện dừng; không truy cập p->Info.');step('result',variables.p===null?'p = nullptr. Not found.':'Trả về p = '+address(variables.p)+'.',{found:variables.p});return finish(variables.p===null?'Not found · p = nullptr':'Found at simulated address: '+address(variables.p),'O(n)');}
  step('missing',variables.p===null?'p = nullptr: không tìm thấy, list không đổi.':'p khác nullptr: có thể xóa lần khớp đầu tiên.');
  if(variables.p===null)return finish('Không tìm thấy. Danh sách không đổi.','O(n)');
  const node=get(state,variables.p);
  if(variables.q===null){state.pHead=node.pNext;sync(state);step('head','pHead đi qua node p; p vẫn giữ node đã tách.');}
  else{step('head','q khác nullptr: không đổi pHead.');get(state,variables.q).pNext=node.pNext;sync(state);step('unlink','q->pNext nối vòng qua p; node p còn tồn tại độc lập.');}
  if(state.pTail===node.id)state.pTail=variables.q;
  step('tail',state.pTail===variables.q?'Node xóa là tail: pTail chuyển tới q.':'Node xóa không phải tail: pTail giữ nguyên.');
  free(state,node.id);step('free','delete p: node đã tách được giải phóng; p không được dereference nữa.',{released:[node.id]});
  return finish('Đã xóa '+input+'. Danh sách: '+format(state.nodes.map(n=>n.value)),'O(n)');
 }
 if(key==='deleteHead'){
  step('empty',state.pHead===null?'List rỗng: không có node để xóa.':'pHead khác nullptr: giữ node cũ trước khi đổi pointer.');
  if(state.pHead===null)return finish('List rỗng: không thay đổi.');
  variables.p=state.pHead;const node=get(state,variables.p);step('start','p giữ node đầu tại '+address(node.id)+'.');
  state.pHead=node.pNext;sync(state);step('unlink','pHead chuyển tới '+address(state.pHead)+'. Node cũ vẫn tồn tại vì p còn giữ địa chỉ.');
  free(state,node.id);step('free','delete p: giải phóng node cũ.',{released:[node.id]});
  step('last',state.pHead===null?'Đã xóa node duy nhất: cần đặt pTail = nullptr.':'List còn node: pTail không đổi.',{released:[node.id]});
  if(state.pHead===null){state.pTail=null;step('tail','pTail = nullptr. Cả hai pointer list đều rỗng.',{released:[node.id]});}
  return finish('Đã xóa đầu '+node.value+'. Danh sách: '+format(state.nodes.map(n=>n.value)));
 }
 if(key==='deleteAfter'){
  const q=state.nodes.find(n=>n.id===input);
  if(!q){if(input!==null)throw new Error('Chọn node q đang thuộc danh sách.');variables.q=null;step('empty','q = nullptr: không có node để xóa.');return finish('List rỗng: không thay đổi.');}variables.q=q.id;
  step('empty',q.pNext===null?'q là node cuối: không có node sau q để xóa.':'q và q->pNext khác nullptr: có thể xóa node sau q.');
  if(q.pNext===null)return finish('Không có node sau q: list không đổi.');
  variables.p=q.pNext;const node=get(state,variables.p);step('start','p = q->pNext: p giữ node '+address(node.id)+'.');
  q.pNext=node.pNext;sync(state);step('unlink','q->pNext = p->pNext: nối vòng qua p trước khi delete.');
  step('last',state.pTail===node.id?'p là tail: pTail phải chuyển tới q.':'p không phải tail: pTail giữ nguyên.');
  if(state.pTail===node.id){state.pTail=q.id;step('tail','pTail chuyển tới q. q->pNext = nullptr.');}
  free(state,node.id);step('free','delete p: node đã tách biến mất.',{released:[node.id]});
  return finish('Đã xóa node sau q: '+node.value+'. Danh sách: '+format(state.nodes.map(n=>n.value)));
 }
 throw new Error('Thao tác không hỗ trợ.');
}
export default {quiz,id:'linked',name:'Singly Linked List',tag:'Info · pNext · pHead/pTail',kind:'linked',mental:'Node = Info + pNext. LIST giữ pHead tới đầu và pTail tới cuối; mọi thao tác là thay đổi giá trị con trỏ.',support,operations,createState,generate,values:s=>s.nodes.map(n=>n.value)};
