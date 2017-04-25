const React = require('react');
const BlueprintDateTime = require('@blueprintjs/datetime');

const EmailView = React.createClass({
  propTypes: {
    subjectPrefix: React.PropTypes.string.isRequired,
    loanEmailBodyPrefix: React.PropTypes.string.isRequired,
    loanReminderDate: React.PropTypes.instanceOf(Date).isRequired,
    onUpdateLoanReminderTemplate: React.PropTypes.func.isRequired,
    onUpdateSubjectPrefix: React.PropTypes.func.isRequired,
    onSetDateToSendLoanReminders: React.PropTypes.func.isRequired,
  },
  getInitialState() {
    const currentDate = new Date();
    return {
      minDate: currentDate,
      date: this.props.loanReminderDate,
      subjectPrefix: this.props.subjectPrefix,
      loanEmailBodyPrefix: this.props.loanEmailBodyPrefix,
    };
  },
  onSubjectPrefixChange(e) {
    this.setState({ subjectPrefix: e.target.value });
  },
  onLoanEmailBodyChange(e) {
    this.setState({ loanEmailBodyPrefix: e.target.value });
  },
  getRevertButton() {
    if ((this.props.loanReminderDate !== this.state.date) ||
      (this.props.subjectPrefix !== this.state.subjectPrefix) ||
      (this.props.loanEmailBodyPrefix !== this.state.loanEmailBodyPrefix)) {
      return (<button className="confirmRequestButton pt-button" onClick={this.revertForm}>{'Revert'}</button>);
    }
    return (<button className="confirmRequestButton pt-button pt-disabled" onClick={this.revertForm}>{'Revert'}</button>);
  },
  revertForm() {
    this.setState({
      minDate: new Date(),
      date: this.props.loanReminderDate,
      subjectPrefix: this.props.subjectPrefix,
      loanEmailBodyPrefix: this.props.loanEmailBodyPrefix,
    });
  },
  handleDateChange(e) {
    this.setState({ date: e });
  },
  submitForm() {
    if (this.props.loanReminderDate !== this.state.date) {
      this.props.onSetDateToSendLoanReminders(this.state.date);
    }
    if (this.props.subjectPrefix !== this.state.subjectPrefix) {
      this.props.onUpdateSubjectPrefix(this.state.subjectPrefix);
    }
    if (this.props.loanEmailBodyPrefix !== this.state.loanEmailBodyPrefix) {
      this.props.onUpdateLoanReminderTemplate(this.state.loanEmailBodyPrefix);
    }
  },
  render() {
    return (
      <div className="newItemForm">
        <div className="newItemTitleContainer">
          <h3 className="newItemTitle">{'Email configuration'}</h3>
        </div>
        <div className="newItemFormInner">
          <label htmlFor={'subjectLine'} className="formLabel pt-label">
            {'Subject line prefix for all Kip\'s Warehouse emails:'}
            <input
              className="fullNameInput pt-input"
              onChange={this.onSubjectPrefixChange}
              value={this.state.subjectPrefix}
              type="text"
              dir="auto"
            />
          </label>
          <label htmlFor={'loanEmailBody'} className="formLabel pt-label">
            {'Email body prefix for loan reminder emails'}
            <textarea
              className="descriptionInput pt-fill pt-input"
              onChange={this.onLoanEmailBodyChange}
              value={this.state.loanEmailBodyPrefix}
              dir="auto"
            />
          </label>
          <label htmlFor={'date'} className="formLabel pt-label">
            {'Send loan reminder to all users with outstanding loans on:'}
            <div>
              <BlueprintDateTime.DateInput
                value={this.state.date}
                onChange={this.handleDateChange}
                minDate={this.state.minDate}
              />
            </div>
          </label>
        </div>
        <div className="createItemContainer">
          {this.getRevertButton()}
          <button className="confirmRequestButton pt-button pt-intent-primary" onClick={this.submitForm}>{'Update'}</button>
        </div>
      </div>
    );
  },
});

module.exports = EmailView;
