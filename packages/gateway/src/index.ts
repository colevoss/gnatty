import * as http from 'http';

class Gateway {
  public httpServer: http.Server;

  constructor() {
    this.createServer();
  }

  public createServer() {
    this.httpServer = http.createServer(this.requestHandler.bind(this));
  }

  private async parseRequestJson(request: http.IncomingMessage) {
    const data: any[] = [];

    return new Promise((resolve) => {
      request
        .on('data', (chunk: any) => {
          data.push(chunk);
        })
        .on('end', () => {
          resolve(JSON.parse(data as any));
        });
    });
  }

  private parsePath(url: string) {
    const path = url.replace(/^\//, '').replace(/\/$/, '');
    const natsSubject = path.split('/').join('.');

    return natsSubject;
  }

  private async requestHandler(
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ) {
    if (request.url === '/favicon.ico') {
      response.end();
      return;
    }

    if (request.method !== 'POST') {
      response.writeHead(400);
      response.end('Not a POST request');

      return;
    }

    const natsSubject = this.parsePath(request.url);
    const payload = await this.parseRequestJson(request);

    console.log(JSON.stringify({ natsSubject, payload }, null, 2));

    response.setHeader('Content-Type', 'application/json');

    response.writeHead(200);
    response.end('HELLOOOO');
  }

  public start() {
    this.httpServer.listen(8080, () => {
      console.log('Listening');
    });
  }
}

const gateway = new Gateway();

gateway.start();
