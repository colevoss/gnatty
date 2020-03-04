import { Context } from '../Context';

export type NextFn = () => void;

export type IMiddleware<C extends Context = Context> = (
  context: C,
  next: () => void,
) => void;
