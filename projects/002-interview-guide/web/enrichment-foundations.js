// 基于固定上游快照整理；资源页知识与全部示例为本项目独立补充。
export const foundationDetails = {
  "clean-architecture": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "四类职责怎样协作",
        "paragraphs": [
          "实体维护核心规则，例如订单不能在未付款时发货；用例组织一次操作，例如读取订单、检查付款、执行发货。接口适配器负责把 HTTP、命令行或数据库数据转换为内部模型。框架与驱动属于外圈，处理运行与存储细节。",
          "一次调用可以从控制器进入用例，再访问仓储实现，但源码依赖方向仍应朝向业务。用例描述自己需要的仓储接口，数据库适配器实现它。调用顺序与依赖方向是两件事，不能只看文件被放在哪个目录。"
        ]
      },
      {
        "title": "依赖规则与端口",
        "paragraphs": [
          "如果发货用例直接导入某个数据库客户端、读取请求对象，业务规则就随技术选择一起变化。定义只含 findById 和 save 的端口后，业务通过该契约操作订单，外部装配代码选择实际实现。",
          "端口应表达业务需要，而不是照搬一个数据库的全部 API。输入数据、异常和返回结果都要约定清楚，否则虽然有接口，SQL 字段、框架异常和连接对象仍会穿透边界。"
        ]
      },
      {
        "title": "如何判断分层值得做",
        "paragraphs": [
          "独立业务层的价值是让规则可直接测试，并减少更换技术的影响。例如用内存仓储验证未付款订单会被拒绝，再用集成测试验证数据库适配器确实遵守相同契约。",
          "简单 CRUD 不必为每个字段建立一套实体、映射器和接口。优先隔离变化频繁或难以测试的边界；没有实际收益的层次会增加跳转和维护成本。"
        ]
      }
    ],
    "examples": [
      {
        "title": "通过仓储端口执行用例",
        "language": "javascript",
        "code": "async function publishArticle(articleId, articles) {\n  const article = await articles.findById(articleId);\n  if (!article) throw new Error('文章不存在');\n  if (!article.reviewed) throw new Error('尚未审核');\n  await articles.save({ ...article, published: true });\n}\nconst memory = {\n  async findById(id) { return { id, reviewed: true }; },\n  async save(article) { return article; }\n};\nawait publishArticle('a-1', memory);",
        "explanation": "用例只要求 findById 与 save，不导入 HTTP 或数据库模块。真实仓储和内存仓储都应遵守约定。示例省略并发更新等生产边界。"
      }
    ],
    "pitfalls": [
      "把控制器、服务和仓储分成目录，就认为已经满足依赖规则。",
      "为了形式完整复制多套数据模型，却没有明确转换规则。"
    ],
    "answers": [
      "分层目录描述代码放置位置；依赖规则约束谁可以知道谁。即使用例位于 application 目录，只要直接导入数据库实现，仍违反向内依赖。",
      "用例声明仓储契约并接收其实现；装配层注入数据库仓储。测试时传入内存实现，用例只操作契约，不需要知道连接或 SQL。"
    ],
    "related": [
      "solid",
      "software-architecture",
      "backend-architecture"
    ]
  },
  "clean-code": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "让代码读者看见意图",
        "paragraphs": [
          "一个名字应回答它代表什么业务含义。把 x 改成 payableTotal，比给 x 增加长注释更有效。函数名 calculateTotal 表示计算，saveTotal 表示持久化，不宜在看似查询的名字下隐藏写入。",
          "单一职责不是函数只能有一行，而是行为应围绕一个清楚的目的。一个结账函数可以组织多个步骤；但税额规则、邮件模板和数据库连接各有不同变化原因，应在清楚的边界之外维护。"
        ]
      },
      {
        "title": "错误、边界与重构",
        "paragraphs": [
          "先约定空输入、重复数据和失败时的行为，再写主流程。例如价格计算函数应明确金额单位与是否允许负数，而不是在调用者之间反复猜测。可预期的业务拒绝与基础设施故障也应能被区分。",
          "重构保持外部行为不变，改变内部结构。使用能够表达业务结果的测试保护重构，例如验证折扣后的应付额，而不是只验证私有辅助函数被调用了几次。格式规则保证一致性，不能代替行为正确性。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把行数少等同于可读性好，把复杂表达式挤在一行。",
      "只改命名与格式，却保留隐藏副作用和不明确的错误契约。"
    ],
    "answers": [
      "看它是否因不同业务原因变化、是否混入计算和外部操作、是否需要解释多个独立目的。先划分职责，再决定是否拆函数。",
      "指出具体变化：调用者不再知道内部字段、业务规则只有一个修改位置、错误分支更清楚；并用原有行为测试证明结果保持一致。"
    ],
    "related": [
      "kiss",
      "dry",
      "solid"
    ]
  },
  "dry": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "重复的是知识，不只是字符",
        "paragraphs": [
          "两个地方同时规定会员打九折，就是同一业务知识的重复。以后折扣调整，漏改任何一个位置都会造成结算与报价不一致。把折扣规则集中维护，调用者传入所需数据，可以减少这种同步修改。",
          "两段循环长得相似，却可能处理不同的业务规则。运费与佣金都用乘法，不意味着应该合成一个叫 calculateAnything 的函数。判断标准是它们是否必须一起变化，而不是文本相似度。"
        ]
      },
      {
        "title": "抽象应有清楚的变化边界",
        "paragraphs": [
          "可以先保留少量重复，观察规则是否真的稳定，再建立共享函数或模块。一个好的抽象让调用者表达业务意图，不需要一串布尔参数来切换完全不同的行为。",
          "当共享模块频繁为不同调用者新增特殊分支，说明原来的共同点可能只是偶然。此时拆回两个明确的规则比继续堆选项更合理。DRY 与 KISS、YAGNI 应一起使用。"
        ]
      }
    ],
    "examples": [
      {
        "title": "集中维护同一计价规则",
        "language": "javascript",
        "code": "function lineAmount({ unitPrice, quantity }) {\n  return unitPrice * quantity;\n}\nfunction basketAmount(lines) {\n  return lines.reduce((total, line) => total + lineAmount(line), 0);\n}\nconst quote = lineAmount({ unitPrice: 1200, quantity: 3 });\nconst total = basketAmount([{ unitPrice: 1200, quantity: 3 }]);",
        "explanation": "金额以最小货币单位表示。报价和购物篮复用同一行金额规则；这里没有把税、运费等不同规则硬塞进一个万能函数。"
      }
    ],
    "pitfalls": [
      "看到两段类似代码立即抽象，最后得到很多开关参数。",
      "把常量复制到多个文件，修改规则时依靠人工搜索同步。"
    ],
    "answers": [
      "不一定。先判断两段代码表达的是同一业务知识还是偶然相似；只有需要同步变化的部分才是可靠的抽象候选。",
      "追踪一次业务规则修改会触碰哪些位置。例如折扣、权限或格式规则在多个入口各自实现，就可能存在知识重复。"
    ],
    "related": [
      "kiss",
      "yagni",
      "clean-code"
    ]
  },
  "grasp": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "信息专家、创建者与控制器",
        "paragraphs": [
          "信息专家（Information Expert）把责任交给拥有所需信息的对象：购物篮知道商品和数量，因此可计算总额。创建者（Creator）把对象创建交给包含、记录或聚合它的对象，例如购物篮创建购物行，而不是让所有调用者复制初始化逻辑。",
          "控制器（Controller）由非界面对象协调用例。例如 CheckoutController 接收结账请求，再调用付款和库存职责；它负责组织流程，不应该同时实现折扣规则、数据库操作和页面格式。"
        ]
      },
      {
        "title": "低耦合、高内聚与多态",
        "paragraphs": [
          "低耦合（Low Coupling）减少必须同步变化的依赖，例如业务层依赖仓储契约而非数据库细节。高内聚（High Cohesion）让对象职责彼此相关：收据计算与收据展示可分别演化，不必成为一个巨大对象。",
          "多态（Polymorphism）用共同契约承载不同实现。例如不同配送方式都实现 quote，不必让结账流程不断增加类型判断。只有确实存在变化点时，多态才能减少修改；固定的两个简单分支也可能更容易维护。"
        ]
      },
      {
        "title": "间接层、纯虚构与受保护变化",
        "paragraphs": [
          "间接层（Indirection）在两方之间放置适配器或中介，避免相互了解技术细节。纯虚构（Pure Fabrication）创建没有直接领域实体对应的类，例如专门的审计记录器，以保持领域对象的内聚并降低耦合。",
          "受保护变化（Protected Variations）用稳定边界包住预计会变化的部分，例如支付服务接口隔离供应商 API。九项原则相互约束：引入中介可能降低耦合，也会增加复杂度，应检查它是否保护了实际变化。"
        ]
      }
    ],
    "examples": [
      {
        "title": "让拥有数据的购物篮承担计算",
        "language": "javascript",
        "code": "class Basket {\n  constructor(lines) { this.lines = lines; }\n  subtotal() {\n    return this.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);\n  }\n  qualifiesForFreeShipping() { return this.subtotal() >= 5000; }\n}\nconst basket = new Basket([{ price: 1800, quantity: 3 }]);\nconst eligible = basket.qualifiesForFreeShipping();",
        "explanation": "调用者询问业务结果，无需重复遍历购物行。金额使用最小货币单位；不同职责仍可放在配送或付款对象中。"
      }
    ],
    "pitfalls": [
      "把控制器变成拥有所有业务逻辑的上帝对象。",
      "机械要求每个名词都对应一个类，拒绝为技术职责建立独立对象。"
    ],
    "answers": [
      "如果计算只依赖对象已有数据并属于其业务含义，应优先让信息专家对象承担；跨对象协调放在服务或控制器，避免暴露过多内部字段。",
      "适配器能让双方只认识稳定契约，从而减小技术变化传播；代价是多一层转换、调试和维护，应对应真实依赖边界。"
    ],
    "related": [
      "solid",
      "law-of-demeter",
      "design-patterns"
    ]
  },
  "kiss": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "简单性看理解成本",
        "paragraphs": [
          "简单方案让读者很快找到输入、规则和结果。为三个固定状态选择显示文字，一个小映射通常比插件系统、工厂和注册容器容易读；需求变多时再判断是否需要新的结构。",
          "简单不等于最短。把校验、计算和写入压成一条表达式，会隐藏失败位置与副作用。适当的变量名和明确分支可能增加行数，却让调试和维护更容易。"
        ]
      },
      {
        "title": "真正复杂的需求如何处理",
        "paragraphs": [
          "无法消除的业务复杂性需要通过边界、命名和测试来组织。例如退款规则确实涉及多种付款状态，可以拆成清楚的小规则，而不是假装所有情况都能由一个布尔表达式解决。",
          "每增加一层抽象，都应能说明它保护哪种变化、减少什么重复或隔离什么成本。如果去掉后行为仍清楚且测试更直接，该层可能并未提供足够收益。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把少写几行当作简单，牺牲了错误处理与意图。",
      "为固定小需求引入通用框架，后续读者必须理解大量配置。"
    ],
    "answers": [
      "不一定。短代码可能把多步规则和副作用隐藏在一起；应比较读者理解、测试和修改行为的成本。",
      "检查该层是否保护真实变化、减少知识重复或提供独立测试边界。如果调用者仍需了解内部细节且没有收益，可以考虑合并。"
    ],
    "related": [
      "yagni",
      "dry",
      "clean-code"
    ]
  },
  "law-of-demeter": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "直接协作者与内部结构",
        "paragraphs": [
          "对象可以与自身、参数、自己创建的对象及直接持有的协作者交流。问题在于通过 order.customer.address.city 让订单调用方依赖三层内部结构；地址模型一变，多处代码就需要同步修改。",
          "更好的接口表达调用方真正要完成的事，例如 order.deliveryCity() 或 order.prepareLabel()。由了解地址结构的对象负责读取和转换，调用方只知道业务操作。不要为了少一个点号而无意义地搬运字段。"
        ]
      },
      {
        "title": "封装行为，也保留设计判断",
        "paragraphs": [
          "迪米特法则降低结构耦合，让对象能在不暴露全部内部数据的情况下演化。它经常与信息专家结合：最了解数据的对象也更适合完成依赖这些数据的行为。",
          "链式语法本身并不必然违反法则。构建器连续返回同一个对象、字符串转换链或明确的数据传输结构都有不同语义。要检查是否跨越多个内部对象边界，而不是机械统计点号。"
        ]
      }
    ],
    "examples": [
      {
        "title": "把地址结构藏在直接协作者内",
        "language": "javascript",
        "code": "class Shipment {\n  constructor(destination) { this.destination = destination; }\n  labelText() {\n    const { city, street } = this.destination;\n    return `${city} · ${street}`;\n  }\n}\nconst shipment = new Shipment({ city: '上海', street: '示例路 12 号' });\nconst printable = shipment.labelText();",
        "explanation": "使用方询问 labelText，不需要了解内部地址的字段组合。接口应服务于实际行为，而不是为每个深层字段增加无意义包装。"
      }
    ],
    "pitfalls": [
      "简单把深层字段包装成大量转发 getter，却没有清楚的业务接口。",
      "把所有链式 API 都判为违规，忽略构建器与值转换的语义。"
    ],
    "answers": [
      "调用者依赖 b、c 的存在与内部结构，任何一层变化都可能传播。若链条表达的是跨对象探查，应考虑封装为有业务意义的操作。",
      "让直接协作者提供完成任务的行为，例如收据负责生成寄送信息；调用者提交请求或读取结果，而非自己拆开多层内部数据。"
    ],
    "related": [
      "grasp",
      "clean-code",
      "software-architecture"
    ]
  },
  "solid": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "S 单一职责与 O 开放封闭",
        "paragraphs": [
          "单一职责（SRP）要求模块有清楚的变化原因。发票金额规则、PDF 格式和数据库写入由不同需求推动变化，分开后调整打印样式不必触碰金额计算；它不要求每个类只允许一个方法。",
          "开放封闭（OCP）在稳定边界之外扩展行为。例如运费计算接收一种报价策略，新增同城配送只增加策略实现；如果每加一种配送都修改已有大分支，扩展点可能不合适。没有预期变化时也不必提前制造策略体系。"
        ]
      },
      {
        "title": "L 里氏替换与 I 接口隔离",
        "paragraphs": [
          "里氏替换（LSP）约束子类型遵守原有行为契约。若基类承诺每只鸟都能飞，企鹅通过抛错实现 fly 就破坏调用者预期；应把飞行能力限定到会飞的类型。子类型不应加强前置条件、削弱后置结果或破坏约定不变量。",
          "接口隔离（ISP）使调用者只依赖用得到的能力。只需打印的客户端接收 Printable，而不强迫普通打印机实现扫描和传真并在运行时抛错。可以通过多个小接口组合高级设备，无需把不支持的操作伪装成能力。"
        ]
      },
      {
        "title": "D 依赖反转与应用边界",
        "paragraphs": [
          "依赖反转（DIP）让高层业务和低层实现都面向业务定义的抽象。例如注册流程要求 UserRepository.save，由数据库适配器实现；注册规则不直接创建某个数据库客户端，更换存储时无需修改核心流程。",
          "依赖注入只是一种传递依赖的方式。把具体 SQL 客户端传入构造函数，业务仍可能依赖其全部细节。五原则需要一起判断：抽象应小、符合调用方契约并对应真实职责，不能通过大量空接口满足形式。"
        ]
      }
    ],
    "examples": [
      {
        "title": "分开计算、展示与存储，并注入稳定能力",
        "language": "javascript",
        "code": "class Fare {\n  constructor(rate) { this.rate = rate; }\n  amount(distance) { return this.rate * distance; }\n}\nfunction formatFare(amount) { return `费用：${amount} 分`; }\nasync function recordTrip(distance, fare, tripRepository) {\n  const amount = fare.amount(distance);\n  await tripRepository.save({ distance, amount });\n  return formatFare(amount);\n}\nconst standard = new Fare(200);\nconst memoryTrips = { async save(trip) { return trip; } };\nawait recordTrip(3, standard, memoryTrips);",
        "explanation": "计算、展示和存储分开体现 SRP；替换报价对象可扩展策略体现 OCP；记录流程只要求 save 契约体现 DIP。LSP 和 ISP 的具体反例在正文分别说明，不通过不支持的方法伪造类型能力。"
      }
    ],
    "pitfalls": [
      "认为用了构造函数注入就必然遵守 DIP，实际业务仍调用具体数据库 API。",
      "为满足 OCP 提前给所有简单分支建立类型层次，增加维护成本。"
    ],
    "answers": [
      "不是。注入只改变依赖如何获得；DIP 还要求高层面向所需抽象，低层实现遵守该契约。注入具体引擎对象仍可能耦合到技术细节。",
      "先说出基类对调用者的承诺，再展示子类破坏它的输入或结果。例如承诺正常飞行的类型被企鹅替换后抛错，使原先合法的调用失效。"
    ],
    "related": [
      "grasp",
      "clean-architecture",
      "design-patterns"
    ]
  },
  "yagni": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "区分当前需求与推测需求",
        "paragraphs": [
          "为当前只支持一种支付方式的产品提前实现十种适配器、复杂路由与失败补偿，可能让已经确认的需求更慢落地。未来需求尚不清楚时，推测性代码会产生维护负担，还可能固定错误的边界。",
          "YAGNI 不反对必要的错误处理、测试或清楚的接口。这些支持当前行为的正确性。应推迟的是未经证实的新能力，而不是为了快速交付省掉当前需求必需的质量工作。"
        ]
      },
      {
        "title": "保留可改变的代码，延后昂贵能力",
        "paragraphs": [
          "适度的模块边界、明确的数据契约和自动测试让以后修改更容易；它们不要求现在就实现所有未来分支。比如先把通知调用集中到一个小函数，等第二个真实通道出现再提炼多态接口。",
          "判断扩展点时列出已经发生或明确计划的变化。如果只能用也许有一天来解释复杂配置，可以先删除它；有用户反馈、合同要求或验证过的计划后再投入完整实现。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把 YAGNI 当作不做输入验证和测试的理由。",
      "用假想的未来功能证明一套通用框架现在就必须存在。"
    ],
    "answers": [
      "扩展点应对应已知变化，并保持很低成本；过度设计则为不确定需求实现大量分支和配置。可以用当前收益与真实需求证据判断。",
      "未使用的功能仍要理解、测试和维护，也可能限制未来正确设计；删除后减少了变更面与认知成本。"
    ],
    "related": [
      "kiss",
      "dry",
      "clean-architecture"
    ]
  },
  "design-patterns": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "创建型：对象怎样获得",
        "paragraphs": [
          "上游列出的五种创建型模式是单例（Singleton）、工厂方法（Factory Method）、抽象工厂（Abstract Factory）、建造者（Builder）与原型（Prototype）。它们分别处理实例共享、延迟具体创建、成组产品创建、分步构建与复制现有对象。",
          "当创建逻辑反复变化时，工厂可把具体类型选择藏在边界之外；复杂配置可用建造者逐步组装。单例带来共享状态与测试隔离成本，不应仅为了调用方便就把所有服务变成全局实例。"
        ]
      },
      {
        "title": "结构型：对象如何组合",
        "paragraphs": [
          "七种结构型模式是适配器（Adapter）、桥接（Bridge）、组合（Composite）、装饰器（Decorator）、外观（Facade）、享元（Flyweight）与代理（Proxy）。它们关注接口转换、独立变化维度、树形结构、附加行为、简化入口、共享轻量状态和访问控制。",
          "适配器把第三方接口转换成业务需要的契约；装饰器保持原契约并增加日志等行为；外观为多个复杂组件提供简明入口。模式的目的比它的类图更重要，同样的包装结构可能服务于不同问题。"
        ]
      },
      {
        "title": "行为型：职责怎样协作",
        "paragraphs": [
          "十一种行为型模式是责任链（Chain of Responsibility）、命令（Command）、迭代器（Iterator）、中介者（Mediator）、备忘录（Memento）、观察者（Observer）、状态（State）、策略（Strategy）、模板方法（Template Method）、解释器（Interpreter）与访问者（Visitor）。",
          "策略在稳定调用契约下替换算法，状态根据对象当前阶段改变行为，观察者通知订阅者，命令把操作封装为可排队或撤销的对象。先说明变动点和约束，再选模式；固定小分支无需为了模式名称而额外拆类。"
        ]
      }
    ],
    "examples": [
      {
        "title": "用同一契约选择报价策略",
        "language": "javascript",
        "code": "const standardQuote = weight => 500 + weight * 100;\nconst expressQuote = weight => 900 + weight * 160;\nfunction quoteParcel(weight, strategy) {\n  if (weight < 0) throw new Error('重量不能为负');\n  return strategy(weight);\n}\nconst standard = quoteParcel(2, standardQuote);\nconst express = quoteParcel(2, expressQuote);",
        "explanation": "两个报价函数遵守同一输入输出契约，调用者可以替换策略。示例以分表示金额；只有出现真实变化需求才值得建立更完整的策略体系。"
      }
    ],
    "pitfalls": [
      "背熟23个名称，但无法说出它们各自解决的变化问题。",
      "把策略、状态或适配器混为同一种模式，只依据代码外形判断。"
    ],
    "answers": [
      "行为存在独立扩展需求、调用方希望稳定契约时策略模式有价值；固定、很少变化的小分支通常直接条件判断更清楚。",
      "适配器改变接口以连接不兼容组件；装饰器尽量保留原接口，在原行为周围增加职责，例如日志或缓存。"
    ],
    "related": [
      "solid",
      "grasp",
      "software-architecture"
    ]
  },
  "algorithms": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "搜索、排序与序列题的学习清单",
        "paragraphs": [
          "先练线性查找、二分查找和双指针：线性查找无需排序；二分需要有序数据或单调判定；双指针适合维护一个窗口或逐步缩小候选范围。每种方法都应能说明为什么某些位置可以被安全跳过。",
          "排序至少比较插入、归并、快速、计数与基数排序。插入排序适合小规模或接近有序输入；归并强调稳定合并；快速排序的划分质量影响性能；计数与基数依赖键的表示，不能套用到任意比较对象。"
        ]
      },
      {
        "title": "图、递归与动态规划",
        "paragraphs": [
          "掌握 DFS 与 BFS：DFS 便于追踪路径与递归结构，BFS 按距离层次扩展，可求无权图最少边数。拓扑排序用于依赖顺序；并查集用于连接关系；Dijkstra 的标准形式要求边权非负。",
          "回溯枚举选择并撤销状态；动态规划把有重叠子问题的计算记录下来。定义状态、转移、起始条件与遍历顺序，再写代码。不要把所有递归都称为动态规划，也不要套模板而无法解释状态含义。"
        ]
      },
      {
        "title": "怎样使用上游语言仓库",
        "paragraphs": [
          "上游按 C、C++、Go、Java、JavaScript、PHP、Python 与 TypeScript 给出算法实现仓库。它们是对照实现的阅读入口，本研究项目补充的清单用于组织学习，仓库链接本身不构成统一课程或站内执行环境。",
          "先根据需求写朴素解和测试用例，再独立推导优化；最后对照参考实现检查边界。记录空输入、重复元素、极端规模和不合法输入的契约，并同时报告时间与额外空间成本。"
        ]
      }
    ],
    "examples": [
      {
        "title": "无权图 BFS 的核心流程",
        "language": "text",
        "code": "把起点加入队列，并标记为已访问\nwhile 队列非空:\n    取出队首节点 u\n    for 每个与 u 相邻的节点 v:\n        if v 尚未访问:\n            标记 v，并记录 distance[v] = distance[u] + 1\n            将 v 加入队尾",
        "explanation": "在入队时标记可避免同一节点重复入队。使用邻接表和正常队列时，遍历时间为 O(V+E)，额外空间通常为 O(V)；加权最短路不能直接套用该距离规则。"
      }
    ],
    "pitfalls": [
      "直接背参考代码，没有解释二分区间或图遍历的不变量。",
      "在负权图上不加判断地使用标准 Dijkstra，或把所有图都当无权图。"
    ],
    "answers": [
      "明确循环或递归不变量、初始成立条件、每步如何保持以及结束时怎样推出结果；同时检查输入边界与覆盖全部候选的原因。",
      "暴力解先计数枚举次数，例如两层比较常为 O(n²)；优化解再分析新增排序、哈希或队列成本。空间包括辅助结构和递归栈，不只看代码长度。"
    ],
    "related": [
      "complexity",
      "data-structures",
      "practice"
    ]
  },
  "complexity": {
    "kind": "tutorial",
    "provenance": "依据固定快照中的实际讲解整理为中文；代码示例由本研究项目独立编写。",
    "sections": [
      {
        "title": "增长率与常见算法",
        "paragraphs": [
          "O(1) 表示操作数量不随输入规模增长；O(log n) 常见于每步减半的查找；O(n) 是一次完整遍历；O(n log n) 常见于归并排序；O(n²) 常见于所有元素两两比较；O(2ⁿ) 和 O(n!) 常见于子集或排列枚举。",
          "忽略常数和低阶项是在讨论渐进增长，不表示实际运行时间完全相同。两段 O(n) 代码可能有显著常数差异；数值范围有限的计数排序也可能突破比较排序的一般下界，因为它使用了额外的键值结构。"
        ]
      },
      {
        "title": "正确描述上下界与输入情况",
        "paragraphs": [
          "Big-O 是渐进上界，Big-Ω 是下界，Big-Θ 是紧界；它们本身并不分别等于最坏、最好和平均情况。应先指定研究哪个成本函数，再给出界。上游对这些概念做了简化，本项目在此明确这个数学区别。",
          "线性查找的最好情况是首元素命中，最坏情况是最后命中或不存在；平均成本需要说明输入分布。哈希查找通常讨论期望或平均 O(1)，碰撞严重时可能退化，不能把所有 Map 实现无条件视为最坏 O(1)。"
        ]
      },
      {
        "title": "递归、空间与时间换空间",
        "paragraphs": [
          "递归时间需要把所有调用的工作相加，空间需要看同时存活的栈深度和辅助数据。树遍历访问 n 个节点通常 O(n) 时间，调用栈 O(h)；朴素 Fibonacci 有大量重复调用，但最深栈仍是 O(n)，不是 O(2ⁿ)。",
          "顺序执行的成本相加后保留主项，独立嵌套循环才适合直接相乘。记忆化把 Fibonacci 的重复子问题缓存，可降到 O(n) 时间和 O(n) 空间；迭代只保留前两项还能减少辅助空间。"
        ]
      }
    ],
    "examples": [
      {
        "title": "同一数列的重复计算与迭代计算",
        "language": "javascript",
        "code": "function slowFib(n) {\n  if (n < 2) return n;\n  return slowFib(n - 1) + slowFib(n - 2);\n}\nfunction iterativeFib(n) {\n  let previous = 0, current = 1;\n  for (let i = 0; i < n; i++) {\n    [previous, current] = [current, previous + current];\n  }\n  return previous;\n}",
        "explanation": "假定 n 为非负整数且数值运算按常数成本计。朴素递归为指数级时间上界并占 O(n) 栈；迭代为 O(n) 时间、O(1) 辅助变量。大整数位数增长时需另计算术成本。"
      }
    ],
    "pitfalls": [
      "把 Big-O 与最坏情况、Big-Ω 与最好情况直接画等号。",
      "看到两个循环就断定 O(n²)，或漏算递归调用栈与数组复制。"
    ],
    "answers": [
      "复杂度描述增长率，不给出特定机器上的延迟。常数、缓存、I/O、分配与语言运行时都会影响实际时间，应以真实输入测量。",
      "迭代二分查找时间 O(log n)、额外空间 O(1)，递归版本通常有 O(log n) 栈。访问每个树节点一次为 O(n) 时间，递归额外空间为树高 O(h)。"
    ],
    "related": [
      "algorithms",
      "data-structures",
      "practice"
    ]
  },
  "data-structures": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "数组、链表、栈与队列",
        "paragraphs": [
          "数组适合通过下标访问和连续扫描，随机访问通常 O(1)，中部插入常需移动 O(n) 元素。链表在已经持有位置节点时可以 O(1) 插入或删除，但寻找该位置本身通常 O(n)，额外指针和分散内存也有成本。",
          "栈遵循后进先出，可用于撤销、括号匹配和 DFS；队列遵循先进先出，可用于任务调度和 BFS。实现队列时反复移动数组头部会产生额外代价，可使用头索引或环形缓冲区，并注意释放不再需要的数据。"
        ]
      },
      {
        "title": "哈希、搜索树与堆",
        "paragraphs": [
          "哈希表适合按键查找、计数和去重，平均性能通常良好，但不天然提供按键顺序和范围查询。平衡搜索树维护有序键，查找与更新通常 O(log n)，还能支持前驱、后继和区间访问。",
          "二叉堆维护局部优先级关系，适合反复取最小或最大值；插入和移除堆顶通常 O(log n)，查看堆顶 O(1)。堆不等于整个数组已经排序，也不适合任意按键查询。"
        ]
      },
      {
        "title": "图表示与具体选型",
        "paragraphs": [
          "稀疏图常用邻接表，存储规模约 O(V+E)；邻接矩阵需要 O(V²) 空间，但两点是否相邻的判断很直接。选择表示方式要看节点数量、边密度和查询模式，而不是只套用某种遍历模板。",
          "查询库存用哈希键，按价格范围筛选用有序索引，维护最高优先级任务用堆，按到达顺序处理任务用队列。先列出最频繁的操作、顺序要求、空间限制和并发边界，再比较结构。"
        ]
      }
    ],
    "examples": [
      {
        "title": "用栈检查括号配对",
        "language": "javascript",
        "code": "function balanced(text) {\n  const stack = [];\n  const opening = new Set(['(', '[', '{']);\n  const expected = { ')': '(', ']': '[', '}': '{' };\n  for (const char of text) {\n    if (opening.has(char)) stack.push(char);\n    else if (Object.hasOwn(expected, char) && stack.pop() !== expected[char]) return false;\n  }\n  return stack.length === 0;\n}",
        "explanation": "后遇到的左括号应先被配对，因此栈是自然选择。假定字符串只需检查三类括号并忽略其他字符，时间 O(n)，最坏辅助空间 O(n)。"
      }
    ],
    "pitfalls": [
      "只比较插入操作，却漏掉链表寻找位置的 O(n) 成本。",
      "认为堆提供完整排序，或者认为哈希表自然支持范围查询。"
    ],
    "answers": [
      "当常在已知节点附近插删、不需要随机下标访问时链表可能合适；若还要先线性寻找位置，优势会缩小。数组的局部性和空间成本也要考虑。",
      "不是。平均或期望 O(1) 依赖散列、装载率和实现；碰撞、扩容或恶意输入可能增加成本，应明确平均、摊还或最坏情况。"
    ],
    "related": [
      "complexity",
      "algorithms",
      "databases"
    ]
  },
  "practice": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "从一次练习得到可复用经验",
        "paragraphs": [
          "先复述题意、输入范围和输出契约，再手推正常与边界例子。写出能解释的朴素解后，定位瓶颈，尝试排序、哈希、双指针或动态规划等改进，并说明为何优化保持正确。",
          "答错时分类记录原因：题意误解、遗漏边界、状态定义错误、复杂度过高或实现失误。重做时先不看原解，只有能重新推导才说明建立了可复用理解。"
        ]
      },
      {
        "title": "平台入口与复习节奏",
        "paragraphs": [
          "上游只收录 CodeWars、LeetCode、HackerRank、CoderByte 和 Exercism 五个平台链接。选择时检查它们是否适合目标语言、题型与训练方式；运行、判题和平台课程属于外部服务。",
          "可把复习分为新题、错题和表达练习。完成一道题后再用几句话说明不变量、复杂度和备选方案；定期做限时练习，暴露独立推导与口头表达之间的差距。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把通过判题等同于已经理解，无法解释复杂度或正确性。",
      "只追求刷题数量，反复看答案却没有独立重做。"
    ],
    "answers": [
      "记录题目的核心状态、不变量、有效优化和触发错误的边界；再找相同结构而表述不同的题验证迁移能力。",
      "检查命名、重复逻辑、输入边界与时间空间成本；用极端用例测试，并能解释为何不需要更复杂的结构。"
    ],
    "related": [
      "algorithms",
      "complexity",
      "interview-index"
    ]
  },
  "visualgo": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "快照列出的八种排序",
        "paragraphs": [
          "上游快照列出冒泡、选择、插入、归并、快速、随机快速、计数与基数排序。前六种主要通过比较或划分组织数据；计数与基数利用键值结构，对输入范围和表示有要求。",
          "观察动画时追踪已排序区域、比较对象和交换原因。对于快速排序关注枢轴与分区边界；归并关注两个有序序列如何合并；计数与基数关注额外数组和稳定处理。此清单记录快照中的资源介绍，不承诺外站当前全部功能。"
        ]
      },
      {
        "title": "链表与四种哈希冲突策略",
        "paragraphs": [
          "链表相关清单包括栈、队列、双向链表与双端队列。应观察头尾指针变化以及空结构、单节点删除和两端操作如何维护一致性，而不是仅记住插入动画。",
          "哈希表清单包括线性探测、二次探测、双重哈希和分离链接。前三种在表内寻找其他槽位，分离链接把冲突元素放在独立容器；装载率、删除标记和探测规则会影响正确性与性能。"
        ]
      },
      {
        "title": "堆、搜索树与 AVL",
        "paragraphs": [
          "快照还列出二叉堆、二叉搜索树与 AVL 树。堆维护父子优先级而非全局排序；搜索树维护左右键顺序；AVL 通过旋转控制高度，从而避免普通搜索树在不利输入下退化成长链。",
          "VisuAlgo 是外部可视化网站，本页整理入口和观察方法。对一次插入或删除，先写下必须保持的不变量，再逐步检查每次变化；最后独立编码并用数据规模分析成本。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把外部动画误认为本网页已经实现的交互能力。",
      "观察到一次操作很快，就忽略最坏输入、冲突和树高度。"
    ],
    "answers": [
      "给每一步说明保持什么关系，例如插入排序中前缀已排序，当前元素插入后该前缀长度增加。用不变量联系动画与正确性证明。",
      "统计比较、移动和树路径长度如何随输入增长。平衡树路径通常 O(log n)，普通树最坏可能 O(n)；单次动画不能替代规模分析。"
    ],
    "related": [
      "data-structures",
      "algorithms",
      "complexity"
    ]
  },
  "angular": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "组件、服务与依赖注入",
        "paragraphs": [
          "组件负责展示、输入输出和交互状态；业务流程或跨组件共享逻辑通常放在服务里。依赖注入让组件声明需要的能力，由容器提供实例，不必在每个组件内自行创建对象。",
          "提供者的作用域影响实例共享。某个服务是全应用共享还是组件私有，应对应状态生命周期；把临时页面状态无条件放在全局服务中可能导致页面之间相互影响。"
        ]
      },
      {
        "title": "异步流与变化检测",
        "paragraphs": [
          "Observable 可以表达随时间产生的数据，订阅后才应考虑取消与结束。组件被销毁后仍存活的订阅可能继续接收数据，保留引用或触发不必要工作，因此需要明确生命周期管理。",
          "界面性能取决于组件规模、变化检测与数据更新方式。减少无意义计算、按业务拆分组件并测量实际耗时；单纯改用某个检测策略不能保证所有场景都更快，也不能忽略对象更新方式。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "服务中保存全局可变状态，却没有明确谁能修改和何时释放。",
      "在组件里手动订阅长寿命数据流，离开页面后仍未取消。"
    ],
    "answers": [
      "组件处理展示和直接交互；服务承载可复用业务或数据访问。若逻辑不依赖模板且多个入口需要它，通常值得移入服务。",
      "追踪订阅创建与组件销毁的对应关系，优先采用框架支持的自动清理模式；手动订阅要明确取消，并通过反复进出页面检查回调与内存。"
    ],
    "related": [
      "typescript",
      "frontend-architecture",
      "clean-code"
    ]
  },
  "cpp": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "所有权、RAII 与异常",
        "paragraphs": [
          "C++ 对象的生命周期决定资源何时释放。RAII 把文件、锁和堆资源绑定到对象析构，作用域退出或异常展开时自动清理；标准容器和智能指针让所有权更加明确。",
          "unique_ptr 表达独占所有权，shared_ptr 表达共享生命周期但有计数和循环引用成本，普通指针或引用可以表达不拥有的访问。选择依据是谁负责释放，而不是认为智能指针越多越安全。"
        ]
      },
      {
        "title": "值语义、移动与容器成本",
        "paragraphs": [
          "按值传递建立独立对象，const 引用通常避免复制并禁止经此引用修改，移动允许从即将结束使用的对象转移资源。被移动对象仍须保持可析构等有效状态，不应继续假定其原始内容。",
          "vector 常有良好遍历局部性，扩容可能使引用或迭代器失效；map 与 unordered_map 的顺序和复杂度不同。算法选择应同时考虑容器特征、输入规模与生命周期，避免只看语法便利。"
        ]
      }
    ],
    "examples": [
      {
        "title": "独占所有权交给智能指针",
        "language": "cpp",
        "code": "#include <memory>\nstruct Buffer { int size; };\nint main() {\n    auto buffer = std::make_unique<Buffer>(Buffer{64});\n    int observed = buffer->size;\n    return observed == 64 ? 0 : 1;\n}",
        "explanation": "unique_ptr 在离开作用域时释放对象，不需要手动 delete。它不能被复制；需要把所有权交给其他持有者时应明确移动。"
      }
    ],
    "pitfalls": [
      "返回指向局部对象的引用或指针，作用域结束后继续使用。",
      "保存 vector 元素引用后触发扩容，却仍使用失效引用。"
    ],
    "answers": [
      "资源对象析构与作用域退出绑定；异常展开时已构造对象也会析构，因此不会依赖每条错误分支手写释放。",
      "小且复制便宜的数据可按值；只读且复制昂贵的数据可用 const 引用；明确转移所有权或资源时采用移动语义，并约定移动后的使用限制。"
    ],
    "related": [
      "data-structures",
      "clean-code",
      "complexity"
    ]
  },
  "dart": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "空安全与 API 契约",
        "paragraphs": [
          "String 与 String? 表示不同契约：前者承诺有字符串值，后者允许缺失。调用者应通过判空、默认值或流程收窄处理可空数据，而不是反复使用非空断言把责任推迟到运行时。",
          "Effective Dart 的设计入口强调清楚的命名和接口。一个 getter 应像读取属性，方法应表达操作；返回 null、空集合还是抛出异常会改变调用者处理方式，需要结合业务含义约定。"
        ]
      },
      {
        "title": "Future、Stream 与对象共享",
        "paragraphs": [
          "Future 表示一次异步结果或失败，Stream 表示随时间到来的多个事件。await 等待一次 Future，但不阻止其他事件继续运行；Stream 的订阅则需要考虑取消、结束和异常处理。",
          "final 限制变量重新绑定，不必然使其引用的集合不可变；const 用于编译期常量对象。理解绑定与对象可变性的区别，可以避免多个调用者共享集合时发生意外修改。"
        ]
      }
    ],
    "examples": [
      {
        "title": "显式处理缺失值",
        "language": "dart",
        "code": "String displayName(String? raw) {\n  final normalized = raw?.trim();\n  if (normalized == null || normalized.isEmpty) {\n    return '未填写';\n  }\n  return normalized;\n}",
        "explanation": "判空后 normalized 被收窄为非空值。这里将缺失和空白显示为相同默认文字，这是示例的业务选择，实际项目需自行约定。"
      }
    ],
    "pitfalls": [
      "把非空断言当作输入校验，外部数据缺失时才崩溃。",
      "认为 final List 不可修改，忽略对象内容仍可变化。"
    ],
    "answers": [
      "可空类型让调用方必须表达缺失分支。清楚区分缺失、空字符串和错误，并通过收窄或默认策略返回符合契约的结果。",
      "Future 是一次异步完成，适合一次请求；Stream 是一串事件，适合持续消息或状态变化，需要处理订阅生命周期。"
    ],
    "related": [
      "flutter",
      "typescript",
      "clean-code"
    ]
  },
  "django": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "模型、视图与业务边界",
        "paragraphs": [
          "模型声明字段、关联和数据约束，也可承载与自身状态紧密相关的规则。视图负责请求、权限和响应适配；跨模型的复杂流程可放在应用服务中，避免一个视图承担全部业务。",
          "数据库迁移描述结构演化，数据约束不应只依赖某个表单入口的校验。必须同时考虑后台任务、脚本和并发写入等其他入口，必要时让数据库维护唯一性与关联完整性。"
        ]
      },
      {
        "title": "查询集的求值与 N+1",
        "paragraphs": [
          "QuerySet 通常是延迟执行的查询描述，遍历或其他求值操作才触发数据库访问。在循环里逐项读取关联对象，可能让一条主查询变成大量额外查询，这就是常见 N+1。",
          "select_related 适合通过联接加载某些单值关联，prefetch_related 通过额外查询并在内存组织多值等关联。优化时查看实际 SQL 与查询次数，选择必要字段，避免把全部关系一次加载导致更高内存与延迟。"
        ]
      }
    ],
    "examples": [
      {
        "title": "避免按每本书查询作者",
        "language": "python",
        "code": "# 模型 Book 假定拥有指向 Author 的外键 author\nbooks = Book.objects.select_related('author').filter(is_public=True)\nrows = [(book.title, book.author.name) for book in books]",
        "explanation": "示例依赖已经定义的 Django 模型，不是独立可运行应用。select_related 让单值作者关联随书籍查询加载，避免循环中逐项发起查询。"
      }
    ],
    "pitfalls": [
      "循环逐项读取关联数据而不检查查询次数。",
      "把业务规则只写在视图校验里，其他写入入口绕过规则。"
    ],
    "answers": [
      "先测量查询次数与 SQL，确认循环中的关联访问是否逐项触发查询；再按关系类型选择关联预加载并验证结果与内存。",
      "模型方法适合依赖自身数据和不变量的行为；跨模型用例和外部操作由应用服务协调，视图保持协议适配职责。"
    ],
    "related": [
      "python",
      "orm",
      "python-clean"
    ]
  },
  "flutter": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "Widget 是界面描述",
        "paragraphs": [
          "Widget 描述某个状态下希望得到的界面配置，而不是长期存活的像素对象。通过组合小 Widget 表达布局和交互，Flutter 会据此更新内部元素与渲染结构。build 被再次调用通常是正常机制。",
          "可变状态应有明确所有者。只影响一个控件的状态可留在局部；跨页面共享的业务状态需要稳定的数据流与修改入口。不要把可以从现有状态推导出的值重复保存，避免更新后互相矛盾。"
        ]
      },
      {
        "title": "生命周期、性能与资源",
        "paragraphs": [
          "异步操作完成时，组件可能已经离开界面；状态更新应检查对象是否仍在有效生命周期。控制器、订阅和监听也应在不再使用时释放，避免持续回调与资源泄漏。",
          "性能问题应区分构建、布局、绘制和外部任务。大量同步计算、过大的重建范围或昂贵绘制都可能影响帧时间；应使用测量定位瓶颈，再决定拆组件、缓存或转移计算。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "看到 build 重复调用就认定框架异常，忽略它的声明式更新机制。",
      "异步返回后直接更新已销毁状态，或忘记释放控制器与订阅。"
    ],
    "answers": [
      "只影响局部交互且无需跨组件共享的状态可保留在 Widget 中；跨页面业务状态应集中维护，并明确拥有者、更新入口和生命周期。",
      "不一定。构建是正常过程，是否有问题取决于实际耗时和帧表现。先区分构建、布局与绘制成本，测量后再缩小更新范围。"
    ],
    "related": [
      "dart",
      "frontend-architecture",
      "react"
    ]
  },
  "java": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "相等性与集合契约",
        "paragraphs": [
          "equals 表达对象的逻辑相等，hashCode 为哈希结构定位提供依据。相等对象必须拥有相同哈希码，否则 HashMap 或 HashSet 可能把逻辑相同的对象放在不同位置；不相等对象则允许哈希碰撞。",
          "作为键的字段应保持稳定。如果把可变对象放入哈希表后改变参与 equals 或 hashCode 的字段，再查找时可能走到另一个桶而找不到原条目。不可变值对象往往更适合作为键。"
        ]
      },
      {
        "title": "异常、资源与并发状态",
        "paragraphs": [
          "异常应保留足够上下文并在适合的边界处理；吞掉异常后返回看似成功的结果会破坏调用契约。资源可使用 try-with-resources，确保正常与失败分支都有清理。",
          "不可变对象减少共享修改，但集合、内部引用与外部资源也可能可变。并发访问共享状态需要明确同步方式，不能把对象字段设为 final 就假定全部线程安全。泛型主要在编译期约束类型关系。"
        ]
      }
    ],
    "examples": [
      {
        "title": "不可变记录作为哈希键",
        "language": "java",
        "code": "import java.util.HashMap;\nrecord BookId(String isbn) {}\nclass Demo {\n  public static void main(String[] args) {\n    var stock = new HashMap<BookId, Integer>();\n    stock.put(new BookId(\"978-example\"), 4);\n    System.out.println(stock.get(new BookId(\"978-example\")));\n  }\n}",
        "explanation": "示例使用支持 record 的 Java 版本。记录根据组件提供相等性与哈希；这里 isbn 是不可变字符串，两次构造的逻辑相同键能够对应同一条目。"
      }
    ],
    "pitfalls": [
      "重写 equals 却沿用不匹配的 hashCode。",
      "把可变对象作为哈希键后改变关键字段，或吞掉异常继续返回成功。"
    ],
    "answers": [
      "哈希集合先根据 hashCode 定位候选，再用 equals 判断。相等对象若哈希码不同，集合可能无法正确去重和查找，因此两者契约必须配套。",
      "字段修改使键的哈希或相等性发生变化，条目仍在旧桶但查找使用新值，可能读不到；应使用稳定键或移除后重新放入。"
    ],
    "related": [
      "data-structures",
      "clean-code",
      "java-clean"
    ]
  },
  "javascript": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "词法作用域、闭包与 this",
        "paragraphs": [
          "闭包使函数能够访问定义位置的词法环境，外层调用结束后仍可通过函数使用其中的绑定。闭包可以封装私有状态；如果长期回调捕获大对象，也可能让不再需要的数据继续存活。",
          "普通函数的 this 主要由调用方式决定；箭头函数捕获定义处的 this，不创建自己的绑定。let 和 const 有块级作用域且存在暂时性死区，不能把所有声明提升都理解成提前得到 undefined。"
        ]
      },
      {
        "title": "异步顺序与错误传播",
        "paragraphs": [
          "Promise 回调经任务调度执行，await 暂停当前异步函数而非整个线程；其他可运行任务仍能继续。应区分同步代码、微任务与后续任务，才能解释日志顺序与 UI 更新时间。",
          "异步操作需要清楚的错误传播与清理。如果把 Promise 启动后不返回也不等待，调用者可能无法获知失败；若多个独立任务应并发运行，不必无条件一个接一个 await。"
        ]
      }
    ],
    "examples": [
      {
        "title": "闭包保存独立状态",
        "language": "javascript",
        "code": "function createCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst first = createCounter();\nconst second = createCounter();\nfirst(); // 1\nfirst(); // 2\nsecond(); // 1",
        "explanation": "每次 createCounter 调用创建独立绑定。返回的函数保留自己的 count，不依赖全局变量或动态 this。"
      }
    ],
    "pitfalls": [
      "把箭头函数用于需要动态 this 的对象方法，却期待按接收者绑定。",
      "启动异步任务后没有返回或等待，使错误脱离调用者处理链。"
    ],
    "answers": [
      "闭包保留它仍需要访问的词法绑定；持有闭包的长寿命订阅或缓存也可能保留相关对象。及时清理监听并减少不必要捕获可降低内存滞留。",
      "箭头函数的 this 来自定义位置的外层环境，call 只能改变普通函数调用绑定，无法覆盖箭头函数已经捕获的 this。"
    ],
    "related": [
      "javascript-interview",
      "prototype-chain",
      "call-apply-bind"
    ]
  },
  "php": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "类型声明与输入边界",
        "paragraphs": [
          "类型声明表达函数希望接受和返回的数据类型，清楚的命名与返回契约减少调用方猜测。PHP 的类型转换行为与严格模式需要区分，但即便启用严格模式，网络与表单数据仍需业务校验。",
          "外部输入首先是未经信任的数据。验证它是否满足年龄、金额或长度要求，与防止 SQL 注入和 HTML 注入是不同职责：数据库使用参数绑定，输出到 HTML 则按上下文转义，不能只做一次通用清洗。"
        ]
      },
      {
        "title": "项目结构与依赖管理",
        "paragraphs": [
          "自动加载让类按约定定位，不必在每个文件手动 require；依赖管理负责版本与包来源。遵循统一命名空间、格式和目录约定，有助于团队发现代码及替换实现。",
          "明确区分业务规则与框架、数据库、文件系统等实现。异常需要在能决定处理策略的边界被捕获，失败不能悄悄转换成有效空值；资源和事务也需要清楚的成功与失败路径。"
        ]
      }
    ],
    "examples": [
      {
        "title": "验证整数时保留零值",
        "language": "php",
        "code": "<?php\nfunction parseNonNegativeInt(string $raw): int {\n    $value = filter_var($raw, FILTER_VALIDATE_INT);\n    if ($value === false || $value < 0) {\n        throw new InvalidArgumentException('需要非负整数');\n    }\n    return $value;\n}\n$count = parseNonNegativeInt('0');",
        "explanation": "用严格比较区分验证失败 false 与合法整数 0，再施加非负范围规则。类型与业务约束分别表达。"
      }
    ],
    "pitfalls": [
      "以为类型声明或严格模式已经完成所有外部输入验证。",
      "把 SQL 参数绑定当成 HTML 转义，混淆不同输出上下文。"
    ],
    "answers": [
      "类型声明可发现调用与返回值类型不匹配；无法自动确认业务范围、授权、字符串格式或外部数据真实性，这些仍需显式验证。",
      "参数绑定把值与 SQL 结构分开以防查询注入；HTML 转义让数据不会被当作页面标记执行，两者面向不同上下文。"
    ],
    "related": [
      "clean-code",
      "databases",
      "php-clean"
    ]
  },
  "python": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "绑定、可变对象与默认参数",
        "paragraphs": [
          "赋值通常让名字引用对象，而不是自动复制对象。两个变量指向同一列表时，经其中一个修改内容会被另一个看到；浅复制也只复制外层容器，嵌套对象仍可能共享。",
          "函数默认值在定义时创建。把空列表作为默认参数会让多次调用复用同一列表；常见做法是用 None 表示未提供，再在函数内创建新列表。是否需要深复制则取决于实际数据结构。"
        ]
      },
      {
        "title": "迭代、生成器与资源",
        "paragraphs": [
          "列表推导式立即构建结果，生成器表达式按需产出值，通常避免一次保存全部结果，但生成器可能只被消费一次。输入很大时应检查管道是否在某处又被 list 转回完整集合。",
          "with 语句用上下文管理器统一获取与释放资源。异常应在知道如何恢复或补充上下文的位置处理，避免裸 except 把程序错误也当成正常情况。可读的循环和清楚的命名通常比过度压缩表达式更有价值。"
        ]
      }
    ],
    "examples": [
      {
        "title": "避免跨调用共享默认列表",
        "language": "python",
        "code": "def append_label(label, labels=None):\n    if labels is None:\n        labels = []\n    labels.append(label)\n    return labels\nfirst = append_label('基础')\nsecond = append_label('进阶')\n# first 与 second 是不同列表",
        "explanation": "None 表示未提供列表，每次自行创建新容器。如果调用者显式传入列表，函数仍会修改它，因此副作用也必须在接口说明中明确。"
      }
    ],
    "pitfalls": [
      "使用可变默认参数后惊讶于后续调用保留上次数据。",
      "把生成器当作可无限重读的集合，或认为浅复制复制了全部嵌套对象。"
    ],
    "answers": [
      "默认值只在函数定义时求值一次，因此同一对象被多个调用复用。用 None 作为哨兵并在函数内创建容器可避免意外共享。",
      "列表推导式立即保存全部结果，通常需要 O(n) 额外空间；生成器表达式逐项产出且保存迭代状态，但调用方若收集全部结果仍会消耗 O(n)。"
    ],
    "related": [
      "data-structures",
      "django",
      "python-clean"
    ]
  },
  "react": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "props、state 与派生值",
        "paragraphs": [
          "props 是调用方传入的数据和能力，state 是组件随交互变化的记忆。总价能从商品和数量推导时，通常直接计算；同时保存商品、数量和总价三个状态会增加同步错误。",
          "组件应通过组合而不是巨大配置开关承载职责。state 更新触发新的渲染，当前闭包读取的值仍属于创建它的那次渲染；基于上一次值更新时，可使用函数形式避免依赖过时值。"
        ]
      },
      {
        "title": "副作用、依赖与性能",
        "paragraphs": [
          "Effect 用于与外部系统同步，例如订阅和连接，而非无条件计算派生值。依赖数组应对应 Effect 读取的响应式数据；遗漏依赖会让闭包持续使用旧数据，清理函数负责解除旧订阅或资源。",
          "重新渲染不一定昂贵，缓存也并非免费。应先测量耗时，区分组件计算、DOM 更新与网络操作，再判断 memo、useMemo 或拆分状态是否带来实际收益。"
        ]
      }
    ],
    "examples": [
      {
        "title": "把总价作为派生值",
        "language": "jsx",
        "code": "function CartTotal({ lines }) {\n  const cents = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);\n  return <output>总计 {(cents / 100).toFixed(2)} 元</output>;\n}",
        "explanation": "组件直接从 lines 计算总额，没有维护第二份总价状态。示例使用整数分；真正的复杂货币规则需另外建模。"
      }
    ],
    "pitfalls": [
      "把可由 props 推导的数据再保存进 state，产生不同步的双份来源。",
      "故意省略 Effect 依赖来阻止运行，使回调读取过时数据。"
    ],
    "answers": [
      "需要跨渲染保留、不能由现有输入计算的交互数据适合 state；总价、筛选结果等派生值通常可在渲染时计算，昂贵时再评估缓存。",
      "Effect 会捕获创建时的数据，遗漏依赖可能使订阅或回调永远读取旧值；正确依赖及清理保证与当前外部状态同步。"
    ],
    "related": [
      "javascript",
      "typescript",
      "react-clean"
    ]
  },
  "typescript": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "联合类型让状态更清楚",
        "paragraphs": [
          "辨别联合用一个固定字段区分不同状态，例如 status 为 loading、success 或 error 时允许不同字段。通过判断 status，编译器收窄类型，调用者不会在仍加载时读取并不存在的成功数据。",
          "泛型用于表达类型之间的关系，例如输入数组元素类型与输出元素类型一致；并不是为了把所有函数参数写成 T。过度泛型可能隐藏业务契约，使本来简单的接口更难理解。"
        ]
      },
      {
        "title": "unknown、any 与运行时验证",
        "paragraphs": [
          "unknown 要求调用方在使用前检查或收窄；any 则绕过多数类型约束。处理外部 JSON 时，断言为 User 不会真正检查数据，只会告诉编译器相信你。类型安全的入口仍需要解析与验证。",
          "TypeScript 类型通常在生成 JavaScript 时被擦除，不能约束服务器返回的实际值。编译期类型与运行时验证各自负责不同边界：前者减少内部错误，后者确认现实输入符合契约。"
        ]
      }
    ],
    "examples": [
      {
        "title": "辨别联合约束读取时机",
        "language": "typescript",
        "code": "type LoadState =\n  | { status: 'loading' }\n  | { status: 'success'; value: string }\n  | { status: 'error'; message: string };\nfunction label(state: LoadState): string {\n  switch (state.status) {\n    case 'loading': return '加载中';\n    case 'success': return state.value;\n    case 'error': return state.message;\n  }\n}",
        "explanation": "只有 success 分支能读取 value，只有 error 分支能读取 message。类型表达合法状态，但外部输入仍需先验证。"
      }
    ],
    "pitfalls": [
      "用 as 强制断言网络数据正确，跳过运行时校验。",
      "把 any 作为通用逃生口，错误随着数据流传播到多处。"
    ],
    "answers": [
      "以固定 status 标签把状态拆成互斥类型，每种状态只包含合法字段；switch 或 if 后即可收窄，减少不可能的字段组合。",
      "类型主要在编译期生效，网络响应在运行时到达且可能不符合声明。必须对真实值进行解析、校验和错误处理。"
    ],
    "related": [
      "javascript",
      "react",
      "vue"
    ]
  },
  "vue": {
    "kind": "resource-guide",
    "provenance": "上游本页主要是外部资源索引；以下知识解释、复习答法与代码为本研究项目独立补充，不代表上游已提供完整教程。",
    "sections": [
      {
        "title": "响应式绑定与组件契约",
        "paragraphs": [
          "ref 提供一个可响应式追踪的值容器，reactive 为对象建立代理。处理解构和赋值时应区分值、引用与代理，避免无意脱离响应式来源；是否需要辅助 API 取决于具体操作与版本行为。",
          "组件通过 props 接收输入，通过事件提出变化请求。直接修改调用方传入的共享数据会让状态所有者不清楚；应明确谁负责更新，以及哪些状态只属于当前组件。"
        ]
      },
      {
        "title": "computed、watch 与 composable",
        "paragraphs": [
          "computed 表达可由已有响应式值推导的结果，并围绕依赖进行缓存；watch 用于数据变化后产生必要副作用，例如同步外部存储。把计算结果通过 watch 再保存成另一份状态，常会增加同步负担。",
          "composable 把可复用响应式逻辑组织成函数，但必须说明状态是每次调用独立还是模块级共享，并安排订阅与监听生命周期。业务规则与 UI 反应式机制也可分开，便于独立测试。"
        ]
      }
    ],
    "examples": [
      {
        "title": "用 computed 表达筛选结果",
        "language": "javascript",
        "code": "import { ref, computed } from 'vue';\nconst keyword = ref('');\nconst items = ref(['数组', '链表', '哈希表']);\nconst visible = computed(() => {\n  const query = keyword.value.trim();\n  return items.value.filter(item => item.includes(query));\n});",
        "explanation": "visible 由 keyword 与 items 推导，不需要额外 watch 把结果复制进另一份 ref。示例是组件内的逻辑片段，实际界面由应用提供。"
      }
    ],
    "pitfalls": [
      "用 watch 维护所有派生数据，产生难追踪的循环更新与双份状态。",
      "在模块顶层共享可变状态，却期待每个组件拥有独立实例。"
    ],
    "answers": [
      "computed 负责根据依赖计算结果，通常保持纯计算；watch 在变化时执行外部副作用或流程，不应代替所有派生值计算。",
      "明确状态拥有者，通过 props、事件或集中状态入口更新；避免多个组件互相偷偷改写对象，保持单向契约与清楚生命周期。"
    ],
    "related": [
      "javascript",
      "typescript",
      "vue-clean"
    ]
  }
};
