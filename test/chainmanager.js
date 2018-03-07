/* eslint no-underscore-dangle: ["error", { "allow": ["_getHash"] }] */
// const DashUtil = require('dash-util');
// const bitcore = require('bitcore-lib-dash');
const utils = require('../lib/utils');

const headers = [{ // testnet genesis
  version: 1,
  previousblockhash: '0000000000000000000000000000000000000000000000000000000000000000',
  merkleroot: 'e0028eb9648db56b1ac77cf090b99048a8007e2bb64b68f092c03c7f56a662c7',
  time: 1390666206,
  bits: '1e0ffff0',
  nonce: 3861367235,
},
{
  version: 2,
  previousblockhash: '00000bafbc94add76cb75e2ec92894837288a481e5c005f6563d91623bf8bc2c',
  merkleroot: 'b4fd581bc4bfe51a5a66d8b823bd6ee2b492f0ddc44cf7e820550714cedc117f',
  time: 1398712771,
  bits: '1e0fffff',
  nonce: 31475,
}];

const fetchHeaders = function fetchHeaders() {
  return headers.map(h => utils.normalizeHeader(h));

  // const blocks = [];

  // // chain 1 block 1 - connects to genesis
  // blocks.push(createBlock(genesis, '0x1fffffff')); // 0

  // // chain 2 block 1 - connects to genesis
  // blocks.push(createBlock(genesis, '0x1fffff0d')); // 1

  // // chain 2 block 2
  // blocks.push(createBlock(blocks[1], '0x1fffff0c')); // 2

  // // chain 1 block 2
  // blocks.push(createBlock(blocks[0], '0x1ffffffd')); // 3

  // // chain 2 block 3 - first matured block & cumalative difficulty higher than chain 1
  // // thus the first block considered main chain
  // blocks.push(createBlock(blocks[2], '0x1fffff0b')); // 4

  // return blocks;
};

module.exports = { fetchHeaders };
