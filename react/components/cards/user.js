const _ = require('lodash');
const React = require('react');
const PERMISSIONS = require('./../../enums/permissions.js');

const User = React.createClass({
  propTypes: {
    userId: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired,
    email: React.PropTypes.string,
    permission: React.PropTypes.string.isRequired,
    updateUserPermission: React.PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      email: '',
    };
  },
  onSelectChange(e) {
    this.props.updateUserPermission(this.props.userId, e.target.value);
  },
  getOptions(perm) {
    const permissionsOptions = _.toArray(PERMISSIONS);
    _.pull(permissionsOptions, perm);
    return (
      <select onChange={this.onSelectChange}>
        <option key={perm} value={perm}>{_.capitalize(perm)}</option>
        <option
          key={permissionsOptions[0]}
          value={permissionsOptions[0]}
        >
          {_.capitalize(permissionsOptions[0])}
        </option>
        <option
          key={permissionsOptions[1]}
          value={permissionsOptions[1]}
        >
          {_.capitalize(permissionsOptions[1])}
        </option>
      </select>
    );
  },
  render() {
    return (
      <div className="item">
        <label htmlFor={'name'} className="itemLabel pt-ui-text-large">{this.props.name}</label>
        <div className="itemParameters">
          <div className="locationAndModelLabel">
            <label htmlFor={'userTypeLabel'} className="modelLabel pt-running-text-small">{'User Type: '}</label>
            <label htmlFor={'modelLabel'} className="modelLabel pt-running-text-small">
              {this.getOptions(this.props.permission)}
            </label>
          </div>
          <label htmlFor={'description'} className="description pt-running-text-small">
            {this.props.email}
          </label>
        </div>
      </div>
    );
  },
});

module.exports = User;
