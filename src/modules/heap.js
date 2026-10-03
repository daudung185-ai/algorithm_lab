import quiz from './heap.quiz.js';
import {operation,traceBuilder,copy,format,aux} from '../core/contracts.js';
const support=`#include <vector>
#include <optional>
#include <algorithm>
#include <cstddef>

bool better(int a, int b, bool minHeap) {
    return minHeap ? a < b : a > b;
}`;
const siftCode=`void siftDown(std::vector<int>& a, std::size_t i, bool minHeap) {
    const std::size_t n = a.size(); // @size
    while (true) { // @loop
        std::size_t best = i; // @best
        std::size_t left = 2 * i + 1; // @left
        std::size_t right = 2 * i + 2; // @right
        if (left < n && better(a[left], a[best], minHeap)) best = left; // @leftCompare
        if (right < n && better(a[right], a[best], minHeap)) best = right; // @rightCompare
        if (best == i) break; // @stop
        std::swap(a[i], a[best]); // @swapDown
        i = best; // @moveDown
    }
}`;
const operations={
 insert:operation('Insert','integer',`
void insert(std::vector<int>& a, int value, bool minHeap) {
    a.push_back(value); // @append
    std::size_t i = a.size() - 1; // @index
    while (i > 0) { // @check
        std::size_t parent = (i - 1) / 2; // @parent
        if (!better(a[i], a[parent], minHeap)) break; // @compare
        std::swap(a[i], a[parent]); // @swap
        i = parent; // @move
    }
}`,'Thêm vào cuối mảng để giữ cây đầy đủ, rồi sift-up khi con có ưu tiên cao hơn cha.','Dự đoán root mới và những cặp node sẽ đổi chỗ.'),
 extract:operation('Extract Root','none',siftCode+`

std::optional<int> extractRoot(std::vector<int>& a, bool minHeap) {
    if (a.empty()) return std::nullopt; // @empty
    int root = a.front(); // @save
    a.front() = a.back(); // @replace
    a.pop_back(); // @pop
    if (!a.empty()) siftDown(a, 0, minHeap); // @sift
    return root; // @done
}`,'Giữ root, thay bằng phần tử cuối rồi sift-down để khôi phục heap.','Dự đoán root lấy ra và root mới.'),
 heapify:operation('Heapify','array',siftCode+`

void heapify(std::vector<int>& a, bool minHeap) {
    for (std::size_t i = a.size() / 2; i > 0; --i) { // @build
        siftDown(a, i - 1, minHeap); // @call
    }
}`,'Dựng heap từ mảng chưa sắp xếp: sift-down từ cha cuối lên root. Tổng công việc O(n).','Dự đoán root và mảng heap cuối cùng.'),
 peek:operation('Peek','none',`
std::optional<int> peek(const std::vector<int>& a) {
    if (a.empty()) return std::nullopt; // @empty
    return a.front(); // @done
}`,'Root giữ giá trị nhỏ nhất trong Min Heap hoặc lớn nhất trong Max Heap.','Dự đoán giá trị tại root.')
};
export function isBetter(a,b,mode){return mode==='max'?a>b:a<b;}
export function normalize(nodes,mode){
 const a=copy(nodes);
 for(let start=Math.floor(a.length/2)-1;start>=0;start--){
  let i=start;
  while(true){
   let best=i,l=2*i+1,r=l+1;
   if(l<a.length&&isBetter(a[l].value,a[best].value,mode))best=l;
   if(r<a.length&&isBetter(a[r].value,a[best].value,mode))best=r;
   if(best===i)break;
   [a[i],a[best]]=[a[best],a[i]];i=best;
  }
 }
 return a;
}
function createState(empty=false,config={mode:'min'}){
 return {nodes:normalize(empty?[]:[12,24,36,48,30,42,54].map((value,id)=>({id:id+1,value})),config.mode||'min'),nextId:8};
}
function configure(state,config){
 if(!['min','max'].includes(config.mode))throw new Error('Chọn Min Heap hoặc Max Heap.');
 return {...copy(state),nodes:normalize(state.nodes,config.mode)};
}
function generate(original,key,input,config={mode:'min'}){
 const state=copy(original),t=traceBuilder(operations[key]),a=state.nodes,mode=config.mode||'min';
 const active=(...indices)=>indices.filter(i=>i>=0&&i<a.length).map(i=>a[i].id);
 const better=(i,j)=>isBetter(a[i].value,a[j].value,mode);
 function down(start){
  let i=start;
  t.add(state,'size','Lưu kích thước n = '+a.length+'.');
  while(true){
   t.add(state,'loop','Kiểm tra quan hệ cha và hai con.',{active:active(i)});
   let best=i,l=2*i+1,r=l+1;
   t.add(state,'best','Tạm chọn cha làm best.',{active:active(i)});
   t.add(state,'left','Con trái ở index 2 × '+i+' + 1 = '+l+'.',{active:active(i,l),indices:{i,left:l,right:r}});
   t.add(state,'right','Con phải ở index 2 × '+i+' + 2 = '+r+'.',{active:active(i,r),indices:{i,left:l,right:r}});
   if(l<a.length&&better(l,best))best=l;
   t.add(state,'leftCompare',l<a.length?'So sánh con trái với ứng viên best; best = '+best+'.':'Không có con trái.',{active:active(i,l,best)});
   if(r<a.length&&better(r,best))best=r;
   t.add(state,'rightCompare',r<a.length?'So sánh con phải với ứng viên best; best = '+best+'.':'Không có con phải.',{active:active(i,r,best)});
   t.add(state,'stop',best===i?'Cha đã đúng ưu tiên: dừng sift-down.':'Con có ưu tiên cao hơn: cần đổi chỗ.',{active:active(i,best)});
   if(best===i)break;
   const ids=active(i,best);
   [a[i],a[best]]=[a[best],a[i]];
   t.add(state,'swapDown','Đổi phần tử ở index '+i+' và '+best+'.',{active:ids,swaps:ids});
   i=best;
   t.add(state,'moveDown','Tiếp tục từ vị trí con vừa nhận giá trị cha.',{active:active(i)});
  }
 }
 if(key==='insert'){
  a.push({id:state.nextId++,value:input});
  let i=a.length-1;
  t.add(state,'append','Thêm '+input+' tại cuối mảng; cây vẫn là cây nhị phân đầy đủ.',{active:active(i)});
  t.add(state,'index','i = '+i+'.',{active:active(i)});
  while(i>0){
   t.add(state,'check','i > 0: phần tử còn cha.',{active:active(i)});
   const p=Math.floor((i-1)/2);
   t.add(state,'parent','parent = (i − 1) / 2 = '+p+'.',{active:active(i,p),indices:{i,parent:p}});
   const wins=better(i,p);
   t.add(state,'compare',wins?'Con có ưu tiên cao hơn cha: cần đổi chỗ.':'Heap đã đúng ở đây: dừng.',{active:active(i,p)});
   if(!wins)break;
   const ids=active(i,p);[a[i],a[p]]=[a[p],a[i]];
   t.add(state,'swap','std::swap: đổi giá trị con và cha.',{active:ids,swaps:ids});
   i=p;t.add(state,'move','i chuyển lên parent.',{active:active(i)});
  }
  if(i===0)t.add(state,'check','i = 0: đã đến root, kết thúc sift-up.',{active:active(0)});
  return t.finish(state,'Root: '+a[0].value+' · Mảng: '+format(a.map(n=>n.value)),aux('O(log n) amortized','O(n) worst','Sift-up dùng O(1) bộ nhớ phụ; vector có thể cấp phát lại O(n) khi tăng dung lượng.'));
 }
 if(key==='peek'||key==='extract'){
  t.add(state,'empty',a.length?'Heap có phần tử: đọc root.':'Heap rỗng: std::nullopt.',{active:active(0)});
  if(!a.length)return t.finish(state,'Heap rỗng: std::nullopt',aux('O(1)','O(1)'));
  const root=a[0];
  if(key==='peek'){t.add(state,'done','Root là '+root.value+'; heap không đổi.',{active:active(0)});return t.finish(state,'Root: '+root.value,aux('O(1)','O(1)'));}
  t.add(state,'save','Giữ root '+root.value+' để trả về.',{active:active(0)});
  // The last entry is copied into the root slot, then its old slot is removed.
  const last=copy(a.at(-1));
  a[0]={...last,id:root.id};
  t.add(state,'replace','Gán giá trị cuối vào root; chưa pop phần tử cuối.',{active:active(0,a.length-1)});
  a.pop();
  if(a.length)a[0].id=last.id;
  t.add(state,'pop','Loại phần tử cuối khỏi mảng.',{active:active(0),removed:root});
  t.add(state,'sift',a.length?'Heap còn phần tử: siftDown từ root.':'Heap đã rỗng: không gọi siftDown.',{active:active(0)});
  if(a.length)down(0);
  t.add(state,'done','Trả về root cũ '+root.value+'.',{active:active(0)});
  return t.finish(state,'Đã lấy root: '+root.value+' · Root mới: '+(a[0]?.value??'rỗng'),aux('O(log n)','O(1)'));
 }
 if(key==='heapify'){
  a.splice(0,a.length,...input.map(value=>({id:state.nextId++,value})));
  t.add(state,'build','Mảng đầu vào có '+a.length+' phần tử. Bắt đầu từ cha cuối.');
  for(let i=Math.floor(a.length/2);i>0;i--){
   t.add(state,'call','siftDown tại index '+(i-1)+'.',{active:active(i-1)});
   down(i-1);
   t.add(state,'build','Giảm i để xử lý cha phía trước.');
  }
  return t.finish(state,'Heapify hoàn tất · Mảng: '+format(a.map(n=>n.value)),aux('O(n)','O(1)','Dựng từ dưới lên; không thực hiện n lần Insert. Không tính mảng đầu vào.'));
 }
 throw new Error('Operation không hỗ trợ.');
}
export default {quiz,id:'heap',name:'Binary Heap',tag:'Min / Max · ưu tiên tại root',kind:'heap',mental:'Heap là cây nhị phân đầy đủ lưu trong mảng. Min Heap: cha ≤ con. Max Heap: cha ≥ con. Heap không phải mảng đã sắp xếp.',support,operations,createState,generate,configure,settings:[{key:'mode',type:'select',label:'Chế độ heap',options:[{value:'min',label:'Min Heap'},{value:'max',label:'Max Heap'}]}],settingsNote:'Đổi chế độ sẽ dựng lại heap từ những giá trị hiện tại và hủy bước đang chạy.',defaultConfig:{mode:'min'},values:s=>s.nodes.map(n=>n.value)};
