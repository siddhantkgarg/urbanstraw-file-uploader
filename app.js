var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

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
const invoice_upload_path = './uploads/invoices/';
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


app.get('/order-manager', function(req, res) {

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
            var wa_message = "Hi " + consumer_name + ", Thanks for ordering from Urban Straw. Your order value is Rs." + total + " and the receipt is attached. It would be delivered to you by 6 PM today.\r\nDo give your feedback and follow us on Facebook at www.facebook.com/urbanstraw.\r\nThanks for making a wise decision. \r\nHave a great day!"
            order.consumer_name = consumer_name;
            order.consumer_id = personid;
            order.consumer_address = consumer_address;
            order.consumer_mobile = "9632484007"; //consumer_mobile;
            order.itemList = invoice_items;
            order.wa_message = wa_message;
            order.total = total;
            order.invoice_path = consumer_name + date + "US2018" + (personid) + "" + exceldate + '.pdf';
            finalList.push(order);
        };
        //     console.log(i);
        res.render("order-manager/index.ejs", { orders: finalList });
    });
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
                date: date
            };
            var invoice_name = (consumer_name + date + invoice_data.number + '.pdf');
            invoice_name.trim();

            invoice_util.generateInvoice(invoice_data, invoice_upload_path + invoice_name, function(msg) {

            }, function(err) {
                console.log(err)
            });
        };
    });
    res.end("Pdfs will be generated shortly. Visit : http://urbanstraw.com:3030 to download files");
});




app.get('/download/:id', function(req, res) {
    console.log("helo");
    res.download(invoice_upload_path + req.params.id);
});

var server = app.listen(3000, function() {
    console.log('Server listening on port 3000');
});


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