import * as http from 'http';
import { Server } from '@gnatty/core';

type RequestPayload = {
  [key: string]: any;
};

class GatewayNatyServer extends Server {}

type HrTime = [number, number];

const getTimeDelta = (delta: HrTime) => {
  return delta[0] * 1000 + delta[1] / 1000000;
};

export class Gateway<S extends Server> {
  public httpServer: http.Server;

  constructor(
    public natyServer: S = GatewayNatyServer.create({
      json: true,
      url: 'nats://localhost:4222',
      user: 'ruser',
      pass: 'T0pS3cr3t',
    }) as S,
  ) {
    this.createGatewayServer();
  }

  public createGatewayServer() {
    this.httpServer = http.createServer(this.requestHandler.bind(this));
  }

  private async parseRequestJson(
    request: http.IncomingMessage,
  ): Promise<RequestPayload> {
    const data: any[] = [];

    return new Promise((resolve) => {
      request
        .on('data', (chunk: any) => {
          data.push(chunk);
        })
        .on('end', () => {
          const parsedData: RequestPayload = JSON.parse(data as any);

          resolve(parsedData);
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

    this.natyServer.logger.debug(
      {
        httpUrl: request.url,
        natsSubject,
        payload,
      },
      `Gateway request from ${request.url} to ${natsSubject}`,
    );

    const start = process.hrtime();

    const natsResponse = await this.natyServer.request(
      natsSubject,
      payload.data || {},
      payload.meta || {},
    );

    const delta = process.hrtime(start);
    const deltaMs = getTimeDelta(delta);

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('X-Naty-Response-Time', deltaMs + 'ms');

    let status = 200;
    let error;

    if (natsResponse.error) {
      status = natsResponse.error.status || 500;
      error = natsResponse.error;
    }

    response.writeHead(status);
    response.end(JSON.stringify(error || natsResponse));
  }

  private startGatewayServer() {
    return new Promise((resolve) => {
      this.httpServer.listen(8080, () => {
        resolve();

        this.natyServer.logger.info('Started Gateway server');
      });
    });
  }

  private async startNatyServer() {
    await this.natyServer.start();
    this.natyServer.logger.info('Started Gateway Naty Server');
  }

  public async start() {
    await this.startNatyServer();
    await this.startGatewayServer();
  }
}
