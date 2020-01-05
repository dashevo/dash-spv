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

const merkleproofs = {
  /**
   * validates an array of tx hashes or Transaction instances
   * against a merkleblock
   * @param {MerkleBlock} merkleBlock - a MerkleBlock instance
   * @param {Transaction[]|string[]} transactions
   * @return {boolean}
   */
  validateTxProofs: (merkleBlock, transactions) => {
    let txToFilter = transactions.slice();
    if (typeof transactions[0] === 'string') {
      txToFilter = txToFilter.map(tx => toHash(tx).toString('hex'));
    }
    return merkleBlock.validMerkleTree
      && txToFilter.filter(tx => merkleBlock.hasTransaction(tx)).length === transactions.length;
  },
};

module.exports = merkleproofs;
