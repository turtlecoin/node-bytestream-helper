// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import * as BigInteger from 'big-integer';

/**
 * Varint encoding helper module
 */
export class Varint {
    /**
     * Decodes a varint from a buffer object
     * @param buf the buffer object containing the value to be decoded
     * @returns the numeric value
     */
    public static decode (buf: Buffer): BigInteger.BigInteger {
        let counter = 0;

        let shift = 0;

        let b: any;

        let result = BigInteger.zero;

        do {
            if (counter >= buf.length) {
                throw new RangeError('Could not decode varint');
            }

            b = buf[counter++];

            const value = (shift < 28) ? (b & 0x7f) << shift : (b & 0x7f) * Math.pow(2, shift);

            result = result.add(value);

            shift += 7;
        } while (b >= 0x80);

        return result;
    }

    /**
     * Encodes a value into a varint encoded buffer object
     * @param num the numeric value
     * @returns a Buffer containing the varint encoded value
     */
    public static encode (num: BigInteger.BigInteger): Buffer {
        const out = [];

        let offset = 0;

        while (num.greaterOrEquals(Math.pow(2, 31))) {
            out[offset++] = num.and(0xFF).or(0x80).toJSNumber();

            num = num.divide(128);
        }

        while (num.and(~0x7F).greater(0)) {
            out[offset++] = num.and(0xFF).or(0x80).toJSNumber();

            num = num.shiftRight(7);
        }

        out[offset] = num.or(0).toJSNumber();

        return Buffer.from(out);
    }
}
