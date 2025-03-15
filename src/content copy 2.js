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
    let prefix = get_prefix_from_input_field(inputField)
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
        inputField.dispatchEvent(new KeyboardEvent("keydown", { key: "a" })); 
        reset_all_values()
        // CursorIndex = doGetCaretPosition(inputField)
        // setCaretPosition(inputField, CursorIndex + moveCuorser)
        
        updateSuggestionsBox(
            prefix
        );


    } else if (keyPressed == "Enter"){
        
        word = document.getElementsByClassName(`SuggestionOption_${focusedSuggestionIndex}`)[0].textContent
        insertWord(word, prefix)
        
    }
  
})

document.addEventListener('click', (e) => { // click interactions
    
    console.log("click event : ", e)
    
    if (e.target.className.split("_")[0] == "SuggestionOption"){
        e.preventDefault()

        word = e.target.textContent
        insertWord(word, get_prefix_from_input_field(inputField))
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
    positionTheSuggestionBox()
}

function positionTheSuggestionBox() {

    if (window.getSelection().anchorNode) {
        let rect = window.getSelection().getRangeAt(0).getBoundingClientRect()
        suggestionBox.style.left = rect.left + 'px';
        suggestionBox.style.top = (rect.bottom + window.scrollY) + 'px';          
    } else {
        let rect = inputField.getBoundingClientRect();
        suggestionBox.style.left = rect.left + 'px';
        suggestionBox.style.top = (rect.bottom + window.scrollY) + 'px';    
    }

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

function insertWord(word, prefix) {

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Create text node and insert it
    const textNode = document.createTextNode(word.slice(prefix.length, word.length));
    range.insertNode(textNode);

    // Move the cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    hideSuggestions();
}
// function insertWord(word) {
//     if (!inputField) {
//         return
//     }
    
//     // get the text again, and complete the replace the last word
    
//     let text = readFunction(inputField)

//     let words = text.slice(0, CursorIndex)
//                     .split(/\s+/);

//     words[words.length - 1] = word;
//     text = words.join(' ') + text.slice(CursorIndex, text.length)
    
//     writeFunction(inputField, text);

//     focusedSuggestionIndex = 0
//     inputField.focus()

//     // inputField.setSelectionRange(0, text.length)
//     // inputField.selectionStart = words
//     //                                 .join(' ')
//     //                                 .length
//     // inputField.selectionEnd = inputField.selectionStart
//     console.log(words.join(' ').length)
//     console.log(text.length)
//     setCaretPosition(inputField, words.join(' ').length)

//     hideSuggestions();
// }

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
    // const dictionary = ['hello', 'help', 'helium', 'hero', 'hermit', 'hexagon']; // Extend this dynamically
    return dictionary.filter(word => word.startsWith(prefix)).slice(0, 5);
}


let dictionary = [
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

