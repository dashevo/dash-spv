const DashUtil = require('@dashevo/dash-util');

const merkleproofs = {
  validateTxProofs: (merkleBlock, transactions) => {
    let txToFilter = [];
    if (typeof transactions[0] === 'string') {
      txToFilter = transactions.slice().map(tx => DashUtil.toHash(tx).toString('hex'));
    } else {
      txToFilter = transactions.slice();
    }
    return merkleBlock.validMerkleTree
      && txToFilter.filter(tx => merkleBlock.hasTransaction(tx)).length === transactions.length;
  },
};

module.exports = merkleproofs;
