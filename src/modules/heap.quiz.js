import {format} from '../core/contracts.js';
export default function quiz({v,extra,q,data,rng,config}) {

  const mode=config.mode==='max'?'max':'min',root=mode==='min'?Math.min(...v):Math.max(...v),next=[...v].sort((a,b)=>mode==='min'?a-b:b-a)[1],i=3+Math.floor(rng()*15),parent=Math.floor((i-1)/2);
  return [
   q('Heapify '+data+' thành '+(mode==='min'?'Min Heap':'Max Heap')+'. Root là gì?',root,[mode==='min'?Math.max(...v):Math.min(...v),extra,v.find(n=>n!==root&&n!==(mode==='min'?Math.max(...v):Math.min(...v)))],'Root có ưu tiên cao nhất; heap không cần sắp xếp toàn mảng.'),
   q('Heap chứa '+data+'. Extract root trong chế độ '+mode+' xong root mới là gì?',next,[root,extra,'std::nullopt'],'Sau khi khôi phục heap, root là phần tử có ưu tiên cao nhất còn lại.'),
   q('Mảng heap index từ 0. Parent của index '+i+' là index nào?',parent,[2*i+1,2*i+2,i],'parent = (i - 1) / 2; chỉ áp dụng khi i > 0.'),
   q('Heapify từ dưới lên có worst-case time nào?','O(n)',['O(n log n)','O(log n)','O(1)'],'Đa số node ở gần lá chỉ cần ít bước sift-down.')
  ];

}
