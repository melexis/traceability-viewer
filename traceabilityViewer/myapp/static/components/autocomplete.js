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
            @input="change"
        />
        <ul v-show="openSuggestion" class="list-group"

        >
            <li
                v-for="(innerhtml, suggestion, index) in matches"
                class="list-group-item list-group-item-action"
                v-bind:class="{'active': isActive(index), 'aria-current': isActive(index)}"
                :key="suggestion"
                @click="suggestionClick(index)"
                v-html="innerhtml"
            >
            [[ suggestion ]]
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
      var pattern = new RegExp(search.value, "gi");
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
      console.log(OrderedMatchedItems)
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
    // When enter pressed on the input
    function enter() {
      if (isOpen.value && current.value >= 0) {
        search.value = Object.keys(matches.value)[current.value];
        if (props.sentenceAllowed) {
          words = fullInput.value.split(" ");
          words = words.slice(0, words.length - 1);
          words.push(search.value);
          fullInput.value = words.join(" ");
        } else {
          fullInput.value = search.value;
        }
      } else {
        submitted();
      }
      current.value = 0;
      isOpen.value = false;
    }

    // When tab pressed on the input
    function tab() {
      if (isOpen.value && current.value >= 0) {
        search.value = Object.keys(matches.value)[current.value];
        if (props.sentenceAllowed) {
          words = fullInput.value.split(" ");
          words = words.slice(0, words.length - 1);
          words.push(search.value);
          fullInput.value = words.join(" ");
        } else {
          fullInput.value = search.value;
        }
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
      search.value = Object.keys(matches.value)[index];
      if (props.sentenceAllowed) {
        words = fullInput.value.split(" ");
        words = words.slice(0, words.length - 1);
        words.push(search.value);
        fullInput.value = words.join(" ");
      } else {
        fullInput.value = search.value;
      }
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
    function change(event) {
      isOpen.value = true;
      if (props.sentenceAllowed) {
        fullInput.value = event.target.value;
        words = event.target.value.split(" ");
        search.value = words[words.length - 1];
      } else {
        fullInput.value = event.target.value;
        search.value = event.target.value;
      }
    }

    // Vue.onMounted(function (){
    //   const tooltip = new bootstrap.Tooltip(document.getElementById("info-autocomplete"));
    // });

    // selection = ""
    return {
      fullInput,
      search,
      isOpen,
      current,
      isFocussed,
      matches,
      openSuggestion,
      isDisabled,
      // styledAndOrderedMatches,
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
