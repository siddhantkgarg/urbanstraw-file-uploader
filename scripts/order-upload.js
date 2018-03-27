parseXlsx = require('excel');

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: 'test_urbanstraw'
});

con.connect(function(err) {
    if (err) throw err;
    parseXlsx('../uploads/order-upload.xlsx', function(err, data) {
        if (err) throw err;
        var map = {};
        //   console.log(data);
        data.forEach(function(object) {
            if (object[5] !== "" && object[5] !== "ID") {
                map[object[10]] = map[object[10]] || [];
                map[object[10]].push(object);
            }
        });

        var records = [];
        //   console.log(map);
        //console.log(map);
        for (var orderid in map) {
            var order = {};
            var template = "";
            var sno = 1;
            var consumer_name = "";
            var consumer_address = "";
            var consumer_mobile = "";
            var total = 0;
            var date = "";
            var item_list = map[orderid];
            var exceldate = "";
            // console.log(item_list);

            var invoice_items = [];
            var total = 0;
            /*

            */
            var itemNameList = [];
            item_list.forEach(function(item) {

                var qpromise = new Promise(function(resolve, reject) {

                    date = formatDate(new Date((item[4] - 25569) * 86400 * 1000));
                    item_name = item[0];
                    var oid = orderid;
                    con.query("select * from inventory where name = '" + item_name + "' and created_on='" + date + "'", function(err, res) {
                        if (err) throw err;
                        res.orderid = oid;
                        res.date = date;
                        resolve(res);
                    });
                });

                qpromise.then(function(res) {
                    //console.log(res);
                    item_id = res[0].id;
                    console.log(date);
                    item_quantity = item[1];
                    item_price = item[2];
                    resultant_price = item[3];
                    consumer_mobile = item[9];
                    total += parseFloat(resultant_price);
                    customer_id = item[5];
                    status = 1;
                    var d = formatDate(new Date((item[4] - 25569) * 86400 * 1000));
                    var cart = [
                        [res.orderid, item_id, item_quantity, resultant_price, d, customer_id]
                    ];
                    con.query("insert into cart_items(`cartid`,`itemid`,`quantity`,`price`,`added_on`,`cust_id`) values ?", [cart], function(err1, res1) {
                        if (err1) throw err1;
                        console.log(res1);
                    });
                });
            });
        };

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