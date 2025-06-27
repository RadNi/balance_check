use keccak256;

fn main(hash_input: u8, pub_key_x: [u8; 32], pub_key_y: [u8; 32], signature: [u8; 64]) {
for i in 0..32 {
    println(pub_key_x[i]);
}
   let inputs = [0, 62, hash_input];
   let h = keccak256::keccak256(inputs, 3);
   let expected_output = [80, 233, 83, 85, 15, 105, 46, 77, 232, 146, 250, 33, 116, 163, 15, 224, 75, 195, 206, 177, 44, 23, 250, 48, 200, 47, 50, 154, 108, 210, 86, 138];
// let valid_signature = std::ecdsa_secp256k1::verify_signature(pub_key_x, pub_key_y, signature, inputs);
     // assert(valid_signature);
for i in 0..32 {
    println(h[i]);
    assert(h[i] == expected_output[i]);
}
}
