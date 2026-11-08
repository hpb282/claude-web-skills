export const TYPES = [
  {id:'tell',name:'Hạt nâu',label:'Câu kể',verb:'Em kể',color:'#986344',soft:'#f1e7db',icon:'book',description:'Kể về một người, một việc hoặc điều em đã trải qua.',example:'Mỗi chiều, em cùng bà tưới cây trong vườn.'},
  {id:'describe',name:'Hạt đỏ',label:'Câu tả',verb:'Em tả',color:'#cc6558',soft:'#fae8e1',icon:'sun',description:'Giúp người đọc hình dung bằng màu sắc, âm thanh và những chi tiết.',example:'Những chiếc lá xanh mướt rung rinh trong nắng.'},
  {id:'feel',name:'Hạt hồng',label:'Câu nêu tình cảm',verb:'Em cảm nhận',color:'#c77e96',soft:'#f6e7ed',icon:'heart',description:'Nói lên tình cảm, suy nghĩ hoặc mong muốn của chính em.',example:'Em rất yêu những buổi chiều bình yên bên bà.'},
];

const question=(kind,text,hints)=>({kind,text,hints});
const sets={
  person:[
    question('tell','Em muốn viết về ai? Người ấy có mối quan hệ như thế nào với em?',['bà của em','người bạn thân','cô giáo','mỗi ngày']),
    question('describe','Em nhớ nhất nét nào ở dáng vẻ, giọng nói hoặc nụ cười của người ấy?',['hiền hậu','ấm áp','đôi mắt','nụ cười']),
    question('tell','Em nhớ việc làm hoặc kỉ niệm nào giữa em và người ấy?',['một lần','cùng nhau','giúp đỡ','chăm sóc']),
    question('describe','Trong kỉ niệm ấy, có chi tiết nào khiến em nhớ mãi?',['bàn tay','nhẹ nhàng','ân cần','tiếng cười']),
    question('feel','Khi nghĩ về người ấy, em cảm thấy thế nào? Vì sao?',['yêu quý','biết ơn','ấm lòng','bởi vì']),
    question('feel','Em muốn nói hoặc làm điều gì để thể hiện tình cảm của mình?',['em mong','em sẽ','cảm ơn','quan tâm']),
  ],
  place:[
    question('tell','Em muốn giới thiệu nơi nào? Em thường đến đó vào lúc nào?',['sân trường','mỗi buổi sáng','góc nhỏ','giờ ra chơi']),
    question('describe','Nhìn quanh nơi ấy, em thấy hình ảnh và màu sắc gì nổi bật?',['xanh mát','rực rỡ','tán cây','ánh nắng']),
    question('describe','Em nghe được âm thanh hoặc cảm nhận mùi hương nào ở đó?',['ríu rít','xào xạc','thoang thoảng','trong lành']),
    question('tell','Em thường làm gì ở đó? Có kỉ niệm nào em muốn kể?',['cùng bạn','đọc sách','chơi đùa','có lần']),
    question('feel','Nơi ấy mang lại cho em cảm giác gì?',['bình yên','vui vẻ','thích thú','gần gũi']),
    question('feel','Em muốn làm gì để giữ gìn hoặc trở lại nơi ấy?',['em mong','giữ gìn','chăm sóc','trở lại']),
  ],
  event:[
    question('tell','Sự việc diễn ra khi nào, ở đâu? Có những ai tham gia?',['hôm ấy','cuối tuần','gia đình','các bạn']),
    question('tell','Điều gì diễn ra đầu tiên? Sau đó em đã làm gì?',['đầu tiên','tiếp theo','rồi','cuối cùng']),
    question('describe','Em nhìn thấy khung cảnh, đồ vật hoặc dáng vẻ nào đáng nhớ?',['bầu trời','rực rỡ','khuôn mặt','lấp lánh']),
    question('describe','Âm thanh hoặc một chi tiết nhỏ nào làm sự việc trở nên đặc biệt?',['tiếng cười','rộn ràng','bất ngờ','nhẹ nhàng']),
    question('feel','Lúc đó em có cảm xúc gì? Điều gì khiến em cảm thấy như vậy?',['háo hức','vui sướng','hồi hộp','tự hào']),
    question('feel','Sau sự việc, em muốn nói điều gì hoặc mong điều gì?',['em nhớ mãi','em mong','em hiểu rằng','biết ơn']),
  ],
  object:[
    question('tell','Em muốn viết về đồ vật, con vật hoặc cây nào? Em biết đến nó như thế nào?',['của em','được tặng','trong vườn','ở nhà']),
    question('describe','Hình dáng, kích thước và màu sắc của nó có gì nổi bật?',['nhỏ nhắn','tròn xinh','xanh biếc','mềm mại']),
    question('describe','Em muốn tả kĩ bộ phận hoặc đặc điểm nào nhất?',['lấp lánh','mượt mà','xinh xắn','đặc biệt']),
    question('tell','Em thường làm gì với nó? Hãy kể một việc cụ thể.',['mỗi ngày','chăm sóc','giữ gìn','có lần']),
    question('feel','Vì sao em yêu thích hoặc quý mến nó?',['yêu thích','gắn bó','vui','bởi vì']),
    question('feel','Em muốn làm gì để thể hiện sự quan tâm của mình?',['em sẽ','em mong','bảo vệ','nâng niu']),
  ],
  general:[
    question('tell','Đề bài muốn em viết về ai, điều gì hoặc sự việc nào?',['em muốn kể','em biết','em từng','một ngày']),
    question('tell','Em có trải nghiệm hoặc ví dụ cụ thể nào về điều đó?',['đầu tiên','có lần','sau đó','cùng nhau']),
    question('describe','Em quan sát được hình dáng, màu sắc hay đặc điểm gì?',['nổi bật','nhỏ nhắn','xanh mát','rực rỡ']),
    question('describe','Chi tiết hoặc âm thanh nào giúp người đọc hình dung rõ hơn?',['tiếng cười','xào xạc','nhẹ nhàng','ấm áp']),
    question('feel','Em có cảm xúc hoặc suy nghĩ gì về điều mình vừa kể?',['em cảm thấy','yêu thích','biết ơn','vui']),
    question('feel','Em muốn gửi gắm điều gì ở cuối đoạn văn?',['em mong','em sẽ','em nhớ mãi','em hiểu rằng']),
  ],
};

export const PRESETS=[
  {id:'person',title:'Người em yêu quý',prompt:'Viết một đoạn văn về một người em yêu quý. Kể một kỉ niệm, tả một vài nét đáng nhớ và nói lên tình cảm của em.',theme:'person',tag:'Người thân & bạn bè',emoji:'heart'},
  {id:'school',title:'Góc sân trường của em',prompt:'Viết một đoạn văn giới thiệu một góc sân trường mà em yêu thích, có những chi tiết em quan sát được và cảm nhận của em.',theme:'place',tag:'Quan sát quanh em',emoji:'leaf'},
  {id:'memory',title:'Một ngày thật đáng nhớ',prompt:'Viết một đoạn văn kể lại một ngày đáng nhớ của em. Chọn một vài chi tiết nổi bật và chia sẻ cảm xúc của mình.',theme:'event',tag:'Kể về trải nghiệm',emoji:'sun'},
];

export function inferTheme(prompt){
  if(/người|bạn thân|bạn bè|ông|bà|bố|mẹ|cô giáo|thầy|gia đình/iu.test(prompt))return 'person';
  if(/sân trường|ngôi trường|nơi|cảnh|vườn|công viên|quê hương|góc|biển|dòng sông/iu.test(prompt))return 'place';
  if(/chuyến|ngày|kỉ niệm|kỷ niệm|sự việc|hoạt động|lần|trải nghiệm|buổi/iu.test(prompt))return 'event';
  if(/con vật|con mèo|con chó|đồ vật|đồ chơi|cây|bông hoa|chiếc|quyển/iu.test(prompt))return 'object';
  return 'general';
}
export function makeLesson(prompt,options={}){
  const theme=options.theme||inferTheme(prompt);
  return {id:options.id||`custom-${Date.now()}`,title:options.title||'Câu chuyện của em',prompt:prompt.trim(),theme,grade:options.grade||'3–5',questions:structuredClone(sets[theme]||sets.general)};
}
export function presetLesson(index=0){return makeLesson(PRESETS[index].prompt,PRESETS[index]);}
export const typeOf=id=>TYPES.find(t=>t.id===id)||TYPES[0];
