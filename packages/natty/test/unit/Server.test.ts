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

      // nats.__connection.drain();

      await server.stop();

      expect(nats.__connection.drain).toHaveBeenCalled();
    });
  });

  describe('.request', () => {
    it.todo('makes a request to a subject and gets a response');
    it.todo('merges data and meta into one payload');
    it.todo('It defaults options');
  });
});
