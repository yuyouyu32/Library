const database = require('../database');

const nodemailer = require('nodemailer');

const nodeschedule = require('node-schedule');

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(H)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd HH:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d H:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function(fmt)
{ //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}

//nodemailer发件人信息
const mailTransport = nodemailer.createTransport({
    host : 'smtp.qq.com',
    port: 465,
    secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
    auth : {
        user : '1589972754@qq.com',
        pass : 'pzbyebkodfnziejf'
    },
});

//根据options发邮件
function sendMail(options) {
    mailTransport.sendMail(options, (err, msg)=> {
        if(err){
            console.log(err);
        }
        else {
            console.log(msg);
        }
    })
}

//借书逾期通知
//在数据库中找出逾期的借阅记录及相关信息，向借阅人发送邮件
function recordNotify() {
    database.queryExpired((flag, result) => {
        if (flag == false) {
            const error = new Error('Database error!');
            error.statusCode = 500;
            next(error);
        }
        else {
            result.forEach((element, index, arr) => {
                //邮件内容
                let content = '亲爱的' + element.rname + '，您好！\n\n' +
                    '您于' + new Date(element.l_time).Format("yyyy-MM-dd") + '在我馆借阅的' + element.bname + '（' + element.bid + '）' +
                    '已在' + new Date(element.d_time).Format("yyyy-MM-dd") + '到期，请尽快归还。\n\n' +
                    '谢谢配合！\n\n' +
                    'SHU图书馆 ' + new Date().Format("yyyy-MM-dd");
                //邮件options
                let options = {
                    from        : '1589972754@qq.com',
                    to          : element.email,
                    subject        : '【逾期通知】',
                    text          : content,
                };
                //发送邮件
                sendMail(options);
            })
        }
    })
}

//预约满足通知
//找出预约中的预约记录，找出所有空闲的图书（非触发式，待定）
exports.reservationNotify = (item) => {
    //邮件内容
    let content = '亲爱的' + item.rname + '，您好！\n\n' +
        '您于' + new Date(item.res_time).Format("yyyy-MM-dd") + '在我馆预约的' + item.bname + '（' + item.isbn + '）' +
        '已可借阅。\n\n' +
        '感谢您的预约！\n\n' +
        'SHU图书馆 ' + new Date().Format("yyyy-MM-dd");
    //邮件options
    let options = {
        from        : '1589972754@qq.com',
        to          : item.email,
        subject        : '【可借阅通知】',
        text          : content,
    };
    //发送邮件
    sendMail(options);
}

// 计划任务：每天9点
exports.notifySchedule = () => {
    nodeschedule.scheduleJob('0 0 9 * * *', function(){
        recordNotify();
    });
}