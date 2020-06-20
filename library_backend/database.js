let mysql = require('mysql');
const notice = require('./controllers/notice');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '******',
    port: '3306',
    database: 'library'
});
connection.connect();

//根据aid获取管理员所有
exports.queryAdminInfo = (aid, callback) => {
    let sql = 'select * from `administrator` where aid=?';
    let params = [aid];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询管理员信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }

    });
}
//根据rid获取读者所有信息
exports.queryReaderInfo = (rid, callback) => {
    let sql = 'select * from `reader` where rid=?';
    let params = [rid];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询读者信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//获取所有书目信息
exports.queryCips = (callback) => {
    let sql = 'select * from `cip`';
    let flag;
    connection.query(sql, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询书目信息操作成功！');
            console.log(result)
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}



//添加书目信息
exports.insertCips = (params, callback) => {
    let sql = 'insert into `cip` values(?,?,?,?,?,?)';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('插入书目信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//根据isbn获取书目信息
exports.queryCipByIsbn = (isbn, callback) => {
    let sql = 'select * from `cip` where isbn=?';
    let params = [isbn];    //可能由于isbn里有'-'，直接拼接出错
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('根据isbn查询书目信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//更新书目册数
exports.updateCips = (params, callback) => {
    let sql = 'update `cip` set `amount`=`amount`+? where isbn=?';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新成功
            flag = true;
            console.log('更新书目册数操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag);
            }
        }
    });
}
//根据isbn号、已有册数、新增阅览室册数、新增流通室册数、aid插入多条图书记录
exports.insertBooks = (isbn, oldAmount, amount1, amount2, aid, callback) => {
    //字符串拼接，要把引号也拼进去
    let s1 = [isbn, '图书阅览室', '未借出', aid].join('","') + '")';
    let s2 = [isbn, '图书流通室', '未借出', aid].join('","') + '")';
    let sql = 'insert into `book` values';
    for (let i = 1; i <= amount1 + amount2; i++) {
        let s = i <= amount1 ? s1 : s2;
        sql += '("' + isbn + '.' + (oldAmount + i) + '","' + s;
        if (i != amount1 + amount2) {
            sql += ',';
        }
    }
    let flag;
    connection.query(sql, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //插入成功
            flag = true;
            console.log('插入图书信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//获取所有预约信息
exports.queryReservations = (callback) => {
    let sql = 'select `reserve`.isbn, bname, author, `reserve`.rid, rname, res_time, stat from cip, reader, `reserve` where cip.isbn=`reserve`.isbn and reader.rid=`reserve`.rid order by res_time desc';
    let flag;
    connection.query(sql, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询预约信息操作成功！');
            if (callback && typeof (callback) === "function") {
                for (let i = 0; i < result.length; i++) {
                    //修改日期格式
                    let t = result[i].res_time;
                    let tt = [t.getFullYear(), t.getMonth() + 1, t.getDate()];
                    result[i].res_time = tt.join('-')
                    //状态文字化
                    let status = result[i].stat;
                    if (status == 0) {
                        result[i].stat = '预约中';
                    } else if (status == 1) {
                        result[i].stat = '已完成';
                    } else if (status == 2) {
                        result[i].stat = '已过期';
                    }
                }
                callback(flag, result);
            }
        }
    });
}
//获取外借书目信息 yyy
exports.querylend = (callback) => {
    let sql = 'select * from `cip`,`reader`,`book`,`record` where record.rid = reader.rid and record.bid = book.bid and book.isbn=cip.isbn and record.r_time is null order by l_time desc';
    let flag;
    connection.query(sql, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询外借信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
// 修改图书借阅状态 yyy
exports.updateLend = (rid, bid, l_time, isbn, callback) => {
    let date = new Date();
    let sql = 'update `record` set r_time = ? where rid = ? and bid = ?';
    let params = [date, rid, bid]
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新成功
            flag = true;
            let sql1 = 'update `book` set stat = "未借出" where bid = ?';
            let params = [bid]
            let flag1;
            connection.query(sql1, params, function (err, result) {
                if (err) {
                    flag1 = false;
                    console.log(err.message);
                } else {  //更新成功
                    flag1 = true;
                    queryreserve(isbn)
                    console.log('归还图书操作成功！');
                    if (callback && typeof (callback) === "function") {
                        updateBookstatr(bid);
                        let lendTime = new Date(l_time)
                        let diff = date - lendTime;
                        let days = Math.round(diff / (24 * 60 * 60 * 1000))
                        callback(flag, flag1, days);
                    }
                }
            })
        }
    });
}

function updateBookstatr(bid) {
    let sql = 'update book set stat = "未借出" where bid=? '
    params = [bid];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新成功
            flag = true;
            console.log('归还更新图书状态成功！');
        }
    });

}
//查询预约 yyy
function queryreserve(isbn) {
    let sql = 'select reserve.rid,bname,rname,reserve.isbn,res_time,email from `reserve`,`reader`,`cip` where reserve.isbn=? and reserve.isbn = cip.isbn and stat=0 and reserve.rid=reader.rid and res_time = (select min(res_time) from reserve where isbn=? and stat = 0)';
    let params = [isbn, isbn]
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新成功
            flag1 = true;
            console.log('寻找预约记录成功！');
            if (result.length != 0) {
                console.log('进入发送邮件函数');
                notice.reservationNotify(result[0]);
                updatereservationstat(result[0].rid,result[0].isbn,result[0].res_time);
                console.log('发送邮件成功！');
            }
        }
    });
}
function updatereservationstat(rid,isbn,res_time)
{
    let sql = 'update reserve set stat = 1 where rid = ? and isbn=? and res_time=?';
    let params =[rid,isbn,res_time]
    connection.query(sql,params,function (err,result) {
        if (err) {
            console.log(err.message);
        }
    })
}

//增加借阅记录
exports.insertRecord = (rid, bid, callback) => {
    let l_time = new Date();                                //借出日期
    let temp = new Date(l_time);
    let d_time = new Date(temp.setDate(temp.getDate() + 30));    //应还日期（30天后）
    let sql = 'insert into `record` values(?,?,?,?,null)';
    let params = [rid, bid, l_time, d_time];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //插入成功
            flag = true;
            updateBookstat(bid);
            console.log('插入借阅信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//更新book的stat
function updateBookstat(bid) {
    let sql = 'update book set stat = "已借出" where bid=? '
    params = [bid];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新成功
            flag = true;
            console.log('更新图书状态成功！');
        }
    });
}
//找出逾期借阅记录和相关信息
exports.queryExpired = (callback) => {
    //用于在sql字符串中尝试is null失败，故先取所有，再筛选
    let sql = 'select * from `record`,`book`,`reader`,`cip`' +
        'where `record`.bid=`book`.bid and `book`.isbn=`cip`.isbn and `record`.rid=`reader`.rid';
    let params = [];    //可能由于isbn里有'-'，直接拼接出错
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询逾期信息成功！');
            if (callback && typeof (callback) === "function") {
                var expired = [];
                for (let i = 0; i < result.length; i++) {
                    let now = new Date();
                    if (result[i].r_time == undefined && now > new Date(result[i].d_time)) {
                        expired.push(result[i]);
                    }
                }
                callback(flag, expired);
            }
        }
    });
}
//读者借阅记录 yyy
exports.queryreaderlend = (rid,callback) => {
    let sql = 'select record.bid,bname,author,cip.isbn,publisher,pub_date,l_time,d_time,r_time from `record`,`cip`,`book` where rid=? and record.bid = book.bid and book.isbn = cip.isbn order by l_time desc';
    let params = [rid];
    let flag;
    connection.query(sql,params,function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询外借信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}
//查询读者预约 yyy
exports.queryreaderreservation = (rid,callback) => {
    let sql = 'select reserve.isbn,bname,res_time,author,publisher,pub_date from `reserve`,`cip` where rid=? and stat = 0 and reserve.isbn=cip.isbn order by res_time desc';
    let params = [rid];
    let flag;
    connection.query(sql,params,function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询外借信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}

//更新预约 yyy
exports.updatereservation = (rid,isbn,res_time,callback)=> {
    let time_temp = new Date(res_time)
    let sql = 'update `reserve` set stat = 2 where rid = ? and isbn = ? and res_time = ?';
    let params = [rid,isbn,time_temp];
    let flag;
    connection.query(sql,params,function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //更新reseve成功
            flag = true;
            console.log('更新reserve操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag);
            }
        }
    });
}
//历史预约 yyy
exports.queryreaderpastreservation = (rid,callback) => {
    let sql = 'select reserve.isbn,reserve.stat,bname,res_time,author,publisher,pub_date from `reserve`,`cip` where rid=? and (stat = 1 and reserve.isbn=cip.isbn) or (stat=2 and reserve.isbn=cip.isbn) order by res_time desc';
    let params = [rid];
    let flag;
    connection.query(sql,params,function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('查询外借信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}

//更新用户信息 tyn 6.16
exports.updateReader = (params, callback) => {
    let sql = 'update `reader` set rname=?, `tel`=?, `email`=? where rid=?';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        }
        else {  //更新成功
            flag = true;
            console.log('更新用户信息操作成功！');
            if (callback && typeof(callback) === "function") {
                callback(flag);
            }
        }
    });
}
//更新用户密码 tyn 6.16
exports.updateReaderPwd = (params, callback) => {
    let sql = 'update `reader` set pwd=? where rid=?';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        }
        else {  //更新成功
            flag = true;
            console.log('更新用户密码操作成功！');
            if (callback && typeof(callback) === "function") {
                callback(flag);
            }
        }
    });
}
//更新管理员信息 tyn 6.16
exports.updateAdmin = (params, callback) => {
    let sql = 'update `administrator` set aname=? where aid=?';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        }
        else {  //更新成功
            flag = true;
            console.log('更新管理员信息操作成功！');
            if (callback && typeof(callback) === "function") {
                callback(flag);
            }
        }
    });
}
//更新管理员密码 tyn 6.16
exports.updateAdminPwd = (params, callback) => {
    let sql = 'update `administrator` set pwd=? where aid=?';
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        }
        else {  //更新成功
            flag = true;
            console.log('更新管理员密码操作成功！');
            if (callback && typeof(callback) === "function") {
                callback(flag);
            }
        }
    });
}


//根据bname获取书目信息 yyy
exports.queryCipByBname = (bname, callback) => {
    let sql = 'select * from `cip` where bname=?';
    let bnamenew = '';
    if(bname.substr(0,1) == '《' && bname.substr(bname.length-1,1) =='》' )
    {
        bnamenew = bname;
    }
    else
    {
        bnamenew = '《'+bname+'》';
    }
    let params = [bnamenew];
    let flag;
    connection.query(sql, params, function (err, result) {
        if (err) {
            flag = false;
            console.log(err.message);
        } else {  //查询成功
            flag = true;
            console.log('根据isbn查询书目信息操作成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }
    });
}

//增加预约记录 yyy
exports.addReservation =(rid,isbn,callback) => {
    let now = new Date();
    let sql = 'INSERT INTO `reserve` (`rid`, `isbn`, `res_time`,`stat`) VALUES (?,?,?,0)';
    let params=[rid,isbn,now]
    let flag;
    connection.query(sql,params,function (err,result) {
        if(err){
            flag = false;
            console.log(err.message);
        }
        else {  //插入成功
            flag = true;
            console.log('增加预约成功！');
            if (callback && typeof (callback) === "function") {
                callback(flag, result);
            }
        }

    })
}
