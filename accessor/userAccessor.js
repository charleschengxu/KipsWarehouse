const queryString = require('query-string');
const configAccessor = require('./configAccessor');

const URL = configAccessor.getUrl();
const API_URL = configAccessor.getApiUrl();
const USER_KEY = 'userInfo';
const OAUTH_URL = 'https://oauth.oit.duke.edu/oauth/authorize.php';
const CLIENT_ID = 'kipswarehouse';

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

function _getAccessTokenFromURL() {
  const url = window.location.href;
  const regex = new RegExp('access_token(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  return results ? results[2] : undefined;
}

function _getLoginQueryString() {
  return '?' + queryString.stringify({
    response_type: 'token',
    redirect_uri: URL,
    client_id: CLIENT_ID,
    scope: 'basic identity:netid:read',
    state: 11291,
  });
}

async function _loginAsync(credentials) {
  const loginUrl = URL + 'login/';
  const body = {
    username: credentials.username || undefined,
    password: credentials.password || undefined,
    accessToken: credentials.accessToken || undefined,
  };
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  console.log(responseJson);
  if (responseJson.status === 'success') {
    sessionStorage.setItem(USER_KEY, JSON.stringify(responseJson.data));
  } else {
    sessionStorage.removeItem(USER_KEY);
  }
  return responseJson;
}

const userAccessor = {
  _getAuthHeader() {
    return {
      'Authorization': 'JWT ' + this.getToken(),
      'Content-Type': 'application/json',
    };
  },
  getAuthHeader() {
    return {
      'Authorization': 'JWT ' + this.getToken(),
      'Content-Type': 'application/json',
    };
  },
  // =========================================================================
  // Login/Logout
  // =========================================================================
  isLoggedIn() {
    const token = this.getToken();
    const id = this.getId();
    const permission = this.getPermission();
    return token && !isNaN(id) && permission;
  },
  isRedirected() {
    return _getAccessTokenFromURL() ? true : false;
  },
  getUserInfo() {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  },
  getId() {
    const user = this.getUserInfo();
    return user ? user.id : undefined;
  },
  getToken() {
    const user = this.getUserInfo();
    return user ? user.token : undefined;
  },
  getPermission() {
    const user = this.getUserInfo();
    return user ? user.permission : undefined;
  },
  getEmail() {
    const user = this.getUserInfo();
    return user ? user.email : undefined;
  },
  /**
   * @param {string} username
   * @param {string} password
   */
  async loginAsync(username, password) {
    return _loginAsync({ username, password });
  },
  async loginWithToken() {
    await _loginAsync({ accessToken: _getAccessTokenFromURL() });
    window.location.replace(URL);
  },
  loginWithNetId() {
    window.location.replace(OAUTH_URL + _getLoginQueryString());
  },
  logout() {
    sessionStorage.removeItem(USER_KEY);
  },

  // =========================================================================
  // Users
  // =========================================================================
  async getMyApiKeyAsync() {
    const getKeyUrl = API_URL + 'users/apikey';
    const response = await fetch(getKeyUrl, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('getMyApiKeyAsync response: ', responseJson);
    return responseJson;
  },
  /**
   * @param {string} userId
   * @param {string} permssion ADMIN, MANAGER, USER
   */
  async grantPermissionToUserAsync(userId, permission) {
    return this.updateUserByIdAsync(userId, { permission });
  },
  /**
   * @param  {String}  username
   * @param  {String}  password
   * @param  {Object}  extra {displayName, email, permission}
   */
  async createUserAsync(username, password, extra) {
    const createUserUrl = API_URL + 'users/' + username + '/' + password + '/';
    const body = {
      displayName: extra.displayName || username,
      email: extra.email,
      permission: extra.permission || 'USER',
    };
    const response = await fetch(createUserUrl, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log('createUserAsync response: ', responseJson);
    return responseJson;
  },
  /**
   * @param  {Object}  query {userId, name, rowPerPage, pageNumber}
   */
  async getUsersByQueryAsync(query) {
    let getUsersUrl = API_URL + 'users/';
    if (query) {
      const queryParams = {
        userId: query.userId || undefined,
        name: query.name || undefined,
        rowPerPage: query.rowPerPage || undefined,
        pageNumber: query.pageNumber || undefined,
      };
      getUsersUrl += '?' + queryString.stringify(queryParams);
    }
    const response = await fetch(getUsersUrl, {
      method: 'GET',
      headers: userAccessor.getAuthHeader(),
    });
    const responseJson = await response.json();
    console.log('getUsersByQueryAsync response: ', responseJson);
    return responseJson;
  },
  async updateUserByIdAsync(userId, update) {
    const updateUserUrl = API_URL + 'users/' + userId + '/';
    const body = {
      displayName: update.displayName || undefined,
      email: update.email || undefined,
      permission: update.permission || undefined,
    };
    const response = await fetch(updateUserUrl, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();
    console.log('updateUserByIdAsync reponse: ', responseJson);
    return responseJson;
  },
  async searchUsersByNameAsync(partialName) {
    return this.getUsersByQueryAsync({ name: partialName });
  },
};

module.exports = userAccessor;
