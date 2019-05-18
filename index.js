const { remote: { BrowserWindow } } = require('electron');
const { resolve } = require('path');
const { Plugin } = require('powercord/entities');
const { Tooltip } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { React, getModuleByDisplayName, constants: { Routes } } = require('powercord/webpack');

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

    const isMac = process.platform === 'darwin';
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
    const HeaderBarContainer = await getModuleByDisplayName('HeaderBarContainer');
    inject('multitask-icon', HeaderBarContainer.prototype, 'renderToolbar', (args, res) => {
      if (res.props.children[1]) {
        const guildId = res.props.children[0][0].key === 'calls' ? '@me' : res.props.children[1].key;
        const channelId = res.props.children[0][1].props.channel.id;
        res.props.children.unshift(
          React.createElement(Tooltip, {
            text: 'Popout',
            position: 'bottom'
          }, React.createElement('div', {
            className: 'multitask-popout-icon',
            onClick: () => this.openPopout(guildId, channelId)
          }))
        );
      }
      return res;
    });
  }
};
