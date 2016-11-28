module.exports = {
  sequelize: {
    username: 'DB_USER',
    password: 'DB_PWD',
    database: 'DB_DB',
    host: 'DB_HOST',
    dialect: 'DB_DIALECT'
  },
  app: {
    port: 'APP_PORT',
    session: {
      keys: 'SESSION_KEYS'
    }
  }
};
