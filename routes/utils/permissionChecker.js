const models = require('../../models');

const check = function (user, onAdmin, onManager, onUser) {
  if (!user || !user.id) return;
  function check(permission) {
    switch (permission) {
      case 'ADMIN':
        onAdmin()
        break;
      case 'MANAGER':
        onManager();
        break;
      case 'USER':
        onUser();
        break;
      default:
        return;
    }
  }
  if (!user.permission) {
    models.users.findById(user.id).then(function(lookedUpUser) {
      check(lookedUpUser.permission);
    });
  } else {
    check(user.permission);
  }
}

module.exports = {check: check}
