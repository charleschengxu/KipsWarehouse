const _ = require('lodash');
const React = require('react');
const Loan = require('./../components/cards/loan.js');

const LoanList = React.createClass({
  propTypes: {
    loans: React.PropTypes.array.isRequired,
    permission: React.PropTypes.string.isRequired,
    onDisburseClick: React.PropTypes.func.isRequired,
    onReturnClick: React.PropTypes.func.isRequired,
    hideNonIdealState: React.PropTypes.string,
    addPadding: React.PropTypes.bool,
  },
  getDefaultProps() {
    return {
      hideNonIdealState: null,
      addPadding: true,
    };
  },
  getLoan(loanObj) {
    return (
      <div className="requestWrapper pt-card" key={loanObj.id}>
        <Loan
          id={loanObj.id}
          bundleId={loanObj.bundleId}
          name={loanObj.itemName}
          quantity={loanObj.quantity}
          requestStatus={loanObj.orderStatus}
          adminComment={loanObj.adminComment || ''}
          userComment={loanObj.userComment || ''}
          permission={this.props.permission}
          displayName={loanObj.displayName}
          onDisburseClick={this.props.onDisburseClick}
          onReturnClick={this.props.onReturnClick}
          instances={loanObj.instances}
        />
      </div>
    );
  },
  getNoLoansDialog() {
    return (
      <div>
        {!this.props.hideNonIdealState &&
          <div className="nonIdealState pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
              <span className="pt-icon pt-icon-folder-open" />
            </div>
            <h4 className="pt-non-ideal-state-title">No loans are currently outstanding</h4>
          </div>
        }
      </div>
    );
  },
  render() {
    const requestListEmpty = _.isEmpty(this.props.loans);
    const className = this.props.addPadding ? 'logListContainer navBarPadding' : 'logListContainer';
    return (
      <div className={className}>
        {requestListEmpty ? this.getNoLoansDialog() : _.map(this.props.loans, this.getLoan)}
      </div>
    );
  },
});

module.exports = LoanList;
