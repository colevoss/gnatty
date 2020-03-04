import {
  Server,
  Service,
  Context,
  Action,
  Middleware,
  NextFn,
} from '../../packages/natty/src';

class MyServer extends Server {}

class TestService extends Service<MyServer> {
  public name = 'test';

  @Action('action')
  @Middleware((ctx: Context, next: NextFn) => {
    throw new Error('asdfasdf');
  })
  public testAction(ctx: Context) {
    throw new Error('asdfasdfasdfasdfasdf');
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

const makeRequest = async () => {
  const res = await serv.request('test.action');

  console.log(res);
};

start().then(() => {
  setTimeout(async () => {
    await makeRequest();
  }, 500);
});
