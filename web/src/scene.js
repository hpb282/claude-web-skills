import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { shoes } from './data.js';

export class ShoeScene {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.index = 0;
    this.detail = false;
    this.paused = false;
    this.visible = true;
    this.suspended = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.groups = [];
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.drag = null;
    this.time = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-8,8,4.5,-4.5,0.1,80);
    this.camera.position.set(0,0,20);
    try {
      this.renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'high-performance'});
    } catch {
      callbacks.onError();
      return;
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.setClearColor(0x000000,0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .94;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden','true');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room,.04).texture;
    room.dispose(); pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xbcb7ae,1.8));
    const key = new THREE.DirectionalLight(0xffffff,2.6);
    key.position.set(-3,6,8); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xe6f2ff,2);
    rim.position.set(5,2,-4); this.scene.add(rim);
    this.resize = this.resize.bind(this);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(container);
    this.createShoes();
    this.bindPointer();
    this.tick = this.tick.bind(this);
    this.renderer.setAnimationLoop(this.tick);
    document.addEventListener('visibilitychange',()=>{
      this.renderer.setAnimationLoop(document.hidden ? null : this.tick);
    });
  }

  createShoes() {
    const textureLoader = new THREE.TextureLoader();
    shoes.forEach((shoe,i)=>{
      const anchor = new THREE.Group();
      const float = new THREE.Group();
      const pivot = new THREE.Group();
      anchor.add(float); float.add(pivot);
      anchor.userData = {index:i,float,pivot};
      this.groups.push(anchor);
      this.scene.add(anchor);
      if(i>0) {
        textureLoader.load(shoe.image,texture=>{
          texture.colorSpace = THREE.SRGBColorSpace;
          const material = new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false});
          const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.8,4.8),material);
          plane.userData.index = i;
          pivot.add(plane);
          this.draw();
        });
      }
    });
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    loader.load('/assets/air-mag.glb', gltf=>{
      // The exported OBJ wrapper has an additional coordinate transform.
      // Use the authored mesh directly so the shoe rests upright.
      const authoredMesh = gltf.scene.getObjectByProperty('isMesh',true);
      const model = new THREE.Group();
      model.add(authoredMesh);
      model.rotation.x = -2;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 5.5 / Math.max(size.x,size.y,size.z);
      const normalized = new THREE.Group();
      normalized.add(model);
      model.position.sub(center);
      normalized.scale.setScalar(scale);
      this.model = normalized;
      model.traverse(mesh=>{
        if(mesh.isMesh){
          mesh.userData.index = 0;
          mesh.material.envMapIntensity = 1.2;
          mesh.material.emissiveIntensity = .8;
          this.originalMaterial = mesh.material.clone();
          this.modelMesh = mesh;
        }
      });
      this.groups[0].userData.pivot.add(normalized);
      this.layout(false);
      this.container.classList.add('is-ready');
      this.callbacks.onReady();
      draco.dispose();
    },event=>{
      if(event.total) this.callbacks.onProgress(Math.round(event.loaded / event.total * 100));
    },()=>{
      this.callbacks.onError();
      textureLoader.load('/assets/air-max-blue.png',texture=>{
        texture.colorSpace=THREE.SRGBColorSpace;
        const plane=new THREE.Mesh(new THREE.PlaneGeometry(5.8,4.8),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));
        plane.userData.index=0;
        this.groups[0].userData.pivot.add(plane);
        this.container.classList.add('is-ready');
        this.callbacks.onReady();
      });
    });
    this.resize();
  }

  resize() {
    if(!this.renderer)return;
    const {width,height} = this.container.getBoundingClientRect();
    this.aspect = width / Math.max(height,1);
    this.mobile = width < 760;
    const h = this.mobile ? 6.6 : 8.8;
    this.viewHeight=h;
    this.camera.left = -h * this.aspect / 2;
    this.camera.right = h * this.aspect / 2;
    this.camera.top = h/2; this.camera.bottom = -h/2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height);
    this.layout(false);
    this.draw();
  }

  layout(animate=true) {
    if(!this.groups.length)return;
    const duration = animate && !this.reduced ? 1.1 : 0;
    const w = this.aspect * this.viewHeight;
    this.groups.forEach((g,i)=>{
      const rel = (i-this.index+4)%4;
      let x,y,s,z,rz;
      if(this.detail){
        x = this.mobile ? 0 : -w*.2; y = this.mobile ? .2 : 0;
        s = rel===0 ? (this.mobile ? 1.08 : 1.3) : 0;
        z = rel===0 ? 2 : -2; rz = 0;
      } else if(this.mobile){
        const layouts = [[0,-.1,.95,2,-.1],[w*.35,1.85,.22,-1,.12],[-w*.34,-1.7,.18,-2,-.22],[w*.4,-1.9,.2,-1,.08]];
        [x,y,s,z,rz] = layouts[rel];
      } else {
        const layouts = [[w*.155,-.12,1.13,2,-.12],[w*.35,2.12,.43,-2,.13],[w*.39,-2,.36,-1,-.13],[w*.015,2.48,.32,-3,-.25]];
        [x,y,s,z,rz] = layouts[rel];
      }
      gsap.to(g.position,{x,y,z,duration,ease:'power3.inOut',overwrite:true});
      gsap.to(g.scale,{x:s,y:s,z:s,duration,ease:'power3.inOut',overwrite:true});
      gsap.to(g.userData.pivot.rotation,{x:i===0?.06:0,y:i===0?-1.2:0,z:rz,duration,ease:'power3.inOut',overwrite:true});
    });
  }

  select(index,detail=false) { this.index=index; this.detail=detail; this.layout(); }
  setVisible(visible) { this.visible=visible; this.container.style.visibility=visible?'visible':'hidden'; }
  setPaused(value) { this.paused=value; }
  setSuspended(value) { this.suspended=value; }
  setReduced(value) { this.reduced=value; this.layout(false); }
  resetRotation() { this.layout(); }
  setColor(index) {
    const shades=[0xffffff,0x6f7b83,0xc6d7bf];
    const mesh=this.index===0?this.modelMesh:this.groups[this.index]?.userData.pivot.children[0];
    if(!mesh)return;
    gsap.to(mesh.material.color,{r:new THREE.Color(shades[index]).r,g:new THREE.Color(shades[index]).g,b:new THREE.Color(shades[index]).b,duration:.4});
  }
  setAngle(index) {
    const p=this.groups[this.index]?.userData.pivot;
    if(p)gsap.to(p.rotation,{x:.06,y:[-1.2,0,Math.PI][index],z:0,duration:this.reduced?0:.7,ease:'power2.out',overwrite:'auto'});
  }
  rotateBy(value) {
    const p=this.groups[this.index]?.userData.pivot;
    if(p) gsap.to(p.rotation,{y:p.rotation.y+value,duration:this.reduced?0:.6,ease:'power2.out',overwrite:'auto'});
  }
  hit(event) {
    const rect=this.container.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.groups,true);
    return hits.find(hit=>hit.object.userData.index!==undefined)?.object.userData.index;
  }
  bindPointer() {
    const canvas=this.renderer.domElement;
    canvas.addEventListener('pointerdown',event=>{
      const index=this.hit(event);
      if(index===undefined)return;
      this.drag={x:event.clientX,y:event.clientY,index,moved:false};
      canvas.setPointerCapture(event.pointerId);
      gsap.killTweensOf(this.groups[index].userData.pivot.rotation);
    });
    canvas.addEventListener('pointermove',event=>{
      if(this.drag){
        const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;
        if(Math.abs(dx)+Math.abs(dy)>4)this.drag.moved=true;
        if(this.drag.moved && this.drag.index===this.index){
          const p=this.groups[this.index].userData.pivot;
          p.rotation.y+=dx*.009; p.rotation.x+=dy*.004;
          this.drag.x=event.clientX; this.drag.y=event.clientY;
          canvas.style.cursor='grabbing';
        }
      } else canvas.style.cursor=this.hit(event)!==undefined?'grab':'default';
    });
    canvas.addEventListener('pointerup',event=>{
      if(!this.drag)return;
      const {index,moved}=this.drag;
      this.drag=null; canvas.style.cursor='grab';
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(!moved){
        if(index!==this.index)this.callbacks.onSelect(index);
        else if(!this.detail)this.callbacks.onOpen();
      }
    });
    canvas.addEventListener('pointercancel',()=>{this.drag=null;});
  }
  draw(){if(this.renderer&&this.visible)this.renderer.render(this.scene,this.camera);}
  tick() {
    if(!this.visible || document.hidden || this.suspended)return;
    if(!this.paused&&!this.reduced&&!this.drag){
      this.time+=.012;
      this.groups.forEach((g,i)=>{
        g.userData.float.position.y=Math.sin(this.time+i*1.7)*(i===this.index?.065:.1);
        g.userData.float.rotation.z=Math.sin(this.time*.6+i)*.012;
      });
    }
    this.draw();
  }
}
