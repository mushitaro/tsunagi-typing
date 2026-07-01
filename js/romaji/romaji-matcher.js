import { KANA_TO_ROMAJI, SOKUON, YOON_SMALL } from './kana-table.js';

/** かな文字列を拗音（きゃ等）をまとめた最小単位トークンに分割する。 */
function tokenizeKana(kana) {
  const chars = Array.from(kana);
  const tokens = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    if (next && YOON_SMALL.has(next) && KANA_TO_ROMAJI[c + next]) {
      tokens.push(c + next);
      i++;
      continue;
    }
    tokens.push(c);
  }
  return tokens;
}

/** 促音（っ）を「次の子音を2重化した候補セット」を持つ1ユニットに展開する。 */
function expandSokuon(tokens) {
  const units = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok === SOKUON) {
      const next = tokens[i + 1];
      const nextVariants = next ? KANA_TO_ROMAJI[next] : null;
      if (!nextVariants) {
        units.push({ kanaUnit: tok, acceptedVariants: ['t', 'tt'] });
        continue;
      }
      const doubled = nextVariants.map((v) => v[0] + v);
      units.push({ kanaUnit: tok + next, acceptedVariants: doubled });
      i++;
      continue;
    }

    const variants = KANA_TO_ROMAJI[tok];
    if (!variants) {
      // 未知の記号等はそのまま1文字入力として扱う
      units.push({ kanaUnit: tok, acceptedVariants: [tok] });
      continue;
    }
    units.push({ kanaUnit: tok, acceptedVariants: variants });
  }
  return units;
}

/**
 * かな文字列から入力判定プランを構築する。単語開始時に1回だけ呼ぶ。
 * 戻り値: { units: [{kanaUnit, acceptedVariants, displayRomaji}], totalKeystrokes }
 */
export function buildMatchPlan(kana) {
  const tokens = tokenizeKana(kana);
  const rawUnits = expandSokuon(tokens);
  const units = rawUnits.map((u) => ({ ...u, displayRomaji: u.acceptedVariants[0] }));
  const totalKeystrokes = units.reduce((sum, u) => sum + u.displayRomaji.length, 0);
  return { units, totalKeystrokes };
}

/**
 * ステートフルな入力判定インスタンスを作る。
 * 1文字正しく打つごとに 'advance' か 'pending' を返す（=毎回レーザー1発分としてカウントする）。
 * 誤入力は 'mismatch'（バッファは変化しない＝現在のユニットを打ち直す）。
 */
export function createMatcher(matchPlan) {
  let unitIndex = 0;
  let buffer = '';
  let keystrokesDone = 0;

  function currentUnit() {
    return matchPlan.units[unitIndex];
  }

  function pressKey(rawChar) {
    const unit = currentUnit();
    if (!unit) return { status: 'mismatch', isWordComplete: true, unitIndex };

    const char = rawChar.toLowerCase();
    const attempt = buffer + char;
    const variants = unit.acceptedVariants;
    const isExact = variants.includes(attempt);
    const isPrefix = !isExact && variants.some((v) => v.startsWith(attempt));

    if (!isExact && !isPrefix) {
      return { status: 'mismatch', isWordComplete: false, unitIndex };
    }

    keystrokesDone += 1;

    if (isExact) {
      buffer = '';
      unitIndex += 1;
      const isWordComplete = unitIndex >= matchPlan.units.length;
      return { status: 'advance', isWordComplete, unitIndex };
    }

    buffer = attempt;
    return { status: 'pending', isWordComplete: false, unitIndex };
  }

  function getNextHintChar() {
    const unit = currentUnit();
    if (!unit) return '';
    const stillValid = unit.acceptedVariants.filter((v) => v.startsWith(buffer));
    const canonical = unit.acceptedVariants[0];
    const chosen = stillValid.includes(canonical) ? canonical : stillValid[0];
    return chosen ? chosen[buffer.length] ?? '' : '';
  }

  function getProgress() {
    return {
      cursorUnit: unitIndex,
      totalUnits: matchPlan.units.length,
      keystrokesDone,
      totalKeystrokes: matchPlan.totalKeystrokes,
    };
  }

  function reset() {
    unitIndex = 0;
    buffer = '';
    keystrokesDone = 0;
  }

  return { pressKey, getNextHintChar, getProgress, reset };
}
