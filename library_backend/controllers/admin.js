const database = require('../database');

const jwt = require('jsonwebtoken');

const formidable = require("formidable");//用来处理前端上传的FormData

const path = require('path');

const fs = require('fs')

//【POST】登陆
exports.login = (req, res, next) => {
    let aid = req.body.aid;
    let pwd = req.body.pwd;
    database.queryAdminInfo(aid, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            if (result.length > 0) {
                if (result[0].pwd == pwd) {
                    const token = jwt.sign(
                        {
                            //
                        },
                        'somesupersecretsecret',
                        {expiresIn: '12h'}
                    );
                    res.status(200).json({
                        token: token,   //token
                        aid: aid        //同时返回aid，让浏览器存在本地
                    });
                }
                else {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    next(error);
                }
            }
            else {
                const error = new Error('账户不存在！');
                error.statusCode = 401;
                next(error);
            }
        }
    })
}
//【GET】获取管理员姓名
exports.getName = (req, res, next) => {
    let aid = req.query.aid;
    database.queryAdminInfo(aid, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            if (result.length > 0) {
                res.status(200).json({
                    aname: result[0].aname,   //管理员姓名
                });
            }
        }
    })
}
//【GET】获取所有书目信息
exports.getCips = (req, res, next) => {
    database.queryCips((flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            res.status(200).send(result)
        }
    })
}
//【POST】入库
exports.addCips = (req, res, next) => {
    let form = formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../images/tempFiles');//改变formdata表单文件上传到本地的默认位置
    //保留文件扩展名
    form.keepExtensions = true;
    form.encoding = 'utf-8';
    form.parse(req, function (err, fields, files) {
        fields.amount1 = parseInt(fields.amount1);
        fields.amount2 = parseInt(fields.amount2);
        database.queryCipByIsbn(fields.isbn, (flag, result) => {
            if (flag == false) {
                const error = new Error('Database error!');
                error.statusCode = 500;
                next(error);
            }
            else {
                //该书目已存在，修改册数即可
                if (result.length > 0) {
                    let params = [fields.amount1 + fields.amount2, fields.isbn];
                    database.updateCips(params, (flag) => {
                        if (flag == false) {
                            const error = new Error('Database error!');
                            error.statusCode = 500;
                            next(error);
                        }
                        else {
                            //插入图书
                            database.insertBooks(
                                fields.isbn,
                                result[0].amount,
                                fields.amount1,
                                fields.amount2,
                                fields.aid,
                                (flag, result) => {
                                    if (flag == false) {
                                        const error = new Error('Database error!');
                                        error.statusCode = 500;
                                        next(error);
                                    }
                                    else {
                                       res.status(200).end();
                                    }
                                }
                            )
                        }
                    })
                }
                //书目不存在，插入书目
                else {
                    //保存图片
                    // let extName = path.extname(files.cip_cover.path);
                    let extName = '.jpg';
                    let newName = fields.isbn + extName;
                    let oldPath = files.cip_cover.path;
                    let newPath = path.join(__dirname, '../images/cips', newName);
                    //修改文件的名字
                    fs.renameSync(oldPath, newPath);
                    // 写入数据库
                    let params = [
                        fields.isbn,
                        fields.bname,
                        fields.author,
                        fields.publisher,
                        fields.pub_date,
                        fields.amount1 + fields.amount2
                    ];
                    database.insertCips(params, (flag) => {
                        if (flag == false) {
                            const error = new Error('Database error!');
                            error.statusCode = 500;
                            next(error);
                        }
                        else {
                            //插入图书
                            database.insertBooks(
                                fields.isbn,
                                0,
                                fields.amount1,
                                fields.amount2,
                                fields.aid,
                                (flag, result) => {
                                    if (flag == false) {
                                        const error = new Error('Database error!');
                                        error.statusCode = 500;
                                        next(error);
                                    }
                                    else {
                                        res.status(200).end();
                                    }
                                }
                            )
                        }
                    })
                }
            }
        })

    })
}
//【GET】根据isbn获取书目信息
exports.getCip = (req, res, next) => {
    let isbn = req.query.isbn;
    database.queryCipByIsbn(isbn, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            if (result.length > 0) {
                res.status(200).send(result)
            }
            else {  //书目不存在
                res.status(444).end()
            }
        }
    })
}
//【GET】获取所有预约信息
exports.getReservations = (req, res, next) => {
    database.queryReservations((flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            res.status(200).send(result)
        }
    })
}
//【GET】获取所有借出记录 yyy
exports.getlend = (req, res, next) => {
    database.querylend((flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            console.log(result)
            res.status(200).send(result)
        }
    })
}
//【POST】归还图书 yyy
exports.done = (req, res, next) => {
    database.updateLend(req.body.rid,req.body.bid,req.body.l_time,req.body.isbn,(flag,flag1,days) => {
        if (flag == false || flag1 == false) {
            //回滚
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            let money = 0;
            if(days > 30)
            {
                money=(days-30)*5;
            }
            res.status(200).json({money:money})
        }
    })
}
//【POST】增加借阅记录 tyn
exports.addRecord = (req, res, next) => {
    let rid = req.body.rid;
    let bid = req.body.bid;
    database.insertRecord(rid, bid, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            res.status(200).end();
        }
    })
}


//【GET】获取管理员信息 tyn 6.16
exports.getInfo = (req, res, next) => {
    let aid = req.query.aid;
    database.queryAdminInfo(aid, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            res.status(200).send(result);
        }
    })
}
//【POST】修改管理员信息 tyn 6.16
exports.modifyInfo = (req, res, next) => {
    let form = formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../images/tempFiles');//改变formdata表单文件上传到本地的默认位置
    //保留文件扩展名
    form.keepExtensions = true;
    form.encoding = 'utf-8';
    form.parse(req, function (err, fields, files) {
        //若改变了头像，覆盖本地原来的头像
        if (files.avatar.size != 0) {
            //保存图片
            console.log('saving image...');
            // let extName = path.extname(files.cip_cover.path);
            let extName = '.jpg';
            let newName = fields.aid + extName;
            let oldPath = files.avatar.path;
            let newPath = path.join(__dirname, '../images/admins', newName);
            //修改文件的名字
            fs.renameSync(oldPath, newPath);
        }
        //修改读者数据库中的信息
        let params = [
            fields.aname,
            fields.aid
        ];
        database.updateAdmin(params, (flag, result) => {
            if (flag == false) {
                const error = new Error('Database error!');
                error.statusCode = 500;
                next(error);
            }
            else {
                res.status(200).end();
            }
        })
    })
}
//【POST】修改管理员密码 tyn 6.16
exports.modifyPwd = (req, res, next) => {
    let aid = req.body.aid;
    let oldPwd = req.body.oldPwd;
    let newPwd = req.body.newPwd;
    database.queryAdminInfo(aid, (flag, result) => {
        if (result.length > 0) {
            if (result[0].pwd == oldPwd) {
                database.updateAdminPwd([newPwd, aid], (flag, result) => {
                    if (flag == false) {
                        const error = new Error('Database error!');
                        error.statusCode = 500;
                        next(error);
                    }
                    else {
                        res.status(200).end();
                    }
                })
            }
            else {
                const error = new Error('旧密码错误！');
                error.statusCode = 401;
                next(error);
            }
        }
    })
}