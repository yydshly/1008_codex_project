import * as T from 'three'

const hash = `float detailHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }`

/** 原始肤色贴图保留。微孔只影响表面法线与粗糙度，不把色斑当作大块凹凸。 */
export function contactSkin(skin: T.Texture) {
  const material = new T.MeshPhysicalMaterial({ map: skin, bumpMap: skin, bumpScale: .000025, color: '#fff8f0', roughness: .53,
    metalness: 0, specularIntensity: .48, side: T.DoubleSide })
  material.onBeforeCompile = shader => {
    shader.fragmentShader = hash + '\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      vec2 poreCoords = vMapUv * 5400.0;
      vec2 poreCell = floor(poreCoords);
      float poreNoise = detailHash(poreCell);
      vec2 poreCentre = vec2(0.25+0.5*poreNoise,0.25+0.5*detailHash(poreCell+vec2(17.0,43.0)));
      vec2 poreLocal = fract(poreCoords) - poreCentre;
      float poreRadius = 0.055 + poreNoise * 0.065;
      float poreShape = exp(-dot(poreLocal,poreLocal)/(poreRadius*poreRadius*0.36))*(1.0-smoothstep(poreRadius*0.75,poreRadius,length(poreLocal)));
      float poreResolved = 1.0-smoothstep(0.45,0.95,max(fwidth(poreCoords.x),fwidth(poreCoords.y)));
      float poreHeight = -0.000006 * poreShape * poreResolved;
      roughnessFactor = clamp(roughnessFactor + (poreNoise-0.5)*0.065*poreResolved,0.38,0.67);
    `).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      normal = perturbNormalArb(-vViewPosition,normal,vec2(dFdx(poreHeight),dFdy(poreHeight)),faceDirection);
    `)
  }
  material.customProgramCacheKey = () => 'contact-skin-v21'
  return material
}

export function contactCloth() {
  const material = new T.MeshStandardMaterial({ color: '#323a37', roughness: .93, side: T.DoubleSide })
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vClothUv;\n' + shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvClothUv = uv;')
    shader.fragmentShader = 'varying vec2 vClothUv;\n' + hash + '\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 weave = vClothUv * vec2(340.0,580.0);
      float resolved = 1.0-smoothstep(0.7,1.6,max(fwidth(weave.x),fwidth(weave.y)));
      float thread = sin(weave.x*6.28318)*sin(weave.y*6.28318);
      float fiber = detailHash(floor(weave));
      diffuseColor.rgb *= 0.92 + (thread*0.16+(fiber-0.5)*0.14)*resolved;
    `)
  }
  material.customProgramCacheKey = () => 'contact-cloth-v21'
  return material
}

/** 袖口与前臂布料几何；起点贴住原模型腕部，褶皱随手势轻微变形。 */
export class ContactSleeve extends T.Group {
  private readonly sleeve: T.Mesh<T.CylinderGeometry, T.MeshStandardMaterial>
  private readonly rest: Float32Array
  private readonly band: T.Mesh
  private readonly seam: T.Mesh

  constructor() {
    super()
    const geometry = new T.CylinderGeometry(.046, .034, .55, 56, 40, true)
    geometry.rotateX(Math.PI / 2); geometry.scale(1, .76, 1)
    const vertices = geometry.getAttribute('position')
    this.rest = new Float32Array(vertices.array)
    this.sleeve = new T.Mesh(geometry, contactCloth())
    this.sleeve.position.set(.025, .047, .248)
    this.sleeve.castShadow = true; this.sleeve.receiveShadow = true
    this.band = new T.Mesh(new T.CylinderGeometry(.0345, .0345, .026, 56, 5, true), contactCloth())
    this.band.geometry.rotateX(Math.PI / 2); this.band.geometry.scale(1, .76, 1)
    this.band.position.set(.025, .047, -.014)
    this.band.castShadow = true; this.band.receiveShadow = true
    this.seam = new T.Mesh(new T.TorusGeometry(.0345, .00065, 5, 72), new T.MeshStandardMaterial({ color: '#59635a', roughness: .96 }))
    this.seam.scale.y = .76; this.seam.position.set(.025, .047, -.026)
    this.add(this.sleeve, this.band, this.seam)
    this.pose(0)
  }

  pose(flex: number) {
    const vertices = this.sleeve.geometry.getAttribute('position')
    for (let i = 0; i < vertices.count; i++) {
      const x = this.rest[i * 3], y = this.rest[i * 3 + 1], z = this.rest[i * 3 + 2]
      const u = (z + .275) / .55, theta = Math.atan2(y / .76, x)
      const envelope = Math.min(1, u * 45) * Math.exp(-u * 5)
      const fold = (.0016 + flex * .00065) * envelope * (Math.sin(u * 105 + theta * 2.5) + .4 * Math.sin(u * 61 - theta * 4))
      const shape = 1 + fold / .039
      vertices.setXYZ(i, x * shape, y * shape + .003 * Math.sin(u * Math.PI) * flex, z)
    }
    vertices.needsUpdate = true; this.sleeve.geometry.computeVertexNormals()
  }

  dispose() { for (const mesh of [this.sleeve, this.band, this.seam]) { mesh.geometry.dispose(); (mesh.material as T.Material).dispose() } }
}
