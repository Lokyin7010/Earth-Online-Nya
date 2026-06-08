import { demoUsers, type DemoUser } from "../demo-users";
import {
  dailyEventCategories,
  profileConfig,
  type DimensionDelta,
  type DimensionKey,
  type EventCategory,
} from "../event-config";

export type StatBlock = {
  hp: number;
  hpMax: number;
  ep: number;
  mood: number;
  stress: number;
  focus: number;
};

export type DailySelections = Record<string, string>;

export type UserState = {
  userId: string;
  stats: StatBlock;
  draftSelections: DailySelections;
  updatedAt: string;
};

export type DailyLog = {
  id: string;
  userId: string;
  createdAt: string;
  dateKey?: string;
  selections: DailySelections;
  baseDelta: DimensionDelta;
  ruleDelta: DimensionDelta;
  before: StatBlock;
  after: StatBlock;
  triggeredRules: string[];
  narrative: string;
  tags: string[];
};

export type AdminLog = {
  id: string;
  createdAt: string;
  adminUserId: string;
  targetUserId: string;
  dimension: keyof StatBlock;
  before: number;
  after: number;
  delta: number;
  reason: string;
  type: "admin-calibration";
};

export type DemoData = {
  userStates: Record<string, UserState>;
  dailyLogs: DailyLog[];
  adminLogs: AdminLog[];
};

export type Projection = {
  nextStats: StatBlock;
  baseDelta: DimensionDelta;
  ruleDelta: DimensionDelta;
  triggeredRules: string[];
  tags: string[];
  narrative: string;
};

const BASELINE_DEFAULTS = {
  hp: 100,
  ep: 70,
  mood: 70,
  stress: 30,
  focus: 70,
};

const DIMENSION_ORDER: DimensionKey[] = ["hp", "ep", "mood", "stress", "focus"];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getModifier(
  items: readonly { id: string; hpMaxModifier: number }[],
  id: string,
) {
  return items.find((item) => item.id === id)?.hpMaxModifier ?? 0;
}

export function computeProfileHpMax(profile: DemoUser["profile"]) {
  const base =
    100 +
    getModifier(profileConfig.ageBands, profile.ageBand) +
    getModifier(profileConfig.bodyConditionBands, profile.bodyCondition) +
    getModifier(profileConfig.lifestyleBands, profile.lifestyle) +
    getModifier(profileConfig.injuryBands, profile.injury) +
    getModifier(profileConfig.illnessBands, profile.illness);

  return clamp(base, 70, 140);
}

function getRecentLogs(logs: DailyLog[], userId: string, days = 7) {
  const threshold = Date.now() - days * DAY_IN_MS;
  return logs.filter(
    (log) =>
      log.userId === userId && new Date(log.createdAt).getTime() >= threshold,
  );
}

function countTag(logs: DailyLog[], tag: string) {
  return logs.filter((log) => log.tags.includes(tag)).length;
}

function getCurrentTags(selections: DailySelections) {
  const tags: string[] = [];

  dailyEventCategories.forEach((category) => {
    const selectedId = selections[category.id];
    const option = category.options.find((item) => item.id === selectedId);

    if (option?.tags?.length) {
      tags.push(...option.tags);
    }
  });

  return tags;
}

export function computeHpMax(
  profile: DemoUser["profile"],
  logs: DailyLog[],
  userId: string,
  currentSelections: DailySelections,
) {
  const recentLogs = getRecentLogs(logs, userId);
  const currentTags = getCurrentTags(currentSelections);

  const lateSleepCount =
    countTag(recentLogs, "late-sleep") + currentTags.filter((tag) => tag === "late-sleep").length;
  const wellnessCount =
    countTag(recentLogs, "wellness") + currentTags.filter((tag) => tag === "wellness").length;

  let modifier = 0;

  if (lateSleepCount >= 6) {
    modifier -= 8;
  } else if (lateSleepCount >= 4) {
    modifier -= 4;
  }

  if (wellnessCount >= 6) {
    modifier += 6;
  } else if (wellnessCount >= 4) {
    modifier += 3;
  }

  return clamp(computeProfileHpMax(profile) + modifier, 70, 140);
}

export function createInitialData(): DemoData {
  const userStates = Object.fromEntries(
    demoUsers.map((user) => {
      const hpMax = computeProfileHpMax(user.profile);
      const seededStats: StatBlock = {
        hp: clamp(user.baseline.hp ?? BASELINE_DEFAULTS.hp, 0, hpMax),
        hpMax,
        ep: clamp(user.baseline.ep ?? BASELINE_DEFAULTS.ep, 0, 100),
        mood: clamp(user.baseline.mood ?? BASELINE_DEFAULTS.mood, 0, 100),
        stress: clamp(user.baseline.stress ?? BASELINE_DEFAULTS.stress, 0, 100),
        focus: clamp(user.baseline.focus ?? BASELINE_DEFAULTS.focus, 0, 100),
      };

      return [
        user.id,
        {
          userId: user.id,
          stats: seededStats,
          draftSelections: {},
          updatedAt: new Date().toISOString(),
        } satisfies UserState,
      ];
    }),
  );

  return {
    userStates,
    dailyLogs: [],
    adminLogs: [],
  };
}

function mergeDelta(
  target: DimensionDelta,
  source: DimensionDelta,
  overrideKeys?: DimensionKey[],
) {
  DIMENSION_ORDER.forEach((key) => {
    if (overrideKeys && !overrideKeys.includes(key)) {
      return;
    }

    const current = target[key] ?? 0;
    const next = source[key] ?? 0;
    const total = current + next;

    if (total !== 0) {
      target[key] = total;
    }
  });
}

function applyDelta(stats: StatBlock, delta: DimensionDelta): StatBlock {
  const next = { ...stats };

  next.hp = clamp(next.hp + (delta.hp ?? 0), 0, next.hpMax);
  next.ep = clamp(next.ep + (delta.ep ?? 0), 0, 100);
  next.mood = clamp(next.mood + (delta.mood ?? 0), 0, 100);
  next.stress = clamp(next.stress + (delta.stress ?? 0), 0, 100);
  next.focus = clamp(next.focus + (delta.focus ?? 0), 0, 100);

  return next;
}

function getBaseDelta(selections: DailySelections) {
  const delta: DimensionDelta = {};

  dailyEventCategories.forEach((category) => {
    const selectedId = selections[category.id];
    const option = category.options.find((item) => item.id === selectedId);

    if (option?.delta) {
      mergeDelta(delta, option.delta);
    }
  });

  return delta;
}

function applyDerivedRules(stats: StatBlock, selections: DailySelections) {
  const delta: DimensionDelta = {};
  const triggeredRules: string[] = [];
  let next = { ...stats };

  if (next.ep < 30) {
    mergeDelta(delta, { stress: 6 });
    triggeredRules.push("精力过低，压力额外上升。");
    next = applyDelta(next, { stress: 6 });
  }

  if (next.ep < 15) {
    mergeDelta(delta, { stress: 6 });
    triggeredRules.push("精力见底，精神负荷继续堆积。");
    next = applyDelta(next, { stress: 6 });
  }

  if (next.stress > 70) {
    mergeDelta(delta, { hp: -4 });
    triggeredRules.push("压力过高，健康值持续损耗。");
    next = applyDelta(next, { hp: -4 });
  }

  if (next.stress > 85) {
    mergeDelta(delta, { hp: -6, mood: -5 });
    triggeredRules.push("压力接近临界，情绪与血量同时下滑。");
    next = applyDelta(next, { hp: -6, mood: -5 });
  }

  if (next.mood < 35) {
    mergeDelta(delta, { focus: -6 });
    triggeredRules.push("心情低落，专注值受到拖累。");
    next = applyDelta(next, { focus: -6 });
  }

  if (next.mood < 20) {
    mergeDelta(delta, { focus: -6, stress: 4 });
    triggeredRules.push("情绪濒危，精神稳定性继续下降。");
    next = applyDelta(next, { focus: -6, stress: 4 });
  }

  if (next.mood > 75 && selections.sleep === "sleep-good") {
    mergeDelta(delta, { hp: 2, ep: 2 });
    triggeredRules.push("高心情与充足睡眠产生了恢复加成。");
    next = applyDelta(next, { hp: 2, ep: 2 });
  }

  return { delta, triggeredRules, next };
}

function getNarrative(selections: DailySelections, rules: string[], next: StatBlock) {
  const selectedOptions = dailyEventCategories
    .map((category) => {
      const selectedId = selections[category.id];
      return category.options.find((option) => option.id === selectedId);
    })
    .filter(Boolean);

  if (next.hp <= Math.floor(next.hpMax * 0.35)) {
    return "警告。主人公的生命力已跌入危险区域，今晚必须优先修复。";
  }

  if (next.stress >= 80) {
    return "精神负荷正在逼近上限，系统建议立刻中断高压日程。";
  }

  if (rules.length > 0) {
    return rules[0];
  }

  if (selectedOptions.some((option) => option?.id === "sleep-good")) {
    return "夜间修复判定良好，五维状态出现温和回升。";
  }

  if (selectedOptions.some((option) => option?.id === "work-overload")) {
    return "今日日程过密，主角的精神回路明显过热。";
  }

  if (selectedOptions.some((option) => option?.id === "wellness-full")) {
    return "细致的养护动作已完成，身体机能正在缓慢回暖。";
  }

  return "今日记录已同步，状态面板完成一次静默更新。";
}

export function projectState(
  user: DemoUser,
  state: UserState,
  logs: DailyLog[],
): Projection {
  const hpMax = computeHpMax(user.profile, logs, user.id, state.draftSelections);
  const baseStats = {
    ...state.stats,
    hpMax,
    hp: clamp(state.stats.hp, 0, hpMax),
  };
  const baseDelta = getBaseDelta(state.draftSelections);
  const afterBase = applyDelta(baseStats, baseDelta);
  const { delta: ruleDelta, triggeredRules, next } = applyDerivedRules(
    afterBase,
    state.draftSelections,
  );

  return {
    nextStats: next,
    baseDelta,
    ruleDelta,
    triggeredRules,
    tags: getCurrentTags(state.draftSelections),
    narrative: getNarrative(state.draftSelections, triggeredRules, next),
  };
}

export function getDimensionLabel(key: keyof StatBlock) {
  const map: Record<keyof StatBlock, string> = {
    hp: "健康值",
    hpMax: "健康上限",
    ep: "精力值",
    mood: "心情值",
    stress: "压力值",
    focus: "专注值",
  };

  return map[key];
}

export function getDimensionTone(key: keyof StatBlock) {
  const map: Record<keyof StatBlock, string> = {
    hp: "rose",
    hpMax: "gold",
    ep: "mint",
    mood: "sky",
    stress: "amber",
    focus: "violet",
  };

  return map[key];
}

export function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

export function getOptionById(category: EventCategory, optionId?: string) {
  return category.options.find((option) => option.id === optionId);
}
