const BlockStore = require('./blockstore');
const config = require('../config/config');
const ForkedChain = require('./forkedchain');
const Consensus = require('./consensus');

const SpvChain = class {
  constructor(fileStream, chainType) {
    this.store = new BlockStore();
    this.chainHeight = 0;
    this.forkedChains = [];
    this.POW = 0; // cumulative difficulty
    this.genesisHeader = null;
    this.ready = false;

    this.initChain(fileStream, chainType);
  }

  initChain(fileStream, chainType) {
    let genesisHeader = null;
    switch (chainType || 'lowdiff') {
      case 'testnet':
        genesisHeader = config.getTestnetGenesis();
        break;
      case 'livenet':
        genesisHeader = config.getLivenetGenesis();
        break;
      case 'lowdiff':
        genesisHeader = config.getLowDiffGenesis();
        break;
      default:
        throw new Error('Unhandled chaintype');
    }

    this.addCachedBlock(genesisHeader);

    // loadBlocksFromFile(fileStream) {
    //   throw new Exception('loadBlocksFromFile not yet implemented');
    // }


    if (fileStream) {
      // loadBlocksFromFile();
    }
  }

  getTipHash() {
    return this.store.getTipHash();
  }

  isChainReady() {
    return this.ready;
  }

  putStore(block) {
    this.POW += block.bits;
    this.chainHeight++;
    return this.store.put(block);
  }

  addCachedBlock(block) {
    const tipConnection = this.forkedChains.filter(fc => fc.isConnectedToTip(block));
    const headConnection = this.forkedChains.filter(fc => fc.isConnectedToHead(block));

    block.getDifficulty();

    if (tipConnection.length > 0) {
      tipConnection[0].addTip(block);
    } else if (headConnection.length > 0) {
      headConnection[0].addHead(block);
    } else {
      this.forkedChains.push(new ForkedChain(block, this.POW, this.store.getTipHash()));
    }
  }

  getBestFork() {
    const maxDifficulty = Math.max(this.forkedChains.map(f => f.getPOW()));
    return this.forkedChains.find(f => f.getPOW() === maxDifficulty);
  }

  processMaturedChains() {
    const bestChainMaturedBlocks = this.getBestFork().getMaturedBlocks();

    for (let i = 0; i < bestChainMaturedBlocks.length; i++) {
      this.putStore(bestChainMaturedBlocks.pop());
    }

    // todo: kill expired chains
  }

  addHeader(header) {
    if (Consensus.isValidBlockHeader(this.getBestFork(), header)) {
      this.addCachedBlock(header);
      this.processMaturedChains();
    } else {
      throw new Error('Block does not conform to header consensus rules');
    }
  }

  addHeaders(headers) {
    const self = this;
    headers.forEach((header) => {
      self.addHeader(header);
    });
  }

  getChainHeight() {
    return this.chainHeight + this.getBestFork().getForkHeight();
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
};

module.exports = SpvChain;
