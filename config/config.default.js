'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1518359962217_2900';

  // add your config here
  config.middleware = [];

  config.mysql = {
    // database configuration
    client: {
      // host
      host: '39.108.10.96',
      // port
      port: '3306',
      // username
      user: 'xundrug',
      // password
      password: 'xundrug123',
      // database
      database: 'xundrug_server',
    },
    // load into app, default is open
    app: true,
    // load into agent, default is close
    agent: false,
  };

  return config;
};
