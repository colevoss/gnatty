import { RequestOptions } from 'nats';
import * as pino from 'pino';
import { Server } from './Server';
import { ISubscriptionPayload } from './interfaces/ISubscriptionPayload';

// Context
export class Context<Data = {}, Meta = {}> {
  /**
   * Data that was given on the message.data of the event
   */
  public data: Data;

  /**
   * The meta data that was given on the message.meta of the event
   */
  public meta: Meta;

  /**
   * The type of event this context instance was created for
   */
  public type: 'action' | 'subscription';

  /**
   * An instance of the logger to use for this context
   */
  public logger: pino.Logger;
  public subject: string;

  /**
   * @param server - The server instance that this context belongs to
   * @param payload - The playload of the request this context was created for
   */
  constructor(
    public server: Server,
    public payload: ISubscriptionPayload<Data, Meta>,
  ) {
    this.data = payload.msg.data;
    this.meta = payload.msg.meta;
    this.type = payload.type;
    this.logger = this.server.logger;
    this.subject = payload.subject;

    this.onCreate();
  }

  /**
   * Hook to be ran when an instance of context is created
   */
  public onCreate() {}

  /**
   * Hook to be ran when an event is published from this context
   *
   * @param name - name of the subject being published to
   * @param payload - payload of the event
   */
  public onPublish<Payload = any>(name: string, payload: Payload) {}

  /**
   * Hook to be called when a response is sent back from an action
   *
   * @param response - The response data that was sent from the action that this context was created for
   */
  public onSend<Response = any>(response: Response) {}

  /**
   * Hook to be called when a request has been fetched from this context
   *
   * @param response - Response from a request made from this context
   */
  public onRequest<Reponse = any>(response: Reponse) {}

  /**
   * Reply to a request to an action that this context was created for
   *
   * @param response - Response to send back from this context's action
   */
  public send<Response = any>(response: Response) {
    // If no reply is on the payload, then this wasn't an action that needs to respond to anything
    if (!this.payload.reply) return;

    this.server.publish(this.payload.reply, response);

    this.onSend(response);
  }

  /**
   * Publish an event that shares the meta data with this context
   *
   * @param name - Name of the event to be published
   * @param data - Data to publish on an event
   * @param meta - Meta data to publish on an event
   */
  public publish<PublishData = {}>(
    name: string,
    data: PublishData,
    meta: any = {},
  ) {
    const payload = {
      meta: {
        ...this.meta,
        ...meta,
      },
      data,
    };

    this.server.publish(name, payload);

    this.onPublish(name, payload);
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
    data: object,
    meta: any = {},
    options: RequestOptions = {},
  ): Promise<Response> {
    const response = await this.server.request<Response>(
      name,
      data,
      {
        ...this.meta,
        ...meta,
      },
      options,
    );

    this.onRequest(response);

    return response;
  }
}
