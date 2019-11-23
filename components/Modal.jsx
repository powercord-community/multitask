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

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { close: closeModal } = require('powercord/modal');
const { Button, AsyncComponent } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');

const FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));

module.exports = ({ accounts, open }) => <Confirm
  red={false}
  header='Switch accounts'
  confirmText='Open Settings'
  cancelText='Cancel'
  onCancel={closeModal}
  onConfirm={async () => {
    const settingsModule = await getModule([ 'open', 'saveAccountChanges' ]);
    settingsModule.open('multitask');
    closeModal();
  }}
>
  <div className='powercord-text'>
    {accounts.map(acc => <>
      <FormTitle tag='h3'>{acc.name}</FormTitle>
      <div className='multitask-buttons'>
        <Button
          size={Button.Sizes.SMALL} color={Button.Colors.TRANSPARENT}
          onClick={() => {
            closeModal();
            open(acc.token);
          }}
        >
          Open New Window
        </Button>
        <Button
          size={Button.Sizes.SMALL} color={Button.Colors.TRANSPARENT}
          onClick={async () => {
            const tokenModule = await getModule([ 'setToken' ]);
            tokenModule.setToken(acc.token);
            location.reload();
          }}
        >
          Use in Current Window
        </Button>
      </div>
    </>)}
  </div>
</Confirm>;
