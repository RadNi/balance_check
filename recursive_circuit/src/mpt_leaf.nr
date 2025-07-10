global HONK_VK_SIZE: u32 = 112;

global STORAGE_HASH: [u8; 32] = [86, 232, 31, 23, 27, 204, 85, 166, 255, 131, 69, 230, 146, 192, 248, 110, 91, 72, 224, 27, 153, 108, 173, 192, 1, 98, 47, 181, 227, 99, 180, 33];
global CODE_HASH: [u8; 32] = [197, 210, 70, 1, 134, 247, 35, 60, 146, 126, 125, 178, 220, 199, 3, 192, 229, 0, 182, 83, 202, 130, 39, 59, 123, 250, 216, 4, 93, 133, 164, 112];

pub struct Account {
    nonce: [u8; 8],
    balance: [u8; 32],
    pub address: [u8; 20],
    nonce_length: u8,
    balance_length: u8
}

fn get_rlp_length(first_elem: u8, length: u8) -> u8 {
    let mut rlp_length: u8 = 0;
    // let mut length: u32 = 0;
    // let mut index_found = false;
    // let mut first_elem = 0;
    // for i in 0 .. N {
    //     if !index_found {
    //         if data[i] != 0 {
    //             index_found = true;
    //             length = N - i;
    //             if i + 1 < N {
    //                 first_elem = data[i+1];
    //             }
    //         }
    //     }
    // }
    // TODO assert N <= 55
    if length == 0 {
        rlp_length = 0;
    } else if length == 1 {
        if first_elem <= 127 {
            rlp_length = 1;
        } else {
            rlp_length = 2;
        }
    } else {
        rlp_length = 1 + length;
    }
    rlp_length
}

pub fn verify_leaf_node(
    account: Account,
    root: [u8; 32], 


    balance_target: [u8; 32], 
    balance_target_length: u8,
    trie_key_index: u8,

    verification_key: [Field; HONK_VK_SIZE],
    public_inputs: [Field; 97 + HONK_VK_SIZE]
    // // root: pub [u8; 32], 
    // // trie_key: pub [u8; 32], 
    // // trie_key_new_index (new starting index): pub u8, 
    // // this_segment_root (leaf_hash): pub [u8; 32]


    ){
    let trie_key = keccak256::keccak256(account.address, 20);
    // let mut parent: [u8; 32] = root;
    let mut prefix_length_limb: u8 = trie_key_index;
    
    let mut key: [u8; 33] = [0; 33];

    if prefix_length_limb % 2 == 0 {
        key[0] = 0x20;
    } else {
        let first_elem = trie_key[prefix_length_limb/2];
        prefix_length_limb += 1;
        key[0] = 0x30 + (first_elem - (first_elem >> 4) * 0x10);
    }
    let mut index: u8 = 1;
    for i in 0 .. 32 {
        if i >= prefix_length_limb/2 {
            key[index] = trie_key[i];
            index += 1;
        }
    }

    let key_length = 32 - prefix_length_limb/2 + 1;

    let mut leaf_key_rlp_length= get_rlp_length(key[0], key_length);
    println(f"key rlp len {leaf_key_rlp_length}");

    let mut leaf_rlp_encoded: [u8; 147] = [0; 147];
    let leaf_value_rlp_data_length = 
        get_rlp_length(account.balance[0], account.balance_length)
        + get_rlp_length(account.nonce[0], account.nonce_length) 
        + 33 // code hash
        + 33; // storage hash
    println(f"value rlp len {leaf_value_rlp_data_length}");

    let leaf_rlp_total_length = leaf_key_rlp_length + leaf_value_rlp_data_length + 2 + 2;

    leaf_rlp_encoded[0] = 0xf8;
    leaf_rlp_encoded[1] = leaf_rlp_total_length;
    let mut index: u32 = 2;

    // key
    if (key_length == 1) & (key[0] <= 127 ) {
        leaf_rlp_encoded[index] = key[0];
        index += 1;
    } else {
        leaf_rlp_encoded[index] = 0x80 + key_length;
        index += 1;
        for i in 0 .. 33 {
            if i < key_length {
                leaf_rlp_encoded[index] = key[i];
                index += 1;
            }
        }
    }

    leaf_rlp_encoded[index] = 0xb8;
    index += 1;
    leaf_rlp_encoded[index] = leaf_value_rlp_data_length + 2;
    index += 1;


    leaf_rlp_encoded[index] = 0xf8;
    index += 1;
    leaf_rlp_encoded[index] = leaf_value_rlp_data_length;
    index += 1;

    // nonce
    if account.nonce_length == 0 {
        leaf_rlp_encoded[index] = 0x80;
        index += 1;
    } else if (account.nonce_length == 1) & (account.nonce[0] <= 127 ) {
        leaf_rlp_encoded[index] = account.nonce[0];
        index += 1;
    } else {
        leaf_rlp_encoded[index] = 0x80 + account.nonce_length;
        index += 1;
        for i in 0 .. 8 {
            if i < account.nonce_length {
                leaf_rlp_encoded[index] = account.nonce[i];
                index += 1;
            }
        }
    }

    // balance
    if account.balance_length == 0 {
        leaf_rlp_encoded[index] = 0x80;
        index += 1;
    } else if (account.balance_length == 1) & (account.balance[0] <= 127 ) {
        leaf_rlp_encoded[index] = account.balance[0];
        index += 1;
    } else {
        leaf_rlp_encoded[index] = 0x80 + account.balance_length;
        index += 1;
        for i in 0 .. 32 {
            if i < account.balance_length {
                leaf_rlp_encoded[index] = account.balance[i];
                index += 1;
            }
        }
    }

    // storage hash
    leaf_rlp_encoded[index] = 0xa0;
    index += 1;
    for i in 0 .. 32 {
        leaf_rlp_encoded[index] = STORAGE_HASH[i];
        index += 1;
    }

    // code hash
    leaf_rlp_encoded[index] = 0xa0;
    index += 1;
    for i in 0 .. 32 {
        leaf_rlp_encoded[index] = CODE_HASH[i];
        index += 1;
    }

    let leaf_hash = keccak256::keccak256(leaf_rlp_encoded, index);
    println("encoding:");
    leaf_rlp_encoded.for_eachi(|i, x| {
        if i < index {
            print(f"{x}, ");
        }
    });
    println("");

    println("leaf hash:");
    leaf_hash.for_eachi(|i, x| {
        print(f"{x}, ");
    });
    println("");

    // println("parent:");
    // parent.for_eachi(|i, x| {
    //     print(f"{x}, ");
    // });
    // println("");
    // assert( leaf_hash== parent);

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

    for i in 0 .. 32 {
        assert(public_inputs[i] == root[i] as Field);
    }
    for i in 0 .. 32 {
        assert(public_inputs[i + 32] == trie_key[i] as Field);
    }

    assert(public_inputs[64] == trie_key_index as Field);
    for i in 0 .. 32 {
        assert(public_inputs[i + 65] == leaf_hash[i] as Field);
    }

    for i in 0 .. HONK_VK_SIZE {
        assert(public_inputs[i + 97] == verification_key[i]);
    }

}
