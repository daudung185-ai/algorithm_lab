import React,{useEffect,useId,useRef,useState} from 'react';
import {address} from '../modules/linked.js';

export function LinkedVisualizer({state,frame}) {
 const [view,setView]=useState('slide'),[selected,setSelected]=useState(null);
 const scroller=useRef(null);
 useEffect(()=>{
  const follow=()=>{
   const panel=scroller.current;
   const id=frame?.variables?.p??frame?.variables?.q??state.pHead;
   const node=panel?.querySelector('[data-node-id="'+id+'"]');
   if(!node)return;
   const a=panel.getBoundingClientRect(),b=node.getBoundingClientRect();
   if(b.left<a.left||b.right>a.right)panel.scrollLeft+=(b.left+b.right-a.left-a.right)/2;
   if(b.top<a.top||b.bottom>a.bottom)panel.scrollTop+=(b.top+b.bottom-a.top-a.bottom)/2;
  };
  follow();const timer=setTimeout(follow,520);return()=>clearTimeout(timer);
 },[state,frame?.line,frame?.variables,view]);
 const marker='pointer-'+useId().replace(/:/g,'');
 const pool=[...state.nodes,...state.detached];
 const selectedNode=pool.find(n=>n.id===selected);
 useEffect(()=>{if(selected!==null&&!pool.some(n=>n.id===selected))setSelected(null);},[state,selected]);
 const width=Math.max(620,Math.max(state.nodes.length,state.detached.length)*170+110);
 const positions=new Map();
 state.nodes.forEach((node,i)=>positions.set(node.id,{x:65+i*170,y:145}));
 state.detached.forEach((node,i)=>positions.set(node.id,{x:65+i*170,y:335}));
 const pointers={pHead:state.pHead,pTail:state.pTail,...frame?.variables};
 const diagramHeight=Object.keys(frame?.variables||{}).length>1?565:Object.keys(frame?.variables||{}).length?520:state.detached.length?420:320;
 const nullX=Math.max(235,65+state.nodes.length*170);
 const point=id=>positions.get(id);
 const inspect=id=>setSelected(id);
 function pointer(name,id,index){
  const target=point(id),dangling=id!=null&&!target;
  const x=target?target.x+72:nullX;
  const y=name==='pHead'?26:name==='pTail'?243:455+(index%2)*50;
  const temporary=name==='p'||name==='q';
  const side=target?(name==='q'?target.x-20:target.x+164):x;
  const route=temporary&&target?`M0,-18 V-28 H${side-x} V${target.y+32-y} H${(name==='q'?target.x:target.x+144)-x}`:null;
  const endY=target?(y<target.y?target.y:target.y+64):164;
  return <g key={name} className="list-pointer" style={{transform:`translate(${x}px, ${y}px)`}}>
   <rect x="-66" y="-17" width="132" height="30" rx="6"/>
   <text textAnchor="middle" y="2">{name} = {id===null?'NULL':address(id)}</text>
   {!dangling&&<path d={route??`M 0 ${y<endY?15:-18} V ${endY-y}`} markerEnd={`url(#${marker})`}/>}
   {dangling&&<text textAnchor="middle" y="28" className="dangling-note">địa chỉ đã delete</text>}
  </g>;
 }
 return <div className="slide-list">
  <div className="list-view-controls"><div role="group" aria-label="Cách xem danh sách"><button aria-pressed={view==='slide'} onClick={()=>setView('slide')}>Slide View</button><button aria-pressed={view==='simple'} onClick={()=>setView('simple')}>Simple View</button></div><small>Địa chỉ minh họa để giúp hiểu con trỏ.</small><div className="list-pointer-summary">pHead → {address(state.pHead)} · pTail → {address(state.pTail)}</div></div>
  {view==='slide'?<div ref={scroller} className="list-diagram-scroll"><svg className={Math.max(state.nodes.length,state.detached.length)<=4?'compact-list-diagram':''} width={width} height={diagramHeight} viewBox={`0 0 ${width} ${diagramHeight}`} role="group" aria-label="Node gồm Info và pNext, cùng các pointer pHead, pTail, p, q">
   <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#377eb7"/></marker></defs>
   <text x="25" y="107" className="list-row-label">THUỘC LIST · đi từ pHead</text>
   <text x={nullX} y="180" className="list-null">NULL</text>
   {state.detached.length>0&&<text x="25" y="298" className="list-row-label">NODE ĐỘC LẬP / ĐÃ TÁCH · vẫn còn vùng nhớ</text>}
   {pool.map(node=>{
    const a=point(node.id),b=point(node.pNext);
    if(node.pNext===undefined||(node.pNext===null&&state.detached.some(n=>n.id===node.id)))return null;
    const tx=b?.x??(nullX-8),ty=b?b.y+32:a.y+32;
    return <path key={'edge-'+node.id} className="list-link" d={b&&b.y!==a.y?`M${a.x+144},${a.y+32} H${a.x+166} V${ty} H${tx}`:`M${a.x+144},${a.y+32} H${tx}`} markerEnd={`url(#${marker})`}/>;
   })}
   {pool.map(node=>{
    const pos=point(node.id),active=frame?.active?.includes(node.id),found=frame?.found===node.id;
    return <g key={node.id} data-node-id={node.id} style={{transform:`translate(${pos.x}px, ${pos.y}px)`}} className={'slide-node '+(active?'active ':'')+(found?'found ':'')+(selected===node.id?'inspected':'')} role="button" tabIndex="0" aria-label={`Node ${address(node.id)}, Info ${node.value??'chưa gán'}, pNext ${node.pNext===undefined?'chưa gán':address(node.pNext)}`} onClick={()=>inspect(node.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(node.id);}}}>
     <title>Địa chỉ minh họa để giúp hiểu con trỏ.</title><text x="4" y="-12" className="node-address">{address(node.id)}</text>
     <rect width="144" height="64" rx="7"/><line x1="72" y1="0" x2="72" y2="64"/>
     <text x="36" y="19" textAnchor="middle" className="node-field-name">Info</text><text x="108" y="19" textAnchor="middle" className="node-field-name">pNext</text>
     <text x="36" y="45" textAnchor="middle" className="node-field-value" style={{fontSize:String(node.value??"?").length>6?10:String(node.value??"?").length>4?13:18}}>{node.value??'?'}</text><text x="108" y="45" textAnchor="middle" className="node-field-pointer">{node.pNext===undefined?'?':address(node.pNext)}</text>
    </g>;
   })}
   {Object.entries(pointers).map(([name,id],i)=>pointer(name,id,i))}
  </svg></div>:<div className="simple-list-scene"><p>pHead = {address(state.pHead)} · pTail = {address(state.pTail)}</p><div className="simple-chain">{state.nodes.map(node=><React.Fragment key={node.id}><button onClick={()=>inspect(node.id)} className={frame?.active?.includes(node.id)?'active':''}>{node.value}</button><span>→</span></React.Fragment>)}<b>NULL</b></div>{Object.entries(frame?.variables||{}).map(([name,id])=><p key={name}>{name} = {id===null?'nullptr':address(id)}</p>)}{state.detached.length>0&&<p>Node ngoài list: {state.detached.map(n=>`${address(n.id)} · Info ${n.value??'?'}`).join(' / ')}</p>}</div>}
  <p className="nullptr-note">Trong slide sử dụng NULL; trong C++ hiện đại thường dùng nullptr. Click node để xem pointer.</p>
  {selectedNode&&<aside className="pointer-inspector" aria-label="Node Inspector"><div><b>Node Inspector</b><button aria-label="Đóng Node Inspector" onClick={()=>setSelected(null)}>×</button></div><dl><dt>Address</dt><dd>{address(selectedNode.id)} (minh họa)</dd><dt>Info</dt><dd>{selectedNode.value??'Chưa gán'}</dd><dt>pNext</dt><dd>{selectedNode.pNext===undefined?'Chưa gán':selectedNode.pNext===null?'nullptr':address(selectedNode.pNext)}</dd><dt>Points to</dt><dd>{selectedNode.pNext===undefined?'Chưa xác định':selectedNode.pNext===null?'NULL':'Node('+(pool.find(n=>n.id===selectedNode.pNext)?.value??'?')+')'}</dd><dt>Trạng thái</dt><dd>{state.nodes.some(n=>n.id===selectedNode.id)?'Thuộc list':'Độc lập / đã tách'}</dd></dl></aside>}
 </div>;
}
