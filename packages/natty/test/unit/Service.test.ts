import {
  Server,
  Service,
  Context,
  Action,
  Subscribe,
  Middlware,
} from '../../src';

const nats = require('nats');

class MockServer extends Server {
  connection = nats.__connection;
  public loggerFactory() {
    return {
      info: jest.fn(),
      error: jest.fn(),
      child: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
      })),
    } as any;
  }
}

class MockService extends Service<MockServer> {
  public name = 'mock';
}

const testFn = jest.fn();

class TestService extends Service<MockServer> {
  public name = 'test';

  @Action('action')
  public testAction(ctx: Context) {
    ctx.send({ test: 'action' });
  }

  @Subscribe('subscription')
  // @ts-ignore
  @Middlware((ctx: any, next: any) => {
    testFn();
    next();
  })
  public testSubscription(ctx: Context) {}
}

let mockServer: MockServer;

describe('Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockServer = new MockServer({} as any);
  });

  it('Is newable', () => {
    const service = new MockService(mockServer);

    expect(service).toBeDefined();
    expect(service.server).toBeInstanceOf(Server);
    expect(service.name).toBe('mock');
  });

  describe('.contextFactory', () => {
    it('Returns an instance of context', async () => {
      const service = new MockService(mockServer);

      const context = await service.contextFactory({
        msg: {
          data: 'data',
        },
      } as any);

      expect(context).toBeInstanceOf(Context);
    });
  });

  describe('register', () => {
    it('Creates subscriptions for each action', () => {
      const service = new TestService(mockServer);

      service.register();

      expect(nats.__connection.subscribe).toHaveBeenCalledWith(
        'test.action',
        { queue: 'test' },
        expect.any(Function),
      );

      expect(nats.__connection.subscribe).toHaveBeenCalledWith(
        'subscription',
        { queue: 'test' },
        expect.any(Function),
      );
    });
  });

  describe('.registerMiddleware', () => {
    it('Creates a function that calls each middleware', () => {
      const service = new TestService(mockServer);

      const middleware = jest.fn((ctx: any, next: any) => {
        next();
      });

      const handler = jest.fn(() => {});

      const wrapped = (service as any).applyMiddleware([middleware]);

      wrapped({ test: 'context' } as any, handler);

      expect(middleware).toHaveBeenCalledWith(
        { test: 'context' },
        expect.any(Function),
      );

      expect(handler).toHaveBeenCalledWith({ test: 'context' });
    });
  });

  describe('.generateHandler', () => {
    it('Creates a wrapper function that calls the handler with an object of the payload', async () => {
      const service = new TestService(mockServer);
      const handler = jest.fn();

      const generatedHandler = (service as any).generateHandler(
        handler,
        'action',
      );

      await generatedHandler(
        { data: { message: 'test' } },
        'test-reply',
        'test-subject',
        'test-sid',
      );

      expect(handler).toHaveBeenCalled();
    });
  });
});
