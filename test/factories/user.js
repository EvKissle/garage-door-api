import Model from '../../src/db/models/user'

export default (factory) => {
  factory.define('user', Model, {
    name: factory.chance.word(),
    is_active: factory.chance.bool(),
    token_expires_in_minutes: factory.chance.integer({min: 1, max: 9999})
  })
}
