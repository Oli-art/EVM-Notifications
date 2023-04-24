let info = document.getElementById("info");
let newestMessages = document.getElementsByName("newestMessages");
let last_block = document.getElementsByName("last_block");

chrome.runtime.on

const {last_block_number} = await chrome.storage.sync.get("last_block_number");
last_block.innerHTML = "Last block scanned: " + last_block_number;

document.getElementById("check_messages").onclick = async () => {
    //await startListeningForBroadcastMsgEvents(1071);
    // Communicate with background file by sending a message
    info.innerHTML = "Loading...";
    chrome.runtime.sendMessage(
        {
            type: 'MESSAGE_CHECK',
            payload: {
                lastBlock: 730580,
            },
        },
        async (response) => {
            
            const messages = (await response);
            for (i=0; i < messages.length; i++) {
                //console.log("length: " + newestMessages.length());
                console.log(newestMessages);
                newestMessages[2*i].innerHTML = messages[i].subject;
                newestMessages[2*i+1].innerHTML = messages[i].body;
            }
            if (messages[0]) { info.innerHTML = ""; }
            else { info.innerHTML = "No new Messages ):"}
        }
    );
};
