import * as T from 'three'
const clamp = (x:number) => Math.max(0,Math.min(1,x))
const gaussian = (distance:number,width:number) => Math.exp(-distance*distance/(width*width))

/** 针对本模型的程序形变近似；原 GLB 不改，不声称为解剖或肌肉仿真。 */
export function addContactDeformations(mesh:T.SkinnedMesh) {
  const geometry=mesh.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal')
  const grip=new Float32Array(position.count*3),press=new Float32Array(position.count*3)
  const joints=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight')
  for(let i=0;i<position.count;i++) {
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i)
    const ids=[joints.getX(i),joints.getY(i),joints.getZ(i),joints.getW(i)],w=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)]
    const name=mesh.skeleton.bones[ids[w.indexOf(Math.max(...w))]].name
    if(name==='hand_r') {
      const dorsal=clamp((y-.052)/.014),longitudinal=gaussian(z+.077,.039)
      const u=clamp((-z-.03)/.085)
      let ridge=0
      for(const end of [.072,.045,.017,-.007]) ridge+=gaussian(x-(.025+(end-.025)*u),.003)
      grip[i*3+1]=Math.min(1,ridge)*longitudinal*dorsal*.00085
      const palm=clamp((.05-y)/.015)*gaussian(x-.03,.028)*gaussian(z+.082,.032)
      grip[i*3+1]+=palm*.0012
    }
    if(name==='index_03_r') {
      const pad=clamp((.041-y)/.011)
      press[i*3]=normal.getX(i)*pad*.00025
      press[i*3+1]=pad*.00085
      press[i*3+2]=normal.getZ(i)*pad*.00025
    }
  }
  geometry.morphTargetsRelative=true
  geometry.morphAttributes.position=[new T.Float32BufferAttribute(grip,3),new T.Float32BufferAttribute(press,3)]
  geometry.morphAttributes.position[0].name='gripTension';geometry.morphAttributes.position[1].name='padCompression'
  // 形变后法线一起变化，避免只动轮廓而照明还停在原表面。
  geometry.morphAttributes.normal=[grip,press].map(delta=>{
    const target=geometry.clone();target.morphAttributes={}
    const positions=new Float32Array(position.array)
    for(let i=0;i<positions.length;i++) positions[i]+=delta[i]
    target.setAttribute('position',new T.Float32BufferAttribute(positions,3));target.computeVertexNormals()
    const changed=target.getAttribute('normal'),result=new Float32Array(normal.count*3)
    for(let i=0;i<normal.count;i++){result[i*3]=changed.getX(i)-normal.getX(i);result[i*3+1]=changed.getY(i)-normal.getY(i);result[i*3+2]=changed.getZ(i)-normal.getZ(i)}
    target.dispose();return new T.Float32BufferAttribute(result,3)
  })
  mesh.updateMorphTargets()
}
