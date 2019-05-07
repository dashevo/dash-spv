const { isValidTarget } = require('@dashevo/dark-gravity-wave');
const utils = require('./utils');

const MIN_TIMESTAMP_HEADERS = 11;

function getMedianTimestamp(headers) {
  const timestamps = headers.map(h => h.time);
  const median = (arr) => {
    const mid = Math.floor(arr.length / 2);
    const nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };
  return median(timestamps);
}

function isValidBlockHeader(dgwHeaders, newHeader) {
  return newHeader.validProofOfWork()
    && newHeader.validTimestamp()
    && isValidTarget(newHeader.bits, dgwHeaders.map(h => utils.getDgwBlock(h)));
}

// Must be strictly greater than the median time of the previous 11 blocks.
// https://dash-docs.github.io/en/developer-reference#block-headers
function isValidTimestamp(previousHeaders, newHeader) {
  if (previousHeaders.length < MIN_TIMESTAMP_HEADERS) return true;
  const headerNormalised = utils.normalizeHeader(newHeader);
  const normalizedLastHeaders = previousHeaders.slice(
    Math.max(previousHeaders.length - MIN_TIMESTAMP_HEADERS, 0),
  ).map(h => utils.normalizeHeader(h));
  return getMedianTimestamp(normalizedLastHeaders) < headerNormalised.time;
}

module.exports = {
  isValidBlockHeader,
  isValidTimestamp,
};
