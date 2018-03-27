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
    parseXlsx('../uploads/inventory.xlsx', function(err, data) {
        if (err) throw err;
        var records = [];

        data.forEach(function(object) {
            var record = [];
            if (object[0] !== "" && object[0] !== "Id") {
                //name
                record[0] = object[0];
                //sourced_from
                record[1] = object[1];
                //price_per_kg
                record[2] = object[2];
                //status
                record[3] = object[3];
                //created_on
                record[4] = formatDate(new Date((object[4] - 25569) * 86400 * 1000));
                //our_price_per_kg
                record[5] = object[5];

            }
            records.push(record);
        });
        console.log(records);
        var sql = "INSERT INTO inventory (`name`,`sourced_from`,`price_per_kg`,`status`,`created_on`,`our_price_per_kg`) VALUES ?";
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