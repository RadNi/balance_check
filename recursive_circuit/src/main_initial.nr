use mpt::mpt_body;

global MAX_PATH_LEANGTH: u32 = 3;

// initial layer
fn main(
    nodes: [mpt_body::Node; MAX_PATH_LEANGTH], 
    node_length: u32,


    root: pub [u8; 32],
    trie_key: pub [u8; 32],
    trie_key_new_index: pub u32,
    new_root: pub [u8; 32],
    // placeholder for inner layers vk
    placeholder: pub [Field; 112],

    public_inputs: [Field; 209]
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

    mpt_body::verify_nodes(
        nodes, 
        node_length, 
        root, 
        trie_key, 
        trie_key_new_index, 
        new_root, 
        public_inputs);
}
