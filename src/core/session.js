import {copy} from './contracts.js';
export function createSession(module,empty=false,config={}) {
  return {committed:module.createState(empty,config),operation:Object.keys(module.operations)[0],config:{...module.defaultConfig,...config},trace:null,index:0,status:'idle',finished:false,applied:false,runId:0,resetVersion:0,error:'',prediction:'',input:'8',reflection:''};
}
function cancel(state) {
  return {...state,trace:null,index:0,status:'idle',finished:false,applied:false,runId:state.runId+1,error:'',prediction:'',reflection:''};
}
function advance(state,index,status) {
  if(!state.trace) return state;
  const end=state.trace.frames.length-1;
  const bounded=Math.max(0,Math.min(end,index));
  const reached=bounded===end;
  return {...state,index:bounded,status:reached?'complete':status,finished:state.finished||reached,applied:state.applied||reached,
    committed:reached&&!state.applied?copy(state.trace.final):state.committed};
}
export function sessionReducer(state,action) {
  switch(action.type) {
    case 'SELECT': return {...cancel(state),operation:action.operation};
    case 'INPUT': return {...cancel(state),input:action.value};
    case 'PREDICT': return {...state,prediction:action.value,error:''};
    case 'REFLECT': return {...state,reflection:action.value};
    case 'ERROR': return {...state,error:action.message};
    case 'RESET': return {...createSession(action.module,action.empty,state.config),runId:state.runId+1,resetVersion:state.resetVersion+1};
    case 'CONFIG': return {...cancel(state),config:action.config,committed:copy(action.state)};
    case 'RUN': {
      if(!state.prediction.trim())return {...state,error:'Hãy dự đoán trước khi chạy.'};
      if(state.trace&&!state.applied)return {...state,error:'Hoàn tất hoặc hủy mô phỏng hiện tại trước khi chạy thao tác mới.'};
      const next={...state,trace:copy(action.trace),index:0,status:'playing',finished:false,applied:false,runId:state.runId+1,error:'',reflection:''};
      return advance(next,0,'playing');
    }
    case 'TICK': return action.runId===state.runId&&state.status==='playing'?advance(state,state.index+1,'playing'):state;
    case 'STEP': return advance({...state,runId:state.runId+1},state.index+action.delta,'paused');
    case 'PAUSE': return {...state,runId:state.runId+1,status:state.status==='playing'?'paused':state.status};
    case 'PLAY': return state.trace?advance({...state,runId:state.runId+1},state.index===state.trace.frames.length-1?0:state.index,'playing'):state;
    case 'CANCEL': return cancel(state);
    default:return state;
  }
}
