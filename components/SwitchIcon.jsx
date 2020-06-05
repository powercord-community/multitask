/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

const { React } = require('powercord/webpack');

module.exports = React.memo(
  (props) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width={24} height={24} {...props}>
      <path
        fill='currentColor'
        d='M7.5 21.5l1.35-1.34l3.81 3.81L12 24C5.71 24 .56 19.16.05 13h1.5c.36 3.76 2.7 6.94 5.95 8.5m9-19l-1.35 1.34L11.34.03L12 0c6.29 0 11.44 4.84 11.95 11h-1.5c-.36-3.76-2.7-6.93-5.95-8.5M6 17c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1m9-8a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3a3 3 0 0 1 3 3z'
      />
    </svg>
  )
);
