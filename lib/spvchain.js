const BlockStore = require('./blockstore');
const config = require('../config/config');
const Consensus = require('./consensus');
const utils = require('../lib/utils');

// Additional number of blocks that needs to be mined on top of
// a confirmed block before it is seen as a final unchangeable
// block and get be written to permanent storage
const confirmsBeforeFinal = 100;

const SpvChain = class {
  constructor(chainType, startBlock) {
    this.chainHeight = 0;
    this.forkedChains = [];
    this.POW = 1; // cumulative difficulty
    this.ready = false;

    switch (chainType) {
      case 'testnet':
        this.root = config.getTestnetGenesis();
        break;
      case 'livenet':
        this.root = config.getLivenetGenesis();
        break;
      case 'lowdiff':
        this.root = config.getLowDiffGenesis();
        break;
      default:
        if (!startBlock) throw new Error('Unhandled chaintype');
        this.root = config.getLowDiffGenesis();
        break;
    }
    this.root.children = [];
    this.allBranches = [];
    this.orphanArray = [];

    this.store = new BlockStore(this.root.hash);
    // this.forkedChains.push(new ForkedChain(this.root, this.POW));
    this.startHousekeeper();
  }

  getLongestChain() {
    return this.allBranches.sort((b1, b2) => b1 < b2)[0];
  }

  startHousekeeper() {
    setInterval(() => {
      const longestChain = this.getLongestChain();

      if (longestChain.length > confirmsBeforeFinal) {
        this.BlockStore.put(longestChain.splice(1));
      }
    }, 1 * 60 * 1000); // 1 minute
  }

  getTipHash() {
    return this.getBestFork().getTipHash();
  }

  isChainReady() {
    return this.ready;
  }

  putStore(block) {
    this.POW += block.bits;
    this.chainHeight += 1;
    return this.store.put(block);
  }

  getBestFork() {
    const maxDifficulty = Math.max(...this.forkedChains.map(f => f.getPOW()));
    return this.forkedChains.find(f => f.getPOW() === maxDifficulty);
  }

  getAllForks() {
    return this.forkedChains;
  }

  getChainHeight() {
    return this.chainHeight + (this.getBestFork().getForkHeight() - 1);
  }

  getBlock(blockhash) {
    return this.store.get(blockhash)
      .then((blockInDB) => {
        if (blockInDB) {
          return blockInDB;
        }
        const blockInFork = this.getBestFork().blocks.filter(b => b.hash === blockhash);
        if (blockInFork.length === 1) {
          return blockInFork[0];
        }
        return null;
      });
  }

  findConnection(newHeader) {
    const stack = [this.root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.hash === utils.getCorrectedHash(newHeader.prevHash)) {
        return node;
      }
      node.children.forEach((c) => { stack.push(c); });
    }
    return null;
  }

  getAllBrances(node = this.root, branch = []) {
    branch.push(node);

    node.children.forEach((c) => {
      this.getAllBrances(c, Array.from(branch));
    });

    if (node.children.length === 0) {
      this.allBranches.push(branch);
    }

    return this.allBranches;
  }

  isDuplicate(compareHash) {
    return this.getAllBrances().map(branch => branch.map(node => node.hash))
      .concat(this.orphanArray.map(orphan => orphan.hash))
      .filter(hash => hash === compareHash).length > 0;
  }

  orphanReconnect() {
    for (let i = 0; i < this.orphanBlocks.length; i += 1) {
      const connectionTip = this.findConnection(this.orphanBlocks[i]);
      if (connectionTip) {
        connectionTip.addChild(this.orphanBlocks[i]);
        this.orphanBlocks.splice(i, 1);
      }
    }
  }

  processValidHeader(header) {
    const connection = this.findConnection(header);
    if (connection) {
      connection.addChild(header);
      this.orphanReconnect();
      this.updateAllBranches();
    } else {
      this.orphanBlocks.push(header);
    }
  }

  addHeader(header) {
    const headerNormalised = utils.normalizeHeader(header);

    if (Consensus.isValidBlockHeader(this.getBestFork().blocks, headerNormalised)
      && !this.isDuplicate(header.hash)) {
      this.processValidHeader(headerNormalised);
      return true;
    }
    return false;
  }

  addHeaders(headers) {
    const self = this;
    headers.forEach((header) => {
      self.addHeader(header);
    });
  }
};

module.exports = SpvChain;
