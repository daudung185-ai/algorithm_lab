import {format} from '../core/contracts.js';
export default function quiz({v,extra,q,data}) {
 return [
  q('LIST '+data+'. Insert Head('+extra+'): pointer nào đổi?','pHead',['pTail','pHead và pTail','Không pointer nào'],'List không rỗng: p->pNext giữ pHead cũ, sau đó pHead chuyển tới p; pTail giữ nguyên.'),
  q('LIST '+data+'. Delete('+v[1]+') để lại gì?',format(v.filter((_,i)=>i!==1)),[format(v.slice(1)),format(v.slice(0,-1)),format(v)],'q->pNext nối vòng qua p trước khi delete p.'),
  q('Search giá trị không tồn tại trong '+data+' trả về gì?','nullptr',['0','-1','l.pTail'],'Search trả về Node*, p đi theo pNext tới nullptr khi không tìm thấy.'),
  q('Insert Tail trong LIST có pTail có time nào?','O(1)',['O(n)','O(log n)','O(n²)'],'Nối l.pTail->pNext tới p rồi cập nhật l.pTail; không cần duyệt list.')
 ];
}
