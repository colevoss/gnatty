const { EventEmitter } = require('events');

jest.genMockFromModule('nats');

class MockConnection extends EventEmitter {
  constructor() {
    super();

    this.publish = jest.fn();
    this.drain = jest.fn((cb) => {
      cb();
    });
  }
}

const connection = new MockConnection();

module.exports = {
  connect: () => connection,

  __connection: connection,
  __connect: () => connection.emit('connect'),
  __error: (err) => connection.emit('error', err),
};
