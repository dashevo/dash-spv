<<<<<<< HEAD
const dashcore = require('@dashevo/dashcore-lib');
const calculateMnListMerkleRoot = require('./mnlistmerkleroot');
=======
const dashcore = require('bitcore-lib-dash');
>>>>>>> 98258a0d2b87af7fc717aad5e4711bba709b7d6d


const merkleproofs = {

  validateTxProofs: (merkleBlock, transactions) =>
    merkleBlock.validMerkleTree() &&
    transactions.filter(t => merkleBlock.hasTransaction(t)).length === transactions.length,

  validateMnProofs(header, flags, hashes, numTransactions, cbTxHash) {
    const merkleBlock = new dashcore.MerkleBlock({
      header,
      numTransactions,
      hashes,
      flags,
    });

    return merkleBlock.validMerkleTree() && merkleBlock.hasTransaction(cbTxHash);
  },

<<<<<<< HEAD
  validateMnListMerkleRoot(mnListMerkleRoot, mnList) {
    return calculateMnListMerkleRoot(mnList) === mnListMerkleRoot;
  },

=======
>>>>>>> 98258a0d2b87af7fc717aad5e4711bba709b7d6d
};


module.exports = merkleproofs;

