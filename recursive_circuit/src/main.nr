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

fn verify_balance(
    account: mpt_leaf::Account,
    balance_target: [u8; 32],
    balance_target_length: u8
    ) {

    // balance target
    let mut result: u8 = 0;
    if account.balance_length < balance_target_length {
        result = 1;
    } else if account.balance_length > balance_target_length {
        result = 2;
    } else {
        for i in 0 .. 32 {
            if result == 0 {
                if account.balance[i] < balance_target[i] {
                    result = 1;
                } else if account.balance[i] > balance_target[i] {
                    result = 2;
                }
            }
        }
    }
    assert(result == 2);
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
    let mut trie_key: [u8; 32] = [0; 32];
    let mut leaf_hash: [u8; 32] = [0; 32];

    for i in 0 .. 32 {
        trie_key[i] = public_inputs[i + 32] as u8;
    }

    for i in 0 .. 32 {
        assert(public_inputs[i] == root[i] as Field);
    }

    assert(public_inputs[64] == trie_key_index as Field);

    for i in 0 .. 32 {
        leaf_hash[i] = public_inputs[i + 65] as u8;
    }

    for i in 0 .. HONK_VK_SIZE {
        assert(public_inputs[i + 97] == verification_key[i]);
    }
    
    account.verify_leaf_node(
        trie_key_index,
        trie_key,
        leaf_hash
    );

    // balance target
    verify_balance(account, balance_target, balance_target_length);
}
