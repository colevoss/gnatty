# Server

## Basic Usage

```ts
import { Server } from '@gnatty/core';

class MyServer extends Server {}

const server = MyServer.create({
  json: true,
  url: 'nats://localhost:4222',
  user: 'ruser',
  pass: 'T0pS3cr3t',
});

const gateway = new Gateway();

const start = async () => {
  await server.start([
    /* Array of services to register */
  ]);
  await gateway.start();
};

start();
```

## About

The `Server` class serves as the main part of the Gnatty framework. This class
is responsible for creating a connection to a NATS server, registering service(s)
actions and subscriptions. It also acts as the main factory for other parts of the
framework like `Context`, loggers, and `Middleware`.

## Docs

### middleware

```ts
IMiddleware[]
```

Middleware that will be used in all services and actions

### logger

```ts
pino.Logger;
```

The default logger to be used and inherited from across all services and contexts
that are registered or created by this server.

### isConnected

```ts
boolean = false;
```

Whether or not this server has connected to the nats server

### publish

```ts
publish<P>(subject: string, payload: P)
```

Publish an event to a subject with a payload

### subscribe

```ts
subscribe(subject: string, callback: SubscriptionHandler)
subscribe(
  subject: string,
  options: nats.SubscribeOptions,
  callback: SubscriptionHandler,
)
subscribe(
  subject: string,
  options: nats.SubscribeOptions | SubscriptionHandler,
  callback?: SubscriptionHandler,
)
```

Subscribes the provided handler to the provided subject.

### stop

[Drains](https://github.com/nats-io/nats.js#draining-connections-and-subscriptions) all subscriptions and closes the connection to the NATS server.

### request

```ts
async request<Response = any>(
  name: string,
  data: object = {},
  meta: any = {},
  options: nats.RequestOptions = {},
): Promise<Response>
```

Make a request to another nats request/reply subject

### loggerFactory

```ts
public loggerFactory(): pino.Logger
```

Factory function that creates a standard logger. This can be replaced to use a different logging library.

By default this uses pino logger.

### contexFactory

```ts
async contextFactory(
  payload: ISubscriptionPayload
): Promise<Context>
```

Factory function that creates a new Context instance per action/subscription event.
This can be replaced if you would like to use a different context object.

### Server.create

```ts
static create<S extends Server>(
  this: ClassType<S>,
  connectionConfig: nats.ClientOpts,
): S
```

Instantiates a new instance of a Naty server and returns it. This is the same as
calling the following but this gives a more concise API.

```ts
const server = new Server(config);
```

### connected

Hook that is called after a this server has connected to the Nats server

### started

Hook that is called after all services have been registered

### start

```ts
async start<S extends Service<this>>(
  services: ClassType<S>[] = []
)
```

Connects to the nats server, registers the services given.

### registerServices

```ts
registerServices<S extends Service<this>>(
  services: ClassType<S>[]
)
```

Registers many services

### registerService

```ts
public registerService<S extends Service<this>>(
  serviceType: ClassType<S>
)
```

Registers a service.
