let messages = document.getElementById("messages");
let newMessages = "";


function test() {
    newMessages = "Hola, esto es un test"
}

document.getElementById("check_messages").onclick = async () => {
    //await startListeningForBroadcastMsgEvents(1071);
    // Communicate with background file by sending a message
    messages.innerHTML = "Loading...";
    chrome.runtime.sendMessage(
        {
            type: 'MESSAGE_CHECK',
            payload: {
                lastBlock: 0,
            },
        },
        async (response) => {
            messages.innerHTML = (await response);
        }
    );
};
