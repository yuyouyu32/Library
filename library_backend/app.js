const express = require('express');

const bodyParser = require('body-parser');

const path = require('path')

const adminRoutes = require('./routes/admin');
const readerRoutes = require('./routes/reader');
const notifySchedule = require('./controllers/notice');

const app = express();

app.use(bodyParser.json());

// 跨域访问
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname)));  //尝试限制在images文件夹，但是失败了，回头再试

app.use('/admin', adminRoutes);
app.use('/reader', readerRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

app.listen(7778, function () {console.log('library_backend: 7778启动！');});

//每天早上9点通知
notifySchedule.notifySchedule();