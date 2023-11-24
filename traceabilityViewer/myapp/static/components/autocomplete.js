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
            @keydown.tab.prevent="enter"
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
        <button @click="onSubmit" class="btn mt-1 mb-1 btn-primary">Submit</button>
    </div>
    `,
    props: {
        suggestions: {
            type: Array,
            required: true,
            default: () => []
        },
        sentenceAllowed: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    setup(props) {
        var fullInput = Vue.ref("")
        var search = Vue.ref("")
        var isOpen = Vue.ref(false)
        var current = Vue.ref(-1)
        var isFocussed = Vue.ref(false)

        //Filtering the word suggestion based on the input
        var matches = Vue.computed(() => {
            if (search.value == ''){
                return []
            }
            return props.suggestions.filter(item => {
                if (item.toLowerCase().includes(search.value.toLowerCase())){
                    return item
                }
            })
        })

        // The flag
        var openSuggestion = Vue.computed( () => {
            if (matches.value.length > 0 && isOpen.value && isFocussed.value){
                return true
            }
            current.value = -1
            return false
        })

        function startFocus(){
            isFocussed.value=true
        }
        function stopFocus(){
            isFocussed.value=false
        }
        // When enter pressed on the input
        function enter() {
            if (isOpen.value && current.value>=0){
                search.value = matches.value[current.value];
                if (props.sentenceAllowed){
                    words = fullInput.value.split(" ")
                    words = words.slice(0, words.length - 1)
                    words.push(search.value)
                    fullInput.value = words.join(" ")
                }
                else {
                    fullInput.value = search.value
                }
            }
            else {
                onSubmit()
            }
            current.value = -1
            isOpen.value = false;
        }

        // When up pressed while suggestions are open
        function up() {
            if(current.value > 0)
                current.value --;
        }

        // When up pressed while suggestions are open
        function down() {
            if(current.value < matches.value.length - 1)
                current.value ++;
        }

        // For highlighting element
        function isActive(index) {
            return index === current.value;
        }

        // When one of the suggestion is clicked
        function suggestionClick(index) {
            search.value = matches.value[index];
            if (props.sentenceAllowed){
                words = fullInput.value.split(" ")
                words = words.slice(0, words.length - 1)
                words.push(search.value)
                fullInput.value = words.join(" ")
            }
            else {
                fullInput.value = search.value
            }
            current.value = -1
            isOpen.value = false;
        }

        // When the button is pressed
        function onSubmit() {
            console.log(fullInput.value)
        }

        // When the input changes
        function change(event) {
            isOpen.value = true
            if (props.sentenceAllowed){
                fullInput.value = event.target.value
                words = event.target.value.split(" ")
                search.value = words[words.length - 1]
            }
            else {
                fullInput.value = event.target.value
                search.value = event.target.value
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
            startFocus,
            stopFocus,
            enter,
            up,
            down,
            isActive,
            suggestionClick,
            onSubmit,
            change,

        }
    },

    methods: {

    },
})
