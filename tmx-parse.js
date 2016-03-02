var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var fs = require('fs');
var readableStream = fs.createReadStream('testing-data/tm2010-first-5K-lines.tmx');
var data = '';
var str = '';
var utf8str = '';

readableStream.on('data', function(chunk) {
    str = iconv.decode(chunk, 'utf-16le');
    data += str;
    var $ = cheerio.load(chunk, { xmlMode: true });
    var tu = $('tu');
    console.log(tu.text());
});

readableStream.on('end', function() {
    // console.log(data);
});
