import { Barretenberg, RawBuffer, UltraHonkBackend, deflattenFields } from "@aztec/bb.js";
import mptBodyCircuit from "./target/rest_mpt_body.json";
import mptBodyInitialCircuit from "./target/initial_mpt_body.json";
import balanceCheckCircuit from "./target/leaf_check.json";
import { Noir } from '@noir-lang/noir_js';
import { ethers } from "ethers";
import { encodeAccount, getInitialPublicInputs, getNodesFromProof } from "./utils";

let encoded
let account
let trie_key
let nodes
let root
let new_roots
let initial_public_inputs


const show = (id, content) => {
  console.log(id + " " + content)
};

show("logs", "Generating inner circuit verification key... ⏳");
const mptBodyInitialCircuitNoir = new Noir(mptBodyInitialCircuit);
const mptBodyInitialBackend = new UltraHonkBackend(mptBodyInitialCircuit.bytecode, { threads: 5 }, { recursive: true });
const mptBodyInitialCircuitVerificationKey = await mptBodyInitialBackend.getVerificationKey();

const mptBodyCircuitNoir = new Noir(mptBodyCircuit);
const mptBodyBackend = new UltraHonkBackend(mptBodyCircuit.bytecode, { threads: 5 }, { recursive: true });
const mptBodyCircuitVerificationKey = await mptBodyBackend.getVerificationKey();

const balanceCheckNoir = new Noir(balanceCheckCircuit);
const balanceCheckBackend = new UltraHonkBackend(balanceCheckCircuit.bytecode, { threads: 5 }, { recursive: true });

const barretenbergAPI = await Barretenberg.new({ threads: 5 });
const bodyInitialVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyInitialCircuitVerificationKey))).map(field => field.toString());
const bodyVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyCircuitVerificationKey))).map(field => field.toString());




async function you() {
  
    let recursiveProof;
    let input;



    // show("logs", "Generating inner circuit witness... ⏳");
    for (let i = 0; i < nodes.length; i++) {
        input = {
            nodes: [nodes[i]],
            node_length: "1",
            trie_key_new_index: ""+(i + 1),
            root: root,
            trie_key: trie_key,
            new_root: new_roots[i],
        }
        if ( i == 0 ) {
          // initial layer
            show("logs", "Generating recursive circuit witness... ⏳ " + i);
            input.public_inputs = initial_public_inputs
            console.log(input)
            const { witness } = await mptBodyInitialCircuitNoir.execute(input)
            show("logs", "Generating recursive proof... ⏳ " + i);
            const {proof, publicInputs} = await mptBodyInitialBackend.generateProof(witness);
            show("logs", "Verifying intermediary proof... ⏳");
            const verified = await mptBodyInitialBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
            show("logs", "Intermediary proof verified: " + verified);
            recursiveProof = {proof: deflattenFields(proof), publicInputs}
        } else {
            input.proof = recursiveProof.proof
            input.public_inputs = recursiveProof.publicInputs
            if (i == 1) {
              // second layer
              input.verification_key = bodyInitialVkAsFields
              show("logs", "Generating recursive circuit witness... ⏳ " + i);
              console.log(input)
              const { witness } = await mptBodyCircuitNoir.execute(input)
              show("logs", "Generating recursive proof... ⏳ " + i);
              const {proof, publicInputs} = await mptBodyBackend.generateProof(witness);
              show("logs", "Verifying intermediary proof... ⏳");
              const verified = await mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
              show("logs", "Intermediary proof verified: " + verified);
              recursiveProof = {proof: deflattenFields(proof), publicInputs}
          } else {
              // rest of the layers
              input.verification_key = bodyVkAsFields
              show("logs", "Generating recursive circuit witness... ⏳ " + i);
              console.log(input)
              const { witness } = await mptBodyCircuitNoir.execute(input)
              show("logs", "Generating recursive proof... ⏳ " + i);
              const {proof, publicInputs} = await mptBodyBackend.generateProof(witness);
              show("logs", "Verifying intermediary proof... ⏳");
              const verified = await mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
              show("logs", "Intermediary proof verified: " + verified);
              recursiveProof = {proof: deflattenFields(proof), publicInputs}
          }
        }
    }
    console.log(recursiveProof.proof)
    console.log(recursiveProof.publicInputs)




    let balanceCheckInput = {
        account: account,
        root: root,
        leaf_hash_: new_roots[new_roots.length - 1],
        
        balance_target: ["20", "85", "194", "64", "213", "170", "64", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        balance_target_length: "7",
        proof: recursiveProof.proof,
        trie_key_index: nodes.length + "",
        verification_key: bodyVkAsFields,
    }
    console.log(balanceCheckInput)
    const { witness } = await balanceCheckNoir.execute(balanceCheckInput)
    const finalProof = await balanceCheckBackend.generateProof(witness, {keccakZK: true});


    // Verify recursive proof
    show("logs", "Verifying final proof... ⏳");
    const verified = await balanceCheckBackend.verifyProof({ proof: finalProof.proof, publicInputs: finalProof.publicInputs }, {keccakZK: true});
    show("logs", "Final proof verified: " + verified);
    show("results", finalProof.proof)
}

async function me() {
  


    show("logs", "Connecting to metamask... ⏳");


    let from;
    if (window.ethereum) {
        const provider = new ethers.JsonRpcProvider("https://docs-demo.quiknode.pro/")
        let address = "0xC786694997E70439d16B63f8E0Ef9D7358f2C19d"
        let output = await provider.send("eth_getProof", [address, [], "latest"])
        console.log(output)
        encoded = getNodesFromProof(output.accountProof)
        let x = encodeAccount(output, address)
        account = x.account
        trie_key = x.trie_key
        nodes = encoded.nodes
        root = encoded.roots[0]
        new_roots = encoded.roots.slice(1)
        initial_public_inputs = getInitialPublicInputs(trie_key, root)
        console.log(nodes)
        console.log(account)
        console.log(new_roots)
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
