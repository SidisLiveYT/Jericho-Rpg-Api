const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const expressApp = express()
const port = 3000

expressApp.use(cors())
expressApp.use(bodyParser.urlencoded({ extended: false }))
expressApp.use(bodyParser.json())

var count = 0
expressApp.get('/', (req, res) => {
  res.json({
    status: 200,
    message: `Request has been Received`,
    Id: ++count,
  })
})

expressApp.listen(port, () =>
  console.log(`Express App is listening on port : ${port}`),
)
