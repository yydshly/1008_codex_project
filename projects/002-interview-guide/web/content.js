// 研究快照固定于上游提交。中文内容是本项目的学习提炼，原始引用完整保留。
export const meta = {
  "repo": "https://github.com/DevCaress/guia-entrevistas-de-programacion",
  "commit": "fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed",
  "date": "2026-10-08",
  "license": "MIT",
  "pageCount": 50,
  "referenceCount": 273,
  "uniqueReferenceCount": 207,
  "contentNote": "中文摘要、知识点、复习问题与学习路线由本研究项目整理；上游原文和引用保存在固定提交的快照中。部分上游页面是资源索引，外部网站的练习、判题、可视化或 AI 能力不属于本站。"
};

export const categories = [
  {
    "id": "engineering",
    "name": "工程原则",
    "english": "Engineering",
    "description": "用职责、依赖与可读性解释代码设计。",
    "icon": "◇"
  },
  {
    "id": "algorithms",
    "name": "算法与数据结构",
    "english": "Algorithms",
    "description": "分析增长率，选择数据结构，形成可解释的解法。",
    "icon": "⌘"
  },
  {
    "id": "languages",
    "name": "语言与框架",
    "english": "Languages & Frameworks",
    "description": "按技术栈复习语言语义、组件模式和工程实践。",
    "icon": "{ }"
  },
  {
    "id": "architecture",
    "name": "软件架构",
    "english": "Architecture",
    "description": "研究模块边界、用例组织与整洁架构的取舍。",
    "icon": "▦"
  },
  {
    "id": "system",
    "name": "系统设计",
    "english": "System Design",
    "description": "从需求与规模出发讨论扩展性、一致性和可靠性。",
    "icon": "◎"
  },
  {
    "id": "data",
    "name": "数据库与数据访问",
    "english": "Data",
    "description": "理解查询、事务、索引与 ORM 的抽象边界。",
    "icon": "▤"
  },
  {
    "id": "devops",
    "name": "协作与交付",
    "english": "DevOps",
    "description": "串联版本控制、团队流程、自动验证和应用部署。",
    "icon": "↗"
  },
  {
    "id": "interview",
    "name": "面试专题",
    "english": "Interview",
    "description": "建立岗位复习清单，用例子回答核心技术问题。",
    "icon": "? "
  },
  {
    "id": "ai",
    "name": "开发者 AI",
    "english": "AI for Developers",
    "description": "浏览 AI 与 MCP 的学习入口，理解工具和验证边界。",
    "icon": "✦"
  }
];

export const topics = [
  {
    "id": "algorithms",
    "title": "算法实现",
    "category": "algorithms",
    "summary": "上游整理了多种语言的算法实现仓库，可用来对照思路、阅读代码并练习独立实现。",
    "points": [
      "按搜索、排序、递归和图算法整理常见解题方法。",
      "先写出输入、输出与正确性条件，再选择算法。",
      "用复杂度和边界用例比较不同实现。",
      "参考代码用于理解思路，随后脱离答案重新实现。"
    ],
    "questions": [
      "如何证明你的算法对所有合法输入都成立？",
      "同一道题的暴力解和优化解分别需要多少时间与空间？"
    ],
    "tags": [
      "算法",
      "排序",
      "搜索",
      "多语言"
    ],
    "originalTitle": "Algoritmos",
    "sourcePath": "src/content/guide/algoritmos-y-estructuras-de-datos/algoritmos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/algoritmos-y-estructuras-de-datos/algoritmos.mdx",
    "references": [
      {
        "label": "Algoritmos en C",
        "url": "https://github.com/TheAlgorithms/C"
      },
      {
        "label": "Algoritmos en C++",
        "url": "https://github.com/TheAlgorithms/C-Plus-Plus"
      },
      {
        "label": "Algoritmos en Go",
        "url": "https://github.com/TheAlgorithms/Go"
      },
      {
        "label": "Algoritmos en Java",
        "url": "https://github.com/TheAlgorithms/Java"
      },
      {
        "label": "Algoritmos en Javascript",
        "url": "https://github.com/TheAlgorithms/JavaScript"
      },
      {
        "label": "Algoritmos en PHP",
        "url": "https://github.com/TheAlgorithms/PHP"
      },
      {
        "label": "Algoritmos en Python",
        "url": "https://github.com/TheAlgorithms/Python"
      },
      {
        "label": "Algoritmos en Typescript",
        "url": "https://github.com/TheAlgorithms/TypeScript"
      }
    ]
  },
  {
    "id": "complexity",
    "title": "复杂度与 Big-O",
    "category": "algorithms",
    "summary": "上游有完整的复杂度入门讲解，比较增长率、时间与空间消耗，并解释递归和最好、最坏、平均情况。",
    "points": [
      "复杂度衡量输入规模增长时的操作次数，而非具体运行秒数。",
      "常见增长率包括 O(1)、O(log n)、O(n)、O(n log n)、O(n²) 和 O(2ⁿ)。",
      "独立分析时间复杂度和额外空间，递归调用栈也占用内存。",
      "区分最好、最坏和平均情况，循环嵌套不一定都能直接相乘。"
    ],
    "questions": [
      "为什么常数时间的代码在真实运行中仍可能很慢？",
      "二分查找与递归遍历的时间和空间复杂度各是什么？"
    ],
    "tags": [
      "Big-O",
      "性能",
      "递归",
      "空间复杂度"
    ],
    "originalTitle": "Complejidad algoritmica",
    "sourcePath": "src/content/guide/algoritmos-y-estructuras-de-datos/complejidad-algoritmica.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/algoritmos-y-estructuras-de-datos/complejidad-algoritmica.mdx",
    "references": [
      {
        "label": "¿Qué es la complejidad algorítmica y con qué se come?",
        "url": "https://medium.com/@joseguillermo_/qué-es-la-complejidad-algorítmica-y-con-qué-se-come-2638e7fd9e8c"
      },
      {
        "label": "Introducción a Big-O Notation",
        "url": "https://medium.com/nowports-tech/introducción-a-big-o-notation-95ecca8bd866"
      },
      {
        "label": "Analysis of Algorithms | Big-O analysis",
        "url": "https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/"
      },
      {
        "label": "Big-O Cheat Sheet",
        "url": "https://www.bigocheatsheet.com/"
      },
      {
        "label": "freeCodeCamp — Big O Notation",
        "url": "https://www.freecodecamp.org/news/big-o-notation-why-it-matters-and-why-it-doesnt-1674cfa8a23c/"
      },
      {
        "label": "Khan Academy — Asymptotic notation",
        "url": "https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation"
      },
      {
        "label": "GeeksforGeeks — Time Complexity and Space Complexity",
        "url": "https://www.geeksforgeeks.org/time-complexity-and-space-complexity/"
      },
      {
        "label": "MDN — Algorithm (Glossary)",
        "url": "https://developer.mozilla.org/en-US/docs/Glossary/Algorithm"
      },
      {
        "label": "Introduction to Algorithms (CLRS), MIT Press",
        "url": "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/"
      },
      {
        "label": "VisuAlgo — Visualizacion de algoritmos",
        "url": "https://visualgo.net/en"
      }
    ]
  },
  {
    "id": "data-structures",
    "title": "数据结构",
    "category": "algorithms",
    "summary": "上游按语言收录经典数据结构学习资源，帮助建立操作成本与适用场景的比较框架。",
    "points": [
      "数组与链表在随机访问、插入和空间布局上有不同取舍。",
      "栈和队列分别适合后进先出与先进先出的处理流程。",
      "哈希表、树和堆服务于不同的查找、排序与优先级需求。",
      "选择结构时同时考虑操作频率、内存与数据规模。"
    ],
    "questions": [
      "什么时候链表比数组更合适？",
      "哈希表平均 O(1) 是否意味着所有情况下都如此？"
    ],
    "tags": [
      "数组",
      "链表",
      "哈希表",
      "树",
      "堆"
    ],
    "originalTitle": "Estructuras de datos",
    "sourcePath": "src/content/guide/algoritmos-y-estructuras-de-datos/estructuras-de-datos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/algoritmos-y-estructuras-de-datos/estructuras-de-datos.mdx",
    "references": [
      {
        "label": "Data Structures using C | What are the Data Structure in C and How it works?",
        "url": "https://www.mygreatlearning.com/blog/data-structures-using-c/"
      },
      {
        "label": "C++'s Built-In Data Structures",
        "url": "https://www.codecademy.com/learn/c-plus-plus-for-programmers/modules/cpp-built-in-data-structures/cheatsheet"
      },
      {
        "label": "Top Data Structures & Algorithms in Java That You Need to Know",
        "url": "https://medium.com/edureka/data-structures-algorithms-in-java-d27e915db1c5"
      },
      {
        "label": "JavaScript Algorithms and Data Structures",
        "url": "https://github.com/trekhleb/javascript-algorithms"
      },
      {
        "label": "Discovering PHP Data Structures: Arrays, Linked Lists, and Binary Trees",
        "url": "https://medium.com/@london.lingo.01/discovering-php-data-structures-arrays-linked-lists-and-binary-trees-501566f83bad"
      },
      {
        "label": "Efficient data structures for PHP 7",
        "url": "https://medium.com/@rtheunissen/efficient-data-structures-for-php-7-9dda7af674cd"
      },
      {
        "label": "Python Data Structures",
        "url": "https://www.geeksforgeeks.org/python-data-structures/"
      }
    ]
  },
  {
    "id": "practice",
    "title": "算法练习资源",
    "category": "algorithms",
    "summary": "上游提供 CodeWars、LeetCode、HackerRank、CoderByte 与 Exercism 的入口；解题、运行和判题发生在这些外部平台。",
    "points": [
      "按题型和难度组织练习，避免只追求题量。",
      "每题记录思路、复杂度、边界条件与失败原因。",
      "定期重做错题，训练在限时环境下解释解法。",
      "外部平台各有题库、语言与练习方式，应按目标选择。"
    ],
    "questions": [
      "如何从一道错题提炼可复用的解题模式？",
      "提交通过后，如何继续检查解法的可读性与复杂度？"
    ],
    "tags": [
      "练习",
      "LeetCode",
      "CodeWars",
      "外部平台"
    ],
    "originalTitle": "Practicar algoritmos",
    "sourcePath": "src/content/guide/algoritmos-y-estructuras-de-datos/practicar-algoritmos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/algoritmos-y-estructuras-de-datos/practicar-algoritmos.mdx",
    "references": [
      {
        "label": "CodeWars",
        "url": "https://www.codewars.com/"
      },
      {
        "label": "LeetCode",
        "url": "https://leetcode.com"
      },
      {
        "label": "HackerRank",
        "url": "https://www.hackerrank.com/"
      },
      {
        "label": "CoderByte",
        "url": "https://coderbyte.com/"
      },
      {
        "label": "Exercism",
        "url": "https://exercism.org/"
      }
    ]
  },
  {
    "id": "visualgo",
    "title": "算法可视化资源",
    "category": "algorithms",
    "summary": "上游链接 VisuAlgo，建议通过外部可视化观察排序、链表、哈希表、堆和树的运行过程。",
    "points": [
      "借助动画观察数据结构状态与算法步骤如何变化。",
      "理解循环或递归中的不变量，比记住动画顺序更重要。",
      "将可视化中的操作转换为自己的代码与复杂度分析。",
      "VisuAlgo 的动画能力属于外部网站，本页提供学习入口。"
    ],
    "questions": [
      "如何用不变量解释一次排序过程？",
      "从树操作动画中如何判断时间复杂度的变化？"
    ],
    "tags": [
      "可视化",
      "排序",
      "树",
      "外部资源"
    ],
    "originalTitle": "Visualgo",
    "sourcePath": "src/content/guide/algoritmos-y-estructuras-de-datos/visualgo.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/algoritmos-y-estructuras-de-datos/visualgo.mdx",
    "references": [
      {
        "label": "Visualgo",
        "url": "https://visualgo.net/"
      }
    ]
  },
  {
    "id": "software-architecture",
    "title": "软件架构总览",
    "category": "architecture",
    "summary": "上游汇总软件架构、整洁架构、六边形架构与 DDD 资源，并整理前端和后端相关参考。",
    "points": [
      "架构描述系统的职责划分、依赖关系和演化边界。",
      "分层与模块化帮助控制耦合，但应服务于真实需求。",
      "六边形架构通过端口与适配器隔离外部技术。",
      "DDD 从业务语言和领域模型出发设计系统。"
    ],
    "questions": [
      "架构决策如何同时考虑业务变化与技术限制？",
      "模块边界出现在哪些地方比增加层数更有效？"
    ],
    "tags": [
      "架构",
      "DDD",
      "六边形架构",
      "模块化"
    ],
    "originalTitle": "Arquitectura de Software",
    "sourcePath": "src/content/guide/arquitectura-de-software.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/arquitectura-de-software.mdx",
    "references": [
      {
        "label": "La guía definitiva de la arquitectura de software",
        "url": "https://medium.com/@ktufernando/la-guía-definitiva-de-la-arquitectura-del-software-f419db9c6bf7"
      },
      {
        "label": "Entendiendo a la arquitectura limpia",
        "url": "https://nescalro.medium.com/entendiendo-a-la-arquitectura-limpia-7877ad3a0a47"
      },
      {
        "label": "Los 10 patrones comunes de arquitectura de software",
        "url": "https://medium.com/@maniakhitoccori/los-10-patrones-comunes-de-arquitectura-de-software-d8b9047edf0b"
      },
      {
        "label": "Arquitectura Hexagonal",
        "url": "https://medium.com/@edusalguero/arquitectura-hexagonal-59834bb44b7f"
      },
      {
        "label": "Domain Driven Design: principios, beneficios y elementos - Primera Parte",
        "url": "https://medium.com/@jonathanloscalzo/domain-driven-design-principios-beneficios-y-elementos-primera-parte-aad90f30aa35"
      },
      {
        "label": "Arquitectura Hexagonal en el FrontEnd",
        "url": "https://softwarecrafters.io/react/arquitectura-hexagonal-frontend"
      },
      {
        "label": "Arquitecturas frontend: \"Enfoque \"modular simple",
        "url": "https://codigoencasa.com/arquitecturas-frontend-enfoque-modular-simple/"
      },
      {
        "label": "A Comprehensive Guide to Modern Frontend Architecture Patterns",
        "url": "https://medium.com/@johnadjanohoun/a-comprehensive-guide-to-modern-frontend-architecture-patterns-eb39debbd503"
      },
      {
        "label": "Alejándonos de ReactJs y VueJs en frontend usando Clean Architecture",
        "url": "https://xurxodev.com/frontend-clean_architecture/"
      },
      {
        "label": "La Arquitectura Hexagonal: un enfoque para desarrollar aplicaciones robustas en React, Angular y Vue con ejemplos de código",
        "url": "https://dev.to/dennysjmarquez/la-arquitectura-hexagonal-un-enfoque-para-desarrollar-aplicaciones-robustas-en-react-angular-y-vue-con-ejemplos-de-codigo-l4l"
      },
      {
        "label": "A Definitive Guide to Front-end Clean Architecture",
        "url": "https://eduardo-ottaviani.medium.com/a-definitive-guide-to-front-end-clean-architecture-3a62418becb4"
      },
      {
        "label": "Introducción a la arquitectura de microfrontends con un ejemplo en React.",
        "url": "https://www.paradigmadigital.com/dev/introduccion-arquitectura-microfrontends-ejemplo-react/"
      },
      {
        "label": "MicroFrontEnd",
        "url": "https://devjaime.medium.com/microfrontend-4eecf1498cd1"
      },
      {
        "label": "A Comprehensive Guide to Micro Frontend Architecture",
        "url": "https://medium.com/appfoster/a-comprehensive-guide-to-micro-frontend-architecture-cc0e31e0c053"
      },
      {
        "label": "Microservices vs. Micro Frontends: What's the Difference?",
        "url": "https://dev.to/pavanbelagatti/microservices-vs-micro-frontends-whats-the-difference-33je"
      },
      {
        "label": "Clean Architecture With React",
        "url": "https://betterprogramming.pub/clean-architecture-with-react-cc097a08b105"
      },
      {
        "label": "Clean Architecture: Applying with React",
        "url": "https://dev.to/rubemfsv/clean-architecture-applying-with-react-40h6"
      },
      {
        "label": "React Clean Architecture",
        "url": "https://github.com/eduardomoroni/react-clean-architecture"
      },
      {
        "label": "Clean Architecture: Typescript and React",
        "url": "https://paulallies.medium.com/clean-architecture-typescript-and-react-8e509098abfe"
      },
      {
        "label": "Clean Architecture with VueJS",
        "url": "https://www.linkedin.com/pulse/clean-architecture-vuejs-ahsan-riaz/"
      },
      {
        "label": "Clean Architecture VueJS",
        "url": "https://github.com/thanhchungbtc/vue-shopping-clean-architecture"
      },
      {
        "label": "Vue Clean Architecture Github",
        "url": "https://github.com/smotastic/vue-clean-architecture"
      },
      {
        "label": "Separating business logic from UI frameworks (React, Vue, Svelte, Angular, etc.) using clean architecture pattern",
        "url": "https://github.com/shamscorner/bloc-vue-3-clean-pattern"
      },
      {
        "label": "Clean Architecture en Node y Express",
        "url": "https://www.linkedin.com/pulse/clean-architecture-en-node-y-express-odannys-de-la-cruz/?originalSubdomain=es"
      },
      {
        "label": "Clean Architecture in Node.js",
        "url": "https://medium.com/@ben.dev.io/clean-architecture-in-node-js-39c3358d46f3"
      },
      {
        "label": "Node.js Clean Architecture",
        "url": "https://github.com/panagiop/node.js-clean-architecture"
      },
      {
        "label": "Clean Architecture en la vida real JAVA",
        "url": "https://medium.com/@soyjuanmalopez/clean-architecture-en-la-vida-real-9da710e5ad4a"
      },
      {
        "label": "Clean Architecture with Spring Boot: A good idea?",
        "url": "https://medium.com/@viniciusromualdobusiness/clean-architecture-with-spring-boot-a-good-idea-d6f97e450130"
      },
      {
        "label": "Clean Architecture with PHP",
        "url": "https://medium.com/unil-ci-software-engineering/clean-architecture-with-php-22de915a6c50"
      },
      {
        "label": "Clean Architecture with Laravel",
        "url": "https://dev.to/bdelespierre/how-to-implement-clean-architecture-with-laravel-2f2i"
      },
      {
        "label": "Understanding clean architecture in Python — Deep dive on the code",
        "url": "https://medium.com/@surajit.das0320/understanding-clean-architecture-in-python-deep-dive-on-the-code-17141dc5761a"
      },
      {
        "label": "Python Clean Architecture",
        "url": "https://github.com/pcah/python-clean-architecture"
      },
      {
        "label": "Clean Architecture in Django",
        "url": "https://medium.com/21buttons-tech/clean-architecture-in-django-d326a4ab86a9"
      },
      {
        "label": "Django Clean Architecture",
        "url": "https://github.com/jacob-y/django-clean-architecture"
      }
    ]
  },
  {
    "id": "backend-architecture",
    "title": "后端架构",
    "category": "architecture",
    "summary": "上游收集后端架构和分层资源，重点是服务职责划分以及业务逻辑与基础设施的分离。",
    "points": [
      "接口层负责协议适配，应用层组织业务用例。",
      "领域规则应避免直接依赖数据库与 HTTP 框架。",
      "通过仓储或端口抽象外部存储与第三方服务。",
      "用测试与明确的数据契约检查层与层之间的边界。"
    ],
    "questions": [
      "一个业务用例应放在控制器还是应用服务中？",
      "更换数据库时，哪些代码应受到影响？"
    ],
    "tags": [
      "后端",
      "分层",
      "服务",
      "依赖"
    ],
    "originalTitle": "Backend",
    "sourcePath": "src/content/guide/backend.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/backend.mdx",
    "references": [
      {
        "label": "Clean Architecture en Node y Express",
        "url": "https://www.linkedin.com/pulse/clean-architecture-en-node-y-express-odannys-de-la-cruz/?originalSubdomain=es"
      },
      {
        "label": "Clean Architecture in Node.js",
        "url": "https://medium.com/@ben.dev.io/clean-architecture-in-node-js-39c3358d46f3"
      },
      {
        "label": "Node.js Clean Architecture",
        "url": "https://github.com/panagiop/node.js-clean-architecture"
      },
      {
        "label": "Clean Architecture en la vida real JAVA",
        "url": "https://medium.com/@soyjuanmalopez/clean-architecture-en-la-vida-real-9da710e5ad4a"
      },
      {
        "label": "Clean Architecture with Spring Boot: A good idea?",
        "url": "https://medium.com/@viniciusromualdobusiness/clean-architecture-with-spring-boot-a-good-idea-d6f97e450130"
      },
      {
        "label": "Clean Architecture with PHP",
        "url": "https://medium.com/unil-ci-software-engineering/clean-architecture-with-php-22de915a6c50"
      },
      {
        "label": "Clean Architecture with Laravel",
        "url": "https://dev.to/bdelespierre/how-to-implement-clean-architecture-with-laravel-2f2i"
      },
      {
        "label": "Understanding clean architecture in Python — Deep dive on the code",
        "url": "https://medium.com/@surajit.das0320/understanding-clean-architecture-in-python-deep-dive-on-the-code-17141dc5761a"
      },
      {
        "label": "Python Clean Architecture",
        "url": "https://github.com/pcah/python-clean-architecture"
      },
      {
        "label": "Clean Architecture in Django",
        "url": "https://medium.com/21buttons-tech/clean-architecture-in-django-d326a4ab86a9"
      },
      {
        "label": "Django Clean Architecture",
        "url": "https://github.com/jacob-y/django-clean-architecture"
      }
    ]
  },
  {
    "id": "databases",
    "title": "数据库基础",
    "category": "data",
    "summary": "上游收录 SQL、NoSQL、数据库面试问答与 ORM 参考，适合梳理选型和查询基础。",
    "points": [
      "关系数据库通过表、约束和事务表达结构化数据。",
      "NoSQL 包含多种数据模型，选型需结合访问模式。",
      "索引加速特定查询，也带来写入与存储成本。",
      "事务隔离、数据一致性和查询计划是常见追问方向。"
    ],
    "questions": [
      "如何为高频查询设计索引，并验证它是否有效？",
      "选择 SQL 或 NoSQL 时应该先明确哪些需求？"
    ],
    "tags": [
      "SQL",
      "NoSQL",
      "事务",
      "索引"
    ],
    "originalTitle": "Bases de datos",
    "sourcePath": "src/content/guide/bases-de-datos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/bases-de-datos.mdx",
    "references": [
      {
        "label": "20 ejemplos de consultas SQL básicas para principiantes: Una visión completa",
        "url": "https://learnsql.es/blog/20-ejemplos-de-consultas-sql-basicas-para-principiantes-una-vision-completa/"
      },
      {
        "label": "Top 50+ Database Interview Questions And Answers",
        "url": "https://www.softwaretestinghelp.com/database-interview-questions/"
      },
      {
        "label": "Top 50 Database Interview Questions and Answers (2024)",
        "url": "https://www.guru99.com/database-interview-questions.html"
      },
      {
        "label": "Choosing the Best Database: SQL vs NoSQL",
        "url": "https://medium.com/codex/choosing-the-best-database-sql-vs-nosql-a816a7ec09fc"
      },
      {
        "label": "¿Qué es un ORM?",
        "url": "https://wildpasco.medium.com/qué-es-un-orm-backend-bee59674e1d0"
      },
      {
        "label": "Introducción a Mongoose para MongoDB",
        "url": "https://www.freecodecamp.org/espanol/news/introduccion-a-mongoose-para-mongodb/"
      },
      {
        "label": "The Ultimate Guide To Get Started With Sequelize ORM",
        "url": "https://levelup.gitconnected.com/the-ultimate-guide-to-get-started-with-sequelize-orm-238588d3516e"
      }
    ]
  },
  {
    "id": "angular",
    "title": "Angular 实践",
    "category": "languages",
    "summary": "上游整理 Angular 可维护性、扩展性、性能与编码风格资源；以下知识点作为阅读这些资源的中文导引。",
    "points": [
      "按业务职责组织组件、服务与模块。",
      "利用依赖注入明确对象的创建与依赖关系。",
      "理解响应式数据流和订阅生命周期。",
      "通过变化检测、按需加载与测量改善性能。"
    ],
    "questions": [
      "组件逻辑与服务逻辑如何划分？",
      "怎样发现并避免订阅未释放带来的问题？"
    ],
    "tags": [
      "Angular",
      "TypeScript",
      "依赖注入",
      "前端"
    ],
    "originalTitle": "Angular",
    "sourcePath": "src/content/guide/buenas-practicas-en/angular.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/angular.mdx",
    "references": [
      {
        "label": "10 Best Practices for Building Scalable Angular Applications — With examples",
        "url": "https://medium.com/@mattias.trnqvist/10-best-practices-for-building-scalable-angular-applications-with-examples-efdfe2a5b4e8"
      },
      {
        "label": "Angular Optimization and Best Practices",
        "url": "https://www.tatvasoft.com/blog/angular-optimization-and-best-practices/"
      },
      {
        "label": "Angular coding style guide",
        "url": "https://angular.io/guide/styleguide"
      }
    ]
  },
  {
    "id": "cpp",
    "title": "C++ 实践",
    "category": "languages",
    "summary": "上游提供 C++ 编码与效率实践资源，可结合面试题复习对象生命周期和资源管理。",
    "points": [
      "使用 RAII 管理资源，明确所有权与生命周期。",
      "理解值语义、引用、指针与移动语义的区别。",
      "熟悉 STL 容器与算法及其复杂度。",
      "先保证正确性和可读性，再用测量指导优化。"
    ],
    "questions": [
      "RAII 怎样帮助处理异常情况下的资源释放？",
      "传值、常量引用与移动传递分别适用于什么情况？"
    ],
    "tags": [
      "C++",
      "RAII",
      "STL",
      "内存管理"
    ],
    "originalTitle": "C++",
    "sourcePath": "src/content/guide/buenas-practicas-en/cpp.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/cpp.mdx",
    "references": [
      {
        "label": "Collecting the best C++ practices",
        "url": "https://medium.com/@Code_Analysis/collecting-the-best-c-practices-4b867006849f"
      },
      {
        "label": "Boost Your C++ Coding Skills: 5 Tips For Faster, Better Code",
        "url": "https://programminggyan.com/5-cpp-tips-for-faster-better-code/"
      }
    ]
  },
  {
    "id": "dart",
    "title": "Dart 实践",
    "category": "languages",
    "summary": "上游链接 Effective Dart 的设计指南，作为 Dart API 设计和编码风格的参考入口。",
    "points": [
      "使用清楚、一致的命名表达 API 的用途。",
      "利用空安全让可空数据与正常数据的边界显式化。",
      "区分同步调用、Future 与 Stream 的处理方式。",
      "以小而清晰的接口组织职责和类型。"
    ],
    "questions": [
      "可空类型如何改变 API 的调用契约？",
      "Future 与 Stream 的使用场景有什么区别？"
    ],
    "tags": [
      "Dart",
      "空安全",
      "异步",
      "API 设计"
    ],
    "originalTitle": "Dart",
    "sourcePath": "src/content/guide/buenas-practicas-en/dart.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/dart.mdx",
    "references": [
      {
        "label": "Effective Dart: Design",
        "url": "https://dart.dev/effective-dart/design"
      }
    ]
  },
  {
    "id": "django",
    "title": "Django 实践",
    "category": "languages",
    "summary": "上游整理 Django 模型、项目组织与整洁代码资源，帮助复习框架常见设计取舍。",
    "points": [
      "模型定义数据结构、约束与相关领域行为。",
      "控制视图职责，避免请求处理函数堆积全部业务逻辑。",
      "关注 ORM 查询次数以及关联查询导致的 N+1 问题。",
      "结合迁移与测试管理数据库和业务行为的变化。"
    ],
    "questions": [
      "如何识别并优化 Django 中的 N+1 查询？",
      "哪些逻辑适合模型方法，哪些适合独立服务？"
    ],
    "tags": [
      "Django",
      "Python",
      "ORM",
      "后端"
    ],
    "originalTitle": "Django",
    "sourcePath": "src/content/guide/buenas-practicas-en/django.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/django.mdx",
    "references": [
      {
        "label": "Django Best Practices 2022",
        "url": "https://www.linkedin.com/pulse/django-best-practices-2022-akshata-murudkar/"
      },
      {
        "label": "Django Model Best Practices: Tips and Tricks for Clean and Efficient Code",
        "url": "https://medium.com/@schopade333/django-model-best-practices-c5c8a142dfc"
      },
      {
        "label": "The 4 Clean Code Principles in Django",
        "url": "https://betterprogramming.pub/clean-code-principles-in-django-b0563a4e12f5"
      }
    ]
  },
  {
    "id": "flutter",
    "title": "Flutter 实践",
    "category": "languages",
    "summary": "上游收录 Flutter 与 Dart 的实践文章，可用于复习组件组合、状态和应用组织方式。",
    "points": [
      "通过组合 Widget 构建界面，并保持组件职责明确。",
      "区分局部 UI 状态与跨页面的业务状态。",
      "理解构建、布局与绘制流程以定位性能问题。",
      "为异步调用、错误状态与资源释放设计明确流程。"
    ],
    "questions": [
      "哪些状态可以留在 Widget 内，哪些应抽离？",
      "界面重复构建是否一定意味着性能问题？"
    ],
    "tags": [
      "Flutter",
      "Dart",
      "Widget",
      "状态管理"
    ],
    "originalTitle": "Flutter",
    "sourcePath": "src/content/guide/buenas-practicas-en/flutter.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/flutter.mdx",
    "references": [
      {
        "label": "Flutter Best Practices",
        "url": "https://itnext.io/flutter-best-practices-part-1-e89467ea4823"
      },
      {
        "label": "The Dart Way: Best Coding Practices",
        "url": "https://articles.wesionary.team/the-dart-way-best-coding-practices-6ac693736090"
      },
      {
        "label": "10 Best Practices Every Flutter Developer Should Follow",
        "url": "https://somniosoftware.com/post/top-10-flutter-best-practices"
      }
    ]
  },
  {
    "id": "java",
    "title": "Java 实践",
    "category": "languages",
    "summary": "上游提供 Java 编码实践资源，适合围绕对象设计、集合和异常处理做系统复习。",
    "points": [
      "利用封装与接口表达职责及协作契约。",
      "理解 equals、hashCode 与集合行为之间的关系。",
      "区分异常类型并避免吞掉对业务有意义的错误。",
      "认识不可变对象、泛型和并发场景中的状态共享。"
    ],
    "questions": [
      "为什么重写 equals 时通常也要重写 hashCode？",
      "可变对象作为 Map 的键会带来什么问题？"
    ],
    "tags": [
      "Java",
      "集合",
      "异常",
      "对象设计"
    ],
    "originalTitle": "Java",
    "sourcePath": "src/content/guide/buenas-practicas-en/java.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/java.mdx",
    "references": [
      {
        "label": "Java Best Practices (recomendado)",
        "url": "https://github.com/in28minutes/java-best-practices"
      },
      {
        "label": "Java Best Practices",
        "url": "https://www.developer.com/languages/javascript/java-best-practices/"
      },
      {
        "label": "10 best practices in Java",
        "url": "https://medium.com/@alexthedev/10-best-practices-in-java-dc0b06dda858"
      }
    ]
  },
  {
    "id": "javascript",
    "title": "JavaScript 实践",
    "category": "languages",
    "summary": "上游整理 MDN、Airbnb 与其他 JavaScript 风格资源，供学习规范、可读性和语言常见陷阱。",
    "points": [
      "理解作用域、闭包与声明提升，避免隐式全局变量。",
      "区分普通函数和箭头函数的 this 行为。",
      "用明确的异步与错误处理组织 Promise 流程。",
      "编码风格保持一致，并把规范与实际运行语义分开。"
    ],
    "questions": [
      "闭包会保留哪些数据，何时可能影响内存？",
      "箭头函数的 this 为什么不会随 call 改变？"
    ],
    "tags": [
      "JavaScript",
      "闭包",
      "异步",
      "编码风格"
    ],
    "originalTitle": "JavaScript",
    "sourcePath": "src/content/guide/buenas-practicas-en/javascript.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/javascript.mdx",
    "references": [
      {
        "label": "Guidelines For Writing JavaScript Code Examples",
        "url": "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript"
      },
      {
        "label": "JavaScript Best Practices by W3.org",
        "url": "https://www.w3.org/wiki/JavaScript_best_practices"
      },
      {
        "label": "JavaScript Best Practices by W3Schools",
        "url": "https://www.w3schools.com/js/js_best_practices.asp"
      },
      {
        "label": "Airbnb JavaScript Style Guide()",
        "url": "https://github.com/airbnb/javascript"
      },
      {
        "label": "30 JavaScript Best Practices for Beginners",
        "url": "https://code.tutsplus.com/24-javascript-best-practices-for-beginners--net-5399t"
      }
    ]
  },
  {
    "id": "php",
    "title": "PHP 实践",
    "category": "languages",
    "summary": "上游汇总 PHP 编码风格与工程实践资源，可围绕类型、依赖和输入边界展开复习。",
    "points": [
      "通过类型声明和明确返回值表达调用契约。",
      "遵循统一的命名、格式和项目组织约定。",
      "利用自动加载与依赖管理保持代码结构清晰。",
      "区分数据验证、参数绑定与输出转义的职责。"
    ],
    "questions": [
      "类型声明可以发现哪些问题，哪些仍需运行时验证？",
      "数据库参数绑定与 HTML 转义分别解决什么问题？"
    ],
    "tags": [
      "PHP",
      "类型",
      "编码规范",
      "后端"
    ],
    "originalTitle": "PHP",
    "sourcePath": "src/content/guide/buenas-practicas-en/php.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/php.mdx",
    "references": [
      {
        "label": "PHP Programming Best Practices and Coding Styles",
        "url": "https://medium.com/techlaboratory/php-programming-best-practices-and-coding-styles-e43234446fd3"
      },
      {
        "label": "PHP Best Practices",
        "url": "https://phpbestpractices.org/"
      }
    ]
  },
  {
    "id": "python",
    "title": "Python 实践",
    "category": "languages",
    "summary": "上游收录 Python 风格和实践资源，适合训练简洁、可读并能解释复杂度的面试代码。",
    "points": [
      "遵循 Python 的命名与格式约定，突出代码意图。",
      "理解可变对象、默认参数与引用共享。",
      "使用迭代器和生成器处理逐步产生的数据。",
      "用异常与上下文管理器处理失败和资源生命周期。"
    ],
    "questions": [
      "为什么可变默认参数可能跨调用保留状态？",
      "列表推导式与生成器表达式的空间行为有何不同？"
    ],
    "tags": [
      "Python",
      "生成器",
      "可变对象",
      "编码风格"
    ],
    "originalTitle": "Python",
    "sourcePath": "src/content/guide/buenas-practicas-en/python.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/python.mdx",
    "references": [
      {
        "label": "Code Style in Python",
        "url": "https://docs.python-guide.org/writing/style/"
      },
      {
        "label": "Python Best Practices to Follow in 2023",
        "url": "https://aglowiditsolutions.com/blog/python-best-practices/"
      }
    ]
  },
  {
    "id": "react",
    "title": "React 实践",
    "category": "languages",
    "summary": "上游整理 React 组件与架构实践资源，可配合自己的项目复习状态、Hook 与数据流。",
    "points": [
      "用组件组合表达界面结构，减少职责混杂。",
      "理解 props 与 state，避免重复维护可推导的数据。",
      "正确处理 Hook 依赖和副作用的清理。",
      "基于测量定位渲染成本，谨慎使用缓存优化。"
    ],
    "questions": [
      "哪些数据应作为 state，哪些可以在渲染时计算？",
      "useEffect 的依赖遗漏会怎样影响组件行为？"
    ],
    "tags": [
      "React",
      "Hook",
      "状态",
      "组件"
    ],
    "originalTitle": "React.js",
    "sourcePath": "src/content/guide/buenas-practicas-en/reactjs.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/reactjs.mdx",
    "references": [
      {
        "label": "10 Best Practices for Writing Clean React Code",
        "url": "https://www.turing.com/kb/writing-clean-react-code"
      },
      {
        "label": "React Best Practices – Tips for Writing Better React Code in 2022",
        "url": "https://www.freecodecamp.org/news/best-practices-for-react/#tips-to-help-you-write-better-react-code-the-cherries-on-top"
      },
      {
        "label": "React best practices and patterns to reduce code",
        "url": "https://devsmitra.medium.com/react-best-practices-and-patterns-to-reduce-code-3170f1913b26"
      },
      {
        "label": "React Best Practices Every Developer Have to Follow in 2023",
        "url": "https://technostacks.com/blog/react-best-practices/"
      }
    ]
  },
  {
    "id": "typescript",
    "title": "TypeScript 实践",
    "category": "languages",
    "summary": "上游收录 TypeScript 类型与设计实践资源，适合复习如何用类型表达边界和不合法状态。",
    "points": [
      "用联合类型和类型收窄描述不同数据状态。",
      "泛型表达输入与输出间的关系，而非替代所有具体类型。",
      "理解 unknown 与 any 的差异，逐步验证外部数据。",
      "类型检查发生在开发阶段，运行时输入仍需校验。"
    ],
    "questions": [
      "如何用辨别联合让状态分支更可靠？",
      "为什么 TypeScript 类型不能保证网络响应正确？"
    ],
    "tags": [
      "TypeScript",
      "泛型",
      "类型收窄",
      "联合类型"
    ],
    "originalTitle": "TypeScript",
    "sourcePath": "src/content/guide/buenas-practicas-en/typescript.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/typescript.mdx",
    "references": [
      {
        "label": "TypeScript best practices by AWS",
        "url": "https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-cdk-typescript-iac/typescript-best-practices.html"
      },
      {
        "label": "TypeScript Best Practices 2021",
        "url": "https://medium.com/@warkiringoda/typescript-best-practices-2021-a58aee199661"
      }
    ]
  },
  {
    "id": "vue",
    "title": "Vue 实践",
    "category": "languages",
    "summary": "上游提供 Vue 实践与模式资源，可围绕响应式系统、组件契约和状态组织复习。",
    "points": [
      "理解 ref、reactive 与依赖追踪的使用边界。",
      "通过 props 与事件定义组件之间的契约。",
      "用 computed 表达派生值，用 watch 处理必要的副作用。",
      "把可复用逻辑抽成 composable，并保持生命周期明确。"
    ],
    "questions": [
      "computed 与 watch 在职责上如何区分？",
      "如何避免组件之间形成难以追踪的状态依赖？"
    ],
    "tags": [
      "Vue",
      "响应式",
      "组件",
      "Composition API"
    ],
    "originalTitle": "Vue.js",
    "sourcePath": "src/content/guide/buenas-practicas-en/vuejs.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas-en/vuejs.mdx",
    "references": [
      {
        "label": "12 VueJS Best Practices",
        "url": "https://learnvue.co/articles/vue-best-practices"
      },
      {
        "label": "Vue Patterns",
        "url": "https://learn-vuejs.github.io/vue-patterns/patterns/#component-declaration"
      }
    ]
  },
  {
    "id": "clean-architecture",
    "title": "整洁架构与依赖规则",
    "category": "engineering",
    "summary": "上游有分层与依赖方向的详细讲解，展示规则被违反的情形及用端口隔离数据库后的改进。",
    "points": [
      "实体和用例承载核心业务规则。",
      "依赖应指向内部业务层，而非让业务依赖框架细节。",
      "接口适配器转换外部协议和内部模型。",
      "通过端口实现依赖反转，提高业务规则的可测试性。"
    ],
    "questions": [
      "依赖规则与常见的分层目录结构有什么区别？",
      "用例如何在不导入数据库实现的情况下读取数据？"
    ],
    "tags": [
      "Clean Architecture",
      "依赖反转",
      "端口",
      "测试"
    ],
    "originalTitle": "Clean Architecture",
    "sourcePath": "src/content/guide/buenas-practicas/clean-architecture.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/clean-architecture.mdx",
    "references": [
      {
        "label": "The Clean Architecture — Robert C. Martin (blog original)",
        "url": "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html"
      },
      {
        "label": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "url": "https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/"
      },
      {
        "label": "The Dependency Rule explained",
        "url": "https://khalilstemmler.com/wiki/dependency-rule/"
      }
    ]
  },
  {
    "id": "clean-code",
    "title": "整洁代码",
    "category": "engineering",
    "summary": "上游整理 Java、JavaScript 与 Python 的整洁代码资源，供练习可读性、维护性和职责划分。",
    "points": [
      "命名应表达业务意图，减少读者猜测。",
      "函数围绕单一职责组织，控制参数与隐式副作用。",
      "错误处理和边界条件应保持清楚、一致。",
      "以测试支持持续重构，避免把风格偏好当作唯一标准。"
    ],
    "questions": [
      "怎样判断一个函数承担了过多职责？",
      "代码评审中如何解释某次重构提升了可维护性？"
    ],
    "tags": [
      "Clean Code",
      "命名",
      "重构",
      "可维护性"
    ],
    "originalTitle": "Clean Code",
    "sourcePath": "src/content/guide/buenas-practicas/clean-code.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/clean-code.mdx",
    "references": [
      {
        "label": "Clean Code en Java - Español",
        "url": "https://github.com/alansastre/java-clean-code"
      },
      {
        "label": "Clean Code en Java - Inglés",
        "url": "https://github.com/JuanCrg90/Clean-Code-Notes"
      },
      {
        "label": "Clean Code en Javascript - Español",
        "url": "https://github.com/andersontr15/clean-code-javascript-es"
      },
      {
        "label": "Clean Code en Javascript - Inglés",
        "url": "https://github.com/ryanmcdermott/clean-code-javascript#openclosed-principle-ocp"
      },
      {
        "label": "Clean Code en Python - Español",
        "url": "https://github.com/sryvcr/clean-code-python-es"
      },
      {
        "label": "Clean Code en Python - Inglés",
        "url": "https://github.com/zedr/clean-code-python"
      }
    ]
  },
  {
    "id": "dry",
    "title": "DRY：减少知识重复",
    "category": "engineering",
    "summary": "上游通过重复逻辑的反例与改进示例解释 DRY，强调同一知识在系统中应有明确的维护位置。",
    "points": [
      "DRY 关注业务知识与规则的重复，而不只是相似文本。",
      "重复规则容易在修改时产生不一致。",
      "抽取共用逻辑前应确认它们表达同一个变化原因。",
      "过早抽象会把偶然相似的需求绑在一起。"
    ],
    "questions": [
      "两段相似代码是否一定应该合并？",
      "如何识别系统中重复的业务规则？"
    ],
    "tags": [
      "DRY",
      "抽象",
      "重复",
      "重构"
    ],
    "originalTitle": "DRY — Don't Repeat Yourself",
    "sourcePath": "src/content/guide/buenas-practicas/dry.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/dry.mdx",
    "references": [
      {
        "label": "Demystifying Software Development Principles: DRY, KISS, YAGNI, SOLID, GRASP, and LoD",
        "url": "https://levelup.gitconnected.com/demystifying-software-development-principles-dry-kiss-yagni-solid-grasp-and-lod-8606113c0313"
      },
      {
        "label": "The Pragmatic Programmer — DRY Principle",
        "url": "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/"
      },
      {
        "label": "DRY: Don't Repeat Yourself — refactoring.guru",
        "url": "https://refactoring.guru/extract-method"
      }
    ]
  },
  {
    "id": "grasp",
    "title": "GRASP：职责分配",
    "category": "engineering",
    "summary": "上游介绍 GRASP 的九种职责分配模式，并以信息专家为例说明应把行为放在哪里。",
    "points": [
      "信息专家原则让最了解数据的对象承担相关行为。",
      "创建者与控制器模式帮助安排对象创建和请求协调。",
      "低耦合与高内聚指导职责与依赖的设计。",
      "多态、间接层与受保护变化帮助隔离变化。"
    ],
    "questions": [
      "某项计算应该交给服务还是拥有数据的对象？",
      "引入中间层如何降低耦合，又可能增加什么成本？"
    ],
    "tags": [
      "GRASP",
      "职责",
      "内聚",
      "耦合"
    ],
    "originalTitle": "GRASP — General Responsibility Assignment Software Patterns",
    "sourcePath": "src/content/guide/buenas-practicas/grasp.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/grasp.mdx",
    "references": [
      {
        "label": "Applying UML and Patterns — Craig Larman",
        "url": "https://www.pearson.com/en-us/subject-catalog/p/applying-uml-and-patterns-an-introduction-to-object-oriented-analysis-and-design-and-iterative-development/P200000009412"
      },
      {
        "label": "GRASP Patterns — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/GRASP_(object-oriented_design)"
      }
    ]
  },
  {
    "id": "kiss",
    "title": "KISS：保持简单",
    "category": "engineering",
    "summary": "上游以反例和简化后的实现解释 KISS，建议选择能够解决当前问题的清楚方案。",
    "points": [
      "简单性取决于理解与维护成本，而非代码行数。",
      "避免不必要的层次、分支与配置。",
      "以清楚的控制流和数据结构表达需求。",
      "当需求确实复杂时，用拆分和命名降低认知负担。"
    ],
    "questions": [
      "短代码是否一定比长代码更简单？",
      "你会用什么证据决定删除一个抽象层？"
    ],
    "tags": [
      "KISS",
      "简单性",
      "可读性",
      "设计"
    ],
    "originalTitle": "KISS — Keep It Simple, Stupid",
    "sourcePath": "src/content/guide/buenas-practicas/kiss.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/kiss.mdx",
    "references": [
      {
        "label": "KISS Principle — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/KISS_principle"
      },
      {
        "label": "Clean Code — Robert C. Martin",
        "url": "https://www.oreilly.com/library/view/clean-code-a/9780136083238/"
      }
    ]
  },
  {
    "id": "law-of-demeter",
    "title": "迪米特法则",
    "category": "engineering",
    "summary": "上游解释对象应与直接协作者交流，并展示如何消除深入访问其他对象内部结构的调用链。",
    "points": [
      "避免让调用方了解协作者内部的对象关系。",
      "长链式访问常暴露了结构性耦合。",
      "把操作委托给了解该职责的对象。",
      "不应机械禁止所有链式 API，要结合对象边界判断。"
    ],
    "questions": [
      "a.b.c.doSomething 的问题可能是什么？",
      "怎样通过职责委托减少调用方对内部结构的了解？"
    ],
    "tags": [
      "LoD",
      "迪米特法则",
      "封装",
      "耦合"
    ],
    "originalTitle": "LoD — Ley de Demeter",
    "sourcePath": "src/content/guide/buenas-practicas/lod.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/lod.mdx",
    "references": [
      {
        "label": "Law of Demeter — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Law_of_Demeter"
      },
      {
        "label": "The Pragmatic Programmer — Law of Demeter",
        "url": "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/"
      }
    ]
  },
  {
    "id": "solid",
    "title": "SOLID 五原则",
    "category": "engineering",
    "summary": "上游逐项讲解 SOLID，给出违反原则与改进后的代码示例，并保留多种语言的参考资料。",
    "points": [
      "单一职责与开放封闭原则关注变化原因及扩展边界。",
      "里氏替换要求子类型遵守调用方期待的行为契约。",
      "接口隔离让调用方只依赖自己需要的能力。",
      "依赖反转让高层业务与低层细节通过抽象协作。",
      "原则应结合业务需求使用，避免为满足形式而增加复杂度。"
    ],
    "questions": [
      "依赖注入是否自动意味着遵守依赖反转原则？",
      "怎样用具体行为说明一个子类违反了里氏替换？"
    ],
    "tags": [
      "SOLID",
      "SRP",
      "OCP",
      "LSP",
      "ISP",
      "DIP"
    ],
    "originalTitle": "Principios SOLID",
    "sourcePath": "src/content/guide/buenas-practicas/solid-principles.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/solid-principles.mdx",
    "references": [
      {
        "label": "SOLID en C++ con implemetación y ejemplos - Inglés",
        "url": "https://medium.com/@aleksandra_shershen/solid-principles-implementation-and-examples-in-c-99f0d7e3e868"
      },
      {
        "label": "SOLID en C++ - Inglés",
        "url": "https://nexwebsites.com/blog/solid-design-principles/"
      },
      {
        "label": "SOLID en Java con Ejemplos - Inglés",
        "url": "https://www.javaguides.net/2020/01/solid-principles-in-java-with-examples.html"
      },
      {
        "label": "SOLID en Java - Inglés",
        "url": "https://medium.com/@shavi22/solid-principles-in-java-cf9f5b167600"
      },
      {
        "label": "SOLID en Javascript Vanilla - Inglés",
        "url": "https://github.com/ryanmcdermott/clean-code-javascript#openclosed-principle-ocp"
      },
      {
        "label": "SOLID en Python - Inglés",
        "url": "https://realpython.com/solid-principles-python/"
      },
      {
        "label": "SOLID en React.JS - Inglés",
        "url": "https://medium.com/docler-engineering/applying-solid-to-react-ca6d1ff926a4"
      },
      {
        "label": "SOLID en Vue.JS - Inglés",
        "url": "https://medium.com/@moein.mirkiani/solid-principles-in-vue-29ecc988f968"
      }
    ]
  },
  {
    "id": "yagni",
    "title": "YAGNI：按需实现",
    "category": "engineering",
    "summary": "上游通过推测性功能与精简实现对比解释 YAGNI，提醒把开发投入集中在已经成立的需求上。",
    "points": [
      "未经验证的未来需求不应自动变成当前功能。",
      "额外功能同时带来维护、测试与理解成本。",
      "保留可演化的边界，但避免实现所有预想分支。",
      "用实际反馈决定何时增加新能力。"
    ],
    "questions": [
      "预留扩展点与过度设计如何区分？",
      "删除尚未使用的功能为什么可能减少技术债？"
    ],
    "tags": [
      "YAGNI",
      "需求",
      "技术债",
      "设计取舍"
    ],
    "originalTitle": "YAGNI — You Aren't Gonna Need It",
    "sourcePath": "src/content/guide/buenas-practicas/yagni.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/buenas-practicas/yagni.mdx",
    "references": [
      {
        "label": "YAGNI — Martin Fowler",
        "url": "https://martinfowler.com/bliki/Yagni.html"
      },
      {
        "label": "Extreme Programming Explained — Kent Beck",
        "url": "https://www.oreilly.com/library/view/extreme-programming-explained/0321278658/"
      }
    ]
  },
  {
    "id": "cicd",
    "title": "持续集成与交付",
    "category": "devops",
    "summary": "上游整理 CI/CD 入门资源，帮助复习从代码提交到验证、发布的自动化流程。",
    "points": [
      "持续集成通过频繁合并与自动检查尽早发现问题。",
      "构建、静态检查与测试是常见流水线步骤。",
      "持续交付与持续部署对自动发布程度的要求不同。",
      "发布流程应考虑环境一致性、回滚与可观测性。"
    ],
    "questions": [
      "持续交付与持续部署有什么区别？",
      "一次流水线通过后，哪些发布风险仍需关注？"
    ],
    "tags": [
      "CI",
      "CD",
      "流水线",
      "发布"
    ],
    "originalTitle": "CI/CD",
    "sourcePath": "src/content/guide/cicd.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/cicd.mdx",
    "references": [
      {
        "label": "Introducción a CI/CD",
        "url": "https://medium.com/@diego.coder/introducción-a-ci-cd-be79d0beafad"
      },
      {
        "label": "Comprensión de la CI/CD by AWS",
        "url": "https://docs.aws.amazon.com/es_es/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html"
      },
      {
        "label": "What is CI/CD?",
        "url": "https://www.freecodecamp.org/news/what-is-ci-cd/"
      },
      {
        "label": "What is a DevOps pipeline?",
        "url": "https://resources.github.com/devops/pipeline/"
      }
    ]
  },
  {
    "id": "express-clean",
    "title": "Express 整洁架构",
    "category": "architecture",
    "summary": "上游收集 Node.js 与 Express 的整洁架构资源，适合对照服务项目检查业务和框架之间的边界。",
    "points": [
      "路由与控制器负责 HTTP 输入输出的适配。",
      "用例独立描述业务流程，不直接读取请求对象。",
      "通过接口隔离数据库与外部服务实现。",
      "统一处理异步错误，并为业务用例提供独立测试。"
    ],
    "questions": [
      "Express 请求对象为什么不宜进入核心业务层？",
      "如何在测试中替换真实数据库适配器？"
    ],
    "tags": [
      "Express",
      "Node.js",
      "Clean Architecture",
      "后端"
    ],
    "originalTitle": "Clean Architecture Express JS",
    "sourcePath": "src/content/guide/clean-architecture-express-js.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/clean-architecture-express-js.mdx",
    "references": [
      {
        "label": "Clean Architecture en Node y Express",
        "url": "https://www.linkedin.com/pulse/clean-architecture-en-node-y-express-odannys-de-la-cruz/?originalSubdomain=es"
      },
      {
        "label": "Clean Architecture in Node.js",
        "url": "https://medium.com/@ben.dev.io/clean-architecture-in-node-js-39c3358d46f3"
      },
      {
        "label": "Node.js Clean Architecture",
        "url": "https://github.com/panagiop/node.js-clean-architecture"
      }
    ]
  },
  {
    "id": "java-clean",
    "title": "Java 整洁架构",
    "category": "architecture",
    "summary": "上游整理 Java 与 Spring Boot 的整洁架构文章，便于研究业务模型与框架技术的分离。",
    "points": [
      "应用用例组织业务操作，领域模型维护业务规则。",
      "用接口表达仓储与外部服务的需求。",
      "Spring 等框架负责装配实现与运行环境。",
      "结合事务边界判断业务一致性与实现位置。"
    ],
    "questions": [
      "领域对象依赖 Spring 注解会有什么设计取舍？",
      "事务应如何围绕一个业务用例定义边界？"
    ],
    "tags": [
      "Java",
      "Spring Boot",
      "Clean Architecture",
      "事务"
    ],
    "originalTitle": "Clean Architecture Java",
    "sourcePath": "src/content/guide/clean-architecture-java.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/clean-architecture-java.mdx",
    "references": [
      {
        "label": "Clean Architecture en la vida real JAVA",
        "url": "https://medium.com/@soyjuanmalopez/clean-architecture-en-la-vida-real-9da710e5ad4a"
      },
      {
        "label": "Clean Architecture with Spring Boot: A good idea?",
        "url": "https://medium.com/@viniciusromualdobusiness/clean-architecture-with-spring-boot-a-good-idea-d6f97e450130"
      }
    ]
  },
  {
    "id": "php-clean",
    "title": "PHP 整洁架构",
    "category": "architecture",
    "summary": "上游收录 PHP 与 Laravel 的整洁架构资料，可用于理解框架便利性和业务独立性之间的取舍。",
    "points": [
      "控制器转换请求并调用应用用例。",
      "业务规则通过领域模型或服务组织。",
      "数据库与框架模型通过适配层接入。",
      "明确返回数据与错误契约，降低跨层隐式依赖。"
    ],
    "questions": [
      "使用框架模型承载业务规则有哪些利弊？",
      "如何让一个用例在脱离 HTTP 环境后仍可调用？"
    ],
    "tags": [
      "PHP",
      "Laravel",
      "Clean Architecture",
      "后端"
    ],
    "originalTitle": "Clean Architecture PHP",
    "sourcePath": "src/content/guide/clean-architecture-php.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/clean-architecture-php.mdx",
    "references": [
      {
        "label": "Clean Architecture with PHP",
        "url": "https://medium.com/unil-ci-software-engineering/clean-architecture-with-php-22de915a6c50"
      },
      {
        "label": "Clean Architecture with Laravel",
        "url": "https://dev.to/bdelespierre/how-to-implement-clean-architecture-with-laravel-2f2i"
      }
    ]
  },
  {
    "id": "python-clean",
    "title": "Python 整洁架构",
    "category": "architecture",
    "summary": "上游汇总 Python、Django 与整洁架构资料，适合对照端口、用例和持久化适配器的组织方法。",
    "points": [
      "把业务用例与 Web 框架和 ORM 模型分开。",
      "使用协议或明确接口表达外部依赖。",
      "把输入验证、业务规则与数据转换放在合适边界。",
      "让用例测试能够使用内存实现代替外部设施。"
    ],
    "questions": [
      "Django ORM 模型与领域模型是否必须一一对应？",
      "用内存仓储测试业务时还需补充哪些集成验证？"
    ],
    "tags": [
      "Python",
      "Django",
      "端口",
      "Clean Architecture"
    ],
    "originalTitle": "Clean Architecture Python",
    "sourcePath": "src/content/guide/clean-architecture-python.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/clean-architecture-python.mdx",
    "references": [
      {
        "label": "Understanding clean architecture in Python — Deep dive on the code",
        "url": "https://medium.com/@surajit.das0320/understanding-clean-architecture-in-python-deep-dive-on-the-code-17141dc5761a"
      },
      {
        "label": "Python Clean Architecture",
        "url": "https://github.com/pcah/python-clean-architecture"
      },
      {
        "label": "Clean Architecture in Django",
        "url": "https://medium.com/21buttons-tech/clean-architecture-in-django-d326a4ab86a9"
      },
      {
        "label": "Django Clean Architecture",
        "url": "https://github.com/jacob-y/django-clean-architecture"
      }
    ]
  },
  {
    "id": "containers",
    "title": "容器与编排",
    "category": "devops",
    "summary": "上游提供容器和编排的学习入口，重点是应用打包、运行与多实例协调的基础概念。",
    "points": [
      "镜像定义应用运行环境，容器是它的运行实例。",
      "区分临时文件系统、挂载与持久化数据。",
      "编排系统组织部署、服务发现与实例伸缩。",
      "健康检查、资源限制与配置管理影响运行稳定性。"
    ],
    "questions": [
      "容器与虚拟机在隔离方式上有什么区别？",
      "无状态服务和数据库在容器部署上有哪些不同考虑？"
    ],
    "tags": [
      "容器",
      "Docker",
      "编排",
      "部署"
    ],
    "originalTitle": "Contenedores y Orquestacion",
    "sourcePath": "src/content/guide/contenedores-orquestacion.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/contenedores-orquestacion.mdx",
    "references": [
      {
        "label": "¿Qué son los contenedores?",
        "url": "https://www.hpe.com/mx/es/what-is/containers.html"
      },
      {
        "label": "¿Qué es un contenedor? by Microsoft",
        "url": "https://azure.microsoft.com/es-mx/resources/cloud-computing-dictionary/what-is-a-container"
      },
      {
        "label": "Contenedores y Orquestación (Recomendado)",
        "url": "https://medium.com/@villamorosjuan/contenedores-y-orquestación-transformando-la-gestión-de-aplicaciones-en-producción-0f2ebbd8aac5"
      }
    ]
  },
  {
    "id": "git",
    "title": "Git 与版本控制",
    "category": "devops",
    "summary": "上游整理 Git、GitHub、进阶命令与协作流程资源，帮助理解提交历史和团队协作。",
    "points": [
      "提交记录一组有意义的变更，便于追踪和回退。",
      "分支为独立开发提供边界，合并时需理解历史。",
      "区分工作区、暂存区与仓库中的状态。",
      "通过审阅和清楚的提交信息降低协作成本。"
    ],
    "questions": [
      "暂存区如何帮助组织一次清楚的提交？",
      "merge 与 rebase 对历史结构有什么不同影响？"
    ],
    "tags": [
      "Git",
      "版本控制",
      "提交",
      "分支"
    ],
    "originalTitle": "Control de Versiones",
    "sourcePath": "src/content/guide/control-de-versiones.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/control-de-versiones.mdx",
    "references": [
      {
        "label": "La guía para principiantes de Git y Github",
        "url": "https://www.freecodecamp.org/espanol/news/guia-para-principiantes-de-git-y-github/"
      },
      {
        "label": "Git Avanzado: Comandos Avanzados Además de los Básicos",
        "url": "https://kinsta.com/es/blog/git-avanzado/"
      },
      {
        "label": "Comparing Git workflows: What you should know",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows"
      },
      {
        "label": "Cinco Git Workflows para mejorar nuestros proyectos",
        "url": "https://www.babelgroup.com/es/Media/Blog/Abril-2021/Cinco-Git-Workflows-para-mejores-proyectos"
      },
      {
        "label": "Git feature branch workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow"
      },
      {
        "label": "Gitflow workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow"
      },
      {
        "label": "Forking workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow"
      }
    ]
  },
  {
    "id": "system-design",
    "title": "系统设计面试",
    "category": "system",
    "summary": "上游汇总系统设计问题、解答、入门指南和速查资料，适合训练需求分析与设计取舍的表达。",
    "points": [
      "先明确功能、规模、延迟和可靠性等要求。",
      "估算流量与数据量，再讨论架构组件和瓶颈。",
      "缓存、队列、复制与分片解决不同问题。",
      "在一致性、可用性、成本与复杂度之间解释取舍。",
      "设计应涵盖失败、恢复与监控，而不只画正常流程。"
    ],
    "questions": [
      "设计短链接系统时，首先需要问清哪些需求？",
      "缓存失效或队列积压会如何影响整个系统？"
    ],
    "tags": [
      "系统设计",
      "缓存",
      "队列",
      "扩展性",
      "可靠性"
    ],
    "originalTitle": "Diseno de sistemas",
    "sourcePath": "src/content/guide/diseno-de-sistemas.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/diseno-de-sistemas.mdx",
    "references": [
      {
        "label": "System Design Questions + Solutions DB",
        "url": "https://systemdesign.io"
      },
      {
        "label": "System-design-interview",
        "url": "https://github.com/checkcheckzz/system-design-interview"
      },
      {
        "label": "A Beginner’s Guide to System Design",
        "url": "https://medium.com/@sentalkssane/a-beginners-guide-to-system-design-76d64689788b"
      },
      {
        "label": "11 Most-Asked System Design Interview Questions (+ answers)",
        "url": "https://igotanoffer.com/blogs/tech/system-design-interviews"
      },
      {
        "label": "Top 50 System Design Interview Questions for 2025",
        "url": "https://dev.to/somadevtoo/top-50-system-design-interview-questions-for-2024-5dbk"
      },
      {
        "label": "System Design Interview Questions",
        "url": "https://www.interviewbit.com/system-design-interview-questions"
      },
      {
        "label": "System Design CheatSheet for Interview",
        "url": "https://medium.com/javarevisited/system-design-cheatsheet-4607e716db5a"
      }
    ]
  },
  {
    "id": "frontend-architecture",
    "title": "前端架构",
    "category": "architecture",
    "summary": "上游收录前端模块化、六边形架构、整洁架构与微前端资源，关注职责和模块边界。",
    "points": [
      "将页面、业务逻辑、数据访问与基础 UI 适度分离。",
      "通过稳定的数据契约降低界面与接口的耦合。",
      "模块边界宜对应业务能力与团队协作需求。",
      "微前端提供独立交付能力，也增加集成和运行成本。"
    ],
    "questions": [
      "哪些业务逻辑不应直接写在页面组件中？",
      "什么时候微前端带来的成本值得承担？"
    ],
    "tags": [
      "前端",
      "模块化",
      "微前端",
      "数据流"
    ],
    "originalTitle": "Frontend",
    "sourcePath": "src/content/guide/frontend.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/frontend.mdx",
    "references": [
      {
        "label": "Arquitectura Hexagonal en el FrontEnd",
        "url": "https://softwarecrafters.io/react/arquitectura-hexagonal-frontend"
      },
      {
        "label": "Arquitecturas frontend: \"Enfoque \"modular simple",
        "url": "https://codigoencasa.com/arquitecturas-frontend-enfoque-modular-simple/"
      },
      {
        "label": "A Comprehensive Guide to Modern Frontend Architecture Patterns",
        "url": "https://medium.com/@johnadjanohoun/a-comprehensive-guide-to-modern-frontend-architecture-patterns-eb39debbd503"
      },
      {
        "label": "Alejándonos de ReactJs y VueJs en frontend usando Clean Architecture",
        "url": "https://xurxodev.com/frontend-clean_architecture/"
      },
      {
        "label": "La Arquitectura Hexagonal: un enfoque para desarrollar aplicaciones robustas en React, Angular y Vue con ejemplos de código",
        "url": "https://dev.to/dennysjmarquez/la-arquitectura-hexagonal-un-enfoque-para-desarrollar-aplicaciones-robustas-en-react-angular-y-vue-con-ejemplos-de-codigo-l4l"
      },
      {
        "label": "A Definitive Guide to Front-end Clean Architecture",
        "url": "https://eduardo-ottaviani.medium.com/a-definitive-guide-to-front-end-clean-architecture-3a62418becb4"
      },
      {
        "label": "Introducción a la arquitectura de microfrontends con un ejemplo en React.",
        "url": "https://www.paradigmadigital.com/dev/introduccion-arquitectura-microfrontends-ejemplo-react/"
      },
      {
        "label": "MicroFrontEnd",
        "url": "https://devjaime.medium.com/microfrontend-4eecf1498cd1"
      },
      {
        "label": "A Comprehensive Guide to Micro Frontend Architecture",
        "url": "https://medium.com/appfoster/a-comprehensive-guide-to-micro-frontend-architecture-cc0e31e0c053"
      },
      {
        "label": "Microservices vs. Micro Frontends: What's the Difference?",
        "url": "https://dev.to/pavanbelagatti/microservices-vs-micro-frontends-whats-the-difference-33je"
      },
      {
        "label": "Clean Architecture With React",
        "url": "https://betterprogramming.pub/clean-architecture-with-react-cc097a08b105"
      },
      {
        "label": "Clean Architecture: Applying with React",
        "url": "https://dev.to/rubemfsv/clean-architecture-applying-with-react-40h6"
      },
      {
        "label": "React Clean Architecture",
        "url": "https://github.com/eduardomoroni/react-clean-architecture"
      },
      {
        "label": "Clean Architecture: Typescript and React",
        "url": "https://paulallies.medium.com/clean-architecture-typescript-and-react-8e509098abfe"
      },
      {
        "label": "Clean Architecture with VueJS",
        "url": "https://www.linkedin.com/pulse/clean-architecture-vuejs-ahsan-riaz/"
      },
      {
        "label": "Clean Architecture VueJS",
        "url": "https://github.com/thanhchungbtc/vue-shopping-clean-architecture"
      },
      {
        "label": "Vue Clean Architecture Github",
        "url": "https://github.com/smotastic/vue-clean-architecture"
      },
      {
        "label": "Separating business logic from UI frameworks (React, Vue, Svelte, Angular, etc.) using clean architecture pattern",
        "url": "https://github.com/shamscorner/bloc-vue-3-clean-pattern"
      }
    ]
  },
  {
    "id": "developer-ai",
    "title": "开发者 AI 资源",
    "category": "ai",
    "summary": "上游整理 AI 入门、开发工具与 MCP 资源，供了解模型能力和工具连接方式；没有提供站内 AI 助手。",
    "points": [
      "明确模型输入、输出与任务边界，建立可重复的评估。",
      "生成代码应经过阅读、测试与真实环境验证。",
      "MCP 用于连接模型应用和外部工具或资源。",
      "工具调用需结合权限、数据边界与失败处理设计。"
    ],
    "questions": [
      "如何判断 AI 生成的代码是否适合合入项目？",
      "模型能力与工具提供的能力应如何区分？"
    ],
    "tags": [
      "AI",
      "MCP",
      "工具调用",
      "开发工具"
    ],
    "originalTitle": "IA para desarrolladores",
    "sourcePath": "src/content/guide/ia-para-desarrolladores.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/ia-para-desarrolladores.mdx",
    "references": [
      {
        "label": "The Ultimate List of AI Concepts in AI for Absolute Beginners | And Let Me Know What You Want to Read About Next",
        "url": "https://medium.com/ai-for-absolute-beginners/the-ultimate-list-of-ai-concepts-in-ai-for-absolute-beginners-and-let-me-know-what-you-want-to-3edf24ce7c01"
      },
      {
        "label": "25 Essential AI Concepts Every AI Developer Must Master",
        "url": "https://dev.to/devscriptor/25-essential-ai-concepts-every-ai-developer-must-master-4ddn"
      },
      {
        "label": "Awesome AI-Powered Developer Tools",
        "url": "https://github.com/jamesmurdza/awesome-ai-devtools"
      },
      {
        "label": "Best AI tools for developers to use in your next coding project",
        "url": "https://pieces.medium.com/best-ai-tools-for-developers-to-use-in-your-next-coding-project-794fce6bfa42"
      },
      {
        "label": "What is MCP? A Beginner’s Guide to Smarter AI",
        "url": "https://medium.com/h7w/what-is-mcp-a-beginners-guide-to-smarter-ai-bdd996f8b02e"
      },
      {
        "label": "Understanding Model Context Protocol (MCP): A Beginner’s Guide",
        "url": "https://medium.com/@sailakkshmiallada/understanding-model-context-protocol-mcp-a-beginners-guide-70060304742d"
      },
      {
        "label": "MCP Introduction",
        "url": "https://modelcontextprotocol.io/introduction"
      },
      {
        "label": "MCP for beginners by Microsoft",
        "url": "https://github.com/microsoft/mcp-for-beginners"
      }
    ]
  },
  {
    "id": "orm",
    "title": "ORM 与数据访问",
    "category": "data",
    "summary": "上游提供 ORM 概念、Mongoose 与 Sequelize 入门资源，帮助理解对象接口背后的数据库操作。",
    "points": [
      "ORM 在对象模型与持久化数据之间建立映射。",
      "模型关联可能触发额外查询，应检查实际执行行为。",
      "迁移、事务与约束仍需要数据库层面的理解。",
      "便利抽象不应遮蔽复杂查询、索引和一致性问题。"
    ],
    "questions": [
      "为什么使用 ORM 后仍需要阅读 SQL 或查询计划？",
      "懒加载如何造成 N+1 查询？"
    ],
    "tags": [
      "ORM",
      "Mongoose",
      "Sequelize",
      "查询"
    ],
    "originalTitle": "ORMs",
    "sourcePath": "src/content/guide/orms.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/orms.mdx",
    "references": [
      {
        "label": "¿Qué es un ORM?",
        "url": "https://wildpasco.medium.com/qué-es-un-orm-backend-bee59674e1d0"
      },
      {
        "label": "Introducción a Mongoose para MongoDB",
        "url": "https://www.freecodecamp.org/espanol/news/introduccion-a-mongoose-para-mongodb/"
      },
      {
        "label": "The Ultimate Guide To Get Started With Sequelize ORM",
        "url": "https://levelup.gitconnected.com/the-ultimate-guide-to-get-started-with-sequelize-orm-238588d3516e"
      }
    ]
  },
  {
    "id": "design-patterns",
    "title": "设计模式",
    "category": "engineering",
    "summary": "上游链接 Refactoring.Guru 与 Patterns.dev，并列出创建型、结构型和行为型模式供复习。",
    "points": [
      "创建型模式组织对象创建与实现选择。",
      "结构型模式处理对象组合、适配与接口关系。",
      "行为型模式安排协作、状态变化与职责传递。",
      "先识别实际问题，再判断是否需要某种模式。"
    ],
    "questions": [
      "策略模式与条件分支各自适合什么场景？",
      "适配器与装饰器在目的上有什么区别？"
    ],
    "tags": [
      "设计模式",
      "创建型",
      "结构型",
      "行为型"
    ],
    "originalTitle": "Patrones de diseno",
    "sourcePath": "src/content/guide/patrones-de-diseno.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/patrones-de-diseno.mdx",
    "references": [
      {
        "label": "Patrones de diseño Español (Recomendación personal)",
        "url": "https://refactoring.guru/es/design-patterns"
      },
      {
        "label": "Patrones de diseño en Javascript",
        "url": "https://www.patterns.dev/posts"
      }
    ]
  },
  {
    "id": "backend-interview",
    "title": "后端面试复习",
    "category": "interview",
    "summary": "上游收录后端面试问答资源，可据此整理 API、数据、并发与可靠性等复习方向。",
    "points": [
      "解释 API 契约、错误处理与兼容性。",
      "结合事务、索引与数据模型讨论数据库问题。",
      "区分线程、进程与异步任务的执行方式。",
      "用具体案例说明缓存、一致性和失败恢复取舍。"
    ],
    "questions": [
      "如何让重试请求避免重复扣款或重复写入？",
      "接口变慢时，会按什么顺序定位瓶颈？"
    ],
    "tags": [
      "后端面试",
      "API",
      "并发",
      "可靠性"
    ],
    "originalTitle": "Preguntas de Backend",
    "sourcePath": "src/content/guide/preguntas-backend.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-backend.mdx",
    "references": [
      {
        "label": "Top 100 back-end developer interview questions and answers 2023",
        "url": "https://www.turing.com/interview-questions/back-end"
      },
      {
        "label": "Top 18 backend developer interview questions answered",
        "url": "https://anywhere.epam.com/en/blog/top-18-backend-developer-interview-questions-answered"
      },
      {
        "label": "Backend SWE interview questions",
        "url": "https://github.com/tamhoang1412/backend-swe-interview-questions"
      }
    ]
  },
  {
    "id": "interview-index",
    "title": "面试资源总索引",
    "category": "interview",
    "summary": "上游按语言、框架、数据库以及前后端整理常见面试问答资源，适合作为个人复习清单入口。",
    "points": [
      "按目标岗位选择语言、框架和工程知识范围。",
      "用自己的话回答概念，再补上例子与边界条件。",
      "区分记忆性问题、代码题与设计题的准备方法。",
      "为每个知识点记录薄弱环节和后续阅读链接。"
    ],
    "questions": [
      "如何从岗位要求确定复习的优先级？",
      "能复述定义与能解释实际取舍之间还差什么？"
    ],
    "tags": [
      "面试",
      "复习清单",
      "资源索引",
      "学习方法"
    ],
    "originalTitle": "Preguntas frecuentes",
    "sourcePath": "src/content/guide/preguntas-frecuentes.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frecuentes.mdx",
    "references": [
      {
        "label": "Kill Your Tech Interview (recomendado)",
        "url": "https://www.fullstack.cafe"
      },
      {
        "label": "Angular Interview questions",
        "url": "https://github.com/sudheerj/angular-interview-questions"
      },
      {
        "label": "Django Interview questions",
        "url": "https://github.com/Ujjawal-Anand/django-interview"
      },
      {
        "label": "Java Interview questions",
        "url": "https://github.com/Devinterview-io/java-interview-questions"
      },
      {
        "label": "Java Spring Interview questions",
        "url": "https://github.com/altafjava/spring-interview-questions-answers"
      },
      {
        "label": "Javascript Interview questions",
        "url": "https://github.com/sudheerj/javascript-interview-questions"
      },
      {
        "label": "PHP Interview questions",
        "url": "https://github.com/Devinterview-io/php-interview-questions"
      },
      {
        "label": "Python Interview questions",
        "url": "https://github.com/Devinterview-io/python-interview-questions"
      },
      {
        "label": "React Interview questions",
        "url": "https://github.com/sudheerj/reactjs-interview-questions"
      },
      {
        "label": "SQL Interview questions",
        "url": "https://github.com/kansiris/SQL-interview-questions/tree/master"
      },
      {
        "label": "Cracking the SQL interview",
        "url": "https://github.com/xoraus/CrackingTheSQLInterview"
      },
      {
        "label": "Vue Interview questions",
        "url": "https://github.com/sudheerj/vuejs-interview-questions"
      },
      {
        "label": "TypeScript Interview questions",
        "url": "https://github.com/sudheerj/typescript-interview-questions"
      },
      {
        "label": "Go Interview questions",
        "url": "https://github.com/Devinterview-io/go-interview-questions"
      },
      {
        "label": "C# / .NET Interview questions",
        "url": "https://github.com/Devinterview-io/csharp-interview-questions"
      },
      {
        "label": "Ruby Interview questions",
        "url": "https://github.com/Devinterview-io/ruby-interview-questions"
      },
      {
        "label": "Rust Interview questions",
        "url": "https://github.com/Devinterview-io/rust-interview-questions"
      },
      {
        "label": "Kotlin Interview questions",
        "url": "https://github.com/Devinterview-io/kotlin-interview-questions"
      },
      {
        "label": "Swift Interview questions",
        "url": "https://github.com/Devinterview-io/swift-interview-questions"
      },
      {
        "label": "Next.js Interview questions",
        "url": "https://github.com/sudheerj/nextjs-interview-questions"
      },
      {
        "label": "Nuxt.js Interview questions",
        "url": "https://github.com/sudheerj/nuxt-interview-questions"
      },
      {
        "label": "Svelte Interview questions",
        "url": "https://github.com/sudheerj/svelte-interview-questions"
      },
      {
        "label": "NestJS Interview questions",
        "url": "https://github.com/sudheerj/nestjs-interview-questions"
      },
      {
        "label": "Laravel Interview questions",
        "url": "https://github.com/Devinterview-io/laravel-interview-questions"
      },
      {
        "label": "Spring Boot Interview questions",
        "url": "https://github.com/Devinterview-io/spring-boot-interview-questions"
      },
      {
        "label": "ASP.NET Core Interview questions",
        "url": "https://github.com/Devinterview-io/asp-net-core-interview-questions"
      },
      {
        "label": "FastAPI Interview questions",
        "url": "https://github.com/Devinterview-io/fastapi-interview-questions"
      },
      {
        "label": "Flask Interview questions",
        "url": "https://github.com/Devinterview-io/flask-interview-questions"
      },
      {
        "label": "Node.js Interview questions",
        "url": "https://github.com/sudheerj/nodejs-interview-questions"
      },
      {
        "label": "Top 100 back-end developer interview questions and answers 2023",
        "url": "https://www.turing.com/interview-questions/back-end"
      },
      {
        "label": "Top 18 backend developer interview questions answered",
        "url": "https://anywhere.epam.com/en/blog/top-18-backend-developer-interview-questions-answered"
      },
      {
        "label": "Backend SWE interview questions",
        "url": "https://github.com/tamhoang1412/backend-swe-interview-questions"
      },
      {
        "label": "Front End Interview Handbook",
        "url": "https://www.frontendinterviewhandbook.com/introduction/"
      },
      {
        "label": "52 Frontend Interview Questions - JavaScript",
        "url": "https://dev.to/m_midas/52-frontend-interview-questions-javascript-59h6"
      },
      {
        "label": "Front-end Developer Interview Questions",
        "url": "https://github.com/h5bp/Front-end-Developer-Interview-Questions?tab=readme-ov-file"
      },
      {
        "label": "11 senior front end developer interview questions and answers",
        "url": "https://anywhere.epam.com/en/blog/senior-front-end-developer-interview-questions"
      },
      {
        "label": "15 Frontend Developer Interview Questions (2023)",
        "url": "https://4dayweek.medium.com/15-frontend-developer-interview-questions-2023-91c7a9a628c1"
      }
    ]
  },
  {
    "id": "javascript-interview",
    "title": "JavaScript 面试专题",
    "category": "interview",
    "summary": "上游把三个 JavaScript 问题连接到独立讲解页，覆盖对象创建、原型链与 call、apply、bind，并提供延伸资源。",
    "points": [
      "比较对象字面量、构造函数、类与工厂函数。",
      "理解属性查找如何沿原型链进行。",
      "掌握 this 绑定与函数调用方式的关系。",
      "用简短代码预测输出，再解释语言机制。"
    ],
    "questions": [
      "为什么不同对象创建方式会影响原型和方法共享？",
      "如何用一段代码同时说明原型链和 this？"
    ],
    "tags": [
      "JavaScript",
      "面试",
      "对象",
      "this"
    ],
    "originalTitle": "Preguntas frecuentes de JavaScript",
    "sourcePath": "src/content/guide/preguntas-frecuentes/javascript.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frecuentes/javascript.mdx",
    "references": [
      {
        "label": "Javascript Interview questions (sudheerj)",
        "url": "https://github.com/sudheerj/javascript-interview-questions"
      },
      {
        "label": "MDN — JavaScript Guide",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
      }
    ]
  },
  {
    "id": "prototype-chain",
    "title": "JavaScript 原型链",
    "category": "interview",
    "summary": "上游有属性查找的详细说明和代码示例，比较 prototype 与 __proto__，并解释原型链为何以 null 结束。",
    "points": [
      "先查找对象自身属性，再沿 [[Prototype]] 逐层查找。",
      "构造函数的 prototype 与实例内部原型关联不同。",
      "链条终点通常是 null，未找到的普通属性读取返回 undefined。",
      "同名自身属性会遮蔽原型属性，删除后可能露出继承值。"
    ],
    "questions": [
      "prototype 与 Object.getPrototypeOf(obj) 表达的是什么？",
      "删除对象自身属性后，为什么可能仍能读到同名属性？"
    ],
    "tags": [
      "JavaScript",
      "原型链",
      "继承",
      "属性查找"
    ],
    "originalTitle": "¿Qué es la cadena de prototipos en JavaScript?",
    "sourcePath": "src/content/guide/preguntas-frecuentes/javascript/cadena-de-prototipos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frecuentes/javascript/cadena-de-prototipos.mdx",
    "references": [
      {
        "label": "MDN — Inheritance and the prototype chain",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain"
      },
      {
        "label": "MDN — Object.getPrototypeOf",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf"
      }
    ]
  },
  {
    "id": "call-apply-bind",
    "title": "call / apply / bind",
    "category": "interview",
    "summary": "上游通过比较表、同一示例及方法借用和事件处理案例，说明三个方法控制 this 与参数的方式。",
    "points": [
      "call 立即调用函数，参数按逗号分隔传入。",
      "apply 立即调用函数，参数以一个数组或类数组提供。",
      "bind 返回新函数，固定 this 并可预置部分参数。",
      "调用时间与参数组织方式是三者的核心差别。"
    ],
    "questions": [
      "为什么 bind 的结果仍需要再调用一次？",
      "事件处理函数为什么常需要显式绑定 this？"
    ],
    "tags": [
      "JavaScript",
      "this",
      "函数调用",
      "bind"
    ],
    "originalTitle": "Diferencias entre call, apply y bind",
    "sourcePath": "src/content/guide/preguntas-frecuentes/javascript/call-apply-bind.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frecuentes/javascript/call-apply-bind.mdx",
    "references": [
      {
        "label": "MDN — Function.prototype.call",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call"
      },
      {
        "label": "MDN — Function.prototype.apply",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply"
      },
      {
        "label": "MDN — Function.prototype.bind",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind"
      }
    ]
  },
  {
    "id": "object-creation",
    "title": "JavaScript 对象创建",
    "category": "interview",
    "summary": "上游讲解七种对象创建方式：字面量、Object 构造、构造函数、Object.create、类、工厂函数和 IIFE 单例。",
    "points": [
      "字面量和 Object 构造适合直接创建普通对象。",
      "构造函数和 class 可通过原型共享方法。",
      "Object.create 明确指定新对象的原型。",
      "工厂函数返回对象，单例模式限制共享实例的数量。",
      "选择方式时比较初始化、方法共享、封装与继承需求。"
    ],
    "questions": [
      "Object.create(null) 创建的对象有什么特别之处？",
      "工厂函数与构造函数在调用和原型行为上有何区别？"
    ],
    "tags": [
      "JavaScript",
      "对象",
      "class",
      "工厂函数"
    ],
    "originalTitle": "¿Cuáles son las formas posibles de crear objetos en JavaScript?",
    "sourcePath": "src/content/guide/preguntas-frecuentes/javascript/crear-objetos.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frecuentes/javascript/crear-objetos.mdx",
    "references": [
      {
        "label": "MDN — Working with objects",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects"
      },
      {
        "label": "MDN — Object.create()",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create"
      },
      {
        "label": "MDN — Classes",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"
      }
    ]
  },
  {
    "id": "frontend-interview",
    "title": "前端面试复习",
    "category": "interview",
    "summary": "上游收录前端面试手册与问答资源，适合围绕浏览器、JavaScript、页面体验与组件设计组织复习。",
    "points": [
      "理解 HTML 语义、CSS 布局与浏览器渲染。",
      "能解释 JavaScript 异步、事件循环与状态变化。",
      "考虑性能、可访问性以及不同设备的使用体验。",
      "结合真实项目说明组件设计与工程协作取舍。"
    ],
    "questions": [
      "用户点击后界面迟迟不响应，可能涉及哪些环节？",
      "怎样验证一个交互组件是否支持键盘操作？"
    ],
    "tags": [
      "前端面试",
      "浏览器",
      "性能",
      "可访问性"
    ],
    "originalTitle": "Preguntas de Frontend",
    "sourcePath": "src/content/guide/preguntas-frontend.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/preguntas-frontend.mdx",
    "references": [
      {
        "label": "Front End Interview Handbook",
        "url": "https://www.frontendinterviewhandbook.com/introduction/"
      },
      {
        "label": "52 Frontend Interview Questions - JavaScript",
        "url": "https://dev.to/m_midas/52-frontend-interview-questions-javascript-59h6"
      },
      {
        "label": "Front-end Developer Interview Questions",
        "url": "https://github.com/h5bp/Front-end-Developer-Interview-Questions?tab=readme-ov-file"
      },
      {
        "label": "11 senior front end developer interview questions and answers",
        "url": "https://anywhere.epam.com/en/blog/senior-front-end-developer-interview-questions"
      },
      {
        "label": "15 Frontend Developer Interview Questions (2023)",
        "url": "https://4dayweek.medium.com/15-frontend-developer-interview-questions-2023-91c7a9a628c1"
      }
    ]
  },
  {
    "id": "react-clean",
    "title": "React 整洁架构",
    "category": "architecture",
    "summary": "上游整理 React 整洁架构资料，可用于研究如何让业务用例和数据访问从 UI 中独立出来。",
    "points": [
      "React 组件承担展示与用户交互的适配职责。",
      "业务用例与数据访问通过清楚的接口协作。",
      "Hook 可以组织 UI 相关逻辑，但不等同于领域层。",
      "在结构收益与额外抽象成本之间做适度取舍。"
    ],
    "questions": [
      "业务规则抽离后，组件还应承担哪些职责？",
      "怎样测试一个不依赖 React 的业务用例？"
    ],
    "tags": [
      "React",
      "Clean Architecture",
      "用例",
      "前端"
    ],
    "originalTitle": "React Clean Architecture",
    "sourcePath": "src/content/guide/react-clean-architecture.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/react-clean-architecture.mdx",
    "references": [
      {
        "label": "Clean Architecture With React",
        "url": "https://betterprogramming.pub/clean-architecture-with-react-cc097a08b105"
      },
      {
        "label": "Clean Architecture: Applying with React",
        "url": "https://dev.to/rubemfsv/clean-architecture-applying-with-react-40h6"
      },
      {
        "label": "React Clean Architecture",
        "url": "https://github.com/eduardomoroni/react-clean-architecture"
      },
      {
        "label": "Clean Architecture: Typescript and React",
        "url": "https://paulallies.medium.com/clean-architecture-typescript-and-react-8e509098abfe"
      }
    ]
  },
  {
    "id": "vue-clean",
    "title": "Vue 整洁架构",
    "category": "architecture",
    "summary": "上游汇总 Vue 整洁架构资料，帮助思考响应式界面、应用用例和技术适配之间的边界。",
    "points": [
      "Vue 组件与 composable 承担界面状态和交互组织。",
      "业务规则避免依赖特定 UI API。",
      "把 HTTP 与持久化实现放在适配器边界。",
      "清楚的数据模型减少跨层隐式转换。"
    ],
    "questions": [
      "哪些 composable 逻辑属于界面，哪些属于业务？",
      "更换后端 API 时，哪些模块应该发生变化？"
    ],
    "tags": [
      "Vue",
      "Clean Architecture",
      "composable",
      "前端"
    ],
    "originalTitle": "Vue JS Clean Architecture",
    "sourcePath": "src/content/guide/vue-js-clean-architecture.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/vue-js-clean-architecture.mdx",
    "references": [
      {
        "label": "Clean Architecture with VueJS",
        "url": "https://www.linkedin.com/pulse/clean-architecture-vuejs-ahsan-riaz/"
      },
      {
        "label": "Clean Architecture VueJS",
        "url": "https://github.com/thanhchungbtc/vue-shopping-clean-architecture"
      },
      {
        "label": "Vue Clean Architecture Github",
        "url": "https://github.com/smotastic/vue-clean-architecture"
      },
      {
        "label": "Separating business logic from UI frameworks (React, Vue, Svelte, Angular, etc.) using clean architecture pattern",
        "url": "https://github.com/shamscorner/bloc-vue-3-clean-pattern"
      }
    ]
  },
  {
    "id": "git-workflows",
    "title": "Git 协作流程",
    "category": "devops",
    "summary": "上游收集 Git 工作流与 feature branch 资源，供比较团队如何组织分支、审阅和发布。",
    "points": [
      "选择流程时考虑团队规模、发布频率与协作方式。",
      "功能分支提供任务边界，但长期分叉增加整合成本。",
      "代码审阅与自动检查支撑合并决策。",
      "提交粒度与发布策略应保持一致、可追踪。"
    ],
    "questions": [
      "功能分支持续数周会带来哪些风险？",
      "如何为小团队选择足够简单的 Git 工作流？"
    ],
    "tags": [
      "Git",
      "工作流",
      "代码审阅",
      "协作"
    ],
    "originalTitle": "Workflows",
    "sourcePath": "src/content/guide/workflows.mdx",
    "sourceUrl": "https://github.com/DevCaress/guia-entrevistas-de-programacion/blob/fb5f7aff49baf60a0f6c42b0524ecaf3ee95b3ed/src/content/guide/workflows.mdx",
    "references": [
      {
        "label": "Cinco Git Workflows para mejorar nuestros proyectos",
        "url": "https://www.babelgroup.com/es/Media/Blog/Abril-2021/Cinco-Git-Workflows-para-mejores-proyectos"
      },
      {
        "label": "Git feature branch workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow"
      },
      {
        "label": "Gitflow workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow"
      },
      {
        "label": "Forking workflow",
        "url": "https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow"
      }
    ]
  }
];

export const learningPaths = [
  {
    "id": "foundations",
    "title": "通用基础路线",
    "description": "先建立代码与算法基础，再连接数据、协作和面试表达。",
    "steps": [
      {
        "title": "写出清楚的代码",
        "description": "从整洁代码与简单设计入手，用原则解释一个实际重构。",
        "topicIds": [
          "clean-code",
          "kiss",
          "dry",
          "yagni",
          "solid",
          "grasp",
          "law-of-demeter"
        ]
      },
      {
        "title": "建立解题基础",
        "description": "学习复杂度与数据结构，阅读算法实现后进行独立练习。",
        "topicIds": [
          "complexity",
          "data-structures",
          "algorithms",
          "visualgo",
          "practice"
        ]
      },
      {
        "title": "连接工程知识",
        "description": "理解数据访问、版本历史与自动验证如何支持可靠交付。",
        "topicIds": [
          "databases",
          "orm",
          "git",
          "git-workflows",
          "cicd"
        ]
      },
      {
        "title": "准备面试表达",
        "description": "按岗位筛选复习资源，并用需求和取舍组织系统设计回答。",
        "topicIds": [
          "interview-index",
          "software-architecture",
          "system-design"
        ]
      }
    ]
  },
  {
    "id": "frontend",
    "title": "前端准备路线",
    "description": "以 JavaScript 为主线，选择 React、Vue 或 Angular，再复习前端架构和面试问题。",
    "steps": [
      {
        "title": "掌握语言机制",
        "description": "把对象创建、原型和 this 讲清楚，再补充类型系统。",
        "topicIds": [
          "javascript",
          "object-creation",
          "prototype-chain",
          "call-apply-bind",
          "typescript"
        ]
      },
      {
        "title": "选择组件框架",
        "description": "按目标岗位选择框架，结合小项目理解状态与组件边界。",
        "topicIds": [
          "react",
          "vue",
          "angular"
        ]
      },
      {
        "title": "组织应用结构",
        "description": "用整洁架构和模块化观点检查自己的前端项目。",
        "topicIds": [
          "clean-architecture",
          "frontend-architecture",
          "react-clean",
          "vue-clean"
        ]
      },
      {
        "title": "练习与问答",
        "description": "补充算法练习，并围绕浏览器、性能与可访问性准备实例。",
        "topicIds": [
          "practice",
          "javascript-interview",
          "frontend-interview",
          "interview-index"
        ]
      }
    ]
  },
  {
    "id": "backend",
    "title": "后端准备路线",
    "description": "选择服务端技术栈，串联业务分层、数据一致性、交付流程和系统设计。",
    "steps": [
      {
        "title": "选择后端技术栈",
        "description": "按岗位选择 Java、Python、PHP 或 Node.js，并学习对应框架实践。",
        "topicIds": [
          "java",
          "python",
          "php",
          "javascript",
          "django",
          "cpp"
        ]
      },
      {
        "title": "设计业务与数据边界",
        "description": "理解分层和依赖规则，再对照所选技术栈阅读整洁架构资源。",
        "topicIds": [
          "backend-architecture",
          "clean-architecture",
          "express-clean",
          "java-clean",
          "php-clean",
          "python-clean",
          "databases",
          "orm"
        ]
      },
      {
        "title": "关注可靠交付",
        "description": "将代码协作、流水线和容器基础连接到具体服务的运行流程。",
        "topicIds": [
          "git",
          "git-workflows",
          "cicd",
          "containers"
        ]
      },
      {
        "title": "解释系统取舍",
        "description": "从需求和规模出发设计系统，再复习后端问答与算法。",
        "topicIds": [
          "system-design",
          "backend-interview",
          "interview-index",
          "complexity",
          "practice"
        ]
      }
    ]
  }
];
