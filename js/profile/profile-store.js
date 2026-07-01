/**
 * 子どもプロフィールを localStorage に保存・読込するモジュール。
 * ログイン・バックエンドなし。素の ES Modules・外部依存なし。
 *
 * 保存する状態の形 (1つの JSON オブジェクトとしてまるごと保存・読込):
 * {
 *   version: 1,
 *   profiles: [
 *     {
 *       id: "profile-xxxxxxxx",
 *       name: "ゆうと",
 *       avatarId: "crab-01",
 *       createdAt: "2026-07-01T00:00:00.000Z",
 *       stats: {
 *         "sea-creatures": { bestScore, wordsCleared, roundsPlayed },
 *         "math": { bestScore, wordsCleared, roundsPlayed },
 *       },
 *       lastLanguage: "ja",
 *     },
 *   ],
 *   activeProfileId: "profile-xxxxxxxx",
 * }
 *
 * localStorage が使えない環境 (プライベートブラウジング等で例外を投げる場合) でも
 * ゲーム全体がクラッシュしないよう、すべての読み書きは try/catch で例外を握りつぶし、
 * 安全側 (読込失敗時は空の状態、保存失敗時はコンソール警告のみ) にフォールバックする。
 */

const STORAGE_KEY = 'tsunagi-typing:profiles';
const CURRENT_VERSION = 1;
const DEFAULT_CATEGORIES = ['sea-creatures', 'math'];

function createEmptyState() {
  return { version: CURRENT_VERSION, profiles: [], activeProfileId: null };
}

function createEmptyStats() {
  return { bestScore: 0, wordsCleared: 0, roundsPlayed: 0 };
}

function generateProfileId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `profile-${random}`;
}

/**
 * localStorage から読み込む。キーが存在しない/JSONが壊れている場合は
 * 空の状態を返し、例外は投げない。
 * @returns {{ version: number, profiles: Array<object>, activeProfileId: string|null }}
 */
export function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyState();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
      return createEmptyState();
    }

    return {
      version: typeof parsed.version === 'number' ? parsed.version : CURRENT_VERSION,
      profiles: parsed.profiles,
      activeProfileId: parsed.activeProfileId ?? null,
    };
  } catch (err) {
    console.warn('[profile-store] loadProfiles failed, falling back to empty state.', err);
    return createEmptyState();
  }
}

/**
 * state をまるごと JSON.stringify して localStorage に保存する。
 * 保存に失敗しても例外は投げず、コンソール警告に留める。
 * @param {{ version: number, profiles: Array<object>, activeProfileId: string|null }} state
 */
export function saveProfiles(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[profile-store] saveProfiles failed. Changes may not persist.', err);
  }
}

/**
 * 新しいプロフィールを作成し、保存して返す。
 * @param {string} name
 * @param {string} avatarId
 * @returns {object} 作成した profile
 */
export function createProfile(name, avatarId) {
  const state = loadProfiles();

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const finalName = trimmedName || `プレイヤー${state.profiles.length + 1}`;

  const stats = {};
  for (const categoryId of DEFAULT_CATEGORIES) {
    stats[categoryId] = createEmptyStats();
  }

  const profile = {
    id: generateProfileId(),
    name: finalName,
    avatarId: avatarId ?? null,
    createdAt: new Date().toISOString(),
    stats,
    lastLanguage: 'ja',
  };

  state.profiles.push(profile);
  state.activeProfileId = profile.id;

  saveProfiles(state);
  return profile;
}

/**
 * プロフィールを削除する。削除対象が activeProfileId だった場合は
 * 残りの先頭プロフィールの id (なければ null) に付け替える。
 * @param {string} profileId
 */
export function deleteProfile(profileId) {
  const state = loadProfiles();

  state.profiles = state.profiles.filter((p) => p.id !== profileId);

  if (state.activeProfileId === profileId) {
    state.activeProfileId = state.profiles[0]?.id ?? null;
  }

  saveProfiles(state);
}

/**
 * アクティブなプロフィールを切り替える。
 * @param {string} profileId
 */
export function setActiveProfile(profileId) {
  const state = loadProfiles();

  const exists = state.profiles.some((p) => p.id === profileId);
  state.activeProfileId = exists ? profileId : null;

  saveProfiles(state);
}

/**
 * アクティブなプロフィールを取得する。無ければ null。
 * @returns {object|null}
 */
export function getActiveProfile() {
  const state = loadProfiles();
  if (!state.activeProfileId) return null;
  return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
}

/**
 * ラウンドの結果をプロフィールの統計に記録する。
 * categoryId が未知のカテゴリでも自動的に stats エントリを作成する。
 * @param {string} profileId
 * @param {string} categoryId
 * @param {{ score: number, wordsCleared: number, accuracy?: number }} result
 */
export function recordRoundResult(profileId, categoryId, { score = 0, wordsCleared = 0, accuracy } = {}) {
  const state = loadProfiles();

  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return;

  if (!profile.stats || typeof profile.stats !== 'object') {
    profile.stats = {};
  }

  if (!profile.stats[categoryId]) {
    profile.stats[categoryId] = createEmptyStats();
  }

  const categoryStats = profile.stats[categoryId];
  categoryStats.bestScore = Math.max(categoryStats.bestScore ?? 0, score);
  categoryStats.wordsCleared = (categoryStats.wordsCleared ?? 0) + wordsCleared;
  categoryStats.roundsPlayed = (categoryStats.roundsPlayed ?? 0) + 1;
  // accuracy は現状 stats 構造に保存フィールドが無いため受け取るだけで無視する（将来の拡張用）。
  void accuracy;

  saveProfiles(state);
}

/**
 * プロフィールの最後に選んだ言語を更新する。
 * @param {string} profileId
 * @param {string} lang
 */
export function setLastLanguage(profileId, lang) {
  const state = loadProfiles();

  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return;

  profile.lastLanguage = lang;

  saveProfiles(state);
}
