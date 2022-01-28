require('dotenv').config()

const express = require('express')
const { urlencoded, json } = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

/**
 * Database Creation of Connection Pool for Database on API loading
 */
const Database = require('./utils/database-workloads')
new Promise(async (resolve, reject) => {
  resolve(await Database.connect(process.env))
})
/**
 * Constant Values like Port , Express App , and IpAddress
 */
const expressApp = express()
const expressPort = 3000

/**
 * usage of routes/$files.js for express.<Router()>
 */
expressApp.use('/users', require('./routes/users'))
expressApp.use('/api/users', require('./routes/users'))

/**
 * Applying or Using Middleware on Default Express App
 */
expressApp.use(cors())
expressApp.use(urlencoded({ extended: false }))
expressApp.use(json())
expressApp.use(helmet())

/**
 * Listening on expressPort with Default IpAddress
 */
expressApp.listen(expressPort, () =>
  console.log(`Express App is listening on port : ${expressPort}`),
)

expressApp.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'))
})
expressApp.get('/api', async (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'))
})
