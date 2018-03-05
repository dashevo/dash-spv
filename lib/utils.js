const DashUtil = require('dash-util');
const bitcore = require('bitcore-lib-dash');

module.exports = {

  getCorrectedHash(reversedHashObj) {
    const clone = Buffer.alloc(32);
    reversedHashObj.copy(clone);
    return clone.reverse().toString('hex');
  },
  getDifficulty(target) {
    // TODO
    return target !== 0 ? 1.0 / target : 0;
  },
  normalizeHeader(header) {
    const el = JSON.parse(JSON.stringify(header));

    return new bitcore.BlockHeader({
      version: el.version,
      prevHash: DashUtil.toHash(el.previousblockhash),
      merkleRoot: el.merkleroot,
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
};
