global MAX_PATH_LEANGTH: u32 = 9;

global HONK_VK_SIZE: u32 = 128;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_IDENTIFIER: u32 = 1;

struct Node {
    rows: [[u8; 32]; 16],
    row_exist: [bool; 16],
    node_type: u8
}

fn calculate_extension_hash(node: Node) -> [u8; 32] {
    
    // rows: [
    //     [first_limb, second_limb, key_length (other than first byte), ..0]
    //     [right_padded_key (other than first byte)],
    //     [value],
    //     0..0
    // ]
    
    let mut encoded: [u8; 68] = [0; 68];
    let mut encoding_index = 0;
    let first_limb = node.rows[0][0];
    let second_limb = node.rows[0][1];
    let key_total_length = node.rows[0][2] + 1;
    let mut rlp_data_length: u8 = 0;
    if key_total_length != 1 {
        rlp_data_length = 
            1 + // key_rlp_prefix
            key_total_length + // key
            1 + // valye_rlp_prefix
            32;// value
    } else {
        rlp_data_length = 
            key_total_length + // key
            1 + // valye_rlp_prefix
            32;// value
    }
    if rlp_data_length > 55 {
        encoded[encoding_index] = 0xF8;
        encoding_index += 1;
        encoded[encoding_index] = rlp_data_length;
        encoding_index += 1;
    } else {
        encoded[encoding_index] = 0xC0 + rlp_data_length;
        encoding_index += 1;
    }
    if key_total_length != 1 {
        encoded[encoding_index] = 0x80 + key_total_length;
        encoding_index += 1;
    }
    encoded[encoding_index] = first_limb * 0x10 + second_limb;
    encoding_index += 1;
    for i in 0 .. 31 {
        if i + 1 <= key_total_length - 1 {
            encoded[encoding_index] = node.rows[1][i];
            encoding_index += 1;
        }
    }
    encoded[encoding_index] = 0xA0;
    encoding_index += 1;
    for i in 0 .. 32 {
        encoded[encoding_index] = node.rows[2][i];
        encoding_index += 1;
    }
    keccak256::keccak256(encoded, encoding_index)
}

fn calculate_branch_hash(node: Node) -> [u8; 32] {
    let mut len1: u8 = 0;
    let mut len2: u8 = 0;
    let mut encoded: [u8; 532] = [0; 532];
    let mut index: u32 = 0;
    for i in 0 .. 16 {
        if node.row_exist[i] == true {
            if len2 > 255 - 33 {
                len1 += 1;
                len2 = len2 - 223;
            } else {
                len2 += 33;
            }
        } else {
            if len2 == 255 {
                len2 = 0;
                len1 += 1;
            } else {
                len2 += 1;
            }
        }
    }
    if len2 == 255 {
        len2 = 0;
        len1 += 1;
    } else {
        len2 += 1;
    }
    if (len1 == 0) & (len2 <= 55) {
        encoded[index] = 0xc0 + len2;
        index += 1;
    } else if len1 == 0 {
        encoded[index] = 0xf8;
        index += 1;
        encoded[index] = len2;
        index += 1;
    } else {
        encoded[index] = 0xf9;
        index += 1;
        encoded[index] = len1;
        index += 1;
        encoded[index] = len2;
        index += 1;
    }

    for i in 0 .. 16 {
        if node.row_exist[i] == true {
            encoded[index] = 0xa0;
            index += 1;
            for j in 0 .. 32 {
                encoded[index] = node.rows[i][j];
                index += 1;
            }
        } else {
            encoded[index] = 0x80;
            index += 1;
        }
    }
    encoded[index] = 0x80;
    index += 1;
    keccak256::keccak256(encoded, index)

}

fn main(
    nodes: [Node; MAX_PATH_LEANGTH], 
    node_length: u32,


    root: pub [u8; 32],
    trie_key: pub [u8; 32],
    trie_key_new_index: pub u32,
    new_root: pub [u8; 32],

    is_initial_proof: bool,
    // verification_key: [Field; HONK_VK_SIZE],
    // proof: [Field; HONK_PROOF_SIZE],
    // public_inputs: [Field; 97]
    // root: pub [u8; 32], 
    // trie_key: pub [u8; 32], 
    // trie_key_new_index (new starting index): pub u8, 
    // this_segment_root (new_root): pub [u8; 32]


    ) {
        // if !is_initial_proof{
        //     std::verify_proof_with_type(
        //         verification_key,
        //         proof,
        //         public_inputs,
        //         0x0,
        //         HONK_IDENTIFIER,
        //     );
        // }
        // let root_index_in_inputs = 0;
        // let trie_key_index_in_inputs: u32 = 32;
        // let trie_key_initial_limb_index = public_inputs[64] as u32;
        // let this_segment_root_index_in_inputs = 65;


        // root.for_eachi(|i, x| {
        //     assert(x == public_inputs[i + root_index_in_inputs] as u8);
        // });

        // trie_key.for_eachi(|i, x| {
        //     assert(x == public_inputs[i + trie_key_index_in_inputs] as u8);
        // });
        // if is_initial_proof{
        //     root.for_eachi(|i, x| {
        //         assert(x == public_inputs[i + this_segment_root_index_in_inputs] as u8);
        //     });
        //     assert(public_inputs[trie_key_index_in_inputs] == 0);
        // }

        // assert(trie_key_new_index == 3);
        // println(f"key index: {trie_key_index_in_inputs}");
        let mut parent: [u8; 32] = [0; 32];
        let mut prefix_length_limb: u32 = 0;
        for i in 0 .. MAX_PATH_LEANGTH {
            if (i < node_length) {
                if nodes[i].node_type == 0 { // branch node
                    let h = calculate_branch_hash(nodes[i]);
                    if i == 0 {
                        h.for_eachi(|i, x| {
                            assert(x == (root[i] as u8));
                        });
                    } else {

                        println("parent: ");
                        parent.for_each(|x| {
                            print(f"{x}, ");
                        });
                        println(f"");
                        assert(h == parent);
                    }
                    let prefix_length_byte: u32 = prefix_length_limb/2;
                    let mut index = trie_key[prefix_length_byte] as u32;
                    if prefix_length_limb % 2 == 0 {
                        index = index >> 4;
                    } else {
                        index = index - (index >> 4) * 0x10;
                    }
                    parent = nodes[i].rows[index];
                    prefix_length_limb += 1;
                    h.for_each(|x| {
                        print(f"{x}, ");
                    });
                    println("");
                } else if nodes[i].node_type == 1 {
                    // TODO extension nodes
                    println("extension node:");
                    let h = calculate_extension_hash(nodes[i]);
                    if i == 0 {
                        h.for_eachi(|i, x| {
                            assert(x == (root[i] as u8));
                        });
                    } else {

                        println("parent: ");
                        parent.for_each(|x| {
                            print(f"{x}, ");
                        });
                        println(f"");
                        assert(h == parent);
                    }
                    parent = nodes[i].rows[2];
                    // assert(false);
                } else {
                    assert(false);
                }
            }
        }
        println("new root:");
        parent.for_each(|x| {
            print(f"{x}, ");
        });
        println("");
        // assert(trie_key_new_index == prefix_length_limb);
        assert(new_root == parent);
}
