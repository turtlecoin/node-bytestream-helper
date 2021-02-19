// Copyright (c) 2018-2021, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Varint } from './varint';
import { Writer } from './writer';
import * as BigInteger from 'big-integer';
import { Writable } from 'stream';

/**
 * Allows for easy reading of blob encoded data
 * @noInehritDoc
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
     * Compacts the current reader buffer by trimming data before the current offset, or
     * if specified, the given offset and re-setting the current reading offset to 0
     * @param offset the offset to compact from
     */
    public compact (offset?: number) {
        if (typeof offset === 'undefined') {
            this.m_buffer = this.buffer.slice(this.offset);
        } else {
            this.m_buffer = this.buffer.slice(offset);
        }

        this.m_current_offset = 0;
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
     * Resets the reader offset to the given offset of the buffer
     * @param offset the offset to reset the reader to
     */
    public reset (offset = 0) {
        this.m_current_offset = offset;
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

        if (be) {
            return readUIntBE(this.buffer, bytes, start);
        } else {
            return readUIntLE(this.buffer, bytes, start);
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
     * Reads a uint128_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint128_t (be = false): BigInteger.BigInteger {
        return this.uint_t(128, be);
    }

    /**
     * Reads a uint256_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint256_t (be = false): BigInteger.BigInteger {
        return this.uint_t(256, be);
    }

    /**
     * Reads a uint512_t
     * @param [be] whether to use big endian
     * @returns the value
     */
    public uint512_t (be = false): BigInteger.BigInteger {
        return this.uint_t(512, be);
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

/**
 * @ignore
 * @param buffer
 * @param bytes
 * @param offset
 * @param noAssert
 */
function readUIntBE (
    buffer: Buffer,
    bytes: number,
    offset = 0,
    noAssert = false
): BigInteger.BigInteger {
    if (buffer.length < offset + bytes) {
        if (noAssert) {
            return BigInteger.zero;
        }

        throw new RangeError('Out of bounds');
    }

    const slice = buffer.slice(offset, offset + bytes);

    return BigInteger(slice.toString('hex'), 16);
}

/**
 * @ignore
 * @param buffer
 * @param bytes
 * @param offset
 * @param noAssert
 */
function readUIntLE (
    buffer: Buffer,
    bytes: number,
    offset = 0,
    noAssert = false
): BigInteger.BigInteger {
    if (buffer.length < offset + bytes) {
        if (noAssert) {
            return BigInteger.zero;
        }

        throw new RangeError('Out of bounds');
    }

    const buf = buffer.slice(offset, offset + bytes);

    const tempBuffer = Buffer.alloc(bytes);

    let position = bytes - 1;

    for (const slice of buf) {
        tempBuffer[position] = slice;

        position -= 1;
    }

    return BigInteger(tempBuffer.toString('hex'), 16);
}
