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
const { Tooltip, Icon } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, getModuleByDisplayName, constants: { Routes } } = require('powercord/webpack');
const SwitchIcon = require('./components/SwitchIcon');

module.exports = class Multitask extends Plugin {
  async startPlugin () {
    this.loadCSS(resolve(__dirname, 'style.scss'));
    this._addPopoutIcon();
  }

  pluginWillUnload () {
    uninject('multitask-icon');
  }

  openPopout (guildId, channelId) {
    // eslint-disable-next-line new-cap
    const route = `https:${GLOBAL_ENV.WEBAPP_ENDPOINT}${Routes.CHANNEL(guildId, channelId)}`;

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

    window.webContents.once('did-finish-load', () => {
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
          const macCloseBtn = await require('powercord/util').waitFor('.pc-macButtonClose');
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
      window.webContents.executeJavaScript(`(${func.toString()})()`);
    });

    window.on('close', () => window.destroy());
    window.loadURL(route);
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
            className: [ classes.iconWrapper, classes.clickable ].join(' ')
          }, React.createElement(Icon, {
            name: 'ExternalLink',
            className: classes.icon,
            onClick: () => this.openPopout(guildId, channelId)
          })))
        );
      }

      return res;
      // whats this
      /* eslint-disable */
      // noinspection UnreachableCodeJS
      const Switcher = React.createElement(Tooltip, {
        text: 'Switch account',
        position: 'bottom'
      }, React.createElement('div', {
        className: [ classes.iconWrapper, classes.clickable ].join(' ')
      }, React.createElement(SwitchIcon, {
        className: classes.icon,
        onClick: () => console.log('test')
      })));

      if (!res.props.toolbar) {
        res.props.toolbar = Switcher;
      } else {
        res.props.toolbar.props.children.push(Switcher);
      }
      return res;
    });
  }
};
