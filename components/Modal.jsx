/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { close: closeModal } = require('powercord/modal');
const { Button, AsyncComponent } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');

const FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));

module.exports = React.memo(
  ({ accounts, open }) => (
    <Confirm
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
              size={Button.Sizes.SMALL}
              color={Button.Colors.TRANSPARENT}
              onClick={() => {
                closeModal();
                open(acc.token);
              }}
            >
              Open New Window
            </Button>
            <Button
              size={Button.Sizes.SMALL}
              color={Button.Colors.TRANSPARENT}
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
    </Confirm>
  )
);
