const $ = (s, r=document) => r.querySelector(s);

function setStateLabel(st) {
    const el = $("#state");
    if (el) el.textContent = st?.enabled ? "目前：啟用" : "目前：停用";
}

chrome.runtime.sendMessage({ type: "QTX_GET_STATE" }, (st) => setStateLabel(st));

$("#toggle")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "QTX_TOGGLE" }, (st) => setStateLabel(st));
});

$("#btnWords")?.addEventListener("click", async () => {
    const url = chrome.runtime.getURL("words.html");
    await chrome.tabs.create({ url });
});
