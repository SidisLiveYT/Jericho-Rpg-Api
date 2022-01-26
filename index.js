const express = require('express')
const { urlencoded, json } = require('body-parser')
const cors = require('cors')
const Database = require('./database-utils')

/**
 * Constant Values like Port , Express App , and IpAddress
 */
const expressApp = express()
const expressPort = 3000

/**
 * Applying or Using Middleware on Default Express App
 */
expressApp.use(cors())
expressApp.use(urlencoded({ extended: false }))
expressApp.use(json())

/**
 * Listening on expressPort with Default IpAddress
 */
expressApp.listen(expressPort, () =>
  console.log(`Express App is listening on port : ${expressPort}`),
)

/**
 * Universal API to Fetch User's Data according to User's Id Number
 */
expressApp.get('/api/users/:userId', (req, res) => {
  var requestUserId =
    req?.params?.userId ?? req?.query?.userId ?? req?.query?.Id
  if (!requestUserId)
    res.status(404).send('userId is not Found in Api Parameters')
})

expressApp.get('/', async (req, res) => {
  await Database.connect()
  Database.createTables()
  res.json({ statusCode: 200 })
})
