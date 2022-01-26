require('dotenv').config()

const mysql = require('mysql2/promise')

class Database {
  /**
   * @type {mysql.Connection}
   */
  static mysqlClientConnection = undefined
  static async connect() {
    Database.mysqlClientConnection = await mysql.createConnection({
      host: process.env.PLANETSCALE_DB_HOST,
      password: process.env.PLANETSCALE_DB_PASSWORD,
      user: process.env.PLANETSCALE_DB_USERNAME,
      database: process.env.PLANETSCALE_DB,
      ssl: {
        rejectUnauthorized: true,
      },
    })
    return Database.mysqlClientConnection ?? undefined
  }

  static createTables() {
    if (!Database.mysqlClientConnection)
      throw TypeError(
        'Mysql Database Connection couldn\'t be established | location : "Database.getTotalUsers()"',
      )
    Database.mysqlClientConnection.query(
      `CREATE TABLE IF NOT EXISTS rpgUsers ('userId' VARCHAR(225) NOT NULL,'userName' VARCHAR(100) NULL,'wallet' VARCHAR(225) NOT NULL,PRIMARY KEY ('userId')`,
    )
    Database.mysqlClientConnection
      .query(
        `CREATE TABLE IF NOT EXISTS rpgBots ('botsId' VARCHAR(225) NOT NULL,'botName' VARCHAR(100) NULL,'storageMoney' VARCHAR(225),'loanMoney' VARCHAR(225),'userTransactionsCount' VARCHAR(100),'userTransactionsCount' VARCHAR(100),'secretToken' VARCHAR(225) NOT NULL,PRIMARY KEY ('botsId')`,
      )
      .then((results) => {
        console.log(results)
      })
      .catch((error) => {
        throw TypeError(error?.message ?? `${error}`)
      })
  }
}
new Promise(async (resolve) => {
  resolve(await Database.connect())
  resolve(Database.createTables())
})

module.exports = Database
