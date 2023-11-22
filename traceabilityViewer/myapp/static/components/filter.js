app.component("groupfilter", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <button type="button" :class="style"  @click="clicked">[[group]]</button>
    `,
    data() {
        return {
            nodes: {},
            links: {},
        }
    },
    props: {
        group: {
            type: String,
            default: () => "home"
        }
    },
    mounted(){
        if (this.group != "home"){
            axios
            .get("/data/" + this.group)
            .then(function (response) {
                // console.log(response.data[0].nodes.nodes)
                this.nodes = response.data[0].nodes.nodes
                this.links = response.data[0].nodes.links
            })
            .catch(function (error)  {
                console.log(error);
            })
        }
    },
    methods: {
        clicked() {
            // @set-active-group="setActiveGroup"
            // this.$emit("set-active-group", this.group)
            console.log(this.group)
            this.$emit("change-group", this.group)
            // this.$root.activeGroup = this.group
            this.$root.nodes = this.nodes
            this.$root.links = this.links
        }
    },
    computed: {
        style() {
            if (this.$root.activeGroup == this.group){
                return "btn btn-outline-danger"
            }
            else {
                return "btn btn-dark btn-outline-light"
            }
        }
    }
})
