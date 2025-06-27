global MAX_PATH_LEANTH: u32 = 3;

global HONK_VK_SIZE: u32 = 128;
global HONK_PROOF_SIZE: u32 = 459;
global HONK_IDENTIFIER: u32 = 1;

struct Node {
    rows: [[u8; 32]; 16],
    row_exist: [bool; 16],
    node_type: u8
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
    nodes: [Node; MAX_PATH_LEANTH], 
    node_length: u32,
    // trie_key: pub [u8; 32],
    new_root: pub [u8; 32], 
    trie_key_new_index: u8,


    verification_key: [Field; HONK_VK_SIZE],
    proof: [Field; HONK_PROOF_SIZE],
    public_inputs: pub [Field; 97]
    // root_root: pub [u8; 32], 
    // trie_key: pub [u8; 32], 
    // trie_key_new_index: pub u8, 
    // this_segment_root: pub [u8; 32]


    ) {
        std::verify_proof_with_type(
            verification_key,
            proof,
            public_inputs,
            0x0,
            HONK_IDENTIFIER,
        );
        let root_index_in_inputs = 0;
        let trie_key_index_in_inputs = 32;
        let trie_key_initial_limb_index: u8 = public_inputs[64] as u8;
        let this_segment_root_index_in_inputs = 65;
        // assert(trie_key_new_index == 3);
        // println(f"key index: {trie_key_index_in_inputs}");
        let mut parent: [u8; 32] = [0; 32];
        let mut prefix_length_limb: u8 = trie_key_initial_limb_index;
        for i in 0 .. MAX_PATH_LEANTH {
            if (i < node_length) {
                if nodes[i].node_type == 0 { // branch node
                    let h = calculate_branch_hash(nodes[i]);
                    if i == 0 {
                        h.for_eachi(|i, x| {
                            assert(x == (public_inputs[this_segment_root_index_in_inputs + i] as u8));
                        });
                    } else {
                        assert(h == parent);
                    }
                    let prefix_length_byte: u8 = prefix_length_limb/2;
                    let mut index = public_inputs[trie_key_index_in_inputs + prefix_length_byte] as u8;
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
        assert(trie_key_new_index == prefix_length_limb);
        assert(new_root == parent);
}
