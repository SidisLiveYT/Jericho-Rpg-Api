const { Router } = require('express')
const expressRouter = Router()
const DatabaseUtils = require('../utils/database-workloads')
const MiscUtils = require('../utils/misc-utils')

/**
 * requestCaches -> Structured Caches for Checking for Duplicate Request from Same IP
 */
var requestCaches = {}

/**
 * Clearing requestCaches for Handling Memory Handling
 */
setInterval(() => {
  requestCaches = {}
}, 5 * 60 * 1000)

expressRouter.get('/:userId', async (req, resp, next) => {
  if (requestCaches[req.headers['x-idempotence-key']])
    return resp.status(304).send('Request is Not Modified')
  try {
    var requestUserId =
      req?.params?.userId ?? req?.query?.userId ?? req?.query?.Id
    var requestUsersecretPassword =
      req?.params?.secretPassword ?? req?.query?.secretPassword
    if (!requestUserId)
      resp.status(400).send('userId is not Found in Api Parameters')
    const requestUser = await DatabaseUtils.getUser({
      _userId: requestUserId ?? undefined,
      _secretPassword: requestUsersecretPassword ?? undefined,
    })
    if (!requestUser)
      resp.status(404).send('Request User is not Found in Api Database to get')
    else resp.status(200).send(requestUser)
  } catch (error) {
    next(error)
  }
  dummyCache[req.headers['x-idempotence-key']] = true
  return undefined
})

expressRouter.post('/', async (req, resp, next) => {
  if (requestCaches[req.headers['x-idempotence-key']])
    return resp.status(304).send('Request is Not Modified')
  try {
    var userId = req.body?.userId ?? req.query.userId
    var userName = req.body?.userName ?? req.query.userName
    var wallet = (req.body?.wallet ?? req.query.wallet ?? 0) || 0
    var avatarUrl = req.body?.avatarUrl ?? req.query.avatarUrl
    var secretPassword =
      req.body?.secretPassword ??
      req.query.secretPassword ??
      MiscUtils.__passwordGenerator()
    await DatabaseUtils.createUser({
      userId: userId,
      userName: userName,
      wallet: wallet,
      avatarUrl: avatarUrl,
      secretPassword: secretPassword,
    })
    resp.status(200).json({
      userId: userId,
      userName: userName,
      wallet: wallet,
      avatarUrl: avatarUrl,
      secretPassword: secretPassword,
    })
  } catch (error) {
    next(error)
  }
  dummyCache[req.headers['x-idempotence-key']] = true
  return undefined
})

expressRouter.delete('/:userId', async (req, resp, next) => {
  if (requestCaches[req.headers['x-idempotence-key']])
    return resp.status(304).send('Request is Not Modified')

  try {
    var userId = req.body?.userId ?? req.query.userId
    var secretPassword = req.body?.secretPassword ?? req.query.secretPassword
    await DatabaseUtils.deleteUser({
      userId: userId,
      secretPassword: secretPassword,
    })
    resp.send('User is Deleted')
  } catch (error) {
    next(error)
  }
  dummyCache[req.headers['x-idempotence-key']] = true
  return undefined
})

module.exports = expressRouter
