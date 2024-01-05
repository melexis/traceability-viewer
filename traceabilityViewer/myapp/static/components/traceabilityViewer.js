function dataRequest(request) {
  return (
    axios
      .get(request)
      // .then(function (response){
      //     return response.data;
      // })
      // .catch(function (error) {
      //   console.log("this is the catch of dataRequest");
      //   console.log(error);
      //   // return error
      // })
  );
}

function postDataRequest(url, data) {
  return axios.post(url, data)
  // .catch(function (error) {
  //   console.log(error);
  // }
  // );
}

app.component("traceability-viewer", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
    <!-- ! symbol -->
    <svg class="d-none">
        <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
    </svg>

    <div ref="alert" id="alert" class="alert alert-danger alert-dismissible fade show" role="alert">
      <div class="d-flex">
          <svg width="20" height="20" class="bi flex-shrink-1 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
          <button id="arrow-button" data-bs-toggle="collapse" data-bs-target="#error" aria-expanded="false" aria-controls="error" type="button" class="btn" content-type="charset=utf-8">&#8964</button>
          <strong>Error:&emsp;</strong><div ref="info"></div>&emsp;
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
      <div id="error" class="collapse" >
        <div class="font-monospace" style="white-space: pre-wrap">
        [[errorText]]
        </div>
      </div>
    </div>
    <!-- Navbar -->
    <div class="d-flex flex-wrap">
        <button type="button" @click="clicked" class="btn"
            :class="{'btn btn-lg btn-outline-primary active mb-1 me-1': activeGroup == 'home',
                     'btn btn-lg btn-outline-primary mb-1 me-1': activeGroup != 'home'}"
        >
            Home
        </button>
        <groupfilter class="btn"
            :class="{'btn btn-lg btn-outline-primary active mb-1 me-1': activeGroup == group, 'btn btn-lg btn-outline-primary mb-1 me-1': activeGroup != group}"
            v-for="group in groups"
            :group="group"
            @changeGroup="changeGroup"
            @loading="changeLoading"
            @onAlert="onAlert"
        >
        </groupfilter>
    </div>
    <!-- Input Fields -->
    <div v-if="activeGroup==='home'">
        <br>
        <label>Cypher query: </label>
        <autocomplete
            :suggestions="words"
            :sentenceAllowed="true"
            @loading="changeLoading"
            @onSubmit="changeData"
            @onAlert="onAlert"
        >
        </autocomplete>
        <label>Search: </label>
        <autocomplete
            :suggestions="searchIds"
            :sentenceAllowed="false"
            @loading="changeLoading"
            @onSubmit="changeData"
            @onAlert="onAlert"
        >
        </autocomplete>
    </div>
    <graphviz :loading="loading" :nodes="nodes" :links="links" :config="config"> </graphviz>
    `,
  setup() {
    var show = false;
    var errorText = Vue.ref("");
    var error = Vue.ref(null);
    var alert = Vue.ref(null);
    var info = Vue.ref(null);
    var loading = Vue.ref(true);
    var query = Vue.ref("");
    var activeGroup = Vue.ref("home");
    var groups = Vue.ref([]);
    var config = Vue.ref({});
    var words = Vue.ref([]);
    var searchIds = Vue.ref([]);
    const linkTypes = [];
    var nodes = Vue.shallowRef([]);
    var links = Vue.shallowRef([]);
    var initNodes = [];
    var initLinks = [];

    function clicked() {
      activeGroup.value = "home";
      nodes.value = initNodes;
      links.value = initLinks;
    }

    function changeGroup(data) {
      activeGroup.value = data.group;
      nodes.value = data.nodes;
      links.value = data.links;
    }

    function changeData(data) {
      nodes.value = data.nodes;
      links.value = data.links;
    }

    function onAlert(data) {
      console.log(data)
      errorText.value = data.message;
      info.value.innerText = data.title;
      alert.value.scrollIntoView({behavior: "smooth"})
      // alert.value.style.display = "block";
    }

    // function close() {
    //   alert.value.style.display = "none";
    //   error.value.className = "{show: false}"
    //   document.getElementById("arrow-button").innerHTML = "&#8964";
    //   info.value.innerText = "";
    //   show = false;
    // }

    function changeLoading(newValue) {
      loading.value = newValue;
    }

    async function initialize() {
      configData = await dataRequest("/config");
      groups.value = configData.data.groups;
      config.value = configData.data.config;

      // data = await dataRequest("/data/init")
      // nodes.value = data.data.nodes
      // links.value = data.data.links
      // initNodes = data.data.nodes
      // initLinks = data.data.links
      nodes.value = [];
      links.value = [];
      initNodes = [];
      initLinks = [];

      autocompleteData = await dataRequest("/autocomplete");
      words.value = autocompleteData.data.words;
      searchIds.value = autocompleteData.data.searchIds;

      loading.value = false;
    }

    Vue.onMounted(async function () {
      await initialize();
    });

    return {
      error,
      alert,
      errorText,
      info,
      loading,
      query,
      activeGroup,
      groups,
      config,
      words,
      searchIds,
      linkTypes,
      nodes,
      links,
      clicked,
      changeGroup,
      changeData,
      onAlert,
      changeLoading,
      initialize,
    };
  },
});
