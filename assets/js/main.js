(() => {
  'use strict';

  // Scene 01 is the road-facing gate. Scene 02 begins after the visitor enters.
  const page = document.documentElement;
  const gate = document.querySelector('#top');
  const arrival = document.querySelector('#arrival');
  const pathWorld = document.querySelector('.path-world');
  const radioScene = document.querySelector('#radio');
  const travelDialog = document.querySelector('#travel-dialog');
  const travelTitle = document.querySelector('#travel-title');
  const travelIntro = document.querySelector('#travel-intro');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const roomIds = new Set(['store', 'bakehouse', 'little-wilds', 'garden', 'woods', 'radio', 'lantern', 'cat-cottage', 'house', 'barn', 'support']);
  let travelOpener = null;
  let currentRoom = null;
  let walkingRoute = false;
  const walkOrder = ['store', 'bakehouse', 'little-wilds', 'garden', 'woods', 'radio', 'lantern', 'cat-cottage', 'house'];
  const walkNames = ['Store', 'Bakehouse', 'Treehouse', 'Garden', 'Woods & Trails', 'Radio', 'Lantern', 'Cat Cottage', 'House'];
  const continueFoot = document.querySelector('#continue-foot');

  function moveToArrival(updateHistory = true) {
    page.classList.add('entered');
    radioScene?.classList.remove('is-open');
    page.classList.remove('exploring', 'gate-transition');
    walkingRoute = false;
    if (continueFoot) continueFoot.hidden = true;
    currentRoom?.classList.remove('is-current');
    currentRoom = null;
    pathWorld?.classList.remove('has-current');
    if (updateHistory) history.replaceState(null, '', '#arrival');
    window.scrollTo({ top: 0, behavior: 'instant' });
    arrival?.focus({ preventScroll: true });
  }

  function moveToRoom(id, updateHistory = true) {
    const roomId = id === 'support-cats' || id === 'support-build' ? 'support' : id;
    if (!roomIds.has(roomId)) return;
    const target = document.getElementById(roomId);
    if (!target) return;
    currentRoom?.classList.remove('is-current');
    radioScene?.classList.remove('is-open');
    currentRoom = target;
    target.classList.add('is-current');
    pathWorld?.classList.toggle('has-current', pathWorld.contains(target));
    page.classList.add('entered', 'exploring');
    page.classList.remove('gate-transition');
    const walkIndex = walkOrder.indexOf(roomId);
    if (continueFoot) {
      continueFoot.hidden = !walkingRoute || walkIndex < 0;
      continueFoot.textContent = walkIndex === walkOrder.length - 1
        ? 'Finish the walk at arrival →'
        : `Continue on foot to ${walkNames[walkIndex + 1]} →`;
    }
    if (updateHistory) history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = target.querySelector('h2');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  page.classList.add('gated');
  const initialId = location.hash.slice(1);
  if (initialId === 'arrival' || initialId === 'property') moveToArrival(false);
  else if (roomIds.has(initialId) || ['support-cats', 'support-build'].includes(initialId)) moveToRoom(initialId, false);

  function enterProperty(event) {
    event.preventDefault();
    if (page.classList.contains('entered')) return;
    page.classList.add('gate-transition');
    const finish = () => moveToArrival();
    if (reducedMotion.matches) finish();
    else window.setTimeout(finish, 450);
  }

  document.querySelectorAll('a[href="#property"]').forEach((link) => link.addEventListener('click', enterProperty));
  document.querySelectorAll('a[href="#top"]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    travelDialog?.close?.();
    page.classList.remove('entered', 'exploring', 'gate-transition');
    walkingRoute = false;
    currentRoom?.classList.remove('is-current');
    currentRoom = null;
    history.replaceState(null, '', '#top');
    gate?.scrollIntoView({ behavior: 'instant' });
    document.querySelector('.gate-enter')?.focus({ preventScroll: true });
  }));
  document.querySelector('#return-arrival')?.addEventListener('click', () => moveToArrival());
  continueFoot?.addEventListener('click', () => {
    const index = walkOrder.indexOf(currentRoom?.id);
    if (index < 0 || index === walkOrder.length - 1) moveToArrival();
    else moveToRoom(walkOrder[index + 1]);
  });

  function openTravel(kind, opener) {
    if (!travelDialog || typeof travelDialog.showModal !== 'function') return;
    travelOpener = opener;
    walkingRoute = kind === 'foot';
    const footStart = document.querySelector('#foot-start');
    if (footStart) footStart.hidden = kind !== 'foot';
    const copy = {
      cart: ['Hop in', 'Where to? Choose a destination and we’ll take you there.'],
      foot: ['Wander on foot', 'Take the scenic route at your own pace. Choose a first stop; return to arrival to choose another path.'],
      signs: ['Follow a sign', 'Choose one of the destinations marked in the arrival scene.'],
      'store-bake': ['Store & Bakehouse', 'This sign points to two places. Choose which door to visit first.'],
      'bake-signs': ['Follow a Bakehouse sign', 'Choose Store, Treehouse, Garden, or Arrival & Gate.'],
      'tree-signs': ['Follow a Treehouse sign', 'Choose a destination marked on the Treehouse signpost.'],
      'garden-signs': ['Follow a Garden sign', 'Choose a destination marked on the Garden signpost.'],
      'woods-signs': ['Follow a property sign', 'Choose a destination marked on the left signpost.'],
      'woods-trails': ['Choose a trail', 'These four trail adventures are coming soon.'],
      'radio-signs': ['Follow a Radio sign', 'Choose a destination marked on the Radio signpost.'],
      'lantern-signs': ['Follow a Lantern sign', 'Choose a destination marked on The Lantern signpost.'],
      'house-signs': ['Follow a House sign', 'Choose a destination marked on The House signpost.'],
      'barn-nearby': ['Follow a Barn sign', 'Choose a nearby place, or return to the Crossroads for the full property chooser.']
    }[kind] || ['Choose your path', 'Choose where to go next.'];
    travelTitle.textContent = copy[0];
    travelIntro.textContent = copy[1];
    travelDialog.querySelectorAll('[data-go]').forEach((button) => {
      button.hidden = (kind === 'store-bake' && !['store', 'bakehouse'].includes(button.dataset.go)) || (kind === 'bake-signs' && !['store', 'little-wilds', 'garden'].includes(button.dataset.go)) || (kind === 'tree-signs' && !['store', 'bakehouse', 'garden', 'woods', 'lantern', 'radio', 'cat-cottage'].includes(button.dataset.go)) || (kind === 'garden-signs' && !['store', 'bakehouse', 'little-wilds', 'woods', 'lantern', 'radio', 'cat-cottage'].includes(button.dataset.go)) || (kind === 'woods-signs' && !['store', 'bakehouse', 'little-wilds', 'garden', 'lantern', 'radio', 'cat-cottage'].includes(button.dataset.go)) || (kind === 'radio-signs' && !['store', 'bakehouse', 'little-wilds', 'garden', 'woods', 'lantern', 'cat-cottage'].includes(button.dataset.go)) || (kind === 'lantern-signs' && !['store', 'bakehouse', 'little-wilds', 'garden', 'woods', 'radio', 'cat-cottage'].includes(button.dataset.go)) || (kind === 'house-signs' && !['store', 'bakehouse', 'little-wilds', 'garden', 'woods', 'radio', 'cat-cottage', 'lantern'].includes(button.dataset.go)) || (kind === 'barn-nearby' && !['garden', 'little-wilds', 'store', 'bakehouse', 'woods'].includes(button.dataset.go)) || kind === 'woods-trails';
    });
    const arrivalChoice = travelDialog.querySelector('[data-return-arrival]');
    if (arrivalChoice) arrivalChoice.hidden = !['bake-signs', 'tree-signs', 'garden-signs', 'woods-signs', 'radio-signs', 'lantern-signs', 'barn-nearby'].includes(kind);
    travelDialog.querySelectorAll('.trail-choice').forEach((button) => { button.hidden = kind !== 'woods-trails'; });
    travelDialog.showModal();
    travelTitle.tabIndex = -1;
    travelTitle.focus({ preventScroll: true });
  }

  document.querySelector('#foot-start')?.addEventListener('click', () => {
    travelOpener = null;
    travelDialog?.close();
    walkingRoute = true;
    moveToRoom('store');
  });

  document.addEventListener('click', (event) => {
    const openRadio = event.target.closest('[data-open-radio]');
    if (openRadio) {
      radioScene?.classList.add('is-open');
      const playerHeading = radioScene?.querySelector('#radio-title');
      if (playerHeading) { playerHeading.tabIndex = -1; playerHeading.focus({ preventScroll: true }); }
      radioScene?.querySelector('.radio-experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const returnSign = event.target.closest('[data-return-arrival]');
    if (returnSign) {
      if (travelDialog?.open) { travelOpener = null; travelDialog.close(); }
      moveToArrival();
      return;
    }
    const travel = event.target.closest('[data-travel]');
    if (travel) { openTravel(travel.dataset.travel, travel); return; }
    const go = event.target.closest('[data-go]');
    if (go) {
      if (travelDialog?.open) { travelOpener = null; travelDialog.close(); }
      else walkingRoute = false;
      moveToRoom(go.dataset.go);
      return;
    }
    const anchor = event.target.closest('a[href^="#"]');
    const id = anchor?.getAttribute('href').slice(1);
    if (id && (roomIds.has(id) || ['support-cats', 'support-build'].includes(id))) {
      event.preventDefault();
      walkingRoute = false;
      moveToRoom(id);
    }
  });
  travelDialog?.querySelector('.travel-close')?.addEventListener('click', () => travelDialog.close());
  travelDialog?.addEventListener('click', (event) => {
    if (event.target === travelDialog) travelDialog.close();
  });
  travelDialog?.addEventListener('close', () => {
    travelOpener?.focus({ preventScroll: true });
    travelOpener = null;
  });

  const menuToggle = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#site-nav');

  function closeMenu(restoreFocus = false) {
    if (!menuToggle || !navigation) return;
    const wasOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    if (restoreFocus && wasOpen) menuToggle.focus();
  }

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);
    });
    // Enable the compact menu only after its controls are wired up.
    document.documentElement.classList.add('js');
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu(true);
    });
    window.matchMedia('(min-width: 881px)').addEventListener('change', () => closeMenu());
  }

  const dialog = document.querySelector('#destination-dialog');
  const destinationContent = document.querySelector('#destination-content');
  let destinationOpener = null;

  if (dialog && destinationContent && typeof dialog.showModal === 'function') {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-destination]');
      if (!link) return;
      const name = link.dataset.destination;
      if (!['store', 'bakehouse', 'little-wilds', 'garden', 'seed-library', 'woods', 'trails', 'lantern', 'cat-cottage', 'cat-purpose', 'house-story', 'house-help', 'house-founders', 'barn-room', 'barn-feed'].includes(name)) return;
      if (travelDialog?.open) { travelOpener = null; travelDialog.close(); }
      const template = document.querySelector(`#room-${name}`);
      if (!(template instanceof HTMLTemplateElement)) return;

      const fragment = template.content.cloneNode(true);
      const heading = fragment.querySelector('h2[id]');
      if (!heading) return;
      const previousOpener = destinationOpener;
      if (!dialog.open) destinationOpener = link;
      destinationContent.replaceChildren(fragment);
      dialog.setAttribute('aria-labelledby', heading.id);
      try {
        if (!dialog.open) dialog.showModal();
      } catch {
        destinationOpener = previousOpener;
        return; // Preserve the original link if this browser cannot open the room.
      }
      event.preventDefault();
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      dialog.scrollTop = 0;
      destinationContent.scrollTop = 0;
    });
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-dialog]')) {
        dialog.close();
        return;
      }
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      destinationContent.replaceChildren();
      dialog.removeAttribute('aria-labelledby');
      if (destinationOpener?.isConnected) {
        // A mobile navigation link is hidden after opening a room.
        const focusTarget = destinationOpener.getClientRects().length ? destinationOpener : menuToggle;
        focusTarget?.focus({ preventScroll: true });
      }
      destinationOpener = null;
    });
  }

  const radioToggle = document.querySelector('#radio-toggle');
  const radioStatus = document.querySelector('#radio-status');
  const radioVolume = document.querySelector('#radio-volume');
  if (!radioToggle || !radioStatus || !radioVolume) return;

  const radioIcon = radioToggle.querySelector('[data-radio-icon]');
  const radioLabel = radioToggle.querySelector('[data-radio-label]');
  const stationButtons = [...document.querySelectorAll('[data-station]')];
  const stationNames = { rain: 'Rain on the roof', night: 'Evening woods', hearth: 'By the hearth' };
  const quietMessage = 'The woods are quiet. Press play to listen.';
  let station = 'rain';
  let audioContext = null;
  let masterGain = null;
  let currentScene = null;
  let wantsPlayback = false;
  let starting = false;
  const scenes = new Set();
  const buffers = new Map();

  function renderRadio(message) {
    const playing = Boolean(wantsPlayback && audioContext?.state === 'running' && currentScene);
    radioToggle.setAttribute('aria-pressed', String(playing));
    if (radioIcon) radioIcon.textContent = playing ? 'Ⅱ' : '▶';
    if (radioLabel) radioLabel.textContent = playing ? 'Pause the soundscape' : 'Listen a while';
    radioStatus.textContent = message || (playing ? `Playing · ${stationNames[station]}` : quietMessage);
    stationButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.station === station)));
  }

  // Every sound is synthesized locally. Buffers are created only after a play gesture.
  function soundBuffer(kind) {
    if (buffers.has(kind)) return buffers.get(kind);
    const duration = 8;
    const rate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(2, rate * duration, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const samples = buffer.getChannelData(channel);
      let brown = 0;
      for (let index = 0; index < samples.length; index += 1) {
        const white = Math.random() * 2 - 1;
        brown = (brown + white * 0.02) / 1.02;
        if (kind === 'white') samples[index] = white;
        if (kind === 'brown') samples[index] = brown * 3.5;
      }
      if (kind === 'crickets') {
        for (let start = 0.4 + channel * 0.3; start < duration - 0.6; start += 1.2 + Math.random() * 0.7) {
          const pitch = 3300 + Math.random() * 600;
          for (let chirp = 0; chirp < 4; chirp += 1) {
            const offset = Math.floor((start + chirp * 0.09) * rate);
            const length = Math.floor(rate * 0.045);
            for (let index = 0; index < length; index += 1) {
              samples[offset + index] += Math.sin(2 * Math.PI * pitch * index / rate) *
                Math.sin(Math.PI * index / length) * 0.13;
            }
          }
        }
      }
      if (kind === 'crackle') {
        for (let start = 0.15; start < duration - 0.1; start += 0.12 + Math.random() * 0.65) {
          const offset = Math.floor(start * rate);
          const length = Math.floor(rate * (0.008 + Math.random() * 0.035));
          const strength = 0.1 + Math.random() * 0.3;
          for (let index = 0; index < length; index += 1) {
            samples[offset + index] += (Math.random() * 2 - 1) * Math.exp(-6 * index / length) * strength;
          }
        }
      }
    }
    buffers.set(kind, buffer);
    return buffer;
  }

  function createScene() {
    const context = audioContext;
    const gain = context.createGain();
    const nodes = [gain];
    const sources = [];
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.25);
    gain.connect(masterGain);

    function layer(kind, level, frequency, filterType = 'lowpass') {
      const source = context.createBufferSource();
      source.buffer = soundBuffer(kind);
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = frequency;
      filter.Q.value = 0.5;
      const volume = context.createGain();
      volume.gain.value = level;
      source.connect(filter).connect(volume).connect(gain);
      nodes.push(source, filter, volume);
      sources.push(source);
      source.start();
    }

    if (station === 'rain') {
      layer('white', 0.55, 2600);
      layer('brown', 0.22, 480);
    } else if (station === 'night') {
      layer('brown', 0.55, 350);
      layer('crickets', 0.6, 2600, 'highpass');
    } else {
      layer('brown', 0.8, 650);
      layer('crackle', 0.8, 3600);
    }

    let stopped = false;
    let remaining = sources.length;
    const scene = {
      stop(immediate = false) {
        if (stopped) {
          if (immediate) nodes.forEach((node) => node.disconnect());
          return;
        }
        stopped = true;
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + (immediate ? 0 : 0.12));
        sources.forEach((source) => source.stop(now + (immediate ? 0 : 0.15)));
        if (immediate) nodes.forEach((node) => node.disconnect());
      }
    };
    sources.forEach((source) => {
      source.onended = () => {
        remaining -= 1;
        if (remaining === 0) {
          nodes.forEach((node) => node.disconnect());
          scenes.delete(scene);
        }
      };
    });
    scenes.add(scene);
    return scene;
  }

  function ensureAudio() {
    if (audioContext && audioContext.state !== 'closed') return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('unsupported');
    const context = new AudioContext();
    audioContext = context;
    masterGain = context.createGain();
    masterGain.gain.value = Number(radioVolume.value) / 100;
    masterGain.connect(context.destination);
    context.addEventListener('statechange', () => {
      if (context !== audioContext) return;
      if (context.state !== 'running' && wantsPlayback && !starting) {
        wantsPlayback = false;
        currentScene?.stop(true);
        currentScene = null;
        renderRadio('Your browser paused the soundscape. Press play to listen again.');
      } else renderRadio();
    });
  }

  function releaseAudio() {
    wantsPlayback = false;
    scenes.forEach((scene) => scene.stop(true));
    scenes.clear();
    currentScene = null;
    // Disconnecting the master also silences a scene that failed during construction.
    masterGain?.disconnect();
    const previousContext = audioContext;
    audioContext = null;
    masterGain = null;
    buffers.clear();
    if (previousContext && previousContext.state !== 'closed') previousContext.close().catch(() => {});
  }

  radioToggle.addEventListener('click', async () => {
    if (starting) return;
    if (wantsPlayback) {
      starting = true;
      radioToggle.disabled = true;
      wantsPlayback = false;
      currentScene?.stop(true);
      currentScene = null;
      renderRadio();
      try { await audioContext?.suspend(); } catch { /* Stopped sources are already silent. */ }
      starting = false;
      radioToggle.disabled = false;
      return;
    }
    starting = true;
    radioToggle.disabled = true;
    try {
      ensureAudio();
      await audioContext.resume();
      if (audioContext.state !== 'running') throw new Error('paused');
      currentScene = createScene();
      wantsPlayback = true;
      renderRadio();
    } catch (error) {
      releaseAudio();
      renderRadio(error.message === 'unsupported'
        ? 'This browser does not support the soundscape. You can still explore the property.'
        : 'The soundscape could not start. Press play to try again.');
    } finally {
      starting = false;
      radioToggle.disabled = false;
    }
  });

  stationButtons.forEach((button) => button.addEventListener('click', () => {
    const selection = button.dataset.station;
    if (!Object.hasOwn(stationNames, selection) || selection === station) return;
    station = selection;
    if (wantsPlayback && audioContext?.state === 'running') {
      try {
        const previousScene = currentScene;
        currentScene = createScene();
        previousScene?.stop();
      } catch {
        releaseAudio();
        renderRadio('The soundscape stopped. Press play to try again.');
        return;
      }
    }
    renderRadio();
  }));
  radioVolume.addEventListener('input', () => {
    if (masterGain && audioContext?.state !== 'closed') {
      masterGain.gain.setTargetAtTime(Number(radioVolume.value) / 100, audioContext.currentTime, 0.03);
    }
  });
  window.addEventListener('pagehide', () => {
    releaseAudio();
    renderRadio();
  });
  radioVolume.value = '35';
  renderRadio();
})();
