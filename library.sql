DROP DATABASE IF EXISTS library;
CREATE DATABASE library CHARACTER SET utf8 COLLATE utf8_general_ci;
USE library;

# 管理员表
DROP TABLE IF EXISTS administrator;
CREATE TABLE administrator
(
	aid VARCHAR(10) NOT NULL PRIMARY KEY,
	aname VARCHAR(10) NOT NULL,
    pwd VARCHAR(20) NOT NULL
);

# 读者表
DROP TABLE IF EXISTS reader;
CREATE TABLE reader
(
	rid VARCHAR(10) NOT NULL PRIMARY KEY,
	rname VARCHAR(10) NOT NULL,
    tel VARCHAR(20) NOT NULL,
    email VARCHAR(50) NOT NULL,
    pwd VARCHAR(20) NOT NULL
);

# 书目表
DROP TABLE IF EXISTS cip;
CREATE TABLE cip
(
	isbn VARCHAR(20) NOT NULL PRIMARY KEY,
	bname VARCHAR(40) NOT NULL,
    author VARCHAR(30) NOT NULL,
    publisher VARCHAR(30) NOT NULL,
    pub_date VARCHAR(20) NOT NULL,
    amount INT NOT NULL
);

# 图书表
DROP TABLE IF EXISTS book;
CREATE TABLE book
(
	bid VARCHAR(30) NOT NULL PRIMARY KEY,
	isbn VARCHAR(20) NOT NULL,
	location VARCHAR(20) NOT NULL,
    stat VARCHAR(20) NOT NULL,
    aid VARCHAR(10) NOT NULL,
    FOREIGN KEY(isbn) REFERENCES cip(isbn)
		ON UPDATE CASCADE
        ON DELETE CASCADE,
	FOREIGN KEY(aid) REFERENCES administrator(aid)
		ON UPDATE CASCADE
        ON DELETE CASCADE
);

# 借还记录表
DROP TABLE IF EXISTS record;
CREATE TABLE record
(
	rid VARCHAR(10) NOT NULL,
	bid VARCHAR(30) NOT NULL,
	l_time DATETIME NOT NULL,
    d_time DATETIME NOT NULL,
    r_time DATETIME,
    PRIMARY KEY(rid, bid),
    FOREIGN KEY(rid) REFERENCES reader(rid)
		ON UPDATE CASCADE
        ON DELETE CASCADE,
	FOREIGN KEY(bid) REFERENCES book(bid)
		ON UPDATE CASCADE
        ON DELETE CASCADE
);

# 预约记录表
DROP TABLE IF EXISTS reserve;
CREATE TABLE reserve
(
	rid VARCHAR(10) NOT NULL,
	isbn VARCHAR(20) NOT NULL,
	res_time DATETIME NOT NULL,
    stat INT NOT NULL,
    PRIMARY KEY(rid, isbn, res_time),
    FOREIGN KEY(rid) REFERENCES reader(rid)
		ON UPDATE CASCADE
        ON DELETE CASCADE,
	FOREIGN KEY(isbn) REFERENCES cip(isbn)
		ON UPDATE CASCADE
        ON DELETE CASCADE
);

delimiter //
# 触发器：每个人借书不能超过10本
DROP TRIGGER IF EXISTS trig1//
CREATE TRIGGER trig1
AFTER INSERT ON record FOR EACH ROW
BEGIN
	DECLARE msg VARCHAR(200);
	DECLARE cnt INT;
    SET cnt = (SELECT COUNT(*) FROM record WHERE rid=new.rid);
    IF (cnt > 10) THEN
		SET msg = "借书不能超过10本！";
        SIGNAL SQLSTATE 'HY000' SET MESSAGE_TEXT = msg;
	END IF;
END //

# 过程：预约超过10天失效
DROP PROCEDURE IF EXISTS del_res//
CREATE PROCEDURE del_res()
    BEGIN
       UPDATE reserve SET stat=2 WHERE TO_DAYS(NOW())-TO_DAYS(res_time)>=10 AND stat=0;
    END //

# 触发器：预约成功后选最小的一本图书状态改为“已预约”，修改预约记录的stat为1
DROP TRIGGER IF EXISTS trig2//
CREATE TRIGGER trig2
BEFORE INSERT ON reserve FOR EACH ROW
BEGIN
	DECLARE cnt INT;
    DECLARE bidd VARCHAR(30);	# 变量名不能和查询的表字段名相同，惨痛的教训
	SET cnt = (SELECT COUNT(*) FROM book WHERE isbn=new.isbn AND stat="未借出");
	IF (cnt >= 1) THEN
		SET bidd = (SELECT MIN(bid) FROM (SELECT bid FROM book WHERE isbn=new.isbn AND stat="未借出") AS x);
        UPDATE book SET stat="已预约" WHERE bid=bidd;
		SET new.stat=1;
        # update reserve set stat=1 where rid=new.rid and isbn=new.isbn;
	END IF;
END //

delimiter ;

SET GLOBAL event_scheduler = 1;
DROP EVENT IF EXISTS del_res_event;
CREATE EVENT del_res_event
	ON SCHEDULE EVERY 1 DAY
	ON COMPLETION PRESERVE  
	DO CALL del_res();

ALTER EVENT del_res_event 
	ON COMPLETION PRESERVE ENABLE; 


# 初始化数据
# 管理员
INSERT INTO `library`.`administrator` (`aid`, `aname`, `pwd`) VALUES ('1001', '唐烨男', '123456');
INSERT INTO `library`.`administrator` (`aid`, `aname`, `pwd`) VALUES ('1002', '于烨泳', '123456');
# 读者
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120001', '张三', '13924357765', '1589972754@qq.com', '123456');
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120002', '李四', '13625341198', '18916339782@163.com', '123456');
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120003', '王五', '18988884628', 'tangyenan@163.com', '123456');
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120216', '唐宝', '13924357223', '624297803@qq.com', '123456');
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120004', '李七', '13625312198', 'tangyenan@cloud.com', '123456');
INSERT INTO `library`.`reader` (`rid`, `rname`, `tel`, `email`, `pwd`) VALUES ('17120005', '周八', '18238884628', 'tangyenan@gmail.com', '123456');
# 书目
INSERT INTO `library`.`cip` (`isbn`, `bname`, `author`, `publisher`, `pub_date`, `amount`) VALUES ('978-7-302-02368-9', '《数据结构》', '严蔚敏，吴伟民', '清华大学出版社', '1997.04', '3');
INSERT INTO `library`.`cip` (`isbn`, `bname`, `author`, `publisher`, `pub_date`, `amount`) VALUES ('978-7-302-16105-9', '《数据库实用教程（第三版）》', '董渐全，丁宝康', '清华大学出版社', '2007.11', '4');
INSERT INTO `library`.`cip` (`isbn`, `bname`, `author`, `publisher`, `pub_date`, `amount`) VALUES ('978-7-121-10228-8', '《计算机系统结构（第三版）》', '徐炜民，严允中', '电子工业出版社', '2010.03', '1');
INSERT INTO `library`.`cip` (`isbn`, `bname`, `author`, `publisher`, `pub_date`, `amount`) VALUES ('978-7-302-38141-9', '《编译原理（第三版）》', '王生原等', '清华大学出版社', '1998.01', '1');
INSERT INTO `library`.`cip` (`isbn`, `bname`, `author`, `publisher`, `pub_date`, `amount`) VALUES ('978-7-5606-3350-3', '《操作系统》', '汤小丹等', '西安电子科技大学', '2014.05', '1');
# 图书
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-02368-9.1', '978-7-302-02368-9', '图书流通室', '已借出', '1001');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-02368-9.2', '978-7-302-02368-9', '图书流通室', '未借出', '1001');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-02368-9.3', '978-7-302-02368-9', '图书流通室', '未借出', '1001');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-16105-9.1', '978-7-302-16105-9', '图书流通室', '未借出', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-16105-9.2', '978-7-302-16105-9', '图书流通室', '未借出', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-16105-9.3', '978-7-302-16105-9', '图书流通室', '未借出', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-16105-9.4', '978-7-302-16105-9', '图书阅览室', '不外借', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-121-10228-8.1', '978-7-121-10228-8', '图书流通室', '已借出', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-302-38141-9.1', '978-7-302-38141-9', '图书流通室', '已借出', '1002');
INSERT INTO `library`.`book` (`bid`, `isbn`, `location`, `stat`, `aid`) VALUES ('978-7-5606-3350-3.1', '978-7-5606-3350-3', '图书流通室', '已借出', '1002');


# 借阅记录
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120216', '978-7-121-10228-8.1', '2020-1-10 14:39:00', '2020-2-10 14:39:00','2020-4-21 17:40:00');
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120216', '978-7-302-38141-9.1', '2020-2-21 13:50:00', '2020-3-21 13:50:00',  '2020-2-23 19:13:00');
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120216', '978-7-5606-3350-3.1', '2020-3-21 12:50:00',  '2020-4-21 12:50:00','2020-4-21 21:50:00');
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120216', '978-7-302-16105-9.2', '2020-4-21 15:50:00',  '2020-5-21 15:50:00','2020-5-21 14:12:00');
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120216', '978-7-302-02368-9.1', '2020-4-10 14:33:00','2020-5-10 14:33:00',null);

INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120001', '978-7-121-10228-8.1', '2020-6-10 12:33:00','2020-7-10 12:33:00',null);
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120002', '978-7-302-38141-9.1', '2020-6-11 13:33:00','2020-7-11 13:33:00',null);
INSERT INTO `library`.`record` (`rid`, `bid`, `l_time`, `d_time`,`r_time`) VALUES ('17120003', '978-7-5606-3350-3.1', '2020-6-11 14:33:00','2020-7-11 14:33:00',null);


# 预约记录
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120216', '978-7-302-02368-9', '2019-11-21 18:25:00', 2);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120001', '978-7-302-02368-9', '2019-12-22 18:35:00', 2);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120002', '978-7-302-16105-9', '2020-1-20 18:07:00', 1);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120003', '978-7-302-16105-9', '2020-2-13 17:08:00', 2);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120216', '978-7-121-10228-8', '2020-3-13 16:05:00', 1);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120004', '978-7-121-10228-8', '2020-4-10 13:05:00', 2);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120005', '978-7-302-38141-9', '2020-5-13 15:05:00', 1);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120001', '978-7-5606-3350-3', '2020-5-16 17:05:00', 1);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120216', '978-7-5606-3350-3', '2020-6-13 18:25:00', 0);
INSERT INTO `library`.`reserve` (`rid`, `isbn`, `res_time`, `stat`) VALUES ('17120216', '978-7-302-38141-9', '2020-6-14 18:21:00', 0);

#更新预约状态
UPDATE `library`.`book` SET `stat` = '未借出' WHERE (`bid` = '978-7-302-02368-9.2');
UPDATE `library`.`book` SET `stat` = '未借出' WHERE (`bid` = '978-7-302-02368-9.3');
UPDATE `library`.`book` SET `stat` = '未借出' WHERE (`bid` = '978-7-302-16105-9.1');
UPDATE `library`.`book` SET `stat` = '未借出' WHERE (`bid` = '978-7-302-16105-9.2');


