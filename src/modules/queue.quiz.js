import {format} from '../core/contracts.js';
export default function quiz({v,extra,q,data,rng,config}) {
 return [
  q('Queue front → rear '+data+'. Dequeue() trả về gì?',v[0],[v[3],v[1],'std::nullopt'],'FIFO: lấy phần tử đã chờ lâu nhất.'),
  q('Queue '+data+'. Enqueue('+extra+') rồi Rear() trả về gì?',extra,[v[0],v[3],v[2]],'rear cập nhật tới node vừa thêm.'),
  q('Queue '+data+'. Dequeue() rồi Front() trả về gì?',v[1],[v[0],v[3],'std::nullopt'],'front chuyển tới node tiếp theo, rear không đổi nếu còn phần tử.'),
  q('Dequeue phần tử duy nhất: trạng thái pointer nào đúng?','front = nullptr; rear = nullptr;',['front = nullptr;','rear = nullptr;','front = rear;'],'Cả hai pointer phải rỗng để lần Enqueue tiếp theo hoạt động đúng.')
 ];

}
