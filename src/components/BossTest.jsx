import React,{useMemo,useState} from 'react';
import {generateQuiz} from '../core/quiz.js';
export function BossTest({module,config}) {
 const [round,setRound]=useState(1),[answers,setAnswers]=useState({}),[graded,setGraded]=useState(false);
 const questions=useMemo(()=>generateQuiz(module,round*7919,config),[module,round,config]);
 // Parent keys the quiz by configuration so answers cannot refer to old questions.
 const score=questions.filter((q,i)=>answers[i]===q.answer).length;
 return <details className="optional-details boss-test"><summary>Boss Test · {module.name} · 4 câu hỏi</summary><p className="detail-copy">Dữ liệu và đáp án được tạo lại theo mỗi lượt. Giải thích xuất hiện sau khi chấm.</p>{questions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.text}</legend>{q.options.map((option,j)=><label key={j}><input type="radio" name={'boss-'+module.id+'-'+i} checked={answers[i]===j} onChange={()=>{setAnswers({...answers,[i]:j});setGraded(false);}}/><span>{option}</span></label>)}{graded&&<p className={answers[i]===q.answer?'correct':'error'}>{answers[i]===q.answer?'Đúng. ':'Chưa đúng. '}{q.why}</p>}</fieldset>)}<div className="quiz-actions"><button className="primary-button" disabled={Object.keys(answers).length!==questions.length} onClick={()=>setGraded(true)}>Chấm bài</button><button className="quiet-button" onClick={()=>{setRound(r=>r+1);setAnswers({});setGraded(false);}}>Tạo bộ câu hỏi mới</button></div>{graded&&<p role="status">{score} / {questions.length} đúng</p>}</details>;
}
