const _ = require('lodash');
const React = require('react');
const User = require('./../components/cards/user.js');

const UsersList = React.createClass({
  propTypes: {
    users: React.PropTypes.array,
    updateUserPermission: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      users: [],
    };
  },
  getUser(userObj) {
    return (
      <div className="itemWrapper pt-card" key={userObj.id}>
        <User
          userId={userObj.id}
          name={userObj.displayName}
          email={userObj.email}
          permission={userObj.permission}
          updateUserPermission={this.props.updateUserPermission}
        />
      </div>
    );
  },
  render() {
    return (
      <div className="itemList">
        {_.map(this.props.users, this.getUser)}
      </div>
    );
  },
});

module.exports = UsersList;
