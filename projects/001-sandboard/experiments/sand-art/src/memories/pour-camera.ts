import * as T from 'three'
export type ContactView='angle'|'top'|'close'|'flow'

/** 固定俯视负责构图；侧面仅看落点上方几厘米，撒沙口在取景范围之外。 */
export function setPourCamera(camera:T.PerspectiveCamera,view:ContactView,target:T.Vector3) {
  camera.up.set(0,view==='top'?0:1,view==='top'?-1:0)
  if(view==='top') {camera.position.set(0,.65,.001);camera.lookAt(0,0,0)}
  else if(view==='angle') {camera.position.set(.05,.52,.38);camera.lookAt(0,0,0)}
  else if(view==='close') {camera.position.copy(target).add(new T.Vector3(.015,.23,.055));camera.lookAt(target)}
  else {camera.position.copy(target).add(new T.Vector3(.16,.07,.1));camera.lookAt(target)}
  camera.updateMatrixWorld()
}

/** 人物构图的斜视留出完整台面；近景固定位置，由页面选择人物或杯子。 */
export function setPhotoCamera(camera:T.PerspectiveCamera,view:ContactView,target:T.Vector3,sculpt=false){
  setPourCamera(camera,view,target)
  if(view==='angle'){camera.position.set(.035,.64,.42);camera.lookAt(0,0,0)}
  else if(view==='close'){camera.position.copy(target).add(sculpt?new T.Vector3(.025,.15,.075):new T.Vector3(.018,.18,.045));camera.lookAt(target)}
  if(view==='top'||view==='angle'){
    // 专注观看会改变画布比例；窄而高的画布也须保留完整台面。
    const fit=Math.max(1,1.35/camera.aspect)
    camera.position.multiplyScalar(fit)
    camera.lookAt(0,0,0)
  }
  camera.updateMatrixWorld()
}
