const models = require('../../models');

const dummyPromise = {
  /**
   * A hack that allows a function to always return a Promise so whoever calls it
   * can call .then() on it.
   */
  hack(t) {
    return models.users.findOne({ transaction: t });
  },
};

module.exports = dummyPromise;
