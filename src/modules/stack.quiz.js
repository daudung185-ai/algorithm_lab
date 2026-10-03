import {format} from '../core/contracts.js';
export default function quiz({v,extra,q,data,rng,config}) {
 return [
  q('Stack đáy → top '+data+'. Push('+extra+') rồi Pop() trả về gì?',extra,[v[0],v[3],'std::nullopt'],'LIFO: phần tử vào sau được lấy ra trước.'),
  q('Stack đáy → top '+data+'. Pop() xong Peek() trả về gì?',v[2],[v[0],v[1],v[3]],'Pop bỏ top cũ, top mới là phần tử ngay bên dưới.'),
  q('Traverse stack '+data+' in theo thứ tự nào?',format([...v].reverse()),[format(v),format([...v.slice(1),v[0]]),format(v.slice(1))],'Bắt đầu từ top và đi theo next xuống đáy.'),
  q('Capacity = '+v.length+', stack có '+v.length+' node. Push khi capacity bật trả về gì?','false',['true','std::nullopt','nullptr'],'Kiểm tra capacity trước khi cấp phát; stack được giữ nguyên.')
 ];

}
