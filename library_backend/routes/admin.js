const express = require('express');

const router = express.Router();

const admin = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

//tyn
router.post('/login', admin.login);
router.get('/name', isAuth.admin, admin.getName);
router.get('/cips', isAuth.admin, admin.getCips);
router.post('/cips', isAuth.admin, admin.addCips);
router.get('/cip', isAuth.admin, admin.getCip);
router.get('/reservations', isAuth.admin, admin.getReservations);
//yyy
router.get('/lend',isAuth.admin,admin.getlend);
router.post('/done',isAuth.admin,admin.done);
router.post('/record', isAuth.admin, admin.addRecord);
//tyn tyn 6.16
router.get('/info', isAuth.reader, admin.getInfo);
router.post('/info', isAuth.admin, admin.modifyInfo);
router.post('/pwd', isAuth.admin, admin.modifyPwd);

module.exports = router;