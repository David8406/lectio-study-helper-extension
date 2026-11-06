const SERVER_URL = "https://lectio-study-helper-extension.vercel.app";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "explain") {
        explain(message.text, message.language).then(sendResponse);
        return true;
    }
});

async function explain(text, language) {
    const { token } = await chrome.storage.local.get("token");
    if (!token) return { error: "Log in to Lectio to explain" };

    try {
        const response = await fetch(`${SERVER_URL}/explain`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ text, language }),
        });
        const data = await response.json();
        if (response.ok) return { explanation: data.explanation };
        if (response.status === 401) {
            await chrome.storage.local.remove(["token", "email"]);
            return { error: "Log in to Lectio to explain" };
        }
        return { error: data.error };
    } catch (error) {
        console.error(error);
        return { error: "The server is offline, please try again later" };
    }
}
