<<<<<<< HEAD
const dashcore = require('@dashevo/dashcore-lib');

// from dashcore/lib/block/block.js
function getMerkleTree(tree) {
  let j = 0;
  for (let size = tree.length; size > 1; size = Math.floor((size + 1) / 2)) {
=======
const dashcore = require('bitcore-lib-dash');

// Todo: from dashcore/lib/block/block.js
// refactor to cleaner, functional design once unit tests in place
function getMerkleTree() {
  const tree = this.getTransactionHashes();

  let j = 0;
  for (let size = this.transactions.length; size > 1; size = Math.floor((size + 1) / 2)) {
>>>>>>> 98258a0d2b87af7fc717aad5e4711bba709b7d6d
    for (let i = 0; i < size; i += 2) {
      const i2 = Math.min(i + 1, size - 1);
      const buf = Buffer.concat([tree[j + i], tree[j + i2]]);
      tree.push(dashcore.crypto.Hash.sha256sha256(buf));
    }
    j += size;
  }

  return tree;
}

function calculateMnListMerkleRoot(mnList) {
  return getMerkleTree(mnList.sort((m1, m2) => m1.proRegTxHash > m2.proRegTxHash)
<<<<<<< HEAD
    .map(m => new dashcore.SmlEntry(m).getHash()))
    .slice(-1)[0]
    .toString('hex');
=======
    .map(m => new dashcore.SmlEntry(m).hash()))
    .slice(-1)[0];
>>>>>>> 98258a0d2b87af7fc717aad5e4711bba709b7d6d
}

module.exports = calculateMnListMerkleRoot;

