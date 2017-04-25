/**
 * ERROR enum
 */
const ERROR_ENUM = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  TRANSACTION_ERR: 'TRANSACTION_ERR',
  ERROR: 'ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  /* Requests(Orders) */
  CAN_NOT_DELETE_REQUEST: 'CAN_NOT_DELETE_REQUEST',
  CAN_NOT_UPDATE_REQUEST: 'CAN_NOT_UPDATE_REQUEST',
  /* Users */
  CAN_NOT_UPDATE_USER: 'CAN_NOT_UPDATE_USER',
  /* Login */
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
}

/**
 * Build json response to client on UNAUTHORIZED failure.

 * @param {Object} error optional. explain the cause of error.
 */
unauthorized = function(error) {
  return failure(
    error || 'Unauthorized to perform this operation',
    ERROR_ENUM.UNAUTHORIZED
  );
}

/**
 * Build json response to client on failure.

 * @param {Object} error explain the cause of error.
 * @param {Boolean} errorType optional.
 *                  must be one of the string constants in const error enum
 */
failure = function(error, errorType) {
  return {
    status: 'error',
    error: {
      type: errorType || ERROR_ENUM.ERROR,
      message: error
    }
  }
}

/**
 * Build json response to client on success.

 * @param {Object} data optional. The response data.
 */
success = function(data) {
  return {
    status: 'success',
    data: data
  };
}

module.exports = {
  success: success,
  failure: failure,
  unauthorized: unauthorized,
  ERROR: ERROR_ENUM
};
