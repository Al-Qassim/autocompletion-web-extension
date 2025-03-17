import {dictionaryWithCount} from "./wordsCounts.js"
import {suggestionBox, suggestionOption} from "./elements.js"
 
document.body.appendChild(suggestionBox);

// extension sittings
const suggestionColorOnHover = '#3e3e3e'
const suggestionColorOnFocus = '#04395E'
const prefixColor = '#19AAFF'
const numberOfVisibleOptionsPerScroll = 10
const numberOfSuggestions = 50

// internal state to save/access/remove all variables
let state = {}

// const
const kes_that_trigger_suggestions = "A B C E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z ` Shift ArrowLeft ArrowRight Backspace"
                                    .split(" ")

// Event listenrs

// this activate the suggestionBox 
document.addEventListener("keyup", (event)=>{ 
    console.log(event.key)
    
    if ( // enter and up/down arrows should not effect suggestions
        ["Enter", "ArrowUp", "ArrowDown"].includes(event.key)
    ){ 
        return
    }
    if ( // right/left arrows should effect suggestions only if suggestions is apparent
        suggestionBox.style.display == "none"
        &&
        ["ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
        return
    }

    // clear state and suggestionBox
    clearStateAndSuggestion()
    
    // make sure the key pressed is appropriate to show suggestions
    if (!kes_that_trigger_suggestions.includes(event.key)){
        return
    }
    
    // note: through experimentation, I found that it's importante to treat <input>/<textarea> differently than <div contenteditable="true">  
    // if the user is writing in <input>/<textarea>, I use the event object
    // for the <div contenteditable="true">, it's more convenient to use window.getSelection()
    
    const selection = window.getSelection()
        
    if ( // make sure selection is collapsed and editable
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

// this just take care of Enter to apply a suggestion, or ArrowUp/ArrowDown to change focused suggestion
document.addEventListener("keydown", (event)=>{  
    // make sure suggestionBox is visible
    if (suggestionBox.style.display == "none"){
        return
    }
    // enter will apply the focused suggestion stored in state["suggestionFocusIndex"]
    if (event.key == "Enter") {
        event.preventDefault()
        event.stopImmediatePropagation();
        applySuggestion(state["suggestionFocusIndex"])
        return
    }

    // up/down arrows will change the focused suggestion stored in state["suggestionFocusIndex"] and recolor the suggestions
    if (event.key == "ArrowUp" || event.key == "ArrowDown") {
        event.preventDefault()
        event.stopImmediatePropagation();
        const oldIndex = state["suggestionFocusIndex"]
        let newIndex = event.key == "ArrowUp" ? oldIndex - 1 : oldIndex + 1

        // round newIndex the other way if out of range
        // basiclly means that the if some one keep pushing up/down arrows, he will go in a loop 
        if (newIndex < 0){
            newIndex = suggestionBox.children.length - 1
        } else if (newIndex >= suggestionBox.children.length) {
            newIndex = 0
        }

        // change color 
        suggestionBox.children[oldIndex].style.backgroundColor = "#00000000"
        suggestionBox.children[newIndex].style.backgroundColor = suggestionColorOnFocus
        
        // scroll inside the suggestion box
        scrollSuggestionBox(newIndex)
        
        // change focus index
        state["suggestionFocusIndex"] = newIndex
    }
    
}, true)

// depending on where you click, this will apply a suggestion option or turn off suggestion 
document.addEventListener("click", (event)=>{ 
    const className = event.target.className
    if (className.includes("SuggestionOption_")) { 
        // if you click on a suggestion option, then apply it
        event.preventDefault()
        event.stopImmediatePropagation();
        const index = Number(className.slice("SuggestionOption_".length))
        applySuggestion(index)
    } else { 
        // if you click anywhere else, then clear the suggetions box
        clearStateAndSuggestion()
    }
}, true)

// functions

function scrollSuggestionBox(newIndex){
    // I have a varible called state["scrollIndex"] that I use to track the scroll stutes of the suggestion box
    // basiclly, state["scrollIndex"] is the index of the suggestionOption that will appear first in the suggestionBox
    
    if (newIndex < state["scrollIndex"]) {
        // case 1: newIndex after hitting up arrow is less than scrollIndex
        state["scrollIndex"] = newIndex
    } else if (newIndex >= numberOfVisibleOptionsPerScroll + state["scrollIndex"]) {
        // case 2: newIndex after hitting down arrow is more than scrollIndex + numberOfVisibleOptionsPerScroll
        state["scrollIndex"] = newIndex - numberOfVisibleOptionsPerScroll + 1
    }
    // apply scrolling
    suggestionBox.scrollTo(0, state["scrollIndex"] * suggestionBox.children[newIndex].getBoundingClientRect().height)
}

function calculateState(selection, event){

    // check if we are dealing with <input>/<textare> or <div>
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

    // initiate the veriable scrollIndex with value 0
    state["scrollIndex"] = 0

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
    suggestionBox.style.height = (
        Math.min( // big enought for the numberOfVisibleOptionsPerScroll, but smaller if there are few suggestions
            numberOfVisibleOptionsPerScroll, 
                suggestionBox.children.length) 
                * suggestionBox.children[0].getBoundingClientRect().height 
                + 2*Number(suggestionBox.style.padding.split("px")[0])
        ) + "px"
    
    // position 
    positionSuggestionBox()
    
}

function positionSuggestionBox() {
    // Ideally, the top-left corner of the suggestions box should be at the caret
    // but if the caret is positioned too low in the page, like in chat apps for example, it's better to position the bottom-left corner at the caret
    // same idea if the caret is positioned too far to the right

    // note: remember to add window.scrollX, window.scrollY to the suggestionBox position
    
    if ( 
        state.corners.left // caret position from left to right
        + suggestionBox.getBoundingClientRect().width
        > window.outerWidth 
    ) {
        suggestionBox.style.left = (state.corners.left + window.scrollX - suggestionBox.getBoundingClientRect().width) + "px"
    } else {
        suggestionBox.style.left = (state.corners.left + window.scrollX) + "px"
    }
    if (
        state.corners.bottom // caret position from up to bottom
        + suggestionBox.getBoundingClientRect().height
        > window.outerHeight
    ) {
        suggestionBox.style.top = (state.corners.top + window.scrollY - suggestionBox.getBoundingClientRect().height) + "px"
    } else {
        suggestionBox.style.top = (state.corners.bottom + window.scrollY) + "px"
    }

}

function getSuggestionDiv(word, prefix, index) {
    
    // clone the suggestionOption element
    let div = suggestionOption.cloneNode()
    
    // put the index in the className
    div.className = `SuggestionOption_${index}`
    
    // put the suggestion inside the div, and color the prefix
    div.innerHTML = "<span style='color:" + prefixColor + "'>" + prefix + "</span>" + word.slice(prefix.length, word.length)
    
    // if this is the first suggestion, colore the background with suggestionColorOnFocus
    if (index == 0) {div.style.backgroundColor = suggestionColorOnFocus}
    
    // add addEventListener to change the suggestion option color when the mouse hover over it
    div.addEventListener("mouseover", ()=>{div.style.backgroundColor = suggestionColorOnHover})
    div.addEventListener("mouseout", ()=>{div.style.backgroundColor = '#00000000'})

    return div
}

function getSuggestions(prefix) {
    return Object
        // reformat to array
            .entries(dictionaryWithCount)               
        // search for matches
            .filter(([word, count]) => word.startsWith(prefix))   
        // sort by count
            .sort(([word1, count1], [word2, count2]) => count2 - count1)             
        // take words only   
            .map(([word, count]) => word)                         
        // take a limited amount as most
            .slice(0, numberOfSuggestions);             
}

function clearStateAndSuggestion() {
    // set all variables to null
    state = {}
    // scroll suggestion box to 0, 0
    suggestionBox.scrollTo(0, 0)
    // clear suggestionOptions
    suggestionBox.innerHTML = ""
    // hide suggestion box
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
        // insert the remaining word
        state["textNode"].value = (
            state["textNode"].value.slice(0, state.anchorOffset) +
            word.slice(state.prefix.length) + " " +
            state["textNode"].value.slice(state.anchorOffset)
        )
        // move the caret the end of the word plus a space
        state["textNode"].selectionStart = state.anchorOffset + word.slice(state.prefix.length).length + 1
        state["textNode"].selectionEnd = state["textNode"].selectionStart
        // focus window on textnode
        state["textNode"].focus()
        // send an input event
        state["textNode"].dispatchEvent(new InputEvent("input", { bubbles: true }));

    } else {
        // insert the remaining word
        state["textNode"].textContent = (
            state["textNode"].textContent.slice(0, state.anchorOffset) +
            word.slice(state.prefix.length) + " " +
            state["textNode"].textContent.slice(state.anchorOffset)
        )
        // move the caret the end of the word plus a space
        window.getSelection().setPosition(state["textNode"])
        window.getSelection().extend(state.textNode, state.anchorOffset + word.slice(state.prefix.length).length + 1)
        window.getSelection().collapseToEnd()
        // send an input event
        state["textNode"].dispatchEvent(new InputEvent("input", { bubbles: true }));
    }

    clearStateAndSuggestion()
}

