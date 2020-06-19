const database = require('../database');
const jwt = require('jsonwebtoken');


const formidable = require("formidable");//用来处理前端上传的FormData

const path = require('path');

const fs = require('fs')

//【POST】登陆
exports.login = (req, res, next) => {
    let rid = req.body.rid;
    let pwd = req.body.pwd;
    database.queryReaderInfo(rid, (flag, result) => {
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
                    res.status(200).json({token: token, rid: rid});
                }
                else {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    next(error);
                }
            }
            else {
                const error = new Error('账户不存在!');
                error.statusCode = 401;
                next(error);
            }
        }
    })
}
//【GET】获取读者昵称
exports.getName = (req, res, next) => {
    let rid = req.query.rid;
    database.queryReaderInfo(rid, (flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            if (result.length > 0) {
                res.status(200).json({
                    rname: result[0].rname,   //管理员姓名
                });
            }
        }
    })
}
// 获取读者的record yyy
exports.records = (req, res, next) => {
    let rid = req.query.rid;
    database.queryreaderlend(rid,(flag, result) => {
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

//【GET】获取所有预约记录 yyy
exports.reservation = (req, res, next) => {
    let rid = req.query.rid;
    database.queryreaderreservation(rid,(flag, result) => {
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

//取消预约 yyy
exports.cancel = (req, res, next) => {
    database.updatereservation(req.body.rid,req.body.isbn,req.body.res_time,(flag) => {
        if (flag == false) {
            //回滚
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            res.status(200).json({flag:flag})
        }
    })
}

//【GET】获取所有历史预约记录 yyy
exports.pastreservation = (req, res, next) => {
    let rid = req.query.rid;
    database.queryreaderpastreservation(rid,(flag, result) => {
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

//【GET】获取读者信息 tyn 6.16
exports.getInfo = (req, res, next) => {
    let rid = req.query.rid;
    database.queryReaderInfo(rid, (flag, result) => {
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
//【POST】修改读者信息 tyn 6.16
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
            let newName = fields.rid + extName;
            let oldPath = files.avatar.path;
            let newPath = path.join(__dirname, '../images/readers', newName);
            //修改文件的名字
            fs.renameSync(oldPath, newPath);
        }
        //修改读者数据库中的信息
        let params = [
            fields.rname,
            fields.tel,
            fields.email,
            fields.rid
        ];
        database.updateReader(params, (flag, result) => {
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
//【POST】修改读者密码 tyn 6.16
exports.modifyPwd = (req, res, next) => {
    let rid = req.body.rid;
    let oldPwd = req.body.oldPwd;
    let newPwd = req.body.newPwd;
    database.queryReaderInfo(rid, (flag, result) => {
        if (result[0].pwd == oldPwd) {
            database.updateReaderPwd([newPwd, rid], (flag, result) => {
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
    })
}


//自动填充
//【GET】根据isbn获取书目信息 yyy
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

//【GET】根据bname获取书目信息 yyy
exports.getCip_name = (req, res, next) => {
    let bname = req.query.bname;
    database.queryCipByBname(bname, (flag, result) => {
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
//增加预约 yyy
exports.add_reservation = (req,res,next) =>{
    let rid = req.body.rid;
    let isbn = req.body.isbn;
    database.addReservation(rid,isbn,(flag, result)=>{
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