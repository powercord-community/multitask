/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

const { remote } = require('electron');

console.log('[Multitask] Henlo World');

const { token, powercordPreload } = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions;
if (token) {
  const _ael = document.addEventListener;
  document.addEventListener = function (...args) {
    if (args[0] !== 'beforeunload') {
      _ael.call(this, ...args);
    }
  };

  const _setItem = window.localStorage.setItem;
  window.localStorage.setItem = function (key, value) {
    if (key === 'token') {
      return console.debug('[Multitask] Prevented localStorage token update');
    }
    _setItem.call(window.localStorage, key, value);
  };

  const _getItem = window.localStorage.getItem;
  window.localStorage.getItem = function (key) {
    if (key === 'token') {
      return token;
    }
    _getItem.call(window.localStorage, key);
  };
}

require(powercordPreload);
