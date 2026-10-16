window.onload = function() {
    setTheme();
}


function setTheme() {
    let chosenTheme = localStorage.getItem('altExtractorTheme');
    let defaultTheme = 'orange-light';
    let themeSelect = document.getElementById('themeSelect');

    if (chosenTheme) {
        themeSelect.value = localStorage.getItem('altExtractorTheme');
    } else {
        themeSelect.value = defaultTheme;
    }
}

// Extract button
function getAlternatives() {
    // Clear the div of previous values
    document.getElementById('superDiv').innerText = '';     

    // Get the snippet
    let text = document.getElementById('textInput').value; 
    
    // Split snippet by paragraph
    let parsedByLine = text.split(/\r?\n/);   
    
    // Save only the first paragraph
    let firstLine = parsedByLine[0];      
    
    // Split first paragraph at the colon
    // - Scenario for most DLs, including:
    let parsedByColon = firstLine.split(":");

    // Adjust delimiter (intended as backup if no colon) 
    // - Exclusively for behavioral health TX, ex NF58
    if(parsedByColon.length === 1) {
        parsedByColon = firstLine.split('such as, but not limited to,');
    }

    // Adjust delimiter again (final backup backup)
    if(parsedByColon.length === 1) {
        parsedByColon = firstLine.split('such as');
    }

    // Return error if blank or no appropriate delimiter
    if(parsedByColon == '') {
        document.getElementById('superDiv').innerText = "Invalid entry. No text to evaluate. ";
    } else if(parsedByColon.length === 1) {
        document.getElementById('superDiv').innerText = "Invalid entry. Please add a delimiter (i.e. a colon) before the first drug name.";
    } else if(parsedByColon[1] == '') {
        document.getElementById('superDiv').innerText = "Invalid entry.";
    }
    
    // From the first paragraph, save everything after the first colon
    let afterColon = parsedByColon.slice(1);
    
    // If there were multiple colons (i.e. multiple arrays), create one string.
    let afterColonJoined = afterColon.join(' , ');
    
    // Split up drug names using commas as delimiter
    let drugList = afterColonJoined.split(',');  
    
    // Defined for future use
    let noSuchAs = [];
    let noSeparately = [];
    let allDrugs = [];
    let allDrugsNoNumbers = [];
    let dosageFormulationsList = [
        'capsule',
        'capsules',
        'diskus',
        'diskus)',
        'flexpen',
        'flextouch',
        'penfill',
        'penfill)',
        'suspension',
        'tablet',
        'tablets',
    ];

    // Additional split modifiers
    for(i = 0; i < drugList.length; i++) {
        let noSuchAsTemp = drugList[i].split("such as");
        for(k = 0; k < noSuchAsTemp.length; k++) {
            noSuchAs.push(noSuchAsTemp[k]);
        };            
    }

    // Additional split modifiers
    for(i = 0; i < noSuchAs.length; i++) {
        let noSeparatelyTemp = noSuchAs[i].split("separately in addition to");
        for(k = 0; k < noSeparatelyTemp.length; k++) {
            noSeparately.push(noSeparatelyTemp[k]);
        };            
    }
    

    // How to handle 'and'
    for(i = 0; i < noSeparately.length; i++) {
        // Handling 'carbidopa and levodopa'
        // If current element does not start with 'carbidopa', split element at 'and', add both entries to the new drug list.
        if(noSeparately[i].slice(0, 10) !== ' carbidopa') {
        
            // If the word 'and' is present, split up the element (also removes 'and'). Creates an array. Also works if no 'and' present.           
            let newDrugsList = noSeparately[i].split(" and ");
            
            // Create a new drug list of items (no array within an array problem). Works if there are one or two elements in newDrugsList.
            for(k = 0; k < newDrugsList.length; k++) {
                allDrugs.push(newDrugsList[k]);
            };
        
        // If current element starts with 'carbidopa', add the whole entry to the new list. Works for 'carbidopa and levodopa' and 'carbidopa / levodopa'.
        } else {
            allDrugs.push(drugList[i]);
        }
    }

    // Remove extra text
    for (i=0; i < allDrugs.length; i++) {
        allDrugs[i] = allDrugs[i].replace('(', '');
        allDrugs[i] = allDrugs[i].replace(')', '');
        allDrugs[i] = allDrugs[i].replace('[', '');
        allDrugs[i] = allDrugs[i].replace(']', '');

        // Going longest to shortest, otherwise shrter text would leave short text blobs from longer text
        allDrugs[i] = allDrugs[i].replace('the following medications may be requested through a prior authorization for members age 35', ''); // Acne, topical, age 35 and older                
        allDrugs[i] = allDrugs[i].replace('this medication may be requested through a prior authorization after trial', ''); // Brand products NF305
        allDrugs[i] = allDrugs[i].replace('this medication may be requested through a prior authorization', ''); // Brand products NF305
        allDrugs[i] = allDrugs[i].replace('may be requested through a prior authorization after trial', ''); // Brand products, continued NF266
        allDrugs[i] = allDrugs[i].replace('failure of the above preferred alternatives', ''); // Brand products, continued (trial AND failure)
        allDrugs[i] = allDrugs[i].replace('failure of the above preferred medications', '');
        allDrugs[i] = allDrugs[i].replace('the following may be requested through prior authorization', '');
        allDrugs[i] = allDrugs[i].replace('the individual components of the requested medication', ''); // i.e. Diclegis 
        allDrugs[i] = allDrugs[i].replace('all may be requested through a prior authorization', ''); // i.e. Dry eyes (Eysuvis, Tyrvaya, Cequa, Vevye, Tryptyr)
        allDrugs[i] = allDrugs[i].replace('may be requested through a prior authorization', '');
        allDrugs[i] = allDrugs[i].replace('may be requested through prior authorization', '');
        allDrugs[i] = allDrugs[i].replace('or inability to use all alternatives', '');
        allDrugs[i] = allDrugs[i].replace('taken together at the same time', ''); // i.e. Diclegis
        allDrugs[i] = allDrugs[i].replace('the individual ingredients ', '');
        allDrugs[i] = allDrugs[i].replace('older', ''); // Acne, topical, age 35 and older
    }

    // Polish on items and the array
    for(i=0; i < allDrugs.length; i++) {

        // Remove spaces at beginning/end of each item
        allDrugs[i] = allDrugs[i].trim();
            
        // Capitalize each item
        allDrugs[i] = allDrugs[i].charAt(0).toUpperCase() + allDrugs[i].slice(1); 

        // Remove period at end of item (not using 'replace' as decimals are needed)
        if(allDrugs[i].endsWith('.')) {
            allDrugs[i] = allDrugs[i].slice(0, -1);
        }
    };

    //Removing entries
    for(i=0; i < allDrugs.length; i++) {
        // Remove blank entries
        if (allDrugs[i] === '') {

            // Remove item from array
            allDrugs.splice(i, 1);

            //Reset i
            i--;
        }

    }

    // Check for items that are numbers only, add them to previous item in array.
    // - e.g. keeps 'brimonidine (0.1%, 0.15%, 0.2%) solution' as one entry instead of splitting at commas
    for(i = 0; i < allDrugs.length; i++) {

        // regex expression is / ... /, ^ first element, \d is digit (0-9)
        if(/^\d/.test(allDrugs[i])) {
            let previousElement = i-1;

            // Combine elements. 
                // Example, if i is index 5 (10 mg), previousElement would be index 4 (glipizide 2.5 mg). 
                // splice will add a new element at index 4 (glipizide 2.5 mg, 10 mg), pushing contents of previousElement (glipizide 2.5 mg) to index 5, and i (10 mg) to 6.
                // splice will then delete the 2 elements after index 4 (glipizide 2.5 mg, and 10 mg), with combined product remaining.
            allDrugs.splice(

                // Add new element before the previous entry 
                previousElement, 

                // Delete the previous entry and the current entry
                2, 

                // Create new element that combines previous entry and current entry
                allDrugs[previousElement] + ", " + allDrugs[i]);

            // Reset i, otherwise will skip an item
            i--;
        }
    }

    // Combine dosage forms, separate by a comma.
    // - e.g. keeps 'Novolog (vials, Flexpen, Penfill)' as a single entry
    for(i = 0; i < allDrugs.length; i++) {
        let lowerCaseItem = allDrugs[i].toLowerCase();
        if (dosageFormulationsList.includes(lowerCaseItem)) {
            let previousElement = i-1;
            // Combine elements. 
            allDrugs.splice(previousElement, 2, allDrugs[previousElement] + ", " + allDrugs[i]);

            // Reset i, otherwise will skip an item
            i--;
        }
    }
    
    // Sort alphabetically
    let drugListSorted = allDrugs.sort();     

    // Add each drug to the page
    for(i = 0; i < allDrugs.length; i++) {     
        // Create checkbox    
        let check = document.createElement('input');
        check.type = 'checkbox';

        // Text for checkbox (i.e. drug name)
        let drugNode = document.createTextNode(allDrugs[i]);
        
        // Add checkbox and text to the label
        let newLabel = document.createElement('label');              
            newLabel.appendChild(check);
            newLabel.appendChild(drugNode);
            
        let outputDiv = document.getElementById('superDiv');
        // Add spacing between lines    
            outputDiv.classList.add('line-spacing');   
            
        // Add drug name to the div
            outputDiv.appendChild(newLabel);

        // Add new line (break) after drug name
            let bk = document.createElement('br');
            outputDiv.appendChild(bk);          
    };
}

// Clear button: Clears textarea input and the output, brings focus to the textarea.
function clearTextarea() {
    document.getElementById('textInput').value = '';
    document.getElementById('superDiv').innerText = '';
    document.getElementById('textInput').focus();
}

/* ||| Theme changer */
function changeTheme(theme) { 
    let htmlTag = document.getElementsByTagName("html")[0];
    
    if (htmlTag.hasAttribute("data-theme")) { // Check for non-default theme
        htmlTag.removeAttribute("data-theme"); // Remove theme
    }
    htmlTag.setAttribute("data-theme", theme); // Add new theme
    localStorage.setItem('altExtractorTheme', theme); // Save theme
    }

const savedTheme = localStorage.getItem('altExtractorTheme');
document.getElementsByTagName("html")[0].setAttribute("data-theme", savedTheme); // Add previously saved theme

function copyText() {
    let textToCopy = document.getElementById('textInput');
    navigator.clipboard.writeText(textToCopy.value);
    showToast('Copied text to clipboard!');
}

// Show or hide extras
function showList() {
    let target = 'extrasDiv';
    let div = document.getElementById(target);

    let add = target + 'Add';
    let addSpan = document.getElementById(add);
    
    let remove = target + 'Remove'
    let removeSpan = document.getElementById(remove);

    div.classList.toggle('hideContent');
    div.classList.toggle('showContent');

    addSpan.classList.toggle('hideContent');
    addSpan.classList.toggle('showContent');

    removeSpan.classList.toggle('hideContent');
    removeSpan.classList.toggle('showContent');
}

function showToast(text) {
    let toast = document.getElementById('toastNotification');
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
