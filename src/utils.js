import RLP from "rlp";
import { ethers } from "ethers";
import { innner_layer_vk } from "./target/verification_keys";


export function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

export function uint8ArrayToStringArray(uint8Array) {
    return Array.from(uint8Array).map((s) => s.toString())
}

export function hexStringToStringUint8Array(hexString) {
  let str = Uint8Array.from(Buffer.from(hexString, 'hex'));
  return uint8ArrayToStringArray(str)
}

export function zero_proof() {
  const zero = "0x0000000000000000000000000000000000000000000000000000000000000000"
  let result = []
  for (let index = 0; index < 456; index++) {
    result.push(zero);
  }
  return result
}

export function zero_public_input() {
  const zero = "0x0000000000000000000000000000000000000000000000000000000000000000"
  let result = []
  for (let index = 0; index < 1; index++) {
    result.push(zero);
  }
  return result
}



// function hexToBytesPad(raw, length) {
//   raw = hexToBytes(raw.substring(2)).map(e => e+"")
//   let _length = raw.length
//   for (let index = 0; index < length; index++)
//       if (index >= _length)
//           raw.push("0")
//   return [raw, _length]
// }

function hexToBytesPadInverse(raw, length) {
  raw = hexToBytes(raw.substring(2)).map(e => e+"")
  let _length = raw.length
  for (let index = 0; index < length - _length; index++)
    if (index >= _length)
      raw = ["0"] + raw
  return raw
}

export function getNodesFromProof(proof) {
  let nodes_initial = []
  let nodes_inner = []
  let nodes_initial_length = 3
  let roots = []
  let account = []
  console.log("proof:")
  console.log(proof)
  for (let index = 0; index < proof.length; index++) {
    const nodeRaw = proof[index];
    roots.push(hexToBytesPadInverse(ethers.keccak256(nodeRaw), 32))

    let decoded = RLP.decode(nodeRaw)
    let node_ = {
        "rows": [],
        "row_exist": []
    }
    if (decoded.length == 17) {
      // branch
      node_.node_type = "0"
      let row_count = 0
      decoded.forEach(row => {
        if (row_count != 16) {
          let row_ = []
          if (row.length == 32) {
              row.forEach(elem => {row_.push(elem + "")})
              node_.row_exist.push("1")
          } else {
              row_ = Array(32).fill("0")
              node_.row_exist.push("0")
          }
          node_.rows.push(row_)
        }
        row_count += 1
      })
      if (index < nodes_initial_length)
        nodes_initial.push(node_)
      else
        nodes_inner.push(node_)
    } else if (decoded.length == 2 && index != proof.length - 1) {
      alert("proof has a extension node!")
    } else {
      console.log("leaf is here:")
      console.log(nodeRaw)
      account = RLP.decode(RLP.decode(nodeRaw)[1])
    }
  }
  return {nodes_initial, nodes_inner, roots, account}
}

function padArray(data, length) {
  for (let index = data.length; index < length; index++) {
    data.push(0)
  }
  return data
}

export function encodeAccount(accountRaw, address) {
  let account = {}
  console.log("before")
  console.log(accountRaw)
  console.log(accountRaw[0])
  account.nonce = padArray(Array.from(accountRaw[0]), 8)
  account.balance = padArray(Array.from(accountRaw[1]), 32)
  account.nonce_length = accountRaw[0].length
  account.balance_length = accountRaw[1].length

  console.log("address")
  console.log(address)
  account.address = hexToBytesPadInverse(address, 20)
  let trie_key = hexToBytesPadInverse(ethers.keccak256(address), 32)
  console.log("trie key:")
  console.log(trie_key)
  return {"account": account, "trie_key": trie_key}
}

export function getInitialPublicInputs(trie_key, _root) {
  const trie_key_start_index = "0x0000000000000000000000000000000000000000000000000000000000000000"
  let padded_trie_key = []
  trie_key.forEach(e => {
    padded_trie_key.push("0x" + (+e).toString(16).padStart(64, '0'))
  })
  let root = []
  _root.forEach(e => {
    root.push("0x" + (+e).toString(16).padStart(64, '0'))
  })
  let initial_inputs = []
  root.forEach(e => {initial_inputs.push(e)})
  padded_trie_key.forEach(e => {initial_inputs.push(e)})
  initial_inputs.push(trie_key_start_index)
  root.forEach(e => {initial_inputs.push(e)})
  for (let index = 0; index < 112; index++) {
    initial_inputs.push("0x0000000000000000000000000000000000000000000000000000000000000000");
  }
  console.log(initial_inputs)
  return initial_inputs
}

export function getInitialPlaceHolderInput() {
  return innner_layer_vk
}