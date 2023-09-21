/**
 * @fileoverview This file will give you autocompletion when typing in the query and search input fields
 * (all_items.html).
 */

autocomplete(document.getElementById("query"), words);
autocompleteWord(document.getElementById("search"), searchIDs)

/**
 * Autocomplete for words in while typing a query.
 * @param {object} inp The text field element
 * @param {object} arr The array of possible autocompleted values
 */
function autocomplete(inp, arr) {
  var currentFocus;
  /**
   * When someone writes in the text field, it will search for autocompletion words and show them.
   * @param {object} e the input event
   */
  inp.addEventListener("input", function (e) {
    // var a, b, i, val = this.value;
    var a, b, i, val = lastWord(this.value);
    /* close any already open lists of autocompleted values */
    closeAllLists();
    if (!val) { return false; }
    currentFocus = -1;
    /* create a DIV element that will contain the items (values) */
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /* append the DIV element as a child of the autocomplete container */
    this.parentNode.appendChild(a);
    /* for each item in the array... */
    for (i = 0; i < arr.length; i++) {
      /* check if the item starts with the same letters as the text field value */
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /* create a DIV element for each matching element */
        b = document.createElement("DIV");
        /* make the matching letters bold */
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /* insert a input field that will hold the current array item's value */
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /**
         * Insert the value for the autocomplete text field
         * @param {object} e the click event
         */
        b.addEventListener("click", function (e) {
          inp.value = removeLastWord(inp.value) + " " + this.getElementsByTagName("input")[0].value;
          /* close the list of autocompleted values,
          (or any other open lists of autocompleted values */
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  /**
   * When the down key is used, the next element will be highlighted
   * @param {object} e the down key event
   */
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /* If the arrow DOWN key is pressed,
      increase the currentFocus variable */
      currentFocus++;
      /* and and make the current item more visible */
      addActive(x);
    } else if (e.keyCode == 38) { //up
      /* If the arrow UP key is pressed,
      decrease the currentFocus variable */
      currentFocus--;
      /* and and make the current item more visible */
      addActive(x);
    } else if (e.keyCode == 13) {
      /* If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /* and simulate a click on the "active" item */
        if (x) x[currentFocus].click();
      }
    }
    else if (e.keyCode == 9) {
      /* If the TAB key is pressed,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /* and simulate a click on the "active" item */
        if (x) x[currentFocus].click();
      }
    }
  });

  /**
   * Classify an item as "active"
   * @param {HTMLCollection} x All DIV autocomplete items
   */
  function addActive(x) {
    /* a function to classify an item as "active" */
    if (!x) return false;
    /* start by removing the "active" class on all items */
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /* add class "autocomplete-active" */
    x[currentFocus].classList.add("autocomplete-active");
  }
  /**
   * Remove the "active" class from all autocomplete items
   * @param {HTMLCollection} x All DIV autocomplete items
   */
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  /**
   * Close all autocomplete lists in the document, except the one passed as an argument
   * @param {HTMLDivElement} elmnt autocomplete item (DIV) where is clicked on
   */
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /**
   * Close all lists when someone clicks on an autocomplete item.
   * @param {object} e The click event
   */
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

/**
 * Get the last word of string
 * @param {string} input the string of the input field
 * @returns {string} the last word of the string
 */
function lastWord(input) {
  var n = input.split(" ");
  return n[n.length - 1];
}

/**
 * Remove the last word of the string
 * @param {string} input the string of the input field
 * @returns {string} the string without the last word
 */
function removeLastWord(input) {
  var n = input.split(" ");
  n.pop();
  return n.join(" ");
}

/**
 * Autocomplete for words in the search input field.
 * @param {object} inp The text field element
 * @param {object} arr The array of possible autocompleted values
 */
function autocompleteWord(inp, arr) {
  var currentFocus;
  /**
   * When someone writes in the text field, it will search for autocompletion words and show them.
   * @param {object} e the event
   */
  inp.addEventListener("input", function (e) {
    var a, b, i, val = this.value;
    /* close any already open lists of autocompleted values */
    closeAllLists();
    if (!val) { return false; }
    currentFocus = -1;
    /* create a DIV element that will contain the items (values) */
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /* append the DIV element as a child of the autocomplete container */
    this.parentNode.appendChild(a);
    for (i = 0; i < arr.length; i++) {
      var word = arr[i];
      var pattern = new RegExp(val, "i");
      /* check if the item starts with the same letters as the text field value */
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /* create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /* make the matching letters bold:*/
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /* insert a input field that will hold the current array item's value */
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /**
         * Insert the value for the autocomplete text field
         * @param {object} e the click event
         */
        b.addEventListener("click", function (e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          /* close the list of autocompleted values,
          (or any other open lists of autocompleted values */
          closeAllLists();
        });
        a.appendChild(b);
      }
      /* check if the item contains the letters */
      else if (pattern.test(word)) {
        /* create a DIV element for each matching element */
        b = document.createElement("DIV");
        /* search for where the searched word occurs and make that part bold */
        var startIndex = 0;
        while ((match = pattern.exec(word)).index >= startIndex) {
          if (match.index > startIndex) {
            b.innerHTML = word.substr(startIndex, match.index);
          }
          /* make the matching letters bold */
          b.innerHTML += "<strong>" + arr[i].substr(match.index, val.length) + "</strong>";
          startIndex = match.index + val.length;
        }
        if (startIndex <= word.length) {
          b.innerHTML += word.substr(startIndex, word.length);
        }
        /* insert a input field that will hold the current array item's value */
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /* execute a function when someone clicks on the item value (DIV element) */
        /**
         * Insert the value for the autocomplete text field
         * @param {object} e the click event
         */
        b.addEventListener("click", function (e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          /* close the list of autocompleted values,
          (or any other open lists of autocompleted values */
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  /**
   * When the down key is used, the next element will be highlighted.
   * @param {object} e the down key event
   */
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /* If the arrow DOWN key is pressed,
      increase the currentFocus variable */
      currentFocus++;
      /* make the current item more visible */
      addActive(x);
    } else if (e.keyCode == 38) {
      /* If the arrow UP key is pressed,
      decrease the currentFocus variable */
      currentFocus--;
      /* make the current item more visible */
      addActive(x);
    } else if (e.keyCode == 13) {
      /* If the ENTER key is pressed, prevent the form from being submitted */
      e.preventDefault();
      if (currentFocus > -1) {
        /* simulate a click on the "active" item */
        if (x) x[currentFocus].click();
      }
    }
  });

  /**
   * Classify an item as "active".
   * @param {HTMLCollection} x All DIV autocomplete items
   */
  function addActive(x) {
    if (!x) return false;
    /* start by removing the "active" class on all items */
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /* add class "autocomplete-active" */
    x[currentFocus].classList.add("autocomplete-active");
  }

  /**
   * Remove the "active" class from all autocomplete items
   * @param {HTMLCollection} x All DIV autocomplete items
   */
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  /**
   * Close all autocomplete lists in the document, except the one passed as an argument
   * @param {HTMLDivElement} elmnt autocomplete item (DIV) where is clicked on
   */
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  /**
   * Close all lists when someone clicks on an autocomplete item.
   * @param {object} e The click event
   */
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}
