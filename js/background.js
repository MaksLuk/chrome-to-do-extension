(async () => {
    let data = await chrome.storage.local.get(['data']).then((result) => { return result.data; });
    let count = 0;
    for (let page of data) {
        for (let task of page['tasks']) {
            if (!task.completed) count += 1;
        }
    }
    chrome.action.setBadgeText({text: ''+count});
})();