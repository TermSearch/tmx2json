'use strict'

const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');

// Command line options
const inputFile = process.argv[2];
const outputFile = process.argv[3] || process.argv[2] + '.json';

const readableStream = fs.createReadStream(inputFile);

readableStream.on('data', function(chunk) {

    // decode utf-16le in tmx file
    let str = iconv.decode(chunk, 'utf-16le');
    let $ = cheerio.load(str, { xmlMode: true });
    let termUnits = $('tu');

    termUnits.each(function(i, termUnit) {
      let docId = $(this).find('prop').text();
      console.log("ID: " + docId);
      let terms = $(this).find('tuv');
      terms.each(function(i, term) {
        let lang = $(this).attr('xml:lang');
        let text = $(this).find('seg').text();
        console.log(lang + ": " + text);
      })
    })

    // let lang = termUnit.
    // // let lang = termUnit.find('tuv').attr('xml:lang');
    // // let termStr = termUnit.find('tuv').find('seg').text();
    // // let output = "Language: "+termUnit[0].find('tuv');
    // let t = cheerio.load(termUnit[1], { xmlMode: true });
    // let output = t('tuv').attr('xml:lang');
    // console.log(output);
});

readableStream.on('end', function() {

});


// url: http://eur-lex.europa.eu/legal-content/EN-DE-NL/TXT/?uri=CELEX:32004R1788&from=EN
