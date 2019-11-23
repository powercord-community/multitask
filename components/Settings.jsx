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

const { React, getModuleByDisplayName } = require('powercord/webpack');
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

module.exports = class Settings extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      name: null,
      token: null
    };
  }

  render () {
    return <div>
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
        <Button onClick={() => this.addUser()}>Add Account</Button>
      </Card>

    </div>;
  }

  renderUserList () {
    return this.props.getSetting('accounts').map((account, i) => <Game
      _parent={this}
      account={account}
      game={{ name: account.name || `Account #${i}` }}
    />);
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

  removeUser (user) {
    const newUsers = this.props.getSetting('accounts').filter(u => u !== user);
    this.props.updateSetting('accounts', newUsers);
  }

  modifyUser (user, modifier) {
    const newUsers = this.props.getSetting('accounts').map(u => u === user ? modifier(user) : u);
    this.props.updateSetting('accounts', newUsers);
  }
};
