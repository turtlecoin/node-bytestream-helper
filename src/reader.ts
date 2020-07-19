// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict';

import { Varint } from './varint';
import * as BigInteger from 'big-integer';

/**
 * Allows for easy reading of blob encoded data
 */
export class Reader {
    /**
     * @returns the length of the blob in bytes
     */
    get length (): number {
        return this.blob.length;
    }

    /**
     * @returns the subset of the buffer that has not been read yet
     */
    get unreadBuffer (): Buffer {
        return this.blob.slice(this.currentOffset);
    }

    /**
     * @returns the number of bytes remaining in the stream that have not been read
     */
    get unreadBytes (): number {
        const unreadBytes = this.blob.length - this.currentOffset;
        return (unreadBytes >= 0) ? unreadBytes : 0;
    }

    /**
     * The current offset of the reader cursor in the stream
     */
    public currentOffset = 0;
    private readonly blob: Buffer = Buffer.alloc(0);

    /**
     * Constructs a new Reader instance
     * @param blob either another copy of a reader, a Buffer, or a hexadecimal string representation of the data
     */
    constructor (blob: Reader | Buffer | string) {
        if (blob instanceof Reader) {
            return blob;
        } else if (blob instanceof Buffer) {
            this.blob = blob;
        } else if (typeof blob === 'string' && blob.length % 2 === 0) {
            this.blob = Buffer.from(blob, 'hex');
        }
        this.currentOffset = 0;
    }

    /**
     * Reads the supplied number of bytes
     * @param [count=1] the number of bytes to read
     * @returns a buffer containing the requested number of bytes
     */
    public bytes (count?: number): Buffer {
        count = count || 1;
        const start = this.currentOffset;
        this.currentOffset += count;
        return this.blob.slice(start, this.currentOffset);
    }

    /**
     * Reads the next 32-bytes from the stream and returns the value in hexadecimal notation
     * @returns the hash as a string
     */
    public hash (): string {
        const start = this.currentOffset;
        this.currentOffset += 32;
        return this.blob.slice(start, this.currentOffset).toString('hex');
    }

    /**
     * Reads the next supplied number of bytes and returns the result in hexadecimal notation
     * @param [count=1] the number of bytes to read
     * @returns a string containing the bytes in hexadecimal
     */
    public hex (count?: number): string {
        count = count || 1;
        const start = this.currentOffset;
        this.currentOffset += count;
        return this.blob.slice(start, this.currentOffset).toString('hex');
    }

    /**
     * Reads the number of bits as a signed integer
     * @param bits the number of bits to read
     * @param [be] whether to use big endian
     * @returns the value read
     */
    public int_t (bits: number, be?: boolean): BigInteger.BigInteger {
        be = be || false;

        if (bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        const bytes = bits / 8;

        if (this.unreadBytes < bytes) {
            throw new Error('Not enough bytes remaining in the buffer');
        }

        const start = this.currentOffset;
        this.currentOffset += 4;

        switch (bytes) {
        case 1:
            return BigInteger(this.blob.readInt8(start));
        case 2:
            if (be) {
                return BigInteger(this.blob.readInt16BE(start));
            } else {
                return BigInteger(this.blob.readInt16LE(start));
            }
        case 4:
            if (be) {
                return BigInteger(this.blob.readInt32BE(start));
            } else {
                return BigInteger(this.blob.readInt32LE(start));
            }
        default:
            throw new Error('cannot read int64_t');
        }
    }

    /**
     * Reads a int8_t
     * @returns the value
     */
    public int8_t (): BigInteger.BigInteger {
        return this.int_t(8);
    }

    /**
     * Reads a int16_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public int16_t (be?: boolean): BigInteger.BigInteger {
        return this.int_t(16, be);
    }

    /**
     * Reads a int32_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public int32_t (be?: boolean): BigInteger.BigInteger {
        return this.int_t(32, be);
    }

    /**
     * Skips the specified number of bytes in the stream
     * @param [count=1] the number of bytes to skip
     */
    public skip (count?: number) {
        count = count || 1;
        this.currentOffset += count;
    }

    /**
     * Reads the next Date from the stream
     * @param [be] whether to use big endian
     */
    public time_t (be?: boolean): Date {
        const buffer: Buffer = (be) ? this.bytes(8).swap64() : this.bytes(8);

        const epoch = BigInteger(buffer.toString('hex'), 16).toJSNumber();

        return new Date(epoch * 1000);
    }

    /**
     * Reads the number of bits as an unsigned integer
     * @param bits the number of bits to read
     * @param [be] whether to use big endian
     * @returns the value read
     */
    public uint_t (bits: number, be?: boolean): BigInteger.BigInteger {
        be = be || false;

        if (bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        const bytes = bits / 8;

        if (this.unreadBytes < bytes) {
            throw new Error('Not enough bytes remaining in the buffer');
        }

        const start = this.currentOffset;
        this.currentOffset += bytes;

        switch (bytes) {
        case 1:
            return BigInteger(this.blob.readUInt8(start));
        case 2:
            if (be) {
                return BigInteger(this.blob.readUInt16BE(start));
            } else {
                return BigInteger(this.blob.readUInt16LE(start));
            }
        case 4:
            if (be) {
                return BigInteger(this.blob.readUInt32BE(start));
            } else {
                return BigInteger(this.blob.readUInt32LE(start));
            }
        case 8:
            if (be) {
                return readUInt64BE(this.blob, start);
            } else {
                return readUInt64LE(this.blob, start);
            }
        default:
            throw new Error('Cannot read uint_t');
        }
    }

    /**
     * Reads a uint8_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint8_t (): BigInteger.BigInteger {
        return this.uint_t(8);
    }

    /**
     * Reads a uint16_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint16_t (be?: boolean): BigInteger.BigInteger {
        return this.uint_t(16, be);
    }

    /**
     * Reads a uint32_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint32_t (be?: boolean): BigInteger.BigInteger {
        return this.uint_t(32, be);
    }

    /**
     * Reads a uint64_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint64_t (be?: boolean): BigInteger.BigInteger {
        return this.uint_t(64, be);
    }

    /**
     * Reads a varint encoded value from the stream
     * @param [peek] if we are only peeking, we will not advance the reader cursor
     * @param [levin] whether we are reading a levin packed varint
     * @returns the value
     */
    public varint (peek?: boolean, levin?: boolean): BigInteger.BigInteger {
        const start = this.currentOffset;

        if (!levin) {
            do {
                if (this.blob.readUInt8(this.currentOffset) < 128) {
                    this.currentOffset++;
                    const tmp = this.blob.slice(start, this.currentOffset);
                    if (peek) {
                        this.currentOffset = start;
                    }
                    return Varint.decode(tmp);
                }
                this.currentOffset++;
            } while (true);
        } else {
            let value: BigInteger.BigInteger | number = this.uint8_t().toJSNumber();

            const sizeMask = value & 0x03;

            value = BigInteger(value);

            let bytesLeft = 0;

            switch (sizeMask) {
            case 0:
                bytesLeft = 0;
                break;
            case 1:
                bytesLeft = 1;
                break;
            case 2:
                bytesLeft = 3;
                break;
            case 3:
                bytesLeft = 7;
                break;
            }

            for (let i = 1; i <= bytesLeft; ++i) {
                const nv = this.uint8_t().shiftLeft(i * 8);
                value = value.or(nv);
            }

            return value.shiftRight(2);
        }
    }
}

/* Helper methods */

/** @ignore */
function readUInt64BE (buf: Buffer, offset = 0, noAssert = false): BigInteger.BigInteger {
    return readUInt64LE(buf.slice(offset, offset + 8).swap64(), 0, noAssert);
}

/** @ignore */
function readUInt64LE (buf: Buffer, offset = 0, noAssert = false): BigInteger.BigInteger {
    if (buf.length < offset + 8) {
        if (noAssert) {
            return BigInteger.zero;
        }
        throw new Error('Out of bounds');
    }

    const first = buf[offset];
    const last = buf[offset + 7];

    if (first === undefined || last === undefined) {
        if (noAssert) {
            return BigInteger.zero;
        }
        throw new Error('Out of bounds');
    }

    const lo = first +
        (buf[++offset] * Math.pow(2, 8)) +
        (buf[++offset] * Math.pow(2, 16)) +
        (buf[++offset] * Math.pow(2, 24));
    const hi = (buf[++offset] +
        (buf[++offset] * Math.pow(2, 8)) +
        (buf[++offset] * Math.pow(2, 16)) +
        (last * Math.pow(2, 24)));

    return BigInteger(lo).add(BigInteger(hi).shiftLeft(32));
}
