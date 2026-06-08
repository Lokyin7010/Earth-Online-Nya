export type DemoRole = "admin" | "tester";

export type DemoUser = {
  id: string;
  username: string;
  password: string;
  role: DemoRole;
  displayName: string;
  title: string;
  profile: {
    ageBand: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    bodyCondition: "excellent" | "normal" | "weak";
    lifestyle: "stable" | "normal" | "night-owl";
    injury: "none" | "light" | "medium" | "heavy";
    illness: "none" | "light" | "flu" | "serious";
  };
  baseline: {
    hp: number;
    ep: number;
    mood: number;
    stress: number;
    focus: number;
  };
  notes: string;
};

export const demoUsers: DemoUser[] = [
  {
    id: "admin-akari",
    username: "akari-admin",
    password: "moonriver-demo",
    role: "admin",
    displayName: "明里",
    title: "管理员 / 校准者",
    profile: {
      ageBand: "25-34",
      bodyCondition: "normal",
      lifestyle: "normal",
      injury: "none",
      illness: "none",
    },
    baseline: {
      hp: 100,
      ep: 70,
      mood: 72,
      stress: 24,
      focus: 70,
    },
    notes: "系统管理账号。可切换查看全部测试用户，并执行管理员校准。",
  },
  {
    id: "tester-rin",
    username: "rin",
    password: "yoruwork",
    role: "tester",
    displayName: "凛",
    title: "久坐系上班族",
    profile: {
      ageBand: "25-34",
      bodyCondition: "normal",
      lifestyle: "night-owl",
      injury: "none",
      illness: "none",
    },
    baseline: {
      hp: 92,
      ep: 58,
      mood: 61,
      stress: 42,
      focus: 63,
    },
    notes: "适合测试久坐、晚睡、长时间盯屏造成的连锁变化。",
  },
  {
    id: "tester-yui",
    username: "yui",
    password: "slowhealing",
    role: "tester",
    displayName: "结衣",
    title: "恢复期用户",
    profile: {
      ageBand: "35-44",
      bodyCondition: "weak",
      lifestyle: "normal",
      injury: "light",
      illness: "none",
    },
    baseline: {
      hp: 80,
      ep: 52,
      mood: 55,
      stress: 37,
      focus: 57,
    },
    notes: "适合测试伤病恢复、养生习惯、轻运动加成。",
  },
  {
    id: "wuneichihai",
    username: "wuneichihai",
    password: "buxiangshangban",
    role: "tester",
    displayName: "内内",
    title: "高压波动型",
    profile: {
      ageBand: "18-24",
      bodyCondition: "excellent",
      lifestyle: "night-owl",
      injury: "none",
      illness: "light",
    },
    baseline: {
      hp: 96,
      ep: 46,
      mood: 49,
      stress: 60,
      focus: 66,
    },
    notes: "适合测试高工作负荷、睡眠不足、情绪波动和管理员校准。",
  },
];

export const authRules = {
  registrationEnabled: false,
  allowMultipleAccountsPerUser: false,
  loginMode: "prebuilt-accounts",
  adminCanImpersonateTesters: true,
  adminCanCalibrateDimensions: true,
  testerCanOnlyAccessSelf: true,
} as const;
