import RLP from "rlp";
import { ethers } from "ethers";


const MAP_HEX = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
  e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
  E: 14, F: 15
};
export function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}
export function fromHex(hexString) {
  const bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
  let i;
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hexString[i * 2]];
    const b = MAP_HEX[hexString[i * 2 + 1]];
    if (a === undefined || b === undefined) {
      break;
    }
    bytes[i] = (a << 4) | b;
  }
  return i === bytes.length ? bytes : bytes.slice(0, i);
}


// export function uint8ArrayToBigInt(uint8Array) {
//     let result = 0n;
//     for (let i = 0; i < 32; i++) {
//         result = (result << 8n) | BigInt(uint8Array[i]);
//     }
//     return result.toString();
// }

export function uint8ArrayToStringArray(uint8Array) {
    return Array.from(uint8Array).map((s) => s.toString())
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


function hexToBytesPad(raw, length) {
  raw = hexToBytes(raw.substring(2)).map(e => e+"")
  let _length = raw.length
  for (let index = 0; index < length; index++)
      if (index >= _length)
          raw.push("0")
  return [raw, _length]
}

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
  let nodes_rest = []
  let nodes_initial_length = 3
  let roots = []
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
        nodes_rest.push(node_)
    } else if (decoded.length == 2 && index != proof.length - 1) {
      alert("proof has a extension node!")
    } else {
      console.log("leaf is here:")
      console.log(nodeRaw)
    }
  }
  return {nodes_initial, nodes_rest, roots}
}


export function encodeAccount(accountRaw, address) {
  let account = {}
  let balance = hexToBytesPad(accountRaw.balance, 32)
  let nonce = hexToBytesPad(accountRaw.nonce, 8)

  account.balance = balance[0]
  account.balance_length = balance[1] + ""
  account.nonce = nonce[0]
  account.nonce_length = nonce[1] + ""

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
  console.log(initial_inputs)
  return initial_inputs
}