import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import circuit from "./circuit/target/balance_check.json";
import { ethers, SigningKey } from "ethers";
import { ByteBuffer } from "bytebuffer";
import { uint8ArrayToStringArray, fromHex } from "./utils"

const show = (id, content) => {
 const container = document.getElementById(id);
 container.appendChild(document.createTextNode(content));
 container.appendChild(document.createElement("br"));
};

document.getElementById("submit").addEventListener("click", async () => {
 try {
	 // try {
const noir = new Noir(circuit);
const backend = new UltraHonkBackend(circuit.bytecode);
// }
	 //
	 //
	 const user_input = document.getElementById("age").value;
show("logs", "Generating witness... ⏳");
const { witness } = await noir.execute({ user_input });
show("logs", "Generated witness... ✅");

	 show("logs", "Generating proof... ⏳");
const proof = await backend.generateProof(witness);
show("logs", "Generated proof... ✅");
show("results", proof.proof);
  // noir goes here
 } catch {
  show("logs", "Oh 💔");
 }
});

async function main() {
console.log("entered")
// web3 lib instance
// get all accounts
let from;
if (window.ethereum) {
	console.log("have")
	console.log(ethers.providers)
const provider = new ethers.BrowserProvider(window.ethereum)

 from = await provider.send("eth_requestAccounts", [])  // hardhat wallet 0
} else {
	console.log("sag")
}
console.log(from)
  var msg = "salam"
  var signature = await ethereum.request({
      method: "personal_sign",
      params: [msg, from[0]],
    })

  // const signature = await sender.signMessage(message); // get the signature of the message, this will be 130 bytes (concatenated r, s, and v)
let utf8Encode = new TextEncoder();


  console.log("signature 📝: ", signature);
  const msgHash = ethers.keccak256(utf8Encode.encode(msg)) // as specified by ECDSA
let hashed_message = ethers.getBytes(msgHash) // create binary hash
  let pubKey_uncompressed = SigningKey.recoverPublicKey(hashed_message, signature);
  console.log("uncompressed pubkey: ", pubKey_uncompressed);

signature = uint8ArrayToStringArray(fromHex(signature.substring(2, 130)))
  // recoverPublicKey returns `0x{hex"4"}{pubKeyXCoord}{pubKeyYCoord}` - so slice 0x04 to expose just the concatenated x and y
  //    see https://github.com/indutny/elliptic/issues/86 for a non-explanation explanation 😂
  let pubKey = pubKey_uncompressed.slice(4);

  let pub_key_x = uint8ArrayToStringArray(fromHex(pubKey.substring(0, 64)));
  console.log("public key x coordinate 📊: ", pub_key_x);

  let pub_key_y = uint8ArrayToStringArray(fromHex(pubKey.substring(64)));
  console.log("public key y coordinate 📊: ", pub_key_y);
console.log("hashed_message: ", hashed_message)
console.log("signature: ", signature)
const noir = new Noir(circuit);
const backend = new UltraHonkBackend(circuit.bytecode);
show("logs", "Generating witness... ⏳");
hashed_message = uint8ArrayToStringArray(hashed_message)
console.log(hashed_message)
console.log(pub_key_x)
console.log(pub_key_y)
console.log(signature)
const { witness } = await noir.execute({  hashed_message, pub_key_x, pub_key_y, signature });
show("logs", "Generated witness... ✅");

	 show("logs", "Generating proof... ⏳");
const proof = await backend.generateProof(witness);
show("logs", "Generated proof... ✅");
show("results", proof.proof);
}
await main()
