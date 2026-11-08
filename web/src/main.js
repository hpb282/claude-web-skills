import '@fontsource-variable/dm-sans';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './style.css';
import gsap from 'gsap';
import { ShoeScene } from './scene.js';
import { shoes, garments, looks, money } from './data.js';

const icons = {
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  left:'<path d="m14 6-6 6 6 6"/>',
  right:'<path d="m10 6 6 6-6 6"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  rotate:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  play:'<path d="m8 4 12 8-12 8V4Z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  sound:'<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>',
};
const icon = (name,cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.arrow}</svg>`;
const swoosh = `<svg viewBox="0 0 70 28" aria-hidden="true"><path d="M4 21C-1 14 7 3 12 0 7 8 6 15 13 15 20 15 45 6 69 0L20 25C12 29 6 28 4 21Z" fill="currentColor"/></svg>`;
const saved = (key,fallback) => {try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const state = {view:'footwear',index:0,detail:null,look:0,color:0,size:null,paused:false,bag:saved('nike-bag',[]),favorites:saved('nike-favorites',[]),motion:matchMedia('(prefers-reduced-motion: reduce)').matches};
let scene;
let activeTransition;
let toastTimer;

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#main">Skip to collection</a>
  <div class="announcement"><span>A new perspective on everyday movement.</span><span>Explore. Express. Repeat.</span></div>
  <header class="header">
    <a class="brand" href="#footwear" aria-label="Nike home">${swoosh}</a>
    <nav class="navigation" aria-label="Collections">
      <a href="#footwear" data-view="footwear" class="is-active">Footwear<span class="nav-dot"></span></a>
      <a href="#layers" data-view="layers">Everyday layers<span class="nav-dot"></span></a>
      <a href="#looks" data-view="looks">Shop the look<span class="nav-dot"></span></a>
    </nav>
    <div class="header-actions">
      <button class="icon-button search-trigger" data-action="search" aria-label="Search collection">${icon('search')}</button>
      <button class="icon-button favorites-trigger" data-action="favorites" aria-label="View favorites">${icon('heart')}<span class="favorites-indicator" hidden></span></button>
      <button class="bag-trigger" data-action="bag" aria-label="Open bag">${icon('bag')}<span class="bag-label">Bag</span><span class="bag-count">0</span></button>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <section class="view footwear-view is-active" id="view-footwear" aria-label="Footwear collection">
      <div class="hero-word" aria-hidden="true">AIR</div>
      <div id="shoe-stage" class="shoe-stage"></div>
      <div class="scene-loader" role="status"><span class="loader-line"></span><span>Bringing Air to life <span id="load-percent">0</span>%</span></div>
      <div class="hero-copy" id="hero-copy"></div>
      <div class="product-float-label"><span class="live-dot"></span><span id="floating-label">Nike Air Mag</span><span class="label-line"></span><span id="floating-price">$350</span></div>
      <div class="scene-controls">
        <button class="icon-button" data-action="rotate-left" aria-label="Rotate shoe left">${icon('left')}</button>
        <span>${icon('rotate')}<span id="drag-instruction">Drag to rotate</span></span>
        <button class="icon-button" data-action="rotate-right" aria-label="Rotate shoe right">${icon('right')}</button>
        <span class="control-divider"></span>
        <button class="icon-button" data-action="pause" aria-label="Pause floating animation" aria-pressed="false">${icon('pause')}</button>
      </div>
      <div class="collection-bottom">
        <div class="collection-caption"><span class="small-swoosh">${swoosh}</span><p>Always a step<br>ahead.</p></div>
        <div class="shoe-selector" aria-label="Select footwear">${shoes.map((s,i)=>`<button class="shoe-card ${i===0?'is-selected':''}" data-shoe="${i}" aria-label="Select ${s.name}" aria-pressed="${i===0}"><span class="shoe-card-image"><img src="${s.image}" width="140" height="116" alt="" /></span><span class="shoe-card-text"><span>${s.name.replace('Nike ','')}</span><span>${i===0?'Future classic':'Everyday essential'}</span></span><span class="shoe-card-arrow">${icon('arrow')}</span></button>`).join('')}</div>
        <div class="collection-pagination"><span id="shoe-number">01</span><span class="pagination-line"></span><span>04</span></div>
      </div>
    </section>
    <section class="view layers-view" id="view-layers" aria-label="Everyday layers" hidden inert>
      <div class="landscape" aria-hidden="true"></div>
      <div class="landscape-shade" aria-hidden="true"></div>
      <div class="layers-copy"><span>Out here. In your element.</span><h1>GOOD IN<br>EVERY LAYER.</h1><p>Easy essentials. A world of possibilities.</p></div>
      <div class="clothes-line" aria-hidden="true"></div>
      <div class="wardrobe">${garments.map((g,i)=>`<button class="hanging-item" data-garment="${i}" style="--item:${i}" aria-label="Explore ${g.name}"><span class="garment-art" style="--sprite:${i}" role="img" aria-label="${g.subtitle}"></span><span class="garment-caption"><span>${g.name}</span><span>${money(g.price)} ${icon('plus')}</span></span></button>`).join('')}</div>
      <div class="layers-bottom"><span>Made for the everyday.<br>Ready for everywhere.</span><span class="layer-hint">Choose a layer. Make it yours. ${icon('arrow')}</span><span>New season essentials</span></div>
    </section>
    <section class="view looks-view" id="view-looks" aria-label="Shop the look" hidden inert>
      <div class="looks-heading"><div><span class="section-intro">A little inspiration. All your own.</span><h1>Try the look.</h1><p>Find your fit. Make your move.</p></div><span class="look-edition">Everyday collection<br>Spring / Summer 2026</span></div>
      <div class="look-runway">${looks.map((l,i)=>`<div class="look-figure ${i===0?'is-selected':''}" data-model="${i}"><button class="model-art" data-look="${i}" style="--sprite:${i}" aria-label="Select look: ${l.name}" aria-pressed="${i===0}"></button><button class="hotspot hotspot-top" data-hotspot="top" data-look="${i}" aria-label="Explore top in ${l.name}">${icon('plus')}</button><button class="hotspot hotspot-bottom" data-hotspot="bottom" data-look="${i}" aria-label="Explore footwear in ${l.name}">${icon('plus')}</button></div>`).join('')}</div>
      <aside class="look-shop" id="look-shop"></aside>
      <div class="look-bottom"><div><button class="round-button" data-action="prev-look" aria-label="Previous look">${icon('left')}</button><button class="round-button" data-action="next-look" aria-label="Next look">${icon('right')}</button><span id="look-number">01 / 04</span></div><span id="look-name">The everyday original</span><span>Wear it your way.</span></div>
    </section>
    <section class="detail-view" id="product-detail" aria-label="Product details" hidden inert>
      <button class="back-link" data-action="back">${icon('left')}<span>Back to collection</span></button>
      <div class="garment-detail-visual" id="garment-detail-visual" hidden><div class="garment-art" id="detail-garment"></div><span class="detail-floor-shadow"></span></div>
      <div class="detail-view-switch" id="detail-view-switch"><button class="is-selected" data-angle="0">Side</button><button data-angle="1">Front</button><button data-angle="2">Back</button><button class="icon-button" data-action="reset-rotation" aria-label="Reset shoe view">${icon('rotate')}</button></div>
      <div class="detail-panel" id="detail-panel"></div>
    </section>
  </main>
  <footer class="footer"><button data-action="credits">© 2026 Nike concept · Credits</button><span>Move with a new perspective.</span><button data-action="motion" class="motion-toggle" aria-pressed="${!state.motion}"><span class="motion-dot"></span>Motion <span id="motion-state">${state.motion?'off':'on'}</span></button></footer>
  <dialog id="drawer" class="drawer" aria-labelledby="drawer-title"><div class="drawer-header"><h2 id="drawer-title">Your bag</h2><button class="icon-button" data-action="close-drawer" aria-label="Close panel">${icon('close')}</button></div><div id="drawer-body"></div></dialog>
  <dialog id="size-guide" class="size-guide" aria-labelledby="size-guide-title"><button class="icon-button dialog-close" data-action="close-guide" aria-label="Close size guide">${icon('close')}</button><h2 id="size-guide-title">Find your fit.</h2><p>Measure from heel to toe. If you’re between sizes, go half a size up.</p><table><caption>Men’s footwear size guide</caption><thead><tr><th>US</th><th>EU</th><th>Foot length</th></tr></thead><tbody><tr><td>7</td><td>40</td><td>25 cm</td></tr><tr><td>8</td><td>41</td><td>26 cm</td></tr><tr><td>9</td><td>42.5</td><td>27 cm</td></tr><tr><td>10</td><td>44</td><td>28 cm</td></tr><tr><td>11</td><td>45</td><td>29 cm</td></tr><tr><td>12</td><td>46</td><td>30 cm</td></tr></tbody></table><p class="muted">Apparel: S (chest 35–37.5″), M (37.5–41″), L (41–44″), XL (44–48.5″).</p></dialog>
  <div class="toast" role="status" aria-live="polite"></div>
`;

function duration(value){return state.motion ? 0 : value;}
function persist(){try{localStorage.setItem('nike-bag',JSON.stringify(state.bag));localStorage.setItem('nike-favorites',JSON.stringify(state.favorites));}catch{/* Private browsing can restrict storage. */}updateCounts();}
function updateCounts(){document.querySelector('.bag-count').textContent=state.bag.reduce((n,i)=>n+i.quantity,0);document.querySelector('.favorites-indicator').hidden=!state.favorites.length;}
function toast(message){clearTimeout(toastTimer);const el=document.querySelector('.toast');el.innerHTML=`${icon('check')}<span>${message}</span>`;gsap.to(el,{autoAlpha:1,y:0,duration:duration(.3),overwrite:true});toastTimer=setTimeout(()=>gsap.to(el,{autoAlpha:0,y:12,duration:duration(.3)}),3300);}

function updateHero(animate=true){
  const s=shoes[state.index];
  const el=document.querySelector('#hero-copy');
  const fill=()=>{
    el.innerHTML=`<p class="hero-intro">${s.category}</p><h1>${s.headline.map(l=>`<span>${l}</span>`).join('')}</h1><p class="hero-description">${s.description}</p><button class="primary-button" data-action="explore">Explore ${s.name.replace('Nike ','')} ${icon('arrow')}</button><span class="hero-smallprint">${s.model?'<span class="live-dot"></span> Experience in 3D':'More than a sneaker. A state of mind.'}</span>`;
    document.querySelector('#floating-label').textContent=s.name;
    document.querySelector('#floating-price').textContent=money(s.price);
    document.querySelector('#shoe-number').textContent=String(state.index+1).padStart(2,'0');
    document.querySelector('#drag-instruction').textContent=s.model?'Drag to rotate':'Drag to explore';
    const fallback=document.querySelector('.fallback-shoe');if(fallback){fallback.src=s.image;fallback.alt=s.name;}
    document.querySelectorAll('[data-shoe]').forEach(b=>{const selected=Number(b.dataset.shoe)===state.index;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',selected);});
  };
  activeTransition?.kill();
  if(animate&&!state.motion){
    activeTransition=gsap.timeline().to(el,{autoAlpha:0,y:-12,duration:.2}).add(fill).fromTo(el,{y:20},{autoAlpha:1,y:0,duration:.55,ease:'power3.out'});
  }else{fill();gsap.set(el,{autoAlpha:1,y:0});}
}

function selectShoe(index){state.index=index;state.color=0;scene?.select(index,!!state.detail);scene?.setColor(0);updateHero();syncUrl();}
function syncUrl(){const suffix=state.detail?`/${state.detail.type}/${state.detail.index}`:state.view==='footwear'&&state.index?`/${state.index}`:state.view==='looks'&&state.look?`/${state.look}`:'';history.replaceState(null,'',`#${state.view}${suffix}`);}
function setView(view,animate=true){
  if(!['footwear','layers','looks'].includes(view))view='footwear';
  closeDetail(false);
  const outgoing=document.querySelector('.view.is-active');
  const incoming=document.querySelector(`#view-${view}`);
  state.view=view;
  document.body.dataset.view=view;
  document.querySelectorAll('[data-view]').forEach(a=>{const active=a.dataset.view===view;a.classList.toggle('is-active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
  gsap.killTweensOf('.view');
  document.querySelectorAll('.view').forEach(el=>{el.classList.remove('is-active');el.hidden=true;el.inert=true;gsap.set(el,{clearProps:'opacity,visibility,transform'});});
  incoming.hidden=false;incoming.inert=false;incoming.classList.add('is-active');
  scene?.setVisible(view==='footwear');
  if(animate&&incoming!==outgoing){
    gsap.fromTo(incoming,{autoAlpha:0},{autoAlpha:1,duration:duration(.6)});
    if(view==='layers')gsap.fromTo('.hanging-item',{y:-45,rotation:3},{y:0,rotation:0,stagger:.08,duration:duration(1.3),ease:'power3.out',clearProps:'transform'});
    if(view==='looks')layoutLooks();
  }
  syncUrl();
}

function currentProduct(){return state.detail?.type==='garment'?garments[state.detail.index]:shoes[state.index];}
function renderDetail(){
  const p=currentProduct();const apparel=state.detail.type==='garment';
  const sizes=apparel?p.sizes:['US 7','US 7.5','US 8','US 8.5','US 9','US 9.5','US 10','US 10.5','US 11','US 12'];
  document.querySelector('#detail-panel').innerHTML=`<div class="detail-title-row"><span class="detail-kicker">${apparel?'Your everyday, elevated.':'An icon for a reason.'}</span><button class="icon-button favorite-button ${state.favorites.includes(p.id)?'is-saved':''}" data-action="favorite-product" aria-label="${state.favorites.includes(p.id)?'Remove from':'Add to'} favorites" aria-pressed="${state.favorites.includes(p.id)}">${icon('heart')}</button></div><h1>${p.name}</h1><p class="product-subtitle">${apparel?p.subtitle:'Men’s shoes'}</p><p class="product-price">${money(p.price)}</p><div class="color-section"><span id="color-name">${p.color}</span><div class="color-swatches">${p.colors.map((c,i)=>`<button class="swatch ${i===state.color?'is-selected':''}" style="--swatch:${c}" data-color="${i}" aria-label="Color ${i+1}: ${i===0?p.color:i===1?'Dark':'Neutral'}" aria-pressed="${i===state.color}"></button>`).join('')}</div></div><div class="size-label"><span>Select size</span><button data-action="size-guide">Size guide ${icon('arrow')}</button></div><div class="size-grid ${apparel?'apparel-sizes':''}">${sizes.map(s=>`<button data-size="${s}" class="${state.size===s?'is-selected':''}" aria-pressed="${state.size===s}">${s}</button>`).join('')}</div><p class="size-error" id="size-error" aria-live="polite"></p><button class="primary-button add-to-bag" data-action="add-product">Add to bag ${icon('plus')}</button><p class="shipping-note">Complimentary shipping. Free 30-day returns.</p><details class="product-accordion"><summary>Behind the design ${icon('plus')}</summary><p>${apparel?'An effortless fit. Considered details. Soft, premium fabric that feels as good as it looks. Made to become the layer you reach for, again and again.':p.description}</p></details><details class="product-accordion"><summary>Delivery & returns ${icon('plus')}</summary><p>This is an interactive concept store. Items are saved in your browser; checkout and payments are not connected.</p></details>`;
}

function openDetail(type,index){
  if(type==='shoe'){state.index=index;scene?.select(index,true);scene?.setColor(0);}
  state.detail={type,index};state.size=null;state.color=0;
  document.body.classList.add('has-detail');
  const detail=document.querySelector('#product-detail');detail.hidden=false;detail.inert=false;
  const apparel=type==='garment';
  if(!apparel){detail.prepend(document.querySelector('#shoe-stage'));detail.prepend(document.querySelector('.scene-controls'));}
  document.querySelector('#garment-detail-visual').hidden=!apparel;
  document.querySelector('#detail-view-switch').hidden=apparel;
  if(apparel){document.querySelector('#detail-garment').style.setProperty('--sprite',index);document.querySelector('#detail-garment').style.filter='none';scene?.setVisible(false);}
  else scene?.setVisible(true);
  renderDetail();
  gsap.fromTo('#detail-panel',{autoAlpha:0,x:35},{autoAlpha:1,x:0,duration:duration(.7),ease:'power3.out'});
  if(apparel)gsap.fromTo('#garment-detail-visual',{autoAlpha:0,rotationY:12},{autoAlpha:1,rotationY:0,duration:duration(.9),ease:'power3.out'});
  document.querySelector('.back-link').focus({preventScroll:true});
  syncUrl();
}
function closeDetail(sync=true){
  if(!state.detail)return;
  state.detail=null;state.size=null;
  document.querySelector('#view-footwear').prepend(document.querySelector('#shoe-stage'));
  document.querySelector('#view-footwear').append(document.querySelector('.scene-controls'));
  document.body.classList.remove('has-detail');
  const detail=document.querySelector('#product-detail');detail.hidden=true;detail.inert=true;
  scene?.select(state.index,false);scene?.setVisible(state.view==='footwear');
  if(sync){syncUrl();if(state.view==='footwear')document.querySelector('[data-action="explore"]')?.focus({preventScroll:true});}
}

function addProduct(p,size){
  if(!size){const error=document.querySelector('#size-error');if(error)error.textContent='Choose your size to add this to your bag.';document.querySelector('[data-size]')?.focus({preventScroll:true});return false;}
  const key=`${p.id}-${size}-${state.color}`;
  const existing=state.bag.find(item=>item.key===key);
  if(existing)existing.quantity++;
  else state.bag.push({key,id:p.id,name:p.name,price:p.price,size,color:state.color,quantity:1,type:garments.some(g=>g.id===p.id)?'garment':'shoe',index:garments.some(g=>g.id===p.id)?garments.findIndex(g=>g.id===p.id):shoes.findIndex(s=>s.id===p.id)});
  persist();toast(`${p.name} added to your bag`);return true;
}

function layoutLooks(animate=true){
  const mobile=innerWidth<760;
  const positions=mobile?[[42,1,1],[90,.7,.4],[120,.5,0],[-30,.5,0]]:[[25,1,1],[57,.76,.72],[78,.58,.48],[94,.45,.3]];
  document.querySelectorAll('.look-figure').forEach((el,i)=>{
    const rel=(i-state.look+4)%4;
    const [left,scale,alpha]=positions[rel];
    el.classList.toggle('is-selected',i===state.look);
    el.querySelector('[data-look]').setAttribute('aria-pressed',i===state.look);
    el.style.zIndex=String(5-rel);
    gsap.to(el,{xPercent:-50,left:`${left}%`,scale,autoAlpha:alpha,duration:animate?duration(.9):0,ease:'power3.inOut',overwrite:true});
  });
  const look=looks[state.look];
  document.querySelector('#look-number').textContent=`0${state.look+1} / 04`;
  document.querySelector('#look-name').textContent=look.name;
  document.querySelector('#look-shop').innerHTML=`<span class="section-intro">The pieces make the look.</span><h2>${look.name}</h2><p class="look-caption">${look.caption}</p><div class="look-items">${look.items.map((index,n)=>{const g=garments[index];return `<button class="look-product" data-garment="${index}"><span class="look-product-art garment-art" style="--sprite:${index}"></span><span><strong>${g.name}</strong><span>${g.subtitle}</span><span>${money(g.price)}</span></span>${icon('plus')}</button>`;}).join('')}<button class="look-product" data-shoe-detail="3"><img src="/assets/air-max-blue.png" alt="" width="100" height="80"/><span><strong>Nike Air Max 90</strong><span>Men’s shoes</span><span>${money(130)}</span></span>${icon('plus')}</button></div><p class="look-total"><span>The complete look</span><strong>${money(look.items.reduce((n,i)=>n+garments[i].price,130))}</strong></p><button class="primary-button" data-action="shop-look">Shop this look ${icon('arrow')}</button><span class="look-note">Select a piece to choose your size.</span>`;
}

function productArt(type,index){return type==='garment'?`<span class="drawer-art garment-art" style="--sprite:${index}"></span>`:`<img class="drawer-art" src="${shoes[index].image}" width="100" height="100" alt=""/>`;}
function showDrawer(kind){
  const dialog=document.querySelector('#drawer');
  dialog.dataset.kind=kind;
  document.querySelector('#drawer-title').textContent=kind==='bag'?'Your bag':kind==='favorites'?'Saved for later':kind==='look'?'Make the look yours.':kind==='credits'?'Behind the experience.':'Find your next move.';
  renderDrawer(kind);
  if(!dialog.open)dialog.showModal();
  scene?.setSuspended(true);
  gsap.fromTo(dialog,{x:40,autoAlpha:0},{x:0,autoAlpha:1,duration:duration(.35),ease:'power3.out'});
}
function renderDrawer(kind){
  const body=document.querySelector('#drawer-body');
  if(kind==='bag'){
    body.innerHTML=state.bag.length?`<p class="drawer-intro">Good choices. Great moves.</p><div class="bag-items">${state.bag.map((item,i)=>`<div class="bag-item">${productArt(item.type,item.index)}<div class="bag-item-info"><strong>${item.name}</strong><span>Size: ${item.size}</span><span>${money(item.price)}</span><div class="quantity-controls"><button data-quantity="${i}" data-delta="-1" aria-label="Decrease quantity of ${item.name}">−</button><span>${item.quantity}</span><button data-quantity="${i}" data-delta="1" aria-label="Increase quantity of ${item.name}">+</button><button class="remove-item" data-remove="${i}">Remove</button></div></div></div>`).join('')}</div><div class="bag-summary"><div><span>Subtotal</span><strong>${money(state.bag.reduce((n,i)=>n+i.price*i.quantity,0))}</strong></div><p>Shipping is complimentary.</p><button class="primary-button" data-action="checkout">Review your bag ${icon('arrow')}</button><span class="demo-note">Concept store · No payment required</span></div>`:`<div class="empty-state">${icon('bag')}<h3>A little room for possibility.</h3><p>Your bag is waiting for its first great find.</p><button class="primary-button" data-action="close-drawer">Explore the collection ${icon('arrow')}</button></div>`;
  } else if(kind==='favorites'){
    const items=[...shoes.map((p,i)=>({...p,type:'shoe',index:i})),...garments.map((p,i)=>({...p,type:'garment',index:i}))].filter(p=>state.favorites.includes(p.id));
    body.innerHTML=items.length?`<p class="drawer-intro">Keep your favorites close.</p>${items.map(p=>`<button class="search-result" data-result-type="${p.type}" data-result-index="${p.index}">${productArt(p.type,p.index)}<span><strong>${p.name}</strong><span>${money(p.price)}</span></span>${icon('arrow')}</button>`).join('')}`:`<div class="empty-state">${icon('heart')}<h3>Find something you love.</h3><p>Tap the heart on a product to save it here.</p><button class="primary-button" data-action="close-drawer">Keep exploring ${icon('arrow')}</button></div>`;
  } else if(kind==='look'){
    const look=looks[state.look];
    const products=[...look.items.map(i=>({...garments[i],type:'garment',index:i})),{...shoes[3],type:'shoe',index:3}];
    body.innerHTML=`<p class="drawer-intro">${look.name}. Choose a size for each piece.</p><form id="look-form">${products.map((p,i)=>`<div class="bundle-product">${productArt(p.type,p.index)}<div><strong>${p.name}</strong><span>${money(p.price)}</span><label for="bundle-${i}">Size</label><select id="bundle-${i}" name="size-${i}" required><option value="">Choose a size</option>${(p.type==='shoe'?['US 7','US 8','US 9','US 10','US 11','US 12']:p.sizes).map(s=>`<option>${s}</option>`).join('')}</select></div></div>`).join('')}<p class="look-total"><span>Complete look</span><strong>${money(products.reduce((n,p)=>n+p.price,0))}</strong></p><button type="submit" class="primary-button bundle-submit">Add look to bag ${icon('plus')}</button></form>`;
    document.querySelector('#look-form').addEventListener('submit',event=>{event.preventDefault();products.forEach((p,i)=>addProduct(p,document.querySelector(`#bundle-${i}`).value));dialogClose();toast('Your complete look is in the bag.');});
  } else if(kind==='credits'){
    body.innerHTML=`<div class="credits-content"><p>An independent recreation inspired by the supplied reference video. Product names and prices are illustrative.</p><h3>3D model</h3><p>“Nike Air Mag” by <a href="https://sketchfab.com/pandan" target="_blank" rel="noreferrer">pandan</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Converted from embedded glTF to GLB; presentation and lighting adjusted.</p><h3>Photography & artwork</h3><p>Footwear images from Adrian Hajdin’s Nike landing page demo. Lookbook, hanging garments and landscape are generated artwork for this concept.</p><h3>Built to move</h3><p>Three.js, GSAP, DM Sans and Barlow Condensed. All runtime assets are hosted locally.</p></div>`;
  } else {
    body.innerHTML=`<form class="search-form" role="search"><label for="search-input">Search footwear & layers</label><div>${icon('search')}<input id="search-input" name="q" type="search" autocomplete="off" placeholder="Try Air Max or hoodie…" /></div></form><div id="search-results"></div>`;
    updateSearch('');
    document.querySelector('#search-input').addEventListener('input',event=>updateSearch(event.target.value));
    document.querySelector('.search-form').addEventListener('submit',event=>event.preventDefault());
  }
}
function dialogClose(){document.querySelector('#drawer').close();}
function updateSearch(query){
  const all=[...shoes.map((p,i)=>({...p,type:'shoe',index:i})),...garments.map((p,i)=>({...p,type:'garment',index:i}))];
  const results=all.filter(p=>`${p.name} ${p.subtitle||''}`.toLowerCase().includes(query.toLowerCase().trim()));
  document.querySelector('#search-results').innerHTML=`<p class="search-count" role="status">${query?`${results.length} results`:'Explore the collection'}</p>${results.map(p=>`<button class="search-result" data-result-type="${p.type}" data-result-index="${p.index}">${productArt(p.type,p.index)}<span><strong>${p.name}</strong><span>${money(p.price)}</span></span>${icon('arrow')}</button>`).join('')}${results.length?'':'<p class="muted">No matches yet. Try “Air”, “Club”, or “Nike”.</p>'}`;
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button,a[data-view],a.brand');if(!button)return;
  if(button.matches('a[data-view],a.brand')){event.preventDefault();setView(button.dataset.view||'footwear');return;}
  if(button.dataset.shoe!==undefined){selectShoe(Number(button.dataset.shoe));return;}
  if(button.dataset.garment!==undefined){if(state.view!=='layers')setView('layers');openDetail('garment',Number(button.dataset.garment));return;}
  if(button.dataset.shoeDetail!==undefined){setView('footwear');openDetail('shoe',Number(button.dataset.shoeDetail));return;}
  if(button.dataset.hotspot){
    if(button.dataset.hotspot==='bottom'){setView('footwear');openDetail('shoe',3);}
    else {const garment=looks[state.look].items[0];setView('layers');openDetail('garment',garment);}
    return;
  }
  if(button.dataset.look!==undefined){state.look=Number(button.dataset.look);layoutLooks();syncUrl();return;}
  if(button.dataset.size){state.size=button.dataset.size;document.querySelectorAll('[data-size]').forEach(el=>{const yes=el===button;el.classList.toggle('is-selected',yes);el.setAttribute('aria-pressed',yes);});document.querySelector('#size-error').textContent='';return;}
  if(button.dataset.color!==undefined){state.color=Number(button.dataset.color);scene?.setColor(state.color);document.querySelectorAll('[data-color]').forEach(el=>{el.classList.toggle('is-selected',el===button);el.setAttribute('aria-pressed',el===button);});document.querySelector('#color-name').textContent=state.color===0?currentProduct().color:state.color===1?'Dark / Anthracite':'Neutral / Soft Sage';if(state.detail?.type==='garment'){document.querySelector('#detail-garment').style.filter=state.color===0?'none':state.color===1?'brightness(.65)':'sepia(.3)';}return;}
  if(button.dataset.angle!==undefined){scene?.setAngle(Number(button.dataset.angle));document.querySelectorAll('[data-angle]').forEach(el=>el.classList.toggle('is-selected',el===button));return;}
  if(button.dataset.resultType){document.querySelector('#drawer').close();setView(button.dataset.resultType==='shoe'?'footwear':'layers');openDetail(button.dataset.resultType,Number(button.dataset.resultIndex));return;}
  if(button.dataset.quantity!==undefined){const i=Number(button.dataset.quantity);state.bag[i].quantity+=Number(button.dataset.delta);if(state.bag[i].quantity<=0)state.bag.splice(i,1);persist();renderDrawer('bag');return;}
  if(button.dataset.remove!==undefined){const removed=state.bag.splice(Number(button.dataset.remove),1)[0];persist();renderDrawer('bag');toast(`${removed.name} removed from bag`);return;}
  switch(button.dataset.action){
    case 'explore':openDetail('shoe',state.index);break;
    case 'back':closeDetail();break;
    case 'bag':showDrawer('bag');break;
    case 'favorites':showDrawer('favorites');break;
    case 'search':showDrawer('search');break;
    case 'close-drawer':document.querySelector('#drawer').close();break;
    case 'size-guide':document.querySelector('#size-guide').showModal();break;
    case 'close-guide':document.querySelector('#size-guide').close();break;
    case 'add-product':if(addProduct(currentProduct(),state.size)){button.innerHTML=`Added to bag ${icon('check')}`;setTimeout(()=>{if(button.isConnected)button.innerHTML=`Add to bag ${icon('plus')}`;},1800);}break;
    case 'favorite-product':{const id=currentProduct().id;state.favorites=state.favorites.includes(id)?state.favorites.filter(i=>i!==id):[...state.favorites,id];persist();const yes=state.favorites.includes(id);button.classList.toggle('is-saved',yes);button.setAttribute('aria-pressed',yes);button.setAttribute('aria-label',`${yes?'Remove from':'Add to'} favorites`);toast(yes?'Saved to your favorites':'Removed from favorites');break;}
    case 'rotate-left':scene?.rotateBy(-Math.PI/5);break;
    case 'rotate-right':scene?.rotateBy(Math.PI/5);break;
    case 'reset-rotation':scene?.resetRotation();break;
    case 'pause':state.paused=!state.paused;scene?.setPaused(state.paused);button.innerHTML=icon(state.paused?'play':'pause');button.setAttribute('aria-pressed',state.paused);button.setAttribute('aria-label',state.paused?'Resume floating animation':'Pause floating animation');break;
    case 'motion':state.motion=!state.motion;scene?.setReduced(state.motion);document.body.classList.toggle('reduce-motion',state.motion);document.querySelector('#motion-state').textContent=state.motion?'off':'on';button.setAttribute('aria-pressed',!state.motion);break;
    case 'prev-look':state.look=(state.look+3)%4;layoutLooks();syncUrl();break;
    case 'next-look':state.look=(state.look+1)%4;layoutLooks();syncUrl();break;
    case 'shop-look':showDrawer('look');break;
    case 'credits':showDrawer('credits');break;
    case 'checkout':toast('Your bag is saved. This concept does not process payments.');break;
  }
});

document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>scene?.setSuspended(false));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();document.querySelector('#main').focus();});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.target.matches('input,textarea'))return;
  if(event.key==='Escape'&&state.detail){closeDetail();return;}
  if(event.target.closest('button,a')&&event.key!=='Escape')return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
    event.preventDefault();const direction=event.key==='ArrowRight'?1:-1;
    if(state.view==='footwear'&&!state.detail)selectShoe((state.index+direction+4)%4);
    if(state.view==='looks'&&!state.detail){state.look=(state.look+direction+4)%4;layoutLooks();syncUrl();}
  }
});
function readRoute(){const [view,type,index]=location.hash.slice(1).split('/');setView(view||'footwear',false);if(type==='shoe'||type==='garment'){const max=type==='shoe'?shoes.length:garments.length;const i=Number(index);if(Number.isInteger(i)&&i>=0&&i<max)openDetail(type,i);}else if(type&&Number(type)>=0&&Number(type)<4){if(view==='looks'){state.look=Number(type);layoutLooks(false);}else if(view==='footwear'){state.index=Number(type);updateHero(false);scene?.select(state.index,false);}}}
updateHero(false);updateCounts();layoutLooks(false);
scene=new ShoeScene(document.querySelector('#shoe-stage'),{
  onSelect:selectShoe,
  onOpen:()=>openDetail('shoe',state.index),
  onProgress:percent=>{document.querySelector('#load-percent').textContent=percent;},
  onReady:()=>{document.body.classList.add('scene-ready');document.querySelector('.scene-loader').hidden=true;scene.select(state.index,!!state.detail);},
  onError:()=>{
    document.body.classList.add('scene-fallback');document.querySelector('.scene-loader').hidden=true;
    const stage=document.querySelector('#shoe-stage');
    if(!stage.querySelector('canvas')){stage.innerHTML=`<img class="fallback-shoe" src="${shoes[state.index].image}" width="560" height="480" alt="${shoes[state.index].name}" />`;stage.classList.add('is-ready');}
    document.querySelector('#drag-instruction').textContent='Product view';
  },
});
if(import.meta.env.DEV)window.__nikeScene=scene;
readRoute();
addEventListener('hashchange',readRoute);
addEventListener('resize',()=>{if(state.view==='looks')layoutLooks(false);});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{state.motion=event.matches;scene?.setReduced(state.motion);document.querySelector('#motion-state').textContent=state.motion?'off':'on';});
if(state.motion)document.body.classList.add('reduce-motion');
document.fonts.ready.then(()=>{
  if(!state.motion&&!state.detail)gsap.fromTo('.hero-copy > *',{autoAlpha:0,y:24},{autoAlpha:1,y:0,stagger:.07,duration:.8,ease:'power3.out'});
});
