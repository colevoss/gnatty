const { NatsError } = require('nats');
const { EventEmitter } = require('events');

jest.genMockFromModule('nats');

let __testResponse = 'test-response';
let __testSubscribeEvent = [];
let sub = () => {};
let __callSubscription = () => {
  sub();
};

class MockConnection extends EventEmitter {
  constructor() {
    super();

    this.publish = jest.fn();
    this.drain = jest.fn((cb) => {
      cb();
    });

    this.close = jest.fn();

    this.request = jest.fn((name, payload, options, cb) => {
      cb(__testResponse);
    });

    this.subscribe = jest.fn((name, ...rest) => {
      const cb = rest[rest.length - 1];

      sub = () => cb(...__testSubscribeEvent);
    });
  }
}

const connection = new MockConnection();

module.exports = {
  connect: () => connection,

  __setTestResponse: (response) => {
    __testResponse = response;
  },

  __setTestSubscribeEvent: (...args) => {
    __testSubscribeEvent = args;
  },

  __callSubscription,

  __connection: connection,
  __connect: () => connection.emit('connect'),
  __error: (err) => connection.emit('error', err),

  NatsError,
};
