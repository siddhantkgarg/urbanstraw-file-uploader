parseXlsx = require('excel');

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
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
                map[object[5]] = map[object[5]] || [];
                map[object[5]].push(object);
            }
        });
        //   console.log(map);
        for (var personid in map) {
            var order = {};
            var template = "";
            var sno = 1;
            var consumer_name = "";
            var consumer_address = "";
            var consumer_mobile = "";
            var total = 0;
            var date = "";
            var item_list = map[personid];
            var exceldate = "";
            // console.log(item_list);

            var invoice_items = [];
            var total = 0;
            var records = [];
            /*

            */
            item_list.forEach(function(item) {
                var record = [];
                date = formatDate(new Date((item[4] - (25569)) * 86400 * 1000));
                    
                item_name = item[0];
                item_quantity = item[1];
                item_price = item[2];
                resultant_price = item[3];
                consumer_mobile = item[9];
                record[0] = 0;
//                console.log("SELECT * FROM inventory where name='" + item_name + "' and created_on='" + date + "'");
                con.query("SELECT * FROM inventory where name='" + item_name + "' and created_on='" + date + "'", function(err, result, fields) {
                    if (err) throw err;
                    if(typeof result[0] !="undefined"){
                      record[1] = result[0].id;
                                      record[1] = item_quantity;
                record[2] = date;
                total += parseFloat(resultant_price);
                records.push(record);

  
                     } 
		     else
                      console.log(item_name+"_"+date);
                    //record[1] = result[0].id;
                });
            });
            var cust_id = 0;
//            console.log("SELECT * from customer where phone='" + consumer_mobile + "'");
            con.query("SELECT * from customer where phone='" + consumer_mobile + "'", function(err, result, fields) {
                if (err) throw err;
                cust_id = result[0].id;
//                console.log(cust_id);
                var orderid = 0;
                var order_record = [total, cust_id, 1, date];
console.log(order_record);
//            con.query("insert into orders(`price`,`customer_id`,`status`,`created_on`) values ?", order_record, function(err, result) {
 //               if (err) throw err;
   //             orderid = result.insertId;
     //       });;
       //     records.forEach(function(record) {
         //      record[0] = orderid;
          //  });
          //  con.query("insert into cart_items(`cartid`,`itemid`,`quantity`,`added_on`) values ?", [records], function(err, result) {
//                if (err) throw err;
//                console.log("items inserted");
//            });


            });


        };
        //     console.log(i);
        //    res.render("order-manager/index.ejs", { orders: finalList });
    });







});


function formatDate(date) {
// console.log(date);
    var day = date.getDate();
    var monthIndex = date.getMonth() + 1;
    var year = date.getFullYear();
  //  console.log(year);
    return year+'-'+monthIndex+'-'+day+' 00:00:00';
}
























