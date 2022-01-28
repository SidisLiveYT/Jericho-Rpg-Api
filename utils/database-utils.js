require('dotenv').config()

const Mysql = require('../extensions').Mysql

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

  /**
   * @static connect() -> Database Connection Before initializing Api
   * @param {process.env} databaseEnvs Enviornment Variables for Database Connection from Vercel
   * @returns {Promise<Mysql.Pool>} Returns Pool of Connections for Query and execute methods
   */
  static async connect(databaseEnvs = process.env) {
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

  /**
   * @static createUser()- >
   * @param {Object} rawUserData
   * @returns {Promise<Booelan | void>}
   */

  static async createUser(rawUserData) {
    if (
      !(
        rawUserData?.userId &&
        rawUserData?.userName &&
        rawUserData?.avatarUrl &&
        rawUserData?.secretPassword &&
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
        'INSERT INTO rpgUsers (userId,userName,secretPassword,wallet,avatarUrl) VALUES(?,?,?,?,?)',
        [
          rawUserData?.userId,
          rawUserData?.userName,
          rawUserData?.secretPassword,
          Mysql.raw(rawUserData?.wallet),
          rawUserData?.avatarUrl ?? Mysql.raw('NULL'),
        ],
      )
      return !!processedSqlResponse
    }
  }

  /**
   * @static getUser() -> Fetching User Data from Api Database After Aggressive Checks
   * @param {Object} rawUserData Raw Data for Checks like userId , userName and secretPassword
   * @returns {Object} Fetched User Data and Returns to Api Requesting User
   */

  static async getUser(rawUserData) {
    if (
      !(
        rawUserData?._userId ||
        rawUserData?._userName ||
        rawUserData?._secretPassword
      )
    )
      throw TypeError(
        'Invalid Raw User Data like userId , userName or secretPassword is Detected',
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
    else if (
      !(
        cachedUserData?.secretPassword &&
        cachedUserData?.secretPassword === rawUserData?._secretPassword
      )
    )
      throw Error('Invalid/Wrong Password is Detected for Getting User Data')
    return (
      Database.#__parseOutputData(cachedUserData ?? undefined, [
        'secretPassword',
      ]) ?? undefined
    )
  }

  /**
   * @static deleteUser() -> Deleting User Data from Api Database After Aggressive Checks
   * @param {Object} rawUserData Raw Data for Checks like userId , userName and secretPassword
   * @returns {Object} Deletes User Data and Returns to Api Requesting User
   */

  static async deleteUser(rawUserData) {
    if (
      !(
        rawUserData?._userId ||
        rawUserData?._userName ||
        rawUserData?._secretPassword
      )
    )
      throw TypeError(
        'Invalid Raw User Data like userId , userName or secretPassword is Detected',
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
    else if (
      !(
        cachedUserData?.secretPassword &&
        cachedUserData?.secretPassword === rawUserData?._secretPassword
      )
    )
      throw Error('Invalid/Wrong Password is Detected for Getting User Data')
    else {
      var processedSqlResponse = await Database.__rawQuery(
        `DELETE FROM rpgUsers WHERE userId = '?'`,
        [cachedUserData?.userId],
      )
      return !!processedSqlResponse
    }
  }

  /**
   * @private
   * @static #__parseOutputData() -> parse Output with Ignoring Some Values
   * @param {Object} rawData rawData in Structued Format
   * @param {string[]} ignoreArray Ignoring keys for Parsing
   * @returns {Object} Returns cooked Strucutred Value after Parsing
   */

  static #__parseOutputData(rawData, ignoreArray = []) {
    if (!(rawData && !Array.isArray(rawData) && typeof rawData === 'object'))
      return undefined
    var ObjectEntries = Object.entries(rawData)
    var cookedData = {}
    for (let count = 0, len = ObjectEntries.length; count < len; ++count) {
      if (
        ObjectEntries[count] &&
        ObjectEntries[count][0] &&
        !ignoreArray.includes(ObjectEntries[count][0]?.toLowerCase()?.trim())
      )
        cookedData[ObjectEntries[count]] = ObjectEntries[count][1]
    }
    return cookedData
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
