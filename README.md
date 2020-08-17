# bytestream-helper

[![NPM](https://nodei.co/npm/bytestream-helper.png?downloads=true&stars=true)](https://nodei.co/npm/bytestream-helper/)

![Prerequisite](https://img.shields.io/badge/node-%3E%3D6-blue.svg) [![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://bytestream.turtlecoin.dev) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/turtlecoin/node-bytestream-helper/graphs/commit-activity) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/turtlecoin/node-bytestream-helper/blob/master/LICENSE) [![Twitter: TurtlePay](https://img.shields.io/twitter/follow/_TurtleCoin.svg?style=social)](https://twitter.com/_TurtleCoin)

This package contains the code paths necessary to assist with encoding and decoding bytestreams (blobs).

It was designed and written primarily for working with TurtleCoin bytestreams.

## Installation

```bash
npm install bytestream-helper
```

## Initialization

### TypeScript

```typescript
import { Reader, Writer } from 'bytestream-helper'
```

### JavaScript

```javascript
const BytestreamHelper = require('bytestream-helper')
const Reader = BytestreamHelper.Reader
const Writer = BytestreamHelper.Writer
```

### Documentation

You can find the full documentation for this library [here](https://bytestream.turtlecoin.dev)
