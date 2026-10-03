import React,{useEffect,useRef} from 'react';
export function CodePanel({module,operation,frame,config}) {
 const container=useRef(null);
 useEffect(()=>{
  const active=container.current?.querySelector('[aria-current="step"]');
  if(active){const panel=container.current;const top=active.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;if(top<panel.scrollTop||top+active.offsetHeight>panel.scrollTop+panel.clientHeight)panel.scrollTop=Math.max(0,top-panel.clientHeight/2);}
 },[frame?.line,operation]);
 function download(){
  const text=module.support+'\n\n'+operation.code.lines.join('\n')+'\n';
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=document.createElement('a');
  a.href=url;a.download=module.id+'-lesson.cpp';a.hidden=true;
  document.body.appendChild(a);a.click();a.remove();
  // Give the browser time to consume the Blob before releasing its URL.
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <aside className="learning-code"><div className="code-title"><span>{operation.label}</span><b>C++17</b></div>{module.kind==='heap'&&<p className="code-context">Tham số <code>minHeap</code> : {config.mode==='min'?<code>true</code>:<code>false</code>} ({config.mode==='min'?'Min Heap':'Max Heap'})</p>}<div className="code-panel"><pre ref={container} aria-label="Code C++">{operation.code.lines.map((line,i)=><div key={i} className={frame?.line===i?'highlight':''} aria-current={frame?.line===i?'step':undefined}><span>{i+1}</span><code>{line}</code></div>)}</pre></div><details className="node-definition"><summary>Kiểu dữ liệu & thư viện C++</summary><pre><code>{module.support}</code></pre></details><div className="code-foot"><span>Dòng xanh khớp với bước hiện tại.</span><button className="quiet-button" onClick={download}>Tải .cpp</button></div></aside>;
}
