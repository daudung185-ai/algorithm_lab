import linked from './linked.js';
import stack from './stack.js';
import queue from './queue.js';
import heap from './heap.js';
import bst from './bst.js';
export const modules=[linked,stack,queue,heap,bst];
export const roadmap=[{id:'binary-tree',name:'Binary Tree',tag:'Coming Soon'},{id:'graph',name:'Graph',tag:'Coming Soon'}];
export const byId=Object.fromEntries(modules.map(m=>[m.id,m]));
