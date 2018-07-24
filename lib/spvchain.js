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
    this.root = null;
    this.allBranches = [];
    this.orphanBlocks = [];
    this.init(chainType, startBlock);
    this.store = new BlockStore(this.root.hash);
  }

  init(chainType, startBlock) {
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
        if (startBlock) {
          this.root = startBlock;
        } else {
          throw new Error('Unhandled chaintype or startBlock not provided');
        }
        break;
    }
    this.root.children = [];
    this.setAllBranches();
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
    return this.getLongestChain().slice(-1)[0].hash;
  }

  getHeader(hash) {
    return this.store.get(hash)
      .then((blockInDB) => {
        if (blockInDB) {
          return blockInDB;
        }

        return this.getLongestChain.filter(h => h.hash === hash);
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

  setAllBranches(node = this.root, branch = []) {
    this.allBranches = [];
    branch.push(node);

    node.children.forEach((c) => {
      this.setAllBranches(c, Array.from(branch));
    });

    if (node.children.length === 0) {
      this.allBranches.push(branch);
    }
  }

  getAllBranches() {
    return this.allBranches;
  }

  isDuplicate(compareHash) {
    return this.getAllBranches().map(branch => branch.map(node => node.hash))
      .concat(this.orphanBlocks.map(orphan => orphan.hash))
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
      connection.children.push(header);
      this.orphanReconnect();
    } else {
      this.orphanBlocks.push(header);
    }
  }

  addHeader(header) {
    const headerNormalised = utils.normalizeHeader(header);

    if (Consensus.isValidBlockHeader(this.getLongestChain(), headerNormalised)
      && !this.isDuplicate(headerNormalised.hash)) {
      headerNormalised.pow = utils.getDifficulty(headerNormalised.bits);
      headerNormalised.children = [];
      this.processValidHeader(headerNormalised);
      this.setAllBranches();
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
