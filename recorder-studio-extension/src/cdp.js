// recorder-studio-extension/src/cdp.js
// CDP / chrome.debugger-based action replayer for Recorder Studio.
//
// This file intentionally exports a single global, so sidepanel.html can load it
// without converting the extension scripts to ESM modules.

(function initRecorderStudioCdpGlobal() {
  const NS = 'RecorderStudioCdp';

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getActiveTabId() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        const tab = tabs && tabs[0];
        if (!tab?.id) return reject(new Error('No active tab found.'));
        resolve(tab.id);
      });
    });
  }

  function debuggerAttach(target, protocolVersion = '1.3') {
    return new Promise((resolve, reject) => {
      chrome.debugger.attach(target, protocolVersion, () => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        resolve();
      });
    });
  }

  function debuggerDetach(target) {
    return new Promise((resolve, reject) => {
      chrome.debugger.detach(target, () => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        resolve();
      });
    });
  }

  function debuggerSendCommand(target, method, params = {}) {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(target, method, params, (result) => {
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message));
        resolve(result);
      });
    });
  }

  function waitForDebuggerEvent(tabId, method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        chrome.debugger.onEvent.removeListener(onEvent);
        reject(new Error(`Timeout waiting for debugger event: ${method}`));
      }, timeoutMs);

      const onEvent = (source, eventMethod, params) => {
        if (done) return;
        if (source?.tabId !== tabId) return;
        if (eventMethod !== method) return;
        done = true;
        clearTimeout(timer);
        chrome.debugger.onEvent.removeListener(onEvent);
        resolve(params);
      };

      chrome.debugger.onEvent.addListener(onEvent);
    });
  }

  async function runtimeEval(target, expression) {
    const result = await debuggerSendCommand(target, 'Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    return result?.result?.value;
  }

  function jsStringEscape(value) {
    // For embedding arbitrary strings inside a JS string literal.
    return JSON.stringify(String(value ?? ''));
  }

  async function getClickablePointByXPath(target, xpath) {
    const expression = `(function() {
      const xpath = ${jsStringEscape(xpath)};
      let el;
      try {
        el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } catch (e) {
        return { ok: false, error: 'Invalid XPath: ' + (e && e.message ? e.message : String(e)) };
      }
      if (!el) return { ok: false, error: 'Element not found for XPath.' };
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (!rect || rect.width === 0 || rect.height === 0) return { ok: false, error: 'Element has zero size.' };
      if (style && (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none')) {
        return { ok: false, error: 'Element not interactable (hidden/display none/pointer-events none).' };
      }
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      return { ok: true, x: Math.round(x), y: Math.round(y), tagName: el.tagName };
    })()`;
    return await runtimeEval(target, expression);
  }

  async function setInputValueByXPath(target, xpath, value) {
    const expression = `(function() {
      const xpath = ${jsStringEscape(xpath)};
      const value = ${jsStringEscape(value)};
      let el;
      try {
        el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } catch (e) {
        return { ok: false, error: 'Invalid XPath: ' + (e && e.message ? e.message : String(e)) };
      }
      if (!el) return { ok: false, error: 'Element not found for XPath.' };
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center' });
      if (el.focus) el.focus();

      const tag = (el.tagName || '').toUpperCase();
      const isTextArea = tag === 'TEXTAREA';
      const isInput = tag === 'INPUT';
      const isSelect = tag === 'SELECT';

      // Prefer native setters so React/Vue controlled components observe updates.
      const setNativeValue = (element, val) => {
        const proto = element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && typeof desc.set === 'function') desc.set.call(element, val);
        else element.value = val;
      };

      if (isSelect) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, kind: 'select' };
      }

      if (isInput || isTextArea) {
        setNativeValue(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, kind: 'input' };
      }

      if (el.isContentEditable) {
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, kind: 'contenteditable' };
      }

      return { ok: false, error: 'Unsupported element type for typing (not input/textarea/select/contenteditable).' };
    })()`;
    return await runtimeEval(target, expression);
  }

  async function replayActionsViaDebugger(actions, { tabId }) {
    const target = { tabId };
    const POST_ACTION_DELAY_MS = 300;

    // Best-effort detach in case we were previously attached.
    try { await debuggerDetach(target); } catch (_) {}

    await debuggerAttach(target, '1.3');
    try {
      await debuggerSendCommand(target, 'Page.enable');
      await debuggerSendCommand(target, 'Runtime.enable');
      await debuggerSendCommand(target, 'DOM.enable');

      // Try to settle quickly (best-effort).
      try {
        await debuggerSendCommand(target, 'Page.setLifecycleEventsEnabled', { enabled: true });
        await waitForDebuggerEvent(tabId, 'Page.lifecycleEvent', 500);
      } catch (_) {}

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        if (!action || !action.type) continue;

        console.log(`▶️ [Run] ${i + 1}/${actions.length}`, action);

        if (action.type === 'comment') continue;

        if (action.type === 'wait') {
          const ms = Math.max(0, Number(action.duration ?? 0) * 1000);
          await sleep(ms);
          continue;
        }

        if (action.type === 'click') {
          const point = await getClickablePointByXPath(target, action.selector);
          if (!point?.ok) throw new Error(`Click failed: ${point?.error || 'Unknown error'}`);
          await debuggerSendCommand(target, 'Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: point.x,
            y: point.y,
            button: 'left',
            clickCount: 1,
          });
          await debuggerSendCommand(target, 'Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: point.x,
            y: point.y,
            button: 'left',
            clickCount: 1,
          });
          await sleep(POST_ACTION_DELAY_MS);
          continue;
        }

        if (action.type === 'type') {
          const res = await x(target, action.selector, action.value);
          if (!res?.ok) throw new Error(`Type failed: ${res?.error || 'Unknown error'}`);
          await sleep(POST_ACTION_DELAY_MS);
          continue;
        }

        if (action.type === 'select') {
          const res = await setInputValueByXPath(target, action.selector, action.value);
          if (!res?.ok) throw new Error(`Select failed: ${res?.error || 'Unknown error'}`);
          await sleep(POST_ACTION_DELAY_MS);
          continue;
        }

        if (
          action.type === 'assertion' ||
          action.type === 'color-assertion' ||
          action.type === 'background-color-assertion' ||
          action.type === 'visible'
        ) {
          continue;
        }
      }
    } finally {
      try { await debuggerDetach(target); } catch (_) {}
    }
  }

  async function runReplay(actions) {
    const tabId = await getActiveTabId();
    return replayActionsViaDebugger(actions, { tabId });
  }

  // Expose global
  window[NS] = {
    runReplay,
    replayActionsViaDebugger,
    getActiveTabId,
  };
})();

