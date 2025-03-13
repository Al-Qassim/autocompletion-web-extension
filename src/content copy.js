// console.log("Word Predictor is running!");

// // Listen for typing in text inputs
// document.addEventListener("input", (event) => {
//     if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
//         const typedText = event.target.value;
//         console.log("You typed:", typedText);
//     }
// });

// Basic word prediction dictionary
const wordList = {
        "he": ["hello", "help", "here"],
        "th": ["the", "this", "that", "there"]
    };
    
    document.addEventListener("input", (event) => {
        if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
            
        const typedText = event.target.value;
        console.log("You typed:", typedText);


        const text = event.target.value;
        const lastWord = text.split(" ").pop().toLowerCase(); // Get the current word
    
        // Simple prediction
        const suggestions = wordList[lastWord.slice(0, 2)] || [];
        if (suggestions.length > 0) {
            showSuggestions(event.target, suggestions);
        }
        }
    });
    
    // Display suggestions below the input
    function showSuggestions(inputElement, suggestions) {
        // Remove old suggestions
        const oldPopup = document.getElementById("word-predictor-popup");
        if (oldPopup) oldPopup.remove();
    
        // Create new popup
        const popup = document.createElement("div");
        popup.id = "word-predictor-popup";
        popup.style.position = "absolute";
        popup.style.background = "blue";
        popup.style.color = "white";
        popup.style.border = "1px solid gray";
        //popup.style.padding = "1%";
        // popup.style.padding_left = "5px";
        popup.style.zIndex = "1000";
    
        // Position it below the input
        const rect = inputElement.getBoundingClientRect();
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY}px`;
    
        // Add suggestions
        popup.innerHTML = suggestions.join(" | ");
        document.body.appendChild(popup);
    }