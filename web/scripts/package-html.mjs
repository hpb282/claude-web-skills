import {build} from 'vite';
import {readFile,writeFile,mkdir,readdir,stat,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname,extname,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {Script} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=resolve(root,'dist');
const slidesOnly=process.argv.includes('--slides-only');
const output=resolve(root,slidesOnly?'slides-ready':'html-ready');
const temporary=await mkdtemp(join(tmpdir(),'mam-chu-html-'));
const mime={'.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff':'font/woff','.woff2':'font/woff2'};
const uriCache=new Map();
async function dataURI(url){
  const path=resolve(dist,url.replace(/^\//u,''));
  if(!path.startsWith(dist+'/'))throw new Error(`Asset outside build: ${url}`);
  if(!uriCache.has(path))uriCache.set(path,`data:${mime[extname(path)]||'application/octet-stream'};base64,${(await readFile(path)).toString('base64')}`);
  return uriCache.get(path);
}
async function replaceAsync(text,regex,transform){
  const matches=[...text.matchAll(regex)];let result='',cursor=0;
  for(const match of matches){result+=text.slice(cursor,match.index)+await transform(match);cursor=match.index+match[0].length;}
  return result+text.slice(cursor);
}
async function inlineStyle(css){
  return replaceAsync(css,/url\((['"]?)(\/?assets\/[^)'"\s]+)\1\)/gu,async match=>`url("${await dataURI('/'+match[2].replace(/^\//u,''))}")`);
}
async function inlineJavaScript(code,legacy){
  // Draco's default resource constants use import.meta.url, which has no
  // document-relative meaning after making a classic, self-contained bundle.
  code=await replaceAsync(code,/new URL\((['"`])(\/assets\/[^'"`]+)\1,\s*``\+import\.meta\.url\)\.toString\(\)/gu,async m=>JSON.stringify(await dataURI(m[2])));
  if(legacy){
    const js=await dataURI('/draco/draco_wasm_wrapper.js');
    const wasm=await dataURI('/draco/draco_decoder.wasm');
    const fallback=await dataURI('/draco/draco_decoder.js');
    code=code.replace(/([\w$]+)\.setDecoderPath\((['"`])\/draco\/\2\);/gu,(_,variable)=>`${variable}.setDecoderPath({js:${JSON.stringify(js)},wasm:${JSON.stringify(wasm)}});${variable}.decoderPaths.dep_js=${JSON.stringify(fallback)};`);
    code=await replaceAsync(code,/(\/assets\/[\w.-]+\.(?:png|jpg|jpeg|svg|glb))/gu,async m=>await dataURI(m[1]));
  }
  code=code.replaceAll('/original.html','original.html');
  code=code.replaceAll('/mam-chu.svg',await dataURI('/mam-chu.svg'));
  return code;
}
async function createPage(filename,legacy){
  const folder=join(temporary,legacy?'original':'learning');await mkdir(folder,{recursive:true});
  let html=await readFile(join(dist,filename),'utf8');
  const entry=html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/u)?.[1];
  if(!entry)throw new Error(`No built entry script in ${filename}`);
  // Both entry points share the existing Three.js/GSAP module. Bundle their
  // built ESM modules into a single classic IIFE so file:// has no CORS import.
  for(const file of await readdir(join(dist,'assets'))){
    if(!file.endsWith('.js')||file.startsWith('draco_'))continue;
    await writeFile(join(folder,file),await inlineJavaScript(await readFile(join(dist,'assets',file),'utf8'),legacy));
  }
  const result=await build({
    configFile:false,root,publicDir:false,logLevel:'warn',
    build:{write:false,emptyOutDir:false,target:'esnext',minify:true,
      lib:{entry:join(folder,basename(entry)),name:legacy?'NikeOriginalStandalone':'MamChuStandalone',formats:['iife']},
      chunkSizeWarningLimit:50000},
  });
  const results=Array.isArray(result)?result:[result];
  const chunk=results.flatMap(r=>r.output).find(item=>item.type==='chunk'&&item.isEntry);
  if(!chunk)throw new Error(`No standalone bundle for ${filename}`);
  if(/\bimport\.meta\b/u.test(chunk.code))throw new Error(`Unresolved import.meta in ${filename}`);
  html=html.replace(/\s*<script\b[^>]*src="[^"]+"[^>]*><\/script>/gu,'');
  html=html.replace(/\s*<link\b[^>]*rel="modulepreload"[^>]*>/gu,'');
  html=await replaceAsync(html,/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gu,async m=>`<style>\n${(await inlineStyle(await readFile(join(dist,m[1].replace(/^\//u,'')),'utf8'))).replace(/<\/style/giu,'<\\/style')}\n</style>`);
  html=await replaceAsync(html,/(<link\b[^>]*rel="icon"[^>]*href=")([^"]+)(")/gu,async m=>m[1]+await dataURI(m[2])+m[3]);
  // A callback preserves JavaScript replacement tokens such as $& and $`.
  html=html.replace('</body>',()=>`<script>\n${chunk.code.replace(/<\/script/giu,'<\\/script')}\n</script>\n</body>`);
  const scriptStart=html.indexOf('<script>')+8;
  const scriptEnd=html.indexOf('</script>',scriptStart);
  if(scriptStart<8||scriptEnd<scriptStart)throw new Error(`Missing inline script in ${filename}`);
  const insertedCode=html.slice(scriptStart,scriptEnd);
  new Script(insertedCode,{filename});
  if(/<(?:script|link)\b[^>]*(?:src|href)="\/(?:assets|src)\//u.test(html))throw new Error(`External runtime file remains in ${filename}`);
  await writeFile(join(output,filename),html);
  console.log(`${filename}: ${((await stat(join(output,filename))).size/1024/1024).toFixed(1)} MB, CSS/JS/fonts/images embedded`);
}

try{
  if(!existsSync(join(dist,'index.html')))throw new Error('Run npm run build first.');
  await mkdir(output,{recursive:true});
  if(slidesOnly)await createPage('slides.html',false);
  else{
    await createPage('index.html',false);
    await createPage('original.html',true);
  }
  await copyFile(join(root,'ASSETS.md'),join(output,'NGUON-TAI-NGUYEN.md'));
  await mkdir(join(output,'licenses'),{recursive:true});
  for(const [pkg,name] of [['three','three'],['gsap','gsap'],['@fontsource-variable/dm-sans','dm-sans'],['@fontsource/barlow-condensed','barlow-condensed']]){
    const folder=join(root,'node_modules',pkg);
    const file=(await readdir(folder)).find(n=>/^license(?:\.md|\.txt)?$|^ofl\.txt$/iu.test(n));
    if(file)await copyFile(join(folder,file),join(output,'licenses',`${name}.txt`));
  }
  if(slidesOnly){
    await writeFile(join(output,'HUONG-DAN.txt'),'MẦM CHỮ — BÀI THUYẾT TRÌNH HTML\n\n1. Giải nén ZIP. Mở thư mục bằng VS Code.\n2. Chuột phải slides.html > Open with Live Server. Không cần npm.\n3. Dùng mũi tên trái/phải hoặc Space để đổi slide. F: toàn màn hình.\n4. O: mục lục. N: ghi chú. M: giảm chuyển động.\n5. Bấm các chủ đề, loại hạt, nút ghép đoạn và đáp án để thử minh họa.\n6. Nút Mở web mở index.html trong tab mới; giữ index.html và original.html cùng thư mục.\n\nSlide có 12 trang, gợi ý thuyết trình khoảng 7 phút. Ghi chú hiện trên cùng màn hình, nên đóng trước khi trình chiếu tiếp. Các ví dụ là học liệu tự biên soạn.\n\nTất cả tài nguyên cần cho slide được nhúng trong slides.html. Bản chạy qua HTTP/Live Server là cách kiểm thử; file:// có thể bị chính sách trình duyệt chặn và chưa được xác nhận trong môi trường kiểm thử.\n\nGiữ thư mục licenses và NGUON-TAI-NGUYEN.md khi chia sẻ.\n','utf8');
  }else await writeFile(join(output,'HUONG-DAN.txt'),"MẦM CHỮ — BẢN HTML ĐÃ ĐÓNG GÓI\n\nCÁCH MỞ ĐÃ ĐƯỢC KIỂM THỬ (KHÔNG CẦN NPM)\n1. Giải nén toàn bộ ZIP ra một thư mục mới.\n2. Trong VS Code, chọn File > Open Folder và mở thư mục vừa giải nén.\n3. Chuột phải index.html > Open with Live Server.\n4. Trình duyệt sẽ mở Mầm chữ. Không cần cài Node.js hoặc chạy npm.\n5. Giữ original.html cạnh index.html để mở phòng hiệu ứng gốc.\n\nThư viện, font, hình ảnh và mô hình đã được nhúng trong hai tệp HTML. Khi trang đã mở, các luồng học và hiệu ứng không cần tải thêm tài nguyên từ mạng.\n\nTÙY CHỌN MỞ TRỰC TIẾP\nCó thể thử nhấp đúp index.html để mở bằng Chrome/Cốc Cốc. Tuy nhiên, môi trường kiểm thử chặn điều hướng file:// nên chưa xác nhận được chế độ này. Nếu gặp trang trống hoặc trình duyệt chặn tệp cục bộ, dùng cách Live Server ở trên.\n\nBÀI VIẾT\nBài được lưu trên trình duyệt/thiết bị hiện tại. Dùng nút tải bài .json để sao lưu. Muốn chuyển bài từ bản chạy npm, xuất .json ở bản cũ rồi nhập lại ở bản HTML. Bản ở địa chỉ/cổng khác không tự dùng chung dữ liệu trình duyệt.\n\nĐọc tiếng Việt cần máy có giọng đọc tiếng Việt. Bộ kiểm tra văn vẫn dùng quy tắc cục bộ, chưa phải AI chữa ngữ pháp toàn diện.\n\nTÀI NGUYÊN\nindex.html: Mầm chữ, ba hạt 3D, câu hỏi, kể theo cặp, viết và luyện sửa.\noriginal.html: bản gốc với mô hình giày 3D thật, quần áo treo và lookbook.\nGiữ thư mục licenses và NGUON-TAI-NGUYEN.md khi chia sẻ lại.\n",'utf8');
}finally{await rm(temporary,{recursive:true,force:true});}
