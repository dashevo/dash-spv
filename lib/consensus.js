const dgwTarget = require('dark-gravity-wave-js').darkGravityWaveTargetWithBlocks;
const utils = require('./utils');

module.exports = {

  isValidBlockHeader(dgwHeaders, newHeader) {
    return newHeader.validProofOfWork() &&
      newHeader.validTimestamp() &&
      newHeader.getDifficulty() >= dgwTarget(dgwHeaders.map(h => utils.getDgwBlock(h)));
  },

};
