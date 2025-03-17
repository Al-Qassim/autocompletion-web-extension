import {dictionaryWithCount} from "./wordsCounts.js"
import {suggestionBox, suggestionOption} from "./elements.js"
 
document.body.appendChild(suggestionBox);

// colors
const suggestionColorOnHover = '#3e3e3e'
const suggestionColorOnFocus = '#04395E'
const prefixColor = '#19AAFF'
const numberOfVisibleOptionsPerScroll = 10
const numberOfSuggestions = 50

let state = {}

// Event listenrs
document.addEventListener("keyup", (event)=>{ // this activate the suggestion
    
    if (["Enter", "ArrowUp", "ArrowDown"].includes(event.key)){
        return
    }
    if (
        suggestionBox.style.display == "none"
        &&
        ["ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
        return
    }
    
    // clear state and suggestionBox
    clearStateAndSuggestion()
    
    const selection = window.getSelection()
        
    if ( // make sure selection is collapsed
            (
                (event.target.tagName == "TEXTAREA" || event.target.tagName == "INPUT") 
                && event.target.selectionStart != event.target.selectionEnd
            )
            ||
            (
                (event.target.tagName != "TEXTAREA" && event.target.tagName != "INPUT") 
                && !selection.isCollapsed
            )
            ||
            (
                (event.target.tagName != "TEXTAREA" && event.target.tagName != "INPUT") 
                && selection.anchorNode.parentElement.closest('[contenteditable="true"]') == null
            )
        ) { 
        return
    }

    // re-calculate State
    calculateState(selection, event)
    // construct suggestion Box
    constructSuggestionBox()
})

document.addEventListener("keydown", (event)=>{  // this just take care off Enter to apply a suggestion, or ArrowUp/ArrowDown to change focused suggestion
    // make sure suggestionBox is visible and a special key is pressed
    if (suggestionBox.style.display == "none"){
        return
    } else if (event.key == "Enter") {
        event.preventDefault()
        event.stopImmediatePropagation();
        applySuggestion(state["suggestionFocusIndex"])
    } else if (event.key == "ArrowUp" || event.key == "ArrowDown") {
        event.preventDefault()
        event.stopImmediatePropagation();
        const oldIndex = state["suggestionFocusIndex"]
        let newIndex = event.key == "ArrowUp" ? oldIndex - 1 : oldIndex + 1

        // round newIndex the other way if out of range
        if (newIndex < 0){
            newIndex = suggestionBox.children.length - 1
        } else if (newIndex >= suggestionBox.children.length) {
            newIndex = 0
        }

        // change color 
        suggestionBox.children[oldIndex].style.backgroundColor = "#00000000"
        suggestionBox.children[newIndex].style.backgroundColor = suggestionColorOnFocus
        // scroll
        scrollSuggestionBox(newIndex)
        // change focus index
        state["suggestionFocusIndex"] = newIndex
    }
    
}, true)

document.addEventListener("click", (event)=>{ // depending on where you click, this will apply a suggestion option or turn off suggestion 
    const className = event.target.className
    if (className.includes("SuggestionOption_")) { // if you click on a suggestion option, then apply it
        event.preventDefault()
        event.stopImmediatePropagation();
        const index = Number(className.slice("SuggestionOption_".length))
        applySuggestion(index)
    } else { // if you click anywhere else, then clear the suggetions box
        clearStateAndSuggestion()
    }
}, true)

// functions

function scrollSuggestionBox(newIndex){
    if (newIndex >= numberOfVisibleOptionsPerScroll + state["scrollIndex"]) {
        state["scrollIndex"] = newIndex - numberOfVisibleOptionsPerScroll + 1
    } else if (newIndex < state["scrollIndex"]) {
        state["scrollIndex"] = newIndex
    }
    suggestionBox.scrollTo(0, state["scrollIndex"] * suggestionBox.children[newIndex].getBoundingClientRect().height)
}

function calculateState(selection, event){

    // input Or Textarea
    state["inputOrTextarea"] = event.target.tagName == "TEXTAREA" || event.target.tagName == "INPUT"

    if (state["inputOrTextarea"]) {
        // store the text node
        state["textNode"] = event.target
        // store anchorOffset
        state["anchorOffset"] = state["textNode"].selectionStart

        // store the prefix
        const text = state["textNode"].value.slice(0, state["anchorOffset"])
        const words = text.split(/\s+/);
        state["prefix"] = words[words.length - 1];
        
        // store caret coordinates
        state["corners"] = {
            top: state["textNode"].getBoundingClientRect().top,
            right: state["textNode"].getBoundingClientRect().right,
            bottom: state["textNode"].getBoundingClientRect().bottom, 
            left: state["textNode"].getBoundingClientRect().left
        }
    } else {
        // store the text node
        state["textNode"] = selection.anchorNode

        // store anchorOffset
        state["anchorOffset"] = selection.anchorOffset

        // store the prefix
        selection.modify("extend", "backward", "word")
        state["prefix"] = selection.toString() 
        selection.collapseToEnd()
        
        // store caret coordinates
        state["corners"] = {
            top: selection.getRangeAt(0).getBoundingClientRect().top,
            right: selection.getRangeAt(0).getBoundingClientRect().right,
            bottom: selection.getRangeAt(0).getBoundingClientRect().bottom, 
            left: selection.getRangeAt(0).getBoundingClientRect().left
        }
        if (state["corners"].top == 0) {
            state["corners"] = {
                top: event.target.getBoundingClientRect().top,
                right: event.target.getBoundingClientRect().right,
                bottom: event.target.getBoundingClientRect().bottom, 
                left: event.target.getBoundingClientRect().left
            }
        }
    }

    state["scrollIndex"] = 0

    // console.log("state after key press", state)
}

function constructSuggestionBox(){
    // check valid perfix
    if (state["prefix"].length == 0) {
        return
    }
    // search suggestions
    const suggestions = getSuggestions(state["prefix"])
    // check if any suggestions
    if (suggestions.length == 0) {
        return
    }
    // append them to suggestions box
    let div = null
    suggestions.forEach((Suggestion, index) => {
        div = getSuggestionDiv(Suggestion, state["prefix"], index)
        suggestionBox.appendChild(div) 
    })
    
    // focus on first suggestion
    state["suggestionFocusIndex"] = 0
    // show suggestionBox
    suggestionBox.style.display = "block"

    // size
    suggestionBox.style.height = (Math.min(numberOfVisibleOptionsPerScroll, suggestionBox.children.length) * suggestionBox.children[0].getBoundingClientRect().height + 2*Number(suggestionBox.style.padding.split("px")[0])) + "px"
    
    // position 
    positionSuggestionBox()
    
}

function positionSuggestionBox() {
    if (
        state.corners.left
        + suggestionBox.getBoundingClientRect().width
        // + window.scrollX
        > window.outerWidth ){
            suggestionBox.style.left = (state.corners.left + window.scrollX - suggestionBox.getBoundingClientRect().width) + "px"
        } else {
            suggestionBox.style.left = (state.corners.left + window.scrollX) + "px"
        }
    if (
        state.corners.bottom
        + suggestionBox.getBoundingClientRect().height
        // + window.scrollY
        > window.outerHeight){
            suggestionBox.style.top = (state.corners.top + window.scrollY - suggestionBox.getBoundingClientRect().height) + "px"
        } else {
            suggestionBox.style.top = (state.corners.bottom + window.scrollY) + "px"
        }

}

function getSuggestionDiv(word, prefix, index) {
    let div = suggestionOption.cloneNode()
    // div = document.createElement('div');
    div.className = `SuggestionOption_${index}`
    div.innerHTML = "<span style='color:" + prefixColor + "'>" + prefix + "</span>" + word.slice(prefix.length, word.length)
    
    if (index == 0) {div.style.backgroundColor = suggestionColorOnFocus}

    div.addEventListener("mouseover", ()=>{div.style.backgroundColor = suggestionColorOnHover})
    div.addEventListener("mouseout", ()=>{div.style.backgroundColor = '#00000000'})

    return div
}

function getSuggestions(prefix) {
    // return dictionary.filter(word => word.startsWith(prefix)).slice(0, 5);
    return Object
                .entries(dictionaryWithCount)               // reformat to array
                .filter(([k, v]) => k.startsWith(prefix))   // search for matches
                .sort((a, b) => b[1] - a[1])                // sort by count
                .map(([k, v]) => k)                         // take words only
                .slice(0, numberOfSuggestions);             // take a limited amount
    // return spell.suggest(prefix).splice(0, 5)
}

function clearStateAndSuggestion() {

    state = {}
    suggestionBox.scrollTo(0, 0)
    suggestionBox.innerHTML = ""
    suggestionBox.style.display = "none"
}

function applySuggestion(suggestionIndex) {
    // get the word from the option
    const word = suggestionBox.children[suggestionIndex].textContent
    
    // for discord
    // word.slice(state.prefix.length)
    //     .split("")
    //     .forEach((char) => {
    //         const event = new InputEvent("beforeinput", {
    //             inputType: "insertText",
    //             data: char,
    //             bubbles: true,
    //             cancelable: true,
    //             composed: true,
    //         });
    //         state["textNode"].dispatchEvent(event);
    //     });
            
    // put it to the UI
    if (state["inputOrTextarea"]) {
        
        state["textNode"].value = (
            state["textNode"].value.slice(0, state.anchorOffset) +
            word.slice(state.prefix.length) + " " +
            state["textNode"].value.slice(state.anchorOffset)
        )

        state["textNode"].selectionStart = state.anchorOffset + word.slice(state.prefix.length).length + 1
        state["textNode"].selectionEnd = state["textNode"].selectionStart
        state["textNode"].focus()
        state["textNode"].dispatchEvent(new InputEvent("input", { bubbles: true }));

    } else {

        state["textNode"].textContent = (
            state["textNode"].textContent.slice(0, state.anchorOffset) +
            word.slice(state.prefix.length) + " " +
            state["textNode"].textContent.slice(state.anchorOffset)
        )
        window.getSelection().setPosition(state["textNode"])
        window.getSelection().extend(state.textNode, state.anchorOffset + word.slice(state.prefix.length).length + 1)
        window.getSelection().collapseToEnd()
        state["textNode"].dispatchEvent(new InputEvent("input", { bubbles: true }));
    }

    clearStateAndSuggestion()
}

