// background.js

// Allow users to open the side panel by clicking the action icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
    console.log("LeetCode AI Helper Installed");
    chrome.sidePanel.setOptions({
        path: 'popup.html',
        enabled: true
    });
});
