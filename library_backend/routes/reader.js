const express = require('express');

const router = express.Router();

const reader = require('../controllers/reader');

const isAuth = require('../middleware/is-auth');
//tyn
router.post('/login', reader.login);
router.get('/name', isAuth.reader, reader.getName);
//yyy
router.get('/records',isAuth.reader, reader.records);
router.get('/reservations',isAuth.reader,reader.reservation);
router.post('/cancel',isAuth.reader,reader.cancel);
router.get('/pastreservations',isAuth.reader,reader.pastreservation);
//tyn
router.get('/info', isAuth.reader, reader.getInfo);
router.post('/info', isAuth.reader, reader.modifyInfo);
router.post('/pwd', isAuth.reader, reader.modifyPwd);
//yyy
router.get('/cip', isAuth.reader, reader.getCip);
router.get('/cip_name', isAuth.reader, reader.getCip_name);
router.post('/add_reservation',isAuth.reader,reader.add_reservation);
module.exports = router;