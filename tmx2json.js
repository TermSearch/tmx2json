'use strict'

const cheerio = require('cheerio');
const fs = require('fs');
const through2 = require('through2');

// Command line options
const inputFile = process.argv[2];
const outputFile = process.argv[3] || process.argv[2] + '.json';

const xml2json = function (chunk, enc, callback) {
	let through = this;
	let $ = cheerio.load(chunk, {
		xmlMode: true
	});
	let termUnits = $('tu');
	termUnits.each(function (i, termUnit) {
		let docId = $(termUnit).find('prop').text();
		through.push("ID: " + docId);
		let terms = $(termUnit).find('tuv');
		terms.each(function (i, term) {
			let lang = $(term).attr('xml:lang');
			let text = $(term).find('seg').text();
			through.push(lang + ": " + text);
		})
	})
	callback()
}

// UNIX equivalent of
// cat inputFile | xml2json | display on screen
fs.createReadStream(inputFile, {
		encoding: 'utf16le'
	})
	.pipe(through2(xml2json))
	.pipe(process.stdout);


// url: http://eur-lex.europa.eu/legal-content/EN-DE-NL/TXT/?uri=CELEX:32004R1788&from=EN
