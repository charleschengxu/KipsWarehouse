const models = require('../../models');

module.exports = function (id, onSuccess, onFail) {
  if (!id) {
    onFail();
  } else {
    models.users.findById(id).then(function(user) {
      console.log("verified " + id );
      if (user && user.permission == 'ADMIN') {
        onSuccess();
      } else {
        onFail();
      }
    });
  }
}
