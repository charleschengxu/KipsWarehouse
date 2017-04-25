const React = require('react');
const ReactDOM = require('react-dom');
const Main = require('./../react/main.js');

class AppGenerator {
  generateAndMountApp() {
    ReactDOM.render(
      <div>
        <Main />
      </div>,
      document.getElementById('reactRoot')
    );
  }
}

module.exports = AppGenerator;
