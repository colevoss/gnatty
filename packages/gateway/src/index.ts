import * as http from 'http';
import { Server } from '@gnatty/core';

type RequestPayload = {
  [key: string]: any;
};

class GnattyGatewayServer extends Server {}

type HrTime = [number, number];

const getTimeDelta = (delta: HrTime) => {
  return delta[0] * 1000 + delta[1] / 1000000;
};

export class Gateway<S extends Server> {
  public httpServer: http.Server;

  constructor(public gnattyServer: S = GnattyGatewayServer.create() as S) {
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

    this.gnattyServer.logger.debug(
      {
        httpUrl: request.url,
        natsSubject,
        payload,
      },
      `Gateway request from ${request.url} to ${natsSubject}`,
    );

    const start = process.hrtime();

    const natsResponse = await this.gnattyServer.request(
      natsSubject,
      payload.data || {},
      {
        ...(payload.meta || {}),
        ...request.headers,
      },
    );

    const delta = process.hrtime(start);
    const deltaMs = getTimeDelta(delta);

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('X-Gnatty-Response-Time', deltaMs + 'ms');

    let status = 200;
    let error;

    if (natsResponse.error) {
      status = natsResponse.error.status || 500;
      error = natsResponse.error;
    }

    const responseData = error || natsResponse;

    response.writeHead(status);
    response.end(JSON.stringify(responseData));

    this.gnattyServer.logger.debug(
      {
        httpUrl: request.url,
        natsSubject,
        response: responseData,
        elapsedMs: deltaMs,
      },
      `Gateway response from ${request.url} to ${natsSubject}`,
    );
  }

  private startGatewayServer() {
    return new Promise((resolve) => {
      this.httpServer.listen(8080, () => {
        resolve();

        this.gnattyServer.logger.info('Started Gateway server');
      });
    });
  }

  private async startNatyServer() {
    await this.gnattyServer.start();
    this.gnattyServer.logger.info('Started Gateway Naty Server');
  }

  public async start() {
    await this.startNatyServer();
    await this.startGatewayServer();
  }
}
