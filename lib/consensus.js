const dgw = require('dark-gravity-wave-js');

module.exports = {

  isValidBlockHeader(dgwHeaders, newHeader) {
    return newHeader.validProofOfWork() &&
      newHeader.validTimestamp() &&
      newHeader.getDifficulty() >= dgw.darkGravityWaveTargetWithBlocks(dgwHeaders);
  },

};
