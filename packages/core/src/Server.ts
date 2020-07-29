import * as nats from 'nats';
import * as pino from 'pino';
import { Context } from './Context';
import * as Logger from './Logger';
import { Service } from './Service';
import { ISubscriptionPayload } from './interfaces/ISubscriptionPayload';
import { IMiddleware } from './interfaces/IMiddleware';
import { ClassType } from './interfaces/ClassType';

type SubscriptionHandler = (payload: ISubscriptionPayload) => void;

export abstract class Server {
  /**
   * Nats client connection
   */
  connection: nats.Client;

  /**
   * Configuration to be given to the Nats client
   */
  connectionConfig: nats.ClientOpts;

  /**
   * Middleware that will be used in all services and actions
   */
  public middleware: IMiddleware[] = [];

  public logger: pino.Logger;

  /**
   * Whether or not this server has connected to the nats server
   */
  public isConnected: boolean = false;

  constructor(config: nats.ClientOpts) {
    this.connectionConfig = config;
    this.logger = this.loggerFactory();
  }

  /**
   * Publish an event to a subject with a payload
   *
   * @param subject - Subject to publish an event to
   * @param payload - Payload to publish to the event
   */
  public publish<Payload = object>(subject: string, payload: Payload) {
    this.connection.publish(subject, payload);
  }

  public subscribe(subject: string, callback: SubscriptionHandler): void;
  public subscribe(
    subject: string,
    options: nats.SubscribeOptions,
    callback: SubscriptionHandler,
  ): void;
  public subscribe(
    subject: string,
    options: nats.SubscribeOptions | SubscriptionHandler,
    callback?: SubscriptionHandler,
  ): void {
    let subscriptionCallback: Function;
    let subscriptionOptions: any;

    if (typeof options === 'function') {
      subscriptionCallback = options;
    } else if (typeof options === 'object') {
      subscriptionCallback = callback;
      subscriptionOptions = options;
    }

    const handler = (msg: any, reply: string, subject: string, sid: string) => {
      const subscriptionPayload = {
        msg,
        reply,
        subject,
        sid,
        type: 'subscription',
      };

      subscriptionCallback(subscriptionPayload);
    };

    if (subscriptionOptions) {
      this.connection.subscribe(subject, subscriptionOptions, handler);
    } else {
      this.connection.subscribe(subject, handler);
    }
  }

  public stop() {
    return new Promise((resolve) => {
      this.connection.drain(() => {
        resolve();
      });
    });
  }

  /**
   * Make a request to another nats request/reply subject
   *
   * @param name - Name of the nats subject to request
   * @param data - Data to be sent with the request
   * @param meta - Meta data to be send with the request
   * @param options - nats.RequestOptions that can be used when requesting data
   */
  public async request<Response = any>(
    name: string,
    data: object = {},
    meta: any = {},
    options: nats.RequestOptions = {},
  ): Promise<Response> {
    const payload = {
      meta,
      data,
    };

    return new Promise((resolve, reject) => {
      this.connection.request(name, payload, options, (response: Response) => {
        if (response instanceof nats.NatsError) {
          reject(response);

          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * Factory function that creates a standard logger. This can be replaced to use
   * a different logging library. By default this uses pino logger
   */
  public loggerFactory(): pino.Logger {
    return Logger.createLogger();
  }

  /**
   * Factory function that creates a new Context instance per action/subscription
   * event. This can be replaced if you would like to use a different context
   * object
   *
   * @param payload - Payload object from the nats subscription callback
   */
  public async contextFactory(payload: ISubscriptionPayload): Promise<Context> {
    return new Context(this, payload);
  }

  /**
   * Instantiates a new instance of a Naty server and returns it. This is the
   * same as calling the following but this gives a more concise API.
   * ```
   * const server = new Server(config);
   * ```
   *
   * @param connectionConfig - Nats client options for connecting to a nats server
   */
  public static create<S extends Server>(
    this: ClassType<S>,
    connectionConfig: nats.ClientOpts,
  ) {
    const server = new this(connectionConfig);

    return server;
  }

  /**
   * Hook that is called after the server has been created but before it connects
   * to the Nats server
   * Do we need this any more?
   * Yeah IDK
   * HELLO
   */
  // public async created() {}

  /**
   * Hook that is called after a this server has connected to the Nats server
   */
  public async connected() {}

  /**
   * Hook that is called after all services have been registered
   */
  public async started() {}

  /**
   * Connects to the nats server, registers the services given.
   *
   * @param services - Array of services that should be registered on this server
   */
  public async start<S extends Service<this>>(services: ClassType<S>[] = []) {
    // TODO: Error handling
    return new Promise((resolve, reject) => {
      this.connection = nats.connect(this.connectionConfig);

      this.connection.on('connect', async () => {
        this.isConnected = true;

        this.logger.info('Connected to nats');
        await this.connected();

        this.registerServices(services);

        resolve();

        this.logger.info('Server started');
        await this.started();
      });

      this.connection.on('error', (err) => {
        this.logger.error(err);
      });

      this.connection.on('disconnect', () => {
        this.logger.info('Diconnected from nats server');
      });
    });
  }

  /**
   * Registers many services
   *
   * @param services - Array of services to register on this server
   */
  public registerServices<S extends Service<this>>(services: ClassType<S>[]) {
    for (const service of services) {
      this.registerService(service);
    }
  }

  /**
   * Registers a service.
   *
   * @param service - Service to register on this server
   */
  public registerService<S extends Service<this>>(serviceType: ClassType<S>) {
    const service = new serviceType(this);

    service.register();
  }
}
