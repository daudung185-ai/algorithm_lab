import fs from 'node:fs';
import {modules} from '../src/modules/index.js';
fs.mkdirSync('cpp-check',{recursive:true});
const harness={
 linked: 'LIST l; CreateList(l); InsertHead(l,2); InsertTail(l,3); InsertHead(l,1); assert(Search(l,3)->Info == 3); DeleteValue(l,2); assert(Search(l,2)==nullptr); DeleteAfter(l,l.pHead); assert(l.pTail==l.pHead && l.pTail->pNext==nullptr); DeleteHead(l); assert(l.pHead==nullptr && l.pTail==nullptr); DeleteHead(l); InsertTail(l,7); Traverse(l); Node* p=CreateNode(9); assert(p->Info==9 && p->pNext==nullptr); std::vector<Node*> independent{p}; ResetList(l,independent); assert(l.pHead==nullptr && l.pTail==nullptr && independent.empty());',
 stack: 'Stack s; assert(!pop(s)); assert(!peek(s)); assert(push(s, 1)); assert(push(s, 2)); assert(peek(s).value() == 2); traverse(s); assert(pop(s).value() == 2); assert(pop(s).value() == 1); assert(!pop(s)); s.capacity = 1; assert(push(s, 7)); assert(!push(s, 8)); assert(pop(s).value() == 7); assert(s.top == nullptr && s.size == 0);',
 queue: 'Queue q; assert(!dequeue(q)); assert(!front(q)); assert(!rear(q)); enqueue(q, 1); enqueue(q, 2); assert(front(q).value() == 1); assert(rear(q).value() == 2); traverse(q); assert(dequeue(q).value() == 1); assert(dequeue(q).value() == 2); assert(q.front == nullptr && q.rear == nullptr); enqueue(q, 7); assert(front(q).value() == 7 && rear(q).value() == 7); assert(dequeue(q).value() == 7);',
 heap: 'for (bool minHeap : {true, false}) { std::vector<int> a; assert(!peek(a)); assert(!extractRoot(a, minHeap)); for(int v : {4, 1, 8, 1, -3}) insert(a, v, minHeap); std::vector<int> want = minHeap ? std::vector<int>{-3,1,1,4,8} : std::vector<int>{8,4,1,1,-3}; for(int v : want) assert(extractRoot(a, minHeap).value() == v); a = {9,2,7,1,6,1}; heapify(a,minHeap); assert(peek(a).value() == (minHeap ? 1 : 9)); while(!a.empty()) extractRoot(a,minHeap); }',
 bst: 'TreeNode* root = nullptr; assert(search(root, 2) == nullptr); for(int v : {4,2,6,1,3,5,7,4}) root=insert(root,v); assert(search(root, 3)->value == 3); assert(search(root, 99) == nullptr); inorder(root); preorder(root); postorder(root); destroy(root);'
};
for(const m of modules){
 let combined=m.support+'\n#include <cassert>\n';
 for(const [key,op] of Object.entries(m.operations)){
  const source=m.support+'\n\n'+op.code.lines.join('\n')+'\n';
  fs.writeFileSync('cpp-check/'+m.id+'-'+key+'.cpp',source);
  let code=op.code.lines.join('\n');
  if(m.id==='linked'&&(key==='tail'||key==='createNode'))code=code.slice(code.indexOf('}\n')+2);
  if(m.id==='linked'&&key==='createNode')code='';
  combined+='\n'+(m.id==='heap'&&key==='heapify'?code.slice(code.indexOf('void heapify')):code)+'\n';
 }
 fs.writeFileSync('cpp-check/'+m.id+'-all.cpp',combined+'\nint main() { '+harness[m.id]+' }\n');
}
