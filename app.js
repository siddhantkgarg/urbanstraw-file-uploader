var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: 'test_urbanstraw'
});

const invoice_upload_path = './uploads/invoices/';
//var PDFImage = require("pdf-image").PDFImage;
var pdf2img = require('pdf2img');
pdf2img.setOptions({
    type: 'png', // png or jpg, default jpg 
    size: 1024, // default 1024 
    density: 600, // default 600 
    outputdir: invoice_upload_path, // output folder, default null (if null given, then it will create folder name same as file name) 
    outputname: null, // output file name, dafault null (if null given, then it will create image name same as input name) 
    page: null // convert selected page, default null (if null given, then it will convert all pages) 
});

var TinyURL = require('tinyurl');
var pdf = require('html-pdf');
var options = { "width": "11.7in", "height": "16.5in", "border": "1in" };
var invoice_util = require('./invoice');
var parseXlsx = require('excel');
var dataObj = {
    item: "",
    quantity: "",
    cost: "",
    amount: "",
    date: "",
    id: "",
    name: "",
    deliveryStatus: "",
    deliveryaddress: "",
    mobileno: ""
}
var mysql = require('mysql');
app.set('view engine', 'ejs');


var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'usitemtracker';


app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static('static'))
app.use('/uploads/invoices', express.static('download'))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res) {

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });

    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);
});


app.get('/send-invoice', function(req, res) {


    var finalList = [];
    parseXlsx('uploads/orderlist.xlsx', function(err, data) {
        if (err) throw err;
        var map = {};
        //   console.log(data);
        console.log(data);
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
            var invoice_date = "";
            var invoice_items = [];
            var total = 0;
            item_list.forEach(function(item) {
                var invoice_item = {};
                date = formatDate(new Date((item[4] - (25567 + 1)) * 86400 * 1000));
                invoice_date = formatSQL(new Date((item[4] - (25567 + 1)) * 86400 * 1000), 0);
                exceldate = item[4];
                consumer_name = item[6];
                consumer_address = item[8];
                consumer_mobile = item[9];
                item_name = item[0];
                item_quantity = item[1];
                item_price = item[2];
                resultant_price = item[3];
                invoice_item.name = item_name;
                invoice_item.quantity = item_quantity;
                invoice_item.unit_cost = item_price;
                invoice_item.act_cost = resultant_price;
                invoice_items.push(invoice_item);
                total += parseFloat(resultant_price);
            });
            var wa_message = "Hi " + consumer_name + ", Thanks for ordering from Urban Straw. Your order value is Rs." + total + ".%0AYou can paytm @ 8851580833 now or pay in cash when you receive it.%0AThe invoice is attached.";
            order.consumer_name = consumer_name;
            order.consumer_id = personid;
            order.consumer_address = consumer_address;
            order.consumer_mobile = consumer_mobile;
            order.itemList = invoice_items;
            order.wa_message = wa_message;
            order.total = total;
            var upload_path = invoice_upload_path + invoice_date + '/';
            order.invoice_path = upload_path + consumer_name + date + "US2018" + (personid) + "" + exceldate + '.pdf';
            finalList.push(order);
        };
        //     console.log(i);
        res.render("order-manager/send-invoice.ejs", { orders: finalList });
    });
});

app.get('/order-manager', function(req, res) {
    res.render("order-manager/index.ejs", {});
});
app.get('/gr', function(req, res) {

    parseXlsx('uploads/orderlist.xlsx', function(err, data) {
        if (err) throw err;
        var map = {};
        //   console.log(data);
        data.forEach(function(object) {
            if (object[5] !== "" && object[5] !== "ID") {
                map[object[5]] = map[object[5]] || [];
                map[object[5]].push(object);
            }
        });

        for (var personid in map) {
            console.log(personid);
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
            var invoice_path_date = "";
            item_list.forEach(function(item) {
                var invoice_item = {};
                date = formatDate(new Date((item[4] - (25567 + 1)) * 86400 * 1000));
                invoice_path_date = formatSQL(new Date((item[4] - (25567 + 1)) * 86400 * 1000), 0);
                exceldate = item[4];
                consumer_name = item[6];
                consumer_address = item[8];
                consumer_mobile = item[9];
                item_name = item[0];
                item_quantity = item[1];
                item_price = item[2];
                resultant_price = item[3];
                invoice_item.name = item_name;
                invoice_item.quantity = item_quantity;
                invoice_item.unit_cost = item_price;
                invoice_items.push(invoice_item);
            });
            var invoice_data = {
                logo: "http://urbanstraw.com/dist/img/logo.png",
                header: 'Purchase Reciept',
                from: "Urban Straw",
                to: consumer_name + '\r\n' + consumer_address + '\r\n' + consumer_mobile,
                currency: "INR",
                number: "US2018" + (personid) + "" + exceldate,
                payment_terms: "",
                notes: "This is not to be treated as tax invoice.",
                quantity_header: 'Quantity(kg)',
                balance_title: 'Amount ',
                items: invoice_items,
                date: date,
                fields: {
                    "discounts": true,
                    "shipping": true
                },
                shipping: 30,
                discounts: 30
            };
            var invoice_name = (consumer_name + date + invoice_data.number);
            invoice_name.trim();
            var upload_path = invoice_upload_path + invoice_path_date + '/';
            if (!fs.existsSync(upload_path)) {
                fs.mkdirSync(upload_path);
            }
            invoice_util.generateInvoice(invoice_data, upload_path + invoice_name + '.pdf', function(msg) {
                // pdf2img.convert(upload_path + invoice_name + '.pdf', function(err, info) {
                //     if (err) console.log(err)
                //     else console.log(info); // });
            }, function(err) {
                console.log(err)
            });
        };
    });
    res.end("Pdfs will be generated shortly. Visit : http://urbanstraw.com:3030 to download files");
});



app.get('/delivery-reminder', function(req, res) {
    var finalList = [];
    var msg = "Your fresh vegetables are being packed. You will receive them today by 6 PM.";
    parseXlsx('uploads/orderlist.xlsx', function(err, data) {
        if (err) throw err;
        var map = {};
        //   console.log(data);
        console.log(data);
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
            item_list.forEach(function(item) {
                var invoice_item = {};
                date = formatDate(new Date((item[4] - (25567 + 1)) * 86400 * 1000));
                exceldate = item[4];
                consumer_name = item[6];
                consumer_address = item[8];
                consumer_mobile = item[9];
                item_name = item[0];
                item_quantity = item[1];
                item_price = item[2];
                resultant_price = item[3];
                invoice_item.name = item_name;
                invoice_item.quantity = item_quantity;
                invoice_item.unit_cost = item_price;
                invoice_item.act_cost = resultant_price;
                invoice_items.push(invoice_item);
                total += parseFloat(resultant_price);
            });
            // var wa_message = "Hi " + consumer_name + ", Thanks for ordering from Urban Straw. Your order value is Rs." + total + "%0A You can paytm @ 8851580833 now or pay in cash when you receive it. %0AThe invoice is attached.";
            var wa_msg_2 = "Your fresh vegetables are being packed. You will receive them today by 6 PM.";
            order.consumer_name = consumer_name;
            // order.consumer_id = personid;
            // order.consumer_address = consumer_address;
            order.consumer_mobile = consumer_mobile;
            // order.itemList = invoice_items;
            order.wa_message = wa_msg_2;
            // order.total = total;
            // order.invoice_path = consumer_name + date + "US2018" + (personid) + "" + exceldate + '.pdf';
            finalList.push(order);
        };
        //     console.log(i);
        res.render("order-manager/general-msg.ejs", { personlist: finalList, msg: msg });
    });

});

app.get('/feedback-msg', function(req, res) {
    var finalList = [];
    var displayMsg = "Thanks for making a wise decision. Give us feedback so that we can improve more.\r\n<br/> Get 20%25 off on next order with free delivery by sharing photos of your dish prepared with our produce on Facebook and tagging us.";
    parseXlsx('uploads/orderlist.xlsx', function(err, data) {
        if (err) throw err;
        var map = {};
        //   console.log(data);
        console.log(data);
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
            item_list.forEach(function(item) {
                var invoice_item = {};
                date = formatDate(new Date((item[4] - (25567 + 1)) * 86400 * 1000));
                exceldate = item[4];
                consumer_name = item[6];
                consumer_address = item[8];
                consumer_mobile = item[9];
                item_name = item[0];
                item_quantity = item[1];
                item_price = item[2];
                resultant_price = item[3];
                invoice_item.name = item_name;
                invoice_item.quantity = item_quantity;
                invoice_item.unit_cost = item_price;
                invoice_item.act_cost = resultant_price;
                invoice_items.push(invoice_item);
                total += parseFloat(resultant_price);
            });
            var wa_message = "Hi " + consumer_name + ", Thanks for ordering from Urban Straw. Your order value is Rs." + total + " and the receipt is attached. It would be delivered to you by 6 PM today.\r\nDo give your feedback and follow us on Facebook at www.facebook.com/urbanstraw.\r\nThanks for making a wise decision. \r\nHave a great day!";
            var wa_msg_2 = "Thanks for making a wise decision. Give us feedback so that we can improve more.%0AGet 20%25 off on next order with free delivery by sharing photos of your dish prepared with our produce on Facebook and tagging us.%0AFollow us on Facebook at www.facebook.com/urbanstraw";
            order.consumer_name = consumer_name;
            // order.consumer_id = personid;
            // order.consumer_address = consumer_address;
            order.consumer_mobile = consumer_mobile;
            // order.itemList = invoice_items;
            order.wa_message = wa_msg_2;
            // order.total = total;
            // order.invoice_path = consumer_name + date + "US2018" + (personid) + "" + exceldate + '.pdf';
            finalList.push(order);
        };
        res.render("order-manager/general-msg.ejs", { personlist: finalList, msg: displayMsg, x: "hello" });
    });

});



app.get('/download/uploads/invoices/:date/:id', function(req, res) {
    console.log("helo");
    res.download('uploads/invoices/' + req.params.date + '/' + req.params.id);
});

var server = app.listen(3000, function() {
    console.log('Server listening on port 3000');
});


app.get('/generate-track-url', function(oreq, ores) {
    var dateminus1 = formatSQL(new Date(), -5);
    var q = "select cartid,added_on from cart_items where `added_on` >= '" + dateminus1 + "' group by cartid";
    console.log(q);
    var urlmap = {};
    con.query(q, function(err, res) {
        if (err) throw err;
        keymap = {};
        console.log(res);
        res.forEach(function(item) {
            var key = item.cartid + '_' + item.added_on;
            console.log(key);
            var val = encrypt(key);
            console.log(item);
            var urlpromise = new Promise(function(resolve1, reject1) {
                TinyURL.shorten('http://localhost:3000/kyv/' + val, function(url) {
                    console.log(url);
                    var response = {
                        value: url,
                        id: val
                    }
                    resolve1(response);
                });
            });
            urlpromise.then(function(result1) {
                fs.appendFile('trackurl.txt', result1.id + ":" + result1.value + "\r\n", function(err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
            });
        });
    });
    ores.end("Generating short urls");
});

app.get('/kyv/:id', function(req, res) {
    var id = req.params.id;
    console.log(id);
    var value = decrypt(id);

    console.log(value);
    value = value.split("_");
    var cartid = value[0];
    var date = formatSQL(new Date(value[1]), 0);
    console.log(date);
    var q = "select inventory.name,cart_items.itemid,inventory.sourced_from,cart_items.harvest_time from cart_items inner join inventory on cart_items.itemid = inventory.id where `added_on` = '" + date + "' and cartid=" + cartid;
    console.log(q);
    con.query(q, function(err, result) {
        if (err) throw err;
        res.render('track', { result: result });
    })
});




function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}



function formatSQL(date, days) {
    var day = date.getDate() + days;
    var monthIndex = date.getMonth() + 1;
    var year = date.getFullYear();

    return year + '-' + monthIndex + '-' + day;
}

function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}