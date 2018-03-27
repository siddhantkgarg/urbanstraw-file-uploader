var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: 'test_urbanstraw'
});

var parseXlsx = require('excel');



con.connect(function(err) {
    if (err) throw err;
    parseXlsx('../uploads/customers.xlsx', function(err, data) {
        if (err) throw err;
        var records = [];

        data.forEach(function(object) {
            var record = [];
            if (object[0] !== "" && object[0] !== "Id") {
                //console.log(object);
                //id
                record[0] = object[0];
                //name
                record[1] = object[1];
                //phone
                record[2] = object[2];
                //status
                record[3] = object[3];
                //tag
                record[4] = object[4];
                //address
                record[5] = object[5];
                //ciy
                record[6] = object[6];
                //zip
                record[7] = object[7];
                //email
                record[8] = object[8];
                //type
                record[9] = object[9];
                //occupatino
                record[10] = object[10];
                //extra

                //record[12] = '',
                //created_on 
                record[11] = formatDate(new Date((object[12] - 25569) * 86400 * 1000));

                //modified
                //extra
                records.push(record);

            }
        });
        //console.log(records);
        //         var sql = "INSERT INTO customer ('id','name','phone','status','address','city','zip','email','referer','occupation','created_on') VALUES ?";
        var sql = "INSERT INTO customer (`id`,`name`,`phone`,`status`,`tag`,`address`,`city`,`zip`,`email`,`referer`,`occupation`,`created_on`) VALUES ?";
        //console.log(sql);
        var query = con.query(sql, [records], function(err, result) {
            if (err) throw err;
            console.log(result);
        });

    });
});

function formatDate(date) {
    // console.log(date);
    var day = date.getDate();
    var monthIndex = date.getMonth() + 1;
    var year = date.getFullYear();
    //  console.log(year);
    return year + '-' + monthIndex + '-' + day + ' 00:00:00';
}