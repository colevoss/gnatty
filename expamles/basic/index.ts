import {
  Server,
  Service,
  Context,
  Action,
  Middleware,
  NextFn,
} from '../../packages/core';
import { Gateway } from '../../packages/gateway';

class MyServer extends Server {}

class TestService extends Service<MyServer> {
  public name = 'test';

  @Action('action')
  @Middleware(async (ctx: Context, next: NextFn) => {
    await next();
  })
  public testAction(ctx: Context) {
    // throw new Error('asdfasdfasdfasdfasdf');
    ctx.send({ awesome: 'test' });
  }
}

const serv = MyServer.create({
  json: true,
  url: 'nats://localhost:4222',
  user: 'ruser',
  pass: 'T0pS3cr3t',
});

const start = async () => {
  await serv.start([TestService]);
};

const gateway = new Gateway();

start().then(() => {
  return gateway.start();
});
