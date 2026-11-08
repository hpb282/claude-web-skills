import * as THREE from 'three';
import gsap from 'gsap';
import {ShoeScene} from '../scene.js';
import {TYPES} from './lessons.js';

// Reuse the original scene's renderer, HDR room lighting, pointer capture,
// raycasting, drag-to-rotate, idle floating, visibility and motion controls.
export class SeedScene extends ShoeScene {
  resize(){const rect=this.container.getBoundingClientRect();if(rect.width>0&&rect.height>0)super.resize();}
  createShoes(){
    this.sprouts=[];
    TYPES.forEach((type,index)=>{
      const anchor=new THREE.Group(),float=new THREE.Group(),pivot=new THREE.Group();
      anchor.add(float);float.add(pivot);anchor.userData={index,float,pivot};
      const geo=new THREE.SphereGeometry(1,48,32);
      const positions=geo.attributes.position;
      for(let i=0;i<positions.count;i++){
        const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
        const taper=.83+.17*(1-y*y);
        positions.setXYZ(i,x*taper*.93,y*1.22,z*.69);
      }
      geo.computeVertexNormals();
      const mat=new THREE.MeshPhysicalMaterial({color:type.color,roughness:.35,metalness:.04,clearcoat:.65,clearcoatRoughness:.28});
      const kernel=new THREE.Mesh(geo,mat);kernel.rotation.z=-.4;pivot.add(kernel);
      const seamPoints=[];
      for(let i=0;i<=50;i++){
        const a=Math.PI*i/50;
        seamPoints.push(new THREE.Vector3(Math.sin(a)*.12,Math.cos(a)*1.21,Math.sin(a)*.695+.006));
      }
      const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPoints),50,.018,6,false),new THREE.MeshStandardMaterial({color:index===0?'#68442d':index===1?'#aa483e':'#aa5d78',roughness:.8}));
      seam.rotation.z=-.4;pivot.add(seam);
      const sprout=new THREE.Group();sprout.position.set(.34,.78,0);
      const stem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.12,.65,0),new THREE.Vector3(.04,1.25,0)]),24,.035,8,false),new THREE.MeshStandardMaterial({color:'#527c43',roughness:.5}));
      sprout.add(stem);
      const leafGeo=new THREE.SphereGeometry(1,32,16);
      for(const side of [-1,1]){
        const leaf=new THREE.Mesh(leafGeo,new THREE.MeshPhysicalMaterial({color:side===1?'#9bb96d':'#6e9456',roughness:.47,clearcoat:.25}));
        leaf.scale.set(.43,.13,.24);leaf.position.set(side*.3,side===1?1.03:.77,0);leaf.rotation.z=side*.45;sprout.add(leaf);
        const vein=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.65,8),new THREE.MeshBasicMaterial({color:'#d1dc9b'}));
        vein.rotation.z=-Math.PI/2+side*.45;vein.position.copy(leaf.position);vein.position.z=.16;sprout.add(vein);
      }
      sprout.scale.setScalar(.85);pivot.add(sprout);this.sprouts.push(sprout);
      pivot.traverse(object=>{if(object.isMesh)object.userData.index=index;});
      this.groups.push(anchor);this.scene.add(anchor);
    });
    this.container.classList.add('is-ready');
    this.resize();
    requestAnimationFrame(()=>this.callbacks.onReady?.());
  }
  layout(animate=true){
    if(!this.groups.length||!this.viewHeight)return;
    const duration=animate&&!this.reduced?1.05:0;
    const w=this.aspect*this.viewHeight;
    this.groups.forEach((g,i)=>{
      const rel=(i-this.index+3)%3;
      const positions=this.detail?[[0,-.1,1.25,2,-.12],[-w*.4,1.8,.36,-2,-.35],[w*.4,-1.7,.32,-2,.3]]:[[0,-.1,1.2,2,-.15],[w*.35,1.8,.54,-2,.25],[-w*.35,-1.3,.47,-2,-.35]];
      const [x,y,s,z,rz]=positions[rel];
      gsap.to(g.position,{x,y,z,duration,ease:'power3.inOut',overwrite:true});
      gsap.to(g.scale,{x:s,y:s,z:s,duration,ease:'power3.inOut',overwrite:true});
      gsap.to(g.userData.pivot.rotation,{x:.06,y:rel===0?-.12:.2,z:rz,duration,ease:'power3.inOut',overwrite:true});
    });
  }
  setGrowth(count){
    this.sprouts?.forEach(s=>gsap.to(s.scale,{x:.8+Math.min(count,8)*.035,y:.8+Math.min(count,8)*.04,z:.8+Math.min(count,8)*.035,duration:this.reduced?0:.7,ease:'back.out(1.5)'}));
  }
  setAngle(index){const p=this.groups[this.index]?.userData.pivot;if(p)gsap.to(p.rotation,{x:.06,y:[-.12,Math.PI/2,Math.PI][index],z:0,duration:this.reduced?0:.7,ease:'power2.out',overwrite:'auto'});}
}
