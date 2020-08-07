import { STATUS_CODES } from 'http';

export enum ErrorNames {
  BadRequestError = 'BadRequestError',
  UnauthorizedError = 'UnauthorizedError',
  PaymentRequiredError = 'PaymentRequiredError',
  ForbiddenError = 'ForbiddenError',
  NotFoundError = 'NotFoundError',
  MethodNotAllowedError = 'MethodNotAllowedError',
  NotAcceptableError = 'NotAcceptableError',
  ProxyAuthenticationRequiredError = 'ProxyAuthenticationRequiredError',
  RequestTimeoutError = 'RequestTimeoutError',
  ConflictError = 'ConflictError',
  GoneError = 'GoneError',
  LengthRequiredError = 'LengthRequiredError',
  PreconditionFailedError = 'PreconditionFailedError',
  PayloadTooLargeError = 'PayloadTooLargeError',
  URITooLongError = 'URITooLongError',
  UnsupportedMediaTypeError = 'UnsupportedMediaTypeError',
  RangeNotSatisfiableError = 'RangeNotSatisfiableError',
  ExpectationFailedError = 'ExpectationFailedError',
  ImaTeapotError = 'ImaTeapotError',
  MisdirectedRequestError = 'MisdirectedRequestError',
  UnprocessableEntityError = 'UnprocessableEntityError',
  LockedError = 'LockedError',
  FailedDependencyError = 'FailedDependencyError',
  UnorderedCollectionError = 'UnorderedCollectionError',
  UpgradeRequiredError = 'UpgradeRequiredError',
  PreconditionRequiredError = 'PreconditionRequiredError',
  TooManyRequestsError = 'TooManyRequestsError',
  RequestHeaderFieldsTooLargeError = 'RequestHeaderFieldsTooLargeError',
  UnavailableForLegalReasonsError = 'UnavailableForLegalReasonsError',
  InternalServerErrorError = 'InternalServerErrorError',
  NotImplementedError = 'NotImplementedError',
  BadGatewayError = 'BadGatewayError',
  ServiceUnavailableError = 'ServiceUnavailableError',
  GatewayTimeoutError = 'GatewayTimeoutError',
  HTTPVersionNotSupportedError = 'HTTPVersionNotSupportedError',
  VariantAlsoNegotiatesError = 'VariantAlsoNegotiatesError',
  InsufficientStorageError = 'InsufficientStorageError',
  LoopDetectedError = 'LoopDetectedError',
  BandwidthLimitExceededError = 'BandwidthLimitExceededError',
  NotExtendedError = 'NotExtendedError',
  NetworkAuthenticationRequiredError = 'NetworkAuthenticationRequiredError',
}

export class GnattyError extends Error {
  constructor(
    message: string,
    public status: number,
    public error: keyof typeof ErrorNames,
    public data?: any,
  ) {
    super(message);
    this.name = this.error;
  }
}

type Errors = {
  [errorName in ErrorNames]: new (message: string, data?: any) => GnattyError;
};

const createErrorClass = function (
  statusCode: string,
  name: keyof typeof ErrorNames,
) {
  return <new (message: string) => GnattyError>(
    (<any>function (message: string, data?: any) {
      return new GnattyError(message, parseInt(statusCode, 10), name, data);
    })
  );
};

export const GnattyErrors: Errors = Object.keys(STATUS_CODES)
  .filter((code) => parseInt(code, 10) >= 400)
  .reduce<Errors>((errors: Errors, errorCode: ErrorNames) => {
    let errorType = (STATUS_CODES[errorCode].replace(/\W/g, '') +
      'Error') as keyof typeof ErrorNames;

    errors[errorType] = createErrorClass(errorCode, errorType);

    return errors;
  }, {} as Errors);
