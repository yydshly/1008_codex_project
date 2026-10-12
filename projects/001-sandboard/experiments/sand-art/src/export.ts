import type { ArtRenderer } from './render'
import type { ArtRenderOptions } from './model'

// 重新绘制到离屏纹理，导出只有作品的 PNG，不包含工具栏和光标。
export async function exportPainting(device: GPUDevice, renderer: ArtRenderer, format: GPUTextureFormat, stateIndex: number, options: ArtRenderOptions): Promise<Blob> {
  const width = 1536
  const height = 1152
  const rowBytes = width * 4
  const texture = device.createTexture({ label: 'Sand art export', size: [width, height], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  const staging = device.createBuffer({ label: 'Sand art PNG readback', size: rowBytes * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
  try {
    const encoder = device.createCommandEncoder()
    renderer.encode(encoder, texture.createView(), stateIndex, { ...options, cursor: null })
    encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow: rowBytes }, [width, height])
    device.queue.submit([encoder.finish()])
    await staging.mapAsync(GPUMapMode.READ)
    const pixels = new Uint8ClampedArray(rowBytes * height)
    pixels.set(new Uint8Array(staging.getMappedRange()))
    staging.unmap()
    if (format.startsWith('bgra')) {
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index]
        pixels[index] = pixels[index + 2]
        pixels[index + 2] = red
      }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法生成作品图片')
    context.putImageData(new ImageData(pixels, width, height), 0, 0)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片导出失败')), 'image/png'))
  } finally { staging.destroy(); texture.destroy() }
}
