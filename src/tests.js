import test from 'node:test';
import assert from 'node:assert/strict';
import {modules,byId} from './modules/index.js';
import {copy,integer,integers} from './core/contracts.js';
import {createSession,sessionReducer as reduce} from './core/session.js';
import {heapLayout,bstLayout} from './core/layout.js';
import {generateQuiz} from './core/quiz.js';
const linked=byId.linked,stack=byId.stack,queue=byId.queue,heap=byId.heap,bst=byId.bst;
const values=(m,s)=>m.values(s);
const run=(m,s,op,v,config=m.defaultConfig)=>m.generate(s,op,v,config||{});
const empty=m=>m.createState(true,m.defaultConfig);
function build(m,vs,config=m.defaultConfig){
 let state=empty(m);
 const key=m.id==='linked'?'tail':m.id==='stack'?'push':m.id==='queue'?'enqueue':'insert';
 for(const v of vs)state=run(m,state,key,v,config).final;
 return state;
}
function assertHeap(s,mode){
 for(let i=1;i<s.nodes.length;i++){const a=s.nodes[Math.floor((i-1)/2)].value,b=s.nodes[i].value;assert.ok(mode==='min'?a<=b:a>=b);}
}
function assertBst(s){
 const map=new Map(s.nodes.map(n=>[n.id,n])),todo=[[s.root,-Infinity,Infinity]],seen=new Set();
 while(todo.length){const [id,lo,hi]=todo.pop();if(id===null)continue;assert.ok(!seen.has(id));seen.add(id);const n=map.get(id);assert.ok(n&&n.value>lo&&n.value<hi);todo.push([n.left,lo,n.value],[n.right,n.value,hi]);}
 assert.equal(seen.size,s.nodes.length);
}
test('Input: strict decimal int32, arrays, empty and invalid inputs',()=>{
 for(const [text,value] of [['0',0],[' -2147483648 ',-2147483648],['+2147483647',2147483647],['-8',-8]])assert.equal(integer(text),value);
 for(const text of ['', ' ', '1.5','NaN','Infinity','1e3','0x10','2147483648','-2147483649','12abc','--1'])assert.throws(()=>integer(text));
 assert.deepEqual(integers('3, -2 7\n8'),[3,-2,7,8]);assert.deepEqual(integers(''),[]);
 assert.throws(()=>integers('1,2,x'));assert.throws(()=>integers(Array(129).fill(1).join(',')));
 for(const text of ['1,,2','1, ,2',',1','1,'])assert.throws(()=>integers(text));
});
test('Every operation handles empty, singleton, duplicates, missing values; snapshots and C++ line references are isolated',()=>{
 for(const m of modules){
  for(const vs of [[],[1],[2,2,3],[-2147483648,0,2147483647]]){
   const original=build(m,vs),before=copy(original);
   for(const [key,op] of Object.entries(m.operations)){
    for(const v of [2,99]){
     const input=op.input==='node'?(original.nodes[0]?.id??null):op.input==='array'?[3,1,3,-2]:v;
     const trace=run(m,original,key,input);
     assert.deepEqual(original,before,m.id+'/'+key+' mutated caller');
     if(m.id==='linked')assertList(trace.final);
     assert.ok(trace.frames.length>0);assert.ok(trace.result);assert.ok(trace.complexity.time&&trace.complexity.space);
     for(const frame of trace.frames){
      assert.ok(Number.isInteger(frame.line)&&frame.line>=0&&frame.line<op.code.lines.length,m.id+'/'+key+' line');
      assert.ok(frame.message);assert.equal(new Set(frame.state.nodes.map(n=>n.id)).size,frame.state.nodes.length);
      assert.doesNotMatch(frame.message,/\b(let|var)\b|===|!==|=>|current\.next|node\.next|prev\.next/);
     }
     if(trace.frames[0].state.nodes.length)trace.frames[0].state.nodes[0].value=9999;
     assert.deepEqual(original,before);
     if(trace.final.nodes.length)assert.notEqual(trace.final.nodes[0].value,9999);
    }
   }
  }
 }
});
test('Linked list: both inserts, all delete locations, first duplicate only, search and visits',()=>{
 let s=empty(linked);s=run(linked,s,'head',2).final;s=run(linked,s,'tail',4).final;s=run(linked,s,'head',1).final;
 assert.deepEqual(values(linked,s),[1,2,4]);
 for(const [vs,v,want] of [[[1,2,3],1,[2,3]],[[1,2,3],2,[1,3]],[[1,2,3],3,[1,2]],[[1],1,[]],[[1,2],8,[1,2]],[[2,2],2,[2]]]){
  assert.deepEqual(values(linked,run(linked,build(linked,vs),'delete',v).final),want);
 }
 const repeated=build(linked,[4,7,7]);assert.equal(run(linked,repeated,'search',7).frames.at(-1).found,repeated.nodes[1].id);
 assert.match(run(linked,s,'search',99).result,/Not found/);
 assert.deepEqual(run(linked,s,'traverse').frames.at(-1).output,[1,2,4]);
});
test('Stack: LIFO, top pointer, duplicates, unlimited default, opt-in overflow and capacity validation',()=>{
 let s=empty(stack);const c={capacityEnabled:false,capacity:2};
 for(let i=0;i<30;i++)s=run(stack,s,'push',i%5,c).final;
 assert.equal(s.nodes.length,30);assert.match(run(stack,s,'peek',undefined,c).result,/Top: 4/);
 assert.deepEqual(run(stack,s,'traverse',undefined,c).frames.at(-1).output,values(stack,s).reverse());
 for(let i=29;i>=0;i--){const t=run(stack,s,'pop',undefined,c);assert.match(t.result,new RegExp('Đã pop: '+i%5));s=t.final;}
 assert.equal(s.nodes.length,0);assert.match(run(stack,s,'pop',undefined,c).result,/std::nullopt/);
 s=build(stack,[1,2]);const full=run(stack,s,'push',3,{capacityEnabled:true,capacity:2});assert.deepEqual(full.final,s);assert.match(full.result,/overflow/);
 assert.throws(()=>stack.configure(s,{capacityEnabled:true,capacity:1}));
 for(const capacity of [0,-1,1.5,10001,NaN])assert.throws(()=>stack.configure(empty(stack),{capacityEnabled:true,capacity}));
});
test('Queue: FIFO and both pointers after last dequeue; repeated drain/refill',()=>{
 let s=empty(queue);
 for(let cycle=0;cycle<30;cycle++){
  s=run(queue,s,'enqueue',cycle).final;s=run(queue,s,'enqueue',cycle).final;
  assert.match(run(queue,s,'front').result,new RegExp('Front: '+cycle));
  assert.match(run(queue,s,'rear').result,new RegExp('Rear: '+cycle));
  assert.deepEqual(run(queue,s,'traverse').frames.at(-1).output,[cycle,cycle]);
  s=run(queue,s,'dequeue').final;s=run(queue,s,'dequeue').final;assert.equal(s.nodes.length,0);
  assert.match(run(queue,s,'front').result,/std::nullopt/);assert.match(run(queue,s,'rear').result,/std::nullopt/);
 }
});
test('Heap: min/max insert and extraction match sorted reference across duplicate/extreme/random values',()=>{
 let seed=17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%101-50;};
 for(const mode of ['min','max']){
  const c={mode},input=[-2147483648,2147483647,0,0,...Array.from({length:55},random)];
  let s=empty(heap);
  for(const v of input){s=run(heap,s,'insert',v,c).final;assertHeap(s,mode);}
  const sorted=[...input].sort((a,b)=>mode==='min'?a-b:b-a),extracted=[];
  while(s.nodes.length){const t=run(heap,s,'extract',undefined,c);extracted.push(Number(t.result.match(/root: (-?\d+)/)[1]));s=t.final;assertHeap(s,mode);}
  assert.deepEqual(extracted,sorted);
  assert.match(run(heap,s,'extract',undefined,c).result,/std::nullopt/);
 }
});
test('Heapify, mode normalization, exact swap line and singleton root replacement',()=>{
 for(const mode of ['min','max'])for(const input of [[],[8],[2,2,2],[9,5,1,7,4,3,6,2,8]]){
  const t=run(heap,empty(heap),'heapify',input,{mode});assertHeap(t.final,mode);
  assert.deepEqual(values(heap,t.final).sort((a,b)=>a-b),[...input].sort((a,b)=>a-b));
  for(const f of t.frames.filter(f=>f.swaps))assert.match(heap.operations.heapify.code.lines[f.line],/std::swap/);
 }
 const s=build(heap,[3,1,4,1,5]);const max=heap.configure(s,{mode:'max'});assertHeap(max,'max');assert.equal(max.nodes.length,s.nodes.length);
 assert.equal(run(heap,build(heap,[7]),'extract').final.nodes.length,0);
});
test('BST: ordered invariant, ignore duplicates, exact traversal orders and missing search',()=>{
 const s=build(bst,[4,2,6,1,3,5,7,4,2]);assert.equal(s.nodes.length,7);assertBst(s);
 const expected={inorder:[1,2,3,4,5,6,7],preorder:[4,2,1,3,6,5,7],postorder:[1,3,2,5,7,6,4]};
 for(const [key,out] of Object.entries(expected))assert.deepEqual(run(bst,s,key).frames.at(-1).output,out);
 assert.match(run(bst,s,'search',5).result,/Tìm thấy 5/);assert.match(run(bst,s,'search',99).result,/Không tìm thấy/);
 const skew=build(bst,Array.from({length:80},(_,i)=>i));assertBst(skew);
 assert.deepEqual(run(bst,skew,'inorder').frames.at(-1).output,Array.from({length:80},(_,i)=>i));
});
test('Repeated insert/delete cycles preserve reference models and monotonically unique node IDs',()=>{
 for(const m of [linked,stack,queue,heap]){
  let s=empty(m),reference=[];
  for(let i=0;i<70;i++){
   const value=i%7,key=m.id==='linked'?'tail':m.id==='stack'?'push':m.id==='queue'?'enqueue':'insert';
   s=run(m,s,key,value).final;reference.push(value);
   if(i%3===0){
    const op=m.id==='linked'?'delete':m.id==='stack'?'pop':m.id==='queue'?'dequeue':'extract';
    if(m.id==='stack')reference.pop();else if(m.id==='heap'){reference.sort((a,b)=>a-b);reference.shift();}else reference.shift();
    const target=m.id==='linked'?s.nodes[0].value:undefined;
    s=run(m,s,op,target).final;
   }
   if(m.id==='heap'){assertHeap(s,'min');assert.deepEqual(values(m,s).sort((a,b)=>a-b),[...reference].sort((a,b)=>a-b));}
   else assert.deepEqual(values(m,s),reference);
   assert.equal(new Set(s.nodes.map(n=>n.id)).size,s.nodes.length);
  }
 }
});
function finish(s){while(s.index<s.trace.frames.length-1)s=reduce(s,{type:'STEP',delta:1});return s;}
test('Session commits once, replay never mutates, repeated operations use last committed state',()=>{
 let s=createSession(linked,true);s=reduce(s,{type:'PREDICT',value:'8'});
 s=reduce(s,{type:'RUN',trace:run(linked,s.committed,'head',8)});
 assert.equal(s.committed.nodes.length,0);s=finish(s);assert.equal(s.committed.nodes.length,1);assert.equal(s.status,'complete');
 const committed=copy(s.committed);
 for(let i=0;i<3;i++){s=reduce(s,{type:'PLAY'});s=finish(s);assert.deepEqual(s.committed,committed);}
 s=reduce(s,{type:'CANCEL'});s=reduce(s,{type:'PREDICT',value:'9,8'});s=reduce(s,{type:'RUN',trace:run(linked,s.committed,'head',9)});s=finish(s);
 assert.deepEqual(values(linked,s.committed),[9,8]);
});
test('Rapid switching, stale timers, pause/reset/cancel during and after simulation',()=>{
 for(const m of modules){
  let s=createSession(m);const original=copy(s.committed);
  for(let i=0;i<20;i++){
   s=reduce(s,{type:'PREDICT',value:'test'});
   const key=Object.keys(m.operations)[0],trace=run(m,s.committed,key,8);
   s=reduce(s,{type:'RUN',trace});const stale=s.runId;
   s=reduce(s,{type:'PAUSE'});assert.equal(reduce(s,{type:'TICK',runId:stale}).index,0);
   s=reduce(s,{type:'SELECT',operation:Object.keys(m.operations).at(-1)});
   assert.deepEqual(s.committed,original);assert.equal(s.trace,null);
   assert.deepEqual(reduce(s,{type:'TICK',runId:stale}),s);
  }
  s=reduce(s,{type:'PREDICT',value:'8'});s=reduce(s,{type:'RUN',trace:run(m,s.committed,Object.keys(m.operations)[0],8)});
  const stale=s.runId;s=reduce(s,{type:'RESET',module:m,empty:true});assert.equal(s.committed.nodes.length,0);
  assert.deepEqual(reduce(s,{type:'TICK',runId:stale}),s);
 }
});
test('Heap config survives reset, out-of-range playback is bounded, predictions are required',()=>{
 let s=createSession(heap,false,{mode:'max'});assertHeap(s.committed,'max');s=reduce(s,{type:'RESET',module:heap,empty:false});assertHeap(s.committed,'max');
 const trace=run(heap,s.committed,'peek',undefined,{mode:'max'});const noPrediction=reduce(s,{type:'RUN',trace});assert.equal(noPrediction.trace,null);assert.ok(noPrediction.error);
 s=reduce(s,{type:'PREDICT',value:'root'});s=reduce(s,{type:'RUN',trace});s=reduce(s,{type:'STEP',delta:999});assert.equal(s.index,trace.frames.length-1);s=reduce(s,{type:'STEP',delta:-999});assert.equal(s.index,0);
});
test('Generated Boss Tests are seeded, variable and have exactly one correct option',()=>{
 for(const m of modules){
  assert.deepEqual(generateQuiz(m,42,m.defaultConfig),generateQuiz(m,42,m.defaultConfig));assert.notDeepEqual(generateQuiz(m,42,m.defaultConfig),generateQuiz(m,43,m.defaultConfig));
  for(let seed=1;seed<=80;seed++)for(const q of generateQuiz(m,seed,m.defaultConfig)){
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.why);
   assert.doesNotMatch(q.text+' '+q.options.join(' ')+' '+q.why,/\b(let|var)\b|===|!==|=>|\.next/);
  }
 }
});
test('C++ content audit: every module exports valid language-oriented snippets without JS teaching syntax',()=>{
 for(const m of modules)for(const op of Object.values(m.operations)){
  const source=m.support+'\n'+op.code.lines.join('\n');
  assert.doesNotMatch(source,/\b(let|var|function|undefined)\b|===|!==|=>|console\.|new Node\([^)]*\)\s*$/m);
  assert.doesNotMatch(source,/\b(current|node|prev|root|old)\.(next|value|left|right)\b/);
  assert.doesNotMatch(source,/\/\/ @\w+/);
 }
});
test('Tree layouts keep nodes distinct, inside bounds and edges connected',()=>{
 for(const size of [0,1,3,15,31,64]){
  const h=heapLayout(build(heap,Array.from({length:size},(_,i)=>i)).nodes);
  assert.equal(h.points.length,size);assert.equal(h.edges.length,Math.max(0,size-1));
  const b=bstLayout(build(bst,Array.from({length:size},(_,i)=>i)));
  for(const layout of [h,b]){
   assert.equal(new Set(layout.points.map(p=>p.x+','+p.y)).size,size);
   for(const point of layout.points)assert.ok(point.x>=23&&point.x<=layout.width-23&&point.y>=23&&point.y<=layout.height-23);
   for(const edge of layout.edges)assert.ok(edge.from&&edge.to);
  }
 }
});
test('Queue pointer updates occur on exact C++ assignment lines',()=>{
 const initial=build(queue,[1,2]),trace=run(queue,initial,'enqueue',3);
 const link=trace.frames.find(f=>f.line===queue.operations.enqueue.code.marks.link);
 const rear=trace.frames.find(f=>f.line===queue.operations.enqueue.code.marks.rear);
 assert.equal(link.state.rear,initial.rear);assert.equal(rear.state.rear,rear.state.nodes.at(-1).id);
 const dequeue=run(queue,build(queue,[1]),'dequeue');
 const frontFrame=dequeue.frames.find(f=>f.line===queue.operations.dequeue.code.marks.front);
 const rearFrame=dequeue.frames.find(f=>f.line===queue.operations.dequeue.code.marks.rear);
 assert.equal(frontFrame.state.front,null);assert.notEqual(frontFrame.state.rear,null);assert.equal(rearFrame.state.rear,null);
});
test('Stack size assignment timing and reset honor capacity',()=>{
 const s=build(stack,[1]),push=run(stack,s,'push',2);
 assert.equal(push.frames.find(f=>f.line===stack.operations.push.code.marks.top).state.size,1);
 assert.equal(push.final.size,2);
 let session=createSession(stack,true,{capacityEnabled:true,capacity:1});
 session=reduce(session,{type:'RESET',module:stack,empty:false});
 assert.equal(session.committed.nodes.length,1);
 assert.equal(session.committed.size,1);
 assert.equal(session.resetVersion,1);
});
test('Pause/resume/manual steps reject ticks from previous playback generations',()=>{
 let s=createSession(linked,true);s=reduce(s,{type:'PREDICT',value:'8'});
 s=reduce(s,{type:'RUN',trace:run(linked,s.committed,'head',8)});const stale=s.runId;
 s=reduce(s,{type:'PAUSE'});s=reduce(s,{type:'PLAY'});
 assert.deepEqual(reduce(s,{type:'TICK',runId:stale}),s);
 const second=s.runId;s=reduce(s,{type:'STEP',delta:1});
 assert.deepEqual(reduce(s,{type:'TICK',runId:second}),s);
});
function assertList(state){
 assert.equal(state.pHead,state.nodes[0]?.id??null);
 assert.equal(state.pTail,state.nodes.at(-1)?.id??null);
 const ids=[...state.nodes,...state.detached].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
 state.nodes.forEach((n,i)=>assert.equal(n.pNext,state.nodes[i+1]?.id??null));
 if(state.pTail!==null)assert.equal(state.nodes.at(-1).pNext,null);
}
test('Slide LIST: empty, singleton, two nodes, repeated inserts and deletion preserve head/tail/next invariants',()=>{
 let s=empty(linked);assertList(s);
 for(let i=0;i<40;i++){s=run(linked,s,i%2?'head':'tail',i%7).final;assertList(s);}
 for(let i=0;i<20;i++){s=run(linked,s,'deleteHead').final;assertList(s);}
 while(s.nodes.length>1){const q=s.nodes.at(-2);s=run(linked,s,'deleteAfter',q.id).final;assertList(s);}
 s=run(linked,s,'deleteHead').final;assertList(s);assert.equal(s.nodes.length,0);
 for(const vs of [[],[8],[8,9],[8,9,10]]){
  let state=build(linked,vs);assertList(state);
  const traversal=run(linked,state,'traverse');assert.deepEqual(traversal.frames.at(-1).output,vs);assert.equal(traversal.frames.at(-1).variables.p,null);
  for(const n of state.nodes){const found=run(linked,state,'search',n.value);assert.equal(found.frames.at(-1).found,n.id);assertList(found.final);}
  const missing=run(linked,state,'search',999);assert.equal(missing.frames.at(-1).variables.p,null);assertList(missing.final);
  if(state.nodes.length){const noNext=run(linked,state,'deleteAfter',state.pTail);assert.deepEqual(noNext.final,state);}
 }
});
test('Pointer assignments and unlink-before-delete occur on exact slide C++ lines',()=>{
 const initial=build(linked,[12,24,36]);
 const head=run(linked,initial,'head',8),marks=linked.operations.head.code.marks;
 const link=head.frames.find(f=>f.line===marks.link);assert.equal(link.state.pHead,initial.pHead);assert.equal(link.state.detached.at(-1).pNext,initial.pHead);
 assert.equal(head.final.pTail,initial.pTail);assertList(head.final);
 const tail=run(linked,initial,'tail',48),tailLink=tail.frames.find(f=>f.line===linked.operations.tail.code.marks.link);
 assert.equal(tailLink.state.pTail,initial.pTail);assert.equal(tailLink.state.nodes.at(-2).pNext,tailLink.state.nodes.at(-1).id);assertList(tail.final);assert.equal(tail.complexity.time,'O(1)');
 const del=run(linked,initial,'deleteAfter',initial.pHead),unlinked=del.frames.find(f=>f.line===linked.operations.deleteAfter.code.marks.unlink);
 assert.deepEqual(unlinked.state.nodes.map(n=>n.value),[12,36]);assert.equal(unlinked.state.detached[0].value,24);assert.equal(unlinked.variables.p,initial.nodes[1].id);assert.equal(unlinked.variables.q,initial.pHead);
 assert.equal(del.final.detached.length,0);assertList(del.final);assert.equal(del.complexity.time,'O(1)');
 const singleton=run(linked,build(linked,[1]),'deleteHead');assertList(singleton.final);
 const separated=singleton.frames.find(f=>f.line===linked.operations.deleteHead.code.marks.unlink);assert.equal(separated.state.pHead,null);assert.equal(separated.state.detached.length,1);
});
test('CreateNode assigns fields progressively, owns a detached node, and reinitialization frees all allocations',()=>{
 const initial=build(linked,[1,2]),trace=run(linked,initial,'createNode',7),marks=linked.operations.createNode.code.marks;
 assert.equal(trace.frames.find(f=>f.line===marks.allocate).state.detached[0].value,null);
 assert.equal(trace.frames.find(f=>f.line===marks.info).state.detached[0].pNext,undefined);
 assert.equal(trace.final.detached[0].pNext,null);assert.equal(trace.final.detached[0].value,7);assertList(trace.final);
 const reset=run(linked,trace.final,'createList');assertList(reset.final);assert.equal(reset.final.nodes.length,0);assert.equal(reset.final.detached.length,0);
 assert.throws(()=>run(linked,initial,'deleteAfter',999));
});
