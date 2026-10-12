/** 有坡度阈值的局部移沙；关闭的木框边界，不新增或删除沙量。 */
export function relaxSand(density: Float32Array, width: number, height: number, cellX: number, cellZ: number, heightScale: number, phase: number) {
  const slope = .62
  const xLimit = slope * cellX / heightScale, zLimit = slope * cellZ / heightScale
  let moved = 0
  const transfer = (a: number, b: number, limit: number) => {
    const difference = density[a] - density[b], excess = Math.abs(difference) - limit
    if (excess <= .0001) return
    const flow = excess * .22 * Math.sign(difference)
    density[a] -= flow; density[b] += flow; moved += Math.abs(flow)
  }
  // 交替遍历方向，减少单向扫描产生的偏置；只松动超过阈值的坡面。
  if (phase % 2 === 0) {
    for (let y = 0; y < height; y++) for (let x = 0; x < width - 1; x++) transfer(y * width + x, y * width + x + 1, xLimit)
    for (let y = 0; y < height - 1; y++) for (let x = 0; x < width; x++) transfer(y * width + x, (y + 1) * width + x, zLimit)
  } else {
    for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x > 0; x--) transfer(y * width + x, y * width + x - 1, xLimit)
    for (let y = height - 1; y > 0; y--) for (let x = width - 1; x >= 0; x--) transfer(y * width + x, (y - 1) * width + x, zLimit)
  }
  return moved
}
