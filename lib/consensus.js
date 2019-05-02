const { isValidTarget } = require('@dashevo/dark-gravity-wave');
const utils = require('./utils');

function getDgwHeaders(headers, index) {
  if (index >= 24 && headers.length >= 24) {
    return headers.slice(index - 24, index);
  }
  return headers;
}

function isParentChild(parentHeader, childHeader) {
  return utils.normalizeHeader(parentHeader).hash === utils.normalizeHeader(childHeader).prevHash;
}

function isValidHeaderChunk(chunk) {
  const normalizedHeaders = chunk.map(header => utils.normalizeHeader(header));

  // TODO: verifying timestamps
  if (normalizedHeaders.length >= 11) {
    // average of previous 11 timestamps

  }

  // verifying POW
  const invalidPOW = normalizedHeaders.filter(header => !header.validProofOfWork());

  // verifying difficulty targets
  const invalidTarget = normalizedHeaders.filter(
    (header, index, headers) => !isValidTarget(
      header.bits, getDgwHeaders(headers, index).map(h => utils.getDgwBlock(h)),
    ),
  );

  // verifying parent child connections (chain consistency)
  const badConnections = normalizedHeaders.filter((header, index, headers) => {
    if (index > 0 || index < headers.length) {
      return !isParentChild(header, headers[index + 1]);
    }
    return false;
  });

  const badHeaders = invalidPOW.concat(invalidTarget, badConnections);

  return { valid: badHeaders.length <= 0, badHeaders };
}

function validateHeaderChunks(chunks) {
  const badChunks = chunks.filter((chunk, index, arrChunks) => {
    switch (index) {
      case 0:
        return !isParentChild(chunk.items[chunk.items.length - 1], arrChunks[index + 1].items[0]);
      case arrChunks.length:
        return !isParentChild(chunk.items[0], arrChunks[index - 1].items[chunk.items.length]);
      default:
        return !isParentChild(chunk.items[chunk.items.length - 1], arrChunks[index + 1].items[0])
          || !isParentChild(chunk.items[0], arrChunks[index - 1].items[chunk.items.length]);
    }
  });

  return { valid: badChunks.length <= 0, badChunks };
}

function isValidBlockHeader(dgwHeaders, newHeader) {
  return newHeader.validProofOfWork()
    && newHeader.validTimestamp()
    && isValidTarget(newHeader.bits, dgwHeaders.map(h => utils.getDgwBlock(h)));
}

module.exports = {
  isValidHeaderChunk,
  validateHeaderChunks,
  isValidBlockHeader,
};
