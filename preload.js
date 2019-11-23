/**
 * Multitask, a Powercord plugin made to enhance productivity
 * Copyright (C) 2019 Bowser65
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
