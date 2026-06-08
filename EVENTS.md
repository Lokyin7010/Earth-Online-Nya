# 事件总表

源码主文件：[event-config.ts](C:/Users/Administrator/Desktop/daily-5d-demo/event-config.ts)

建议把 `event-config.ts` 作为唯一数据源。
原因很直接：

- 前端可以直接读取，不需要再手动同步一份数据
- 你以后改事件名称、数值、分档时，只改这一处
- 后面如果要接 `localStorage`、趋势图、结算日志，代码里引用会更稳定

这份文档主要用来快速审阅和策划调整。

## 五维字段

- `hp`: 健康值
- `ep`: 精力值
- `mood`: 心情值
- `stress`: 压力值
- `focus`: 专注值

## 初始资料表

### 年龄段

| id | 文案 | HP Max 修正 |
|---|---|---:|
| `18-24` | 18-24 | +8 |
| `25-34` | 25-34 | +4 |
| `35-44` | 35-44 | 0 |
| `45-54` | 45-54 | -6 |
| `55+` | 55+ | -12 |

### 身体机能

| id | 文案 | HP Max 修正 |
|---|---|---:|
| `excellent` | 很好 | +12 |
| `normal` | 正常 | 0 |
| `weak` | 较弱 | -10 |

### 基础作息

| id | 文案 | HP Max 修正 |
|---|---|---:|
| `stable` | 稳定早睡 | +8 |
| `normal` | 一般 | 0 |
| `night-owl` | 长期晚睡 | -8 |

### 伤病状态

| id | 文案 | HP Max 修正 |
|---|---|---:|
| `none` | 无伤病 | 0 |
| `light` | 轻伤 | -8 |
| `medium` | 中度伤病 | -18 |
| `heavy` | 重度伤病 | -30 |

### 生病状态

| id | 文案 | HP Max 修正 |
|---|---|---:|
| `none` | 无生病 | 0 |
| `light` | 轻微不适 | -6 |
| `flu` | 感冒/发炎 | -12 |
| `serious` | 严重生病 | -22 |

## 每日事件表

### 睡眠 `sleep`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `sleep-poor` | 不足 | -4 | -14 | -5 | +7 | -10 |
| `sleep-normal` | 普通 | 0 | 0 | 0 | 0 | 0 |
| `sleep-good` | 充足 | +4 | +14 | +4 | -6 | +8 |

### 久坐 `sitting`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `sit-low` | <4h | 0 | 0 | 0 | 0 | 0 |
| `sit-mid` | 4-8h | -2 | -6 | -2 | +4 | -5 |
| `sit-high` | 8h+ | -4 | -10 | -4 | +8 | -8 |

### 盯屏 `screen`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `screen-low` | <4h | 0 | 0 | 0 | 0 | 0 |
| `screen-mid` | 4-8h | -1 | -5 | -2 | +3 | -6 |
| `screen-high` | 8h+ | -3 | -9 | -4 | +6 | -10 |

### 工作负荷 `workload`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `work-light` | 轻松 | 0 | -2 | +1 | -1 | +1 |
| `work-normal` | 普通 | 0 | -4 | 0 | +2 | -1 |
| `work-heavy` | 繁忙 | -1 | -8 | -3 | +7 | -4 |
| `work-overload` | 过载 | -3 | -12 | -6 | +12 | -8 |

### 身体异常 `injury`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `injury-none` | 无 | 0 | 0 | 0 | 0 | 0 |
| `injury-light` | 轻微不适 | -4 | -4 | -3 | +4 | -2 |
| `injury-hit` | 受伤 | -8 | -6 | -6 | +10 | -5 |
| `injury-sick` | 生病 | -10 | -12 | -8 | +8 | -8 |
| `injury-recover` | 恢复中 | +6 | +4 | +5 | -4 | +2 |

### 游戏时长 `gaming`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `game-none` | 无 | 0 | 0 | 0 | 0 | 0 |
| `game-low` | 1-3h | 0 | -1 | +2 | -1 | -1 |
| `game-mid` | 3-6h | -1 | -4 | +2 | -1 | -4 |
| `game-high` | 6h+ | -4 | -8 | -3 | +4 | -10 |

### 心情事件 `emotion`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `emotion-bad` | 很差 | 0 | -3 | -8 | +8 | -5 |
| `emotion-stable` | 平稳 | 0 | 0 | 0 | 0 | 0 |
| `emotion-good` | 愉快 | +1 | +3 | +8 | -5 | +3 |

### 养生小习惯 `wellness`

| 选项 id | 文案 | hp | ep | mood | stress | focus |
|---|---|---:|---:|---:|---:|---:|
| `wellness-none` | 无 | 0 | 0 | 0 | 0 | 0 |
| `wellness-basic` | 喝水拉伸 | +2 | +4 | +3 | -3 | +2 |
| `wellness-walk` | 散步轻运动 | +2 | +6 | +4 | -4 | +4 |
| `wellness-full` | 完整养护 | +4 | +8 | +5 | -6 | +4 |

## 联动规则

| 规则 | 条件 | 结果 |
|---|---|---|
| 低精力联动 | `EP < 30` | `STRESS +6` |
| 极低精力联动 | `EP < 15` | `STRESS +6` |
| 高压力掉血 | `STRESS > 70` | `HP -4` |
| 临界压力崩坏 | `STRESS > 85` | `HP -6`, `MOOD -5` |
| 低心情拖累专注 | `MOOD < 35` | `FOCUS -6` |
| 极低心情失稳 | `MOOD < 20` | `FOCUS -6`, `STRESS +4` |
| 高心情恢复加成 | `MOOD > 75` 且睡眠充足 | `HP +2`, `EP +2` |
| 长期晚睡惩罚 | 最近 7 天晚睡 `>= 4 / 6` 次 | `HP Max -4 / -8` |
| 持续养生加成 | 最近 7 天养生 `>= 4 / 6` 次 | `HP Max +3 / +6` |

## 修改建议

推荐你以后只改 [event-config.ts](C:/Users/Administrator/Desktop/daily-5d-demo/event-config.ts) 这一个文件：

- 改事件名称：修改 `label`
- 改事件描述：修改 `description`
- 改数值：修改 `delta`
- 加新分档：在对应 `options` 里新增一项
- 加新事件类别：在 `dailyEventCategories` 里新增一个 category

如果后面要做真正的 demo 页面，我会直接让界面从这个配置文件读取并自动渲染。
