// js/audio/speech.js
//
// window.speechSynthesis を使った読み上げ（TTS）の薄いラッパー。
// 対応していないブラウザでは何もせず静かに戻り、ゲームプレイを止めない。

const LANG_MAP = {
  ja: 'ja-JP',
  en: 'en-US',
};

/** voiceschanged を一度だけ待つためのフラグ（複数回登録しないようにする） */
let voicesChangedHandlerAttached = false;

/**
 * このブラウザで音声合成が使えるかどうかを返す。
 * @returns {boolean}
 */
export function isSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * テキストを読み上げる。
 * 前の発話は cancel() でキャンセルしてから新しい発話を開始するため、
 * スピーカーボタンを連打しても発話が詰まらない。
 * speechSynthesis が使えない環境では例外を投げず何もしない。
 *
 * @param {string} text 読み上げるテキスト
 * @param {'ja' | 'en'} lang 言語コード
 */
export function speak(text, lang) {
  if (!isSpeechAvailable()) return;
  if (!text) return;

  const synth = window.speechSynthesis;

  try {
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[lang] || LANG_MAP.ja;

    const speakNow = () => {
      try {
        synth.speak(utterance);
      } catch {
        // 発話中の予期せぬエラーはゲームを止めないよう無視する。
      }
    };

    // 初回は getVoices() が空配列を返すブラウザがあるため、
    // その場合だけ 'voiceschanged' を一度だけ待ってから発話する。
    const voices = synth.getVoices();
    if (voices.length === 0 && !voicesChangedHandlerAttached) {
      voicesChangedHandlerAttached = true;
      const onVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged);
        voicesChangedHandlerAttached = false;
        speakNow();
      };
      synth.addEventListener('voiceschanged', onVoicesChanged);
      // フォールバック: voiceschanged が発火しない環境向けに、
      // 待たずにそのまま発話も試みる（対応ブラウザでは概ね問題なく再生される）。
      speakNow();
    } else {
      speakNow();
    }
  } catch {
    // speechSynthesis 周りで想定外の例外が出てもゲームプレイをブロックしない。
  }
}
