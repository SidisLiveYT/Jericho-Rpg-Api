require('dotenv').config()

const { PSDB } = require('planetscale-node')
const conn = new PSDB('main')
class Database {
  static async createTables() {
    if (!conn)
      throw TypeError(
        'Mysql Database Connection couldn\'t be established | location : "Database.getTotalUsers()"',
      )
    const [rows, fields] = await conn.query(
      `CREATE TABLE IF NOT EXISTS rpgUsers ('userId' VARCHAR(225) NOT NULL,'userName' VARCHAR(100) NULL,'wallet' VARCHAR(225) NOT NULL,PRIMARY KEY ('userId')`,
    )
    console.log(rows, fields)
    return rows
  }
}

module.exports = Database
