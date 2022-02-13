const service = axios.create({
  method: 'POST',
  withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000, // request timeout
});

// http response 拦截器
service.interceptors.response.use(response => {
  return Promise.resolve(response);
}, error => {
  if (error.code == "ECONNABORTED") {
    app.$notify("请求超时");
  } else if (error.response && error.response.status == 403) {
    if (error.config.data.indexOf("hostname") != -1) {
      app.showLogin = true;
    } else {
      location.reload();
    }
  }
  return Promise.reject(error);
});

var request = service;

var api = {
  login(password) {
    return request({
      url: '/cgi-bin/luci/rpc/auth',
      data: {
        method: "login",
        params: ["root", password]
      }
    }).then(res => {
      if (res.data.result) {
        return Promise.resolve(res.data.result);
      } else {
        return Promise.reject(new Error("密码错误"));
      }
    });
  },
  getUpTime() {
    return request({
      url: '/cgi-bin/luci/rpc/sys',
      data: {
        method: "uptime"
      }
    }).then(res => {
      if (res.data.result) {
        return Promise.resolve(res.data.result);
      } else {
        return Promise.reject(new Error("获取在线时长失败"));
      }
    });
  },
  getHostName() {
    return request({
      url: '/cgi-bin/luci/rpc/sys',
      data: {
        method: "hostname"
      }
    }).then(res => {
      if (res.data.result) {
        return Promise.resolve(res.data.result);
      } else {
        return Promise.reject(new Error("获取主机名失败"));
      }
    });
  },
  getModel() {
    return request({
      url: '/cgi-bin/luci/rpc/sys',
      data: {
        method: "exec",
        params: [
          "cat /proc/cpuinfo | grep machine | cut -d : -f 2"
        ]
      }
    }).then(res => {
      if (res.data.result) {
        return Promise.resolve(res.data.result.trim());
      } else {
        return Promise.reject(new Error("获取型号失败"));
      }
    });
  },
  getWebcamStatus() {
    return request({
      url: '/cgi-bin/luci/rpc/uci',
      data: {
        "method": "get",
        "params": ["mjpg-streamer", "core", "enabled"]
      }
    }).then(res => {
      return Promise.resolve(res.data.result);
    });
  },
  getWebcamPort() {
    return request({
      url: '/cgi-bin/luci/rpc/uci',
      data: {
        "method": "get",
        "params": ["mjpg-streamer", "core", "port"]
      }
    }).then(res => {
      return Promise.resolve(res.data.result ? res.data.result : "8080");
    });
  },
  commitCam() {
    return request({
      url: '/cgi-bin/luci/rpc/uci',
      data: {
        "method": "commit",
        "params": ["mjpg-streamer"]
      }
    }).then(res => {
      if (res.data.result) {
        return Promise.resolve(res.data.result);
      } else {
        return Promise.reject(new Error("提交设置失败"));
      }
    });
  },
  setCamStatus(on) {
    if (on) {
      return request({
        url: '/cgi-bin/luci/rpc/uci',
        data: {
          "method": "set",
          "params": ["mjpg-streamer", "core", "enabled", "1"]
        }
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return request({
          url: '/cgi-bin/luci/rpc/uci',
          data: {
            "method": "set",
            "params": ["mjpg-streamer", "core", "input", "uvc"]
          }
        });
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return request({
          url: '/cgi-bin/luci/rpc/uci',
          data: {
            "method": "set",
            "params": ["mjpg-streamer", "core", "output", "http"]
          }
        });
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return this.commitCam();
      });
    } else {
      return request({
        url: '/cgi-bin/luci/rpc/uci',
        data: {
          "method": "delete",
          "params": ["mjpg-streamer", "core", "enabled"]
        }
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return request({
          url: '/cgi-bin/luci/rpc/uci',
          data: {
            "method": "delete",
            "params": ["mjpg-streamer", "core", "input"]
          }
        });
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return request({
          url: '/cgi-bin/luci/rpc/uci',
          data: {
            "method": "delete",
            "params": ["mjpg-streamer", "core", "output"]
          }
        });
      }).then(res => {
        if (res.data.result) {
          return Promise.resolve(res.data.result);
        } else {
          return Promise.reject(new Error("设置失败"));
        }
      }).then(res => {
        return this.commitCam();
      });
    }
  }
}
