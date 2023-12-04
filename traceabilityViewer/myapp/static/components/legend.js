app.component("itemLegend", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <div class="hstack">
    <div class="mt-1 btn-group overflow-x-auto" role="group">
            <button v-for="(color, item) in items"
                class="btn btn-light border-dark"
                type="button"
                @click="clicked(item)"
                :id="item">
                <div class="d-flex">
                    <svg width="25" height="20">
                        <rect width="20" height="20" :fill="color"/>
                    </svg>
                    [[item]]
                </div>
            </button>
    </div>
    </div>
    `,
    props: {
        items: {
            type: Object,
            default: {}
        },
    },
    setup(props, context) {
        let items = Vue.toRef(props, "items")
        let inactiveItems = Vue.ref([])

        function clicked(item){
            if (inactiveItems.value.includes(item)){
                document.getElementById(item).className = "btn btn-light border-dark opacity-100"
                inactiveItems.value = inactiveItems.value.filter(i => {
                    if (i != item){
                        return i
                    }
                })
            }
            else {
                document.getElementById(item).className = "btn btn-light border-dark opacity-25"
                inactiveItems.value.push(item)
            }
            context.emit("hidden-items", inactiveItems.value)
        }
        return {
            items,
            inactiveItems,
            clicked,
        }
    }
})
