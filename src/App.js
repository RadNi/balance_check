import { Barretenberg, RawBuffer, UltraHonkBackend, deflattenFields } from "@aztec/bb.js";
import mptBodyCircuit from "./target/inner_mpt_body.json";
import mptBodyInitialCircuit from "./target/initial_mpt_body.json";
import balanceCheckCircuit from "./target/leaf_check.json";
import { Noir } from '@noir-lang/noir_js';
import { encodeAccount, getInitialPublicInputs, getInitialPlaceHolderInput, getNodesFromProof, hexStringToStringUint8Array, uint8ArrayToStringArray } from "./utils";
import { ethers, recoverAddress, SigningKey } from "ethers";
import { initial_layer_vk, innner_layer_vk } from "./target/verification_keys";
import { calculateSigRecovery, ecrecover, fromRPCSig, hashPersonalMessage, pubToAddress } from "@ethereumjs/util";

const balance_target = [ 5, 84, 61, 247, 41, 192, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const balance_target_length = 7

let encoded
let account
let trie_key
let nodes_initial
let nodes_inner
let root
let new_roots
let hashed_message 
let pub_key_x
let pub_key_y
let signature 


const show = (content) => {
  console.log(content)
};

show("Generating inner circuit verification key... ⏳");
const mptBodyInitialCircuitNoir = new Noir(mptBodyInitialCircuit);
const mptBodyInitialBackend = new UltraHonkBackend(mptBodyInitialCircuit.bytecode, { threads: 5 }, { recursive: true });
// const mptBodyInitialCircuitVerificationKey = await mptBodyInitialBackend.getVerificationKey();

const mptBodyCircuitNoir = new Noir(mptBodyCircuit);
const mptBodyBackend = new UltraHonkBackend(mptBodyCircuit.bytecode, { threads: 5 }, { recursive: true });
const mptBodyCircuitVerificationKey = await mptBodyBackend.getVerificationKey();

const balanceCheckNoir = new Noir(balanceCheckCircuit);
const balanceCheckBackend = new UltraHonkBackend(balanceCheckCircuit.bytecode, { threads: 5 }, { recursive: true });

const barretenbergAPI = await Barretenberg.new({ threads: 5 });
// const bodyInitialVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyInitialCircuitVerificationKey))).map(field => field.toString());
const bodyVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyCircuitVerificationKey))).map(field => field.toString());
// console.log("initial layer vkAsFields:")
// console.log(bodyInitialVkAsFields)
console.log("inner layers vkAsFields:")
console.log(bodyVkAsFields)
function buf2Bigint(buffer) { // buffer is an ArrayBuffer
  return ethers.formatUnits("0x" + ([...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')))
}

async function sign_message(from) {
  
  var msg = JSON.stringify({
    message: "RadNi is here!",
    balance_target: buf2Bigint((new Uint8Array(balance_target.slice(0, balance_target_length))).buffer).toString()
  }, null, 2)
  signature = await window.ethereum.request({
      method: "personal_sign",
      params: [msg, from],
  })
  // console.log("this")
  // console.log(signature)

  // const signature = await sender.signMessage(message); // get the signature of the message, this will be 130 bytes (concatenated r, s, and v)
  // let utf8Encode = new TextEncoder();
  // console.log("that", extractPublicKey(utf8Encode.encode(msg), signature))

  // const msgHash = ethers.keccak256(utf8Encode.encode(msg)) // as specified by ECDSA
  const msgBuf = Buffer.from(msg)
  const {r, s, v} = fromRPCSig(signature)
  // console.log(r)
  // console.log(s)
  // console.log(calculateSigRecovery(v))
  hashed_message = hashPersonalMessage(msgBuf)

  let pk = ecrecover(hashed_message, calculateSigRecovery(v), r, s, 1n)
  console.log("Adreeesss")
  console.log(pubToAddress(pk))
  console.log("Public key")
  console.log(pk)

  pub_key_x = []
  pk.slice(0, 32).forEach(x => {
    pub_key_x.push("" + x)
  });
  pub_key_y= []
  pk.slice(32).forEach(y => {
    pub_key_y.push("" + y)
  });
  // pk.slice(0, 32)
  // pub_key_y = pk.slice(32)
  // hashed_message = ethers.getBytes(msgHash) // create binary hash
  // console.log("binary")
  // console.log(hashed_message)

  // console.log(recoverAddress(msgHash, signature))
  // let pubKey_uncompressed = SigningKey.recoverPublicKey(hashed_message, signature);
  // console.log("uncompressed pubkey: ", pubKey_uncompressed);

  // console.log("sag")
  // console.log(Uint8Array.from(Buffer.from(signature.substring(2, 130), 'hex')))
  signature = hexStringToStringUint8Array(signature.substring(2, 130))
  // recoverPublicKey returns `0x{hex"4"}{pubKeyXCoord}{pubKeyYCoord}` - so slice 0x04 to expose just the concatenated x and y
  //    see https://github.com/indutny/elliptic/issues/86 for a non-explanation explanation 😂
  // let pubKey = pubKey_uncompressed.slice(4);

  // console.log("public key x coordinate 📊: ", pubKey);
  // pub_key_x = uint8ArrayToStringArray(fromHex(pubKey.substring(0, 64)));
  // pub_key_y = uint8ArrayToStringArray(fromHex(pubKey.substring(64)));
  // console.log("hashed", hashed_message)
  hashed_message = uint8ArrayToStringArray(hashed_message)

  console.log("public key x coordinate 📊: ", pub_key_x);
  console.log("public key y coordinate 📊: ", pub_key_y);
  console.log("hashed_message: ", hashed_message)
  console.log("signature: ", signature)
}


async function you() {
  
    let recursiveProof;
    let input;


    // initial layer
    const initial_nodes_length = nodes_initial.length
    let new_index = 0
    nodes_initial.map(e => new_index += e.prefix_addition)
    input = {
      nodes: nodes_initial,
      node_length: initial_nodes_length,
      trie_key_new_index: new_index,
      root: root,
      trie_key: trie_key,
      new_root: new_roots[initial_nodes_length - 1],
      public_inputs: getInitialPublicInputs(trie_key, root),
      placeholder: getInitialPlaceHolderInput()
    }
    show("Generating initial circuit witness... ⏳ ");
    console.log(input)
    const initial_witness = await mptBodyInitialCircuitNoir.execute(input)
    show("Generating initial proof... ⏳ ");
    const initial_proof = await mptBodyInitialBackend.generateProof(initial_witness.witness);
    show("Verifying initial proof... ⏳");
    const initial_verified = await mptBodyInitialBackend.verifyProof({ proof: initial_proof.proof, publicInputs: initial_proof.publicInputs });
    show("Initial proof verified: " + initial_verified);
    recursiveProof = {proof: deflattenFields(initial_proof.proof), publicInputs: initial_proof.publicInputs}

    show("Generating inner circuit witness... ⏳");
    console.log("new roots inja ", nodes_inner.length)
    
    for (let i = 0; i < nodes_inner.length; i++) {
        console.log(i + initial_nodes_length)
        console.log(new_roots[i + initial_nodes_length])
    }
    
    for (let i = 0; i < nodes_inner.length; i++) {
        new_index += nodes_inner[i].prefix_addition
        input = {
          nodes: [nodes_inner[i]],
          node_length: 1,
          trie_key_new_index: new_index,
          root: root,
          trie_key: trie_key,
          new_root: new_roots[i + initial_nodes_length],
          proof: recursiveProof.proof,
          public_inputs: recursiveProof.publicInputs,
          verification_key: innner_layer_vk,
          is_first_inner_layer: 0
        }
        if (i == 0) {
          // second layer
          input.is_first_inner_layer = 1
          show("Generating recursive circuit witness... ⏳ " + i);
          console.log(input)
          const { witness } = await mptBodyCircuitNoir.execute(input)
          show("Generating recursive proof... ⏳ " + i);
          const {proof, publicInputs} = await mptBodyBackend.generateProof(witness);
          show("Verifying intermediary proof... ⏳");
          const verified = await mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
          show("Intermediary proof verified: " + verified);
          recursiveProof = {proof: deflattenFields(proof), publicInputs}
        } else {
          // rest of the layers
          input.is_first_inner_layer = 0
          show("Generating recursive circuit witness... ⏳ " + i);
          console.log(input)
          const { witness } = await mptBodyCircuitNoir.execute(input)
          show("Generating recursive proof... ⏳ " + i);
          const {proof, publicInputs} = await mptBodyBackend.generateProof(witness);
          show("Verifying intermediary proof... ⏳");
          console.log(proof)
          console.log(publicInputs)
          const verified = await mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
          show("Intermediary proof verified: " + verified);
          recursiveProof = {proof: deflattenFields(proof), publicInputs}
        }
    }
    console.log(recursiveProof.proof)
    console.log(recursiveProof.publicInputs)



    let balanceCheckInput = {
        account: account,
        root: root,
        leaf_hash_: new_roots[new_roots.length - 1],
        
        balance_target: balance_target,
        balance_target_length: balance_target_length,
        proof: recursiveProof.proof,
        trie_key_index: nodes_initial.length + nodes_inner.length + "",
        hashed_message: hashed_message,
        pub_key_x: pub_key_x,
        pub_key_y: pub_key_y,
        signature: signature,
        public_inputs: recursiveProof.publicInputs
    }
    console.log(balanceCheckInput)
    const { witness } = await balanceCheckNoir.execute(balanceCheckInput)
    const finalProof = await balanceCheckBackend.generateProof(witness, {keccakZK: true});


    // Verify recursive proof
    show("Verifying final proof... ⏳");
    const verified = await balanceCheckBackend.verifyProof({ proof: finalProof.proof, publicInputs: finalProof.publicInputs }, {keccakZK: true});
    show("Final proof verified: " + verified);
    show(finalProof.proof)
}

async function me() {
  


    show("logs", "Connecting to metamask... ⏳");


    let from;
    if (window.ethereum) {
      const mmProvider = new ethers.BrowserProvider(window.ethereum)

      from = (await mmProvider.send("eth_requestAccounts", []))[0]
      console.log(from)
      await sign_message(from)

      const provider = new ethers.JsonRpcProvider("https://docs-demo.quiknode.pro/")
      let address = from
      let output = await provider.send("eth_getProof", [address, [], "latest"])
      console.log(output)
      encoded = getNodesFromProof(output.accountProof)
      let x = encodeAccount(encoded.account, address)
      account = x.account
      trie_key = x.trie_key
      nodes_initial = encoded.nodes_initial
      nodes_inner = encoded.nodes_inner
      root = encoded.roots[0]
      new_roots = encoded.roots.slice(1)
      console.log(nodes_initial)
      console.log(nodes_inner)
      console.log(new_roots)
      console.log(account)
      console.log(root)
        
        // const provider = new ethers.BrowserProvider(window.ethereum)
    
    //  from = await provider.send("eth_requestAccounts", [])  // hardhat wallet 0
    //  console.log(from)
   } else {
        console.log("sag")
    }




}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        hi
      </header>

        <button type="button"
          onClick={() => me() }
        > Press me once </button>

        <button type="button"
          onClick={() => you() }
        > Press me as many times as you want </button>
    </div>
  );
}

export default App;
