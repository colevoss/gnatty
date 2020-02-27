import { Context } from "../Context";

export type IHandler<C extends Context = Context> = (
  ctx: C,
  ...rest: any[]
) => Promise<void>;
