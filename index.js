
import { Barretenberg, RawBuffer, UltraHonkBackend } from "@aztec/bb.js";
import testCircuit from "./recursive_circuit/target/test.json" ;
import { Noir } from '@noir-lang/noir_js';


const show = (id, content) => {
    const container = document.getElementById(id);
	container.appendChild(document.createTextNode(content));
	container.appendChild(document.createElement("br"));
};
   
document.getElementById("submit").addEventListener("click", async () => {
    const age = document.getElementById("age").value;
    show("logs", "Generating inner circuit verification key... ⏳");
    
    const circuitNoir = new Noir(testCircuit);
        show("logs", "Generating inner circuit verification key1... ⏳");

    const backend = new UltraHonkBackend(testCircuit.bytecode);
        show("logs", "Generating inner circuit verification key2... ⏳");


    // const verificationKey = await testCircuit.getVerificationKey();
    //     show("logs", "Generating inner circuit verification key5... ⏳");

    // const barretenbergAPI = await Barretenberg.new({ threads: 5 });
    //     show("logs", "Generating inner circuit verification key6... ⏳");

    // const vkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(verificationKey))).map(field => field.toString());
    // show("logs", "Generating inner circuit verification key7... ⏳");


    // show("logs", "Generating inner circuit witness... ⏳");
    const input = {
        a: "5",
        b: "2",
        c: "3"
    }
    show("logs", "Generating recursive circuit witness... ⏳ ");
    const { witness } = await circuitNoir.execute(input)
    show("logs", "Generating recursive proof... ⏳ ");
    let proof = await backend.generateProof(witness);
    console.log(proof.proof)
    console.log(proof.publicInputs)

    // Verify recursive proof
    show("logs", "Verifying final proof... ⏳");
    const verified = await backend.verifyProof({ proof: proof.proof, publicInputs: proof.publicInputs });
    show("logs", "Final proof verified: " + verified);
    show("results", proof.proof)

   });


