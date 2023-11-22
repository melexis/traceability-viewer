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
    setup() {
        fullInput = Vue.ref("")
        search = Vue.ref("")
        isOpen = Vue.ref(false)
        current = Vue.ref(-1)
        isFocussed = Vue.ref(false)
        // selection = ""
        return {
            fullInput,
            search,
            isOpen,
            current,
            isFocussed,
            // selection,
        }
    },
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
    methods: {
        startFocus(){
            console.log("start focus");
            this.isFocussed=true
        },
        stopFocus(){
            console.log("stop focus");
            this.isFocussed=false
        },
        // When enter pressed on the input
        enter() {
            if (this.isOpen && this.current>=0){
                this.search = this.matches[this.current];
                if (this.sentenceAllowed){
                    words = this.fullInput.split(" ")
                    words = words.slice(0, words.length - 1)
                    words.push(this.search)
                    this.fullInput = words.join(" ")
                }
                else {
                    this.fullInput = this.search
                }
            }
            else {
                this.onSubmit()
            }
            this.current = -1
            this.isOpen = false;
        },

        // When up pressed while suggestions are open
        up() {
            if(this.current > 0)
                this.current --;
        },

        // When up pressed while suggestions are open
        down() {
            if(this.current < this.matches.length - 1)
                this.current ++;
        },

        // For highlighting element
        isActive(index) {
            return index === this.current;
        },

        // When one of the suggestion is clicked
        suggestionClick(index) {
            this.search = this.matches[index];
            if (this.sentenceAllowed){
                words = this.fullInput.split(" ")
                words = words.slice(0, words.length - 1)
                words.push(this.search)
                this.fullInput = words.join(" ")
            }
            else {
                this.fullInput = this.search
            }
            this.current = -1
            this.isOpen = false;
        },

        // When the button is pressed
        onSubmit() {
            console.log(this.fullInput)
        },

        // When the input changes
        change(event) {
            this.isOpen = true
            if (this.sentenceAllowed){
                this.fullInput = event.target.value
                words = event.target.value.split(" ")
                this.search = words[words.length - 1]
            }
            else {
                this.fullInput = event.target.value
                this.search = event.target.value
            }
        },
    },
    computed: {
        //Filtering the word suggestion based on the input
        matches() {
            if (this.search == ''){
                return []
            }
            return this.suggestions.filter(item => {
                if (item.toLowerCase().includes(this.search.toLowerCase())){
                    return item
                }
            })
        },

        // The flag
        openSuggestion() {
            if (this.matches.length > 0 && this.isOpen && this.isFocussed){
                return true
            }
            this.current = -1
            return false
        },
    },
})
