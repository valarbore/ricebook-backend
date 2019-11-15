const createResponse = (code, data, msg) => {
  return {
    code,
    data,
    msg,
  };
};
const codes = {
  dbErrorCode: 100,
  requestErrorCode: 101,
  cloudinaryErrorCode: 102,
  successCode: 0,
};

const serverError = 'Something wrong with the server! Try it later!';
const noAuthority = 'No authority!';
const parameterError = 'parameter error!';
const userNotFoundError = 'Can not find this username!';

const createRequestErrorResponse = err => {
  return createResponse(codes.requestErrorCode, '', err);
};
const createSuccessResponse = data => {
  return createResponse(codes.successCode, data, '');
};
const noAuthorityResponse = res => {
  res.status(401).send(createRequestErrorResponse(noAuthority));
};
const dbErrorResponse = (res, err) => {
  console.log(err);
  res.status(500).send(createRequestErrorResponse(serverError));
};
const parameterErrorResponse = res => {
  res.status(400).send(createRequestErrorResponse(parameterError));
};
const userNotFoundErrorResponse = res => {
  res.status(400).send(createRequestErrorResponse(userNotFoundError));
};
const cloudinaryErrorResponse = (res, err) => {
  console.log(err);
  res.status(500).send(createRequestErrorResponse(serverError));
};

module.exports = {
  createRequestErrorResponse,
  createSuccessResponse,
  noAuthorityResponse,
  dbErrorResponse,
  parameterErrorResponse,
  userNotFoundErrorResponse,
  cloudinaryErrorResponse,
};
