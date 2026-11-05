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
        <div className="row">
            <span>Highlighter</span>
            <button className={highlightEnable ? "" : "off"} onClick={toggleHighlight}>
                {highlightEnable ? "ON" : "OFF"}
            </button>
        </div>
    );
}

export default HighlightToggle;
