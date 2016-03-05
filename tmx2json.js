#!/usr/bin/env node --harmony

'use strict'
//
// Usage:
// $ cat input.tmx | node tmx2json.js
//
// With gzip
// $ gzip -d input.tmx.gz -c | node tmx2json.js | gzip > output.json.gz
//
// With unzip
// $ unzip -p input.tmx.zip | node tmx2json.js | gzip > output.json.gz
//
// Verify JSON with
// $ cat input.tmx | node tmx2json.js | jsonlint
//
// Don't forget to set the correct encoding
// - Use utf16le for EU tmx files
// - Use utf8 otherwise
//

const cheerio = require('cheerio');
const fs = require('fs');
const through2 = require('through2');
const program = require('commander');

//
// Command line interface
//
program
  .option('-e, --encoding <encoding>', 'encoding of tmx file, e.g. utf16le. Default is utf8')
  .parse(process.argv);

const encoding = encoding || 'utf8';

if (process.stdin.read() === null) {
   console.error("No input stream. See 'tmx2json --help'");
   process.exit(1);
}

//
// tmx2json
//

var end = false;
var begin = true;

const tmx2obj = function (chunk, enc, callback) {
	let $ = cheerio.load(chunk, {
		xmlMode: true
	});
	const termUnits = $('tu');
	termUnits.each((i, termUnit) => {
		const obj = {};
		// Specifically for EU tmx files, reads EU document nr.
		// url: http://eur-lex.europa.eu/legal-content/EN-DE-NL/TXT/?uri=CELEX:32004R1788&from=EN
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
		this.push(obj);
	});
	callback()
}

const obj2json = function (chunk, enc, callback) {
	if (begin) this.push('[');
	if (!begin) this.push(',\n');
	begin = false;
	this.push(JSON.stringify(chunk, null, 4));
	callback()
}

//
// Glueing all streams
//

process.stdin.setEncoding(encoding)
	.pipe(through2.obj(tmx2obj))
	.pipe(through2.obj(obj2json))
	.on('end', function() { process.stdout.write(']'); })
	.pipe(process.stdout);
