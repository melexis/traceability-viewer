app.component("alert", {
    delimiters: ["[[", "]]"],
    template:
        /*html*/
        `
        <div ref="alert" :id="'alert-' + alertData.identifier" class="alert alert-danger alert-dismissible fade show" role="alert">
            <div class="d-flex">
                <svg width="25" height="25" class="bi flex-shrink-1 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                <button v-if="alertData.message != ''" style="--bs-btn-padding-y: 0; --bs-btn-padding-x: .5rem;" data-bs-toggle="collapse" :data-bs-target="'#error-' + alertData.identifier" aria-expanded="false" :aria-controls="'error-' + alertData.index" type="button" class="me-2 btn btn-outline-secondary" @click="show = !show">[[buttonText]]</button>
                <strong>Error: &nbsp;</strong><div ref="title">[[alertData.title]]</div>&emsp;
                <button type="button" class="btn-close" :data-bs-dismiss="'alert-' + alertData.identifier" aria-label="Close" @click="removeAlert"></button>
            </div>
            <div :id="'error-' + alertData.identifier" class="collapse" >
                <div class="font-monospace mt-2" style="white-space: pre-wrap">
                [[alertData.message]]
                </div>
            </div>
        </div>
      `,
    props: {
      alertData: {
        type: Object,
      },
    },
    emits: ["removeAlert"],
    setup(props, { emit }) {
        let show = Vue.ref(false);
        let alert = Vue.ref(null);

        let buttonText = Vue.computed(() =>  {
            if (show.value){
                return "Hide error message"
            }
            return "Show error message"
        })

        function removeAlert() {
            emit("removeAlert", props.alertData.identifier);
        }

        Vue.onMounted(function () {
            alert.value.scrollIntoView({behavior: "smooth"})
        });

        return {
            show,
            alert,
            buttonText,
            removeAlert,
        }
    }
})
