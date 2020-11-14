// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Varint } from './varint';
import { Reader } from './reader';
import * as BigInteger from 'big-integer';
import { Readable } from 'stream';

/**
 * Allows for easy writing of blob encoded data
 * @noInehritDoc
 */
export class Writer extends Readable {
    private m_buffer: Buffer = Buffer.alloc(0);
    private m_readIndex = 0;

    /**
     * The current data in the writer in a hexadecimal string format
     */
    get blob (): string {
        return this.toString();
    }

    /**
     * The current data in the writer as a Buffer object
     */
    get buffer (): Buffer {
        return this.m_buffer;
    }

    /**
     * The length of the current data in bytes
     */
    get length (): number {
        return this.m_buffer.length;
    }

    /** @ignore */
    private get readIndex (): number {
        return this.m_readIndex;
    }

    /** @ignore */
    public _read (size: number) {
        let okToSend = true;

        while (okToSend) {
            let slice: Buffer = Buffer.alloc(0);

            if (this.readIndex + size > this.length) {
                slice = this.m_buffer.slice(this.readIndex);
            } else {
                slice = this.m_buffer.slice(this.readIndex, this.readIndex + size);
            }

            if (slice.length > 0) {
                this.push(slice);
            } else {
                this.push(null);

                okToSend = false;
            }

            this.m_readIndex += slice.length;
        }
    }

    /**
     * Clears the current object of all existing data
     */
    public clear () {
        this.m_buffer = Buffer.alloc(0);
    }

    /**
     * Writes a 32-byte hash value to the data
     * @param hash
     * @param encoding the encoding of the string
     */
    public hash (hash: Buffer | string, encoding: BufferEncoding = 'hex'): boolean {
        if (hash instanceof Buffer && hash.length === 32) {
            return this.write(hash);
        } else if (typeof hash === 'string' && hash.length === 64) {
            return this.write(hash, encoding);
        }

        return false;
    }

    /**
     * Writes a hexadecimal string to the data
     * @param hex
     * @param encoding the encoding of the string
     */
    public hex (hex: Buffer | string, encoding: BufferEncoding = 'hex'): boolean {
        if (hex instanceof Buffer) {
            return this.write(hex);
        } else if (typeof hex === 'string') {
            return this.write(hex, encoding);
        }

        return false;
    }

    /**
     * Writes a signed integer to the data
     * @param value
     * @param [bits] the number of bits to use
     * @param [be] whether the value should be written in big endian
     */
    public int_t (value: BigInteger.BigInteger | number, bits?: number, be = false): boolean {
        if (bits && bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (!bits) {
            bits = determineBits(value);
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

        this.write(buf);

        return true;
    }

    /**
     * Writes a int8_t to the data
     * @param value
     */
    public int8_t (value: BigInteger.BigInteger | number): boolean {
        return this.int_t(value, 8);
    }

    /**
     * Writes a int16_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public int16_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.int_t(value, 16, be);
    }

    /**
     * Writes a int32_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public int32_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.int_t(value, 32, be);
    }

    /**
     * Writes a date object into the data stream
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public time_t (value: Date, be = false) {
        /* We can only write an integer here, so make sure that's what we have */
        const num = BigInteger(Math.floor(value.getTime() / 1000));

        const hex = num.toString(16).padStart(16, '0');

        const buffer = (be)
            ? Buffer.from(hex, 'hex').swap64()
            : Buffer.from(hex, 'hex');

        this.write(buffer);
    }

    /**
     * Returns the current read buffer as a string
     * @param encoding
     */
    public toString (encoding: BufferEncoding = 'hex'): string {
        return this.buffer.toString(encoding);
    }

    /**
     * Writes an unsigned integer to the data
     * @param value
     * @param [bits] the number of bits to use
     * @param [be] whether the value should be written in big endian
     */
    public uint_t (value: BigInteger.BigInteger | number, bits?: number, be = false): boolean {
        be = be || false;

        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (value.lesser(0)) {
            throw new RangeError('cannot store signed value in unsigned type');
        }

        if (!bits) {
            bits = determineBits(value);
        }

        if (bits % 8 !== 0) {
            throw new Error('bits must be a multiple of 8');
        }

        const bytes = bits / 8;

        const buf = (be) ? writeUIntBE(value, bytes) : writeUIntLE(value, bytes);

        this.write(buf);

        return true;
    }

    /**
     * Writes a uint8_t to the data
     * @param value
     */
    public uint8_t (value: BigInteger.BigInteger | number): boolean {
        return this.uint_t(value, 8);
    }

    /**
     * Writes a uint16_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint16_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 16, be);
    }

    /**
     * Writes a uint32_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint32_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 32, be);
    }

    /**
     * Writes a uint64_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint64_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 64, be);
    }

    /**
     * Writes a uint128_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint128_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 128, be);
    }

    /**
     * Writes a uint256_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint256_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 256, be);
    }

    /**
     * Writes a uint512_t to the data
     * @param value
     * @param [be] whether the value should be written in big endian
     */
    public uint512_t (value: BigInteger.BigInteger | number, be = false): boolean {
        return this.uint_t(value, 512, be);
    }

    /**
     * Writes a varint encoded value to the data
     * @param value
     * @param [levin] whether the value should be levin varint encoded
     */
    public varint (value: BigInteger.BigInteger | number, levin = false): boolean {
        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        if (!levin) {
            this.write(Buffer.from(Varint.encode(value)));
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
     * @param payload the payload to write
     * @param encoding the encoding used in the string based data
     */
    public write (payload: Buffer | Writer | Reader | string | any, encoding: BufferEncoding = 'hex'): boolean {
        const write = (buffer: Buffer): boolean => {
            this.m_buffer = Buffer.concat([this.m_buffer, buffer]);

            return true;
        };

        if (payload instanceof Writer) {
            return write(payload.buffer);
        } else if (payload instanceof Reader) {
            return write(payload.buffer);
        } else if (payload instanceof Buffer) {
            return write(payload);
        } else if (typeof payload === 'string') {
            return write(Buffer.from(payload, encoding));
        } else { // if it's not a string, it needs to be
            return write(Buffer.from(JSON.stringify(payload)));
        }
    }
}

/* Helper methods */

/** @ignore */
function determineBits (value: BigInteger.BigInteger): number {
    const bytes: number [] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

    for (const byte of bytes) {
        let check = BigInteger.zero;

        if (value.greater(-1)) {
            check = BigInteger(2).pow(byte * 8)
                .subtract(1);
        } else {
            check = BigInteger(2).pow((byte * 8) - 1)
                .subtract(1)
                .abs();
        }

        if (value.compare(check) <= 0) {
            return byte * 8;
        }
    }

    throw new RangeError('value is out of range');
}

/**
 * @ignore
 * @param value
 * @param bytes
 */
function writeUIntBE (value: BigInteger.BigInteger, bytes: number): Buffer {
    const hex = value.toString(16).padStart(bytes * 2, '0');

    return Buffer.from(hex, 'hex');
}

/**
 * @ignore
 * @param value
 * @param bytes
 */
function writeUIntLE (value: BigInteger.BigInteger, bytes: number): Buffer {
    const hex = value.toString(16).padStart(bytes * 2, '0');

    const buffer = Buffer.from(hex, 'hex');

    const tempBuffer = Buffer.alloc(bytes);

    let position = bytes - 1;

    for (const slice of buffer) {
        tempBuffer[position] = slice;

        position -= 1;
    }

    return tempBuffer;
}
