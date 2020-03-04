import { Server, Context } from '../../src';

const nats = require('nats');

class MockServer extends Server {
  public logerFactory() {
    return {
      info: jest.fn(),
      error: jest.fn(),
    };
  }
}

describe('Server', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Is newable', () => {
    const server = new MockServer({
      config: true,
    } as any);

    expect(server).toBeDefined();
    expect(server.connectionConfig).toEqual({ config: true });
    expect(server.logger).toBeDefined();
  });

  describe('.contextFactory', () => {
    it('Returns an instance of Context', async () => {
      const server = new MockServer({} as any);

      const context = await server.contextFactory({
        msg: {
          data: 'data',
        },
      } as any);

      expect(context).toBeInstanceOf(Context);
    });
  });

  describe('.start', () => {
    it('Calls .connected when the server connects to nats', async () => {
      const server = new MockServer({} as any);

      const spy = jest.spyOn(server, 'connected');

      const started = server.start([]);

      nats.__connect();

      return started.then(() => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('.publish', () => {
    it('Publishes a payload to a subject over nats', () => {
      const server = new MockServer({} as any);

      server.connection = nats.__connection;
      server.publish('test.subject', 'payload');

      expect(nats.__connection.publish).toHaveBeenCalledWith(
        'test.subject',
        'payload',
      );
    });
  });

  describe('.stop', () => {
    it('Drains the nats connection', async () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;

      await server.stop();

      expect(nats.__connection.drain).toHaveBeenCalled();
    });
  });

  describe('.request', () => {
    it('Makes a request to a subject and gets a response', async () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;
      nats.__setTestResponse('test-response');

      const response = await server.request('test.subject');

      expect(response).toBe('test-response');
    });

    it('Throws an error if it is a nats error', async () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;

      nats.__setTestResponse(new nats.NatsError('test'));

      await expect(server.request('test.subject')).rejects.toThrowError();
    });

    it('merges data and meta into one payload', async () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;
      nats.__setTestResponse('test-response');

      await server.request('test.subject', { data: 'test' }, { meta: 'test' });

      expect(nats.__connection.request).toHaveBeenCalledWith(
        'test.subject',
        expect.objectContaining({
          data: {
            data: 'test',
          },
          meta: {
            meta: 'test',
          },
        }),
        expect.objectContaining({}),
        expect.any(Function),
      );
    });
  });

  describe('::create', () => {
    it('Returns a new instance of MockServer', () => {
      const mockServer = MockServer.create({ config: true } as any);

      expect(mockServer).toBeInstanceOf(MockServer);
      expect(mockServer.connectionConfig).toEqual({ config: true });
    });
  });

  describe('.subscribe', () => {
    it('Can accept the callback as the second argument', () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;

      const cb = () => {};

      server.subscribe('test.subject', cb);

      expect(server.connection.subscribe).toHaveBeenCalledWith(
        'test.subject',
        expect.any(Function),
      );
    });

    it('Accepts options as the second arg and callback as the third', () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;

      const options = { test: 'options' } as any;
      const cb = () => {};

      server.subscribe('test.subject', options, cb);

      expect(server.connection.subscribe).toHaveBeenCalledWith(
        'test.subject',
        options,
        expect.any(Function),
      );
    });

    it('Calls the handler with the payload object', () => {
      const server = new MockServer({} as any);
      server.connection = nats.__connection;

      nats.__setTestSubscribeEvent(
        { test: 'message' },
        'test-reply',
        'test-subject',
        'test-sid',
      );

      const options = { test: 'options' } as any;
      const cb = jest.fn();

      server.subscribe('test.subject', options, cb);

      nats.__callSubscription();

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: { test: 'message' },
          reply: 'test-reply',
          subject: 'test-subject',
          sid: 'test-sid',
          type: 'subscription',
        }),
      );
    });
  });
});
