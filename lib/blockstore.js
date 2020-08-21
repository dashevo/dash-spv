const levelup = require('levelup');
const memdown = require('memdown');

const getByHash = async function (hash, db) {
  return new Promise((resolve, reject) => {
    db.get(hash, (err, data) => {
      if (err && err.name === 'NotFoundError') {
        resolve(null);
      } else if (err) {
        reject(err.message);
      } else {
        resolve(JSON.parse(data.toString()));
      }
    });
  });
};

const getByHeight = async function (height, db) {
  return new Promise((resolve, reject) => {
    db.get(height, (err, data) => {
      if (err && err.name === 'NotFoundError') {
        resolve(null);
      } else if (err) {
        reject(err.message);
      } else {
        const hash = JSON.parse(data.toString());
        resolve(getByHash(hash, db));
      }
    });
  });
};

class BlockStore {
  constructor() {
    this.db = levelup(memdown(), {
      keyAsBuffer: false,
      valueAsBuffer: false,
      valueEncoding: 'json',
    });
  }

  /**
   * Allow to store an header
   * @param header
   * @returns {Promise<String>}
   */
  put(header) {
    return new Promise((resolve, reject) => {
      this.db.put(header.hash, JSON.stringify(header.toObject()), (err) => {
        if (!err) {
          this.db.put(header.height, header.hash, (heightError) => {
            if (!heightError) {
              resolve(header.hash);
            } else {
              reject(heightError);
            }
          });
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Allow to get back an header by it's hash or height
   *
   * @param {String|Number} identifier - Hash or height block identifier
   * @returns {Promise<BlockHeader>}
   */
  async get(identifier) {
    const self = this;

    return (identifier.constructor === Number)
      ? getByHeight(identifier, self.db)
      : getByHash(identifier, self.db);
  }

  close() {
    this.db.close();
  }

  isClosed() {
    return this.db.isClosed();
  }

  isOpen() {
    return this.db.isOpen();
  }
}


module.exports = BlockStore;
