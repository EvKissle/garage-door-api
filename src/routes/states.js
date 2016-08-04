const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)

import {Router} from 'express'
import _ from 'underscore'
import Promise from 'bluebird'
import State from '../db/models/state'
import States from '../db/collections/states'

const router = new Router()

router.post('/states', (req, res, next) => {
  verbose('Incoming request post /states.  body:', req.body)
  const isOpen = _.isBoolean(req.body.is_open) ? req.body.is_open : req.body.is_open === 'true'
  const options = {by: req.client}
  Promise
    .resolve(State.fetchLatest(options))
    .then(model => {
      if (model && (model.get('is_open') === isOpen)) {
        info(
          'Received a state change.  New state is the same as the current one.  Current state:',
          model ? model.get('is_open') : 'null',
          'new State:',
          isOpen
        )
        return
      }
      info(
        'Received a new state.  Current state:',
        model ? model.get('is_open') : 'null',
        'new State:',
        isOpen
      )
      return State.forge().save({is_open: isOpen, group_id: req.client.group_id}, options)
    })
    .then(() => {
      res.sendStatus(201)
    })
    .catch(next)
})

// get recent states
router.get('/states', (req, res, next) => {
  const count = parseInt(req.query.count || 20, 10)
  const options = {by: req.client}
  Promise
    .try(() => {
      return new States().query(qb => {
        qb.orderBy('created_at', 'DESC')
        qb.limit(count)
      }).fetch(_.extend({withRelated: ['requestedBy']}, options))
    })
    .call('toJSON')
    .then(collection => {
      if (!req.client.is_trusted) {
        collection = collection.length ? [_.pick(collection[0], 'is_open')] : []
      }
      return collection
    })
    .then(res.json.bind(res))
    .catch(next)
})

export default router
