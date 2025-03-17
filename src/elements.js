export let suggestionBox = document.createElement('div');

suggestionBox.className = "suggestionBox"

suggestionBox.style.position    = 'absolute'
suggestionBox.style.backgroundColor  = '#1e1e1e'
suggestionBox.style.color       = 'white'
suggestionBox.style.border      = '1px solid #555'
suggestionBox.style.display     = 'none'
suggestionBox.style.fontFamily  = 'monospace'
suggestionBox.style.fontSize  = (20 * window.outerHeight / 1000)+ "px"
// suggestionBox.style.fontSize  = (window.outerHeight * 0.05) + "px"

suggestionBox.style.zIndex      = '1000000'
suggestionBox.style.minWidth    = '20%'
suggestionBox.style.padding    = '5px'
suggestionBox.style.borderRadius    = '10px'
suggestionBox.style.overflowY = "auto";
// suggestionBox.style.height = "100px";



export let suggestionOption = document.createElement('div');

suggestionOption.style.padding = '2px';
suggestionOption.style.paddingLeft = '10px';
suggestionOption.style.cursor = 'pointer';
suggestionOption.style.borderRadius = '5px';
suggestionOption.style.transition  = 'background-color 100ms ease'
