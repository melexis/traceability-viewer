app.component("groupfilter", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <button type="button" @click="clicked" :disabled="isDisabled">[[group]]</button>
    `,
    props: {
        group: {
            type: String,
        }
    },
    emits: ["loading", "changeGroup"],
    setup(props, { emit }) {
        var nodes = Vue.ref([])
        var links = Vue.ref([])

        isDisabled = Vue.computed(() => {
            if (nodes.value.length == 0){
                return true
            }
            return false
        })

        function clicked() {
            emit("changeGroup", {group: props.group, nodes: nodes.value, links: links.value})
        }
        async function getData(){
            emit("loading", true)
            data = await dataRequest("/data/" + props.group)
            nodes.value = data.data.nodes
            links.value = data.data.links
            emit("loading", false)
        }

        Vue.onMounted(async function() {
            await getData()
        });

        return {
            isDisabled,
            nodes,
            links,
            clicked,
            getData,
        }
    }
})
