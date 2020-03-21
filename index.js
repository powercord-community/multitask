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

const { resolve } = require('path');
const { remote: { BrowserWindow } } = require('electron');
const { Plugin } = require('powercord/entities');
const { Tooltip, Icons: { ExternalLink } } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, getModuleByDisplayName, constants: { Routes } } = require('powercord/webpack');
const { open: openModal } = require('powercord/modal');
const { sleep } = require('powercord/util');

const SwitchIcon = require('./components/SwitchIcon');
const Settings = require('./components/Settings');
const Modal = require('./components/Modal');

module.exports = class Multitask extends Plugin {
  async startPlugin () {
    this.loadCSS(resolve(__dirname, 'style.scss'));
    this.registerSettings('multitask', 'Multitask', Settings);
    this._addPopoutIcon();
    if (!this.settings.get('accounts')) {
      const tokenModule = await getModule([ 'getToken' ]);
      const userModule = await getModule([ 'getCurrentUser' ]);
      let user;
      while (!(user = userModule.getCurrentUser())) {
        await sleep(10);
      }
      this.settings.set('accounts', [
        {
          name: user.tag,
          token: tokenModule.getToken()
        }
      ]);
    }
  }

  pluginWillUnload () {
    uninject('multitask-icon');
  }

  async _addPopoutIcon () {
    const classes = await getModule([ 'iconWrapper', 'clickable' ]);
    const HeaderBarContainer = await getModuleByDisplayName('HeaderBarContainer');
    inject('multitask-icon', HeaderBarContainer.prototype, 'renderLoggedIn', (args, res) => {
      if (res.props.toolbar && res.props.toolbar.props.children && res.props.toolbar.props.children[0][0]) {
        const guildId = res.props.toolbar.props.children[0][0].key === 'calls' ? '@me' : res.props.toolbar.props.children[1].key;
        const channelId = res.props.toolbar.props.children[0][1].props.channel.id;
        res.props.toolbar.props.children.unshift(
          React.createElement(Tooltip, {
            text: 'Popout',
            position: 'bottom'
          }, React.createElement('div', {
            className: [ 'multitask-icon', classes.iconWrapper, classes.clickable ].join(' ')
          }, React.createElement(ExternalLink, {
            className: [ 'multitask-icon', classes.icon ].join(' '),
            onClick: () => this._openPopout(guildId, channelId)
          })))
        );
      }

      if (this.settings.get('accounts').length > 1) {
        const Switcher = React.createElement(Tooltip, {
          text: 'Switch account',
          position: 'bottom'
        }, React.createElement('div', {
          className: [ 'multitask-icon', classes.iconWrapper, classes.clickable ].join(' ')
        }, React.createElement(SwitchIcon, {
          className: [ 'multitask-icon', classes.icon ].join(' '),
          onClick: () =>
            openModal(() => React.createElement(Modal, {
              accounts: this.settings.get('accounts'),
              open: this._openNewAccount.bind(this)
            }))
        })));

        if (!res.props.toolbar) {
          res.props.toolbar = Switcher;
        } else {
          res.props.toolbar.props.children.push(Switcher);
        }
      }

      return res;
    });
  }

  _openNewAccount (token) {
    const func = (async () => {
      // Make the popup closable on MacOS
      if (process.platform === 'darwin') {
        const macCloseBtn = await require('powercord/util').waitFor('.macButtonClose-MwZ2nf');
        macCloseBtn.addEventListener('click', () => {
          const w = require('electron').remote.getCurrentWindow();
          w.close();
          w.destroy();
        });
      }
    });

    const currentOpts = BrowserWindow.getFocusedWindow().webContents.browserWindowOptions;
    const opts = {
      ...currentOpts,
      token,
      minWidth: 530,
      minHeight: 320,
      powercordPreload: currentOpts.webPreferences.preload,
      webPreferences: {
        ...currentOpts.webPreferences,
        preload: resolve(__dirname, 'preload.js')
      }
    };
    delete opts.show;
    delete opts.x;
    delete opts.y;
    delete opts.minWidth;
    delete opts.minHeight;
    const window = new BrowserWindow(opts);
    window.on('close', () => window.destroy());
    window.webContents.once('did-finish-load', () => window.webContents.executeJavaScript(`(${func.toString()})()`));
    window.loadURL(location.href);
  }

  _openPopout (guildId, channelId) {
    // eslint-disable-next-line new-cap
    const route = `https:${GLOBAL_ENV.WEBAPP_ENDPOINT}${Routes.CHANNEL(guildId, channelId)}`;
    const func = (async () => {
      // Prevent Discord from connecting to a voice channel
      (await require('powercord/webpack').getModule([ 'clearVoiceChannel' ])).clearVoiceChannel();

      // Make Discord think you're in dnd to prevent notifications from the popout
      (await require('powercord/webpack').getModule([ 'makeTextChatNotification' ])).makeTextChatNotification =
        function makeTextChatNotification () {
          return void 0;
        };

      // Make the popup closable on MacOS
      if (process.platform === 'darwin') {
        const macCloseBtn = await require('powercord/util').waitFor('.macButtonClose-MwZ2nf');
        macCloseBtn.addEventListener('click', () => {
          const w = require('electron').remote.getCurrentWindow();
          w.close();
          w.destroy();
        });
      }

      // Add a CSS class and value in GLOBAL_ENV for external plugins
      document.body.classList.add('multitask-popout');
      GLOBAL_ENV.MULTITASK_POPOUT = true;
    });

    const opts = {
      ...BrowserWindow.getFocusedWindow().webContents.browserWindowOptions,
      minWidth: 530,
      minHeight: 320
    };
    delete opts.show;
    delete opts.x;
    delete opts.y;
    delete opts.minWidth;
    delete opts.minHeight;
    const window = new BrowserWindow(opts);

    window.webContents.once('did-finish-load', () => window.webContents.executeJavaScript(`(${func.toString()})()`));
    window.on('close', () => window.destroy());
    window.loadURL(route);
  }
};
