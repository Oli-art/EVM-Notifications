let info = document.getElementById("info");
let newestMessages = document.getElementsByName("newestMessages");
let last_block = document.getElementById("last_block");

function updateLastBlock() {
    chrome.runtime.sendMessage(
        {
            type: 'LAST_BLOCK',
            payload: {},
        },
        async (response) => {
            const last_block_scanned = (await response).last_block_scanned;
            console.log(last_block_scanned);
            last_block.innerHTML = "Last block scanned: " + last_block_scanned;
        }
    );
}

updateLastBlock();

document.getElementById("check_messages").onclick = async () => {
    //await startListeningForBroadcastMsgEvents(1071);
    // Communicate with background file by sending a message
    info.innerHTML = "Loading...";
    chrome.runtime.sendMessage(
        {
            type: 'MESSAGE_CHECK',
            payload: {
                minBlock: 761437,
            },
        },
        async (response) => {
            const messages = await response;
            for (i=0; i < messages.length; i++) {
                console.log(newestMessages);
                newestMessages[2*i].innerHTML = messages[i].subject;
                newestMessages[2*i+1].innerHTML = messages[i].body;
            }
            if (messages[0]) { info.innerHTML = ""; }
            else { info.innerHTML = "No new Messages ):"}
            updateLastBlock();
        }
    );
};
