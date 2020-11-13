// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Varint } from './varint';
import { Writer } from './writer';
import * as BigInteger from 'big-integer';
import { Writable } from 'stream';

/**
 * Allows for easy reading of blob encoded data
 */
export class Reader extends Writable {
    private m_current_offset = 0;
    private m_buffer: Buffer = Buffer.alloc(0);

    /**
     * Constructs a new Reader instance
     * @param blob either another copy of a reader, writer, a Buffer, or a hexadecimal string representation of the data
     * @param encoding the encoding to use for the resulting string
     */
    constructor (blob: Reader | Writer | Buffer | string = Buffer.alloc(0), encoding: BufferEncoding = 'hex') {
        super();

        if (blob instanceof Reader) {
            return blob;
        } else if (blob instanceof Writer) {
            this.m_buffer = blob.buffer;
        } else if (blob instanceof Buffer) {
            this.m_buffer = blob;
        } else if (typeof blob === 'string') {
            this.m_buffer = Buffer.from(blob, encoding);
        } else {
            throw new Error('Unknown data type');
        }

        this.m_current_offset = 0;
    }

    /**
     * @returns the entire reader buffer
     */
    get buffer (): Buffer {
        return this.m_buffer;
    }

    /**
     * @returns the length of the blob in bytes
     */
    get length (): number {
        return this.m_buffer.length;
    }

    /**
     * @returns the current offset of the read buffer
     */
    get offset (): number {
        return this.m_current_offset;
    }

    /**
     * @returns the number of bytes remaining in the stream that have not been read
     */
    get unreadBytes (): number {
        const unreadBytes = this.length - this.offset;

        return (unreadBytes >= 0) ? unreadBytes : 0;
    }

    /**
     * @returns the subset of the buffer that has not been read yet
     */
    get unreadBuffer (): Buffer {
        return this.m_buffer.slice(this.offset);
    }

    /**
     * Extends the Stream.Writable interface such that we can be piped to
     * @param chunk
     * @param encoding
     * @param callback
     * @ignore
     */
    public _write (chunk: Buffer | Uint8Array | string, encoding: BufferEncoding, callback: () => void) {
        this.append(chunk);

        callback();
    }

    /**
     * Appends the data given to the end of the current buffer of the instance of the reader
     * @param blob either another copy of a reader, writer, a Buffer, or a hexadecimal string representation of the data
     * @param encoding the string encoding used
     */
    public append (blob: Reader | Writer | Buffer | Uint8Array | string, encoding: BufferEncoding = 'hex') {
        let buffer: Buffer;

        if (blob instanceof Reader) {
            buffer = blob.buffer;
        } else if (blob instanceof Writer) {
            buffer = blob.buffer;
        } else if (blob instanceof Buffer) {
            buffer = blob;
        } else if (blob instanceof Uint8Array) {
            buffer = Buffer.from(blob);
        } else if (typeof blob === 'string' && blob.length % 2 === 0) {
            buffer = Buffer.from(blob, encoding);
        } else {
            throw new Error('Unknown data type');
        }

        this.m_buffer = Buffer.concat([this.m_buffer, buffer]);
    }

    /**
     * Reads the supplied number of bytes
     * @param [count=1] the number of bytes to read
     * @returns a buffer containing the requested number of bytes
     */
    public bytes (count = 1): Buffer {
        const start = this.offset;

        this.m_current_offset += count;

        return this.m_buffer.slice(start, this.offset);
    }

    /**
     * Compacts the current reader buffer by trimming data before the current offset
     */
    public compact () {
        this.m_buffer = this.buffer.slice(this.offset);
    }

    /**
     * Reads the next hash of the given length from the stream and returns the value in hexadecimal notation
     * @param length the length of the hash in bytes
     * @param encoding the encoding to use for the resulting string
     * @returns the hash as a string
     */
    public hash (length = 32, encoding: BufferEncoding = 'hex'): string {
        const start = this.offset;

        this.m_current_offset += length;

        return this.m_buffer.slice(start, this.m_current_offset).toString(encoding);
    }

    /**
     * Reads the next supplied number of bytes and returns the result in hexadecimal notation
     * @param [count=1] the number of bytes to read
     * @param encoding the encoding to use for the resulting string
     * @returns a string containing the bytes in hexadecimal
     */
    public hex (count = 1, encoding: BufferEncoding = 'hex'): string {
        const start = this.offset;

        this.m_current_offset += count;

        return this.m_buffer.slice(start, this.offset).toString(encoding);
    }

    /**
     * Reads the number of bits as a signed integer
     * @param bits the number of bits to read
     * @param [be] whether to use big endian
     * @returns the value read
     */
    public int_t (bits: number, be = false): BigInteger.BigInteger {
        if (bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        const bytes = bits / 8;

        if (this.unreadBytes < bytes) {
            throw new Error('Not enough bytes remaining in the buffer');
        }

        const start = this.offset;

        this.m_current_offset += bytes;

        switch (bytes) {
            case 1:
                return BigInteger(this.m_buffer.readInt8(start));
            case 2:
                if (be) {
                    return BigInteger(this.m_buffer.readInt16BE(start));
                } else {
                    return BigInteger(this.m_buffer.readInt16LE(start));
                }
            case 4:
                if (be) {
                    return BigInteger(this.m_buffer.readInt32BE(start));
                } else {
                    return BigInteger(this.m_buffer.readInt32LE(start));
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
    public int16_t (be = false): BigInteger.BigInteger {
        return this.int_t(16, be);
    }

    /**
     * Reads a int32_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public int32_t (be = false): BigInteger.BigInteger {
        return this.int_t(32, be);
    }

    /**
     * Resets the reader offset to the start of the buffer
     */
    public reset () {
        this.m_current_offset = 0;
    }

    /**
     * Skips the specified number of bytes in the stream
     * @param [count=1] the number of bytes to skip
     */
    public skip (count = 1) {
        this.m_current_offset += count;
    }

    /**
     * Reads the next Date from the stream
     * @param [be] whether to use big endian
     */
    public time_t (be = false): Date {
        const buffer: Buffer = (be) ? this.bytes(8).swap64() : this.bytes(8);

        const epoch = BigInteger(buffer.toString('hex'), 16).toJSNumber();

        return new Date(epoch * 1000);
    }

    /**
     * Returns the current read buffer as a string
     * @param encoding
     */
    public toString (encoding: BufferEncoding = 'hex'): string {
        return this.buffer.toString(encoding);
    }

    /**
     * Reads the number of bits as an unsigned integer
     * @param bits the number of bits to read
     * @param [be] whether to use big endian
     * @returns the value read
     */
    public uint_t (bits: number, be = false): BigInteger.BigInteger {
        be = be || false;

        if (bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        const bytes = bits / 8;

        if (this.unreadBytes < bytes) {
            throw new Error('Not enough bytes remaining in the buffer');
        }

        const start = this.offset;

        this.m_current_offset += bytes;

        switch (bytes) {
            case 1:
                return BigInteger(this.m_buffer.readUInt8(start));
            case 2:
                if (be) {
                    return BigInteger(this.m_buffer.readUInt16BE(start));
                } else {
                    return BigInteger(this.m_buffer.readUInt16LE(start));
                }
            case 4:
                if (be) {
                    return BigInteger(this.m_buffer.readUInt32BE(start));
                } else {
                    return BigInteger(this.m_buffer.readUInt32LE(start));
                }
            case 8:
                if (be) {
                    return readUInt64BE(this.m_buffer, start);
                } else {
                    return readUInt64LE(this.m_buffer, start);
                }
            default:
                throw new Error('Cannot read uint_t');
        }
    }

    /**
     * Reads a uint8_t
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
    public uint16_t (be = false): BigInteger.BigInteger {
        return this.uint_t(16, be);
    }

    /**
     * Reads a uint32_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint32_t (be = false): BigInteger.BigInteger {
        return this.uint_t(32, be);
    }

    /**
     * Reads a uint64_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint64_t (be = false): BigInteger.BigInteger {
        return this.uint_t(64, be);
    }

    /**
     * Reads a varint encoded value from the stream
     * @param [peek] if we are only peeking, we will not advance the reader cursor
     * @param [levin] whether we are reading a levin packed varint
     * @returns the value
     */
    public varint (peek = false, levin = false): BigInteger.BigInteger {
        const start = this.m_current_offset;

        if (!levin) {
            do {
                if (this.m_buffer.readUInt8(this.m_current_offset) < 128) {
                    this.m_current_offset++;

                    const tmp = this.m_buffer.slice(start, this.offset);

                    if (peek) {
                        this.m_current_offset = start;
                    }
                    return Varint.decode(tmp);
                }

                this.m_current_offset++;
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
