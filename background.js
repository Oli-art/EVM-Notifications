import * as ethers from './node_modules/ethers/dist/ethers.min.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'MESSAGE_CHECK') {
        // Log message coming from the `request` parameter
        let block_nr = request.payload.lastBlock;
        let newMessages = getLatestBroadcastMsgEvents(1071, block_nr);
        console.log(request.payload.lastBlock);
        // Send a response message
        Promise.resolve(newMessages).then(result => sendResponse(result));
        return true;
    }
});

// Array of contract addresses that will be listened to
const contractWhitelist = ["0x3DA9CF0223FE2d41C002b6886A56a71404E1588e"];

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

const BLOCKS_TO_SCAN = 999;

async function getLatestBroadcastMsgEvents(network, block_nr) {
    const {last_block_number} = await chrome.storage.sync.get("last_block_number");
    console.log('last block number ' + last_block_number);
    if (last_block_number) {
        block_nr = last_block_number;
    }
    console.log('current block number ' + block_nr);

    // create a provider for the network selected
    const url = getProviderUrlForNetwork(network);
    if (!url) {
        console.error(`Invalid network ID: ${network}`);
        return;
    }
    const provider = new ethers.JsonRpcProvider(url);

    // find the events
    const BroadcastMsgs = [];
    let abi = await fetch(chrome.runtime.getURL('./interfaceABI.json'))
        .then(response => response.json())
        .catch(err => console.error(err));

    for(let i = 0; i < contractWhitelist.length; i++) {
        const contract = new ethers.Contract(contractWhitelist[i], abi, provider);
        // Get filter for BroadcastMsg events
        const eventFilter = contract.filters.BroadcastMsg(null, null);
        // Get logs for BroadcastMsg events
        const logs = await contract.queryFilter(eventFilter, block_nr, block_nr + BLOCKS_TO_SCAN);

        console.log(logs[0] != undefined);

        if (logs[0] != undefined) {
            // change last block scanned
            chrome.storage.sync.set({"last_block_number": block_nr + BLOCKS_TO_SCAN}, function() {
                console.log('storage set for new last block number' + logs[0].blockNumber);
            });
            // Add logs to BroadcastMsgEvents array
            BroadcastMsgs.push({
                "subject": logs[0].args[1],
                "body": logs[0].args[2]
            });
        }
    }

    return BroadcastMsgs;
}
