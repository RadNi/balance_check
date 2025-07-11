mod mpt_leaf;

global HONK_VK_SIZE: u32 = 112;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_IDENTIFIER: u32 = 1;

fn verify_signature(address: [u8; 20], hashed_message : [u8; 32], pub_key_x : [u8; 32], pub_key_y : [u8; 32], signature : [u8; 64]) {
    let key = ecrecover::secp256k1::PubKey::from_xy(pub_key_x, pub_key_y);
    let addr = key.ecrecover(signature, hashed_message);

    let mut sum: Field = 0;
    for i in 0 .. 19 {
        let x = address[i] as Field;
        sum += x;
        sum *= 0x100;
    }
    sum += address[19] as Field;
    assert(addr == sum);
}

// leaf
fn main(
    account: mpt_leaf::Account,
    root: [u8; 32], 

    hashed_message : [u8;32], pub_key_x : [u8;32], pub_key_y : [u8;32], signature : [u8;64],

    balance_target: pub [u8; 32], 
    balance_target_length: pub u8,
    trie_key_index: u8,

    verification_key: pub [Field; HONK_VK_SIZE],
    proof: [Field; HONK_PROOF_SIZE],
    public_inputs: [Field; 97 + HONK_VK_SIZE]
    // root: pub [u8; 32], 
    // trie_key: pub [u8; 32], 
    // trie_key_new_index (new starting index): pub u8, 
    // this_segment_root (new_root): pub [u8; 32]
    // verification_key: pub [Field, 112] -> it must be inner_mpt_body verification key
) {
    verify_signature(account.address, hashed_message, pub_key_x, pub_key_y, signature);
    std::verify_proof_with_type(
        verification_key,
        proof,
        public_inputs,
        0x0,
        HONK_IDENTIFIER,
    );
    
    mpt_leaf::verify_leaf_node(
        account,
        root,
        balance_target,
        balance_target_length,
        trie_key_index,
        verification_key,
        public_inputs
    );
}
