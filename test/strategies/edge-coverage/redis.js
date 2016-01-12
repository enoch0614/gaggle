/**
* Coverage for edge cases in the redis strategy
*/

var Strategy = require('../../../strategies/redis-strategy')
  , test = require('tape')
  , _ = require('lodash')
  , uuid = require('uuid')

test('redis strategy - acquisition times out', function (t) {
  var a = new Strategy({id: uuid.v4()})
    , b = new Strategy({id: uuid.v4()})
    , sameKey = 'timeOutLock'
    , sawExpectedErr = false

  a.lock(sameKey, {
    duration: 10000
  })
  .then(function (lock) {
    return b.lock(sameKey, {
      maxWait: 1
    })
    .catch(function (err) {
      sawExpectedErr = true
      t.equal(err.toString(), 'Error: Timed out before acquiring the lock', 'Should time out with expected error')
    })
    .then(function () {
      return a.unlock(lock)
    })
    .finally(function () {
      t.ok(sawExpectedErr, 'Second acquisition should time out')

      b.close()
      a.close()

      t.end()
    })
  })
})

test('redis strategy - nonce mismatch when unlocking', function (t) {
  var a = new Strategy({id: uuid.v4()})
    , sameKey = 'nonceMismatchLock'

  a.lock(sameKey, {
    duration: 10000
  })
  .then(function (lock) {
    return a.unlock(_.extend({}, lock, {nonce: 'whoops'}))
  })
  .finally(function () {
    a.close()

    t.end()
  })
})
