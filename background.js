import * as ethers from './node_modules/ethers/dist/ethers.min.js';

 chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'MESSAGE_CHECK') {
        // Log message coming from the `request` parameter
        let block_nr = request.payload.lastBlock;
        let newMessages = startListeningForBroadcastMsgEvents(1071, block_nr);
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

async function startListeningForBroadcastMsgEvents(network, block_nr) {
    const url = getProviderUrlForNetwork(network);
    if (!url) {
        console.error(`Invalid network ID: ${network}`);
        return;
    }
    const provider = new ethers.JsonRpcProvider(url);
    let interfaceABI = await fetch(chrome.runtime.getURL('./interfaceABI.json'))
        .then(response => response.json())
        .catch(err => console.error(err));
    const eventsByName = {};

    // loop through all contracts and find the ones that implement the interface
    const accounts = await provider.listAccounts();
    
    const deployedContracts = await Promise.all(
        accounts.map(async (account) => {
            const deployedContracts = await provider.getLogs({
                fromBlock: block_nr,
                toBlock: "latest",
                address: account,
                topics: [ethers.utils.id(interfaceABI)]
            });
    
            return deployedContracts.map((c) => new ethers.Contract(c.address, interfaceABI, provider));
        })
    ).then((deployedContracts) => deployedContracts.flat());

    // listen to the "BroadcastMsg" events in each contract that implements the interface
    deployedContracts.forEach((contract) => {
        if (contract.provider.network.chainId.toString() === network) {
            const broadcastMsgEvent = contract.filters.BroadcastMsg();
            eventsByName[broadcastMsgEvent] = broadcastMsgEvent;
            contract.on(broadcastMsgEvent, (result) => {
                console.log(result);
            });
        }
    });
    console.log(eventsByName);
    return "hi";
}  
