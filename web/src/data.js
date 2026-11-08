export const shoes = [
  { id: 'air-mag', name: 'Nike Air Mag', headline: ['AHEAD OF', 'ITS TIME.'], category: 'An icon. Reimagined.', description: 'Some things were never meant to blend in. Step into an icon that’s always one move ahead.', price: 350, color: 'Wolf Grey / Light Blue', colors: ['#aab3b8', '#343b3e', '#bac5b7'], image: '/assets/air-mag-thumb.png', tag: 'The future, on your feet', model: true },
  { id: 'air-max-pulse', name: 'Nike Air Max Pulse', headline: ['TURN UP', 'THE AIR.'], category: 'Inspired by the unexpected.', description: 'A little louder. A little bolder. Feel a new pulse with all-day comfort and unmistakable Air.', price: 150, color: 'Sail / Coral Chalk', colors: ['#e2b1a1', '#cdc8b8', '#33383d'], image: '/assets/air-max.png', tag: 'Made for your everyday', model: false },
  { id: 'air-max-dawn', name: 'Nike Air Max Dawn', headline: ['YOUR NEXT', 'FRESH START.'], category: 'Rooted in sport. Made for life.', description: 'Classic running roots. A fresh perspective. Take the long way home in a new kind of everyday essential.', price: 130, color: 'Sea Glass / Mint Foam', colors: ['#c1d2bd', '#d5cdc1', '#343c37'], image: '/assets/air-max-green.png', tag: 'A breath of fresh Air', model: false },
  { id: 'air-max-90', name: 'Nike Air Max 90', headline: ['NEVER', 'STAND STILL.'], category: 'The original never gets old.', description: 'Clean lines. Iconic Air. An everyday original for whatever the day has in store.', price: 130, color: 'Light Orewood / Ocean', colors: ['#8fa4b4', '#ddd5ca', '#363b43'], image: '/assets/air-max-blue.png', tag: 'An original state of mind', model: false },
];

export const garments = [
  { id:'club-hoodie', name:'Nike Club Fleece', subtitle:'Men’s pullover hoodie', price:75, color:'Black / White', index:0, sizes:['XS','S','M','L','XL'], colors:['#282a2b','#c1baaa','#69715e'] },
  { id:'club-crew', name:'Nike Solo Swoosh', subtitle:'Men’s fleece crew', price:85, color:'Sail / Summit White', index:1, sizes:['XS','S','M','L','XL'], colors:['#dcd7c6','#292c2c','#727762'] },
  { id:'premium-tee', name:'Nike Sportswear', subtitle:'Men’s premium T-shirt', price:45, color:'Medium Olive / Sail', index:2, sizes:['XS','S','M','L','XL'], colors:['#65694f','#d8d4c6','#303332'] },
  { id:'woven-jacket', name:'Nike Life', subtitle:'Men’s woven jacket', price:120, color:'Light Orewood Brown', index:3, sizes:['XS','S','M','L','XL'], colors:['#bdb5a4','#3d4440','#888771'] },
];

export const looks = [
  {name:'The everyday original', caption:'Less effort. More you.', model:0, items:[1,2], color:'Sail / Anthracite'},
  {name:'Off the clock', caption:'Comfort has a new look.', model:1, items:[2,0], color:'Medium Olive / Brown'},
  {name:'A different kind of blue', caption:'Good days start here.', model:2, items:[2,3], color:'Black / Washed Denim'},
  {name:'Your own pace', caption:'Easy layers. Endless possibility.', model:3, items:[3,1], color:'Light Orewood Brown'},
];

export const money = value => new Intl.NumberFormat('en-US',{ style:'currency',currency:'USD',maximumFractionDigits:0 }).format(value);
