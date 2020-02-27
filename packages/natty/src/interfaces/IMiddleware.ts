import { Context } from "../Context";

export type IMiddleware<C extends Context = Context> = (
  context: C,
  next: () => void,
) => {};
