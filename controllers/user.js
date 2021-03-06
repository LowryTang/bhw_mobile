var userService = require('../services/user.js');
var routerConstant = require('../config/router.js');
var security = require('../services/security.js');
var config = require('../config/config');
var http = require('http');
var request = require('request');

var userCtrl = {
  index: function(user, req, res, next) {
    res.render("user/index", {
      title: "我的",
      user: user,
      hideBackButton: true
    })
  },
  reg: function(req, res, next) {
    var message = req.query.error || null;
    res.render("user/reg", {
      title: "注册",
      rightContent: "登录",
      rightHref: routerConstant.userLogin,
      hideBackButton: true,
      message: message
    })
  },

  regAction: function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var data = {
      mobile    : req.body.username,
      mobilecode: req.body.verifyCode,
      password  : req.body.password,
      repassword: req.body.confirmPassword
    };
    var url = config.APIHost + config.regAPI;
    request.post({
      url: url,
      formData: data,
      postambleCRLF: true
    }, function(err, httpRes, body) {
      var result = body.match(/\{.*?\}/g);
      result = result.pop();
      result = JSON.parse(result);
      if (result.result == 0) {
        userService.loginUser(username, password).then(function(user) {
          if (user) {
            var token = security.serializeAuthTicket(username, password);
            res.cookie("token", token, {
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            res.redirect(routerConstant.userIndex);
          } else {
            res.redirect(routerConstant.userLogin);
          }
        });        
      } else {
        res.redirect(routerConstant.userReg + "?error=" + result.message);
      } 
    });
  },

  login: function(req, res, next) {
    var callback = req.query.callback;
    if (callback) {
      callback = encodeURIComponent(callback);
    }
    var message = req.query.message;
    res.render("user/login", {
      hideBackButton: true,
      title: "登录",
      rightContent: "注册",
      rightHref: routerConstant.userReg,
      callback: callback,
      message: message
    })
  },
  loginAction: function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var callback = req.query.callback;
    userService.loginUser(username, password).then(function(user) {
      if (user) {
        var token = security.serializeAuthTicket(username, password);
        res.cookie("token", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        if (callback) {
          res.redirect(callback);
          return;
        }
        res.redirect(routerConstant.userIndex);
      } else {
        res.redirect(routerConstant.userLogin + "?message=手机号或密码错误");
      }
    });
  },
  logout: function(req, res, next) {
    res.clearCookie("token");
    res.redirect(routerConstant.userLogin);
  },

  forget: function(req, res, next) {
    var message = req.query.error || null;
    res.render("user/forget", {
      title: "忘记密码",
      rightContent: "登录",
      rightHref: routerConstant.userLogin,
      hideBackButton: true,
      message: message
    })
  },
  forgetAction: function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var data = {
      mobile    : req.body.username,
      mobilecode: req.body.verifyCode,
      password  : req.body.password,
      repassword: req.body.confirmPassword
    };
    var url = config.APIHost + config.forgetAPI;
    request.post({
      url: url,
      formData: data,
      postambleCRLF: true
    }, function(err, httpRes, body) {
      var result = body.match(/\{.*?\}/g);
      result = result.pop();
      result = JSON.parse(result);
      if (result.result == 0) {
        res.redirect(routerConstant.userLogin + "?message=修改成功,请重新登录");      
      } else {
        res.redirect(routerConstant.userForget + "?error=" + result.message);
      } 
    });
  },
  orderList: function(user, req, res, next) {
    userService.getUserOrderList(user.id).then(function (orders) {
      orders = orders || [];
      for (var i = 0; i < orders.length; i++) {
        var action = orders[i].action;
        if (action == 1) {
          orders[i].actionText = "支付";
          orders[i].actionUrl = '/site/order/' + orders[i].id + '/purchase';
          orders[i].actionId = 'purchase';
        } else if (action ==2){
          orders[i].actionText = "确认收货";
          orders[i].actionId = 'confirm';
        }
      };
      res.render("user/orderList", {
        title: "我的订单",
        orders: orders
      });
    });
  },
  confirmOrder: function (user, req, res, next) {
    var orderId = req.params.id;
    if (!orderId) {
      res.send({success: false}, 400);
    }
    userService.confirmUserOrder(user.id, orderId).then(function (result) {
      if (result) {
        res.send({success: true});
      } else {
        res.send({success: false}, 400);
      }
    })
  },
  orderDetail: function(user, req, res, next) {
    var orderId = req.params.id
    userService.getOrderDetailByUserAndId(user.id, orderId).then(function (order) {
      if (order) {
        res.render('user/orderDetail', {
          title: "订单详细",
          order: order
        })
        return;
      }
      next(new Error("找不到该订单"));
    });
  },
  addressList: function(user, req, res, next) {
    userService.getUserAddresses(user.id).then(function (addresses) {
      addresses = addresses || [];
      if (req.path == '/selectAddress') {
        res.render('user/selectAddress', {
          title: "选择地址",
          addresses: addresses
        })
        return;  
      }
      res.render('user/addressList', {
        title: "我的地址",
        addresses: addresses
      })
    })
  },
  addressCreate: function(user, req, res, next) {
    var type = req.query.type;
    res.render('user/addressEdit', {
      title: "新增地址",
      type: type
    });
  },
  addressCreateAction: function (user, req, res, next) {
    var type = req.query.type;
    var address = {
      user_id: user.id,
      accept_name: req.body.accept_name,
      mobile: req.body.mobile,
      province: req.body.province,
      city: req.body.city,
      area: req.body.area,
      address: req.body.address
    };
    userService.createAddress(address).then(function (address) {
      if (address) {
        if (type == 'selectForOrder') {
          res.redirect(routerConstant.selectAddress);  
        }
        res.redirect(routerConstant.addressList);
      }
    });
  },
  addressEdit: function(user, req, res, next) {
    userService.getAddressById(req.params.id).then(function (address) {
      res.render('user/addressEdit', {
        title: "编辑地址",
        address: address
      });
    })
  },
  addressEditAction: function (user, req, res, next) {
    var address = {
      user_id: user.id,
      accept_name: req.body.accept_name,
      mobile: req.body.mobile,
      province: req.body.province,
      city: req.body.city,
      area: req.body.area,
      address: req.body.address,
      id: req.body.id
    };
    userService.updateAddress(address).then(function (address) {
      res.redirect(routerConstant.addressList);
    });    
  },

  addressRemoveAction: function (user, req, res, next) {
    var id = req.params.id;
    userService.removeAddress(id, user.id).then(function (result) {
      if (result) {
        res.send({success: true});
      } else {
        next({
          api: true,
          status: 400,
          message: "删除地址失败"
        })
      }
    });
  },

  tokenVerify: function(req, res, next) {
    var callback = req.query.callback;
    security.hasLoginedUser(req, function(result) {
      if (result) {
        next(result);
      } else {
        res.clearCookie("token");
        var callback = encodeURIComponent(req.originalUrl);
        res.redirect(routerConstant.userLogin + "?callback=" + callback);
        
      }
    })
  },

  specialTokenVerify: function(req, res, next) {
    security.hasLoginedUser(req, function(result) {
      if (result) {
        res.redirect(routerConstant.userIndex);
      } else {
        next();
      }
    })
  },

  getMobileCode: function (req, res, next) {
    var type = req.params.type;
    var mobile = req.query.mobile;
    userService.sendCodeToMobile(mobile, type, function(err, response, body) {
      if (!err) {
        res.send({
          success: true,
          message: JSON.parse(body)
        })
      }
    });

  }
};

module.exports = userCtrl;
