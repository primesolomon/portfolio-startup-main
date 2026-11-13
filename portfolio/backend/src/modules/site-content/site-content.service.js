const repository = require('./site-content.repository');

async function get() {
  return repository.get();
}

async function save(patch) {
  return repository.save(patch);
}

module.exports = { get, save };
