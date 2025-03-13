

let suggestionBox = document.createElement('div');
suggestionBox.className = "suggestionBox"
document.body.appendChild(suggestionBox);

let suggestionOption = document.createElement('div');

// styles
suggestionBox.style.position    = 'absolute'
suggestionBox.style.backgroundColor  = '#1e1e1e'
suggestionBox.style.color       = 'white'
suggestionBox.style.border      = '1px solid #555'
suggestionBox.style.display     = 'none'
suggestionBox.style.fontFamily  = 'monospace'
suggestionBox.style.zIndex      = '1000000'
suggestionBox.style.minWidth    = '40%'
suggestionBox.style.padding    = '5px'
suggestionBox.style.borderRadius    = '10px'

suggestionOption.style.padding = '2px';
suggestionOption.style.paddingLeft = '10px';
suggestionOption.style.cursor = 'pointer';
suggestionOption.style.borderRadius = '5px';
suggestionOption.style.transition  = 'background-color 100ms ease'

// suggestionOption.style.transitionDelay  = '1s ease'
// transition: backgroundColor-color 300ms linear;



let suggestionColorOnHover = '#3e3e3e'
let suggestionColorOnFocus = '#04395E'
let prefixColor = '#19AAFF'

let focusedSuggestionIndex = 0
let newFocusedSuggestionIndex = null

let inputField = null;
let keyPressed = null;

let CursorIndex = null

let extension_keys = [
    "ArrowUp", 
    "ArrowDown", 
    "ArrowLeft", 
    "ArrowRight", 
    "Enter"
]

let readFunction = (inputField) => {
    
    if (inputField.value != null) {
        console.log("readFunction value: ", inputField.value)
        return inputField.value
    }
    console.log("readFunction textContent: ", inputField.textContent)
    return inputField.textContent

};

let writeFunction = (inputField, newtext) => {
    if (inputField.value != null) {
        console.log("writeFunction value: ", newtext)

        inputField.value = newtext
        return
    }
    console.log("writeFunction textContent: ", newtext)
    inputField.textContent = newtext
};

document.addEventListener("keydown", (e)=>{ // keybourd interactions

    console.log("keydown event : ", e)

    if ( 
        suggestionBox.style.display != 'none'
        &&
        extension_keys.includes(e.key)
    ) { // if suggestion box is appearing, change the focused suggestion    
        keyPressed = e.key;
    } else return
    
    
    e.preventDefault()

    if (keyPressed == "ArrowUp" || keyPressed == "ArrowDown"){
        newFocusedSuggestionIndex = (
            keyPressed == "ArrowUp" 
            ? 
            focusedSuggestionIndex - 1
            :
            focusedSuggestionIndex + 1
        )
    
        let SuggestionOption = document.getElementsByClassName(`SuggestionOption_${newFocusedSuggestionIndex}`)
    
        if (SuggestionOption.length == 1){ // if suggestion doesn't exist, which is mostly because focusedSuggestionIndex is too big or two small, don't change
            
            SuggestionOption[0].style.backgroundColor = suggestionColorOnFocus
            SuggestionOption = document.getElementsByClassName(`SuggestionOption_${focusedSuggestionIndex}`)
            SuggestionOption[0].style.backgroundColor = "#00000000"
            focusedSuggestionIndex = newFocusedSuggestionIndex
        }

    } else if (keyPressed == "ArrowLeft" || keyPressed == "ArrowRight"){
        // inputField = e.target
        let moveCuorser = (
            keyPressed == "ArrowLeft"
            ?
            -1
            :
            1
        )
        reset_all_values()
        CursorIndex = doGetCaretPosition(inputField)
        setCaretPosition(inputField, CursorIndex + moveCuorser)
        
        updateSuggestionsBox(
            get_prefix_from_input_field(inputField)
        );


    } else if (keyPressed == "Enter"){
        
        word = document.getElementsByClassName(`SuggestionOption_${focusedSuggestionIndex}`)[0].textContent
        insertWord(word)
        
    }
  
})

document.addEventListener('click', (e) => { // click interactions
    
    console.log("click event : ", e)
    
    if (e.target.className.split("_")[0] == "SuggestionOption"){
        e.preventDefault()

        word = e.target.textContent
        insertWord(word)
    } else {
        
        hideSuggestions()
    }
});

document.addEventListener('keyup', function(event) {
    if (extension_keys.includes(event.code)){ // key pressed should be one of the extension keys
        return
    }
    // console.log("caret position : ", getCaretPosition())
    console.log("input event : ", event)
    // get input field object
    reset_all_values()
    inputField = event.target;
    CursorIndex = doGetCaretPosition(inputField)
    
    //update Suggestions Box

    updateSuggestionsBox(
        get_prefix_from_input_field(inputField)
    );
});

function reset_all_values() {
    focusedSuggestionIndex = 0
    newFocusedSuggestionIndex = null
    CursorIndex = null
    keyPressed = null
    // inputField = null
}

function get_prefix_from_input_field(inputField) {
    CursorIndex = doGetCaretPosition(inputField)
    let text = readFunction(inputField).slice(0, CursorIndex)
    let words = text.split(/\s+/);
    let prefix = words[words.length - 1];
    return prefix
}

function updateSuggestionsBox(prefix) {
    
    // if prefix is empty, hide suggestions box
    if (prefix.length == 0) {
        hideSuggestions()
        return
    }
    
    // get array of getSuggestions
    let suggestions = getSuggestions(prefix);
    
    // if no suggestions, hide suggestions box
    if (suggestions.length == 0) {
        hideSuggestions();
        return;
    }

    // show and clear suggestions box
    suggestionBox.style.display = 'block'
    suggestionBox.innerHTML = '';
    
    // add suggestions divs to the box
    suggestions.forEach((word, index) => {
        suggestionBox.appendChild(
            getSuggestionDiv(word, prefix, index)
        );
        console.log(index)
    });

    // position the suggestionBox
    let rect = inputField.getBoundingClientRect();
    suggestionBox.style.left = rect.left + 'px';
    suggestionBox.style.top = (rect.bottom + window.scrollY) + 'px';
}

function getSuggestionDiv(word, prefix, index) {
    let div = suggestionOption.cloneNode()
    // div = document.createElement('div');
    div.className = `SuggestionOption_${index}`
    div.innerHTML = "<span style='color:" + prefixColor + "'>" + prefix + "</span>" + word.slice(prefix.length, word.length)
    
    if (index == 0) {div.style.backgroundColor = suggestionColorOnFocus}
    
    
    // div.addEventListener('click', (e) => {
    //     e.preventDefault()
    //     insertWord(word);
    // });

    div.addEventListener("mouseover", ()=>{console.log(index); div.style.backgroundColor = suggestionColorOnHover})
    div.addEventListener("mouseout", ()=>{console.log(index); div.style.backgroundColor = '#00000000'})

    return div
}

function hideSuggestions() {
    suggestionBox.style.display = 'none';
    reset_all_values()
    inputField = null
}

function insertWord(word) {
    if (!inputField) {
        return
    }
    
    // get the text again, and complete the replace the last word
    
    let text = readFunction(inputField)

    let words = text.slice(0, CursorIndex)
                    .split(/\s+/);

    words[words.length - 1] = word;
    text = words.join(' ') + text.slice(CursorIndex, text.length)
    
    writeFunction(inputField, text);

    focusedSuggestionIndex = 0
    inputField.focus()

    // inputField.setSelectionRange(0, text.length)
    // inputField.selectionStart = words
    //                                 .join(' ')
    //                                 .length
    // inputField.selectionEnd = inputField.selectionStart
    console.log(words.join(' ').length)
    console.log(text.length)
    setCaretPosition(inputField, words.join(' ').length)

    hideSuggestions();
}

function doGetCaretPosition(ctrl)
{
    var CaretPos = 0;

    if (ctrl.selectionStart || ctrl.selectionStart == 0)
    {// Standard.
        console.log("selectionStart")
        CaretPos = ctrl.selectionStart;
    }
    else if (document.selection)
    {// Legacy IE
        console.log("document.selection")
        ctrl.focus ();
        var Sel = document.selection.createRange ();
        Sel.moveStart ('character', -ctrl.value.length);
        CaretPos = Sel.text.length;
    }
    else if (window.getSelection())
        {// Legacy IE
            console.log("window.getSelection()")
            // ctrl.focus ();
            var Sel = window.getSelection();
            CaretPos = Sel.anchorOffset;
        }
    console.log("CaretPos", CaretPos)
    return (CaretPos);
}

function setCaretPosition(ctrl,pos)
{
    if (ctrl.setSelectionRange)
    {
        console.log("setCaretPosition 1")
        ctrl.focus();
        ctrl.setSelectionRange(pos,pos);
    }
    else if (ctrl.createTextRange)
    {
        console.log("setCaretPosition 2")
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
    else {
        console.log("setCaretPosition 3")
        let selection = window.getSelection();
        let range = document.createRange();
        
        // Get the target element (ensure it's contenteditable or a text node)
        let targetElement = ctrl; // Replace with your element

        // Ensure the element has text content or is an editable container
        let textNode = targetElement.firstChild; // Assuming first child is a text node

        if (textNode) {
            // Set the range start to the desired position in the text node
            range.setStart(textNode, pos);
            range.collapse(true); // Collapse to place the caret at the start of the range

            // Remove any existing selections and add the new range
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            console.error('The target element does not contain text.');
        }
    }
}

function getSuggestions(prefix) {
    const dictionary = ['hello', 'help', 'helium', 'hero', 'hermit', 'hexagon']; // Extend this dynamically
    return dictionary.filter(word => word.startsWith(prefix)).slice(0, 5);
}

// function getCaretPosition() {
//     let x = 0;
//     let y = 0;
//     const isSupported = typeof window.getSelection !== "undefined";
//     if (isSupported) {
//         const selection = window.getSelection();
//         // Check if there is a selection (i.e. cursor in place)
//         if (selection.rangeCount !== 0) {
//         // Clone the range
//             const range = selection.getRangeAt(0).cloneRange();
//             // Collapse the range to the start, so there are not multiple chars selected
//             range.collapse(true);
//             // getCientRects returns all the positioning information we need
//             const rect = range.getClientRects()[0];
//             if (rect) {
//                 x = rect.left; // since the caret is only 1px wide, left == right
//                 y = rect.top; // top edge of the caret
//             }
//         }
//     }
//   return { "x": x, "y": y };
// }