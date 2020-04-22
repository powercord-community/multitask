/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

const { remote } = require('electron');

console.log('[Multitask] henlo world');

const _ael = document.addEventListener;
document.addEventListener = function (...args) {
  if (args[0] !== 'beforeunload') {
    _ael.call(this, ...args);
  }
};

const { localStorage } = window;
const _setItem = localStorage.setItem;
const blocked = [ 'token' ];

localStorage.setItem = function (key, value) {
  if (blocked.includes(key)) {
    return console.debug(`[Multitask] Prevented localStorage update ("${key}" => "${value}")`);
  }
  _setItem.call(localStorage, key, value);
};

const { token, powercordPreload } = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions;
if (token && powercordPreload) {
  _setItem.call(localStorage, 'token', JSON.stringify(token));
  console.log(localStorage.getItem('token'));
  require(powercordPreload);
}
