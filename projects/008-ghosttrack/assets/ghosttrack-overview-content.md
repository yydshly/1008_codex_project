# GhostTrack 总览图：文字核对与来源

图解依据：上游固定提交 `a5cb8ad4c08acd803f166fb067b7dac724d6cb3d`，研究日期 2026-10-09。下方开发架构与推进建议属于本项目的独立分析，不是上游已有功能。

## 核心关系

GhostTrack 是 Python 命令行集成工具。自己主要实现菜单、输入处理、函数调度、请求与库调用、结果打印；能力来自外部在线服务、开源号码规则库和公开网页。四项查询独立，不能自动把手机号、IP、账号关联成真人身份。

## 能力、原理和边界

| 能力 | 调用 | 底层原理 | 输出 | 边界 |
| --- | --- | --- | --- | --- |
| IP 归属 | IP_Track() 请求 ipwho.is，解析 JSON | IP 地理信息数据库关联 IP/网段、地区和网络组织；服务商维护数据，其完整内部实现未随本仓库提供 | 地区、近似经纬度、网络组织、运营商、时区 | 不是 GPS；代理、VPN、共享出口影响解释；不确认住址或人所在位置 |
| 自己的公网 IP | showIP() 请求 api.ipify.org，接收文本 | 服务端回显可见连接来源；NAT/代理改变外部可见地址，多设备可以共享出口 | 本次请求的公网出口 IP | 非设备唯一身份；后端代请求通常得到服务器出口；不自带地理位置 |
| 电话号码信息 | phoneGW() 调用 phonenumbers | 国家电话编号计划、长度与号码模式规则、前缀元数据匹配 | 国家/地区描述、类型、原始运营商（可用时）、可能的时区、格式与规则校验 | 归属不代表当前位置；Valid 不证明已启用；携号转网影响运营商含义；无机主实名 |
| 同名账号线索 | TrackLu() 拼接 URL，GET 后检查 HTTP 200 | 平台 URL 命名规则与 HTTP 响应；可靠检测需要页面和跳转判定 | 预设平台上的候选账号链接 | 200 可能是登录页或提示页；同名不证明同一人；不是全网搜索 |

## 对后续开发的意义（独立建议）

- 能力判断：先问数据来源与结果可证明的范围，避免把归属查询当实时追踪。
- 学习价值：掌握 HTTP/JSON、API 集成、编号规则、前缀匹配、状态码与页面判定等可组合模块。
- 可实现的用途：网络出口与日志背景查询、电话号码格式和基础校验、自身公开用户名页面检查。
- 工程价值：基础版难点在整合；可靠版难点在数据质量、平台规则、错误处理和准确解释。
- 结果可信度：保存来源、查询时间和验证状态，将“候选”“未知”“失败”单独表达。
- 复用：分别核实代码、数据和接口的授权条件，使用现成库和接口独立实现。

一种可行架构：浏览器界面 → 自己的后端 → 独立查询适配器 → 在线 API / 本地号码库 / 公开网页 → 统一结构化结果、来源、时间和说明。

公网 IP 查询须明确访客还是服务器：浏览器直接请求 ipify 可查浏览器的出口，后端请求通常查到服务器出口。网页脚本跨站读取受 CORS 限制，因此账号页面检测通常放在后端；后端仍需处理平台响应限制与失败状态。

建议顺序：四个模块独立实现 → 整合网页与统一结果 → 改善稳定性和判定准确性。需要补齐超时、HTTPS、失败处理、限流与缓存、平台检测规则、号码解析地区；保留经纬度小数、检查接口成功状态、使用完整国家码、避免仅凭 200 判断账号。

## 开放性

GhostTrack 固定提交中未发现标准许可证；源码公开不意味着获得任意复制、再发布或商用授权。phonenumbers 使用 Apache 2.0，ipify 官方提供开源实现；ipwho.is 的完整数据库与服务实现未随 GhostTrack 提供。

## 证据与验证范围

- [固定版本源码](https://github.com/HunxByts/GhostTrack/blob/a5cb8ad4c08acd803f166fb067b7dac724d6cb3d/GhostTR.py)
- [IPWHOIS.IO 数据库与接口文档](https://ipwhois.io/documentation)
- [ipify 接口与实现](https://www.ipify.org/)
- [phonenumbers 元数据说明](https://github.com/daviddrysdale/python-phonenumbers)
- [Google libphonenumber FAQ](https://github.com/google/libphonenumber/blob/master/FAQ.md)
- [RFC 3022：NAT / NAPT](https://datatracker.ietf.org/doc/html/rfc3022)
- [MDN：浏览器 CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [GitHub：源码公开与许可证](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

本次为源码、官方文档审阅与图解整理，未运行上游真实查询，未逐个平台实测。图为技术示意，不是实际查询结果截图。
