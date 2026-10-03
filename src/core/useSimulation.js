import {useEffect,useReducer,useState} from 'react';
import {createSession,sessionReducer} from './session.js';
import {inputFor} from './contracts.js';
export function useSimulation(module,cache) {
  const [session,dispatch]=useReducer(sessionReducer,module,m=>cache?.current[m.id]||createSession(m));
  const [speed,setSpeed]=useState(1);
  useEffect(()=>{if(cache)cache.current[module.id]={...session,trace:null,index:0,status:'idle',finished:false,applied:false,prediction:'',reflection:'',error:'',runId:session.runId+1};},[session,module,cache]);
  useEffect(()=>{
    if(session.status!=='playing')return;
    const runId=session.runId;
    const timer=setTimeout(()=>dispatch({type:'TICK',runId}),900/speed);
    return()=>clearTimeout(timer);
  },[session.status,session.index,session.runId,speed]);
  function run(){
    try {
      if(!session.prediction.trim())throw new Error('Hãy dự đoán trước khi chạy.');
      const operation=module.operations[session.operation];
      const input=operation.input==='node'?(session.committed.nodes.find(n=>String(n.id)===session.input)?.id??session.committed.nodes[0]?.id??null):inputFor(operation,session.input);
      const trace=module.generate(session.committed,session.operation,input,session.config);
      dispatch({type:'RUN',trace});
    }catch(error){dispatch({type:'ERROR',message:error.message});}
  }
  function configure(patch) {
    try {
      const config={...session.config,...patch};
      const state=module.configure?module.configure(session.committed,config):session.committed;
      dispatch({type:'CONFIG',config,state});
    }catch(error){dispatch({type:'ERROR',message:error.message});}
  }
  return {session,dispatch,run,configure,speed,setSpeed,frame:session.trace?.frames[session.index]};
}
