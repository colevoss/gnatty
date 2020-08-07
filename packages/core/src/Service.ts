import * as pino from 'pino';
import { Server } from './Server';
import { Context } from './Context';
import { ISubscriptionPayload } from './interfaces/ISubscriptionPayload';
import { IMiddleware } from './interfaces/IMiddleware';
import { IHandler } from './interfaces/IHandler';
import {
  ACTION_SYMBOL,
  SUBSCRIPTION_SYMBOL,
  MIDDLEWARE_SYMBOL,
  IEndpoint,
} from './Decorators';
import { GnattyError, ErrorNames } from './Errors';

export abstract class Service<S extends Server = Server> {
  /**
   * The name of the service. This will be appended to action names.
   */
  public name: string;

  /**
   * This is the group to be used when publishing endpoints. The service's name
   * will be used if this isn't set
   */
  public group: string;

  /**
   * Instance of a pino logger to be used in this server. It will be namespaced to this service's name
   */
  public logger: pino.Logger;

  /**
   * An array of middle ware to use for each action and subscription in this service.
   * These will be used after any server middleware is used
   *
   */
  public middleware: IMiddleware[] = [];

  constructor(public server: S) {
    this.logger = this.loggerFactory();
  }

  /**
   * This registers the service by creating Nats subscriptions for each action
   * and subscription
   */
  public register() {
    this.logger.info(`Registering service ${this.name} ...`);

    const actions = this.getEndpoints(ACTION_SYMBOL);
    const subscriptions = this.getEndpoints(SUBSCRIPTION_SYMBOL);

    const endpoints = [...actions, ...subscriptions];

    for (const endpoint of endpoints) {
      this.registerEndpoint(endpoint);
    }

    this.logger.info(
      {
        type: 'service',
        serviceName: this.name,
      },
      `${this.name} service registered`,
    );
  }

  /**
   * Factor function that creates a new Context instance per action/subscription
   * event. This can be replaced if you would like to use a different context
   * object
   *
   * @param payload - Payload object from the nats subscription callback
   */
  public async contextFactory(payload: ISubscriptionPayload): Promise<Context> {
    return this.server.contextFactory(payload);
  }

  /**
   * Factory function that creates a standard logger. This can be replaced to use
   * a different logging library. By default this uses pino logger
   */
  public loggerFactory(): pino.Logger {
    return this.server.logger.child({ service: this.name });
  }

  /**
   * Applies middleware by creating a function that calls each middleware function
   * and passing the next middleware function as well as a shared context to
   * be used by each middleware. The returned function then calls the handler
   * function when all the middleware have been called
   *
   * @param middleware - An array of middleware to register
   */
  private applyMiddleware<C extends Context>(middleware: IMiddleware<C>[]) {
    // Function to be called by the nats handler
    return (context: C, handler: IHandler) => {
      return applied(0);

      async function applied(i: number) {
        let next = middleware[i];

        const isHandler = i === middleware.length;

        if (isHandler) {
          return handler(context);
        }

        return next(context, applied.bind(null, i + 1));
      }
    };
  }

  /**
   * Generates the handler function to be used as the callback in the nats subscription
   * handler
   *
   * @param handler - The function that ultimately handles the request
   * @param type - The type of handler function. Either an "action" or a "subscription"
   * @param middleware - An array of middleware to be used for this handler
   */
  private generateHandler(
    handler: IHandler,
    type: 'action' | 'subscription',
    middleware: IMiddleware[] = [],
  ) {
    return async (msg: any, reply: string, subject: string, sid: string) => {
      const context = await this.contextFactory({
        msg,
        reply,
        subject,
        sid,
        type,
      });

      try {
        await this.applyMiddleware(middleware)(context, handler);
      } catch (e) {
        this.logger.error(e);

        if (type === 'subscription') return;

        const error = {
          status: e.status || 500,
          error: e.error || ErrorNames.InternalServerErrorError,
          message: e.message,
          ...((e.data && { data: e.data }) || {}),
        };

        context.send({
          error,
        });
      }
    };
  }

  /**
   * Registers an endpoint whether its an action or subscription.
   * This will compose any middleware from the server, service, and endpoint in
   * that order
   *
   * @param endpoint - The endpoint meta data to be registered for this service
   */
  private registerEndpoint(endpoint: IEndpoint) {
    const handler = endpoint.handler;
    const subscribe = endpoint[SUBSCRIPTION_SYMBOL];
    const action = endpoint[ACTION_SYMBOL];
    const middleware = endpoint[MIDDLEWARE_SYMBOL] || [];

    const serverMiddleware = this.server.middleware;
    const serviceMiddleware = this.middleware;

    const handlerMiddlware = [
      ...serverMiddleware,
      ...serviceMiddleware,
      ...middleware,
    ];

    const type = action ? 'action' : 'subscription';

    const contextHandler = this.generateHandler(
      handler,
      type,
      handlerMiddlware,
    );

    const metadata = subscribe || action;
    const { name } = metadata;
    const queueGroupName = this.group || this.name;
    const subjectName = action ? `${this.name}.${name}` : name;

    // TODO: Update this to suppoert server.subscribe
    this.server.connection.subscribe(
      subjectName,
      { queue: queueGroupName },
      contextHandler,
    );

    this.logger.info(
      {
        type: action ? 'action' : 'subscription',
        subjectName,
      },
      `${action ? 'action' : 'subscription'} ${subjectName} registered`,
    );
  }

  /**
   * Gets endpoint by type that should be registered for this service by getting
   * the metadata that has been put on the handler by the Subscribe or Action decorators
   *
   * @param endpointType - The type symbol that is used to get the type of endpoints of this service
   */
  private getEndpoints(endpointType: symbol) {
    const prototype = Object.getPrototypeOf(this);
    const properties = Object.getOwnPropertyNames(prototype);

    const endpoints: IEndpoint[] = [];

    for (const property of properties) {
      const propertyMetadata =
        Reflect.getOwnMetadata(property, prototype) || {};

      if (!propertyMetadata.hasOwnProperty(endpointType)) {
        continue;
      }

      const action = {
        ...propertyMetadata,
        handler: ((this[property as keyof this] as unknown) as IHandler).bind(
          this,
        ),
      };

      endpoints.push(action);
    }

    return endpoints;
  }
}
