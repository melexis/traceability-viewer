const app = Vue.createApp({
    data() {
        return {
            nodes: {},
            links: {},
            isMainPage: true,
        }
    },
    delimiters: ["[[", "]]"]
})
