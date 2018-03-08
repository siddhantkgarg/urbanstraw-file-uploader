var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

var await = require('await');
var pdf = require('html-pdf');
var options = { "width": "11.7in", "height": "16.5in", "border": "1in" };

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

app.use(express.static(path.join(__dirname, 'public')));

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


app.get('/gr', function(req, res) {
    var response = "";
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

        for (var key in map) {
            //  console.log(key);
            var template = "";
            var sno = 1;
            var consumer_name = "";
            var consumer_address = "";
            var consumer_mobile = "";
            var total = 0;
            var date = "";
            var person = map[key];
            // console.log(person);
            person.forEach(function(items) {
                date = formatDate(new Date((items[4] - (25567 + 1)) * 86400 * 1000));
                consumer_name = items[6];
                consumer_address = items[8];
                consumer_mobile = items[9];
                item_name = items[0];
                item_quantity = items[1];
                item_price = items[2];
                resultant_price = items[3];

                total = total + parseFloat(items[3]);
                template += '<tr><td>' + sno + '</td><td>' + item_name + '</td><td>' + item_quantity + '</td><td> &#8377; ' + item_price + '</td><td> &#8377; ' + resultant_price + '</td></tr>';
                sno++;
            });
            var html = fs.readFileSync('./templates/invoice-template.html', 'utf8');
            var result = html.replace("{{consumer-items}}", template);
            result = result.replace("{{consumer-name}}", consumer_name);
            result = result.replace("{{consumer-address}}", consumer_address);
            result = result.replace("{{consumer-mobile}}", consumer_mobile);
            result = result.replace("{{consumer-total-amount}}", total.toFixed(2));
            result = result.replace("{{consumer-bill-amount}}", total.toFixed(2));
            //console.log(result) 
            console.log(key);

            pdf.create(result, options).toFile('./uploads/invoices/invoice_' + key + '_' + consumer_name + '_' + date + '.pdf', function(err, res) {
                if (err) return console.log(err);
                console.log(res);
                // { filename: '/app/businesscard.pdf' }
                response += (res + "<br/>");
                // fs.appendFileSync('uploads/list.txt', res);
            })

        };

    });
    res.end("Pdfs will be generated shortly. Visit : http://urbanstraw.com:3030 to download files");
});

app.get('/upload', function(req, res) {

})
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

    return day + '_' + monthNames[monthIndex] + '_' + year;
}