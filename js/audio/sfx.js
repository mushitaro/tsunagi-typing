// js/audio/sfx.js
//
// Web Audio API を使った効果音の「その場合成」モジュール。
// 外部音声ファイルに一切依存しないため、PWAのオフラインキャッシュが容易になり、
// 著作権フリーで自由に配布できる。
//
// 使い方:
//   import { createSfx } from './audio/sfx.js';
//   const sfx = createSfx();
//   window.addEventListener('pointerdown', () => sfx.resumeContext(), { once: true });
//   ...
//   sfx.laser();

/**
 * 効果音セットを生成するファクトリ関数。
 * AudioContext は初回のメソッド呼び出し（もしくは resumeContext()）まで生成を遅延する。
 * @returns {{
 *   laser: () => void,
 *   hit: () => void,
 *   explode: () => void,
 *   wrongKey: () => void,
 *   uiClick: () => void,
 *   wordStart: () => void,
 *   fanfare: () => void,
 *   resumeContext: () => void,
 * }}
 */
export function createSfx() {
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {AudioBuffer | null} キャッシュ済みのホワイトノイズバッファ（explode()で使い回す） */
  let noiseBuffer = null;

  function getContext() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      ctx = new AudioContextClass();
    }
    return ctx;
  }

  function resumeContext() {
    const audioCtx = getContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // 自動再生ポリシーで拒否された場合も静かに無視する。
      });
    }
  }

  /**
   * 音量エンベロープ付きの GainNode を作る共通ヘルパー。
   * exponentialRampToValueAtTime はゼロを許容しないため、
   * 開始/終了ともに極小値（0だと聞こえないほど小さい値）を使ってプチノイズを防ぐ。
   */
  function createEnvelope(audioCtx, { peak = 0.3, attack = 0.005, decay = 0.15, startTime }) {
    const gain = audioCtx.createGain();
    const t0 = startTime;
    const minValue = 0.0001;
    gain.gain.setValueAtTime(minValue, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(minValue, t0 + attack + decay);
    return gain;
  }

  /**
   * オシレーター1つ分の短い音を鳴らす。
   * @param {object} opts
   * @param {OscillatorType} opts.type 波形
   * @param {number} opts.startFreq 開始周波数(Hz)
   * @param {number} [opts.endFreq] 終了周波数(Hz)。省略時はスイープしない。
   * @param {number} [opts.duration] 音の長さ(秒)
   * @param {number} [opts.peak] ピーク音量(0-1)
   * @param {number} [opts.attack] アタック時間(秒)
   */
  function playTone({ type, startFreq, endFreq, duration = 0.15, peak = 0.25, attack = 0.005 }) {
    const audioCtx = getContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== undefined && endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), now + duration);
    }

    const decay = Math.max(duration - attack, 0.01);
    const gain = createEnvelope(audioCtx, { peak, attack, decay, startTime: now });

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + attack + decay + 0.02);
  }

  function getNoiseBuffer(audioCtx) {
    if (noiseBuffer) return noiseBuffer;
    const durationSeconds = 0.3;
    const sampleRate = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, sampleRate * durationSeconds, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return noiseBuffer;
  }

  /**
   * laser() -- 正解キー入力ごとの短い「ピュン」というレーザー音。
   * 高音から低音へ素早く下がるスイープが定番。
   */
  function laser() {
    playTone({
      type: 'sawtooth',
      startFreq: 1600,
      endFreq: 320,
      duration: 0.1,
      peak: 0.18,
      attack: 0.003,
    });
  }

  /**
   * hit() -- レーザー着弾時の小さな「コツン」というヒット音。
   * laser() と被らないよう短く軽い高音のクリック的な音にする。
   */
  function hit() {
    playTone({
      type: 'square',
      startFreq: 900,
      endFreq: 700,
      duration: 0.05,
      peak: 0.12,
      attack: 0.002,
    });
  }

  /**
   * explode() -- 単語打ち終わり時の少し派手めな「ドカーン」音。
   * ホワイトノイズ（バースト的な破裂感）+ 低音オシレーター（ドン、という重み）を重ねる。
   * うるさくなりすぎないよう短めかつ音量を抑える。
   */
  function explode() {
    const audioCtx = getContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const duration = 0.35;

    // ノイズ成分: ローパスフィルタで高域を削り、破裂音っぽくしすぎない。
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = getNoiseBuffer(audioCtx);

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + duration);

    const noiseGain = createEnvelope(audioCtx, {
      peak: 0.22,
      attack: 0.005,
      decay: duration - 0.02,
      startTime: now,
    });

    noiseSource
      .connect(noiseFilter)
      .connect(noiseGain)
      .connect(audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // 低音成分: ドンという重みを追加する。
    const boom = audioCtx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(150, now);
    boom.frequency.exponentialRampToValueAtTime(40, now + duration * 0.8);

    const boomGain = createEnvelope(audioCtx, {
      peak: 0.3,
      attack: 0.004,
      decay: duration * 0.8,
      startTime: now,
    });

    boom.connect(boomGain).connect(audioCtx.destination);
    boom.start(now);
    boom.stop(now + duration);
  }

  /**
   * wrongKey() -- ミス入力時の、罰っぽくない優しい「ぽよん」ブリップ音。
   * 低めの柔らかいサイン波で、不快な高音は避ける。
   */
  function wrongKey() {
    const audioCtx = getContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const duration = 0.16;

    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    // 少し下がってからほんの少し戻る「ぽよん」という揺れを表現する。
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, now + duration);

    const gain = createEnvelope(audioCtx, {
      peak: 0.15,
      attack: 0.01,
      decay: duration - 0.01,
      startTime: now,
    });

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /**
   * uiClick() -- ボタンタップ時の軽いクリック音。
   */
  function uiClick() {
    playTone({
      type: 'triangle',
      startFreq: 1000,
      endFreq: 1000,
      duration: 0.05,
      peak: 0.14,
      attack: 0.002,
    });
  }

  /**
   * wordStart() -- 新しい単語が始まる時の短い「ピコン」という予告音。
   * 低音から高音へ素早く上がる、明るい印象のスイープ。
   */
  function wordStart() {
    playTone({
      type: 'sine',
      startFreq: 500,
      endFreq: 1100,
      duration: 0.12,
      peak: 0.18,
      attack: 0.004,
    });
  }

  /**
   * fanfare() -- 称号ランクアップ時の、明るい「テッテッテッテー♪」というごほうび音。
   * ドミソド（Cメジャー・アルペジオ）を少しずつ遅らせて鳴らす、チップチューン風のファンファーレ。
   * 外部音源に頼らず playTone を時間差で重ねるだけなので、他の効果音と同じく合成のみで完結する。
   */
  function fanfare() {
    const audioCtx = getContext();
    if (!audioCtx) return;

    // ド(C5) ミ(E5) ソ(G5) ド(C6) の順に上がっていく、勝ちどきのアルペジオ。
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const stepMs = 110;
    notes.forEach((freq, i) => {
      const isLast = i === notes.length - 1;
      setTimeout(() => {
        playTone({
          type: 'square',
          startFreq: freq,
          endFreq: freq,
          duration: isLast ? 0.4 : 0.14,
          peak: isLast ? 0.2 : 0.16,
          attack: 0.004,
        });
      }, i * stepMs);
    });
  }

  return {
    laser,
    hit,
    explode,
    wrongKey,
    uiClick,
    wordStart,
    fanfare,
    resumeContext,
  };
}
