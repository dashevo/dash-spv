const { isValidTarget } = require('@dashevo/dark-gravity-wave');

const utils = require('./utils');

const MIN_DGW_HEADERS = 24;
const MIN_TIMESTAMP_HEADERS = 11;

function getDgwHeaders(headers, index) {
  if (index >= (MIN_DGW_HEADERS) && headers.length >= MIN_DGW_HEADERS) {
    return headers.slice(index - (MIN_DGW_HEADERS), index);
  }
  return headers;
}

function getTimestampHeaders(headers, index) {
  if (index > MIN_TIMESTAMP_HEADERS && headers.length > MIN_TIMESTAMP_HEADERS) {
    return headers.slice(index - MIN_TIMESTAMP_HEADERS, index);
  }
  return [];
}

function isParentChild(parentHeader, childHeader) {
  return utils.normalizeHeader(parentHeader).hash === utils.normalizeHeader(childHeader).prevHash.reverse().toString('hex');
}

function getTimestampAverage(headers) {
  if (headers.length < MIN_TIMESTAMP_HEADERS) return 0;
  const timestamps = headers.slice(
    headers.length - MIN_TIMESTAMP_HEADERS,
  ).map(h => h.time);
  return timestamps.reduce((total, amount, index, array) => {
    total += amount; // eslint-disable-line no-param-reassign
    if (index === array.length - 1) {
      return total / array.length;
    }
    return total;
  });
}

function isValidTimestamp(header, previousHeaders) {
  if (previousHeaders.length < MIN_TIMESTAMP_HEADERS) return true;
  const avg = getTimestampAverage(previousHeaders);
  return avg < header.time;
}

async function validateHeaderChunk(chunk) {
  const normalizedHeaders = chunk.map(header => utils.normalizeHeader(header));

  // verifying timestamps (ts > avg of previous 11 timestamps)
  const invalidTimestamp = normalizedHeaders.filter(
    (header, index, headers) => !isValidTimestamp(
      header, getTimestampHeaders(headers, index),
    ),
  );

  // verifying POW
  const invalidPOW = normalizedHeaders.filter(header => !header.validProofOfWork());

  // verifying difficulty targets from the 24th header onwards
  const invalidTarget = normalizedHeaders.filter(
    (header, index, headers) => {
      if (index > 23) {
        return !isValidTarget(
          header.bits, getDgwHeaders(headers, index).map(h => utils.getDgwBlock(h)),
        );
      }
      return false;
    },
  );

  // verifying parent child connections (chain consistency)
  const badConnections = normalizedHeaders.filter((header, index, headers) => {
    if (index > 0 && index < headers.length - 1) {
      return !isParentChild(header, headers[index + 1]);
    }
    return false;
  });

  const badHeaders = [...new Set(invalidTimestamp.concat(
    invalidPOW, invalidTarget, badConnections,
  ))];

  return { valid: badHeaders.length <= 0, badHeaders };
}

async function validateHeaderChunks(chunks) {
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
  validateHeaderChunk,
  validateHeaderChunks,
  isValidBlockHeader,
};
