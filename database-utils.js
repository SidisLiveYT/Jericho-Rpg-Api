const Mysql = require('mysql2/promise')

class Database {
  /**
   * @type {Mysql.Pool}
   */
  static mysqlDatabaseConnections = undefined

  /**
   * @type {Object[]}
   */
  static rawUsersData = undefined

  /**
   * @type {Object[]}
   */
  static rawBotsData = undefined

  /**
   * @type {Object[]}
   */
  static rawTransactionData = undefined
  static async connect(databaseEnvs) {
    Database.mysqlDatabaseConnections = Mysql.createPool({
      host: databaseEnvs.PLANETSCALE_DB_HOST,
      password: databaseEnvs.PLANETSCALE_DB_PASSWORD,
      database: databaseEnvs.PLANETSCALE_DB,
      user: databaseEnvs.PLANETSCALE_DB_USERNAME,
      ssl: { rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
    })
    await Database.refresh()
    return Database.mysqlDatabaseConnections ?? undefined
  }

  static async createUser(rawUserData) {
    if (
      !(
        rawUserData?.userId &&
        rawUserData?.userName &&
        rawUserData?.avatarUrl &&
        rawUserData?.wallet
      )
    )
      throw TypeError(
        'Invalid Raw User Data like userId , userName , wallet or avatarUrl is Detected',
      )
    var cachedUserData = await Database.__rawDataFind(
      'users',
      'userId',
      rawUserData?.userId,
      true,
    )
    if (cachedUserData)
      throw new Error('User is already present in Jericho-Rpg-Api Database')
    else {
      var processedSqlResponse = await Database.__rawQuery(
        'INSERT INTO rpgUsers (userId,userName,wallet,avatarUrl) VALUES(?,?,?,?)',
        [
          rawUserData?.userId,
          rawUserData?.userName,
          Mysql.raw(rawUserData?.wallet),
          rawUserData?.avatarUrl ?? Mysql.raw('NULL'),
        ],
      )
      return !!processedSqlResponse
    }
  }

  static async getUser(rawUserData) {
    if (!(rawUserData?._userId || rawUserData?._userName))
      throw TypeError(
        'Invalid Raw User Data like userId or userName is Detected',
      )

    var cachedUserData = await Database.__rawDataFind(
      'users',
      'userId',
      rawUserData?._userId,
      true,
    )
    if (!cachedUserData)
      cachedUserData = await Database.__rawDataFind(
        'users',
        'userName',
        rawUserData?._userName,
        false,
      )
    if (!cachedUserData)
      throw Error('No User was Found in Jericho-Rpg-Api Database')
    return cachedUserData ?? undefined
  }

  /**
   * @static __rawDataFind() -> Data Check with Database Class in-built properties
   * @param {string | void} type Table Type to check from Mysql Formated Database Data
   * @param {string | void} column Table column to check from Mysql Formated Database Data
   * @param {string | number | void} value Table column Value to check from Mysql Formated Database Data
   * @param {boolean| void} ifrefresh Refresh from Real Database Before Parsing Finding the Value
   * @returns {Promise<Object | void>} Returns true on correct Data check or false on situation
   */
  static async __rawDataFind(type, column, value, ifrefresh = false) {
    if (
      !(
        type &&
        typeof type === 'string' &&
        column &&
        typeof column === 'string' &&
        value &&
        ['string', 'number'].includes(typeof value)
      )
    )
      return undefined
    if (ifrefresh) await Database.refresh(type)
    var cachedTempArray = undefined
    switch (type?.toLowerCase()?.trim()) {
      case 'users':
        cachedTempArray = Database.rawUsersData
      case 'bots':
        cachedTempArray = Database.rawBotsData
      case 'transactions':
        cachedTempArray = Database.rawTransactionData
      default:
        cachedTempArray = undefined
    }
    if (
      !(
        cachedTempArray &&
        Array.isArray(cachedTempArray) &&
        cachedTempArray.length > 0
      )
    )
      return undefined
    for (let count = 0, len = cachedTempArray.length; count < len; ++count) {
      if (
        cachedTempArray[count][`${column}`] &&
        `${cachedTempArray[count][`${column}`]}` === `${value}`
      ) {
        return cachedTempArray[count]
      }
    }
    return undefined
  }

  /**
   * @static refresh() -> Refresh Present Data with Db Data in Class
   * @param {string | void} type Table Type to Refresh from Mysql Database
   * @returns {Promise<void>} Returns undefined on success flag
   */
  static async refresh(type = 'all') {
    if (typeof type !== 'string') return undefined
    if (['all', 'users'].includes(type?.toLowerCase()?.trim())) {
      Database.rawUsersData = await Database.__rawQuery('select * from ?', [
        Mysql.raw('rpgUsers'),
      ])
    }
    if (['all', 'bots'].includes(type?.toLowerCase()?.trim()))
      Database.rawBotsData = await Database.__rawQuery('SELECT * FROM ?', [
        Mysql.raw('rpgBots'),
      ])
    if (['all', 'transactions'].includes(type?.toLowerCase()?.trim()))
      Database.rawTransactionData = await Database.__rawQuery(
        'SELECT * FROM ?',
        [Mysql.raw('userTransactions')],
      )
    return undefined
  }
  static async __rawQuery(sqlString, valuesArray = undefined) {
    if (!Database.mysqlDatabaseConnections)
      throw TypeError('Invalid Mysql Connection is Detected')
    sqlString =
      valuesArray && Array.isArray(valuesArray) && valuesArray.length > 0
        ? Mysql.format(sqlString, valuesArray)
        : sqlString
    const [rawRows] = await Database.mysqlDatabaseConnections.execute(sqlString)
    return rawRows
  }
}

new Promise(async (resolve, reject) => {
  console.log(await Database.connect())
})

module.exports = Database
