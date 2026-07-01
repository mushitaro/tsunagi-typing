import { createEventBus } from './core/event-bus.js';
import { createSceneManager } from './core/scene-manager.js';
import { createGameLoop } from './core/game-loop.js';
import { installInput } from './core/input.js';
import { loadWords } from './data/word-loader.js';
import { loadSpriteLibrary } from './data/sprite-loader.js';
import { createSfx } from './audio/sfx.js';

import { titleScene } from './scenes/title-scene.js';
import { profileSelectScene } from './scenes/profile-select-scene.js';
import { profileCreateScene } from './scenes/profile-create-scene.js';
import { modeSelectScene } from './scenes/mode-select-scene.js';
import { gameScene } from './scenes/game-scene.js';
import { resultsScene } from './scenes/results-scene.js';

function main() {
  const wordDataPromise = loadWords();
  const spriteLibraryPromise = loadSpriteLibrary();
  const sfx = createSfx();
  const eventBus = createEventBus();

  const appCtx = { eventBus, sfx, wordDataPromise, spriteLibraryPromise };

  const sceneManager = createSceneManager(appCtx);
  appCtx.sceneManager = sceneManager;

  sceneManager.register(titleScene);
  sceneManager.register(profileSelectScene);
  sceneManager.register(profileCreateScene);
  sceneManager.register(modeSelectScene);
  sceneManager.register(gameScene);
  sceneManager.register(resultsScene);

  installInput(sceneManager);

  const loop = createGameLoop({
    onUpdate: (dt) => sceneManager.update(dt),
    onRender: () => sceneManager.render(),
  });

  // ブラウザの自動再生ポリシー対策: 最初のユーザー操作でAudioContextを起こす
  window.addEventListener('pointerdown', () => sfx.resumeContext(), { once: true });
  window.addEventListener('keydown', () => sfx.resumeContext(), { once: true });

  sceneManager.goto('title');
  loop.start();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('[sw] registration failed', err);
      });
    });
  }
}

main();
