import * as pino from 'pino';

export const logLevel = (env: string) => {
  switch (env) {
    case 'test':
      return 'error';

    /* istanbul ignore next */
    case 'dev':
    /* istanbul ignore next */
    case 'development':
      return 'debug';

    /* istanbul ignore next */
    default:
      return 'info';
  }
};

export const createLogger = () => {
  const env = process.env.NODE_ENV;

  return pino({
    level: logLevel(env),
    prettyPrint: env !== 'production',
  });
};
