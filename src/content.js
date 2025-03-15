let suggestionBox = document.createElement('div');
document.body.appendChild(suggestionBox);

suggestionBox.className = "suggestionBox"

suggestionBox.style.position    = 'absolute'
suggestionBox.style.backgroundColor  = '#1e1e1e'
suggestionBox.style.color       = 'white'
suggestionBox.style.border      = '1px solid #555'
suggestionBox.style.display     = 'none'
suggestionBox.style.fontFamily  = 'monospace'
suggestionBox.style.fontSize  = '1rem'
suggestionBox.style.zIndex      = '1000000'
suggestionBox.style.minWidth    = '40%'
suggestionBox.style.padding    = '5px'
suggestionBox.style.borderRadius    = '10px'



let suggestionOption = document.createElement('div');

suggestionOption.style.padding = '2px';
suggestionOption.style.paddingLeft = '10px';
suggestionOption.style.cursor = 'pointer';
suggestionOption.style.borderRadius = '5px';
suggestionOption.style.transition  = 'background-color 100ms ease'

// colors
const suggestionColorOnHover = '#3e3e3e'
const suggestionColorOnFocus = '#04395E'
const prefixColor = '#19AAFF'

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

    // clear state and suggestionBox
    clearStateAndSuggestion()
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
        const newIndex = event.key == "ArrowUp" ? oldIndex - 1 : oldIndex + 1
        
        if (newIndex >= 0 && newIndex < suggestionBox.children.length) {
            suggestionBox.children[oldIndex].style.backgroundColor = "#00000000"
            suggestionBox.children[newIndex].style.backgroundColor = suggestionColorOnFocus
            state["suggestionFocusIndex"] = newIndex
        }
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
    }
    console.log("state after key press", state)
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

    // position 
    positionSuggestionBox()


}

function positionSuggestionBox() {
    if (
        state.corners.left
        + suggestionBox.getBoundingClientRect().width
        + window.scrollX
        > window.outerWidth ){
            suggestionBox.style.left = (state.corners.left + window.scrollX - suggestionBox.getBoundingClientRect().width) + "px"
        } else {
            suggestionBox.style.left = (state.corners.left + window.scrollX) + "px"
        }
    if (
        state.corners.bottom
        + suggestionBox.getBoundingClientRect().height
        + window.scrollY
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
    return dictionary.filter(word => word.startsWith(prefix)).slice(0, 5);
}

function clearStateAndSuggestion() {
    state = {}
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

const dictionary = [
    "able",
    "about",
    "above",
    "accept",
    "accident",
    "account",
    "across",
    "act",
    "action",
    "actor",
    "add",
    "address",
    "admire",
    "admit",
    "advance",
    "advantage",
    "adventure",
    "afraid",
    "after",
    "afternoon",
    "again",
    "against",
    "age",
    "ago",
    "agree",
    "air",
    "airport",
    "all",
    "allow",
    "almost",
    "alone",
    "along",
    "already",
    "also",
    "although",
    "always",
    "among",
    "amount",
    "and",
    "angry",
    "animal",
    "another",
    "answer",
    "any",
    "anything",
    "appear",
    "apple",
    "area",
    "arm",
    "army",
    "around",
    "arrange",
    "arrive",
    "art",
    "article",
    "as",
    "ask",
    "asleep",
    "at",
    "attack",
    "attempt",
    "attend",
    "attitude",
    "available",
    "average",
    "away",
    "baby",
    "back",
    "bad",
    "bag",
    "bank",
    "bath",
    "battle",
    "be",
    "bear",
    "beautiful",
    "because",
    "become",
    "bed",
    "beer",
    "before",
    "begin",
    "behind",
    "believe",
    "belong",
    "below",
    "best",
    "better",
    "between",
    "big",
    "bill",
    "bird",
    "black",
    "blood",
    "blue",
    "board",
    "boat",
    "body",
    "book",
    "born",
    "borrow",
    "both",
    "bottle",
    "bottom",
    "box",
    "boy",
    "branch",
    "brave",
    "bread",
    "break",
    "breakfast",
    "breathe",
    "bridge",
    "bring",
    "brother",
    "brown",
    "build",
    "building",
    "built",
    "bus",
    "business",
    "busy",
    "but",
    "butter",
    "buy",
    "cake",
    "call",
    "calm",
    "camera",
    "can",
    "captain",
    "car",
    "card",
    "care",
    "careful",
    "careless",
    "carry",
    "case",
    "cat",
    "catch",
    "cause",
    "central",
    "centre",
    "century",
    "certain",
    "certainly",
    "chain",
    "chair",
    "chance",
    "change",
    "character",
    "charge",
    "cheap",
    "check",
    "cheese",
    "chicken",
    "chief",
    "child",
    "chocolate",
    "choice",
    "choose",
    "church",
    "cigarette",
    "cinema",
    "circle",
    "city",
    "class",
    "clean",
    "clear",
    "climb",
    "clock",
    "close",
    "cloth",
    "clothes",
    "cloud",
    "club",
    "coal",
    "coast",
    "coat",
    "coffee",
    "coin",
    "cold",
    "collect",
    "college",
    "colour",
    "come",
    "comfort",
    "comfortable",
    "common",
    "company",
    "complete",
    "computer",
    "condition",
    "confirm",
    "consider",
    "consist",
    "contain",
    "continue",
    "control",
    "cook",
    "copy",
    "corner",
    "correct",
    "cost",
    "cottage",
    "could",
    "count",
    "country",
    "course",
    "court",
    "cover",
    "crazy",
    "cream",
    "crime",
    "cross",
    "crowd",
    "cry",
    "culture",
    "cup",
    "customer",
    "cut",
    "damage",
    "dance",
    "dangerous",
    "dark",
    "date",
    "daughter",
    "day",
    "dead",
    "deal",
    "dear",
    "death",
    "decide",
    "decision",
    "declare",
    "deep",
    "defend",
    "degree",
    "delay",
    "demand",
    "department",
    "depend",
    "describe",
    "desert (n)",
    "design",
    "desk",
    "destroy",
    "detail",
    "die",
    "different",
    "difficult",
    "dinner",
    "direct",
    "direction",
    "dirty",
    "discover",
    "discuss",
    "dish",
    "distance",
    "divide",
    "do",
    "doctor",
    "document",
    "dog",
    "dollar",
    "door",
    "double",
    "doubt",
    "down",
    "draw",
    "dream",
    "dress",
    "drink",
    "drive",
    "drop",
    "dry",
    "during",
    "dust",
    "duty",
    "each",
    "ear",
    "early",
    "earn",
    "earth",
    "east",
    "easy",
    "eat",
    "edge",
    "education",
    "effect",
    "effort",
    "egg",
    "eight",
    "either",
    "end",
    "enemy",
    "engine",
    "English",
    "enjoy",
    "enough",
    "enter",
    "equal",
    "escape",
    "especially",
    "even",
    "evening",
    "event",
    "ever",
    "every",
    "everything",
    "everywhere",
    "exact",
    "examine",
    "example",
    "except",
    "exchange",
    "exercise",
    "expect",
    "expensive",
    "experience",
    "explain",
    "express",
    "expression",
    "eye",
    "face",
    "fact",
    "factory",
    "fail",
    "fall",
    "family",
    "famous",
    "farm",
    "farmer",
    "fast",
    "fat",
    "father",
    "favourite",
    "feel",
    "few",
    "field",
    "fight",
    "film",
    "find",
    "fine",
    "finger",
    "finish",
    "fire",
    "first",
    "fish",
    "flat",
    "floor",
    "flower",
    "fly",
    "follow",
    "food",
    "foot",
    "for",
    "foreign",
    "forget",
    "form",
    "free",
    "fresh",
    "friend",
    "from",
    "front",
    "fruit",
    "full",
    "funny",
    "future",
    "game",
    "garage",
    "garden",
    "gas",
    "gate",
    "general",
    "gentle",
    "gentleman",
    "get",
    "gift",
    "girl",
    "give",
    "glad",
    "glass",
    "go",
    "goal",
    "gold",
    "good",
    "government",
    "great",
    "green",
    "grey",
    "ground",
    "group",
    "grow",
    "guard",
    "guess",
    "guest",
    "guide",
    "gun",
    "hair",
    "half",
    "hand",
    "happen",
    "happy",
    "hard",
    "hat",
    "hate",
    "have",
    "he",
    "head",
    "health",
    "hear",
    "heart",
    "heavy",
    "help",
    "her",
    "here",
    "hide",
    "high",
    "his",
    "history",
    "hold",
    "hole",
    "holiday",
    "home",
    "hope",
    "horse",
    "hospital",
    "hot",
    "hotel",
    "hour",
    "house",
    "how",
    "hungry",
    "husband",
    "ice",
    "idea",
    "if",
    "ill",
    "illegal",
    "illness",
    "image",
    "imagine",
    "immediately",
    "import",
    "important",
    "impossible",
    "improve",
    "in",
    "include",
    "increase",
    "indeed",
    "independent",
    "individual",
    "industry",
    "influence",
    "inform",
    "information",
    "injure",
    "insect",
    "inside",
    "instead",
    "instrument",
    "intelligent",
    "interest",
    "interesting",
    "international",
    "interview",
    "into",
    "introduce",
    "invite",
    "iron",
    "island",
    "it",
    "jacket",
    "job",
    "join",
    "joke",
    "journey",
    "juice",
    "jump",
    "just",
    "keep",
    "key",
    "kill",
    "kind",
    "kitchen",
    "knife",
    "know",
    "lake",
    "land",
    "language",
    "large",
    "last",
    "late",
    "laugh",
    "law",
    "leader",
    "learn",
    "leave",
    "left",
    "leg",
    "less",
    "lesson",
    "let",
    "letter",
    "lie",
    "life",
    "light",
    "like",
    "line",
    "listen",
    "little",
    "live (v)",
    "long",
    "look",
    "lose",
    "love",
    "low",
    "machine",
    "magazine",
    "main",
    "make",
    "man",
    "many",
    "map",
    "mark",
    "market",
    "marriage",
    "marry",
    "match",
    "material",
    "may",
    "meal",
    "mean",
    "measure",
    "meat",
    "medicine",
    "meet",
    "meeting",
    "member",
    "message",
    "metal",
    "middle",
    "milk",
    "mind",
    "mine",
    "minute (n)",
    "miss",
    "mistake",
    "modern",
    "moment",
    "money",
    "month",
    "moon",
    "more",
    "morning",
    "most",
    "mother",
    "mountain",
    "move",
    "much",
    "music",
    "must",
    "my",
    "name",
    "nature",
    "near",
    "necessary",
    "need",
    "nervous",
    "never",
    "new",
    "newspaper",
    "next",
    "nice",
    "night",
    "no",
    "noise",
    "nose",
    "not",
    "nothing",
    "now",
    "number",
    "object",
    "obtain",
    "ocean",
    "off",
    "offer",
    "office",
    "often",
    "oil",
    "old",
    "on",
    "once",
    "one",
    "only",
    "open",
    "operation",
    "opinion",
    "opposite",
    "or",
    "orange",
    "order",
    "other",
    "out",
    "outside",
    "over",
    "own",
    "page",
    "pain",
    "paint",
    "pair",
    "paper",
    "parcel",
    "parent",
    "park",
    "part",
    "party",
    "pass",
    "passenger",
    "past",
    "path",
    "patient",
    "pay",
    "peace",
    "peaceful",
    "pen",
    "pencil",
    "people",
    "perfect (adj)",
    "perform",
    "perhaps",
    "person",
    "personal",
    "petrol",
    "phone",
    "picture",
    "piece",
    "pile",
    "pink",
    "pity",
    "place",
    "plain",
    "plan",
    "plane",
    "plant",
    "plate",
    "play",
    "player",
    "pleasant",
    "please",
    "pleasure",
    "plenty",
    "point",
    "police",
    "politics",
    "poor",
    "popular",
    "position",
    "possible",
    "post",
    "pound",
    "pour",
    "power",
    "practise",
    "prefer",
    "prepare",
    "present (adj)",
    "president",
    "press",
    "pretty",
    "price",
    "prison",
    "private",
    "prize",
    "probably",
    "problem",
    "produce",
    "product",
    "profit",
    "promise",
    "protect",
    "proud",
    "prove",
    "provide",
    "public",
    "pull",
    "purpose",
    "put",
    "question",
    "quick",
    "quiet",
    "quite",
    "race",
    "radio",
    "rain",
    "raise",
    "rather",
    "reach",
    "read",
    "ready",
    "real",
    "really",
    "reason",
    "receive",
    "recent",
    "recently",
    "record (n)",
    "red",
    "reduce",
    "refuse",
    "regard",
    "regular",
    "relationship",
    "religion",
    "remain",
    "remember",
    "remove",
    "repair",
    "repeat",
    "replace",
    "reply",
    "report",
    "request",
    "respect",
    "responsible",
    "rest",
    "restaurant",
    "result",
    "return",
    "rice",
    "rich",
    "ride",
    "right",
    "ring",
    "rise",
    "risk",
    "river",
    "road",
    "rock",
    "roll",
    "room",
    "rough",
    "round",
    "row",
    "rule",
    "run",
    "rush",
    "sad",
    "safe",
    "salt",
    "same",
    "save",
    "say",
    "school",
    "science",
    "score",
    "sea",
    "search",
    "season",
    "seat",
    "second",
    "secret",
    "secretary",
    "see",
    "seem",
    "sell",
    "send",
    "sense",
    "series",
    "serious",
    "serve",
    "service",
    "set",
    "several",
    "shall",
    "shape",
    "share",
    "sharp",
    "she",
    "ship",
    "shoe",
    "shoot",
    "shop",
    "short",
    "should",
    "shoulder",
    "show",
    "shut",
    "sick",
    "side",
    "sign",
    "silver",
    "similar",
    "simple",
    "since",
    "sing",
    "single",
    "sister",
    "sit",
    "situation",
    "size",
    "skirt",
    "sky",
    "sleep",
    "slow",
    "small",
    "smart",
    "smell",
    "smile",
    "smoke",
    "smooth",
    "snow",
    "so",
    "society",
    "soft",
    "soldier",
    "some",
    "something",
    "sometimes",
    "somewhere",
    "son",
    "song",
    "soon",
    "sorry",
    "sound",
    "south",
    "space",
    "speak",
    "special",
    "speech",
    "speed",
    "spend",
    "spoil",
    "sport",
    "spot",
    "spread",
    "spring",
    "square",
    "stand",
    "star",
    "start",
    "state",
    "station",
    "stay",
    "steal",
    "step",
    "still",
    "stone",
    "stop",
    "store",
    "story",
    "straight",
    "strange",
    "street",
    "strong",
    "student",
    "study",
    "subject (n)",
    "success",
    "successful",
    "such",
    "suddenly",
    "sugar",
    "suggest",
    "suit",
    "summer",
    "sun",
    "supply",
    "support",
    "sure",
    "surface",
    "sweet",
    "swim",
    "system",
    "table",
    "take",
    "talk",
    "tall",
    "taste",
    "tea",
    "teach",
    "teacher",
    "television",
    "tell",
    "temperature",
    "test",
    "than",
    "thank",
    "that",
    "the",
    "their",
    "then",
    "there",
    "these",
    "they",
    "thick",
    "thin",
    "thing",
    "think",
    "third",
    "this",
    "those",
    "though",
    "through",
    "ticket",
    "time",
    "tired",
    "today",
    "together",
    "toilet",
    "tomorrow",
    "too",
    "top",
    "touch",
    "town",
    "trade",
    "train",
    "travel",
    "tree",
    "trip",
    "trouble",
    "true",
    "trust",
    "try",
    "turn",
    "two",
    "type",
    "uncle",
    "under",
    "understand",
    "university",
    "until",
    "up",
    "upon",
    "use",
    "useful",
    "usual",
    "usually",
    "valley",
    "value",
    "variety",
    "various",
    "vegetable",
    "very",
    "view",
    "village",
    "virus",
    "visit",
    "voice",
    "vote",
    "wait",
    "walk",
    "wall",
    "want",
    "war",
    "warm",
    "wash",
    "watch",
    "water",
    "way",
    "we",
    "weather",
    "week",
    "welcome",
    "well",
    "west",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whose",
    "why",
    "wife",
    "wild",
    "will",
    "win",
    "window",
    "winter",
    "wish",
    "with",
    "without",
    "woman",
    "wonderful",
    "wood",
    "word",
    "work",
    "world",
    "would",
    "write",
    "wrong",
    "year",
    "yes",
    "yesterday",
    "you",
    "young",
    "your"
]
