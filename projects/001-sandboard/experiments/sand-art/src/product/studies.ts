import { bezier, curve, line, p, originalGestureScore, type GestureScore, type GestureTool, type Path, type Stroke, type Value } from './gestures'
import { PRODUCT_HEIGHT, PRODUCT_STEP, PRODUCT_WIDTH } from './planner'

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const at = (value: Value, t: number) => typeof value === 'function' ? value(t) : value
type Options = Partial<Pick<Stroke, 'spread' | 'height' | 'angle' | 'aspect' | 'cluster'>>

/** 原创局部画法编排；数据仅是手的路径与接触参数，没有图片或目标密度。 */
class Study {
  private clock = .9
  private readonly strokes: Stroke[] = []
  private readonly chapters: { tick: number; label: string }[] = []
  private readonly id: string
  private readonly title: string
  private readonly description: string
  private readonly seed: number
  constructor(id: string, title: string, description: string, seed: number) {
    this.id = id; this.title = title; this.description = description; this.seed = seed
  }
  chapter(label: string) { this.chapters.push({ tick: Math.ceil(this.clock / PRODUCT_STEP), label }) }
  stroke(label: string, explanation: string, tool: GestureTool, path: Path, duration: number, radius: Value, amount: Value, options: Options = {}) {
    const spread = options.spread ?? .7
    let budget = 180, previous = path(0)
    if (tool === 'pour') for (let i = 1; i <= 100; i++) {
      const t = i / 100, point = path(t), sigma = at(radius, t) * PRODUCT_WIDTH * (.2 + spread * .55)
      budget += at(amount, t) * Math.sqrt(2 * Math.PI) * sigma * Math.hypot((point.x - previous.x) * PRODUCT_WIDTH, (point.y - previous.y) * PRODUCT_HEIGHT) * 1.3
      previous = point
    }
    this.strokes.push({ start: this.clock, end: this.clock + duration, chapter: this.chapters.length - 1,
      label, explanation, tool, path, radius, amount, spread, height: options.height ?? (spread > .55 ? .22 : .025), budget: Math.ceil(budget), ...options })
    this.clock += duration + (tool === 'pour' ? .4 : .32)
  }
  pour(label: string, explanation: string, path: Path, duration: number, radius: Value, amount: Value, options: Options = {}) {
    this.stroke(label, explanation, 'pour', path, duration, radius, amount, options)
  }
  finish(): GestureScore { return { id: this.id, title: this.title, description: this.description, seed: this.seed,
    strokes: this.strokes, chapters: this.chapters, totalTicks: Math.ceil((this.clock + 1.5) / PRODUCT_STEP) } }
}

const willow = new Study('willow', '苍柳 · 沙块与叶影', '先铺疏密叶影，再连枝、挑树皮光。比较沙块塑形与原版轮廓画法。', 0x713b28)
willow.chapter('铺灰与树根')
willow.pour('放松指缝，先有一带淡灰', '薄灰承接树的暗部，中央和右下保持透光。',
  bezier(p(.13, .42), p(.31, .14), p(.55, .48), p(.87, .33)), 3, .14, .13, { cluster: .6, spread: .95 })
willow.pour('一把沙堆出根脚', '根脚是一片不规则的暗沙，边缘由散落形成。',
  curve([p(.11, .93), p(.22, .82), p(.37, .88), p(.46, .96)]), 2.7, t => .074 + .026 * Math.sin(t * 11) ** 2, 1.05, { cluster: .85, spread: .95 })
willow.stroke('掌侧整理根边的亮地', '只推开根脚外侧，保留沙块的自然厚薄。', 'sweep',
  bezier(p(.20, .96), p(.37, .87), p(.49, .84), p(.59, .94)), 2, .042, .013, { angle: -.2, aspect: .5 })

willow.chapter('塑出苍干')
const trunk = curve([p(.29, .89), p(.255, .70), p(.29, .54), p(.318, .39), p(.407, .20), p(.465, .065)])
willow.pour('深沙顺势长成树干', '不是沿轮廓描边：粗厚沙块向上收细，转折处停留。', trunk, 5.2,
  t => mix(.082, .018, t) * (1 + .16 * Math.sin(t * 15)), t => 1.6 + .3 * Math.sin(t * 7), { cluster: .65, spread: .45 })
willow.pour('把背光一侧压深', '已有树干上局部叠沙，形成暗面和节疤。',
  curve([p(.265, .87), p(.233, .70), p(.269, .54), p(.31, .405)]), 2.9, t => mix(.036, .012, t), 1.2, { cluster: .55, spread: .35 })
willow.pour('老枝伸向右上', '粗枝承接主干，向枝端逐渐收细。',
  bezier(p(.29, .52), p(.33, .29), p(.52, .19), p(.87, .13)), 3.2, t => mix(.047, .004, t), 1.5, { spread: .25 })
willow.pour('一条斜枝向画外伸去', '用非对称分枝打破图标式的树形。',
  bezier(p(.285, .53), p(.26, .34), p(.18, .25), p(.08, .24)), 1.5, t => mix(.026, .004, t), 1.3, { spread: .26 })
willow.stroke('掌腹轻揉干上的灰面', '只重新分配已有沙，减轻颗粒突兀，让暗部有体积。', 'rub',
  curve([p(.29, .79), p(.277, .62), p(.31, .45)]), 2.4, .035, 1.8, { aspect: .48, angle: Math.PI / 2 })

willow.chapter('叶影先成面')
const foliage = [[.38, .28, .055, .95], [.48, .225, .073, .8], [.61, .22, .072, .64], [.74, .205, .060, .8], [.84, .19, .041, .60],
  [.37, .48, .052, .75], [.50, .445, .065, .66], [.64, .44, .060, .57], [.765, .40, .052, .62]]
for (const [i, [x, y, radius, density]] of foliage.entries()) {
  willow.pour('散撒一团松疏叶影', '叶影先形成灰面，团与团之间留空；不同位置有不同深浅。',
    bezier(p(x - .043, y - .024), p(x + .01, y + .043), p(x + .06, y - .009), p(x + .021, y + .095)),
    1.0 + i % 3 * .12, t => radius * (.55 + .38 * Math.sin(t * 9) ** 2), t => density * (.5 + .5 * Math.sin(t * 8.7) ** 2),
    { cluster: .95, spread: .94, angle: -.25 + i * .21, aspect: .8 })
}
willow.stroke('用掌腹揉开叶影的灰阶', '把部分沙簇揉成面，仍保留叶影边缘与亮隙。', 'rub',
  bezier(p(.37, .32), p(.49, .26), p(.66, .37), p(.80, .29)), 2.5, .055, 1.3, { aspect: .7, angle: .3 })

willow.chapter('枝叶有疏有密')
const boughs = [[.36, .33, .38, .73], [.43, .25, .48, .67], [.52, .23, .57, .74], [.61, .205, .66, .65], [.715, .175, .75, .70], [.79, .15, .85, .54], [.835, .143, .91, .43]]
for (const [i, [x, y, ex, ey]] of boughs.entries()) {
  const branch = bezier(p(x, y), p(x - .013, y + .12), p(ex + .025, ey - .19), p(ex, ey))
  willow.pour('让细枝穿过已有叶影', '枝把沙团连接起来；这笔从枝头落到枝梢，随后抬手。', branch, 1.4,
    t => .001 + .0027 * Math.sin(Math.PI * t), .88, { spread: .12 })
  const count = [7, 5, 9, 6, 5, 7, 4][i]
  for (let j = 0; j < count; j++) {
    const u = .21 + j * .66 / Math.max(1, count - 1) + .024 * Math.sin(i * 3 + j), q = branch(u)
    const sign = (i + j) % 3 === 0 ? -1 : 1, length = .035 + .024 * Math.sin(i + j * 1.8) ** 2
    willow.pour('一捏一放，叶片收出尖梢', '宽窄随指缝收放变化，叶片不排成等距的两列。',
      bezier(q, p(q.x + sign * .009, q.y + length * .15), p(q.x + sign * .020, q.y + length * .65), p(q.x + sign * .023, q.y + length)),
      .35, t => .0006 + .014 * Math.sin(Math.PI * t) ** 1.4, 1.65, { spread: .17, aspect: .7 })
  }
}
willow.chapter('树皮与留白')
for (let i = 0; i < 3; i++) {
  willow.stroke('指腹挑出一段树皮光', '光是从深沙里移出来的，断续出现，不绕树干勾一整圈。', 'finger',
    bezier(p(.27 + i * .013, .83 - i * .06), p(.245 + i * .018, .70 - i * .045), p(.30 + i * .008, .59 - i * .02), p(.31 + i * .006, .48)),
    1.25, t => .0018 + .0015 * Math.sin(t * 9) ** 2, .037)
}
willow.stroke('轻收叶间的天光', '从灰沙团里整理一条自然亮隙，避免整片叶影一样黑。', 'collect',
  bezier(p(.52, .32), p(.57, .39), p(.68, .36), p(.73, .46)), 1.7, .026, .036)

const bridge = new Study('bridge', '石桥 · 从沙块开洞', '先堆一整块桥身，再推开、收去内部沙量，桥洞从暗部里形成。', 0x394b1f)
bridge.chapter('薄灰与岸块')
bridge.pour('薄撒一带江雾', '浅灰衬出石桥，江面留亮，避免所有地方一样深。',
  bezier(p(.12, .45), p(.35, .10), p(.58, .40), p(.89, .31)), 3.1, .15, .12, { cluster: .7, spread: .95 })
for (const [x, sign] of [[.12, 1], [.89, -1]]) bridge.pour('堆出两侧不齐的岸石', '岸石承接桥脚，边缘由松散沙簇构成。',
  curve([p(x, .72), p(x + sign * .045, .76), p(x - sign * .025, .86), p(x + sign * .095, .88)]), 1.5,
  t => .036 + .035 * Math.sin(t * 10) ** 2, 1.0, { cluster: .9, spread: .88 })

bridge.chapter('堆沙塑桥身')
const arch = bezier(p(.13, .70), p(.31, .085), p(.67, .16), p(.91, .66))
bridge.pour('沿拱势撒下厚沙', '先有粗厚的桥身，桥洞还没有打开。', arch, 4.1,
  t => .055 + .028 * Math.sin(Math.PI * t), 1.75, { cluster: .35, spread: .6 })
bridge.pour('放宽指缝，内部也添成沙块', '这把沙把拱内连成实体，下一步才从里面移出桥洞。',
  t => { const angle = t * Math.PI * 3.5, scale = mix(1, .22, t); return p(.535 + Math.cos(angle) * .23 * scale, .56 + Math.sin(angle) * .112 * scale) },
  3.8, .105, 1.25, { cluster: .55, spread: .85, aspect: .7 })
bridge.pour('桥脚之间补足厚度', '底部相接，形成可被重新塑造的沙块。',
  bezier(p(.22, .665), p(.43, .64), p(.65, .68), p(.82, .653)), 2.3, .060, 1.3, { spread: .75 })
bridge.stroke('掌腹揉匀桥身的暗面', '重新分配颗粒，让桥身灰面连续，沙量没有凭空增加。', 'rub',
  bezier(p(.23, .53), p(.42, .35), p(.61, .39), p(.81, .54)), 2, .065, 1.9, { aspect: .7 })

bridge.chapter('从暗部打开桥洞')
const opening = bezier(p(.24, .68), p(.39, .36), p(.65, .39), p(.815, .67))
bridge.stroke('掌侧沿弧线移开拱内沙量', '亮底开始透出；被推开的沙仍堆在边缘。', 'sweep', opening, 3.5,
  t => .045 + .025 * Math.sin(Math.PI * t), .035, { aspect: .66, angle: 0 })
bridge.stroke('掌面把洞口接向江面', '打开的弧形与江面连通，桥身保留在上方。', 'sweep',
  bezier(p(.50, .54), p(.53, .60), p(.57, .67), p(.60, .76)), 2.6, .105, .020, { aspect: .68, angle: 0 })
bridge.stroke('掌心收走洞内余沙', '整理桥洞中的堆沙，使它成为负形；收走的沙计入材料账。', 'collect',
  bezier(p(.27, .713), p(.42, .44), p(.66, .475), p(.78, .705)), 3.2, .065, .22)
bridge.stroke('用掌心再整理洞口底部', '底部明亮，但桥脚和拱顶仍保留厚沙。', 'collect',
  bezier(p(.285, .72), p(.46, .64), p(.66, .67), p(.77, .72)), 2.3, .048, .16)
bridge.stroke('收去被掌推到江面的沙堆', '推沙形成的余沙被逐步收走，江面重新留亮。', 'collect',
  bezier(p(.37, .79), p(.55, .895), p(.69, .865), p(.75, .81)), 3.0, .085, .16)

bridge.chapter('石纹与栏影')
for (const [i, t] of [.1, .24, .39, .55, .7, .84].entries()) {
  const q = arch(t), length = .040 + .012 * Math.sin(i * 2.4) ** 2
  bridge.pour('捏撒一根有粗细的桥栏', '栏杆落在厚沙桥身上，远近和高度略有变化。',
    line(p(q.x, q.y - length), p(q.x + .002, q.y + .009)), .55, u => .0022 + .0016 * Math.sin(Math.PI * u), .9, { spread: .14 })
}
bridge.pour('牵出栏上的细沙带', '沙流随桥拱弯曲，两端自然收住。',
  t => { const q = arch(mix(.075, .88, t)); return p(q.x, q.y - .041) }, 2.2, .0028, .8, { spread: .16 })
for (const [i, t] of [.19, .36, .59, .78].entries()) {
  const q = arch(t)
  bridge.stroke('指尖留一段断续石光', '从深沙中移出短光，避免把整个桥描成整齐边框。', 'finger',
    bezier(p(q.x - .011, q.y + .011), p(q.x + .004, q.y + .025), p(q.x + .015, q.y + .032), p(q.x + .029, q.y + .057)),
    .9, .0028, .046 + i * .003)
}
bridge.stroke('掌腹轻揉拱顶灰面', '保留桥洞边界，减轻局部颗粒的尖锐对比。', 'rub',
  t => { const q = arch(mix(.18, .77, t)); return p(q.x, q.y + .005) }, 2.5, .027, 1.4)

bridge.chapter('水光与留画')
for (let i = 0; i < 5; i++) {
  const y = .78 + i * .032, x = .26 + .034 * Math.sin(i * 2.1)
  bridge.pour('轻撒一段断续水影', '水影长短不齐、浅于桥身，不加一整条水平边。',
    bezier(p(x, y), p(x + .15, y - .006), p(x + .28, y + .006), p(x + .38 - i * .035, y)), .8,
    t => .007 + .004 * Math.sin(t * 7) ** 2, .15, { spread: .75, cluster: .6 })
}
bridge.stroke('掌腹揉开水面的灰', '让断续水影退入江面，保留透亮的中央。', 'rub',
  bezier(p(.30, .83), p(.47, .85), p(.64, .84), p(.74, .88)), 2.0, .045, 1.7, { aspect: .6 })

const portrait = new Study('portrait', '垂眸 · 侧脸塑形', '从头发、面部与肩颈沙块中整理侧脸，轻揉灰面，再挑眼、耳与发丝。', 0x63b245)
portrait.chapter('头部与肩颈沙块')
portrait.pour('先薄撒头后的一带灰', '背景只有薄灰，给头部暗沙留出空间。',
  bezier(p(.21, .30), p(.31, .11), p(.49, .31), p(.62, .12)), 2.6, .13, .085, { cluster: .7, spread: .95 })
portrait.pour('一把沙堆出头发的体块', '先有暗块，再找额头、面颊和发际，尚不描五官。',
  curve([p(.48, .17), p(.405, .245), p(.373, .43), p(.415, .58), p(.49, .635)]), 4.6,
  t => .090 + .025 * Math.sin(t * 10) ** 2, 1.75, { cluster: .45, spread: .66 })
portrait.pour('薄一层沙塑出面部', '面部比头发浅；由宽窄和叠沙建立前后体积。',
  curve([p(.553, .22), p(.60, .34), p(.609, .45), p(.601, .55), p(.574, .616)]), 4.0,
  t => .086 + .028 * Math.sin(Math.PI * t), .68, { cluster: .15, spread: .8, aspect: .82 })
portrait.pour('添出前额与鼻唇所在的灰面', '额、鼻、唇先属于同一片沙，不逐个画符号。',
  curve([p(.624, .25), p(.64, .36), p(.658, .436), p(.642, .54), p(.605, .611)]), 2.8,
  t => .024 + .009 * Math.sin(t * 8) ** 2, .72, { spread: .58 })
portrait.pour('颈后的深沙接住头部', '颈后深、颈前浅，人物重心接向肩。',
  bezier(p(.489, .56), p(.48, .66), p(.524, .73), p(.522, .84)), 2.5, .054, 1.25, { spread: .55 })
portrait.pour('肩与衣身成为第二块暗面', '肩线从颈根向两侧展开，以宽沙块承接头部。',
  curve([p(.26, .985), p(.375, .86), p(.493, .808), p(.608, .84), p(.745, .98)]), 3.4,
  t => .055 + .025 * Math.sin(t * 11) ** 2, 1.2, { cluster: .75, spread: .88 })
portrait.stroke('掌腹轻揉额与颊的灰面', '揉沙只分配已有颗粒，面部灰阶逐渐连续。', 'rub',
  curve([p(.573, .26), p(.59, .40), p(.59, .53)]), 3.2, .075, 2.3, { angle: Math.PI / 2, aspect: .67 })

portrait.chapter('整理额鼻唇颏')
const profile = curve([p(.636, .218), p(.658, .29), p(.646, .348), p(.666, .404), p(.700, .438),
  p(.67, .458), p(.668, .493), p(.684, .511), p(.665, .532), p(.677, .548), p(.657, .605), p(.605, .653), p(.590, .741)])
portrait.stroke('掌侧沿额鼻唇颏外侧整理', '不是画一条黑线：从沙块外侧移沙，侧脸的剪影才显出来。', 'sweep',
  t => { const q = profile(t); return p(q.x + .035, q.y) }, 5.2, .028, .022, { aspect: .67, angle: Math.PI / 2 })
portrait.stroke('指腹收掉轮廓外的余沙', '鼻尖与唇边只通过现有沙量的保留和移出形成。', 'collect',
  t => { const q = profile(t); return p(q.x + .036, q.y) }, 5.2, .031, .32)
portrait.stroke('掌心整理脸前的空白', '背景退亮，前额、鼻尖、唇与颏的关系更容易辨认。', 'collect',
  bezier(p(.73, .24), p(.755, .38), p(.75, .59), p(.67, .75)), 3.2, .064, .22)
portrait.stroke('把颈前的空白接向衣领', '头、颈、肩连成一个姿态，留白没有绕人物画一圈。', 'collect',
  bezier(p(.646, .641), p(.645, .72), p(.682, .797), p(.746, .846)), 2.6, .029, .18)

portrait.chapter('揉出半明面')
portrait.stroke('轻收额面的薄沙', '这一遍只降低局部沙厚度，让前额受光，保留半明灰面。', 'collect',
  bezier(p(.597, .238), p(.627, .30), p(.606, .36), p(.62, .404)), 2.4, .027, .010)
portrait.stroke('掌腹轻揉颧骨的灰', '面颊用灰面表现体积，不用圆圈代替脸。', 'rub',
  bezier(p(.60, .385), p(.57, .43), p(.578, .52), p(.617, .564)), 3.0, .057, 2.1, { aspect: .7, angle: 1.2 })
portrait.stroke('从颧面收出一点光', '少量收沙产生受光面，鼻下和颈后仍深。', 'collect',
  bezier(p(.608, .405), p(.63, .456), p(.599, .49), p(.591, .552)), 2.4, .035, .009)
portrait.pour('眼窝下轻添薄灰', '暗部属于脸的体积，细眼线随后才出现。',
  bezier(p(.574, .356), p(.60, .345), p(.633, .376), p(.628, .41)), 1.4, .015, .24, { spread: .75 })
portrait.pour('下颏与颈后补一带柔暗', '明暗转折接住头部，颈前留亮。',
  bezier(p(.554, .596), p(.58, .625), p(.561, .68), p(.559, .713)), 1.5, .023, .35, { spread: .75 })

portrait.chapter('垂眸与耳影')
portrait.pour('指缝轻收，添一段眉影', '眉影只有一小段轻重变化，退入前额灰面。',
  bezier(p(.598, .335), p(.615, .328), p(.633, .336), p(.641, .353)), 1.0,
  t => .001 + .0017 * Math.sin(Math.PI * t), .46, { spread: .18 })
portrait.pour('一丝细沙落出垂眸', '眼线附在已形成的面部上，不把五官画成图标。',
  bezier(p(.614, .373), p(.624, .385), p(.641, .380), p(.649, .373)), 1.2,
  t => .0007 + .0015 * Math.sin(Math.PI * t), .54, { spread: .10 })
portrait.pour('鼻底只留短暗影', '鼻底暗影与已有鼻尖相接，避免整条鼻轮廓描线。',
  bezier(p(.659, .452), p(.665, .457), p(.673, .455), p(.677, .45)), .8, .0013, .40, { spread: .12 })
portrait.pour('唇间添一段细沙', '唇缝短而柔，唇形依靠先前保留下来的轮廓。',
  bezier(p(.643, .517), p(.654, .513), p(.665, .523), p(.676, .523)), .9, t => .0005 + .0011 * Math.sin(Math.PI * t), .42, { spread: .1 })
portrait.stroke('指腹轻挑下唇的光', '从唇下移出少量沙，灰面与亮面形成转折。', 'finger',
  bezier(p(.645, .548), p(.653, .553), p(.662, .551), p(.666, .548)), .9, .0022, .032)
portrait.stroke('指腹揉出耳的半明面', '耳位于头发与面颊之间，灰面比细线更重要。', 'collect',
  bezier(p(.501, .389), p(.474, .405), p(.475, .506), p(.507, .539)), 2.1, .013, .029)
portrait.pour('耳内添一段弯曲暗沙', '耳的内部只用一段柔暗，保留与头部相接的关系。',
  bezier(p(.50, .415), p(.48, .431), p(.512, .454), p(.496, .49)), 1.1, .004, .48, { spread: .24 })

portrait.chapter('发丝与衣领')
portrait.stroke('掌腹先把头发揉成连续暗面', '发丝附在暗面上，头发不由一堆孤立黑点组成。', 'rub',
  curve([p(.475, .235), p(.423, .33), p(.42, .47), p(.463, .563)]), 3.5, .086, 2.5, { aspect: .82 })
for (let i = 0; i < 4; i++) {
  const x = .422 + i * .019, y = .225 - .027 * Math.sin(i), length = [.29, .23, .34, .27][i]
  portrait.stroke('指尖挑一段顺势发光', '细光从暗发块里移出，发丝疏密变化，保留整体暗面。', 'finger',
    bezier(p(x + .045, y), p(x - .034, y + length * .27), p(x - .023, y + length * .7), p(x + .031, y + length)),
    1.4, t => .0012 + .0012 * Math.sin(t * 8) ** 2, .029 + i % 2 * .009)
}
portrait.stroke('掌腹轻揉发际与耳后', '整理灰阶连接，避免发丝变成等距刻线。', 'rub',
  bezier(p(.506, .29), p(.51, .38), p(.516, .50), p(.535, .582)), 2.2, .029, 1.6, { angle: Math.PI / 2, aspect: .65 })
portrait.stroke('掌侧带出一段衣领亮面', '从肩颈暗沙里挑出衣领，最后让画面安静下来。', 'sweep',
  bezier(p(.423, .815), p(.49, .851), p(.57, .867), p(.631, .836)), 2.1, .010, .013, { aspect: .6 })
portrait.stroke('掌腹揉开肩部的柔灰', '肩部边缘保持松散，头部仍是画面重心。', 'rub',
  bezier(p(.36, .88), p(.46, .856), p(.59, .897), p(.68, .95)), 2.2, .060, 1.5, { aspect: .6 })

export const gestureStudies = [willow.finish(), bridge.finish(), portrait.finish()] as const
export const gestureScores: readonly GestureScore[] = [...gestureStudies, originalGestureScore]
