var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/user.js');


router.get('/', userCtrl.tokenVerify, userCtrl.index);

router.get('/login', userCtrl.specialTokenVerify, userCtrl.login);
router.post('/login', userCtrl.loginAction);

router.get('/logout', userCtrl.logout);

router.get('/reg', userCtrl.specialTokenVerify, userCtrl.reg);
router.post('/reg', userCtrl.regAction);

router.get('/forget', userCtrl.specialTokenVerify, userCtrl.forget);
router.post('/forget', userCtrl.forgetAction);

router.get('/order', userCtrl.tokenVerify, userCtrl.orderList);
router.get('/order/:id', userCtrl.tokenVerify, userCtrl.orderDetail);

router.get('/address', userCtrl.tokenVerify, userCtrl.addressList);
router.get('/address/add', userCtrl.tokenVerify, userCtrl.addressCreate);
router.get('/address/:id', userCtrl.tokenVerify, userCtrl.addressEdit);


module.exports = router;
