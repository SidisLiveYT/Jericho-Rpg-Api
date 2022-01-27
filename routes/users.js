const { Router } = require('express')
const expressRouter = Router()
const DatabaseUtils = require('../database-utils')

expressRouter.get('/:userId', async (req, resp, next) => {
  try {
    var requestUserId =
      req?.params?.userId ?? req?.query?.userId ?? req?.query?.Id
    if (!requestUserId)
      resp.status(400).send('userId is not Found in Api Parameters')
    const requestUser = await DatabaseUtils.getUser({
      _userId: requestUserId ?? undefined,
    })
    if (!requestUser)
      resp.status(404).send('Request User is not Found in Api Database to get')
    else resp.status(200).send(requestUser)
  } catch (error) {
    next(error)
  }
})

expressRouter.post('/', async (req, resp, next) => {
  try {
    var userId = req.body?.userId ?? req.query.userId
    var userName = req.body?.userName ?? req.query.userName
    var wallet = (req.body?.wallet ?? req.query.wallet ?? 0) || 0
    var avatarUrl = req.body?.avatarUrl ?? req.query.avatarUrl
    await DatabaseUtils.createUser({
      userId: userId,
      userName: userName,
      wallet: wallet,
      avatarUrl: avatarUrl,
    })
    resp.send('User Created')
  } catch (error) {
    next(error)
  }
})

module.exports = expressRouter
