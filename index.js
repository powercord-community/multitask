/*
 * Copyright (c) 2020-2021 Cynthia K. Rey
 * Licensed under the Open Software License version 3.0
 */

const { join } = require('path');
const { Plugin } = require('powercord/entities');
const { Tooltip } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, getModuleByDisplayName, constants: { Routes } } = require('powercord/webpack');
const { open: openModal } = require('powercord/modal');
const { sleep } = require('powercord/util');

const SwitchIcon = require('./components/SwitchIcon');
const Settings = require('./components/Settings');
const Modal = require('./components/Modal');

module.exports = class Multitask extends Plugin {
  async startPlugin () {
    if (window.GlasscordApi) { // @todo: Glasscord compatibility
      this.error('Glasscord detected. Multitask is not compatible with Glasscord yet.');
      this.error('Aborting startup.');
      return;
    }

    this.loadStylesheet('style.scss');
    powercord.api.settings.registerSettings('multitask', {
      category: this.entityID,
      label: 'Multitask',
      render: Settings
    });

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
    powercord.api.settings.unregisterSettings('multitask');
    uninject('multitask-icon');
  }

  async _addPopoutIcon () {
    const classes = await getModule([ 'iconWrapper', 'clickable' ]);
    const HeaderBarContainer = await getModuleByDisplayName('HeaderBarContainer');
    inject('multitask-icon', HeaderBarContainer.prototype, 'renderLoggedIn', (args, res) => {
      /* if (res.props.toolbar && res.props.toolbar.props.children && res.props.toolbar.props.children[0][0]) {
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
      } */

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

    const { webContents } = BrowserWindow.getFocusedWindow();
    const currentOpts = webContents.browserWindowOptions;
    const opts = {
      ...currentOpts,
      token,
      minWidth: 530,
      minHeight: 320,
      powercordPreload: currentOpts.webPreferences.preload,
      webPreferences: {
        ...currentOpts.webPreferences,
        preload: join(__dirname, 'preload.js')
      }
    };
    delete opts.show;
    delete opts.x;
    delete opts.y;
    delete opts.minWidth;
    delete opts.minHeight;
    const window = new BrowserWindow(opts);
    /*
     * if (GlasscordApi) {
     *  Glasscord compatibility
     *   window.webContents._preload = webContents._preload;
     * }
     */

    window.on('close', () => window.destroy());
    window.webContents.once('did-finish-load', () => window.webContents.executeJavaScript(`(${func.toString()})()`));
    window.loadURL(location.href);
  }

  _openPopout (guildId, channelId) {
    // eslint-disable-next-line new-cap
    const route = `https:${GLOBAL_ENV.WEBAPP_ENDPOINT}${Routes.CHANNEL(guildId, channelId)}`;
    const func = (async () => {
      // Await for Webpack load
      while (!require('powercord/webpack').instance) {
        await require('powercord/util').sleep(1);
      }

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

    const { webContents } = BrowserWindow.getFocusedWindow();
    const opts = {
      ...webContents.browserWindowOptions,
      minWidth: 530,
      minHeight: 320
    };
    delete opts.show;
    delete opts.x;
    delete opts.y;
    delete opts.minWidth;
    delete opts.minHeight;
    const window = new BrowserWindow(opts);
    /*
     * if (GlasscordApi) {
     *  Glasscord compatibility
     *   window.webContents._preload = webContents._preload;
     * }
     */

    window.webContents.once('did-finish-load', () => window.webContents.executeJavaScript(`(${func.toString()})()`));
    window.on('close', () => window.destroy());
    window.loadURL(route);
  }
};
