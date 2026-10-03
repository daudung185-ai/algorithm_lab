import {format} from './contracts.js';
function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function question(text,correct,wrong,why,rng){
 const options=[...new Set([String(correct),...wrong.map(String)])];
 if(options.length<4)throw new Error('Quiz needs four distinct choices.');
 const selected=[String(correct),...options.filter(o=>o!==String(correct)).slice(0,3)];
 for(let i=selected.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[selected[i],selected[j]]=[selected[j],selected[i]];}
 return {text,options:selected,answer:selected.indexOf(String(correct)),why};
}
export function generateQuiz(module,seed=1,config={}){
 const rng=random(seed),values=[];
 while(values.length<4){const value=1+Math.floor(rng()*40);if(!values.includes(value))values.push(value);}
 const v=values,extra=41+Math.floor(rng()*30),q=(text,correct,wrong,why)=>question(text,correct,wrong,why,rng),data='['+format(v)+']';
 if(typeof module.quiz!=='function')throw new Error('Module must provide a question factory.');
 return module.quiz({v,extra,q,data,rng,config});
}
