"use client";

import { useEffect, useMemo, useState } from "react";
import { authRules, demoUsers } from "../demo-users";
import { dailyEventCategories, type DimensionKey } from "../event-config";
import {
  clamp,
  createInitialData,
  formatDelta,
  getDimensionLabel,
  getDimensionTone,
  getOptionById,
  projectState,
  type AdminLog,
  type DailyLog,
  type DemoData,
  type StatBlock,
} from "../lib/game";

const SESSION_KEY = "daily5d_session";
const DATA_KEY = "daily5d_data";
const DEFAULT_USERNAME = "wuneichihai";

type SessionState = {
  userId: string;
};

type CalibrationMode = "delta" | "set";
type MobileTab = "home" | "status" | "events" | "logs" | "admin";
type StatusTheme = "steady" | "tired" | "tense" | "recovering" | "bright";
type EventPhase = "idle" | "resolving";
type ManualTagKey =
  | "spirit"
  | "san"
  | "expectation"
  | "hope"
  | "intelligence"
  | "energy"
  | "mood"
  | "pressure"
  | "sleep";

const REASON_OPTIONS = [
  "主观状态修正",
  "演示用状态构造",
  "误操作回滚",
  "补录缺失数据",
  "测试校准",
];

const STAT_KEYS: DimensionKey[] = ["hp", "ep", "mood", "stress", "focus"];
const MANUAL_TAG_LIBRARY: Array<{
  key: ManualTagKey;
  label: string;
  delta: Partial<Record<DimensionKey, number>>;
}> = [
  { key: "spirit", label: "精神", delta: { focus: 2, mood: 1 } },
  { key: "san", label: "SAN", delta: { stress: -2, mood: 1 } },
  { key: "expectation", label: "期待", delta: { mood: 2, focus: 1 } },
  { key: "hope", label: "希望", delta: { mood: 2, stress: -1 } },
  { key: "intelligence", label: "智力", delta: { focus: 3 } },
  { key: "energy", label: "能量", delta: { ep: 3, hp: 1 } },
  { key: "mood", label: "心情", delta: { mood: 3 } },
  { key: "pressure", label: "压力", delta: { stress: 3, focus: -1 } },
  { key: "sleep", label: "睡眠", delta: { ep: 2, hp: 2, stress: -1 } },
];

function getRoleLabel(role: "admin" | "tester") {
  return role === "admin" ? "管理员" : "测试用户";
}

function getStatusTheme(stats: StatBlock, latestLog?: DailyLog): StatusTheme {
  const hpRatio = stats.hpMax > 0 ? stats.hp / stats.hpMax : 0;
  const recoveryTags = latestLog?.tags ?? [];
  const hasRecoveryTone = recoveryTags.some((tag) =>
    ["recovery", "wellness", "exercise", "good-sleep"].includes(tag),
  );

  if (stats.stress >= 75 || (stats.stress >= 65 && stats.mood <= 35)) {
    return "tense";
  }

  if (stats.ep <= 30 || hpRatio <= 0.45) {
    return "tired";
  }

  if (
    hpRatio >= 0.85 &&
    stats.ep >= 70 &&
    stats.mood >= 75 &&
    stats.stress <= 35
  ) {
    return "bright";
  }

  if (hasRecoveryTone && stats.stress <= 60) {
    return "recovering";
  }

  return "steady";
}

function getStatusThemeLabel(theme: StatusTheme) {
  const map: Record<StatusTheme, string> = {
    steady: "稳定",
    tired: "疲劳边缘",
    tense: "紧绷",
    recovering: "恢复中",
    bright: "状态极佳",
  };

  return map[theme];
}

function getStatusThemeMessage(theme: StatusTheme) {
  const map: Record<StatusTheme, string> = {
    steady: "今天的状态暂时平稳。",
    tired: "精神有些发紧，身体也在提醒你慢一点。",
    tense: "压力正在上升，今天的空气有些发紧。",
    recovering: "状态正在回暖，恢复还在继续。",
    bright: "今天的整体状态很轻，像是顺风的一天。",
  };

  return map[theme];
}

function getCompactDimensionLabel(key: DimensionKey) {
  const map: Record<DimensionKey, string> = {
    hp: "健康",
    ep: "精力",
    mood: "心情",
    stress: "压力",
    focus: "专注",
  };

  return map[key];
}

function mergeDimensionDeltas(
  left: Partial<Record<DimensionKey, number>>,
  right: Partial<Record<DimensionKey, number>>,
) {
  const keys: DimensionKey[] = ["hp", "ep", "mood", "stress", "focus"];
  const merged: Partial<Record<DimensionKey, number>> = {};

  keys.forEach((key) => {
    const total = (left[key] ?? 0) + (right[key] ?? 0);
    if (total !== 0) {
      merged[key] = total;
    }
  });

  return merged;
}

function subtractDimensionDeltas(
  left: Partial<Record<DimensionKey, number>>,
  right: Partial<Record<DimensionKey, number>>,
) {
  const keys: DimensionKey[] = ["hp", "ep", "mood", "stress", "focus"];
  const merged: Partial<Record<DimensionKey, number>> = {};

  keys.forEach((key) => {
    const total = (left[key] ?? 0) - (right[key] ?? 0);
    if (total !== 0) {
      merged[key] = total;
    }
  });

  return merged;
}

function multiplyDimensionDelta(
  delta: Partial<Record<DimensionKey, number>>,
  factor: number,
) {
  const keys: DimensionKey[] = ["hp", "ep", "mood", "stress", "focus"];
  const result: Partial<Record<DimensionKey, number>> = {};

  keys.forEach((key) => {
    const value = delta[key];
    if (typeof value === "number" && value !== 0) {
      result[key] = value * factor;
    }
  });

  return result;
}

function applyStatDelta(
  stats: StatBlock,
  delta: Partial<Record<DimensionKey, number>>,
) {
  return {
    ...stats,
    hp: Math.round(stats.hp + (delta.hp ?? 0)),
    ep: Math.round(stats.ep + (delta.ep ?? 0)),
    mood: Math.round(stats.mood + (delta.mood ?? 0)),
    stress: Math.round(stats.stress + (delta.stress ?? 0)),
    focus: Math.round(stats.focus + (delta.focus ?? 0)),
  };
}

function aggregateManualTagDelta(
  items: Array<{ baseKey: string; sign: 1 | -1 }>,
) {
  return items.reduce<Partial<Record<DimensionKey, number>>>((acc, item) => {
    const config = MANUAL_TAG_LIBRARY.find((tag) => tag.key === item.baseKey);
    if (!config) {
      return acc;
    }

    return mergeDimensionDeltas(acc, multiplyDimensionDelta(config.delta, item.sign));
  }, {});
}

function getStatBarPercent(key: DimensionKey, value: number) {
  const displayValue = key === "stress" ? Math.max(0, Math.abs(value)) : Math.max(0, value);
  return Math.min(100, Math.round(displayValue));
}

function getRandomCategoryId(excludeId?: string) {
  if (dailyEventCategories.length === 0) {
    return "";
  }

  if (dailyEventCategories.length === 1) {
    return dailyEventCategories[0]?.id ?? "";
  }

  const pool = dailyEventCategories.filter((category) => category.id !== excludeId);
  const source = pool.length > 0 ? pool : dailyEventCategories;
  const picked = source[Math.floor(Math.random() * source.length)];

  return picked?.id ?? "";
}

function getLocalDateKey(date = new Date()) {
  const utcTime = date.getTime();
  const utc8Time = utcTime + 8 * 60 * 60 * 1000;
  const utc8Date = new Date(utc8Time);
  const year = utc8Date.getUTCFullYear();
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc8Date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function DoodleMarks({ className = "" }: { className?: string }) {
  return (
    <div className={`doodle-marks ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 36 36" className="doodle-icon star-icon">
        <path d="M18 4 L21 13 L31 14 L23 20 L25 30 L18 24 L11 30 L13 20 L5 14 L15 13 Z" />
        <path d="M9 7 L11 9" />
        <path d="M27 26 L29 28" />
      </svg>
      <svg viewBox="0 0 48 20" className="doodle-icon wave-icon">
        <path d="M2 12 C8 3, 14 3, 20 12 S32 21, 38 12 S44 3, 46 8" />
      </svg>
      <svg viewBox="0 0 48 36" className="doodle-icon arrow-icon">
        <path d="M4 28 C14 20, 22 18, 34 16" />
        <path d="M29 8 L38 16 L27 22" />
      </svg>
      <svg viewBox="0 0 34 34" className="doodle-icon ring-icon">
        <path d="M7 18 C7 10, 13 5, 20 6 C28 7, 30 14, 28 21 C25 28, 18 30, 11 27 C7 25, 5 22, 7 18 Z" />
      </svg>
    </div>
  );
}

export function DemoApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [data, setData] = useState<DemoData>(() => createInitialData());
  const [loginUsername, setLoginUsername] = useState(DEFAULT_USERNAME);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminTargetId, setAdminTargetId] = useState<string>(demoUsers[0]?.id ?? "");
  const [calibrationDimension, setCalibrationDimension] =
    useState<keyof StatBlock>("focus");
  const [calibrationMode, setCalibrationMode] =
    useState<CalibrationMode>("delta");
  const [calibrationValue, setCalibrationValue] = useState("5");
  const [calibrationReason, setCalibrationReason] = useState(REASON_OPTIONS[0]);
  const [calibrationNote, setCalibrationNote] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [currentEventCategoryId, setCurrentEventCategoryId] = useState("");
  const [eventPhase, setEventPhase] = useState<EventPhase>("idle");
  const [resolvingOptionId, setResolvingOptionId] = useState("");
  const [selectedManualTagKey, setSelectedManualTagKey] = useState<ManualTagKey | "">("");

  useEffect(() => {
    const savedSession = window.localStorage.getItem(SESSION_KEY);
    const savedData = window.localStorage.getItem(DATA_KEY);

    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    if (savedData) {
      try {
        setData(JSON.parse(savedData) as DemoData);
      } catch {
        setData(createInitialData());
      }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [ready, session]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data, ready]);

  const currentUser = useMemo(
    () => demoUsers.find((user) => user.id === session?.userId) ?? null,
    [session],
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role === "admin") {
      const firstTester = demoUsers.find((user) => user.role === "tester");
      setAdminTargetId(firstTester?.id ?? currentUser.id);
      return;
    }

    setAdminTargetId(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role !== "admin" && mobileTab === "admin") {
      setMobileTab("logs");
    }
  }, [currentUser?.role, mobileTab]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const todayKey = getLocalDateKey();

    setData((current) => {
      let changed = false;
      const nextUserStates = { ...current.userStates };
      let nextDailyLogs = [...current.dailyLogs];

      Object.entries(current.userStates).forEach(([userId, userState]) => {
        const nextUserState = { ...userState };

        if (nextUserState.dailyProgress?.dateKey !== todayKey) {
          nextUserState.dailyProgress = {
            dateKey: todayKey,
            count: 0,
          };
          changed = true;
        }

        if (nextUserState.manualTags?.dateKey !== todayKey) {
          const previousManualTags = nextUserState.manualTags;

          if (previousManualTags && previousManualTags.items.length > 0) {
            const manualDelta = aggregateManualTagDelta(previousManualTags.items);
              const existingDayLog = nextDailyLogs.find(
                (log) =>
                  log.userId === userId &&
                  (log.dateKey === previousManualTags.dateKey ||
                    getLocalDateKey(new Date(log.createdAt)) === previousManualTags.dateKey),
              );
            const nextStats = applyStatDelta(nextUserState.stats, manualDelta);
            const eventBaseDelta = existingDayLog
              ? subtractDimensionDeltas(
                  existingDayLog.baseDelta,
                  existingDayLog.manualTagDelta ?? {},
                )
              : {};
            const nextManualTagDelta = mergeDimensionDeltas(
              existingDayLog?.manualTagDelta ?? {},
              manualDelta,
            );

            const nextLog: DailyLog = existingDayLog
              ? {
                  ...existingDayLog,
                  manualTagDelta: nextManualTagDelta,
                  baseDelta: mergeDimensionDeltas(eventBaseDelta, nextManualTagDelta),
                  entries: [
                    ...(existingDayLog.entries ?? []),
                    ...previousManualTags.items.map((item) => ({
                      type: "manual-tag" as const,
                      categoryId: "manual-tags",
                      categoryTitle: "手动标签",
                      optionId: item.id,
                      optionLabel: `${item.label}${item.sign > 0 ? "+" : "-"}`,
                    })),
                  ],
                  after: { ...nextStats },
                  tags: Array.from(new Set([...(existingDayLog.tags ?? []), "manual-tags"])),
                }
              : {
                  id: crypto.randomUUID(),
                  userId,
                  createdAt: new Date().toISOString(),
                  dateKey: previousManualTags.dateKey,
                  entries: previousManualTags.items.map((item) => ({
                    type: "manual-tag" as const,
                    categoryId: "manual-tags",
                    categoryTitle: "手动标签",
                    optionId: item.id,
                    optionLabel: `${item.label}${item.sign > 0 ? "+" : "-"}`,
                  })),
                  manualTagDelta: nextManualTagDelta,
                  selections: {},
                  baseDelta: nextManualTagDelta,
                  ruleDelta: {},
                  before: { ...nextUserState.stats },
                  after: { ...nextStats },
                  triggeredRules: [],
                  narrative: "手动标签已写入今天。",
                  tags: ["manual-tags"],
                };

            nextDailyLogs = [
              nextLog,
              ...nextDailyLogs.filter((log) => log.id !== existingDayLog?.id),
            ].slice(0, 60);
            nextUserState.stats = nextStats;
            changed = true;
          }

          nextUserState.manualTags = {
            dateKey: todayKey,
            count: 0,
            items: [],
          };
          changed = true;
        }

        nextUserStates[userId] = nextUserState;
      });

      return changed
        ? {
            ...current,
            userStates: nextUserStates,
            dailyLogs: nextDailyLogs,
          }
        : current;
    });
  }, [ready]);

  useEffect(() => {
    if (mobileTab !== "events") {
      return;
    }

    if (!currentEventCategoryId) {
      setCurrentEventCategoryId(getRandomCategoryId());
    }
  }, [currentEventCategoryId, mobileTab]);

  const activeUser = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    if (currentUser.role !== "admin") {
      return currentUser;
    }

    return demoUsers.find((user) => user.id === adminTargetId) ?? currentUser;
  }, [adminTargetId, currentUser]);

  const activeState = activeUser ? data.userStates[activeUser.id] : null;

  const activeLogs = useMemo(
    () => data.dailyLogs.filter((log) => log.userId === activeUser?.id),
    [activeUser?.id, data.dailyLogs],
  );

  const activeAdminLogs = useMemo(
    () => data.adminLogs.filter((log) => log.targetUserId === activeUser?.id),
    [activeUser?.id, data.adminLogs],
  );
  const todayEventCount = useMemo(() => {
    if (!activeState) {
      return 0;
    }

    const todayKey = getLocalDateKey();
    const progress = activeState.dailyProgress;

    if (!progress || progress.dateKey !== todayKey) {
      return 0;
    }

    return progress.count;
  }, [activeState]);

  const projection =
    activeUser && activeState ? projectState(activeUser, activeState, data.dailyLogs) : null;
  const activeTheme =
    activeState ? getStatusTheme(activeState.stats, activeLogs[0]) : "steady";
  const todayManualTagCount = useMemo(() => {
    if (!activeState) {
      return 0;
    }

    const todayKey = getLocalDateKey();
    const manualTags = activeState.manualTags;

    if (!manualTags || manualTags.dateKey !== todayKey) {
      return 0;
    }

    return manualTags.count;
  }, [activeState]);

  const currentEventCategory =
    todayEventCount >= 99
      ? null
      : dailyEventCategories.find((category) => category.id === currentEventCategoryId) ??
        dailyEventCategories[0] ??
        null;

  const mobileTabs =
    currentUser?.role === "admin"
      ? [
          { id: "home" as const, label: "首页" },
          { id: "status" as const, label: "状态" },
          { id: "events" as const, label: "事件" },
          { id: "logs" as const, label: "日志" },
          { id: "admin" as const, label: "校准" },
        ]
      : [
          { id: "home" as const, label: "首页" },
          { id: "status" as const, label: "状态" },
          { id: "events" as const, label: "事件" },
          { id: "logs" as const, label: "日志" },
        ];

  const handleLogin = () => {
    const account = demoUsers.find((user) => user.username === loginUsername.trim());

    if (!account || account.password !== loginPassword) {
      setLoginError("账号或密码不正确，当前版本未开放自由注册。");
      return;
    }

    setSession({ userId: account.id });
    setLoginPassword("");
    setLoginError("");
    setMobileTab("home");
  };

  const handleLogout = () => {
    setSession(null);
    setLoginPassword("");
    setLoginError("");
    setLoginUsername(DEFAULT_USERNAME);
  };

  const commitSelection = (categoryId: string, optionId: string) => {
    if (!activeUser || !activeState) {
      return;
    }

    const tempState = {
      ...activeState,
      draftSelections: {
        [categoryId]: optionId,
      },
    };

    const nextProjection = projectState(activeUser, tempState, data.dailyLogs);
    const now = new Date();
    const dateKey = getLocalDateKey(now);
    const category = dailyEventCategories.find((item) => item.id === categoryId);
    const option = category?.options.find((item) => item.id === optionId);

    setData((current) => {
      const currentUserState = current.userStates[activeUser.id];
      const existingProgress = currentUserState.dailyProgress;
      const nextCount =
        existingProgress && existingProgress.dateKey === dateKey
          ? existingProgress.count + 1
          : 1;
      const existingTodayLog = current.dailyLogs.find(
        (item) =>
          item.userId === activeUser.id &&
          (item.dateKey === dateKey ||
            getLocalDateKey(new Date(item.createdAt)) === dateKey),
      );

      const nextLog: DailyLog = existingTodayLog
        ? {
            ...existingTodayLog,
            createdAt: now.toISOString(),
            dateKey,
            selections: {
              ...existingTodayLog.selections,
              [categoryId]: optionId,
            },
            entries: [
              ...(existingTodayLog.entries ?? []),
              {
                categoryId,
                categoryTitle: category?.title ?? categoryId,
                optionId,
                optionLabel: option?.label ?? optionId,
              },
            ],
            baseDelta: mergeDimensionDeltas(
              existingTodayLog.baseDelta,
              nextProjection.baseDelta,
            ),
            ruleDelta: mergeDimensionDeltas(
              existingTodayLog.ruleDelta,
              nextProjection.ruleDelta,
            ),
            before: existingTodayLog.before,
            after: { ...nextProjection.nextStats },
            triggeredRules: [
              ...existingTodayLog.triggeredRules,
              ...nextProjection.triggeredRules,
            ],
            narrative: nextProjection.narrative,
            tags: Array.from(
              new Set([...(existingTodayLog.tags ?? []), ...nextProjection.tags]),
            ),
          }
        : {
            id: crypto.randomUUID(),
            userId: activeUser.id,
            createdAt: now.toISOString(),
            dateKey,
            selections: { [categoryId]: optionId },
            entries: [
              {
                categoryId,
                categoryTitle: category?.title ?? categoryId,
                optionId,
                optionLabel: option?.label ?? optionId,
              },
            ],
            baseDelta: { ...nextProjection.baseDelta },
            ruleDelta: { ...nextProjection.ruleDelta },
            before: { ...activeState.stats },
            after: { ...nextProjection.nextStats },
            triggeredRules: [...nextProjection.triggeredRules],
            narrative: nextProjection.narrative,
            tags: [...nextProjection.tags],
          };

      const nextDailyLogs = [
        nextLog,
        ...current.dailyLogs.filter(
          (item) =>
            !(
              item.userId === activeUser.id &&
              (item.dateKey === dateKey ||
                getLocalDateKey(new Date(item.createdAt)) === dateKey)
            ),
        ),
      ].slice(0, 60);

        return {
          userStates: {
            ...current.userStates,
            [activeUser.id]: {
              ...currentUserState,
              stats: { ...nextProjection.nextStats },
              draftSelections: {},
              dailyProgress: {
                dateKey,
                count: nextCount,
              },
              updatedAt: now.toISOString(),
            },
          },
        dailyLogs: nextDailyLogs,
        adminLogs: current.adminLogs,
      };
    });
  };

  const updateSelections = (categoryId: string, optionId: string) => {
    if (!activeUser || !activeState) {
      return;
    }

    if (eventPhase !== "idle") {
      return;
    }

    const currentSelected = activeState.draftSelections[categoryId];

    if (currentSelected === optionId) {
      const nextCategoryId = getRandomCategoryId(categoryId);
      setEventPhase("resolving");
      setResolvingOptionId(optionId);

      window.setTimeout(() => {
        commitSelection(categoryId, optionId);
        setResolvingOptionId("");
        setCurrentEventCategoryId(nextCategoryId);
        setEventPhase("idle");
      }, 420);
      return;
    }

    setData((current) => ({
      ...current,
      userStates: {
        ...current.userStates,
        [activeUser.id]: {
          ...current.userStates[activeUser.id],
          draftSelections: {
            [categoryId]: optionId,
          },
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const applyCalibration = () => {
    if (!currentUser || currentUser.role !== "admin" || !activeUser || !activeState) {
      return;
    }

    const rawValue = Number(calibrationValue);

    if (Number.isNaN(rawValue)) {
      return;
    }

    const before = activeState.stats[calibrationDimension];
    let after = calibrationMode === "delta" ? before + rawValue : rawValue;

    after = Math.round(after);

    const delta = after - before;

    if (delta === 0) {
      return;
    }

    const nextStats = {
      ...activeState.stats,
      [calibrationDimension]: after,
    };

    const reason = calibrationNote.trim()
      ? `${calibrationReason} / ${calibrationNote.trim()}`
      : calibrationReason;

    const log: AdminLog = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      adminUserId: currentUser.id,
      targetUserId: activeUser.id,
      dimension: calibrationDimension,
      before,
      after,
      delta,
      reason,
      type: "admin-calibration",
    };

    setData((current) => ({
      userStates: {
        ...current.userStates,
        [activeUser.id]: {
          ...current.userStates[activeUser.id],
          stats: nextStats,
          updatedAt: new Date().toISOString(),
        },
      },
      dailyLogs: current.dailyLogs,
      adminLogs: [log, ...current.adminLogs].slice(0, 120),
    }));
  };

  const resetDemoData = () => {
    setData(createInitialData());
  };

  const refreshEventQuestion = () => {
    if (eventPhase === "resolving") {
      return;
    }

    setCurrentEventCategoryId((current) => getRandomCategoryId(current));
    setResolvingOptionId("");
    setEventPhase("idle");
  };

  const commitManualTag = (tagKey: ManualTagKey) => {
    if (!activeUser || !activeState) {
      return;
    }

    const tagConfig = MANUAL_TAG_LIBRARY.find((tag) => tag.key === tagKey);
    if (!tagConfig) {
      return;
    }

    const todayKey = getLocalDateKey();

    setData((current) => {
      const currentUserState = current.userStates[activeUser.id];
      const manualTags =
        currentUserState.manualTags?.dateKey === todayKey
          ? currentUserState.manualTags
          : { dateKey: todayKey, count: 0, items: [] };

      if (manualTags.count >= 99) {
        return current;
      }

      const nextItem = {
        id: crypto.randomUUID(),
        baseKey: tagConfig.key,
        label: tagConfig.label,
        sign: 1 as const,
      };

      return {
        ...current,
        userStates: {
          ...current.userStates,
          [activeUser.id]: {
            ...currentUserState,
            manualTags: {
              dateKey: todayKey,
              count: manualTags.count + 1,
              items: [...manualTags.items, nextItem],
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });

    setSelectedManualTagKey("");
  };

  const handleManualTagPick = (tagKey: ManualTagKey) => {
    if (todayManualTagCount >= 99) {
      return;
    }

    if (selectedManualTagKey === tagKey) {
      commitManualTag(tagKey);
      return;
    }

    setSelectedManualTagKey(tagKey);
  };

  const toggleManualTagSign = (tagId: string) => {
    if (!activeUser || !activeState) {
      return;
    }

    const todayKey = getLocalDateKey();

    setData((current) => {
      const currentUserState = current.userStates[activeUser.id];
      const manualTags = currentUserState.manualTags;

      if (!manualTags || manualTags.dateKey !== todayKey) {
        return current;
      }

      const targetItem = manualTags.items.find((item) => item.id === tagId);

      if (!targetItem) {
        return current;
      }

      const shouldRemove = targetItem.sign === -1;
      const nextItems: typeof manualTags.items = shouldRemove
        ? manualTags.items.filter((item) => item.id !== tagId)
        : manualTags.items.map((item) =>
            item.id === tagId ? { ...item, sign: -1 as const } : item,
          );

      return {
        ...current,
        userStates: {
          ...current.userStates,
          [activeUser.id]: {
            ...currentUserState,
            manualTags: {
              ...manualTags,
              count: shouldRemove ? Math.max(0, manualTags.count - 1) : manualTags.count,
              items: nextItems,
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const submitManualTags = () => {
    if (!activeUser || !activeState) {
      return;
    }

    const manualTags = activeState.manualTags;
    const todayKey = getLocalDateKey();

    if (!manualTags || manualTags.dateKey !== todayKey || manualTags.items.length === 0) {
      return;
    }

    setData((current) => {
      const currentUserState = current.userStates[activeUser.id];
      const currentManualTags = currentUserState.manualTags;

      if (!currentManualTags || currentManualTags.items.length === 0) {
        return current;
      }

      const manualDelta = aggregateManualTagDelta(currentManualTags.items);
      const nextStats = applyStatDelta(currentUserState.stats, manualDelta);
      const existingTodayLog = current.dailyLogs.find(
        (log) =>
          log.userId === activeUser.id &&
          (log.dateKey === todayKey || getLocalDateKey(new Date(log.createdAt)) === todayKey),
      );
      const eventBaseDelta = existingTodayLog
        ? subtractDimensionDeltas(
            existingTodayLog.baseDelta,
            existingTodayLog.manualTagDelta ?? {},
          )
        : {};
      const nextManualTagDelta = mergeDimensionDeltas(
        existingTodayLog?.manualTagDelta ?? {},
        manualDelta,
      );

      const nextLog: DailyLog = existingTodayLog
        ? {
            ...existingTodayLog,
            createdAt: new Date().toISOString(),
            dateKey: todayKey,
            entries: [
              ...(existingTodayLog.entries ?? []),
              ...currentManualTags.items.map((item) => ({
                type: "manual-tag" as const,
                categoryId: "manual-tags",
                categoryTitle: "手动标签",
                optionId: item.id,
                optionLabel: `${item.label}${item.sign > 0 ? "+" : "-"}`,
              })),
            ],
            manualTagDelta: nextManualTagDelta,
            baseDelta: mergeDimensionDeltas(eventBaseDelta, nextManualTagDelta),
            after: { ...nextStats },
            tags: Array.from(new Set([...(existingTodayLog.tags ?? []), "manual-tags"])),
          }
        : {
            id: crypto.randomUUID(),
            userId: activeUser.id,
            createdAt: new Date().toISOString(),
            dateKey: todayKey,
            entries: currentManualTags.items.map((item) => ({
              type: "manual-tag" as const,
              categoryId: "manual-tags",
              categoryTitle: "手动标签",
              optionId: item.id,
              optionLabel: `${item.label}${item.sign > 0 ? "+" : "-"}`,
            })),
            manualTagDelta: nextManualTagDelta,
            selections: {},
            baseDelta: nextManualTagDelta,
            ruleDelta: {},
            before: { ...currentUserState.stats },
            after: { ...nextStats },
            triggeredRules: [],
            narrative: "手动标签已写入今天。",
            tags: ["manual-tags"],
          };

      return {
        ...current,
        userStates: {
          ...current.userStates,
          [activeUser.id]: {
            ...currentUserState,
            stats: nextStats,
            manualTags: {
              ...currentManualTags,
              items: [],
            },
            updatedAt: new Date().toISOString(),
          },
        },
        dailyLogs: [
          nextLog,
          ...current.dailyLogs.filter((log) => log.id !== existingTodayLog?.id),
        ].slice(0, 60),
      };
    });

    setSelectedManualTagKey("");
  };

  const getPaneClass = (tab: MobileTab) =>
    mobileTab === tab ? "board-pane mobile-active" : "board-pane";

  if (!ready) {
    return <main className="ink-shell loading-shell">面板连接中...</main>;
  }

  if (!session || !currentUser) {
    return (
      <main className="ink-shell theme-steady">
        <section className="login-stage">
          <div className="ink-card login-card">
            <div className="doodle-titlebar">
              <span>登录</span>
              <span>演示版本</span>
            </div>

            <div className="login-layout">
              <section className="login-copy">
                <DoodleMarks className="login-doodles" />
                <p className="doodle-kicker">daily 5d / sketchbook</p>
                <h1>地球 Online 内测1.0喵</h1>
                <p className="doodle-copy">
                  先进入首页。账号密码登录保留，但默认已经填好内内的账号，方便直接验收流程。
                </p>

                <div className="doodle-note">
                  <span className="note-mark">●</span>
                  <span>内测角色：内内</span>
                </div>
              </section>

              <section className="login-panel">
                <div className="ink-card inner-card">
                  <div className="doodle-titlebar">
                    <span>账号确认</span>
                    <span>手动填写</span>
                  </div>

                  <div className="doodle-scroll login-scroll">
                    <div className="field-stack">
                      <label className="field">
                        <span>账号</span>
                        <input
                          value={loginUsername}
                          onChange={(event) => setLoginUsername(event.target.value)}
                          autoComplete="username"
                          spellCheck={false}
                        />
                      </label>

                      <label className="field">
                        <span>密码</span>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                          autoComplete="current-password"
                          placeholder="输入预置密码"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleLogin();
                            }
                          }}
                        />
                      </label>

                      {loginError ? <p className="mono-copy">{loginError}</p> : null}
                    </div>
                  </div>

                  <button className="ink-button primary-ink-button" onClick={handleLogin}>
                    进入面板
                  </button>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!activeUser || !activeState || !projection) {
    return <main className="ink-shell loading-shell">没有可用的角色状态。</main>;
  }

  return (
    <main className={`ink-shell theme-${activeTheme}`}>
      <div className="ink-frame">
        <header className="board-header board-header-plain">
          <DoodleMarks className="header-doodles" />
          <div className="board-header-copy">
            <p className="doodle-kicker">daily 5d / black sketch</p>
            <h1>地球 Online 内测1.0喵</h1>
            <p className="doodle-copy">全黑底手绘版。整页固定，只允许板块内部滚动。</p>
          </div>

          <div className="board-header-tools">
            <div className="identity-chip">
              <strong>{currentUser.displayName}</strong>
              <span>{getRoleLabel(currentUser.role)}</span>
            </div>
            <button className="ink-button secondary-ink-button" onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>

        <section className="board-grid">
          <div className={getPaneClass("home")}>
            <section className="ink-card sketch-panel fill-panel">
              <div className="doodle-titlebar">
                <span>首页</span>
                <span>{activeUser.displayName}</span>
              </div>

              <div className="doodle-scroll mobile-scene">
                <DoodleMarks className="panel-doodles top-right" />

                <section className="story-block hero-block home-hero-block">
                  <div className="sketch-hero">
                    <div>
                      <h2>{activeUser.displayName}</h2>
                      <p className="mono-copy">{`点击标签为今日状态加点 (${todayManualTagCount}/99)`}</p>
                    </div>
                    <button className="ink-button ghost-ink-button outline-chip submit-chip" onClick={submitManualTags}>
                      手动提交
                    </button>
                  </div>

                  {currentUser.role === "admin" ? (
                    <label className="field">
                        <span>当前观察对象</span>
                      <select
                        value={adminTargetId}
                        onChange={(event) => setAdminTargetId(event.target.value)}
                      >
                        {demoUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.displayName} / {getRoleLabel(user.role)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <div className="tag-ribbon">
                    {(activeState.manualTags?.items ?? []).length > 0
                      ? activeState.manualTags?.items.map((item) => (
                          <button
                            key={item.id}
                            className="manual-tag-chip"
                            onClick={() => toggleManualTagSign(item.id)}
                          >
                            {item.label}
                            {item.sign > 0 ? "+" : "-"}
                          </button>
                        ))
                      : null}
                  </div>
                </section>

                <div className="manual-tag-grid">
                  {MANUAL_TAG_LIBRARY.map((tag) => {
                    const isActive = selectedManualTagKey === tag.key;

                    return (
                      <button
                        key={tag.key}
                        className={isActive ? "manual-tag-chip active" : "manual-tag-chip"}
                        onClick={() => handleManualTagPick(tag.key)}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className={getPaneClass("status")}>
            <section className="ink-card sketch-panel fill-panel">
              <div className="doodle-titlebar">
                <span>状态</span>
                <span>{new Date(activeState.updatedAt).toLocaleTimeString()}</span>
              </div>

              <div className="doodle-scroll mobile-scene">
                <DoodleMarks className="panel-doodles top-right" />

                <section className="story-block">
                  <div className="subhead">
                    <h3>五维</h3>
                      <span>全数值 999 即可飞升</span>
                  </div>

                  <div className="stats-stack">
                    {STAT_KEYS.map((key) => {
                      const value = activeState.stats[key];
                      const percentage = getStatBarPercent(key, value);

                      return (
                        <article key={key} className="stat-card">
                          <div className="stat-head">
                            <span>{getDimensionLabel(key)}</span>
                            <strong>{value}</strong>
                          </div>
                          <div className={`scribble-bar tone-${getDimensionTone(key)}`}>
                            <span style={{ width: `${percentage}%` }} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>
          </div>

          <div className={getPaneClass("events")}>
            <section className="ink-card sketch-panel fill-panel">
              <div className="doodle-titlebar">
                <span>{`事件 (${todayEventCount}/99)`}</span>
                <span>再次点击以提交状态</span>
              </div>

              <div className="doodle-scroll mobile-scene">
                <DoodleMarks className="panel-doodles center-right" />

                {currentEventCategory ? (
                  <div className="event-stack">
                    <article
                      key={currentEventCategory.id}
                      className={eventPhase === "resolving" ? "event-block resolving" : "event-block"}
                    >
                      <button
                        className="ink-button ghost-ink-button panel-note panel-note-button event-refresh-button"
                        onClick={refreshEventQuestion}
                        disabled={eventPhase === "resolving"}
                      >
                        换一换
                      </button>
                      <div className="event-head">
                        <h3>{currentEventCategory.title}</h3>
                        <p>{currentEventCategory.subtitle}</p>
                      </div>

                      <div className="option-grid">
                        {currentEventCategory.options.map((option) => {
                          const isActive =
                            activeState.draftSelections[currentEventCategory.id] === option.id;

                          return (
                            <button
                              key={option.id}
                              className={
                                isActive
                                  ? eventPhase === "resolving" && resolvingOptionId === option.id
                                    ? "option-card active resolving-selected"
                                    : "option-card active"
                                  : "option-card"
                              }
                              onClick={() => updateSelections(currentEventCategory.id, option.id)}
                            >
                              <strong>{option.label}</strong>
                              <span>{option.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  </div>
                ) : (
                  <section className="story-block">
                    <div className="subhead">
                      <h3>今日已满</h3>
                      <span>99 / 99</span>
                    </div>
                    <p className="doodle-copy">今天的记录次数已经用完，明天再继续。</p>
                  </section>
                )}
              </div>
            </section>
          </div>

          <div className={getPaneClass("logs")}>
            <section className="ink-card sketch-panel fill-panel">
              <div className="doodle-titlebar">
                <span>日志</span>
                <span>回看变化</span>
              </div>

              <div className="doodle-scroll mobile-scene">
                <DoodleMarks className="panel-doodles top-left" />
                <div className="log-group">
                  <div className="subhead">
                    <h3>每日结算</h3>
                    <span>{activeLogs.length} 条</span>
                  </div>

                  <div className="log-list">
                    {activeLogs.length === 0 ? (
                      <p className="mono-copy">还没有新的结算记录。</p>
                    ) : (
                      activeLogs.slice(0, 8).map((log) => (
                        <article key={log.id} className="log-card">
                          <div className="log-meta">
                            <strong>{new Date(log.createdAt).toLocaleString()}</strong>
                            <span>{log.narrative}</span>
                          </div>
                          <div className="log-delta-grid">
                            {(["hp", "ep", "mood", "stress", "focus"] as DimensionKey[])
                              .map((key) => {
                                const total = (log.baseDelta[key] ?? 0) + (log.ruleDelta[key] ?? 0);

                                if (total === 0) {
                                  return null;
                                }

                                return (
                                  <span key={`${log.id}-${key}`} className="delta-inline">
                                    {getCompactDimensionLabel(key)}
                                    {formatDelta(total)}
                                  </span>
                                );
                              })
                              .filter(Boolean)}
                          </div>
                          <div className="tag-ribbon">
                            {log.entries?.length
                              ? (() => {
                                  const grouped = new Map<string, { label: string; count: number }>();

                                  log.entries.forEach((entry) => {
                                    const key = entry.categoryId === "manual-tags"
                                      ? entry.optionLabel
                                      : `${entry.categoryTitle}:${entry.optionLabel}`;
                                    const existing = grouped.get(key);

                                    if (existing) {
                                      existing.count += 1;
                                    } else {
                                      grouped.set(key, {
                                        label:
                                          entry.categoryId === "manual-tags"
                                            ? entry.optionLabel
                                            : `${entry.categoryTitle}: ${entry.optionLabel}`,
                                        count: 1,
                                      });
                                    }
                                  });

                                  return Array.from(grouped.entries()).map(([key, value]) => (
                                    <span key={`${log.id}-${key}`}>
                                      {value.label}
                                      {value.count > 1 ? ` ${value.count}` : ""}
                                    </span>
                                  ));
                                })()
                              : Object.entries(log.selections).map(([categoryId, optionId]) => {
                                  const category = dailyEventCategories.find((item) => item.id === categoryId);
                                  const option = category ? getOptionById(category, optionId) : null;

                                  return option ? (
                                    <span key={`${log.id}-${option.id}`}>
                                      {category?.title}: {option.label}
                                    </span>
                                  ) : null;
                                })}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <div className="log-group">
                  <div className="subhead">
                    <h3>管理员校准</h3>
                    <span>{activeAdminLogs.length} 条</span>
                  </div>

                  <div className="log-list">
                    {activeAdminLogs.length === 0 ? (
                      <p className="mono-copy">当前角色还没有管理员校准记录。</p>
                    ) : (
                      activeAdminLogs.slice(0, 8).map((log) => (
                        <article key={log.id} className="log-card">
                          <div className="log-meta">
                            <strong>{new Date(log.createdAt).toLocaleString()}</strong>
                            <span>
                              管理员校准：{getDimensionLabel(log.dimension)} {formatDelta(log.delta)}
                            </span>
                          </div>
                          <p className="mono-copy">{log.reason}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {currentUser.role === "admin" ? (
            <div className={getPaneClass("admin")}>
              <section className="ink-card sketch-panel fill-panel">
                <div className="doodle-titlebar">
                  <span>校准</span>
                  <span>管理员专用</span>
                </div>

                <div className="doodle-scroll mobile-scene">
                  <DoodleMarks className="panel-doodles bottom-right" />
                  <p className="panel-note">这里只做人工修正</p>

                  <div className="field-stack">
                    <label className="field">
                      <span>校准维度</span>
                      <select
                        value={calibrationDimension}
                        onChange={(event) =>
                          setCalibrationDimension(event.target.value as keyof StatBlock)
                        }
                      >
                        {STAT_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {getDimensionLabel(key)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>修改模式</span>
                      <select
                        value={calibrationMode}
                        onChange={(event) =>
                          setCalibrationMode(event.target.value as CalibrationMode)
                        }
                      >
                        <option value="delta">增减</option>
                        <option value="set">直接设值</option>
                      </select>
                    </label>

                    <label className="field">
                      <span>{calibrationMode === "delta" ? "增减数值" : "目标数值"}</span>
                      <input
                        type="number"
                        value={calibrationValue}
                        onChange={(event) => setCalibrationValue(event.target.value)}
                      />
                    </label>

                    <div className="quick-buttons">
                      {[-10, -5, -1, 1, 5, 10].map((value) => (
                        <button
                          key={value}
                          className="ink-button ghost-ink-button"
                          onClick={() => {
                            setCalibrationMode("delta");
                            setCalibrationValue(String(value));
                          }}
                        >
                          {formatDelta(value)}
                        </button>
                      ))}
                    </div>

                    <label className="field">
                      <span>原因模板</span>
                      <select
                        value={calibrationReason}
                        onChange={(event) => setCalibrationReason(event.target.value)}
                      >
                        {REASON_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>补充说明</span>
                      <textarea
                        value={calibrationNote}
                        onChange={(event) => setCalibrationNote(event.target.value)}
                        placeholder="例如：今天精神状态明显比模型判断更稳定"
                      />
                    </label>
                  </div>
                </div>

                <div className="admin-actions">
                  <button className="ink-button primary-ink-button" onClick={applyCalibration}>
                    写入校准
                  </button>
                  <button className="ink-button secondary-ink-button" onClick={resetDemoData}>
                    重置本地数据
                  </button>
                </div>

                <div className="rule-ribbon">
                  <span>{authRules.registrationEnabled ? "开放注册" : "禁止注册"}</span>
                  <span>
                    {authRules.adminCanCalibrateDimensions ? "允许管理员校准" : "禁用管理员校准"}
                  </span>
                </div>
              </section>
            </div>
          ) : null}
        </section>

        <nav
          className="mobile-tabs ink-card bottom-tabs"
          aria-label="mobile sections"
          style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}
        >
          {mobileTabs.map((tab) => (
            <button
              key={tab.id}
              className={mobileTab === tab.id ? "tab-button active" : "tab-button"}
              onClick={() => setMobileTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

