function postDataRequest(url, data){
    return axios.post(url, data)
                .catch(function (error)  {
                    console.log(error);
    });
}
//
app.component("autocomplete", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <div ref="alert" class="alert alert-danger" role="alert" style="display:none">
        <div class="d-flex">
            <svg width="20" height="20" class="bi flex-shrink-1 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
            <button id="arrow-button" @click="showError" type="button" class="btn btn-sm" content-type="charset=utf-8">&#8964</button>
            <strong>Error:&emsp;</strong><div ref="info"></div>&emsp;
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        <div ref="error" class="collapse font-monospace"></div>
    </div>

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
            default: () => []
        },
        sentenceAllowed: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    emits: ["loading", "onSubmit"],
    setup(props, { emit } ) {
        var alert = Vue.ref(null)
        var info = Vue.ref(null)
        var error = Vue.ref(null)
        var show = false;
        var errorText = ""
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
                submitted()
            }
            current.value = -1
            isOpen.value = false;
        }

        // When tab pressed on the input
        function tab() {
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
        async function submitted() {
            emit("loading", true)
            errorText = ""
            show = false
            nodes = []
            links = []
            emit("onSubmit", {nodes: nodes, links: links})
            if (props.sentenceAllowed){
                // query
                if (["SET ", "CREATE ", "DELETE", "MERGE ", "REMOVE"].some(substring =>
                    fullInput.value.toUpperCase().includes(substring))) {
                        alert.value.style.display = "block";
                        info.value.innerText = "SET, CREATE, DELETE, MERGE or REMOVE cannot be used!";
                    }
                else if (fullInput.value === "") {
                    alert.value.style.display = "block";
                    info.value.innerText = "The input is empty. Please enter a Cypher query."
                }
                else {
                    data = await postDataRequest("query/",fullInput.value);
                    console.log(typeof data.data)
                    console.log(typeof data.data === "string")
                    if (typeof data.data === "string"){
                        console.log(alert)
                        alert.value.style.display = "block";
                        info.value.innerText = "Please enter a valid cypher query."
                        errorText = data.data
                    }
                    else {
                        nodes = data.data.nodes
                        links = data.data.links
                    }
                }
            }
            else {
                // search ID
                if (props.suggestions.includes(fullInput.value)){
                    data = await postDataRequest("search/", fullInput.value)
                    nodes = data.data.nodes
                    links = data.data.links
                }
            }
            console.log(nodes)
            console.log(links)
            emit("onSubmit", {nodes: nodes, links: links})
            emit("loading", false)
        }

        function showError(){
            show = !show;
            if (errorText != "" && show == true){
                error.value.innerText = errorText;
                error.value.className = "collapsed font-monospace"
                document.getElementById("arrow-button").innerHTML = "&#8963;";
            }
            else {
                error.value.innerText = errorText;
                error.value.className = "collapse font-monospace"
                document.getElementById("arrow-button").innerHTML = "&#8964";
            }
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

        function close() {
            alert.value.className = "alert alert-danger d-none align-items-center";
        }
        // selection = ""
        return {
            alert,
            info,
            error,
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
            tab,
            up,
            down,
            isActive,
            suggestionClick,
            submitted,
            showError,
            change,
            close,

        }
    },

    methods: {

    },
})
