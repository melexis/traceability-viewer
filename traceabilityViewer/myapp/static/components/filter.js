app.component("groupfilter", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <button type="button" @click="clicked">[[group]]</button>
    `,
    props: {
        group: {
            type: String,
        }
    },
    emits: ["loading", "changeGroup"],
    setup(props, { emit }) {
        var nodes = []
        var links = []

        function clicked() {
            emit("changeGroup", {group: props.group, nodes: nodes, links: links})
        }
        async function getData(){
            emit("loading", true)
            data = await dataRequest("/data/" + props.group)
            nodes = data.data.nodes
            links = data.data.links
            emit("loading", false)
        }

        Vue.onMounted(async function() {
            await getData()
        });

        return {
            nodes,
            links,
            clicked,
            getData,
        }
    }
})
