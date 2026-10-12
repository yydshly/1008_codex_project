// 中文详细讲解、示例、误区与参考答法为本项目独立整理。
// kind 依据固定上游 MDX 正文：只有三篇 JavaScript 详细页为 tutorial。
// 其余为 resource-guide；表格按上游固定版本完整提炼，不代表实时排名。
export const practiceDetails = {
  "software-architecture": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "先用变化与约束找出边界",
        "paragraphs": [
          "架构首先回答哪些职责一起变化、哪些职责需要独立变化。以订单系统为例，定价和订单状态属于业务规则，邮件发送、支付平台与数据库连接属于外部能力；把它们混写在同一个服务里，更换支付平台时就容易破坏订单规则。",
          "决策还要写清吞吐、延迟、数据一致性、团队规模与交付周期等约束。用一个模块化单体也能建立清楚的业务边界；当某个模块确实需要独立部署、扩容或由不同团队维护时，再评估拆成服务的收益和网络通信成本。"
        ]
      },
      {
        "title": "分层、六边形与领域建模如何协作",
        "paragraphs": [
          "分层架构区分接口、应用、领域和基础设施职责；六边形架构强调核心定义端口、外部提供适配器；整洁架构要求源码依赖朝向内部业务规则。运行时可以从用例调用数据库，但核心代码依赖的是自己定义的仓储接口，而不是数据库驱动。",
          "DDD 用业务语言划分限界上下文，例如销售中的客户与客服中的客户可以拥有不同模型。判断边界是否有效，可尝试替换一个适配器或修改一条业务规则：变化应主要落在负责该职责的模块，同时用契约测试检查边界数据。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把目录分成四层就认为依赖自然正确，实际仍让领域代码导入 HTTP 或 ORM 类型。",
      "业务规模尚小就拆大量微服务，增加网络故障、事务协调和部署维护成本。"
    ],
    "answers": [
      "先列业务变化场景与技术约束，再比较候选设计的变化成本。例如支付平台可能替换，订单价格规则也会调整，因此把支付做成端口、定价放入领域；同时评估响应延迟、事务和团队维护能力，并记录选择理由。",
      "支付、存储、通知等易替换设施，以及拥有独立业务语言和规则的模块最值得明确边界。层数本身不减少耦合；边界应通过输入输出契约、依赖方向和测试落实。"
    ],
    "related": [
      "clean-architecture",
      "backend-architecture",
      "frontend-architecture"
    ]
  },
  "backend-architecture": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "从一个请求拆出职责",
        "paragraphs": [
          "以创建订单为例，控制器解析 JSON、识别调用者、验证协议格式；应用用例加载商品、调用定价规则、保存订单并组织结果；领域对象维护不可为空、不可重复付款等业务约束。控制器返回状态码，领域返回业务结果，两者不共享 HTTP 请求对象。",
          "基础设施实现仓储、消息队列和支付接口，组合入口把实现注入用例。核心接口应使用订单 ID、金额、业务错误等自己的类型；数据库行、驱动异常或第三方支付响应由适配器转换，避免技术细节穿过边界。"
        ]
      },
      {
        "title": "事务与跨系统一致性",
        "paragraphs": [
          "同一数据库内需要原子完成的操作可放在一个用例事务里，例如保存订单与扣减库存。事务应短而明确，避免在持锁期间等待慢速外部请求；并发下仍需要约束、锁或乐观版本检查，而非只靠先读取再判断。",
          "数据库提交与发送消息无法通常地共用本地事务时，可把待发送事件与订单一起写入 outbox，再由后台投递。消费者按事件 ID 去重，监测重试和积压；这比假定两次写入必定同时成功更能解释真实故障。"
        ]
      }
    ],
    "examples": [
      {
        "title": "依赖端口的创建订单用例",
        "language": "javascript",
        "code": "function makeCreateOrder(orderRepository) {\n  return async ({ customerId, items }) => {\n    if (items.length === 0) throw new Error('订单不能为空');\n    return orderRepository.save({ customerId, items });\n  };\n}\nconst memoryRepository = {\n  async save(order) { return { id: 'order-1', ...order }; }\n};\nconst createOrder = makeCreateOrder(memoryRepository);\nconsole.log(await createOrder({ customerId: 'c-1', items: ['book'] }));",
        "explanation": "独立示例：用例只知道 save 契约，没有 HTTP、SQL 或数据库连接。换成真实仓储后，还需验证事务、唯一约束与并发行为。"
      }
    ],
    "pitfalls": [
      "控制器同时处理定价、SQL、支付和返回格式，导致用例无法被后台任务复用。",
      "把跨服务调用放进数据库事务，就认为远端操作也能随数据库回滚。"
    ],
    "answers": [
      "业务流程应放应用用例，业务不变量放领域对象；控制器负责协议适配。这样 HTTP、CLI 或队列都可复用同一流程，测试也无需启动 Web 服务。",
      "驱动配置、SQL、ORM 映射与仓储适配器应主要受影响。用例依赖稳定契约可保持不变，但新数据库的事务、排序、精度和并发语义仍需集成验证。"
    ],
    "related": [
      "express-clean",
      "orm",
      "system-design"
    ]
  },
  "databases": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "从查询设计表与索引",
        "paragraphs": [
          "关系数据库通过主键、外键、唯一和非空约束表达数据关系。先写出高频查询的过滤条件、排序、连接及返回列，再考虑索引；例如订单按状态筛选、按创建时间取最近 20 条，可评估 (status, created_at) 复合索引。",
          "B-tree 索引维护排序结构，通常帮助等值、范围与排序访问，但每次插入和相关列更新也要维护它。通过 EXPLAIN 与实际耗时、扫描行数判断是否改善；小表、低选择性的条件或对列套函数的写法可能使扫描更划算，不能仅看是否出现索引名。"
        ]
      },
      {
        "title": "事务、隔离与并发异常",
        "paragraphs": [
          "事务把一组操作作为一次提交或回滚，ACID 分别关注原子性、一致性约束、隔离和持久性。转账应把扣款与入账放在同一事务；库存还要用条件更新、约束或锁防止两个请求同时卖出最后一件商品。",
          "隔离讨论脏读、不可重复读、幻读与写偏差等异常。SQL 标准中的隔离级别是概念框架，各数据库的 MVCC、锁和默认级别不同；即使快照保持稳定，也不等于所有跨行约束自动安全。Serializable 可能中止冲突事务，应用必须按数据库要求重试整个事务。"
        ]
      },
      {
        "title": "按数据与访问模式选择模型",
        "paragraphs": [
          "选择 SQL 或 NoSQL，先确定数据关联、唯一约束、事务跨度、读写规模、延迟和运维能力。关系复杂且需要联表与多记录事务时，关系数据库常较直接；文档模型适合按整体聚合读取，键值模型适合按键访问。",
          "NoSQL 是多类数据模型的集合，不代表没有结构或事务。分区键要围绕访问模式设计，热点键、跨分区查询与一致性要求都影响结果。先测代表性数据和负载，再做选型，避免仅以数据量大作为换数据库的理由。"
        ]
      }
    ],
    "examples": [
      {
        "title": "为状态与时间查询评估索引",
        "language": "sql",
        "code": "CREATE INDEX idx_orders_status_time\n  ON orders (status, created_at DESC);\n\nEXPLAIN\nSELECT id, created_at\nFROM orders\nWHERE status = 'paid'\nORDER BY created_at DESC\nLIMIT 20;",
        "explanation": "独立 SQL 示例假设表和列已经存在。比较建索引前后的计划和真实负载；EXPLAIN 输出和实际执行统计用法取决于数据库。"
      }
    ],
    "pitfalls": [
      "为每一列都建索引，忽略写入开销、组合查询和选择性。",
      "认为使用事务就消除了所有并发异常，或把所有数据库的同名隔离级别当作完全相同。"
    ],
    "answers": [
      "从高频查询的 WHERE、JOIN 和 ORDER BY 出发选择列顺序，在代表性数据下比较执行计划、实际耗时和扫描量；同时测试写入成本。索引存在却未被选择并不必然是错误，需要看优化器估算和负载。",
      "先问关系与查询形态、事务和一致性需求、读写分布、分区与扩展方式、延迟目标以及团队维护能力。SQL/NoSQL 不是单纯规模比较，应选择能可靠支持访问模式与约束的模型。"
    ],
    "related": [
      "orm",
      "backend-interview",
      "system-design"
    ]
  },
  "cicd": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "一次提交怎样变成可发布产物",
        "paragraphs": [
          "持续集成让小批代码频繁合并，并自动运行格式/静态检查、单元与必要的集成测试、生产构建。检查目标是发现接口不兼容、行为回归和配置错误；依赖锁文件、固定工具版本与缓存键帮助复现，缓存命中本身不能替代检查。",
          "流水线生成带提交标识的产物，然后让同一个产物进入测试与生产环境。环境配置在运行或部署时注入，凭据由受控环境管理；避免每个环境重建一份代码，因为不同构建会让测试过的版本与最终发布版本产生差异。"
        ]
      },
      {
        "title": "交付、部署与发布恢复",
        "paragraphs": [
          "持续交付要求通过检查的版本随时可发布，生产上线可以保留人工批准；持续部署进一步把通过既定门槛的变更自动上线。两者都依赖可追踪的产物、环境验证和反馈，而不是只写一个上传脚本。",
          "发布应考虑数据库迁移、向后兼容、灰度或滚动过程、健康检查和告警。回滚代码不保证能撤销不可逆的数据变更；采用先兼容新旧版本的扩展迁移，再逐步移除旧字段，并观察错误率、延迟与业务指标后继续放量。"
        ]
      }
    ],
    "examples": [
      {
        "title": "可复现发布链路",
        "language": "text",
        "code": "提交 SHA\n  → 使用锁文件准备依赖\n  → 静态检查 / 单元与集成测试\n  → 构建一次并标记产物\n  → 测试环境验证\n  → 发布门槛\n  → 逐步部署同一产物\n  → 观察错误率和延迟，异常时停止放量",
        "explanation": "独立流程示例。发布门槛可以包含人工批准或自动指标检查；其设置决定持续交付与持续部署的自动化程度。"
      }
    ],
    "pitfalls": [
      "只在开发模式测试，未验证实际生产构建和运行配置。",
      "认为流水线绿灯代表数据库迁移、外部依赖与发布时序都不会出问题。"
    ],
    "answers": [
      "持续交付让每个合格版本具备可发布条件，生产发布可由人决定；持续部署则按既定检查门槛自动发布到生产。关键区别是上线决策是否自动，并非是否有自动构建。",
      "仍需关注环境差异、数据库迁移兼容性、负载增长、第三方服务、分批发布期间的新旧版本协作及回滚能力。用健康检查、灰度与监控缩小影响范围。"
    ],
    "related": [
      "git-workflows",
      "containers",
      "backend-architecture"
    ]
  },
  "express-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "让 HTTP 适配器保持薄",
        "paragraphs": [
          "Express 路由接收 req，把参数、调用者身份和请求体转换成明确的用例输入。创建订单用例接收普通数据并返回订单结果；控制器再映射状态码与响应 JSON，异常交给统一错误处理。核心业务无需知道 req、res 或中间件顺序。",
          "数据库适配器实现用例需要的仓储方法，启动入口负责装配并注入。输入的格式验证属于入口，库存不足和订单状态不可逆等业务约束仍由用例或领域维护，因为同一规则也要适用于队列、定时任务和其他入口。"
        ]
      },
      {
        "title": "异步流程与可替换测试",
        "paragraphs": [
          "异步数据库或外部调用应明确返回 Promise 并等待结果，避免响应已发送而工作仍未完成。将可预期的业务失败与未知基础设施错误区分，输出稳定的错误契约；日志保留请求标识，勿直接把驱动错误或内部堆栈作为用户消息。",
          "用内存仓储测试正常与失败路径，证明业务用例脱离 Express 也能执行；再补真实适配器集成测试，验证 SQL、事务、错误映射与并发。内存实现可快速检查规则，但不能模拟全部数据库语义。"
        ]
      }
    ],
    "examples": [
      {
        "title": "HTTP 边界之外的用例",
        "language": "javascript",
        "code": "const makeFindOrder = (repository) => async (id) => {\n  const order = await repository.findById(id);\n  if (!order) return { ok: false, reason: 'not-found' };\n  return { ok: true, order };\n};\nconst fakeRepository = {\n  async findById(id) { return id === '1' ? { id: '1' } : null; }\n};\nconsole.log(await makeFindOrder(fakeRepository)('1'));",
        "explanation": "独立示例不启动 Express；HTTP 适配器可以把 not-found 映射为 404，成功结果映射为 JSON。仓储契约与业务结果无需依赖请求对象。"
      }
    ],
    "pitfalls": [
      "把 req 传进所有服务，使业务测试和后台复用都依赖 Web 环境。",
      "只测试内存仓储，就认为真实数据库的事务和错误行为也完全相同。"
    ],
    "answers": [
      "req 包含协议、认证中间件和传输细节，进入核心后会绑定 Express 生命周期并扩大依赖。应在控制器提取普通输入；必要的身份与权限以业务上下文传入。",
      "让用例接收仓储依赖，测试注入实现相同方法的内存或受控假实现，分别返回成功、缺失和失败结果；真实适配器另做集成与并发验证。"
    ],
    "related": [
      "backend-architecture",
      "javascript",
      "orm"
    ]
  },
  "java-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "通过接口保持源码依赖向内",
        "paragraphs": [
          "以 Java 订单服务为例，领域定义 Order 和金额规则，应用层定义 PlaceOrder 用例与 OrderRepository 接口；外层用 Spring Controller 适配 HTTP，用 JDBC/JPA 仓储实现接口，配置类完成装配。核心无需反向导入 Controller 或数据库实现。",
          "Spring 注解提供便利，但它们也是框架依赖。若目标是可独立运行的领域模块，可用普通 Java 类和构造函数依赖；若团队选择把部分注解留在应用层，应明确这种耦合的范围，不必为了目录形式把每个对象重复映射。"
        ]
      },
      {
        "title": "把事务放在完整业务操作周围",
        "paragraphs": [
          "创建订单与扣减库存若必须原子完成，应围绕该应用用例建立事务边界，领域对象仍只表达规则。事务执行方式由外层实现；还需要检查代理调用边界、异常回滚规则和并发控制，而不是只看到注解就认定所有调用都受事务保护。",
          "外部支付和邮件不宜让数据库事务长期持锁等待。可以先保存待处理订单与 outbox 事件，再异步推进状态；为重试设计幂等键，并说明失败补偿与最终一致性。用真实数据库集成测试确认版本冲突和约束行为。"
        ]
      }
    ],
    "examples": [
      {
        "title": "领域端口与应用用例",
        "language": "java",
        "code": "interface OrderRepository {\n    void save(Order order);\n}\nfinal class PlaceOrder {\n    private final OrderRepository orders;\n    PlaceOrder(OrderRepository orders) { this.orders = orders; }\n    void execute(Order order) {\n        order.validate();\n        orders.save(order);\n    }\n}\n// Order 与仓储实现另行定义；装配、事务在外层。",
        "explanation": "独立 Java 结构片段，展示应用代码依赖接口。片段不是完整可运行程序；Order 的业务规则和基础设施实现需由具体项目提供。"
      }
    ],
    "pitfalls": [
      "领域直接操作 JPA 会话或 Spring 容器，把持久化与装配生命周期混入业务规则。",
      "把事务粒度切成每个仓储方法，导致一个需要原子的用例被拆成多次提交。"
    ],
    "answers": [
      "注解能减少配置和样板代码，但会把领域与框架编译依赖、代理或生命周期规则联系起来。可把注解放外层；若接受耦合，则限制范围并确认领域测试仍能独立运行。",
      "以需要共同成功或失败的业务操作为边界，将相关数据库写入放入同一事务。控制事务时长并验证并发行为；跨外部服务要另设计消息、幂等和补偿，不能依赖本地回滚。"
    ],
    "related": [
      "backend-architecture",
      "java",
      "databases"
    ]
  },
  "php-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "区分 Laravel 便利性与核心契约",
        "paragraphs": [
          "控制器将表单或 JSON 转成用例输入，应用服务安排订单流程，领域对象维护定价与状态约束，Eloquent 等适配器负责持久化。依赖方向是框架代码使用应用与领域；用例通过自己定义的仓储接口请求存取。",
          "把框架模型直接用作领域对象可减少转换，适合简单 CRUD；复杂业务则容易依赖懒加载、活动记录生命周期与数据库会话。是否分离应看规则复杂度、测试和替换需求，明确哪些对象能跨边界，避免同时泄露 ORM 关系和 HTTP 响应结构。"
        ]
      },
      {
        "title": "让命令行与队列复用同一用例",
        "paragraphs": [
          "用例接收普通值对象或 DTO，返回明确结果，避免内部读取全局 request、session 或认证门面。HTTP、命令行和队列入口分别解析自己的输入后调用同一个应用服务，权限和业务规则通过显式上下文表达。",
          "交易型操作在完整用例周围使用事务；消息发送和第三方调用采用幂等与重试契约。用假仓储测试规则后，再检查真实适配器中的 SQL、事务回滚与字段映射；序列化结果时明确金额、时间和可公开字段。"
        ]
      }
    ],
    "examples": [
      {
        "title": "普通 PHP 用例接收端口",
        "language": "php",
        "code": "interface OrderStore {\n    public function save(array $order): string;\n}\nfinal class CreateOrder {\n    public function __construct(private OrderStore $orders) {}\n    public function execute(array $items): string {\n        if ($items === []) {\n            throw new InvalidArgumentException('订单不能为空');\n        }\n        return $this->orders->save(['items' => $items]);\n    }\n}",
        "explanation": "独立 PHP 结构片段：核心不读取 HTTP 全局状态。这里用数组压缩示例；实际复杂业务可用明确的值对象，并由外层提供 OrderStore 实现。"
      }
    ],
    "pitfalls": [
      "用例随处调用全局请求或框架门面，表面分层却仍无法脱离框架。",
      "把 ORM 模型的全部字段直接序列化给客户端，混淆存储结构与公开契约。"
    ],
    "answers": [
      "框架模型能减少映射与样板代码，但也绑定持久化、懒加载和生命周期。简单 CRUD 可接受；复杂业务可分离领域模型，通过仓储适配，并为成本与收益划清范围。",
      "让用例接收显式参数和依赖，返回普通结果，避免读取 request/session。HTTP、CLI 和队列分别在入口完成转换与上下文构造，调用同一业务流程。"
    ],
    "related": [
      "backend-architecture",
      "php",
      "orm"
    ]
  },
  "python-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "用协议表达用例需要的外部能力",
        "paragraphs": [
          "Python 用例可以接收实现 save/find 方法的对象，或用 typing.Protocol 描述契约；它不需要导入 Django ORM 或 Web 请求类型。领域使用普通类或 dataclass 表达规则，适配器把 ORM 行转换为领域需要的数据，组合入口注入实现。",
          "Django 的 Model 不必与领域对象一一对应：一张持久化表可能只是领域聚合的一部分，一个用例结果也可能来自多张表。只在实际需要隔离规则和框架时引入映射，明确 ID、日期、Decimal 金额及缺失值如何转换。"
        ]
      },
      {
        "title": "测试替身证明什么、遗漏什么",
        "paragraphs": [
          "内存仓储可以快速验证库存不足、重复提交与状态转换等规则，并让失败条件可控。与它不同，真实数据库会施加唯一约束、事务隔离、排序和类型精度；因此替身不能证明 ORM 查询、并发冲突和迁移都正确。",
          "将同一仓储契约用于适配器测试，并用真实测试数据库验证事务回滚、关联读取和并发。处理后台消息还要检查重复消费与重试；不要在长事务中等待外部网络请求，以免锁等待拖慢整个系统。"
        ]
      }
    ],
    "examples": [
      {
        "title": "不依赖 Django 的规则测试输入",
        "language": "python",
        "code": "def reserve_stock(stock, amount):\n    if amount <= 0:\n        raise ValueError('数量必须为正')\n    if stock < amount:\n        raise ValueError('库存不足')\n    return stock - amount\n\nassert reserve_stock(5, 2) == 3\n# 实际并发库存扣减仍需数据库条件更新或锁。",
        "explanation": "独立 Python 示例只验证库存规则。适配器必须保证读取与写入的并发语义，不能仅把函数正确等同于系统不会超卖。"
      }
    ],
    "pitfalls": [
      "把 ORM 行对象直接当作所有业务模型，让领域隐式触发关联查询。",
      "内存仓储测试全部通过后，遗漏数据库约束、事务和并发测试。"
    ],
    "answers": [
      "不必须。ORM 模型描述持久化结构，领域模型描述业务规则与聚合边界，两者可能是多对一或按用例映射；简单系统也可以复用，但应清楚接受的框架耦合。",
      "还需要真实数据库上的字段映射、唯一约束、事务回滚、关联查询数量与并发测试，以及必要的迁移验证。内存实现主要证明业务规则和契约调用。"
    ],
    "related": [
      "backend-architecture",
      "python",
      "orm"
    ]
  },
  "containers": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "镜像是模板，容器是运行实例",
        "paragraphs": [
          "镜像包含应用与所需用户态依赖，容器是镜像启动后的进程和隔离环境。容器通常共享宿主内核，通过命名空间、控制组等提供隔离与资源约束；虚拟机通常运行独立客体内核。容器文件系统的可写层会随实例替换而消失。",
          "构建阶段和运行阶段可拆分，减少运行镜像中的工具和体积。用不可变版本或摘要标识镜像，配置与凭据从外部注入；应用写日志到可收集的位置，并处理退出信号，避免认为本机能启动就说明生产环境可恢复。"
        ]
      },
      {
        "title": "编排处理副本与故障，数据需要额外策略",
        "paragraphs": [
          "编排系统安排实例位置、维持副本、提供服务发现与滚动更新。就绪检查判断实例是否应接流量，存活检查判断是否需要重启；资源请求与限制参与调度和约束。错误的探针或过小的资源限制也会造成重启与容量下降。",
          "无状态服务可通过增加副本扩容，但会话与文件应放合适的外部存储。数据库需要持久卷、备份恢复、主从和一致性策略；持久卷只保留数据，并不自动提供备份或高可用。升级前验证迁移、故障恢复与优雅停止。"
        ]
      }
    ],
    "examples": [
      {
        "title": "滚动更新的检查顺序",
        "language": "text",
        "code": "拉取固定版本镜像\n  → 启动新实例并加载配置\n  → 就绪检查成功后接收流量\n  → 旧实例停止接收新请求\n  → 等待进行中的工作结束\n  → 退出旧实例并观察错误率",
        "explanation": "独立编排流程示例。具体平台的探针、停止时限和滚动策略需要按项目配置；流程不能替代数据库备份与恢复验证。"
      }
    ],
    "pitfalls": [
      "把重要数据只写入容器可写层，实例替换后才发现数据丢失。",
      "把存活探针失败与依赖暂时不可用混为一谈，导致大量实例一起重启。"
    ],
    "answers": [
      "容器通常隔离共享内核上的进程，虚拟机通过虚拟化运行独立客体系统和内核。两者隔离机制、启动开销与系统兼容性不同；容器仍需资源限制和恰当的运行权限。",
      "无状态服务关注副本、流量和优雅停止；数据库还要持久化、备份恢复、复制、迁移和一致性。给数据库挂卷只能解决部分数据保留问题，不能自动得到可靠恢复。"
    ],
    "related": [
      "cicd",
      "system-design",
      "databases"
    ]
  },
  "git": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "工作区、暂存区与提交如何协作",
        "paragraphs": [
          "工作区是正在编辑的文件，暂存区描述下一次提交的内容，提交把快照与父提交一起写入历史。先用 diff 看工作区，再用分块暂存组织一个目的明确的提交，最后检查 staged diff，避免把调试输出或无关变更一起提交。",
          "提交信息应解释变化目的，提交粒度以可理解、可检查为标准，而非机械追求每个文件一次。分支是指向提交的引用；切换或合并前先确认本地修改状态，冲突解决之后检查完整行为，不能只让冲突标记消失。"
        ]
      },
      {
        "title": "merge 保留关系，rebase 重放提交",
        "paragraphs": [
          "merge 将两个历史整合；分支未分叉时可快进，已分叉时通常产生合并提交并保留分支关系。rebase 将一串提交重放到新的基点，通常会生成新的提交 ID，让线性历史更易阅读，但改变了提交身份。",
          "在自己的未共享分支上整理历史通常较方便；对已被他人基于开发的分支重写历史，会要求协作者重新对齐。选择团队统一策略，合并前更新基础分支、解决冲突并重新检查；不要把 rebase 视为无需审阅的清理按钮。"
        ]
      }
    ],
    "examples": [
      {
        "title": "检查并组织提交",
        "language": "shell",
        "code": "git status\ngit diff\ngit add -p\ngit diff --staged\ngit commit -m \"修复订单重复提交处理\"",
        "explanation": "独立 Git 流程示例。add -p 逐块暂存，staged diff 检查下一次提交；命令应在自己的工作分支执行。"
      }
    ],
    "pitfalls": [
      "提交前只看工作区差异，遗漏暂存区里已经加入的其他变更。",
      "未经团队协调就 rebase 已共享分支，使其他人的提交基线失效。"
    ],
    "answers": [
      "暂存区让一次提交只包含同一目的的改动。使用分块暂存后检查 git diff --staged，可从同一工作区中分离修复、重构与文档变化，使审阅和回退更清楚。",
      "merge 保留已有提交和分支关系，可能快进或创建合并提交；rebase 把提交重放到新基点，通常产生新 ID，形成线性历史。共享分支上重写历史需要团队协调。"
    ],
    "related": [
      "git-workflows",
      "cicd",
      "clean-code"
    ]
  },
  "system-design": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "先澄清需求并做数量级估算",
        "paragraphs": [
          "短链接设计先问创建与跳转规模、峰值比例、延迟目标、有效期、自定义别名、修改权限和统计需求。区分必须正确的映射数据与允许延迟的点击统计；这些要求决定是否需要强一致写入，以及哪些工作可异步执行。",
          "用假设估算：每日新增 100 万条、跳转 1 亿次，对应平均约 12 次写入/秒与 1157 次读取/秒；再乘峰值系数并估算单条大小、保留期和副本开销。数字用于说明容量和瓶颈，不把平均值当作峰值或直接当作部署配置。"
        ]
      },
      {
        "title": "按接口、存储、缓存与扩展展开",
        "paragraphs": [
          "定义创建短链和跳转接口、输入校验、身份与幂等语义。存储以短码唯一约束映射长 URL；短码可随机生成并在冲突时重试，或来自 ID 编码，但需解释唯一性、枚举风险与过期规则。跳转使用何种状态码还影响浏览器和中间缓存的行为。",
          "读多写少时可按短码缓存映射，命中直接跳转，未命中读取存储并填充；同时设计 TTL、失效、负缓存和热点键保护。服务副本可横向扩容，存储分区要考虑键分布、热点与迁移，统计事件可进队列与在线跳转解耦。"
        ]
      },
      {
        "title": "最后走一遍故障和可观测性",
        "paragraphs": [
          "缓存不可用时回源流量可能压垮数据库，应限制并发、设置超时并保护热点；队列积压则影响统计时效，监测队列长度、最旧消息年龄与重试。负载测试需要覆盖缓存冷启动、热点倾斜和依赖变慢，不能只测均匀命中场景。",
          "说明降级的用户影响：能否继续跳转、能否暂缓创建、统计可以延迟多久。用请求标识、延迟分位数、错误率、缓存命中和存储延迟定位故障；再给出扩容触发条件、恢复与数据一致性检查，形成完整设计闭环。"
        ]
      }
    ],
    "examples": [
      {
        "title": "短链设计的递进顺序",
        "language": "text",
        "code": "需求：规模 / 峰值 / 延迟 / 有效期 / 统计\n估算：读写QPS / 数据保留量 / 带宽\n接口：创建与跳转 / 错误 / 幂等\n存储：短码唯一约束 / 长URL / 过期时间\n缓存：命中 / 回源 / 失效 / 热点\n扩展：副本 / 分区 / 异步统计\n故障：超时 / 缓存崩溃 / 队列积压 / 恢复",
        "explanation": "独立面试推演模板。每一步都应由前面确认的需求推动，先解释当前简单方案，再说明达到什么规模或瓶颈时升级。"
      }
    ],
    "pitfalls": [
      "不问规模和一致性就画复杂分布式组件图，无法解释每个组件的必要性。",
      "只讨论缓存命中速度，忽略缓存失效后数据库的回源压力和热点问题。"
    ],
    "answers": [
      "先确认创建/跳转量与峰值、延迟目标、有效期、自定义短码、修改与访问权限、统计时效和可用性要求。再用假设做数量级估算，把核心映射与可异步统计区分开。",
      "缓存失效会把读流量推回存储，可能引发超时和级联拥塞；队列积压会延迟下游统计或处理。需限制回源并发、设超时和重试策略，监控积压年龄，并按业务明确降级与恢复。"
    ],
    "related": [
      "databases",
      "containers",
      "backend-interview"
    ]
  },
  "frontend-architecture": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "以业务用例隔开页面与外部数据",
        "paragraphs": [
          "页面组件处理呈现、交互、加载状态和可访问性；购买资格、价格计算或审批状态转换属于可独立复用的业务规则。应用用例通过接口请求数据，HTTP 适配器把接口响应转换为前端模型，组件只接收稳定的结果。",
          "同一规则如果在多个页面、移动界面或测试中重复出现，就值得脱离组件。按业务功能划分模块通常比把所有文件仅按 components/utils/services 集中更容易找到变化范围；跨模块依赖应使用公开接口，避免直接读取彼此内部状态。"
        ]
      },
      {
        "title": "部署边界应由团队和产品需要决定",
        "paragraphs": [
          "微前端可以让不同团队独立构建和发布较独立的业务区域，但也会带来依赖重复、路由协调、共享认证、样式隔离和跨区域通信成本。先确认独立部署是否真的必要，以及整体体验能否保持一致。",
          "如果一个团队共同维护单一发布，模块化应用往往已经足够。无论采用何种结构，都应验证首屏资源、错误恢复、路由直接访问、键盘操作和数据契约；架构图漂亮并不能替代这些用户可见结果。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把所有逻辑抽成 Hook/composable 就认为已经与框架解耦，内部仍依赖全局 UI 状态。",
      "按技术文件类型拆目录，却允许业务模块随意互相读取内部实现。"
    ],
    "answers": [
      "定价、权限资格、状态转换与领域校验等可复用规则应独立于组件。组件仍负责事件、显示、交互状态和可访问性，通过用例接口获取业务结果。",
      "当多个团队需要独立发布、产品区域边界清晰且有维护共享基础设施的能力时可考虑微前端。先比较模块化单体；独立部署收益需覆盖重复依赖、集成和体验一致性成本。"
    ],
    "related": [
      "react-clean",
      "vue-clean",
      "frontend-interview"
    ]
  },
  "developer-ai": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "把模型输出当作待验证的实现候选",
        "paragraphs": [
          "模型可以生成代码、解释文本和提出修改，但生成内容不保证正确，也不自动了解项目的全部约束。先明确输入、预期行为与允许改动范围，再让它产生小而可审阅的变化；以 diff 和实际行为判断，而非依赖语气自信或看起来合理的解释。",
          "验证应覆盖正常、边界、异常和回归场景，并检查依赖是否真实存在、接口版本是否匹配以及构建是否通过。对并发、事务和安全边界的代码，需要与真实环境或契约检查对应；模型自己声称测试成功不能替代可观察的执行结果。"
        ]
      },
      {
        "title": "MCP 提供连接契约，不替模型赋予无限能力",
        "paragraphs": [
          "MCP 通常由宿主应用、客户端与服务器协作，使宿主能发现并调用服务器提供的工具、读取资源或使用提示模板。模型提出调用及参数，宿主负责执行与权限决策，服务器提供实际能力；是否能读取仓库、写数据或访问网络取决于工具实现与授权。",
          "协议连接不等于自动记忆、无限自主执行或保证答案正确。工具返回内容可能来自不可信文件或网页，应该作为资料处理；区分用户指令与资料中的文字，保持来源信息，并只给任务所需的访问范围。"
        ]
      },
      {
        "title": "用可重复案例评估工具流程",
        "paragraphs": [
          "为代码检索、文件读写或数据库查询设计已知输入与期望输出，检查参数格式、越界访问、超时、重复调用和错误响应。工具执行失败时应记录失败状态，不能把模型推测写成实际执行结果；修改操作还应考虑重试是否产生重复副作用。",
          "本页上游以 AI/MCP 外部入口为主；这些连接与评估步骤是本项目的学习补充，本站没有因此获得外部 AI 工具、远程执行或判题能力。先在受控数据和最小权限下验证，再扩大真实任务范围。"
        ]
      }
    ],
    "examples": [
      {
        "title": "工具调用的验证边界",
        "language": "text",
        "code": "用户任务 → 模型提出工具名和参数\n         → 宿主检查参数与授权范围\n         → 工具执行并返回结果/错误\n         → 保留来源和执行状态\n         → 对结果做格式与业务验证\n         → 再决定是否继续下一步",
        "explanation": "独立流程示例：生成一段调用文字不等于工具已执行，工具返回成功也不等于结果满足业务要求。"
      }
    ],
    "pitfalls": [
      "把模型描述的操作结果当作真实执行证据，未查看工具状态、文件变化或测试输出。",
      "把工具输出中的指令当作用户授权，或认为接入 MCP 就具备所有服务的权限。"
    ],
    "answers": [
      "先审阅差异与需求对应关系，再检查依赖、构建和行为；用边界、失败和回归案例验证，并对数据库、并发等真实环境语义补集成检查。保留可复现的测试结果，不能仅靠模型的自我判断。",
      "模型负责生成与推理，工具提供真实的读取、检索、计算或修改能力，宿主决定调用和权限。MCP 是连接这些能力的契约，实际能力由服务器实现与授权决定；执行状态与答案正确性应分开验证。"
    ],
    "related": [
      "cicd",
      "backend-interview",
      "system-design"
    ]
  },
  "orm": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "ORM 映射对象，但查询成本仍由数据库承担",
        "paragraphs": [
          "ORM 把程序对象、关联与数据库记录连接起来，并提供查询构建、持久化和迁移等便利。它生成的 SQL 仍受索引、连接顺序、返回行数和网络往返影响；查看生成查询与执行计划，才能解释接口为何慢。",
          "不要把 ORM 的对象关系当作业务边界。只选择需要的列，限制结果数量，用参数化查询而非拼接输入；事务围绕完整业务操作定义，明确懒加载何时发生，避免序列化一个对象时意外触发大量查询。"
        ]
      },
      {
        "title": "N+1 查询为何出现、怎样修复",
        "paragraphs": [
          "先查询 N 个订单，再遍历读取每个订单的客户，若客户关系是懒加载，就可能发生 1 次订单查询加 N 次客户查询。N 较大时网络往返显著增加，即使每条查询本身都有索引，也会使总体延迟上升。",
          "解决方式包括关联预加载、按客户 ID 批量查询或合适的 JOIN。选择要考虑一对多连接导致的行数膨胀与分页语义；通过请求级查询计数、日志和代表性数据验证，而不是看到一个预加载开关就认为问题消失。"
        ]
      }
    ],
    "examples": [
      {
        "title": "把逐条读取改成批量查询",
        "language": "text",
        "code": "原方案：\n  orders = 查询20个订单\n  对每个order：查询order.customer_id对应客户\n  总计可能21次查询\n\n批量方案：\n  orders = 查询20个订单\n  ids = 去重后的customer_id集合\n  customers = 一次查询WHERE id IN ids\n  在内存按id关联结果",
        "explanation": "独立伪代码展示往返次数差别。具体 ORM 的预加载 API 不同；批量结果仍需处理缺失客户、参数数量与授权过滤。"
      }
    ],
    "pitfalls": [
      "认为 ORM 自动生成的查询必定高效，因此不看 SQL、计划和查询次数。",
      "为消除 N+1 一律联表，忽略一对多结果膨胀、重复行和分页错误。"
    ],
    "answers": [
      "ORM 只是查询表达与映射层，数据库仍执行 SQL。需要阅读生成语句、计划、索引使用、返回行数和每次请求的查询数量，才能确认成本及正确性。",
      "懒加载把每个对象的关联读取延后到访问时；循环访问 N 个对象的关联会产生 1+N 次查询。可预加载、批量读取或合适地 JOIN，并验证分页和查询计数。"
    ],
    "related": [
      "databases",
      "python-clean",
      "backend-interview"
    ]
  },
  "backend-interview": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "先设计重试下的正确性",
        "paragraphs": [
          "网络超时只说明调用方没有及时收到结果，不说明服务端一定未处理。支付或创建订单的请求应带稳定的幂等键；服务端对同一业务范围内的键建立唯一记录，保存状态与结果，重复请求返回已有结果或明确的进行中状态。",
          "并发重试还要求原子地登记和执行业务写入，可借助数据库唯一约束与事务。幂等键需要检查请求内容是否一致、作用范围和保留期；消息消费按事件 ID 去重。只在客户端禁用按钮不能防止超时重试与多设备并发。"
        ]
      },
      {
        "title": "用证据定位延迟与资源瓶颈",
        "paragraphs": [
          "先确认哪个接口、哪些用户或哪段时间变慢，查看延迟分位数、错误率和流量，而不只看平均值。沿请求链检查排队、应用计算、数据库、缓存、外部服务与返回传输，结合追踪标识定位耗时最大的环节。",
          "再检查 CPU、内存、连接池、锁等待、慢查询和重试是否放大负载。优化应有前后对比：例如批量读取消除 N+1、索引减少扫描、超时保护外部调用；不要先加缓存或机器，再尝试解释性能为何变化。"
        ]
      }
    ],
    "examples": [
      {
        "title": "幂等提交的数据库事务思路",
        "language": "text",
        "code": "接收key与请求内容摘要\nBEGIN\n  尝试登记唯一(scope, key)\n  若已存在：校验摘要，返回已有状态/结果\n  若首次登记：执行业务写入，保存结果\nCOMMIT\n返回持久化结果",
        "explanation": "独立伪代码仅描述同库可原子完成的流程。外部支付需要提供方幂等能力与状态核对，不能靠本地事务回滚远端扣款。"
      }
    ],
    "pitfalls": [
      "超时后直接重复执行扣款，未核对原请求是否已经成功。",
      "只看平均响应时间，忽略长尾、连接池等待或重试造成的放大效应。"
    ],
    "answers": [
      "让同一业务操作使用稳定幂等键，在服务端通过唯一约束与事务原子登记并保存结果；重复请求核对内容后返回同一结果。外部支付同时使用提供方幂等机制与对账，处理未知状态。",
      "先确认影响范围与流量，查看延迟分位数和错误率，再沿追踪检查排队、应用、数据库、缓存及外部依赖；结合慢查询、资源和连接池数据提出改动，最后用同类负载验证改善。"
    ],
    "related": [
      "databases",
      "orm",
      "system-design"
    ]
  },
  "interview-index": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "原文总索引包含具体技术对照",
        "paragraphs": [
          "这一页既有面试资源链接，也有语言与框架对照表，列出 13 种语言、8 个前端和 15 个后端框架/技术入口。下方按固定研究提交完整保留名单并作中文归纳；这些列表是上游当时的内容组织，不是当前流行度排名或统一的选型建议。",
          "语言表同时说明创建者、出现年份、范式、用途与相关框架。JavaScript/TypeScript 常连接前后端生态，Python 还涉及数据和 AI，Go/Rust/C++ 常出现在服务或系统方向；C#、Java、PHP、Ruby、Kotlin、Swift 和 SQL 各有不同岗位语境，应按实际职位要求选择复习范围。"
        ]
      },
      {
        "title": "把岗位要求转成可验证的复习任务",
        "paragraphs": [
          "先把招聘要求分成语言机制、框架用法、数据与系统、工程协作、项目经验，再按重要程度与自身短板排序。例如 React 岗位先练 JavaScript、组件状态与浏览器行为，再解释路由、渲染和性能；后端岗位先练接口、查询、事务与异常处理。",
          "每个主题至少完成三个动作：用自己的话解释机制，写一个小例子验证，再用项目场景说明取舍。定期回看错题和无法解释的输出，而非以读过多少链接衡量准备程度；参考答法可帮助组织思路，但不应机械背诵。"
        ]
      }
    ],
    "tables": [
      {
        "title": "原文语言速查（13 种）",
        "columns": [
          "语言",
          "创建者 / 年份",
          "范式",
          "主要用途",
          "原文关联框架 / 技术"
        ],
        "rows": [
          [
            "JavaScript",
            "Brendan Eich / 1995",
            "多范式：函数式、面向对象、命令式",
            "前端、Node.js 后端、移动应用",
            "React、Next.js、Vue、Nuxt、Express、NestJS"
          ],
          [
            "TypeScript",
            "Microsoft / 2012",
            "带类型的 JavaScript 超集，多范式",
            "前端、后端、全栈、库开发",
            "Angular、Next.js、NestJS、tRPC、RxJS"
          ],
          [
            "Python",
            "Guido van Rossum / 1991",
            "面向对象、函数式、命令式",
            "后端、数据科学、AI/ML、脚本与自动化",
            "Django、Flask、FastAPI、Pyramid、Celery"
          ],
          [
            "Java",
            "James Gosling（Sun）/ 1995",
            "面向对象、并发",
            "企业后端、Android、大数据",
            "Spring、Spring Boot、Hibernate、Quarkus、Micronaut"
          ],
          [
            "PHP",
            "Rasmus Lerdorf / 1995",
            "命令式、面向对象、函数式",
            "Web 后端、CMS（WordPress、Drupal、Magento）",
            "Laravel、Symfony、CodeIgniter、CakePHP、Slim"
          ],
          [
            "Go",
            "Google（Griesemer、Pike、Thompson）/ 2009",
            "编译型、并发、命令式",
            "后端、微服务、云、CLI、DevOps",
            "Gin、Echo、Fiber、Beego、gRPC"
          ],
          [
            "C#",
            "Microsoft（Hejlsberg）/ 2000",
            "强类型、面向对象、函数式",
            "后端、桌面、Unity 游戏、云",
            ".NET、ASP.NET Core、Xamarin、Blazor、MAUI"
          ],
          [
            "C++",
            "Bjarne Stroustrup / 1985",
            "面向对象、泛型、命令式",
            "系统、游戏、嵌入式、高性能应用",
            "Qt、Boost、Unreal Engine、STL"
          ],
          [
            "Ruby",
            "Yukihiro Matsumoto / 1995",
            "面向对象、动态、反射",
            "Web 后端、脚本、快速原型",
            "Ruby on Rails、Sinatra、Hanami"
          ],
          [
            "Rust",
            "Graydon Hoare（Mozilla）/ 2010",
            "系统编程、多范式、所有权与借用",
            "系统、WebAssembly、高性能后端",
            "Actix、Rocket、Axum、Tokio"
          ],
          [
            "Kotlin",
            "JetBrains / 2011",
            "面向对象、函数式、多平台",
            "Android、Ktor 后端、多平台应用",
            "Ktor、Spring Boot、Android Jetpack Compose"
          ],
          [
            "Swift",
            "Apple（Lattner）/ 2014",
            "面向对象、函数式、面向协议",
            "iOS/macOS 应用、Vapor 后端",
            "Vapor、Kitura、SwiftUI、Combine"
          ],
          [
            "SQL",
            "Chamberlin 与 Boyce（IBM）/ 1974",
            "声明式",
            "关系数据库查询与管理",
            "PostgreSQL、MySQL、SQL Server、Oracle、SQLite"
          ]
        ]
      },
      {
        "title": "原文前端框架与库速查（8 项）",
        "columns": [
          "名称",
          "语言",
          "类型 / 关键概念",
          "原文主要场景"
        ],
        "rows": [
          [
            "React",
            "JavaScript / TypeScript",
            "UI 库；组件、Virtual DOM、Hooks、JSX",
            "SPA、React Native 移动应用、配合 Next.js 的 SSR"
          ],
          [
            "Next.js",
            "JavaScript / TypeScript",
            "基于 React 的全栈框架；SSR/SSG、App Router、Server Components、API routes、ISR",
            "Web 应用、电商、静态站点、博客"
          ],
          [
            "Vue",
            "JavaScript / TypeScript",
            "渐进式框架；Composition API、响应式、SFC",
            "SPA、原型、逐步接入既有页面"
          ],
          [
            "Nuxt",
            "JavaScript / TypeScript",
            "基于 Vue 的全栈框架；SSR/SSG、模块、自动导入、server routes、Nitro",
            "Web 应用、静态站点、JAMstack"
          ],
          [
            "Angular",
            "TypeScript",
            "前端应用框架；依赖注入、RxJS、CLI（原文亦列 MVC）",
            "企业应用、控制台、复杂 SPA"
          ],
          [
            "Svelte",
            "JavaScript",
            "编译器 / 框架；编译式更新、响应式、较小构建体积",
            "SPA、Web Components、原型"
          ],
          [
            "SvelteKit",
            "JavaScript / TypeScript",
            "基于 Svelte 的应用框架；SSR/SSG、文件路由、endpoints、adapters",
            "Web 应用、静态站点、JAMstack"
          ],
          [
            "Astro",
            "JavaScript / TypeScript",
            "内容框架；岛屿架构、多框架组件",
            "内容站、博客、文档"
          ]
        ]
      },
      {
        "title": "原文后端框架与技术速查（15 项）",
        "columns": [
          "名称",
          "语言",
          "类型 / 关键概念",
          "原文主要场景"
        ],
        "rows": [
          [
            "Node.js + Express",
            "JavaScript",
            "运行时 + Web 框架；事件驱动、非阻塞 I/O、中间件",
            "REST API、微服务、实时应用"
          ],
          [
            "NestJS",
            "TypeScript",
            "应用框架；装饰器、依赖注入、模块化",
            "REST/GraphQL API、微服务"
          ],
          [
            "Django",
            "Python",
            "集成式框架；ORM、admin、MTV、DRF",
            "Web 应用、CMS、控制台、API"
          ],
          [
            "Flask",
            "Python",
            "轻量框架；扩展、Jinja2",
            "中小 API、原型、小型服务"
          ],
          [
            "FastAPI",
            "Python",
            "支持异步的框架；类型、Pydantic、OpenAPI",
            "现代 REST API、异步服务"
          ],
          [
            "Spring / Spring Boot",
            "Java",
            "应用框架；IoC、AOP、丰富生态",
            "企业后端、微服务、金融系统"
          ],
          [
            "Laravel",
            "PHP",
            "MVC 框架；Eloquent、Blade、artisan、queue",
            "Web 应用、SaaS、电商、API"
          ],
          [
            "Symfony",
            "PHP",
            "模块化框架；可复用组件、Twig",
            "企业 Web、API、CMS"
          ],
          [
            "ASP.NET Core / .NET",
            "C#",
            "跨平台应用平台与框架；LINQ、async/await",
            "API、微服务、企业应用"
          ],
          [
            "Gin",
            "Go",
            "轻量 Web 框架；路由、中间件、JSON 验证",
            "REST API、高性能服务"
          ],
          [
            "Echo",
            "Go",
            "轻量 Web 框架；路由、中间件",
            "REST API、高性能服务"
          ],
          [
            "Fiber",
            "Go",
            "Web 框架；类似 Express 的 API、fasthttp",
            "REST API、微服务"
          ],
          [
            "Ruby on Rails",
            "Ruby",
            "MVC 框架；约定优于配置、ActiveRecord、脚手架",
            "Web 应用、SaaS、快速原型"
          ],
          [
            "Ktor",
            "Kotlin",
            "异步框架；DSL、协程、多平台",
            "微服务、API、KMP 相关应用"
          ],
          [
            "Vapor",
            "Swift",
            "异步 Web 框架；DSL、SwiftNIO、async/await、Fluent ORM",
            "Swift 后端 API、微服务"
          ]
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把原文的技术名单当作实时排名或要求自己同时学会所有语言与框架。",
      "只背术语定义，不写例子、不验证输出，也无法说明项目中的选择理由。"
    ],
    "answers": [
      "把岗位要求映射成语言、框架、数据/系统与工程能力，按岗位重要性和自己的薄弱项排序；先补高频基础，再用目标技术栈完成小场景。用可解释例子与项目证据检查进展。",
      "还需要理解机制、复现边界行为并比较替代方案。能说明某个约束下为什么采用该设计，以及带来的成本、验证方式和失败场景，才是解释取舍。"
    ],
    "related": [
      "javascript-interview",
      "frontend-interview",
      "backend-interview"
    ]
  },
  "javascript-interview": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "三个问题连成同一个机制",
        "paragraphs": [
          "对象创建决定对象如何初始化以及内部原型指向谁；原型链决定属性缺失时从哪里继续查找；this 则由普通函数的调用方式决定。它们相互关联，但不是同一机制：继承来的方法用 obj.method() 调用时，this 通常仍是 obj。",
          "上游本页主要导航到对象创建、原型链和 call/apply/bind 三篇详细页。阅读时可先比较实例的自有属性与共享方法，再预测拆出方法单独调用或显式绑定后的结果，避免把方法所在的原型当作固定接收者。"
        ]
      },
      {
        "title": "用可运行小例子组织回答",
        "paragraphs": [
          "实例字段通常写在每个对象自身，类方法通常放在类的 prototype 上让实例共享；工厂函数也能共享外部方法，但若每次创建新闭包则函数身份不同。用 Object.getPrototypeOf 和 Object.hasOwn 检查，而不靠对象打印外观猜测。",
          "普通方法被取出后失去 obj.method() 的调用形式，需要根据场景用 call、bind 或包装函数传入接收者；箭头函数的 this 来自创建时的词法作用域。先说明具体调用表达式，再说明输出，比背诵 this 永远指向某对象更准确。"
        ]
      }
    ],
    "examples": [
      {
        "title": "共享原型方法与不同接收者",
        "language": "javascript",
        "code": "const shared = {\n  describe() { return this.name; }\n};\nconst a = Object.assign(Object.create(shared), { name: '甲' });\nconst b = Object.assign(Object.create(shared), { name: '乙' });\nconsole.log(a.describe === b.describe); // true\nconsole.log(a.describe());              // 甲\nconsole.log(a.describe.call(b));         // 乙",
        "explanation": "独立示例：查找 describe 时沿原型链，调用时 this 由接收者决定。共享函数并不让所有实例共享同一个 name。"
      }
    ],
    "pitfalls": [
      "认为函数定义在哪个对象里，this 就永远指向那个对象。",
      "认为类方法与每次工厂创建的新闭包在函数共享和内存方面完全相同。"
    ],
    "answers": [
      "构造函数或 class 的实例通常通过 prototype 共享方法；工厂返回什么对象由实现决定，若每次创建闭包就会产生不同函数。比较自有属性、内部原型和函数身份才能说明实际差别。",
      "创建两个继承同一普通方法的对象，分别以 a.method() 和 a.method.call(b) 调用。函数通过同一原型找到，但接收者变化使 this 读取不同实例字段，清楚展示查找与调用的区别。"
    ],
    "related": [
      "object-creation",
      "prototype-chain",
      "call-apply-bind"
    ]
  },
  "prototype-chain": {
    "kind": "tutorial",
    "sections": [
      {
        "title": "属性查找沿内部原型逐层继续",
        "paragraphs": [
          "读取 obj.key 时先查找自有属性，没有则沿内部 [[Prototype]] 到原型对象继续，最终到 null。找到同名属性就停止；因此对象自身属性会遮蔽原型上的属性，删除自身属性后可能重新读到继承值。",
          "原型上的普通方法虽然共享，使用实例.method() 调用时的接收者仍是实例。Object.hasOwn 检查自有属性，in 检查包括继承在内的属性是否存在；属性值为 undefined 与属性不存在也不是同一件事。"
        ]
      },
      {
        "title": "构造函数的 prototype 与对象内部原型",
        "paragraphs": [
          "普通可构造函数有 prototype 属性，new F() 创建的实例通常把内部原型设为 F.prototype；Object.getPrototypeOf(instance) 则读取一个具体对象实际的内部原型。两者在这种创建流程中关联，但名称和职责不同，箭头函数等并非都有可用于 new 的 prototype。",
          "普通对象的原型链通常经过 Object.prototype 到 null；Object.create(null) 可直接创建没有原型的对象。不要修改共享内建原型，否则会影响其他对象；也应避免把不可信键随意合并到普通配置对象，以免引入原型污染相关问题。"
        ]
      }
    ],
    "examples": [
      {
        "title": "遮蔽、删除与继承",
        "language": "javascript",
        "code": "const base = { level: 1 };\nconst item = Object.create(base);\nitem.level = 2;\nconsole.log(item.level, Object.hasOwn(item, 'level')); // 2 true\ndelete item.level;\nconsole.log(item.level, Object.hasOwn(item, 'level')); // 1 false\nconsole.log(Object.getPrototypeOf(item) === base);    // true",
        "explanation": "独立示例：delete 删除 item 的自有属性，没有删除 base 的属性，下一次读取会沿原型链命中 base.level。"
      }
    ],
    "pitfalls": [
      "将函数的 prototype 属性与任意对象的内部 [[Prototype]] 当作同一个属性。",
      "用读出的 undefined 判断属性一定不存在，或忽略继承属性与自有属性的区别。"
    ],
    "answers": [
      "F.prototype 是通常由 new F() 用作实例原型的对象属性；Object.getPrototypeOf(obj) 读取 obj 实际的内部原型。普通构造过程下两者常相等，但要区分函数属性与实例内部链接。",
      "删除操作只移除了自身的同名属性。后续读取仍会沿原型链查找，如果原型对象存在该属性，就会得到继承值；可用 Object.hasOwn 验证。"
    ],
    "related": [
      "object-creation",
      "javascript-interview",
      "call-apply-bind"
    ]
  },
  "call-apply-bind": {
    "kind": "tutorial",
    "sections": [
      {
        "title": "执行时机与参数组织是主要差别",
        "paragraphs": [
          "call(thisArg, a, b) 立即调用普通函数，参数逐个传入；apply(thisArg, [a, b]) 也立即调用，使用数组或类数组组织参数。二者返回原函数的执行结果，主要差别是调用方当前持有参数的形式。",
          "bind(thisArg, a) 创建并返回一个新函数，保存接收者并可预置前几个参数，当前不会执行原函数。随后调用返回函数时再传剩余参数；它适合把一个需要固定上下文的操作交给回调系统。"
        ]
      },
      {
        "title": "回调为何容易丢失方法接收者",
        "paragraphs": [
          "将 obj.method 作为值传给定时器或事件系统时，不再使用 obj.method() 形式。接收者由后续调用方式决定，因此常与原对象不同；可以保存一次 bind 结果，或用 () => obj.method() 包装。",
          "每次 bind 都会返回不同函数，注册和移除事件处理器应保存同一个引用。绑定也不是所有函数 this 的通用开关：箭头函数使用词法 this，call/apply/bind 无法改写它的接收者。"
        ]
      },
      {
        "title": "普通绑定的边界",
        "paragraphs": [
          "已绑定函数再次用 call 指定其他接收者，通常不会替换先前绑定的 this；参数仍会按预置与后续顺序组合。严格模式下普通函数显式接收到的 null/undefined 不会自动变成全局对象，回答时应说明模式和函数种类。",
          "绑定函数若作为构造函数用 new 调用，构造语义会忽略绑定的 this，但仍使用预置参数。日常事件回调不需要依赖这种技巧，重点是明确函数类型、调用形式、执行时间与参数顺序。"
        ]
      }
    ],
    "examples": [
      {
        "title": "相同结果，不同执行方式",
        "language": "javascript",
        "code": "function total(base, extra) {\n  return this.name + ':' + (base + extra);\n}\nconst owner = { name: '订单' };\nconsole.log(total.call(owner, 10, 2));      // 订单:12\nconsole.log(total.apply(owner, [10, 2]));   // 订单:12\nconst later = total.bind(owner, 10);        // 尚未执行total\nconsole.log(later(2));                     // 订单:12",
        "explanation": "独立示例展示 call/apply 立即执行，bind 预置 base 后返回函数，执行由 later(2) 触发。"
      }
    ],
    "pitfalls": [
      "将 bind 的返回值当成函数执行结果，遗漏后续调用。",
      "每次解绑时重新 bind，得到新函数引用，无法移除先前注册的处理器。"
    ],
    "answers": [
      "bind 创建的是保存 this 与部分参数的新函数，而不是执行原函数。需要调用这个新函数才能得到业务结果，也可以先把它交给事件或回调系统。",
      "方法作为函数值传出后，原来的 obj.method() 接收者关系可能消失。显式 bind 或包装函数可以保持对象上下文；应保存绑定后的引用以便移除事件监听。"
    ],
    "related": [
      "javascript-interview",
      "prototype-chain",
      "object-creation"
    ]
  },
  "object-creation": {
    "kind": "tutorial",
    "sections": [
      {
        "title": "普通数据、显式原型与共享方法",
        "paragraphs": [
          "对象字面量适合配置和一次性数据；new Object() 也能创建普通对象，但一般无需增加这种写法。Object.create(proto) 则明确指定新对象的内部原型，适合演示原型继承或建立无需构造函数的共享行为。",
          "构造函数和 class 适合创建多个相似实例：实例字段单独初始化，prototype 上的普通方法通常共享。class 以原型机制为基础，同时具有自身的语法和运行语义，例如必须用 new 构造；不能把它与任意普通函数完全等同。"
        ]
      },
      {
        "title": "工厂、闭包与单例的取舍",
        "paragraphs": [
          "工厂是普通函数，调用后返回对象，不要求 new；它可用闭包封装私有状态，也可返回继承自共享原型的对象。如果每次调用都新建方法闭包，会产生不同函数实例，需依据封装与共享需求选择。",
          "IIFE 或模块可创建共享单例，但共享状态会影响测试隔离和并发使用。原文七种创建方式不是七种互斥的设计模式：对象字面量、工厂和原型可以组合，重点是对象身份、初始化、封装与生命周期。"
        ]
      },
      {
        "title": "无原型对象的特殊之处",
        "paragraphs": [
          "Object.create(null) 没有 Object.prototype，因此不继承 hasOwnProperty、toString 等方法，适合某些纯键值字典。使用 Object.hasOwn(dict, key) 判断自有键；需要丰富键类型与集合语义时，也可以考虑 Map。",
          "无原型不代表自动深拷贝、冻结或安全校验，属性仍可变。传给依赖普通对象方法的库时需确认兼容性，序列化与反序列化后也不应假定原型身份会被自动保留。"
        ]
      }
    ],
    "examples": [
      {
        "title": "类方法共享与无原型字典",
        "language": "javascript",
        "code": "class Member {\n  constructor(name) { this.name = name; }\n  greet() { return this.name; }\n}\nconst a = new Member('甲');\nconst b = new Member('乙');\nconsole.log(a.greet === b.greet); // true\nconst dict = Object.create(null);\ndict.label = '资料';\nconsole.log(dict.hasOwnProperty);        // undefined\nconsole.log(Object.hasOwn(dict, 'label')); // true",
        "explanation": "独立示例：类的普通方法通过原型共享；无原型字典不能调用继承的 hasOwnProperty，但可使用 Object.hasOwn。"
      }
    ],
    "pitfalls": [
      "认为工厂函数必定没有共享原型，或认为所有工厂都会创建独立方法闭包。",
      "使用 Object.create(null) 后继续调用 dict.hasOwnProperty，忽略没有继承方法。"
    ],
    "answers": [
      "它的内部原型直接是 null，不继承 Object.prototype 的方法或属性。适合纯字典场景，但应使用 Object.hasOwn 等外部检查方式，并确认依赖库兼容。",
      "工厂通过普通调用返回对象，返回对象与原型由实现决定；构造函数通常用 new 创建实例并关联其 prototype。两者都可实现共享方法或封装，但调用约定与默认原型建立方式不同。"
    ],
    "related": [
      "prototype-chain",
      "call-apply-bind",
      "javascript-interview"
    ]
  },
  "frontend-interview": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "从输入到画面定位响应延迟",
        "paragraphs": [
          "点击后的延迟可能发生在事件排队、长任务、业务计算、网络请求、状态更新或布局绘制。先判断事件是否及时处理、是否等待请求，再用性能记录与网络时间线查证；避免把所有卡顿都归因于框架。",
          "重计算可分段或移至合适的后台线程，大量 DOM 更新需控制，频繁交替读取布局与修改样式可能增加布局成本。优化前后应以同类设备、数据与操作测量，并观察长任务、响应时间与视觉反馈。"
        ]
      },
      {
        "title": "用键盘和语义检查交互",
        "paragraphs": [
          "交互控件优先使用 button、input 等有内建语义与键盘行为的元素，提供清楚的名称与焦点样式。使用 Tab/Shift+Tab 走完整流程，检查 Enter/Space 激活、焦点顺序和错误提示；可点击 div 若没有补齐语义和操作，会遗漏键盘用户。",
          "弹窗打开时应把焦点送入合适位置，关闭后回到触发点，并按组件行为处理 Escape 与焦点约束。隐藏菜单应避免留下可聚焦元素，组合输入期间不要破坏输入状态；测试应包含手机窄屏、放大和读屏可识别的标签。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "仅用鼠标点通功能，未检查键盘焦点、名称与隐藏区域。",
      "先套性能优化 API，未记录真正的耗时环节和优化前基线。"
    ],
    "answers": [
      "可能是事件排队或长任务、同步计算、网络等待、状态更新、布局/绘制等。先沿性能记录和网络时间线定位，再针对证据减少阻塞、请求或渲染成本，并给用户适当反馈。",
      "用 Tab/Shift+Tab 遍历并用 Enter/Space 操作，检查可见焦点、标签、顺序、弹窗焦点与关闭后返回。隐藏内容不应仍能聚焦，必要时结合读屏与窄屏验证。"
    ],
    "related": [
      "frontend-architecture",
      "javascript-interview",
      "react"
    ]
  },
  "react-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "组件负责界面，用例负责规则",
        "paragraphs": [
          "React 组件接收数据、呈现状态并处理用户事件；订单折扣、可提交条件或审批转换等规则可放普通 TypeScript/JavaScript 模块。用例接收明确输入与仓储端口，返回业务结果，组件把结果映射成加载、成功和错误画面。",
          "Hook 适合组织 React 状态与副作用，但 Hook 本身仍依赖 React 调用与生命周期。需要框架独立的规则不应通过 useState 或 useEffect 暗藏；把用例与 HTTP 实现注入界面边界，组件改版时才不必改核心规则。"
        ]
      },
      {
        "title": "接口变化与异步状态都需要契约",
        "paragraphs": [
          "HTTP 适配器将后端字段、错误与日期转换为应用模型，避免组件到处读取传输层字段名。组件处理请求竞争、卸载或取消、重复提交与错误反馈，领域不需要知道 DOM 和渲染细节。",
          "用假仓储直接调用普通用例，验证成功、拒绝和失败结果；组件测试再验证按钮、加载和错误展示。是否增加层次取决于业务变化和复用收益，简单展示页可以保持简洁，不必为每个函数建立一套接口。"
        ]
      }
    ],
    "examples": [
      {
        "title": "可脱离 React 测试的规则",
        "language": "javascript",
        "code": "export function calculateTotal(prices, discountRate) {\n  if (discountRate < 0 || discountRate > 1) {\n    throw new Error('折扣范围错误');\n  }\n  return Math.round(prices.reduce((sum, p) => sum + p, 0)\n    * (1 - discountRate));\n}\n// 示例金额使用整数分。\nconsole.log(calculateTotal([1000, 2000], 0.1)); // 2700",
        "explanation": "独立 JavaScript 规则示例无需组件或 Hook。生产系统还需定义舍入、币种与输入验证规则，并由界面用例调用。"
      }
    ],
    "pitfalls": [
      "把业务规则移动到自定义 Hook 后就认为它能独立于 React 运行。",
      "在多个组件分别适配后端字段，接口变化时导致不一致与遗漏。"
    ],
    "answers": [
      "组件仍承担呈现、用户事件、加载/错误状态、焦点与可访问性，把输入交给用例并显示结果。核心业务规则和存取契约独立后，UI 变化不会迫使这些规则一起变化。",
      "用普通模块与显式依赖实现用例，在测试中注入假仓储或服务，直接传输入并断言结果及错误；另用组件测试验证交互和显示，避免把业务正确性完全绑定渲染测试。"
    ],
    "related": [
      "frontend-architecture",
      "react",
      "clean-architecture"
    ]
  },
  "vue-clean": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "响应式状态与业务规则各有职责",
        "paragraphs": [
          "Vue 组件和 composable 可以管理输入、loading、错误和生命周期；优惠资格、库存规则和状态转换应可用普通函数或领域对象表达。业务模块接收值与端口，不直接导入 ref、watch 或路由对象，避免规则依赖界面运行环境。",
          "同一个 composable 里若同时监听 UI 状态、执行定价并拼接接口响应，就可能混合职责。把界面协调留在 composable，把业务规则移到用例，再由 HTTP 适配器实现外部契约，能更明确地测试变化范围。"
        ]
      },
      {
        "title": "在适配器处吸收 API 变化",
        "paragraphs": [
          "后端把 total 改为 amount_cents、错误格式或分页结构变化时，应主要修改对应数据适配器，让应用仍收到一致模型。接口带来的新业务规则则需要修改用例；不能为了声称业务稳定而忽略语义变化。",
          "数据从适配器进入界面时明确哪些是普通快照、哪些是可变状态。测试用例可注入内存实现，组件测试检查交互与状态同步；还应处理请求竞争、取消和重复提交，避免旧请求覆盖新状态。"
        ]
      }
    ],
    "examples": [],
    "pitfalls": [
      "把所有业务计算放在 watch 中，使执行时机依赖响应式变化而难以推理。",
      "让应用模型直接采用后端返回结构，每个页面自行解释字段和错误。"
    ],
    "answers": [
      "输入、loading、焦点与生命周期协调属于界面；定价、资格和状态转换属于业务，可提成普通函数或用例。composable 可以连接二者，但不应让核心规则依赖 Vue API。",
      "纯传输格式变化应主要落在 HTTP 适配器及其契约测试；若接口同时改变业务语义，用例也应调整。稳定的应用模型让组件避免跟着后端字段改名。"
    ],
    "related": [
      "frontend-architecture",
      "vue",
      "clean-architecture"
    ]
  },
  "git-workflows": {
    "kind": "resource-guide",
    "sections": [
      {
        "title": "围绕发布节奏选择工作流",
        "paragraphs": [
          "功能分支流程让每个任务在短分支中完成，经审阅与自动检查后合入主分支；主干开发强调更频繁的小批合并，未完成能力可借功能开关隐藏。小团队通常从主分支、短功能分支和明确的发布标记开始即可。",
          "Gitflow 使用长期 develop、发布与修复等分支，适用于需要维护发布阶段的团队，但同步成本较高；fork 流程让贡献者在独立仓库修改，通过 PR 合并到上游，常用于开放协作。不存在脱离团队发布方式的唯一最佳流程。"
        ]
      },
      {
        "title": "缩短分叉并保留审阅证据",
        "paragraphs": [
          "分支持续数周会积累基线变化、冲突和大规模审阅，集成错误也发现得晚。把任务拆成可独立验证的小变更，及时同步主线；同步后重跑相关检查，冲突解决的代码同样需要审阅。",
          "团队应写清合并策略、保护分支、必要检查、发布标记和紧急修复如何回流。merge、squash 与 rebase 对历史呈现有不同取舍，但可追踪性还依赖提交说明、PR 与产物版本的关联，不是只靠线性历史。"
        ]
      }
    ],
    "examples": [
      {
        "title": "小团队的最小协作约定",
        "language": "text",
        "code": "main 保持可发布\n  → 小任务使用短功能分支\n  → PR 描述行为与验证\n  → 必要检查 + 同行审阅\n  → 按团队策略合入main\n  → 发布固定提交并记录产物\n紧急修复也需回流并补验证",
        "explanation": "独立工作流示例，强调发布和验证而非固定分支数量。多人共享分支时，重写历史需协调。"
      }
    ],
    "pitfalls": [
      "为了流程完整保留大量长期分支，使修复和发布变化难以同步。",
      "只规定如何点击合并，未定义检查门槛、发布追踪和紧急修复回流。"
    ],
    "answers": [
      "会增加与主线的差异、冲突、审阅负担和延迟发现集成问题的风险。应拆小任务、缩短分支寿命并及时同步，在每次冲突解决后重新验证。",
      "从稳定主分支、短功能分支、PR 审阅与必要自动检查开始，按实际发布节奏增加发布分支或开关。只有维护多条版本线等需求出现时，再引入更复杂流程。"
    ],
    "related": [
      "git",
      "cicd",
      "containers"
    ]
  }
};

