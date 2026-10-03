import {address} from './modules/linked.js';
import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Box,Play,Pause,SkipBack,SkipForward,RotateCcw} from 'lucide-react';
import {modules,roadmap} from './modules/index.js';
import {useSimulation} from './core/useSimulation.js';
import {Visualizer} from './components/Visualizer.jsx';
import {CodePanel} from './components/CodePanel.jsx';
import {BossTest} from './components/BossTest.jsx';
import './style.css';

function Settings({module,config,configure}) {
 if(!module.settings)return null;
 return <div className="module-settings">{module.settings.map(setting=>{
  if(setting.when&&!config[setting.when])return null;
  if(setting.type==='boolean')return <label key={setting.key}><input type="checkbox" checked={config[setting.key]} onChange={e=>configure({[setting.key]:e.target.checked})}/>{setting.label}</label>;
  if(setting.type==='select')return <label key={setting.key}>{setting.label}<select aria-label={setting.label} value={config[setting.key]} onChange={e=>configure({[setting.key]:e.target.value})}>{setting.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
  return <label key={setting.key}>{setting.label}<input aria-label={setting.label} type="number" min="1" max="10000" value={config[setting.key]} onChange={e=>configure({[setting.key]:Number(e.target.value)})}/></label>;
 })}{module.settingsNote&&<small>{module.settingsNote}</small>}</div>;
}
function Lab({module,cache}) {
 const {session:s,dispatch,run,configure,speed,setSpeed,frame}=useSimulation(module,cache);
 const meta=module.operations[s.operation],display=frame?.state||s.committed;
 const active=s.status==='playing',complete=s.status==='complete',inFlight=Boolean(s.trace&&!s.applied);
 const phase=s.trace?2:s.prediction.trim()?1:0;
 const configKey=JSON.stringify(s.config);
 function reset(empty=false){dispatch({type:'RESET',module,empty});}
 return <>
 <div className="intro"><div><p className="module-label">DSA LEARNING LAB · C++17</p><h1>{module.name}</h1><p>{module.mental}</p></div><div className="reset-actions"><button className="quiet-button" onClick={()=>reset(false)}><RotateCcw size={16}/>Khôi phục mẫu</button><button className="quiet-button" onClick={()=>reset(true)}>Làm rỗng</button></div></div>
 <Settings module={module} config={s.config} configure={configure}/>
 <ol className="three-steps" aria-label="Các bước học">{['Chọn thao tác','Dự đoán','Chạy & giải thích'].map((label,i)=><li key={label} className={phase===i?'current':''} aria-current={phase===i?'step':undefined}><span>{i+1}</span>{label}</li>)}</ol>
 <div className={'simulation-grid '+(module.kind==='linked'?'linked-simulation':'')}><Visualizer module={module} state={display} frame={frame} config={s.config}/><CodePanel module={module} operation={meta} frame={frame} config={s.config}/></div>
 {s.trace&&<div className="playback" aria-label="Điều khiển mô phỏng"><button aria-label="Bước trước" disabled={!s.index} onClick={()=>dispatch({type:'STEP',delta:-1})}><SkipBack size={17}/></button><button aria-label={active?'Tạm dừng':complete?'Phát lại':'Tiếp tục'} onClick={()=>dispatch({type:active?'PAUSE':'PLAY'})}>{active?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="Bước tiếp" disabled={s.index===s.trace.frames.length-1} onClick={()=>dispatch({type:'STEP',delta:1})}><SkipForward size={17}/></button><span aria-live="polite">Bước {s.index+1} / {s.trace.frames.length}</span><select aria-label="Tốc độ phát" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select><button className="cancel-run" onClick={()=>dispatch({type:'CANCEL'})}>{inFlight?'Hủy mô phỏng':'Thao tác tiếp theo'}</button></div>}
 <section className="guided-actions" aria-label="Thực hiện thao tác"><div><h2><span>1</span> Chọn thao tác</h2><label htmlFor="operation">Operation</label><select id="operation" value={s.operation} onChange={e=>dispatch({type:'SELECT',operation:e.target.value})}>{Object.entries(module.operations).map(([key,op])=><option key={key} value={key}>{op.label}</option>)}</select>{meta.input==='node'&&<div className="operation-input"><label htmlFor="known-node">Node q đã biết</label><select id="known-node" disabled={!s.committed.nodes.length} value={s.committed.nodes.some(n=>String(n.id)===s.input)?s.input:String(s.committed.nodes[0]?.id??'')} onChange={e=>dispatch({type:'INPUT',value:e.target.value})}>{!s.committed.nodes.length&&<option value="">nullptr · list rỗng</option>}{s.committed.nodes.map(n=><option key={n.id} value={n.id}>{address(n.id)} · Info {n.value}</option>)}</select><small>Chọn pointer tới node hiện có; không tìm q theo Info.</small></div>}{meta.input!=='none'&&meta.input!=='node'&&<div className="operation-input"><label htmlFor="operation-value">{meta.input==='array'?'Mảng đầu vào':'Giá trị'}</label><input id="operation-value" type="text" inputMode={meta.input==='array'?'text':'numeric'} placeholder={meta.input==='array'?'9, 2, 7, 1':'Số nguyên int C++'} value={s.input} onChange={e=>dispatch({type:'INPUT',value:e.target.value})}/>{meta.input==='array'&&<small>Phân tách bằng dấu phẩy hoặc khoảng trắng; để trống để dựng heap rỗng.</small>}</div>}<p>{meta.mental}</p></div>
 <div><h2><span>2</span> Dự đoán</h2><label htmlFor="prediction">{meta.predict}</label><textarea id="prediction" aria-label="Dự đoán" disabled={Boolean(s.trace)} placeholder="Tôi nghĩ kết quả sẽ là…" value={s.prediction} onChange={e=>dispatch({type:'PREDICT',value:e.target.value})}/><p>Thử suy luận trước khi xem đáp án. Dự đoán không cần đúng để bắt đầu.</p></div>
 <div><h2><span>3</span> Chạy & giải thích</h2><p>{inFlight?'Mô phỏng đang mở. Tiếp tục, đi từng bước, hoặc hủy trước khi chạy thao tác mới.':'Theo dõi cấu trúc, đọc lý do từng bước và dòng C++ tương ứng.'}</p><button className="primary-button" disabled={!s.prediction.trim()||inFlight} onClick={()=>s.trace?dispatch({type:'CANCEL'}):run()}><Play size={17}/>{inFlight?'Đang mô phỏng':s.trace?'Thao tác tiếp theo':'Chạy mô phỏng'}</button>{!s.prediction.trim()&&<small className="run-hint">Dự đoán ở bước 2 để bắt đầu.</small>}{s.trace&&s.applied&&<p>Để đổi dự đoán, chọn “Thao tác tiếp theo”. Replay chỉ xem lại, không chạy thuật toán thêm lần nữa.</p>}</div>{s.error&&<p className="action-error" role="alert">{s.error}</p>}</section>
 {s.finished&&<section className="explain-section"><p className="module-label">KẾT QUẢ & GIẢI THÍCH</p><h2>{s.trace.result}</h2><p>Dự đoán của bạn: <b>{s.prediction}</b></p><div className="complexity-result"><span>Time <b>{s.trace.complexity.time}</b></span><span>Auxiliary space <b>{s.trace.complexity.space}</b></span></div>{s.trace.complexity.note&&<p>{s.trace.complexity.note}</p>}<p className="complexity-disclaimer">Complexity là của thuật toán C++; không tính bộ nhớ snapshot, animation và giao diện.</p><label htmlFor="reflection">Vì sao kết quả này xảy ra? Bước nào khác dự đoán?</label><textarea id="reflection" value={s.reflection} onChange={e=>dispatch({type:'REFLECT',value:e.target.value})} placeholder="Giải thích bằng quan hệ pointer, LIFO/FIFO hoặc bất biến của cây…"/><button className="quiet-button" onClick={()=>dispatch({type:'PLAY'})}>Replay từng bước</button></section>}
 <BossTest key={module.id+configKey+s.resetVersion} module={module} config={s.config}/>
 </>;
}
function App(){
 const [selected,setSelected]=useState('linked');
 const cache=useRef({});
 const module=modules.find(m=>m.id===selected);
 const navigation=[...modules.slice(0,4),roadmap[0],modules[4],roadmap[1]];
 return <div className="guided-app"><header className="simple-header"><a className="simple-brand" href="/"><Box size={21}/>Algorithm Lab<span>3D</span></a><span className="header-note">Hiểu cấu trúc. Học từng bước.</span></header><nav className="module-nav" aria-label="Cấu trúc dữ liệu"><p className="nav-caption">KHÁM PHÁ DSA</p>{navigation.map((m,i)=><button key={m.id} className={selected===m.id?'selected':''} aria-current={selected===m.id?'page':undefined} onClick={()=>setSelected(m.id)}><span className="module-number">0{i+1}</span><span>{m.name}<small>{m.tag}</small></span><span className="module-status">{m.operations?'Lab':'Soon'}</span></button>)}<p className="nav-note">5 module hoàn chỉnh<br/>C++17 / C++20<br/>Dự đoán → mô phỏng → giải thích</p></nav><main className="guided-main">{module?<Lab key={module.id} module={module} cache={cache}/>:<section className="coming-soon"><p className="module-label">ROADMAP</p><h1>{roadmap.find(m=>m.id===selected)?.name}</h1><span className="soon-badge">Coming Soon</span><p>Module này sẽ dùng cùng framework mô phỏng, code C++ và Boss Test.</p><button className="primary-button" onClick={()=>setSelected('bst')}>Học Binary Search Tree</button></section>}</main></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
