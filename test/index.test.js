const Blockchain = require('../lib/spvchain');
const chainManager = require('./chainmanager');
const utils = require('../lib/utils');

let chain = null;
let headers = [];
require('should');

describe('SPV-DASH (forks & re-orgs)', () => {
  before(() => {
    headers = chainManager.fetchHeaders();
    chain = new Blockchain('testnet');
  });

  it('should get 25 testnet headers', () => {
    headers.length.should.equal(25);
  });

  it('should contain 1 branch when chain is initialised with genesis block', () => {
    chain.getAllBranches().length.should.equal(1);
  });

  it('should contain genesis hash', () => {
    chain.getTipHash().should.equal('00000bafbc94add76cb75e2ec92894837288a481e5c005f6563d91623bf8bc2c');
    chain.getLongestChain().length.should.equal(1);
  });

  it('should still contain a branch of 1 when first header is added', () => {
    chain.addHeader(headers[0]);
    chain.getAllBranches().length.should.equal(1);
    chain.getLongestChain().length.should.equal(2);
  });

  it('create 1 orphan', () => {
    chain.addHeader(headers[2]);
    chain.getOrphans().length.should.equal(1);
    chain.getLongestChain().length.should.equal(2);
  });

  it('connect the orphan by adding its parent', () => {
    chain.addHeader(headers[1]);
    chain.getOrphans().length.should.equal(0);
    chain.getAllBranches().length.should.equal(1);
    chain.getLongestChain().length.should.equal(4);
  });
});

describe('Difficulty Calculation', () => {
  it('should have difficulty of 1 when target is max', () => {
    const testnetMaxTarget = 0x1e0ffff0;
    utils.getDifficulty(testnetMaxTarget).should.equal(1);
  });

  it('should have difficulty higher than 1 when target is lower than max', () => {
    const testnetMaxTarget = 0x1e0fffef;
    utils.getDifficulty(testnetMaxTarget).should.be.greaterThan(1);
  });
});
