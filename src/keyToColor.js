const sodium = require('sodium-universal')

// Use the prefix of the (blake2b) hash of the given key as a color code.
// We use the hash rather than the original key so that the color is sensitive to typos.
export default function keyToColor (key) {
  const digest = new Buffer(32)
  sodium.crypto_generichash_batch(digest, key)
  return '#' + digest.toString('hex').slice(0, 6)
}
