(function() {
  Vue.component("modal", {
    template: "#modal-template",
    props: ["id"],
    data: function() {
      return {
        url: "",
        title: "",
        description: "",
        username: "",
        uploadTime: "",
        comments: [],
        comment: {
          text: "",
          name: ""
        }
      };
    },
    mounted: function() {
      var self = this;
      self.comments = [];
      console.log("this from mount", this);
      axios
        .get("/image/" + self.id + "/data")
        .then(function(results) {
          console.log("results from images: ", results);
          self.url = results.data[0].url;
          self.title = results.data[0].title;
          self.description = results.data[0].description;
          self.username = results.data[0].username;
          self.uploadTime = results.data[0].created_at.slice(0, 16);
        })
        .then(function() {
          axios.get("/image/" + self.id + "/comments").then(function(results) {
            if (results.data.length > 0) {
              for (let i = 0; i < results.data.length; i++) {
                self.comments.unshift(results.data[i]);
              }
            }
          });
        });
    },
    methods: {
      sendCloseEvent: function(e) {
        if (e.target == document.getElementById("modal-default-button")) {
          this.$emit("close");
        } else {
          return;
        }
      },
      addComment: function(e) {
        e.preventDefault();
        var self = this;
        axios
          .post("/comment/" + self.id + "/add", {
            text: self.comment.text,
            name: self.comment.name
          })
          .then(function(results) {
            self.comments.unshift(results.data[0]);
            self.comment.text = "";
            self.comment.name = "";
          });
      }
    },
    watch: {
      id: function() {
        var self = this;
        self.comments = [];
        axios.get("/image/" + self.id + "/data").then(function(results) {
          self.url = results.data[0].url;
          self.title = results.data[0].title;
          self.description = results.data[0].description;
          self.username = results.data[0].username;
          self.uploadTime = results.data[0].created_at.slice(0, 16);
        });
        axios.get("/image/" + self.id + "/comments").then(function(results) {
          if (results.data.length > 0) {
            for (let i = 0; i < results.data.length; i++) {
              self.comments.unshift(results.data[i]);
            }
          }
        });
      }
    }
  });

  new Vue({
    el: "#main",
    data: {
      images: [],
      form: {
        title: "",
        name: "",
        description: "",
        file: null,
        id: ""
      },
      currentImage: window.location.hash.slice(1),
      lowest_id: null
    },

    mounted: function() {
      var self = this;
      window.addEventListener("hashchange", function() {
        self.currentImage = window.location.hash.slice(1);
        self.showModal = !!this.currentImage;
      });
      console.log("mounted");
      axios
        .get("/images")
        .then(function(response) {
          self.images = response.data;
          console.log("mounted self.images: ", self.images);
        })
        .catch(err => {
          console.log("error in get/images: ", err);
        });
    },
    methods: {
      uploadFile: function(e) {
        var self = this;
        e.preventDefault();
        var file = document.getElementById("file");
        var uploadedFile = file.files[0];
        var formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("title", this.form.title);
        formData.append("description", this.form.description);
        formData.append("name", this.form.name);

        axios.post("/upload", formData).then(function(response) {
          self.form = {
            title: "",
            name: "",
            description: "",
            file: null
          };
          self.images.unshift(response.data);
        });
      },
      showModal: !!window.location.hash.slice(1),
      fetchMoreImages: function() {
        var self = this;
        axios
          .get("/images/" + this.images[this.images.length - 1].id + "/more")
          .then(function(response) {
            self.images = self.images.concat(response.data[0].rows);
            self.lowest_id = response.data[1].rows[0].lowest_id;
          })
          .catch(err => {
            console.log("error in get/images: ", err);
          });
      },
      hideModal: function() {
        window.location.hash = "";
      }
    }
  });
})();
