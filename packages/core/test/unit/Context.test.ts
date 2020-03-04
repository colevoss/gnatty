import { Context } from '../../src';
import { createMockSubPayload } from '../util/createMockSubPayload';

const createMockServer = ({
  publish = jest.fn(),
  request = jest.fn(),
} = {}) => ({
  publish,
  request,
});

describe('Context', () => {
  describe('constructor', () => {
    it('Is new able', () => {
      const context = new Context(
        createMockServer() as any,
        createMockSubPayload() as any,
      );

      expect(context).toBeDefined();
    });

    it('Calls onCreated when instantiated', () => {
      const spy = jest.spyOn(Context.prototype, 'onCreate');

      new Context(createMockServer() as any, createMockSubPayload() as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('.send', () => {
    it('Sends the response to the reply subject', () => {
      const mockServer = createMockServer();

      const context = new Context(
        mockServer as any,
        createMockSubPayload({ reply: 'test-reply' } as any),
      );

      context.send('test-response');

      expect(mockServer.publish).toHaveBeenCalledWith(
        'test-reply',
        'test-response',
      );
    });

    it('Does not reply if the context does not have a reply', () => {
      const mockServer = createMockServer();

      const context = new Context(mockServer as any, createMockSubPayload());

      context.send('test-response');

      expect(mockServer.publish).not.toHaveBeenCalled();
    });

    it('Calls onSend hook', () => {
      const mockServer = createMockServer();

      const context = new Context(
        mockServer as any,
        createMockSubPayload({ reply: 'test-reply' } as any),
      );

      const spy = jest.spyOn(context, 'onSend');

      context.send('test-response');
      expect(spy).toHaveBeenCalledWith('test-response');
    });
  });

  describe('.publish', () => {
    it('Publishes data to the provided subject', () => {
      const mockServer = createMockServer();

      const context = new Context(mockServer as any, createMockSubPayload());

      context.publish('test.subject', 'test');

      expect(mockServer.publish).toHaveBeenCalledWith(
        'test.subject',
        expect.objectContaining({
          data: 'test',
        }),
      );
    });

    it('Merges its own meta data with provided meta data', () => {
      const mockServer = createMockServer();

      const context = new Context(
        mockServer as any,
        createMockSubPayload({ msg: { meta: { context: 'meta' } } } as any),
      );

      context.publish('test.subject', 'test', { publish: 'meta' });

      expect(mockServer.publish).toHaveBeenCalledWith(
        'test.subject',
        expect.objectContaining({
          data: 'test',
          meta: {
            publish: 'meta',
            context: 'meta',
          },
        }),
      );
    });

    it('Calls onPublish with the merged payload', () => {
      const mockServer = createMockServer();

      const context = new Context(
        mockServer as any,
        createMockSubPayload({ msg: { meta: { context: 'meta' } } } as any),
      );

      const spy = jest.spyOn(context, 'onPublish');

      context.publish('test.subject', 'test', { publish: 'meta' });

      expect(spy).toHaveBeenCalledWith(
        'test.subject',
        expect.objectContaining({
          data: 'test',
          meta: {
            publish: 'meta',
            context: 'meta',
          },
        }),
      );
    });
  });

  describe('request', () => {
    it('Returns the response from', async () => {
      const mockServer = createMockServer({
        request: jest.fn(() => 'response'),
      });

      const context = new Context(mockServer as any, createMockSubPayload());

      const response = await context.request('name', {});

      expect(response).toBe('response');
    });

    it('Merges its own context with the provided context', async () => {
      const mockServer = createMockServer({
        request: jest.fn(() => 'response'),
      });

      const context = new Context(
        mockServer as any,
        createMockSubPayload({
          msg: { meta: { context: 'meta' } },
        } as any),
      );

      await context.request('name', {}, { request: 'meta' });

      expect(mockServer.request).toHaveBeenCalledWith(
        'name',
        {},
        {
          context: 'meta',
          request: 'meta',
        },
        expect.objectContaining({}),
      );
    });

    it('Defatuls meta and options to empty object if not provided', async () => {
      const mockServer = createMockServer({
        request: jest.fn(() => 'response'),
      });

      const context = new Context(mockServer as any, createMockSubPayload());

      await context.request('name', {});

      expect(mockServer.request).toHaveBeenCalledWith(
        'name',
        {},
        expect.objectContaining({}),
        expect.objectContaining({}),
      );
    });

    it('Calls onRequest with the response', async () => {
      const mockServer = createMockServer({
        request: jest.fn(() => 'response'),
      });

      const context = new Context(mockServer as any, createMockSubPayload());

      const spy = jest.spyOn(context, 'onRequest');

      await context.request('name', {});

      expect(spy).toHaveBeenCalledWith('response');
    });
  });
});
