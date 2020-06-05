/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { Card, Button, AsyncComponent } = require('powercord/components');
const { TextInput } = require('powercord/components/settings');

const FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));
const Game = AsyncComponent.from((async () => {
  const Activity = await getModuleByDisplayName('FluxContainer(UserSettingsGameActivity)');
  const instance = new Activity();
  const fakeInst = {
    props: {
      gameHistory: [ {} ],
      overrideExePaths: new Set()
    }
  };
  // noinspection JSPotentiallyInvalidConstructorUsage
  const DiscordComponent = instance.render().type.prototype.renderGameList.call(fakeInst).props.children[1][0].type;
  return class Game extends DiscordComponent {
    renderName () {
      const res = super.renderName();
      res.props.onBlur = () => this.props._parent.modifyUser(this.props.account, (acc) => {
        acc.name = this.state.editingName;
        return acc;
      });
      return res;
    }

    renderLastPlayed () {
      const res = super.renderLastPlayed();
      res.props.children.props.children = 'Hover to reveal token';
      res.props.children.props.hoverText = this.props.account.token;
      return res;
    }

    renderOverlayToggle () {
      return null;
    }

    renderRemove () {
      const res = super.renderRemove();
      res.props.onClick = () => this.props._parent.removeUser(this.props.account);
      return res;
    }
  };
})());

module.exports = class Settings extends React.PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      name: null,
      token: null
    };
  }

  render () {
    return (
      <div>
        {this.renderUserList()}
        <FormTitle className='multitask-settings-add' tag='h2'>New account</FormTitle>
        <Card className='multitask-settings-add-card'>
          <TextInput
            value={this.state.name}
            onChange={name => this.setState({ name })}
          >
          Account Name
          </TextInput>
          <TextInput
            value={this.state.token}
            onChange={token => this.setState({ token })}
          >
          Token
          </TextInput>
          <div className='buttons'>
            <Button onClick={() => this.addUser()}>Add Account</Button>
            <Button onClick={() => this.helpLazyUser()}>Add current account</Button>
          </div>
        </Card>
      </div>
    );
  }

  renderUserList () {
    return this.props.getSetting('accounts').map((account, i) => (
      <Game
        _parent={this}
        account={account}
        game={{ name: account.name || `Account #${i}` }}
      />
    ));
  }

  addUser () {
    const users = this.props.getSetting('accounts');
    users.push(this.state);
    this.setState({
      name: '',
      token: ''
    });
    this.props.updateSetting('accounts', users);
  }

  async helpLazyUser () {
    const tokenModule = await getModule([ 'getToken' ]);
    const userModule = await getModule([ 'getCurrentUser' ]);
    this.props.updateSetting('accounts', this.props.getSetting('accounts').concat({
      name: userModule.getCurrentUser().tag,
      token: tokenModule.getToken()
    }));
  }

  removeUser (user) {
    const newUsers = this.props.getSetting('accounts').filter(u => u !== user);
    this.props.updateSetting('accounts', newUsers);
  }

  modifyUser (user, modifier) {
    const newUsers = this.props.getSetting('accounts').map(u => u === user ? modifier(user) : u);
    this.props.updateSetting('accounts', newUsers);
  }
};
