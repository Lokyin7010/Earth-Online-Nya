# Daily 5D Demo

最小可运行的日常五维 demo，面向 Vercel 部署。

当前版本已经具备：

- 预制账号登录
- 禁止注册
- 事件驱动的五维结算
- 本地 `localStorage` 存储
- 管理员直接校准五维
- 管理员校准日志
- 手机与网页共用一套响应式界面

## Run

```bash
npm install
npm run dev
```

生产构建验证：

```bash
npm run build
```

## 预制账号

### 管理员

| role | username | password | displayName |
|---|---|---|---|
| `admin` | `akari-admin` | `moonriver-demo` | 明里 |

### 测试用户

| role | username | password | displayName | title |
|---|---|---|---|---|
| `tester` | `rin` | `yoruwork` | 凛 | 久坐系上班族 |
| `tester` | `yui` | `slowhealing` | 结衣 | 恢复期用户 |
| `tester` | `wuneichihai` | `buxiangshangban` | 内内 | 高压波动型 |

## 主要文件

- [app/page.tsx](C:/Users/Administrator/Desktop/daily-5d-demo/app/page.tsx)
  页面入口

- [components/demo-app.tsx](C:/Users/Administrator/Desktop/daily-5d-demo/components/demo-app.tsx)
  登录、主界面、事件表单、日志、管理员校准

- [lib/game.ts](C:/Users/Administrator/Desktop/daily-5d-demo/lib/game.ts)
  五维计算、联动规则、日志结构、初始数据

- [event-config.ts](C:/Users/Administrator/Desktop/daily-5d-demo/event-config.ts)
  事件配置唯一数据源

- [demo-users.ts](C:/Users/Administrator/Desktop/daily-5d-demo/demo-users.ts)
  预制账号、角色、基础用户画像

- [app/globals.css](C:/Users/Administrator/Desktop/daily-5d-demo/app/globals.css)
  日系 RPG 风格界面样式

## 规则文档

- [SPEC.md](C:/Users/Administrator/Desktop/daily-5d-demo/SPEC.md)
  五维定义、计算方式、交互方式、UI 方向

- [EVENTS.md](C:/Users/Administrator/Desktop/daily-5d-demo/EVENTS.md)
  完整事件总表

- [DEMO_SCOPE.md](C:/Users/Administrator/Desktop/daily-5d-demo/DEMO_SCOPE.md)
  demo 最小范围、页面边界、数据结构

- [ADMIN_CALIBRATION.md](C:/Users/Administrator/Desktop/daily-5d-demo/ADMIN_CALIBRATION.md)
  管理员校准规则与日志字段

## 你以后主要改哪里

改账号密码：

- [demo-users.ts](C:/Users/Administrator/Desktop/daily-5d-demo/demo-users.ts)

改事件和数值：

- [event-config.ts](C:/Users/Administrator/Desktop/daily-5d-demo/event-config.ts)

改规则说明：

- [SPEC.md](C:/Users/Administrator/Desktop/daily-5d-demo/SPEC.md)
- [DEMO_SCOPE.md](C:/Users/Administrator/Desktop/daily-5d-demo/DEMO_SCOPE.md)
- [ADMIN_CALIBRATION.md](C:/Users/Administrator/Desktop/daily-5d-demo/ADMIN_CALIBRATION.md)

## 下一步

- 补 7 日趋势图
- 微调结算文案
- 补更细的管理员工具
- 再决定是否接数据库和正式登录系统
