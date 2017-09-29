// mafintosh's wasm modules do fs.readFileSync calls because they can.
// brfs inlines fs.readFileSync calls.
module.exports = {
  test: /(blake2b-wasm|siphash24|hypercore-protocol).*\.js$/,
  loader: "transform-loader?brfs"
}
