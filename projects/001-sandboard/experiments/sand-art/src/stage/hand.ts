import type { StageHand } from './show'

/** Procedural hand gesture; the material and PNG remain independent of it. */
export function drawStageHand(ctx: CanvasRenderingContext2D, hand: StageHand, time: number) {
  const scale = ctx.canvas.width / 768 * 0.82
  const x = hand.x * ctx.canvas.width, y = hand.y * ctx.canvas.height
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(hand.rotation) * 0.32)
  ctx.scale(scale, scale)
  if (hand.pose === 'palm') ctx.translate(-1, -80)
  ctx.globalAlpha = hand.down ? 0.87 : 0.68
  ctx.translate(Math.sin(time * 2.5) * 0.6, Math.cos(time * 2.3) * 0.6)
  ctx.shadowColor = 'rgba(37,19,7,.38)'; ctx.shadowBlur = 15 * scale; ctx.shadowOffsetX = 7 * scale; ctx.shadowOffsetY = 10 * scale
  const skin = ctx.createLinearGradient(-55, -10, 52, 125)
  skin.addColorStop(0, '#e7bf91'); skin.addColorStop(0.4, '#c48f60'); skin.addColorStop(1, '#70452b')
  ctx.fillStyle = skin
  // The wrist fades into the performer side of the frame rather than a cursor ring.
  const armLength = ctx.canvas.height / scale + 180
  ctx.beginPath(); ctx.moveTo(-22, 106); ctx.bezierCurveTo(-20, 146, -13, 187, -15, armLength)
  ctx.lineTo(45, armLength); ctx.bezierCurveTo(38, 188, 24, 134, 27, 105); ctx.closePath(); ctx.fill()
  const capsule = (ax: number, ay: number, bx: number, by: number, radius: number) => {
    const angle = Math.atan2(by - ay, bx - ax)
    ctx.beginPath(); ctx.arc(ax, ay, radius, angle + Math.PI / 2, angle + Math.PI * 1.5)
    ctx.arc(bx, by, radius, angle - Math.PI / 2, angle + Math.PI / 2); ctx.closePath(); ctx.fill()
  }
  ctx.beginPath(); ctx.ellipse(1, 80, hand.pose === 'edge' ? 22 : 37, 43, -0.06, 0, Math.PI * 2); ctx.fill()
  if (hand.pose === 'pour') {
    capsule(-22, 70, -12, 6, 12); capsule(-39, 81, 10, 10, 12)
    for (let finger = 0; finger < 3; finger++) capsule(8 + finger * 13, 76, 13 + finger * 9, 32 + finger * 13, 10)
  } else if (hand.pose === 'finger') {
    capsule(-15, 65, 0, 0, 11)
    for (let finger = 0; finger < 3; finger++) capsule(4 + finger * 12, 79, 10 + finger * 9, 41 + finger * 9, 11)
    capsule(-29, 91, -37, 60, 13)
  } else if (hand.pose === 'edge') {
    capsule(-7, 75, 0, 0, 12); capsule(5, 76, 8, 9, 9)
    capsule(15, 82, 18, 21, 8); capsule(-16, 92, -22, 53, 12)
  } else {
    for (let finger = 0; finger < 4; finger++) {
      const px = (finger - 1.5) * 20
      capsule(px, 65, px + (finger - 1.5) * 5, 6 + Math.abs(finger - 1.4) * 8, 11)
    }
    capsule(-31, 87, -57, 56, 13)
  }
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = 'rgba(77,42,24,.35)'; ctx.lineWidth = 1.1
  for (const line of [[-18,84,20,91],[-14,99,16,106],[-8,57,-3,66]]) { ctx.beginPath(); ctx.moveTo(line[0],line[1]); ctx.quadraticCurveTo((line[0]+line[2])/2,line[1]+9,line[2],line[3]); ctx.stroke() }
  if (hand.pose === 'finger') { ctx.fillStyle = '#e4c5a8'; ctx.beginPath(); ctx.ellipse(0, 3, 6, 8, .15, 0, Math.PI * 2); ctx.fill() }
  ctx.restore()
}
