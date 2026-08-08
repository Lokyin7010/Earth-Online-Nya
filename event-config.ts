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
    { id: "none", label: "无", hpMaxModifier: 0 },
    { id: "light", label: "轻微不适", hpMaxModifier: -6 },
    { id: "flu", label: "感冒/发热", hpMaxModifier: -12 },
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
        description: "好好睡觉谢谢！！！",
        delta: { hp: -20, ep: -20, mood: -20, stress: 20, focus: -20 },
        tags: ["late-sleep", "sleep-debt"],
      },
      {
        id: "sleep-normal",
        label: "普通",
        description: "好好睡觉谢谢！！",
        delta: { hp: 10, ep: 10, mood: 0, stress: -10, focus: 30 },
      },
      {
        id: "sleep-good",
        label: "充足",
        description: "好好睡觉谢谢！",
        delta: { hp: 20, ep: 20, mood: 10, stress: -20, focus: 60 },
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
      },
      {
        id: "sit-high",
        label: "绿色button",
        description: "按下绿色按钮",
        delta: { hp: -4, ep: -10, mood: -4, stress: 8, focus: -8 },
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
        delta: {},
      },
      {
        id: "screen-high",
        label: "汪汪汪",
        description: "无话可说",
        delta: {},
      },
      {
        id: "screen-very-high",
        label: "汪汪汪汪",
        description: "喵（可爱捏",
        delta: {},
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
        description: "一天都没打？太忙了吗？没力气了吗？好好休息吧。",
        delta: { hp: 0, ep: 0, mood: -10, stress: 10, focus: 0 },
      },
      {
        id: "game-low",
        label: "1-3h",
        description: "原神！启动！",
        delta: { hp: 5, ep: 20, mood: 20, stress: -10, focus: -5 },
      },
      {
        id: "game-mid",
        label: "3-6h",
        description: "满足了吗？会是很开心的一天吧",
        delta: { hp: 0, ep: 50, mood: 30, stress: -20, focus: -10 },
      },
      {
        id: "game-high",
        label: "6h+",
        description: "我们要打一辈子游戏啊，玩累了也要注意休息哦",
        delta: { hp: -5, ep: 60, mood: 30, stress: -20, focus: -20 },
      },
    ],
  },
  {
    id: "workload",
    title: "工作负荷",
    subtitle: "工作！赚钱！然后打游戏！",
    selectionMode: "single",
    options: [
      {
        id: "work-light",
        label: "轻松",
        description: "摸鱼摸鱼摸摸摸",
        delta: { hp: 0, ep: -5, mood: 0, stress: 5, focus: -5 },
      },
      {
        id: "work-normal",
        label: "普通",
        description: "平常的一天呢",
        delta: { hp: -5, ep: -10, mood: -10, stress: 10, focus: -10 },
      },
      {
        id: "work-heavy",
        label: "繁忙",
        description: "忙完了找个时间痛快的打游戏吧！",
        delta: { hp: -10, ep: -15, mood: -15, stress: 15, focus: -15 },
      },
      {
        id: "work-overload",
        label: "过载",
        description: "怎么会这样！我不要上班啊啊啊QWQ",
        delta: { hp: -20, ep: -20, mood: -20, stress: 20, focus: -20 },
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
        description: "已在群里和妍妍说话！",
        delta: { ep: -10, mood: 100, stress: -10, focus: -10 },
      },
      {
        id: "emotion-stable",
        label: "平稳",
        description: "平常的一天呢",
        delta: {},
      },
      {
        id: "emotion-good",
        label: "愉快",
        description: "嘿嘿嘿嘿嘿嘿",
        delta: { hp: 0, ep: 5, mood: 10, stress: -10, focus: 5 },
      },
      {
        id: "emotion-emo",
        label: "emo",
        description: "怎么啦，摸摸你，转移一下注意力，放松放松吧",
        delta: { hp: -5, ep: -10, mood: -15, stress: 10, focus: -5 },
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
        tags: ["wellness", "exercise", "recovery"],
      },
    ],
  },
  {
    id: "nap",
    title: "午睡了吗",
    subtitle: "午睡了吗午睡了吗午睡了吗",
    selectionMode: "single",
    options: [
      {
        id: "nap-none",
        label: "无",
        description: "头痛！！！！！！！！",
        delta: { hp: -10, ep: -10, mood: -20, stress: 10, focus: -20 },
      },
      {
        id: "nap-rest",
        label: "闭目养神",
        description: "能缓解一点，但不多",
        delta: { hp: -5, ep: -5, mood: -10, stress: 5, focus: -5 },
      },
      {
        id: "nap-short",
        label: "小憩",
        description: "眠一会，下午更有精神！",
        delta: { hp: 5, ep: 5, mood: 5, stress: -5, focus: 5 },
      },
      {
        id: "nap-overslept",
        label: "睡过头了",
        description: "中午睡多了晚上会睡不着的！",
        delta: { hp: 5, ep: 5, mood: 0, stress: 0, focus: 5 },
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
        description: "没事真是太好了！嘿嘿~",
        delta: {},
      },
      {
        id: "injury-light",
        label: "轻微不适",
        description: "感觉不太好，怎么会这样",
        delta: { hp: -10, ep: -5, mood: -5, stress: 5, focus: -5 },
      },
      {
        id: "injury-hit",
        label: "受伤",
        description: "痛痛痛！好好休息，早日康复啊，等你健康归来~",
        delta: { hp: -20, ep: -10, mood: -10, stress: 10, focus: -10 },
      },
      {
        id: "injury-sick",
        label: "生病",
        description: "好不舒服！要听医生的话，好好养病啊。",
        delta: { hp: -20, ep: -10, mood: -10, stress: 10, focus: -20 },
      },
    ],
  },
  {
    id: "medication",
    title: "吃药了吗",
    subtitle: "生病了记得按时吃药哦",
    selectionMode: "single",
    options: [
      {
        id: "medication-missed",
        label: "没吃",
        description: "这个选项就是提醒你吃药的！看到了就去吃！",
        delta: { hp: -5, ep: 0, mood: -5, stress: 0, focus: 0 },
      },
      {
        id: "medication-taken",
        label: "吃了",
        description: "真棒！早日康复！健健康康的！",
        delta: { hp: 10, ep: 0, mood: 5, stress: 0, focus: 0 },
      },
    ],
  },
  {
    id: "social",
    title: "社交事件",
    subtitle: "有时候也要出去走走跟人交流撒",
    selectionMode: "single",
    options: [
      {
        id: "social-active",
        label: "主动社交",
        description: "真棒！开始融入社会了呀~",
        delta: { hp: 0, ep: -10, mood: 5, stress: 5, focus: -10 },
      },
      {
        id: "social-passive",
        label: "被动社交",
        description: "乖~答应我有耐心一点，要是难受了也要及时离开哦",
        delta: { hp: 0, ep: -20, mood: -5, stress: 10, focus: -10 },
      },
    ],
  },
  {
    id: "random",
    title: "随机事件",
    subtitle: "刷到我起来走动一下",
    selectionMode: "single",
    options: [
      {
        id: "random-bad",
        label: "不好",
        description: "！！！为什么不听话！！！",
        delta: {},
      },
      {
        id: "random-good",
        label: "好",
        description: "对的对的！走走更健康！",
        delta: {},
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
    description: "STRESS 高于 85 时，HP 与 MOOD 继续下滑。",
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
    label: "高心情修复加成",
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
