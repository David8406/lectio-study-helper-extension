chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "explain") {
        explain(message.text).then(sendResponse);
        return true;
    }
});

async function explain(text) {
    const { token } = await chrome.storage.local.get("token");
    if (!token) return { error: "Log in to Lectio to explain" };

    try {
        const response = await fetch("http://localhost:3000/explain", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
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
