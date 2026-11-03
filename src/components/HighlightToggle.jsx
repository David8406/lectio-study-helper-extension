import { useState, useEffect } from "react";

function HighlightToggle() {
    const [highlightEnable, setHighlightEnable] = useState(true);

    useEffect(() => {
        chrome.storage.local.get("highlightEnabled").then((data) => {
            if (data.highlightEnabled === false) setHighlightEnable(false);
        });
    }, []);

    function toggleHighlight(){
        const newValue = !highlightEnable;
        setHighlightEnable(newValue);
        chrome.storage.local.set({ highlightEnabled: newValue });
    }

    return (
        <div>
            <button onClick={toggleHighlight}>Toggle highlight {highlightEnable ? "ON" : "OFF" }</button>
        </div>
    );
}

export default HighlightToggle;
