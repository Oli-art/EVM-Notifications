import * as ethers from './node_modules/ethers/dist/ethers.min.js';

/////////////////////// INPUTS ///////////////////////
const contractWhitelist = ["0x3DA9CF0223FE2d41C002b6886A56a71404E1588e"]; // Array of contract addresses that will be listened to
const BLOCKS_TO_SCAN = 999; // Number of blocks to scan starting from the latest block scanned the last time


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'MESSAGE_CHECK') {
        // Log message coming from the `request` parameter
        let minBlock = request.payload.minBlock;
        let newMessages = getLatestBroadcastMsgEvents(1071, minBlock);
        // Send a response message
        Promise.resolve(newMessages).then(result => sendResponse(result));
        return true;
    }
    else if (request.type === 'LAST_BLOCK') {
        let response = chrome.storage.sync.get("last_block_scanned");
        Promise.resolve(response).then(result => sendResponse(result));
        return true;
    }
});

function getProviderUrlForNetwork(network) {
    switch (network) {
        case "1": // Ethereum Mainnet
        return "https://eth.llamarpc.com";
        case "3": // Ropsten Testnet
        return "https://rpc.ankr.com/eth_ropsten";
        case "4": // Rinkeby Testnet
        return "https://rpc.ankr.com/eth_rinkeby";
        case "1071": // Kovan Testnet
        return "https://json-rpc.evm.testnet.shimmer.network";
        default:
        return "https://json-rpc.evm.testnet.shimmer.network";
    }
}

async function getLatestBroadcastMsgEvents(network, block_nr) {
    // get the block number to later start the scan from and store it in "block_nr"
    const {last_block_scanned} = await chrome.storage.sync.get("last_block_scanned");
    if (last_block_scanned && last_block_scanned > block_nr) {
        block_nr = last_block_scanned;
    }

    // create a provider for the network selected
    const url = getProviderUrlForNetwork(network);
    if (!url) {
        console.error(`Invalid network ID: ${network}`);
        return;
    }
    const provider = new ethers.JsonRpcProvider(url);

    // calculate how many blocks to scan. Maximum is "BLOCKS_TO_SCAN" but will be lower if there are no more blocks.
    const provider_block = await provider.getBlockNumber();
    let blocks_to_scan = BLOCKS_TO_SCAN; // default
    if (provider_block - block_nr < BLOCKS_TO_SCAN) { // if there are less blocks left than "BLOCKS_TO_SCAN", change it.
        blocks_to_scan = provider_block - block_nr
    }

    // find the events
    const BroadcastMsgs = [];
    let abi = await fetch(chrome.runtime.getURL('./interfaceABI.json'))
        .then(response => response.json())
        .catch(err => console.error(err));

    for(let i = 0; i < contractWhitelist.length; i++) {
        // Define the contract to scan for
        const contract = new ethers.Contract(contractWhitelist[i], abi, provider);

        // Get filter for BroadcastMsg events
        const eventFilter = contract.filters.BroadcastMsg(null, null);

        // Get logs for BroadcastMsg events
        const logs = await contract.queryFilter(eventFilter, block_nr, block_nr + blocks_to_scan);

        if (logs[0] != undefined) {
            // Add logs to BroadcastMsgEvents array
            BroadcastMsgs.push({
                "subject": logs[0].args[1],
                "body": logs[0].args[2]
            });
        } 

        // change last block scanned
        const new_block_nr = block_nr + blocks_to_scan;
        chrome.storage.sync.set({"last_block_scanned": new_block_nr}, function() {
            console.log('storage set for new last block number: ' + new_block_nr);
        });
        
    }

    return BroadcastMsgs;
}
