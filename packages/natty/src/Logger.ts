import * as pino from "pino";

export const logLevel = (env: string) => {
  switch (env) {
    case "test":
      return "error";

    case "dev":
    case "development":
      return "debug";

    default:
      return "info";
  }
};

export const createLogger = () => {
  const env = process.env.NODE_ENV;

  return pino({
    level: logLevel(env),
    prettyPrint: env !== "production",
  });
};
