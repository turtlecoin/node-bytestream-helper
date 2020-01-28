// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict';

import {Varint} from './varint';
import * as BigInteger from 'big-integer';

/**
 * Allows for easy writing of blob encoded data
 */
export class Writer {
    private blobs: Buffer[] = [];

    /**
     * The current data in the writer in a hexadecimal string format
     */
    get blob(): string {
        return Buffer.concat(this.blobs).toString('hex');
    }

    /**
     * The current data in the writer as a Buffer object
     */
    get buffer(): Buffer {
        return Buffer.concat(this.blobs);
    }

    /**
     * The length of the current data in bytes
     */
    get length(): number {
        return Buffer.concat(this.blobs).length;
    }

    /**
     * Clears the current object of all existing data
     */
    public clear() {
        this.blobs = [];
    }

    /**
     * Writes a 32-byte hash value to the data
     * @param hash
     */
    public hash(hash: Buffer | string): boolean {
        if (hash instanceof Buffer && hash.length === 32) {
            return this.write(hash);
        } else if (typeof hash === 'string' && isHex(hash) && hash.length === 64) {
            return this.write(hash);
        }
        return false;
    }

    /**
     * Writes a hexadecimal string to the data
     * @param hex
     */
    public hex(hex: Buffer | string): boolean {
        if (hex instanceof Buffer && hex.length % 2 === 0) {
            return this.write(hex);
        } else if (typeof hex === 'string' && isHex(hex) && hex.length % 2 === 0) {
            return this.write(hex);
        }
        return false;
    }

    /**
     * Writes a signed integer to the data
     * @param value
     * @param [bits] the number of bits to use
     * @param [be] whether the value should be written in big endian
     */
    public int_t(value: BigInteger.BigInteger | number, bits?: number, be?: boolean): boolean {
        be = be || false;

        if (bits && bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (!bits) {
            if (value.toJSNumber() <= 255) {
                bits = 8;
            } else if (value.toJSNumber() <= 65535) {
                bits = 16;
            } else if (value.toJSNumber() <= 4294967295) {
                bits = 32;
            } else {
                bits = 64;
            }
        }

        const bytes = bits / 8;

        const buf = Buffer.alloc(bytes);

        switch (bytes) {
            case 1:
                buf.writeInt8(value.toJSNumber(), 0);
                break;
            case 2:
                if (be) {
                    buf.writeInt16BE(value.toJSNumber(), 0);
                } else {
                    buf.writeInt16LE(value.toJSNumber(), 0);
                }
                break;
            case 4:
                if (be) {
                    buf.writeInt32BE(value.toJSNumber(), 0);
                } else {
                    buf.writeInt32LE(value.toJSNumber(), 0);
                }
                break;
            default:
                return false;
        }

        this.blobs.push(buf);

        return true;
    }

    /**
     * Writes a int8_t to the data
     * @param value
     */
    public int8_t(value: BigInteger.BigInteger | number): boolean {
        return this.int_t(value, 8);
    }

    /**
     * Writes a int16_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public int16_t(value: BigInteger.BigInteger | number, be?: boolean): boolean {
        return this.int_t(value, 16, be);
    }

    /**
     * Writes a int32_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public int32_t(value: BigInteger.BigInteger | number, be?: boolean): boolean {
        return this.int_t(value, 32, be);
    }

    /**
     * Writes an unsigned integer to the data
     * @param value
     * @param [bits] the number of bits to use
     * @param [be] whether the value should be written in big endian
     */
    public uint_t(value: BigInteger.BigInteger | number, bits?: number, be?: boolean): boolean {
        be = be || false;

        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (!bits) {
            if (value.toJSNumber() <= 255) {
                bits = 8;
            } else if (value.toJSNumber() <= 65535) {
                bits = 16;
            } else if (value.toJSNumber() <= 4294967295) {
                bits = 32;
            } else {
                bits = 64;
            }
        }

        const bytes = bits / 8;

        let buf = Buffer.alloc(bytes);

        switch (bytes) {
            case 1:
                buf.writeUInt8(value.toJSNumber(), 0);
                break;
            case 2:
                if (be) {
                    buf.writeInt16BE(value.toJSNumber(), 0);
                } else {
                    buf.writeUInt16LE(value.toJSNumber(), 0);
                }
                break;
            case 4:
                if (be) {
                    buf.writeUInt32BE(value.toJSNumber(), 0);
                } else {
                    buf.writeUInt32LE(value.toJSNumber(), 0);
                }
                break;
            case 8:
                buf = (be) ? writeUInt64BE(buf, value) : writeUInt64LE(buf, value);
                break;
            default:
                return false;
        }

        this.blobs.push(buf);

        return true;
    }

    /**
     * Writes a uint8_t to the data
     * @param value
     */
    public uint8_t(value: BigInteger.BigInteger | number): boolean {
        return this.uint_t(value, 8);
    }

    /**
     * Writes a uint16_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint16_t(value: BigInteger.BigInteger | number, be?: boolean): boolean {
        return this.uint_t(value, 16, be);
    }

    /**
     * Writes a uint32_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint32_t(value: BigInteger.BigInteger | number, be?: boolean): boolean {
        return this.uint_t(value, 32, be);
    }

    /**
     * Writes a uint64_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint64_t(value: BigInteger.BigInteger | number, be?: boolean): boolean {
        return this.uint_t(value, 64, be);
    }

    /**
     * Writes a varint encoded value to the data
     * @param value
     * @param [levin] whether the value should be levin varint encoded
     */
    public varint(value: BigInteger.BigInteger | number, levin?: boolean): boolean {
        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (!levin) {
            this.blobs.push(Buffer.from(Varint.encode(value)));
            return true;
        } else {
            if (value.greater(BigInteger('1073741823'))) {
                throw new RangeError('value out of range');
            }

            value = value.toJSNumber();
            let tempValue = value << 2;

            let byteCount = 0;

            if (value <= 63) {
                tempValue |= 0;
                byteCount = 1;
            } else if (value <= 16383) {
                tempValue |= 1;
                byteCount = 2;
            } else {
                tempValue |= 2;
                byteCount = 4;
            }

            for (let i = 0; i < byteCount; i++) {
                this.uint8_t((tempValue >> i * 8) & 0xFF);
            }

            return true;
        }
    }

    /**
     * Writes an arbitrary type of input to the data
     * @param payload
     */
    public write(payload: Buffer | string | object): boolean {
        if (payload instanceof Buffer) {
            this.blobs.push(payload);
            return true;
        } else if (typeof payload === 'string' && isHex(payload) && payload.length % 2 === 0) {
            this.blobs.push(Buffer.from(payload, 'hex'));
            return true;
        } else if (typeof payload === 'string') {
            this.blobs.push(Buffer.from(payload));
            return true;
        } else { // if it's not a string, it needs to be
            this.blobs.push(Buffer.from(JSON.stringify(payload)));
            return true;
        }
        return false;
    }
}

/* Helper methods */

/** @ignore */
function isHex(str: string): boolean {
    const regex = new RegExp('^[0-9a-fA-F]+$');
    return regex.test(str);
}

/** @ignore */
function writeUInt64BE(buf: Buffer, value: BigInteger.BigInteger, offset?: number): Buffer {
    const buffer = writeUInt64LE(buf, value, offset);
    const tempBuffer = Buffer.alloc(8);
    buffer.swap64().copy(tempBuffer, 0);
    return buffer;
}

/** @ignore */
function writeUInt64LE(buf: Buffer, value: BigInteger.BigInteger, offset?: number): Buffer {
    offset = offset || 0;
    let bigNumber = value.toString(16);
    if (bigNumber.length % 2 !== 0) {
        bigNumber = bigNumber.padStart(Math.ceil(bigNumber.length / 2) * 2, '0');
    }
    const bigBuffer = Buffer.from(bigNumber, 'hex');
    const tempBuffer = Buffer.alloc(8);
    bigBuffer.copy(tempBuffer, 8 - bigBuffer.length);
    tempBuffer.swap64().copy(buf, offset);
    return buf;
}
