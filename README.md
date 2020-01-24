![image](https://user-images.githubusercontent.com/34389545/35821974-62e0e25c-0a70-11e8-87dd-2cfffeb6ed47.png)

# TurtleCoin Serialization Helper

[![NPM](https://nodei.co/npm/turtlecoin-serialization-helper.png?downloads=true&stars=true)](https://nodei.co/npm/turtlecoin-serialization-helper/)

![Prerequisite](https://img.shields.io/badge/node-%3E%3D6-blue.svg) [![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://serialization.turtlecoin.dev) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/turtlecoin/turtlecoin-serialization-helper/graphs/commit-activity) [![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-yellow.svg)](https://github.com/turtlecoin/turtlecoin-serialization-helper/blob/master/LICENSE) [![Twitter: TurtlePay](https://img.shields.io/twitter/follow/_TurtleCoin.svg?style=social)](https://twitter.com/_TurtleCoin)

This package contains the code paths necessary to assist with encoding and decoding bytestreams (blobs) suitable for use with the TurtleCoin network.

## Installation

```bash
npm install turtlecoin-serialization-helper
```

## Initialization

### TypeScript

```typescript
import { Reader, Writer } from 'turtlecoin-serialization-helper'
```

### JavaScript

```javascript
const TRTLSerialization = require('turtlecoin-serialization-helper')
const Reader = TRTLSerialization.Reader
const Writer = TRTLSerialization.Writer
```

### Documentation

You can find the full documentation for this library [here](https://serialization.turtlecoin.dev)
