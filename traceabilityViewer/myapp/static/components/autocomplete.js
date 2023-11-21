app.component("autocomplete", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <div class="w-100 autocomplete">
    <input class="form-control w-80" type="text" :value="search"
        @keydown.enter = 'enter'
        @keydown.down = 'down'
        @keydown.up = 'up'
        @input = 'change'/>
    <ul v-show="openSuggestion" class="list-group"
    style="width:80%; position: absolute; z-index: 999;">
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
    <button @click="onSubmit" class="btn btn-primary">Submit</button>
    </div>
    `,
    setup() {
        search = Vue.ref('')
        isOpen = Vue.ref(false)
        current = Vue.ref(-1)
        // selection = ""
        return {
            search,
            isOpen,
            current,
            // selection,
        }
    },
    props: {
        suggestions: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    methods: {
        //When enter pressed on the input
        enter() {
            this.search = this.matches[this.current];
            this.isOpen = false;
        },

        //When up pressed while suggestions are open
        up() {
            if(this.current > 0)
                this.current --;
        },

        //When up pressed while suggestions are open
        down() {
            if(this.current < this.suggestions.length - 1)
                this.current ++;
        },

        //For highlighting element
        isActive(index) {
            return index === this.current;
        },

        //When the user changes input
        // change() {
        //     if (this.isOpen == false) {
        //         this.isOpen = true;
        //         this.current = 0;
        //     }
        // },

        //When one of the suggestion is clicked
        suggestionClick(index) {
            this.search = this.matches[index];
            this.isOpen = false;
        },

        onSubmit() {
            console.log(this.search)
        },

        change(event) {
            this.isOpen = true
            this.search = event.target.value
            // this.modelValue = this.search.value
        },
        // setSelected(item) {
        //     this.isOpen.value = false
        //     this.search.value = item
        //     this.$emit("update-value", this.search.value)
        //     // this.modelValue = this.search.value
        // }
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
            // return this.suggestions.filter((item) => {
            //     return item.indexOf(this.search) >= 0;
            // });
        },

        // The flag
        openSuggestion() {
            if (this.matches.length > 0 && this.isOpen){
                return true
            }
            return false
            // return this.search !== "" &&
            //     this.matches.length != 0 &&
            //     this.isOpen === true;
        },

        // searchResults(){
        //     if (this.search.value == ''){
        //         return []
        //     }
        //     return this.words.filter(item => {
        //         if (item.toLowerCase().includes(this.search.value.toLowerCase())){
        //             return item
        //         }
        //     })
        // },
    },
    // emits: {
    //     update: modelValue
    // },

})
