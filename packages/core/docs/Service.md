# Service

## Basic Usage

```ts
import { Service, Action, Subscribe, Context } from '@gnatty/core';

class MyService extends Service<SomeServer> {
  public name = 'test';

  @Action('foo')
  public async foo(ctx: Context) {
    ctx.send(/* response object */);
  }
}
```

## About

A `Service` is where actions and subscriptions are defined. They are defined as
methods on the extending class using the `Action` and `Subscribe` decorators

## Todo

Finish class documentation examples. For now you can view the docs in the class
itself [here](/packages/core/src/Service.ts).
