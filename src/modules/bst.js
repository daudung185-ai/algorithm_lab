import quiz from './bst.quiz.js';
import {operation,traceBuilder,copy,format,aux} from '../core/contracts.js';
const support=`#include <iostream>

struct TreeNode {
    int value;
    TreeNode* left;
    TreeNode* right;
    explicit TreeNode(int v) : value(v), left(nullptr), right(nullptr) {}
};
void destroy(TreeNode* root) {
    if (root == nullptr) return;
    destroy(root->left);
    destroy(root->right);
    delete root;
}`;
const operations={
 insert:operation('Insert','integer',`
TreeNode* insert(TreeNode* root, int value) {
    if (root == nullptr) return new TreeNode(value); // @empty
    TreeNode* current = root; // @start
    while (true) { // @loop
        if (value == current->value) return root; // @duplicate
        if (value < current->value) { // @compare
            if (current->left == nullptr) { // @leftCheck
                current->left = new TreeNode(value); // @leftInsert
                return root; // @leftDone
            }
            current = current->left; // @leftMove
        } else {
            if (current->right == nullptr) { // @rightCheck
                current->right = new TreeNode(value); // @rightInsert
                return root; // @rightDone
            }
            current = current->right; // @rightMove
        }
    }
}`,'Giá trị nhỏ hơn đi trái, lớn hơn đi phải. Module này lưu giá trị duy nhất: Insert trùng không thay đổi cây.','Dự đoán node cha và nhánh trái/phải của giá trị mới.'),
 search:operation('Search','integer',`
const TreeNode* search(const TreeNode* root, int value) {
    const TreeNode* current = root; // @start
    while (current != nullptr) { // @check
        if (value == current->value) return current; // @equal
        if (value < current->value) current = current->left; // @left
        else current = current->right; // @right
    }
    return nullptr; // @missing
}`,'Chỉ đi một nhánh ở mỗi node. BST chưa cân bằng có thể dài như linked list.','Dự đoán các node được kiểm tra và có tìm thấy hay không.')
};
for(const [key,label,order,mental] of [
 ['inorder','Inorder',['left','visit','right'],'Trái → node → phải. Với BST, kết quả tăng dần.'],
 ['preorder','Preorder',['visit','left','right'],'Node → trái → phải. Thăm root trước các cây con.'],
 ['postorder','Postorder',['left','right','visit'],'Trái → phải → node. Thăm root sau các cây con.']
]){
 const lines={left:'    '+key+'(root->left); // @left',right:'    '+key+'(root->right); // @right',visit:'    std::cout << root->value << " "; // @visit'};
 operations[key]=operation(label,'none','void '+key+'(const TreeNode* root) {\n    if (root == nullptr) return; // @empty\n'+order.map(k=>lines[k]).join('\n')+'\n}',mental,'Dự đoán thứ tự các giá trị được in.');
}
function createState(empty=false){
 const state={root:null,nodes:[],nextId:1};
 if(!empty)for(const v of [24,12,36,8,18,30,48])insertRaw(state,v);
 return state;
}
function insertRaw(state,value){
 const node={id:state.nextId++,value,left:null,right:null};
 if(state.root===null){state.nodes.push(node);state.root=node.id;return;}
 let current=state.nodes.find(n=>n.id===state.root);
 while(current){
  if(value===current.value)return;
  const dir=value<current.value?'left':'right';
  if(current[dir]===null){state.nodes.push(node);current[dir]=node.id;return;}
  current=state.nodes.find(n=>n.id===current[dir]);
 }
}
function generate(original,key,value){
 const state=copy(original),t=traceBuilder(operations[key]),byId=new Map(state.nodes.map(n=>[n.id,n]));
 if(key==='insert'){
  t.add(state,'empty',state.root===null?'root là nullptr: tạo root đầu tiên.':'Cây có root: tìm vị trí chèn.',{active:state.root===null?[]:[state.root]});
  if(state.root===null){
   const node={id:state.nextId++,value,left:null,right:null};state.root=node.id;state.nodes.push(node);
   t.add(state,'empty','new TreeNode: root mới là '+value+'.',{active:[node.id]});
   return t.finish(state,'Đã tạo root '+value,aux('O(h)','O(1)','h là chiều cao cây; trường hợp xấu nhất O(n).'));
  }
  let current=byId.get(state.root);
  t.add(state,'start','current bắt đầu tại root.',{active:[current.id]});
  while(true){
   t.add(state,'loop','Xét node '+current.value+'.',{active:[current.id]});
   const duplicate=current.value===value;
   t.add(state,'duplicate',duplicate?'Giá trị đã tồn tại: trả về root, không chèn trùng.':'Giá trị chưa khớp: chọn một nhánh.',{active:[current.id]});
   if(duplicate)return t.finish(state,'Giá trị '+value+' đã tồn tại; cây không đổi.',aux('O(h)','O(1)','BST này bỏ qua giá trị trùng.'));
   const dir=value<current.value?'left':'right';
   t.add(state,'compare',dir==='left'?value+' < '+current.value+': đi trái.':value+' > '+current.value+': đi phải.',{active:[current.id]});
   const next=current[dir];
   t.add(state,dir+'Check',next===null?'Nhánh '+(dir==='left'?'trái':'phải')+' đang rỗng: chèn tại đây.':'Nhánh còn node: đi tiếp.',{active:[current.id]});
   if(next===null){
    const node={id:state.nextId++,value,left:null,right:null};state.nodes.push(node);current[dir]=node.id;
    t.add(state,dir+'Insert','Cấp phát node '+value+' và nối vào nhánh '+(dir==='left'?'trái':'phải')+'.',{active:[current.id,node.id]});
    t.add(state,dir+'Done','Trả về root; các nhánh khác được giữ.',{active:[node.id]});
    return t.finish(state,'Đã chèn '+value+' dưới node '+current.value,aux('O(h)','O(1)','h: chiều cao; xấu nhất O(n). Cây chưa tự cân bằng.'));
   }
   current=byId.get(next);
   t.add(state,dir+'Move','current di chuyển tới node '+current.value+'.',{active:[current.id]});
  }
 }
 if(key==='search'){
  let current=byId.get(state.root);
  t.add(state,'start','current bắt đầu tại root.',{active:current?[current.id]:[]});
  while(current){
   t.add(state,'check','current khác nullptr: kiểm tra node.',{active:[current.id]});
   t.add(state,'equal',value===current.value?'Đã tìm thấy '+value+'.':'Giá trị chưa khớp.',{active:[current.id]});
   if(value===current.value)return t.finish(state,'Tìm thấy '+value,aux('O(h)','O(1)','Xấu nhất O(n), không đảm bảo O(log n).'));
   const dir=value<current.value?'left':'right';
   const old=current;current=byId.get(current[dir]);
   t.add(state,dir,value+(dir==='left'?' < ':' > ')+old.value+': đi '+(dir==='left'?'trái':'phải')+'.',{active:current?[current.id]:[]});
  }
  t.add(state,'check','current là nullptr: không còn nhánh.');
  t.add(state,'missing','Trả về nullptr: không tìm thấy.');
  return t.finish(state,'Không tìm thấy '+value,aux('O(h)','O(1)','Xấu nhất O(n).'));
 }
 const order=key==='inorder'?['left','visit','right']:key==='preorder'?['visit','left','right']:['left','right','visit'],output=[];
 // Explicit call frames avoid a JavaScript call-stack limit on a skewed tree.
 const tasks=[{id:state.root,stage:'enter',depth:1}];
 while(tasks.length){
  const task=tasks.pop(),node=byId.get(task.id);
  if(task.stage==='enter'){
   t.add(state,'empty',node?'root khác nullptr: duyệt cây con tại '+node.value+'.':'root là nullptr: trả về lời gọi cha.',{active:node?[node.id]:[],output,depth:task.depth});
   if(node)for(const stage of [...order].reverse())tasks.push({id:node.id,stage,depth:task.depth});
  }else if(task.stage==='visit'){
   output.push(node.value);
   t.add(state,'visit','In '+node.value+' theo thứ tự '+key+'.',{active:[node.id],output,depth:task.depth});
  }else{
   t.add(state,task.stage,'Gọi '+key+' trên cây con '+(task.stage==='left'?'trái':'phải')+'.',{active:[node.id],output,depth:task.depth});
   tasks.push({id:node[task.stage],stage:'enter',depth:task.depth+1});
  }
 }
 return t.finish(state,'Thứ tự '+key+': '+format(output),aux('O(n)','O(h)','Bộ nhớ call stack; không tính đầu ra. Cây lệch: h = n.'));
}
export default {quiz,id:'bst',name:'Binary Search Tree',tag:'Tìm kiếm & traversal',kind:'bst',mental:'Mỗi node có tối đa hai con: mọi giá trị bên trái nhỏ hơn node, bên phải lớn hơn. Giá trị trùng được bỏ qua; cây này chưa tự cân bằng.',support,operations,createState,generate,values:s=>s.nodes.map(n=>n.value)};
