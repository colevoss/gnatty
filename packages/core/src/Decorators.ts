import { IActionParams } from './interfaces/IActionParams';
import { IMiddleware } from './interfaces/IMiddleware';
import { IHandler } from './interfaces/IHandler';

export const ACTION_SYMBOL = Symbol('NATY_ACTION');
export const SUBSCRIPTION_SYMBOL = Symbol('NATY_SUBSCRIPTION');
export const MIDDLEWARE_SYMBOL = Symbol('NATY_MIDDLEWARE');

export type IEndpoint = {
  [ACTION_SYMBOL]?: IActionParams;
  [SUBSCRIPTION_SYMBOL]?: IActionParams;
  [MIDDLEWARE_SYMBOL]?: IMiddleware[];
  handler: IHandler;
};

export function Action(actionParams: string): MethodDecorator {
  const params: IActionParams = {
    name: actionParams,
  };

  return createActionDecorator(params, ACTION_SYMBOL);
}

export function Subscribe(subscribeParams: string): MethodDecorator {
  const params: IActionParams = {
    name: subscribeParams,
  };

  return createActionDecorator(params, SUBSCRIPTION_SYMBOL);
}

export function Middleware(fn: IMiddleware) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>,
  ) => {
    const keyMetadata = Reflect.getMetadata(propertyKey, target) || {};

    const newMetadata = {
      ...keyMetadata,
      [MIDDLEWARE_SYMBOL]: [...(keyMetadata.middleware || []), fn],
    };

    Reflect.defineMetadata(propertyKey, newMetadata, target);

    return descriptor;
  };
}

function createActionDecorator(params: IActionParams, metadataKey: symbol) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const keyMetadata = Reflect.getMetadata(propertyKey, target) || {};

    const newMetadata = {
      ...keyMetadata,
      [metadataKey]: params,
    };

    Reflect.defineMetadata(propertyKey, newMetadata, target);

    return descriptor;
  };
}
