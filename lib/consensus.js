const { isValidTarget } = require('@dashevo/dark-gravity-wave');
const utils = require('./utils');

const MIN_TIMESTAMP_HEADERS = 11;

function getTimestampAverage(headers) {
  const timestamps = headers.map(h => h.time);
  return timestamps.reduce((total, amount, index, array) => {
    total += amount; // eslint-disable-line no-param-reassign
    if (index === array.length - 1) {
      return total / array.length;
    }
    return total;
  });
}

function isValidBlockHeader(dgwHeaders, newHeader) {
  return newHeader.validProofOfWork()
    && newHeader.validTimestamp()
    && isValidTarget(newHeader.bits, dgwHeaders.map(h => utils.getDgwBlock(h)));
}

function isValidTimestamp(previousHeaders, newHeader) {
  if (previousHeaders.length < MIN_TIMESTAMP_HEADERS) return true;
  const headerNormalised = utils.normalizeHeader(newHeader);
  const normalizedHeaders = previousHeaders.slice(
    Math.max(previousHeaders.length - MIN_TIMESTAMP_HEADERS, 0),
  ).map(h => utils.normalizeHeader(h));
  return getTimestampAverage(normalizedHeaders) < headerNormalised.time;
}

module.exports = {
  isValidBlockHeader,
  isValidTimestamp,
};
