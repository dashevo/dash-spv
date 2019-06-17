const DashUtil = require('@dashevo/dash-util');

const merkleproofs = {
  validateTxProofs: (merkleBlock, transactions) => {
    let txToFilter = transactions.slice();
    if (typeof transactions[0] === 'string') {
      txToFilter = txToFilter.map(tx => DashUtil.toHash(tx).toString('hex'));
    }
    return merkleBlock.validMerkleTree
      && txToFilter.filter(tx => merkleBlock.hasTransaction(tx)).length === transactions.length;
  },
};

module.exports = merkleproofs;
