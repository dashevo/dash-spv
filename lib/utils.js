/* eslint no-underscore-dangle: ["error", { "allow": ["_getHash"] }] */
/* eslint-disable no-bitwise */
const dashcore = require('@dashevo/dashcore-lib');
const BN = require('bn.js');

// define an empty buffer to represent the zero hash value
const zeroHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

// returns a boolean -- whether a passed string is valid hex or not
function isHexString (str) {
  return !(typeof str !== 'string' || str.length === 0 || str.length % 2)
}

// input is a hex string of len 64, outputs a buffer w/those bytes, reversed
function toHash (hex) {
  if (hex.length !== 64 || !isHexString(hex)) {
    throw new Error('argument must be a hex string')
  }
  return Buffer.from(hex, 'hex').reverse()
}

function expandTarget (bits) {
  if (bits > 0xffffffff) {
    throw new Error('"bits" may not be larger than 4 bytes')
  }
  var exponent = bits >>> 24
  if (exponent <= 3) throw new Error('target exponent must be > 3')
  if (exponent > 32) throw new Error('target exponent must be < 32')
  var mantissa = bits & 0x007fffff
  var target = new Buffer(32).fill(0)
  target.writeUInt32BE(mantissa << 8, 32 - exponent)
  return target
}

// Temp functions to be removed
const temp = {
  double256(target) {
    const B192 = 0x1000000000000000000000000000000000000000000000000;
    const B128 = 0x100000000000000000000000000000000;
    const B64 = 0x10000000000000000;
    const B0 = 0x1;

    let n = 0;
    let hi = null;
    let lo = null;

    hi = target.readUInt32LE(28, true);
    lo = target.readUInt32LE(24, true);
    n += ((hi * 0x100000000) + lo) * B192;

    hi = target.readUInt32LE(20, true);
    lo = target.readUInt32LE(16, true);
    n += ((hi * 0x100000000) + lo) * B128;

    hi = target.readUInt32LE(12, true);
    lo = target.readUInt32LE(8, true);
    n += ((hi * 0x100000000) + lo) * B64;

    hi = target.readUInt32LE(4, true);
    lo = target.readUInt32LE(0, true);
    n += ((hi * 0x100000000) + lo) * B0;

    return n;
  },
  fromCompact(compact) {
    if (compact === 0) { return new BN(0); }

    const exponent = compact >>> 24;
    const negative = (compact >>> 23) & 1;

    let mantissa = compact & 0x7fffff;
    let num;

    if (exponent <= 3) {
      mantissa >>>= 8 * (3 - exponent);
      num = new BN(mantissa);
    } else {
      num = new BN(mantissa);
      num.iushln(8 * (exponent - 3));
    }

    if (negative) { num.ineg(); }

    return num;
  },
  // this is the getFromNumber function in
  // dark-gravity-wave-js/lib/utils/getDoubleFrom256.js
  getTarget(bits) {
    const target = this.fromCompact(bits);
    return this.double256(target.toArrayLike(Buffer, 'le', 32));
  },
};

module.exports = {

  getCorrectedHash(reversedHashObj) {
    const clone = Buffer.alloc(32);
    reversedHashObj.copy(clone);
    return clone.reverse().toString('hex');
  },
  normalizeHeader(header) {
    if (header instanceof dashcore.BlockHeader) {
      return header;
    }
    if (Buffer.isBuffer(header) && header.length === 80) {
      return new dashcore.BlockHeader(header);
    }
    if (typeof header === 'string' && header.length === 160) {
      const buffer = Buffer.from(header, 'hex');
      return new dashcore.BlockHeader(buffer);
    }

    const el = JSON.parse(JSON.stringify(header));

    return new dashcore.BlockHeader({
      version: el.version,
      prevHash: toHash(el.previousblockhash || el.prevHash),
      merkleRoot: (el.merkleroot || el.merkleRoot),
      time: el.time,
      bits: parseInt(el.bits, 16),
      nonce: el.nonce,
    });
  },
  getDgwBlock(header) {
    return {
      timestamp: header.timestamp,
      target: header.bits,
    };
  },
  validProofOfWork(header) {
    const target = expandTarget(header.bits);
    const hash = header._getHash().reverse();
    return hash.compare(target) === -1;
  },
  createBlock(prev, bits) {
    let i = 0;
    let header = null;
    do {
      header = new dashcore.BlockHeader({
        version: 2,
        prevHash: prev ? prev._getHash() : zeroHash,
        merkleRoot: zeroHash,
        time: prev ? (prev.time + 1) : Math.floor(Date.now() / 1000),
        bits,
        nonce: i += 1,
      });
    } while (!this.validProofOfWork(header));
    return header;
  },
};
