const { remote: { BrowserWindow } } = require('electron');
const { resolve } = require('path');
const { Plugin } = require('powercord/entities');
const { Tooltip } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { React, getModuleByDisplayName, constants: { Routes } } = require('powercord/webpack');

module.exports = class Multitask extends Plugin {
  startPlugin () {
    this.loadCSS(resolve(__dirname, 'style.css'));
    this._addPopoutIcon();
  }

  pluginWillUnload () {
    uninject('multitask-icon');
  }

  openPopout (guildId, channelId) {
    // eslint-disable-next-line new-cap
    const route = `https:${GLOBAL_ENV.WEBAPP_ENDPOINT}${Routes.CHANNEL(guildId, channelId)}`;

    const isMac = process.platform === 'darwin';
    const opts = { ...BrowserWindow.getFocusedWindow().webContents.browserWindowOptions };
    delete opts.show;
    delete opts.x;
    delete opts.y;
    const window = new BrowserWindow(opts);

    window.webContents.once('did-finish-load', () => {
      const func = ((__dirname) => powercord.styleManager.loadPluginCSS('popout-chatonly', require('path').resolve(__dirname, 'popout.css'))).toString();
      window.webContents.executeJavaScript(`(${func})(${JSON.stringify(__dirname)})`);
    });

    if (isMac) {
      window.on('close', () => window.destroy());
    }

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
