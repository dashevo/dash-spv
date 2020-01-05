/* eslint no-underscore-dangle: ["error", { "allow": ["_getHash"] }] */
/* eslint-disable no-bitwise */
const dashcore = require('@dashevo/dashcore-lib');
// define an empty buffer to represent the zero hash value
const zeroHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');

// returns a boolean -- whether a passed string is valid hex or not
function isHexString(str) {
  return !(typeof str !== 'string' || str.length === 0 || str.length % 2);
}

// input is a hex string of len 64, outputs a buffer w/those bytes, reversed
function toHash(hex) {
  if (hex.length !== 64 || !isHexString(hex)) {
    throw new Error('argument must be a hex string');
  }
  return Buffer.from(hex, 'hex').reverse();
}

function expandTarget(bits) {
  if (bits > 0xffffffff) {
    throw new Error('"bits" may not be larger than 4 bytes');
  }
  const exponent = bits >>> 24;
  if (exponent <= 3) throw new Error('target exponent must be > 3');
  if (exponent > 32) throw new Error('target exponent must be < 32');
  const mantissa = bits & 0x007fffff;
  const target = Buffer.alloc(32).fill(0);
  target.writeUInt32BE(mantissa << 8, 32 - exponent);
  return target;
}

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
