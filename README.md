![image](https://user-images.githubusercontent.com/34389545/35821974-62e0e25c-0a70-11e8-87dd-2cfffeb6ed47.png)

# TurtleCoin Bytestream Helper

![Prerequisite](https://img.shields.io/badge/node-%3E%3D12-blue.svg) [![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/TurtleCoin/node-bytestream-helper#readme) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/TurtleCoin/node-bytestream-helper/graphs/commit-activity) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/TurtleCoin/node-bytestream-helper/blob/master/LICENSE) [![Twitter: TurtlePay](https://img.shields.io/twitter/follow/_TurtleCoin.svg?style=social)](https://twitter.com/_TurtleCoin)

[![NPM](https://nodeico.herokuapp.com/@turtlecoin/bytestream.svg)](https://npmjs.com/package/@turtlecoin/bytestream)

This package contains the code paths necessary to assist with encoding and decoding bytestreams (blobs).

It was designed and written primarily for working with TurtleCoin bytestreams.

## Installation

```bash
npm install bytestream-helper
```

## Initialization

### TypeScript

```typescript
import { Reader, Writer } from '@turtlecoin/bytestream'
```

### JavaScript

```javascript
const BytestreamHelper = require('@turtlecoin/bytestream')
const Reader = BytestreamHelper.Reader
const Writer = BytestreamHelper.Writer
```

### Documentation

You can find the full documentation for this library [here](https://bytestream.turtlecoin.dev)
