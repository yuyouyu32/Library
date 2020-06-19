const express = require('express');

const app = express();

app.use(express.static(__dirname));

app.use('/', (req, res, next) => {
    res.redirect('/login-admin.html')
})

app.listen(7777, function () {console.log('library_frontend: 7777启动！');});
