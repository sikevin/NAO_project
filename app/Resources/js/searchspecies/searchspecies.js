import eventsConstructor from '../events';
import $ from 'jquery';
import birdTemplate from './birdTemplate';
import difference from 'lodash.difference';

// ============= MAIN ================


// INIT function for page "searchspecies"
export function initSearchPage() {
    console.log('hello Im main');
    var events = eventsConstructor();
    var template = Handlebars.compile(birdTemplate);
    // print(template({'birds': [{'name':'aaaaaa'}, {'name': 'bbbbbbbb'}]}))

    var inputFormObj = inputForm($('#search-input'), $('#suggestions-container'), events);
    var speMod = speciesModel(events);
    var speView = speciesView(template);

    events.on('inputChangeEvent', speMod.updateSuggestionsArray);
    events.on('speciesUpdatedEvent', inputFormObj.updateCurrentSuggestions);
    events.on('speciesUpdatedEvent', speView.renderSpecies);
}

// INIT function for navbar search field, every pages
export function initNavbarSearch() {
    var events = eventsConstructor();
    var inputFormObj = inputForm($('#nav-search-input'), $('#nav-suggestions-container'), events, $('#input-arrow'));
    var speMod = speciesModel(events);

    events.on('inputChangeEvent', speMod.updateSuggestionsArray);
    events.on('speciesUpdatedEvent', inputFormObj.updateCurrentSuggestions);
}

// ============= SPECIES MODEL ================

function speciesModel(events) {
    var allSpecies = hydrateSpecies();
    var allPatternMatchingSpecies = [];
    function uppdateSuggestionsArray(currentString) {
            allPatternMatchingSpecies = [];
            var regexString = '^' + currentString.trim() ;
            var regex = new RegExp(regexString, 'i');
            for (var i = 0; i < allSpecies.length; i++) {
                if (regex.test(allSpecies[i].scientificName)) {
                    allPatternMatchingSpecies.push(allSpecies[i]);
                }
            }
            events.emit('speciesUpdatedEvent', allPatternMatchingSpecies);
    }

    // makes ajax query and hydrate allSpeciesArray
    function hydrateSpecies() {
        //TODO: ajax query
        //fixte
        return getAllSpeciesFromDB();
    }
    return {
        allCurrentSuggestionsArray: allPatternMatchingSpecies,
        updateSuggestionsArray: uppdateSuggestionsArray
    }
}

// ============= SPECIES VIEW ================

function speciesView(template) {
    const birdTemplate = template;
    const $resultRow = $('#result-row');
    // to be hydrated just before speciesModel.allPatternMatchingSpecies is updated;
    // then the difference is made between prev state et new state for optimization reasons for rendering AND DO NOT FORGET TO REMOVE
    // diff PREV - NEW => remove

    let allPatternMatchingSpeciesPrev = [];

    function renderSpecies(speciesToRender) {
        $resultRow.empty();
        function birdObject(scientificName, id) {
            this.scientificName = scientificName;
            this.id = id;
        }
        let birdObjectsArray = [];
        for (let i = 0; i < speciesToRender.length; i++) {
            let bird = new birdObject(speciesToRender[i].scientificName, speciesToRender[i].id);
            birdObjectsArray.push(bird);
        }
        let html = birdTemplate({'birds': birdObjectsArray});
        $resultRow.append(html);
    }
    return {
        renderSpecies: renderSpecies
    }
}


function inputForm($input, $suggestionsContainer, events, $inputArrow) {
    var currentSuggestionsArrayWithId = [];
    var currentSuggestionsArray = [];
    var currentlyHighlighted = -1;

    //DOM EVENTS BINDING (INPUT)
    $input.on('input', function(e){
        print('input')
        currentlyHighlighted = -1;
        var currentValue = $(e.target).val();
        events.emit('inputChangeEvent', currentValue);
    });
    $input.on('focusout', function() {
        $suggestionsContainer.empty();
        currentlyHighlighted = [];
    });
    $(document).on('keydown', function(e) {
        var keyPressed = String.fromCharCode(e.keyCode);
        var suggestionsLength =  currentSuggestionsArray.length;

        if (suggestionsLength !== 0 && $input.is(":focus")) {
            // si e.which == 13 -> $('.selected').text() dans input.val()
            // ENTER
            if (e.which == 13) {
                // vérifier qu'un élément a bien la classe selected
                if ($('.selected')) {
                    $input.val($('.selected').text());
                    events.emit("inputChangeEvent", $input.val());
                    if ($inputArrow) {
                        let id = currentSuggestionsArrayWithId.find((el) => el.scientificName == $input.val().trim()).id;
                        print(id)
                        redirectToSpeciessearch(id);
                    }
                } else {
                    let id = currentSuggestionsArrayWithId.find((el) => el.scientificName == $input.val().trim()).id;
                    redirectToSpeciessearch(id);
                }
            }
            // UP
            if (keyPressed == '&') {
                if (currentlyHighlighted !== 0) {
                    currentlyHighlighted = currentlyHighlighted - 1;
                }
                highlightSuggestion(suggestionsLength)
            }
            // DOWN
            if (keyPressed == '(') {
                if (currentlyHighlighted < suggestionsLength - 1) {
                    currentlyHighlighted++;
                }
                highlightSuggestion(suggestionsLength)
            }
        } else {
            if ($input.is(":focus") && e.which == 13) {
                redirectToSpeciessearch();
            }
        }
    });
    // DOM EVENT BINDING ($SUBMITBUTTON)
    if ($inputArrow) {
        $inputArrow.on('click', function() {
            print(currentSuggestionsArray)
            let inputVal = $input.val().trim();
            if (currentSuggestionsArray.length == 0) {
                redirectToSpeciessearch();
            } else {
                currentSuggestionsArray.forEach(function(suggestion){
                    let trimmed = suggestion.trim();
                    let regex = new RegExp(trimmed, 'i');
                    if(regex.test(inputVal)) {
                        let id = currentSuggestionsArrayWithId.find((el) => el.scientificName == suggestion).id;
                        redirectToSpeciessearch(id);
                        print(trimmed)
                    } else {
                        redirectToSpeciessearch();
                    }
                })
            }

        });
    }

    // redirects by manipulating speciesSearchLink and triggering click
    function redirectToSpeciessearch(id) {
        let ssl = document.getElementById('speciesSearchLink');
        if (id) {
            ssl.href = ssl.href + '/' + id;
            ssl.click();
        } else {
            ssl.click();
        }
    }

    function updateCurrentSuggestions(allPatternMAtchingSpecies) {
        currentSuggestionsArrayWithId = allPatternMAtchingSpecies;
        currentSuggestionsArray = allPatternMAtchingSpecies.slice(0,4).map((bird) => bird.scientificName);
        renderSuggestions(currentSuggestionsArray);
    }

    // view functions
    function renderSuggestions(currentSuggestionsArray) {
        $suggestionsContainer.empty();
        for (var i = 0; i < currentSuggestionsArray.length; i++) {
            var rawSuggestion = currentSuggestionsArray[i];
            var suggestion = '<li class="suggestion">' + rawSuggestion + '</li>';
            $(suggestion).appendTo($input)
            // print(suggestion)
            $suggestionsContainer.append(suggestion);
        }
    }
    function highlightSuggestion() {
        // if (index !== -1) {// new highlight
        //     var $liToHighlight = $suggestionsContainer.find('li').eq(index);
        //     $liToHighlight.css('background-color', 'blue');
        // }
        if (currentlyHighlighted !== -1) {
            var $liToHighlight = $suggestionsContainer.find('li').eq(currentlyHighlighted).addClass('selected');
            $liToHighlight.next().removeClass('selected');
            $liToHighlight.prev().removeClass('selected');
        }
    }

    return {
        inputElement: $input,
        updateCurrentSuggestions: updateCurrentSuggestions
    }
}





// AJAX :: bird objects array
function getAllSpeciesFromDB() {

    var species = [];

    $.get('api/getallbirds', function(data){
        data.data.forEach(function(bird){
            var parsed = JSON.parse(bird);
            let scientificName = parsed.scientificName;
            // Strip first descriptor if he's included in scientificName
            var indexOfParenthesis = scientificName.indexOf("(")
            if (indexOfParenthesis !== -1) {
                scientificName = scientificName.substr(0, indexOfParenthesis).trim();
            }
            let speciesObject = {
                scientificName: scientificName,
                id: parsed.id
            };
            species.push(speciesObject);
        });
        console.log(species);
    });
    return species;
}


function print(string) {
    console.log(string)
}


