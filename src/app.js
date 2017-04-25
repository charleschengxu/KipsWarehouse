// require whatwg-fetch as non-chrome/non-safari browsers do not support
// window.fetch()
require('whatwg-fetch');

const Blueprint = require('@blueprintjs/core');
const AppGenerator = require('./appGenerator.js');

const appGenerator = new AppGenerator();

Blueprint.FocusStyleManager.onlyShowFocusOnTabs();
appGenerator.generateAndMountApp();
