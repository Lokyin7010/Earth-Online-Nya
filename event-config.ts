export type DimensionKey = "hp" | "ep" | "mood" | "stress" | "focus";

export type DimensionDelta = Partial<Record<DimensionKey, number>>;

export type EventOption = {
  id: string;
  label: string;
  description: string;
  delta: DimensionDelta;
  tags?: string[];
};

export type EventCategory = {
  id: string;
  title: string;
  subtitle: string;
  selectionMode: "single";
  options: EventOption[];
};

export const profileConfig = {
  ageBands: [
    { id: "18-24", label: "18-24", hpMaxModifier: 8 },
    { id: "25-34", label: "25-34", hpMaxModifier: 4 },
    { id: "35-44", label: "35-44", hpMaxModifier: 0 },
    { id: "45-54", label: "45-54", hpMaxModifier: -6 },
    { id: "55+", label: "55+", hpMaxModifier: -12 },
  ],
  bodyConditionBands: [
    { id: "excellent", label: "很好", hpMaxModifier: 12 },
    { id: "normal", label: "正常", hpMaxModifier: 0 },
    { id: "weak", label: "较弱", hpMaxModifier: -10 },
  ],
  lifestyleBands: [
    { id: "stable", label: "稳定早睡", hpMaxModifier: 8 },
    { id: "normal", label: "一般", hpMaxModifier: 0 },
    { id: "night-owl", label: "长期晚睡", hpMaxModifier: -8 },
  ],
  injuryBands: [
    { id: "none", label: "无伤病", hpMaxModifier: 0 },
    { id: "light", label: "轻伤", hpMaxModifier: -8 },
    { id: "medium", label: "中度伤病", hpMaxModifier: -18 },
    { id: "heavy", label: "重度伤病", hpMaxModifier: -30 },
  ],
  illnessBands: [
    { id: "none", label: "无生病", hpMaxModifier: 0 },
    { id: "light", label: "轻微不适", hpMaxModifier: -6 },
    { id: "flu", label: "感冒/发炎", hpMaxModifier: -12 },
    { id: "serious", label: "严重生病", hpMaxModifier: -22 },
  ],
} as const;

export const dailyEventCategories: EventCategory[] = [
  {
    id: "sleep",
    title: "睡眠",
    subtitle: "今晚的修复判定如何？",
    selectionMode: "single",
    options: [
      {
        id: "sleep-poor",
        label: "不足",
        description: "好好睡觉谢谢",
        delta: { hp: -4, ep: -14, mood: -5, stress: 7, focus: -10 },
        tags: ["late-sleep", "sleep-debt"],
      },
      {
        id: "sleep-normal",
        label: "普通",
        description: "没有特别加成，也没有额外损耗。",
        delta: {},
      },
      {
        id: "sleep-good",
        label: "充足",
        description: "夜间修复顺利，状态缓慢回升。",
        delta: { hp: 4, ep: 14, mood: 4, stress: -6, focus: 8 },
        tags: ["good-sleep", "recovery"],
      },
    ],
  },
  {
    id: "sitting",
    title: "神秘按钮",
    subtitle: "奖励关卡",
    selectionMode: "single",
    options: [
      {
        id: "sit-low",
        label: "红色button",
        description: "按下红色按钮",
        delta: {},
      },
      {
        id: "sit-mid",
        label: "蓝色button",
        description: "按下蓝色按钮",
        delta: { hp: -2, ep: -6, mood: -2, stress: 4, focus: -5 },
        tags: ["sedentary"],
      },
      {
        id: "sit-high",
        label: "绿色button",
        description: "按下绿色按钮",
        delta: { hp: -4, ep: -10, mood: -4, stress: 8, focus: -8 },
        tags: ["sedentary", "high-risk"],
      },
    ],
  },
  {
    id: "screen",
    title: "奖励在群里发言10句话",
    subtitle: "汪汪汪汪汪汪",
    selectionMode: "single",
    options: [
      {
        id: "screen-low",
        label: "汪",
        description: "@一下每个人",
        delta: {},
      },
      {
        id: "screen-mid",
        label: "汪汪",
        description: "拍一拍每个人",
        delta: { hp: -1, ep: -5, mood: -2, stress: 3, focus: -6 },
        tags: ["screen-time"],
      },
      {
        id: "screen-high",
        label: "汪汪汪",
        description: "无话可说",
        delta: { hp: -3, ep: -9, mood: -4, stress: 6, focus: -10 },
        tags: ["screen-time", "high-risk"],
      },
    ],
  },
  {
    id: "workload",
    title: "工作负荷",
    subtitle: "今日任务密度如何？",
    selectionMode: "single",
    options: [
      {
        id: "work-light",
        label: "轻松",
        description: "我不是很想上班",
        delta: { ep: -2, mood: 1, stress: -1, focus: 1 },
      },
      {
        id: "work-normal",
        label: "普通",
        description: "我不想上班",
        delta: { ep: -4, stress: 2, focus: -1 },
      },
      {
        id: "work-heavy",
        label: "繁忙",
        description: "我真的不想上班",
        delta: { hp: -1, ep: -8, mood: -3, stress: 7, focus: -4 },
        tags: ["pressure-source"],
      },
      {
        id: "work-overload",
        label: "过载",
        description: "我不要上班啊啊啊",
        delta: { hp: -3, ep: -12, mood: -6, stress: 12, focus: -8 },
        tags: ["pressure-source", "high-risk"],
      },
    ],
  },
  {
    id: "injury",
    title: "身体异常",
    subtitle: "今天有受伤或身体不适吗？",
    selectionMode: "single",
    options: [
      {
        id: "injury-none",
        label: "无",
        description: "未记录异常。",
        delta: {},
      },
      {
        id: "injury-light",
        label: "轻微不适",
        description: "小幅掉血，但还能正常行动。",
        delta: { hp: -4, ep: -4, mood: -3, stress: 4, focus: -2 },
        tags: ["injury"],
      },
      {
        id: "injury-hit",
        label: "受伤",
        description: "受到物理损伤，恢复能力下降。",
        delta: { hp: -8, ep: -6, mood: -6, stress: 10, focus: -5 },
        tags: ["injury", "high-risk"],
      },
      {
        id: "injury-sick",
        label: "生病",
        description: "系统进入异常状态，恢复优先级提升。",
        delta: { hp: -10, ep: -12, mood: -8, stress: 8, focus: -8 },
        tags: ["illness", "high-risk"],
      },
      {
        id: "injury-recover",
        label: "恢复中",
        description: "伤病好转，状态回暖。",
        delta: { hp: 6, ep: 4, mood: 5, stress: -4, focus: 2 },
        tags: ["recovery"],
      },
    ],
  },
  {
    id: "gaming",
    title: "游戏时长",
    subtitle: "今天沉浸在游戏里的时间？",
    selectionMode: "single",
    options: [
      {
        id: "game-none",
        label: "无",
        description: "未记录游戏时长。",
        delta: {},
      },
      {
        id: "game-low",
        label: "1-3h",
        description: "原神！启动！",
        delta: { ep: -1, mood: 2, stress: -1, focus: -1 },
      },
      {
        id: "game-mid",
        label: "3-6h",
        description: "短暂快乐到账，但身体开始透支。",
        delta: { hp: -1, ep: -4, mood: 2, stress: -1, focus: -4 },
        tags: ["gaming"],
      },
      {
        id: "game-high",
        label: "6h+",
        description: "我们要打一辈子游戏啊",
        delta: { hp: -4, ep: -8, mood: -3, stress: 4, focus: -10 },
        tags: ["gaming", "high-risk"],
      },
    ],
  },
  {
    id: "emotion",
    title: "心情事件",
    subtitle: "今天的情绪波动属于哪一类？",
    selectionMode: "single",
    options: [
      {
        id: "emotion-bad",
        label: "管理员选项",
        description: "已在群里和妍妍说话",
        delta: { ep: -10, mood: 100, stress: -10, focus: -10 },
        tags: ["negative-mood"],
      },
      {
        id: "emotion-stable",
        label: "平稳",
        description: "无明显增减。",
        delta: {},
      },
      {
        id: "emotion-good",
        label: "愉快",
        description: "心情轻盈，恢复效率上升。",
        delta: { hp: 1, ep: 3, mood: 8, stress: -5, focus: 3 },
        tags: ["good-mood"],
      },
    ],
  },
  {
    id: "wellness",
    title: "养生小习惯",
    subtitle: "今天做了哪些对身体友善的小事？",
    selectionMode: "single",
    options: [
      {
        id: "wellness-none",
        label: "无",
        description: "没有额外恢复动作。",
        delta: {},
      },
      {
        id: "wellness-basic",
        label: "健身",
        description: "要好好活着啊",
        delta: { hp: 10, ep: 4, mood: 3, stress: -3, focus: 2 },
        tags: ["wellness"],
      },
      {
        id: "wellness-walk",
        label: "散步轻运动",
        description: "身体循环改善，精神也变得通透。",
        delta: { hp: 2, ep: 6, mood: 4, stress: -4, focus: 4 },
        tags: ["wellness", "exercise"],
      },
      {
        id: "wellness-full",
        label: "完整养护",
        description: "今日采取了较完整的恢复行动。",
        delta: { hp: 4, ep: 8, mood: 5, stress: -6, focus: 4 },
        tags: ["wellness", "exercise", "recovery"],
      },
    ],
  },
];

export const derivedRules = [
  {
    id: "low-ep-warning",
    label: "低精力联动",
    description: "EP 低于 30 时，压力额外上升。",
  },
  {
    id: "critical-ep-warning",
    label: "极低精力联动",
    description: "EP 低于 15 时，压力再额外上升。",
  },
  {
    id: "high-stress-hp-loss",
    label: "高压力掉血",
    description: "STRESS 高于 70 时，HP 持续受损。",
  },
  {
    id: "critical-stress-collapse",
    label: "临界压力崩坏",
    description: "STRESS 高于 85 时，HP 与 MOOD 继续下降。",
  },
  {
    id: "low-mood-focus-loss",
    label: "低心情拖累专注",
    description: "MOOD 低于 35 时，FOCUS 额外下降。",
  },
  {
    id: "critical-mood-instability",
    label: "极低心情失稳",
    description: "MOOD 低于 20 时，FOCUS 再下降，STRESS 上升。",
  },
  {
    id: "good-sleep-bonus",
    label: "高心情恢复加成",
    description: "MOOD 高于 75 且睡眠充足时，HP 与 EP 额外恢复。",
  },
  {
    id: "late-sleep-penalty",
    label: "长期晚睡惩罚",
    description: "最近 7 天晚睡次数过高会压低 HP Max。",
  },
  {
    id: "wellness-streak-bonus",
    label: "持续养生加成",
    description: "最近 7 天养生次数较高会提升 HP Max。",
  },
] as const;
