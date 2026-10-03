import {format} from '../core/contracts.js';
export default function quiz({v,extra,q,data,rng,config}) {
 const sorted=[...v].sort((a,b)=>a-b),missing=extra;
 return [
  q('BST chứa '+data+'. Inorder in gì?',format(sorted),[format([...sorted].reverse()),format([extra,...sorted]),format(sorted.slice(1))],'Inorder duyệt trái → node → phải, nên giá trị BST tăng dần.'),
  q('BST đang có '+v.length+' giá trị khác nhau. Insert('+v[0]+') thêm một lần nữa có bao nhiêu node?',v.length,[v.length+1,v.length-1,1],'Chính sách module: bỏ qua giá trị trùng.'),
  q('Search('+missing+') trong BST chứa '+data+' trả về gì?','nullptr',['root','true',v[0]],'Đường tìm kết thúc tại nhánh nullptr khi giá trị không tồn tại.'),
  q('BST chưa cân bằng có '+v.length+' node. Worst-case Search là gì?','O(n)',['O(log n)','O(1)','O(n²)'],'Cây lệch có chiều cao h = n; không bảo đảm O(log n).')
 ];

}
