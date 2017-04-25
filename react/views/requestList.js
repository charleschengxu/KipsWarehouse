const _ = require('lodash');
const React = require('react');
const Request = require('./../components/cards/request.js');
const Loan = require('./../components/cards/loan.js');
const PERMISSIONS = require('./../enums/permissions.js');
const TYPE = require('./../enums/type.js')

const RequestList = React.createClass({
  propTypes: {
    requests: React.PropTypes.array.isRequired,
    permission: React.PropTypes.string.isRequired,
    processRequest: React.PropTypes.func.isRequired,
    hideNonIdealState: React.PropTypes.string,
    hideProcessButton: React.PropTypes.bool.isRequired,
    onDisburseClick: React.PropTypes.func.isRequired,
    onReturnClick: React.PropTypes.func.isRequired,
    getFilenameFromHandle: React.PropTypes.func,
    addPadding: React.PropTypes.bool,
    approveBackfill: React.PropTypes.func,
    denyBackfill: React.PropTypes.func,
  },
  getDefaultProps() {
    return {
      hideNonIdealState: null,
      addPadding: true,
    };
  },
  getRequest(requestObj) {
    // add logic to return request or loan object based on requestObj type
    if (requestObj.orderType === TYPE.LOAN) {
      return (
        <div className="requestWrapper pt-card" key={requestObj.id}>
          <Loan
            id={requestObj.id}
            bundleId={requestObj.bundleId}
            name={requestObj.itemName}
            quantity={requestObj.quantity}
            requestStatus={requestObj.orderStatus}
            adminComment={requestObj.adminComment || ''}
            userComment={requestObj.userComment || ''}
            permission={this.props.permission}
            displayName={requestObj.displayName}
            onDisburseClick={this.props.onDisburseClick}
            onReturnClick={this.props.onReturnClick}
            backfillStatus={requestObj.backfillStatus}
            fileHandles={requestObj.proofs}
            showTag={'t'}
            approveBackfill={this.props.approveBackfill}
            denyBackfill={this.props.denyBackfill}
            instances={requestObj.instances}
          />
        </div>
      );
    }
    return (
      <div className="requestWrapper pt-card" key={requestObj.id}>
        <Request
          id={requestObj.id}
          name={requestObj.itemName}
          quantity={requestObj.quantity}
          requestStatus={requestObj.orderStatus}
          adminComment={requestObj.adminComment || ''}
          userComment={requestObj.userComment || ''}
          permission={this.props.permission}
          processRequest={this.props.processRequest}
          hideProcessButton={this.props.hideProcessButton}
          showTag={'t'}
          instances={requestObj.instances}
          backfillStatus={requestObj.backfillStatus}
          fileHandles={requestObj.proofs}
        />
      </div>
    );
  },
  getNoRequestsDialog() {
    return (
      <div>
        {!this.props.hideNonIdealState &&
          <div className="nonIdealState pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
              <span className="pt-icon pt-icon-folder-open" />
            </div>
            <h4 className="pt-non-ideal-state-title">No requests have been made</h4>
            {(this.props.permission === PERMISSIONS.ADMIN) &&
              <div className="pt-non-ideal-state-description">
                {'Dispatch an item to populate this list.'}
              </div>
            }
            {(this.props.permission !== PERMISSIONS.ADMIN) &&
              <div className="pt-non-ideal-state-description">
                {'Request an item to populate this list.'}
              </div>
            }
          </div>
        }
      </div>
    );
  },
  render() {
    const requestListEmpty = _.isEmpty(this.props.requests);
    const className = this.props.addPadding ? 'requestList navBarPadding' : 'requestList';
    return (
      <div className={className}>
        {requestListEmpty && this.getNoRequestsDialog()}
        {!requestListEmpty && _.map(this.props.requests, this.getRequest)}
      </div>
    );
  },
});

module.exports = RequestList;
