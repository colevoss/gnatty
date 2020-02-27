import { Context } from '../../src';
import { ISubscriptionPayload } from '../../src/interfaces/ISubscriptionPayload';

const mockServer = {
  logger: () => {},
};

const createMockSubPayload = (
  {
    msg = { data: {}, meta: {} },
    reply,
    subject = 'test.subject',
    sid = '1',
    type = 'action',
  }: ISubscriptionPayload = {} as any,
) => ({ msg, reply, subject, sid, type });

describe('Context', () => {
  describe('constructor', () => {
    it('Is new able', () => {
      const context = new Context(
        mockServer as any,
        createMockSubPayload() as any,
      );

      expect(context).toBeDefined();
    });

    it('Calls onCreated when instantiated', () => {
      const spy = jest.spyOn(Context.prototype, 'onCreate');

      new Context(mockServer as any, createMockSubPayload() as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('.send', () => {
    const createMockServer = () => ({
      publish: jest.fn(),
    });

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
    const createMockServer = () => ({
      publish: jest.fn(),
    });

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

    it('Calls onPublish wht the merged payload', () => {
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
});
