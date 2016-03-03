'use strict'
//
// Usage:
// $ cat testing-data/2010-5K.xml | node tmx2json.js
//
// With gzip
// $ gzip -d testing-data/ECDC.tmx.gz -c | node tmx2json.js | gzip > ECDC.json.gz
//
// Don't forget to set the correct encoding
// - Use utf16le for EU tmx files
// - Use utf8 otherwise

const encoding = 'utf16le';

const cheerio = require('cheerio');
const fs = require('fs');
const through2 = require('through2');

// The conversion function
const tmx2json = function (chunk, enc, callback) {
	let $ = cheerio.load(chunk, {
		xmlMode: true
	});
	const output = []; // output array

	const termUnits = $('tu');
	termUnits.each((i, termUnit) => {
		const obj = {};
		// Specifically for EU tmx files, reads EU document nr.
		// All other properties are discarded
		const prop = $(termUnit).find('prop');
		const type = $(prop).attr('type');
		const text = $(prop).text();
		if (prop && type === "Txt::Doc. No.") obj.docNo = text;

		// This where the translations are
		const terms = $(termUnit).find('tuv');
		terms.each((i, term) => {
			const lang = $(term).attr('xml:lang');
			const text = $(term).find('seg').text();
			obj[lang] = text;
		});
		output.push(obj);
	});

	// Convert output object to json string
	this.push(JSON.stringify(output, null, 2));
	callback()
}

process.stdin.setEncoding(encoding)
	.pipe(through2(tmx2json))
	.pipe(process.stdout);


// url: http://eur-lex.europa.eu/legal-content/EN-DE-NL/TXT/?uri=CELEX:32004R1788&from=EN
