app.component("groupfilter", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <button class='button' :style="style" @click="clicked">[[group]]</button>
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
            default: () => "label"
        },
        groupcolor: {
            type: String
        }
    },
    mounted(){
        axios
            .get("/" + this.group)
            .then(function (response) {
                // console.log(response.data[0].nodes.nodes)
                this.nodes = response.data[0].nodes.nodes
                this.links = response.data[0].nodes.links
            })
            .catch(function (error)  {
                console.log(error);
            })
    },
    methods: {
        clicked() {
            // @set-active-group="setActiveGroup"
            // this.$emit("set-active-group", this.group)
            this.$root.setActiveGroup(this.group)
        }
    },
    computed: {
        style() {
            if (this.$root.getActiveGroup() == this.group){
                return {
                    'background-color': this.groupcolor, "border": "2px solid #000000"
                }
            }
            else {
                return {
                    'background-color': this.groupcolor, "border": "2px solid #ffffff"
                }
            }
        }
    }
})
