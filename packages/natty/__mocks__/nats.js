const { NatsError } = require('nats');
const { EventEmitter } = require('events');

jest.genMockFromModule('nats');

let __testResponse = 'test-response';

class MockConnection extends EventEmitter {
  constructor() {
    super();

    this.publish = jest.fn();
    this.drain = jest.fn((cb) => {
      cb();
    });

    this.request = jest.fn((name, payload, options, cb) => {
      cb(__testResponse);
    });
  }
}

const connection = new MockConnection();

module.exports = {
  connect: () => connection,

  __setTestResponse: (response) => {
    __testResponse = response;
  },

  __connection: connection,
  __connect: () => connection.emit('connect'),
  __error: (err) => connection.emit('error', err),

  NatsError,
};
