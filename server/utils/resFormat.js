const createResponse = (code, data, msg) => {
  return {
    code,
    data,
    msg,
  };
};
export const codes = {
  dbErrorCode: 100,
  requestErrorCode: 101,
  cloudinaryErrorCode: 102,
  successCode: 0,
};

const serverError = 'Something wrong with the server! Try it later!';
const noAuthority = 'No authority!';
const parameterError = 'parameter error!';
const userNotFoundError = 'Can not find this username!';

export const createRequestErrorResponse = err => {
  return createResponse(codes.requestErrorCode, '', err);
};
export const createSuccessResponse = data => {
  return createResponse(codes.successCode, data, '');
};
export const noAuthorityResponse = res => {
  res.status(401).send(createRequestErrorResponse(noAuthority));
};
export const dbErrorResponse = (res, err) => {
  console.log(err);
  res.status(500).send(createRequestErrorResponse(serverError));
};
export const parameterErrorResponse = res => {
  res.status(400).send(createRequestErrorResponse(parameterError));
};
export const userNotFoundErrorResponse = res => {
  res.status(400).send(createRequestErrorResponse(userNotFoundError));
};
export const cloudinaryErrorResponse = (res, err) => {
  console.log(err);
  res.status(500).send(createRequestErrorResponse(serverError));
};
