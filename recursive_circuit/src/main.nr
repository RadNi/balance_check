mod main_mpt_body;
global MAX_PATH_LEANGTH: u32 = 3;

global HONK_VK_SIZE: u32 = 112;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_IDENTIFIER: u32 = 1;




// initial layer
fn main(
    nodes: [main_mpt_body::Node; MAX_PATH_LEANGTH], 
    node_length: u32,


    root: pub [u8; 32],
    trie_key: pub [u8; 32],
    trie_key_new_index: pub u32,
    new_root: pub [u8; 32],

    public_inputs: [Field; 97]
    // root: pub [u8; 32], 
    // trie_key: pub [u8; 32], 
    // trie_key_new_index (new starting index): pub u8, 
    // this_segment_root (new_root): pub [u8; 32]


    ) {
        let this_segment_root_index_in_inputs = 65;
        let trie_key_initial_limb_index = public_inputs[64] as u32;

        assert(trie_key_initial_limb_index == 0);

        root.for_eachi(|i, x| {
            assert(x == public_inputs[i + this_segment_root_index_in_inputs] as u8);
        });

        main_mpt_body::_base(
            nodes, 
            node_length, 
            root, 
            trie_key, 
            trie_key_new_index, 
            new_root, 
            public_inputs);
}


// rest of the layers
// fn main(
//     nodes: [main_mpt_body::Node; MAX_PATH_LEANGTH], 
//     node_length: u32,


//     root: pub [u8; 32],
//     trie_key: pub [u8; 32],
//     trie_key_new_index: pub u32,
//     new_root: pub [u8; 32],

//     verification_key: [Field; HONK_VK_SIZE],
//     proof: [Field; HONK_PROOF_SIZE],
//     public_inputs: [Field; 97]
//     // root: pub [u8; 32], 
//     // trie_key: pub [u8; 32], 
//     // trie_key_new_index (new starting index): pub u8, 
//     // this_segment_root (new_root): pub [u8; 32]


//     ) {
//         std::verify_proof_with_type(
//             verification_key,
//             proof,
//             public_inputs,
//             0x0,
//             HONK_IDENTIFIER,
//         );

//         main_mpt_body::_base(
//             nodes, 
//             node_length, 
//             root, 
//             trie_key, 
//             trie_key_new_index, 
//             new_root,
//             public_inputs);
// }




// fn main(
//     nodes: [Node; MAX_PATH_LEANGTH], 
//     node_length: u32,


//     root: pub [u8; 32],
//     trie_key: pub [u8; 32],
//     trie_key_new_index: pub u32,
//     new_root: pub [u8; 32],

//     public_inputs: [Field; 97]
//     // root: pub [u8; 32], 
//     // trie_key: pub [u8; 32], 
//     // trie_key_new_index (new starting index): pub u8, 
//     // this_segment_root (new_root): pub [u8; 32]


//     ) {
//         let root_index_in_inputs = 0;
//         let trie_key_index_in_inputs: u32 = 32;
//         let trie_key_initial_limb_index = public_inputs[64] as u32;
//         let this_segment_root_index_in_inputs = 65;


//         root.for_eachi(|i, x| {
//             assert(x == public_inputs[i + root_index_in_inputs] as u8);
//         });

//         trie_key.for_eachi(|i, x| {
//             assert(x == public_inputs[i + trie_key_index_in_inputs] as u8);
//         });

//         root.for_eachi(|i, x| {
//             assert(x == public_inputs[i + this_segment_root_index_in_inputs] as u8);
//         });
//             // assert(trie_key_initial_limb_index == 0);

//         // assert(trie_key_new_index == 3);
//         // println(f"key index: {trie_key_index_in_inputs}");
//         let mut parent: [u8; 32] = [0; 32];
//         let mut prefix_length_limb: u32 = trie_key_initial_limb_index;
//         for i in 0 .. MAX_PATH_LEANGTH {
//             if (i < node_length) {
//                 if nodes[i].node_type == 0 { // branch node
//                     let h = calculate_branch_hash(nodes[i]);
//                     if i == 0 {
//                         h.for_eachi(|i, x| {
//                             assert(x == (public_inputs[this_segment_root_index_in_inputs + i] as u8));
//                         });
//                     } else {

//                         println("h: ");
//                         h.for_each(|x| {
//                             print(f"{x}, ");
//                         });
//                         println(f"");
//                         assert(h == parent);
//                     }
//                     let prefix_length_byte: u32 = prefix_length_limb/2;
//                     let mut index = public_inputs[trie_key_index_in_inputs + prefix_length_byte] as u32;
//                     if prefix_length_limb % 2 == 0 {
//                         index = index >> 4;
//                     } else {
//                         index = index - (index >> 4) * 0x10;
//                     }
//                     parent = nodes[i].rows[index];
//                     prefix_length_limb += 1;
//                     h.for_each(|x| {
//                         print(f"{x}, ");
//                     });
//                     println("");
//                 } else if nodes[i].node_type == 1 {
//                     // TODO extension nodes
//                     assert(false);
//                 } else {
//                     assert(false);
//                 }
//             }
//         }
//         println("new root:");
//         parent.for_each(|x| {
//             print(f"{x}, ");
//         });
//         println("");
//         assert(trie_key_new_index == prefix_length_limb);
//         assert(new_root == parent);
// }
