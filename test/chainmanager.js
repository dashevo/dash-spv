/* eslint no-underscore-dangle: ["error", { "allow": ["_getHash"] }] */
const DashUtil = require('dash-util');
const bitcore = require('bitcore-lib-dash');

function validProofOfWork(header) {
  const target = DashUtil.expandTarget(header.bits);
  const hash = header._getHash().reverse();
  return hash.compare(target) !== 1;
}

function createBlock(prev, bits) {
  let i = 0;
  let header = null;
  do {
    header = new bitcore.BlockHeader({
      version: 2,
      prevHash: prev ? prev._getHash() : DashUtil.nullHash,
      merkleRoot: DashUtil.nullHash,
      time: prev ? (prev.time + 1) : Math.floor(Date.now() / 1000),
      bits,
      nonce: i += 1,
    });
  } while (!validProofOfWork(header));
  return header;
}

const fetchHeaders = function fetchHeaders(genesis) {
  const blocks = [];

  // chain 1 block 1 - connects to genesis
  blocks.push(createBlock(genesis, '0x1fffffff')); // 0

  // chain 2 block 1 - connects to genesis
  blocks.push(createBlock(genesis, '0x1fffff0d')); // 1

  // chain 2 block 2
  blocks.push(createBlock(blocks[1], '0x1fffff0c')); // 2

  // chain 1 block 2
  blocks.push(createBlock(blocks[0], '0x1ffffffd')); // 3

  // chain 2 block 3 - first matured block & cumalative difficulty higher than chain 1
  // thus the first block considered main chain
  blocks.push(createBlock(blocks[2], '0x1fffff0b')); // 4

  return blocks;
};

module.exports = { fetchHeaders };
