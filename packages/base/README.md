# @stratamu/base

A base class for all Stratamu packages, providing:

- Event emitter support (via emittery)
- Lifecycle hooks (`onInit`, `onDestroy`)
- Standardized logging and error handling

## Usage

```ts
import { BaseClass } from '@stratamu/base'

class MyService extends BaseClass {
  protected async onInit() {
    this.log('Service initialized!')
    await this.emit('ready')
  }

  protected onDestroy() {
    this.log('Service destroyed!')
  }
}
```

## Features

- Consistent event-driven API for all subclasses
- Easy to override lifecycle hooks
- Built-in logging and error reporting
