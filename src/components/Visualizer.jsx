import {LinkedVisualizer} from './LinkedVisualizer.jsx';
import React,{useEffect,useRef} from 'react';
import {ArrowRight} from 'lucide-react';
import {heapLayout,bstLayout} from '../core/layout.js';
function Linear({module,state,frame}) {
 const active=frame?.active||[],isQueue=module.kind==='queue';
 return <div className="scene linear-scene">
 {frame?.pending&&<div className="pending-node"><span>NODE MỚI</span><b>{frame.pending.value}</b><small>next → {frame.pendingTarget?'head':'nullptr'}</small></div>}
 {frame?.removed&&<div className="removed-node">Node {frame.removed.value} đã tách · chờ delete</div>}
 {isQueue&&<div className="queue-pointer-summary">front → {state.front===null?'nullptr':state.nodes.find(n=>n.id===state.front)?.value??frame?.removed?.value} · rear → {state.rear===null?'nullptr':state.nodes.find(n=>n.id===state.rear)?.value??frame?.removed?.value}</div>}<div className="node-chain">{state.nodes.map((node,i)=><React.Fragment key={node.id}><div className={'node-wrap '+(active.includes(node.id)?'focused':'')}><div className="pointer-label">{[(isQueue?state.front===node.id:i===0)?(isQueue?'FRONT':'HEAD'):'',isQueue&&state.rear===node.id?'REAR':'',!isQueue&&frame?.prev===node.id?'PREV':'',active.includes(node.id)?(frame?.pointer==='node'?'NODE':'CURRENT'):''].filter(Boolean).join(' · ')||'\u00a0'}</div><div className="cube"><div className="node-value">{node.value}</div><div className="node-next">next<ArrowRight size={15}/></div></div></div><div className="connection"><span/><ArrowRight size={21}/></div></React.Fragment>)}<div className="null-node">{!state.nodes.length&&(isQueue?'FRONT → ':'HEAD → ')}nullptr<small>∅</small></div></div></div>;
}
function StackView({state,frame,config}) {
 const top=state.nodes.at(-1);
 return <div className="stack-scene"><div className="stack-summary">top → {top?top.value:'nullptr'}<span>size = {state.size} · {config.capacityEnabled?'Capacity '+config.capacity:'Không giới hạn capacity'}</span></div>{frame?.pending&&<div className="stack-pending">Node mới: {frame.pending.value} · next → top cũ</div>}<div className="stack-column" aria-label="Stack từ top xuống đáy">{[...state.nodes].reverse().map((node,i)=><div key={node.id} className={'stack-item '+(frame?.active?.includes(node.id)?'active':'')}><span>{i===0?'TOP →':'next ↓'}</span><b>{node.value}</b><small>{i===state.nodes.length-1?'đáy':'node'}</small></div>)}{!state.nodes.length&&<p className="empty-structure">Stack rỗng · top = nullptr</p>}<div className="stack-base">ĐÁY</div></div>{frame?.removed&&<p className="removed-caption">Đã tách node {frame.removed.value} khỏi top.</p>}</div>;
}
function TreeView({module,state,frame}) {
 const viewport=useRef(null);
 useEffect(()=>{
  const panel=viewport.current;
  const focus=frame?.active?.[0]??(module.kind==='heap'?state.nodes[0]?.id:state.root);
  const node=panel?.querySelector('[data-node-id="'+focus+'"]');
  if(!node)return;
  const bounds=panel.getBoundingClientRect(),position=node.getBoundingClientRect();
  if(position.left<bounds.left||position.right>bounds.right)panel.scrollLeft+=(position.left+position.right-bounds.left-bounds.right)/2;
  if(position.top<bounds.top||position.bottom>bounds.bottom)panel.scrollTop+=(position.top+position.bottom-bounds.top-bounds.bottom)/2;
 },[state,frame?.line,frame?.active,module.kind]);
 const layout=module.kind==='heap'?heapLayout(state.nodes):bstLayout(state);
 return <><div ref={viewport} className="tree-scroll" aria-label={module.kind==='heap'?'Cây binary heap':'Cây binary search tree'}>{!state.nodes.length?<p className="empty-structure">Cây rỗng · {module.kind==='heap'?'mảng rỗng':'root = nullptr'}</p>:<svg className={"tree-canvas "+(state.nodes.length<=15?"compact-tree":"")} width={layout.width} height={layout.height} viewBox={'0 0 '+layout.width+' '+layout.height} role="img" aria-label={module.name+' với '+state.nodes.length+' node'}>
 {layout.edges.map(edge=><line key={edge.to.id} x1={edge.from.x} y1={edge.from.y+22} x2={edge.to.x} y2={edge.to.y-22} className="tree-edge"/>)}
 {layout.points.map(node=><g key={node.id} data-node-id={node.id} style={{transform:'translate('+node.x+'px,'+node.y+'px)'}} className={'tree-node '+(frame?.active?.includes(node.id)?'active ':'')+(frame?.swaps?.includes(node.id)?'swapping':'')}><title>{'Giá trị '+node.value+(module.kind==='heap'?' · index '+node.index:'')}</title><circle r="23"/><text textAnchor="middle" dy="5" className="tree-value">{node.value}</text><text textAnchor="middle" y="40" className="tree-index">{module.kind==='heap'?'['+node.index+']':node.id===state.root?'ROOT':''}</text></g>)}
 </svg>}</div>{module.kind==='heap'&&<div className="array-view" aria-label="Mảng heap index từ 0">{state.nodes.map((node,i)=><div key={i} className={frame?.active?.includes(node.id)?'active':''}><span>{i}</span><b>{node.value}</b></div>)}{!state.nodes.length&&<span>Mảng rỗng</span>}</div>}</>;
}
export function Visualizer({module,state,frame,config}) {
 return <section className="focus-visual" aria-label={'Mô phỏng '+module.name}><div className="visual-heading"><span>{module.name}{module.kind==='heap'?' · '+(config.mode==='max'?'Max Heap':'Min Heap'):''}</span><span>{state.nodes.length} node</span></div>{module.kind==='linked'?<LinkedVisualizer state={state} frame={frame}/>:module.kind==='stack'?<StackView state={state} frame={frame} config={config}/>:module.kind==='heap'||module.kind==='bst'?<TreeView module={module} state={state} frame={frame}/>:<Linear module={module} state={state} frame={frame}/>}
 {frame?.output?.length>0&&<div className="output-strip" aria-label="Thứ tự đã thăm"><span>Đã in:</span>{frame.output.map((v,i)=><b key={i}>{v}</b>)}</div>}
 <p className="live-step" aria-live="polite">{frame?frame.message:'Dự đoán trước, rồi chạy để theo dõi từng bước và dòng C++ tương ứng.'}</p>
 {module.kind==='heap'&&<div className="index-guide"><b>Mảng index từ 0</b><code>parent = (i - 1) / 2;</code><small>Chỉ khi i &gt; 0</small><code>left = 2 * i + 1;</code><code>right = 2 * i + 2;</code><span>Con tồn tại khi index &lt; n. Chia số nguyên.</span></div>}</section>;
}
