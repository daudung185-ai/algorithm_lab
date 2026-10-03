/** Tree coordinates are pure functions, shared by rendering and layout tests. */
export function heapLayout(nodes) {
 const depth=nodes.length?Math.floor(Math.log2(nodes.length)):0;
 const width=Math.max(560,Math.pow(2,depth)*76);
 const points=nodes.map((node,index)=>{
  const level=Math.floor(Math.log2(index+1)),first=Math.pow(2,level)-1,offset=index-first,count=Math.pow(2,level);
  return {...node,index,x:(offset+.5)*width/count,y:48+level*84};
 });
 return {points,width,height:Math.max(200,100+depth*84),edges:points.slice(1).map(p=>({from:points[Math.floor((p.index-1)/2)],to:p}))};
}
export function bstLayout(state) {
 const map=new Map(state.nodes.map(n=>[n.id,n])),ranks=[],depths=new Map();
 const work=[];let id=state.root,depth=0;
 while(id!==null||work.length){
  while(id!==null){const node=map.get(id);if(!node)break;work.push({node,depth});depths.set(id,depth);id=node.left;depth++;}
  if(!work.length)break;
  const item=work.pop();ranks.push(item.node);id=item.node.right;depth=item.depth+1;
 }
 const width=Math.max(560,ranks.length*80+40);
 const points=ranks.map((node,i)=>({...node,x:(i+.5)*width/Math.max(1,ranks.length),y:48+depths.get(node.id)*84}));
 const byId=new Map(points.map(n=>[n.id,n]));
 const edges=points.flatMap(n=>[n.left,n.right].filter(id=>id!==null).map(id=>({from:n,to:byId.get(id)})));
 const maxDepth=Math.max(0,...depths.values());
 return {points,edges,width,height:Math.max(200,100+maxDepth*84)};
}
