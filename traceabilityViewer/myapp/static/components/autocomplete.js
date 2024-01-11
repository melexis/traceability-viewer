app.component("autocomplete", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
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
        style="width:80%; position: absolute; z-index: 999;"
        >
            <li
                v-for="(suggestion, index) in matches"
                class="list-group-item list-group-item-action"
                v-bind:class="{'active': isActive(index), 'aria-current': isActive(index)}"
                :key="suggestion"
                @click="suggestionClick(index)"
            >
            [[ suggestion ]]
            </li>
        </ul>
        <button @click="submitted" class="btn mt-1 mb-1 btn-primary">Submit</button>
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

    //Filtering the word suggestion based on the input
    var matches = Vue.computed(() => {
      if (search.value == "") {
        return [];
      }
      return props.suggestions.filter((item) => {
        if (item.toLowerCase().includes(search.value.toLowerCase())) {
          return item;
        }
      });
    });

    // var styledAndOrderedMatches = Vue.computed(() => {
    //     newMatches = []
    //     console.log(matches)
    //     if (matches.length > 0){
    //         for (match of matches){
    //             console.log(match)
    //             if (match.substring(0, search.value.length).toUpperCase() == search.value.toUpperCase()) {
    //                 styledMatch = "<strong>" + match.substr(0, search.value.length) + "</strong>";
    //                 styledMatch += match.substr(search.value.length);
    //                 newMatches.push(styledMatch)
    //             }
    //         }
    //     }
    //     console.log(newMatches)
    //     return newMatches
    // })

    // The flag
    var openSuggestion = Vue.computed(() => {
      if (matches.value.length > 0 && isOpen.value && isFocussed.value) {
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
        search.value = matches.value[current.value];
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
        search.value = matches.value[current.value];
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
      if (current.value < matches.value.length - 1) current.value++;
    }

    // For highlighting element
    function isActive(index) {
      return index === current.value;
    }

    // When one of the suggestion is clicked
    function suggestionClick(index) {
      search.value = matches.value[index];
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
      show = false;
      nodes = [];
      let links = [];
      emit("onSubmit", { nodes: nodes, links: links });
      let endpoint = ""
      if (props.sentenceAllowed) {
        // query
        const invalidWords = ["SET ", "CREATE ", "DELETE", "MERGE ", "REMOVE"]
        if (fullInput.value === "") {
          emit("onAlert", {title: "The input is empty. Please enter a Cypher query.", message: ""});
        }
        else if (invalidWords.some((substring) => fullInput.value.toUpperCase().includes(substring))) {
          emit("onAlert", {title: "SET, CREATE, DELETE, MERGE or REMOVE cannot be used!", message: ""});
        } else {
          endpoint = "query/"
        }
      } else {
        // search ID
        if (props.suggestions.includes(fullInput.value)) {
          endpoint = "search/";
        }
      }
      if (endpoint){
        try {
          data = await postDataRequest(endpoint, fullInput.value);
          console.log(data);
          nodes = data.data.nodes;
          links = data.data.links;
          emit("onSubmit", { nodes: nodes, links: links });
          emit("loading", false);
        } catch (error) {
          console.log(typeof error.response.data)
          console.log(error.response.data)
          emit("onAlert", error.response.data);
          console.log(error.response)
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

    // selection = ""
    return {
      fullInput,
      search,
      isOpen,
      current,
      isFocussed,
      matches,
      openSuggestion,
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
