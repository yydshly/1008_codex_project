import {photoToSnapshot,settingsFor} from './model'

/** 离线读取原照结构；不把照片或目标沙量传给网页渲染器。 */
export function sculptPhotoTarget(pixels:Uint8ClampedArray,width:number,height:number){
  const settings={...settingsFor(),detail:.95,contrast:1.1,focusX:.67,focusY:.57,focusSize:.34}
  const portrait=photoToSnapshot(pixels,width,height,{...settings,style:'portrait'})
  const detail=photoToSnapshot(pixels,width,height,{...settings,style:'photo'})
  const area=(x:number,y:number,r:readonly number[])=>{
    const distance=Math.max(Math.abs((x-(r[0]+r[2])/2)/((r[2]-r[0])/2)),Math.abs((y-(r[1]+r[3])/2)/((r[3]-r[1])/2)))
    const t=Math.max(0,Math.min(1,(1-distance)/.38));return t*t*(3-2*t)
  }
  return Float32Array.from(portrait.density,(d,i)=>{
    const x=i%width/width,y=Math.floor(i/width)/height
    const weight=.86*Math.max(area(x,y,[.51,.17,.75,.51]),area(x,y,[.445,.49,.735,.85]))
    return d*(1-weight)+detail.density[i]*weight
  })
}
