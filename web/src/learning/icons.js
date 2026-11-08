const paths={
 leaf:'<path d="M20 3C11 2 3 5 4 12c1 8 13 8 16-9Z"/><path d="M4 20 15 9M8 16V9m0 7h7"/>',
 seed:'<path d="M18 4C9 3 3 9 5 16c2 6 10 5 13 0s2-10 0-12Z"/><path d="M8 18c6-3 7-7 7-10"/>',
 book:'<path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3V4Z"/><path d="M12 6v15M6 8h3m-3 4h3m6-4h3m-3 4h3"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 heart:'<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 2 11 8 15 6-4 13-10 8-15Z"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',
 pen:'<path d="m15 4 5 5M4 15 16 3l5 5L9 20l-6 1 1-6Z"/>',
 chat:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z"/><path d="M8 10h8m-8 4h5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
 home:'<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z"/>',garden:'<path d="M12 22V10M12 15C4 16 2 11 3 7c6-1 10 2 9 8Zm0-6C12 3 16 1 21 2c0 5-3 9-9 7Z"/>',
 spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',teacher:'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0h10M7 8h10m-10 4h6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 4 12 8-12 8V4Z"/>',rotate:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
 sound:'<path d="m11 5-6 4H2v6h3l6 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 save:'<path d="M4 3h14l3 3v15H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',folder:'<path d="M3 6h7l2 3h9v12H3V6Z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',undo:'<path d="M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12"/>',
};
export const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.leaf}</svg>`;
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buddySvg(index=0){
  const colors=['#be9069','#e7ddc6','#aabc92'];
  const c=colors[index%3];
  const ears=index===1?'<ellipse cx="74" cy="48" rx="15" ry="40" fill="#e7ddc6"/><ellipse cx="126" cy="48" rx="15" ry="40" fill="#e7ddc6"/><ellipse cx="74" cy="48" rx="6" ry="26" fill="#d8b5ab"/><ellipse cx="126" cy="48" rx="6" ry="26" fill="#d8b5ab"/>':'<circle cx="62" cy="75" r="22" fill="'+c+'"/><circle cx="138" cy="75" r="22" fill="'+c+'"/>';
  return `<svg viewBox="0 0 200 280" aria-hidden="true"><ellipse cx="100" cy="265" rx="66" ry="9" fill="#314c2d13"/>${ears}<ellipse cx="100" cy="205" rx="60" ry="62" fill="${c}"/><path d="M44 181Q100 157 156 181L148 251H52Z" fill="${['#587359','#bf877d','#d6b76e'][index]}"/><ellipse cx="100" cy="112" rx="60" ry="55" fill="${c}"/><ellipse cx="100" cy="129" rx="34" ry="26" fill="#f3e9d7"/><ellipse cx="78" cy="107" rx="4" ry="5" fill="#343e2e"/><ellipse cx="123" cy="107" rx="4" ry="5" fill="#343e2e"/><ellipse cx="100" cy="124" rx="6" ry="4" fill="#69574a"/><path d="M91 135q9 8 18 0" fill="none" stroke="#69574a" stroke-width="3" stroke-linecap="round"/><circle cx="65" cy="122" r="8" fill="#cd807b55"/><circle cx="137" cy="122" r="8" fill="#cd807b55"/><path d="M67 199h68l-8 47H74Z" fill="#f8f3e7"/><path d="M79 211h43m-40 9h35m-32 9h31" stroke="#aeb69b" stroke-width="3" stroke-linecap="round"/><ellipse cx="44" cy="210" rx="13" ry="24" fill="${c}" transform="rotate(-12 44 210)"/><ellipse cx="156" cy="210" rx="13" ry="24" fill="${c}" transform="rotate(12 156 210)"/><ellipse cx="70" cy="259" rx="21" ry="12" fill="${c}"/><ellipse cx="129" cy="259" rx="21" ry="12" fill="${c}"/></svg>`;
}
