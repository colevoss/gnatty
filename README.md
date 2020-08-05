# Gnatty

Gnatty is a collection of packages for building backend Node.js/TypeScript API's
using the [NATS](https://nats.io/) messaging system. It is geared for building
microservices that communicate over NATS using a request/reply or a pub/sub message
patterns.

## Packages

- [@gnatty/core](/packages/core)
- [@gnatty/gateway](/packages/gateway)

## Installation

### Existing TypeScript Node Project

```
npm install @gnatty/core @gnatty/gateway
```

### New Project

Create a new TypeScript Node project by using the [this](https://github.com/colevoss/typescript-node-boilerplate)
template repo to create your new project. Then clone the new repo and install `@gnatty/core` (and `@gnatty/gateway`
if necessary) to start your project.

## Example

```ts
import { Server, Service, Context, Action, Subscribe } from '@gnatty/core';
import { Gateway } from '@gatty/gateway';

class ExampleServer extends Server {}

class ExampleService extends Service<ExampleServer> {
  public name = 'example';

  @Action('action')
  public async exampleAction(ctx: Context<{ foo: string }>) {
    const { foo } = ctx.data;

    this.logger.info({ foo }, 'example.action was requested');

    ctx.send({ example: 'response' });
  }

  @Subscribe('testSubscription')
  public async testSubscription(ctx: Context<{ bar: string }>) {
    this.logger.info({ bar }, 'testSubscription event was published');
  }
}

const server = ExampleServer.create({
  json: true,
  url: 'nats://localhost:4222',
  user: 'ruser',
  pass: 'T0pS3cr3t',
});

const gateway = new Gateway();

const start = async () => {
  await server.start([ExampleService]);
  await gateway.start();
};

start();
```

The example above creates a gnatty server and registers the `ExampleService`. The
example service creates the `example.action` subject. Any NATS request to the `example.action`
subject with the parameters of `{ foo: string }` will respond with `{ example: 'response' }`
while also logging a message.

The `ExampleService` also subscribes to the `testSubscription` subject. When an event
is published to the `testSubscription` subject, it will be handled by this method.

The example also uses the `@gnatty/gateway` package. This will create an HTTP server
that will forward requests to the correct action based on the requested route and the
service's name and action.

For the example above, making a `POST` request to `locahost:8080/example/action` will
hit the gateway, parse the route to `example.action` and forward the request through
NATS to the `example.action` action in the `ExampleService`.

_**Note:** the example above assumes a nats server is running at nats://localhost:4222. An easy way to achieve
this is by running the [NATS docker image](https://hub.docker.com/_/nats) locally_
