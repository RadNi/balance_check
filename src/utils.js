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
  const nodes_initial = []
  const nodes_inner = []
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let account = {}
  const nodes_initial_length = 3
  const roots = []
  console.log("proof:")
  console.log(proof)
  for (let index = 0; index < proof.length; index++) {
    const nodeRaw = proof[index];
    roots.push(hexToBytesPadInverse(ethers.keccak256(nodeRaw), 32))

    const decoded = RLP.decode(nodeRaw)
    let node_type
    const rows = []
    const row_exist = []
    let prefix_addition
    if (decoded.length == 17) {
      // branch
      node_type = 0
      prefix_addition = 1
      let row_count = 0
      console.log("injaaaa")
      console.log(decoded)
      decoded.forEach(row => {
        if (row instanceof Uint8Array) {
          if (row_count != 16) {
            let row_ = []
            if (row.length == 32) {
                row_ = Array.from(row)
                row_exist.push(1)
            } else {
                /* eslint-disable @typescript-eslint/no-unsafe-assignment */
                row_ = Array(32).fill(0)
                row_exist.push(0)
            }
            rows.push(row_)
          }
          row_count += 1
        }
      })
    } else if (decoded.length == 2 && index != proof.length - 1) {
      console.log("proof has a extension node!")
      node_type = 1
      if (decoded[0] instanceof Uint8Array && decoded[1] instanceof Uint8Array) {
        const first_row = Array(32).fill(0)
        /* eslint-disable @typescript-eslint/non-nullable-type-assertion-style*/
        first_row[0] = ((decoded[0][0]) >> 4) & 0xF
        first_row[1] = decoded[0][0] & 0xF
        first_row[2] = decoded[0].length - 1
        rows.push(first_row)

        const second_row = Array(32).fill(0)
        for (let index = 0; index < first_row[2]; index++) {
          second_row[index] = decoded[0][index + 1];
        }
        rows.push(second_row)

        let third_row= []
        decoded[1].map(e => third_row.push(e))
        while (third_row.length != 32) {
          third_row = [0].concat(third_row)
        }
        rows.push(third_row)

        const zero = Array(32).fill(0)
        for (let index = 0; index < 13; index++)
          rows.push(zero)

        for (let index = 0; index < 16; index++)
          row_exist.push(0)

        prefix_addition = first_row[2] * 2 + first_row[0]
      } else {
        throw Error("extension node has wrong format!")
      }
    } else {
      console.log("leaf is here:")
      console.log(nodeRaw)
      node_type = 2
      account = RLP.decode(RLP.decode(nodeRaw)[1])
      prefix_addition = 0
    }

    const node_ = {
        "rows": rows,
        "row_exist": row_exist,
        "node_type": node_type,
        "prefix_addition": prefix_addition
    }

    if (node_type != 2) {
      if (index < nodes_initial_length)
        nodes_initial.push(node_)
      else
        nodes_inner.push(node_)
    }
  }
  console.log("nodes initial")
  console.log(nodes_initial)
  console.log("nodes_inner")
  console.log(nodes_inner)
  console.log("roots")
  console.log(roots)
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