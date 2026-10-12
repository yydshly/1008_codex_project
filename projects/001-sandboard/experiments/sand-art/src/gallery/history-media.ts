import { media } from '../research/media'
import willow from '../../../../assets/art-studies-v11/willow.png?url'
import person from '../../../../assets/art-product-v9/scene-2-real.png?url'
import lamp from '../../../../assets/art-product-v9/scene-3-real.png?url'

const extra: Record<string, string> = {
  'art-studies-v11/willow.png': willow,
  'art-product-v9/scene-2-real.png': person,
  'art-product-v9/scene-3-real.png': lamp,
}
export function historyMedia(path: string, root: URL) {
  if (/^generated-sandboard\/scene-[23]\.png$/.test(path)) return new URL(path, root).href
  return extra[path] ?? media[path]
}
