Vue.prototype.$toast = vant.Toast;
Vue.prototype.$dialog = vant.Dialog;
Vue.prototype.$notify = vant.Notify;
var app = new Vue({
  el: '#app',
  data: {
    loading: true,
    showLogin: false,
    password: "",
    fullscreen: false,
    uptime: 0,
    model: "-",
    camOn: false,
    camPort: "8080",
    camStatusLoading: true,
    videoSubfix: ""
  },
  computed: {
    uptimeShow() {
      let str = "-";
      if (this.uptime) {
        let s = Math.floor(this.uptime % 60);
        let m = Math.floor(this.uptime / 60 % 60);
        let h = Math.floor(this.uptime / 60 / 60 % 24);
        let d = Math.floor(this.uptime / 60 / 60 / 24);
        if (d) {
          str = d + " 天 " + h + " 小时 " + m + " 分 " + s + " 秒 ";
        } else if (h) {
          str = h + " 小时 " + m + " 分 " + s + " 秒 ";
        } else if (m) {
          str = m + " 分 " + s + " 秒 ";
        } else if (s) {
          str = s + " 秒 ";
        }
      }
      return str;
    },
    videoUrl() {
      if (this.camOn) {
        return "http://" + window.location.hostname + ":" + this.camPort + "/?action=stream?v=" + this.videoSubfix;
      } else {
        return "";
      }
    }
  },
  watch: {
    fullscreen(newVal, oldVal) {
      if (newVal) {
        document.getElementsByTagName('html')[0].style.backgroundColor = "black";
      } else {
        document.getElementsByTagName('html')[0].style.backgroundColor = "#ededed";
      }
    }
  },
  created() {
    window.addEventListener('orientationchange', this.onOrientationChange);
  },
  mounted() {
    api.getHostName().then(res => {
      this.initStatus();
    }).catch(() => { });
  },
  destroyed() { },
  methods: {
    onOrientationChange() {
      if (window.orientation === 90 || window.orientation === -90) {
        if (this.camOn && !this.fullscreen) {
          this.fullscreen = true;
        }
      } else {
        if (this.fullscreen) {
          this.fullscreen = false;
        }
      }
    },
    login(action, done) {
      if (this.password) {
        api.login(this.password).then(res => {
          this.initStatus();
          done();
        }).catch(err => {
          this.$toast("密码错误");
          this.password = "";
          done(false);
        });
      } else {
        this.$toast("请输入密码");
        done(false);
      }
    },
    initStatus() {
      api.getUpTime().then(res => {
        this.uptime = res;
      }).catch(() => { });
      api.getModel().then(res => {
        this.model = res;
      }).catch(() => { });
      this.camStatusLoading = true;
      api.getWebcamStatus().then(res => {
        this.camOn = res == "1";
        return api.getWebcamPort();
      }).then(res => {
        this.camPort = res;
        this.camStatusLoading = false;
      }).catch(err => {
        this.$notify(err.message);
      });
    },
    camOnInput(checked) {
      this.camStatusLoading = true;
      api.setCamStatus(checked).then(res => {
        this.camOn = checked;
      }).catch(err => {
        this.$notify(err.message);
      }).finally(() => {
        this.camStatusLoading = false;
      });
    },
    retry() {
      if (this.videoUrl) {
        this.videoSubfix = new Date().getTime();
      }
    }
  }
});