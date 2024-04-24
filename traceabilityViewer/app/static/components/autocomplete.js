app.component("autocomplete", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
    <a id="info-autocomplete" v-if="sentenceAllowed"
       class="btn border border-secondary m-1"
       style="--bs-btn-border-radius: 50%; --bs-btn-padding-y: 0; --bs-btn-padding-x: 6px; --bs-btn-font-size: .75rem;"
       data-bs-toggle="tooltip"
       data-bs-title="Link to Cypher cheat sheet."
       href="https://neo4j.com/docs/cypher-cheat-sheet/5/neo4j-community/"
       target="_blank">?</a>
    <div class="w-100 autocomplete" tabindex="0"
        @focusin="startFocus"
        @focusout="stopFocus"
    >
        <input class="form-control w-80" type="text" :value="fullInput"
            @keydown.enter="enter"
            @keydown.tab.prevent="tab"
            @keydown.down="down"
            @keydown.up="up"
            @input="change($event, 0)"
            @keydown.left="change($event, -1)"
            @keydown.right="change($event, 1)"
            @click="change($event, 0)"
        />
        <ul v-show="openSuggestion" class="list-group">
            <li
                v-for="(innerhtml, suggestion, index) in matches"
                class="list-group-item list-group-item-action"
                v-bind:class="{'active': isActive(index), 'aria-current': isActive(index)}"
                :key="suggestion"
                @click="suggestionClick(index)"
                v-html="innerhtml"
            >
            </li>
        </ul>
        <button @click="submitted" class="btn mt-1 mb-1 btn-primary" :disabled="isDisabled">Submit</button>
    </div>
    `,
  props: {
    suggestions: {
      type: Array,
      required: true,
      default: () => [],
    },
    sentenceAllowed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  emits: ["loading", "onSubmit", "onAlert"],
  setup(props, { emit }) {
    var fullInput = Vue.ref("");
    var search = Vue.ref("");
    var pointer = 0
    var isOpen = Vue.ref(false);
    var current = Vue.ref(0);
    var isFocussed = Vue.ref(false);
    var isDisabled = Vue.ref(false)

    //Filtering the word suggestion based on the input
    var matches = Vue.computed(() => {
      if (search.value == "") {
        return [];
      }

      matchedStartingWith = {}
      OrderedMatchedItems = {}
      var pattern = new RegExp(search.value.replace(/['"]/g,""), "gi");
      for (word of props.suggestions){
        let stylesMatchedItem = ""
        let wordUpperCase = word.toUpperCase();
        /* check if the word starts with the same letters as the value of the input field */
        /* if it starts with the same letters, these suggestions are the first ones in the list */
        if (word.toUpperCase().startsWith(search.value.toUpperCase())) {
          newItem = Object()
          stylesMatchedItem = wordUpperCase.replaceAll(search.value.toUpperCase(), "<strong>"
                                                       + search.value.toUpperCase() + "</strong>");
          newItem[word] = stylesMatchedItem;
          OrderedMatchedItems = Object.assign(newItem, OrderedMatchedItems);
        }
        /* check if the item contains the value of the input field somewhere else, and add them at the end of the list */
        else if (pattern.test(word)) {
          stylesMatchedItem = wordUpperCase.replaceAll(search.value.toUpperCase(), "<strong>"
                                                       + search.value.toUpperCase() + "</strong>");
          OrderedMatchedItems[word] = stylesMatchedItem
        }
      }
      return OrderedMatchedItems
    });

    // The flag
    var openSuggestion = Vue.computed(() => {
      if (Object.keys(matches.value).length > 0 && isOpen.value && isFocussed.value) {
        return true;
      }
      current.value = 0;
      return false;
    });

    function startFocus() {
      isFocussed.value = true;
    }

    function stopFocus() {
      isFocussed.value = false;
    }

    function replace_with_selected_value(index){
      selectedValue = Object.keys(matches.value)[index];
      if (props.sentenceAllowed) {
        fullInput.value = replace(selectedValue);
      } else {
        fullInput.value = selectedValue;
      }
    }

    // When enter pressed on the input
    function enter() {
      if (isOpen.value && current.value >= 0) {
        replace_with_selected_value(current.value);
      } else {
        submitted();
      }
      current.value = 0;
      isOpen.value = false;
    }

    // When tab pressed on the input
    function tab() {
      if (isOpen.value && current.value >= 0) {
        replace_with_selected_value(current.value);
      }
      current.value = 0;
      isOpen.value = false;
    }

    // When up pressed while suggestions are open
    function up() {
      if (current.value > 0) current.value--;
    }

    // When up pressed while suggestions are open
    function down() {
      if (current.value < Object.keys(matches.value).length - 1) current.value++;
    }

    // For highlighting element
    function isActive(index) {
      return index === current.value;
    }

    // When one of the suggestion is clicked
    function suggestionClick(index) {
      replace_with_selected_value(index)
      current.value = 0;
      isOpen.value = false;
    }

    // When the button is pressed
    async function submitted() {
      emit("loading", true);
      isDisabled.value = true;
      show = false;
      nodes = [];
      let links = [];
      emit("onSubmit", { nodes: nodes, links: links });
      let endpoint = ""
      if (props.sentenceAllowed) {
        // query
        endpoint = "/query/"
        // }
      } else {
        // search ID
        endpoint = "/search/";
      }
      if (endpoint){
        try {
          data = await dataRequest(endpoint + fullInput.value);
          emit("onSubmit", data.data);
          emit("loading", false);
          isDisabled.value = false;
        } catch (error) {
          emit("loading", false);
          isDisabled.value = false;
          if (error.response.status != 400){
            var wnd = window.open("", "_blank");
            wnd.document.write(error.response.data);
          }
          else {
            emit("onAlert", error.response.data);
          }
        }
      }
    }

    // When the input changes
    function change(event, correctionNumber){
      isOpen.value = true;
      if (props.sentenceAllowed) {
        fullInput.value = event.target.value;
        if ( 0 > event.target.selectionStart + correctionNumber ||  event.target.selectionStart + correctionNumber > fullInput.value.length){
          fullInput.value = event.target.value;
          pointer = event.target.selectionStart
          findSearchValue()
        }
        else {
          pointer = event.target.selectionStart + correctionNumber
          findSearchValue()
        }
      } else {
        fullInput.value = event.target.value;
        search.value = event.target.value;
      }
    }

    function findSearchValue(){
      // substring from pointer till the end
      const n = fullInput.value.substring(pointer).match(/^[\w\d\-_'"]+/)
      // substring from begin till pointer
      const p = fullInput.value.substring(0, pointer).match(/[\w\d\-_'"]+$/)
      if(!p && !n) {
        search.value = ""
      }
      search.value = (p || '') + (n || '')
    }

    function replace(selectedValue){
      endIndex = fullInput.value.substring(pointer).indexOf(' ');
      startIndex = fullInput.value.substring(0, pointer).lastIndexOf(' ');
      // correct when pointer is at the end
      if (endIndex == -1){
        endIndex = 0
      }
      // correct when pointer is at the beginning
      if (startIndex == -1){
        startIndex = 0
      }

      return [fullInput.value.substring(0, startIndex),
                      selectedValue,
                      fullInput.value.substring(pointer + endIndex)
                     ].join(" ").replaceAll(/\s+/g," ");
    }

    return {
      fullInput,
      search,
      isOpen,
      current,
      isFocussed,
      matches,
      openSuggestion,
      isDisabled,
      startFocus,
      stopFocus,
      enter,
      tab,
      up,
      down,
      isActive,
      suggestionClick,
      submitted,
      change,
    };
  },
});
