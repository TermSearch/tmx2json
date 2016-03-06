#!/usr/bin/env node --harmony
'use strict'
//
// Install:
//
// $ npm install -g tmx2json
//
// Get help:
//
// $ tmx2json.js --help
//

// Todo:
// - Detect false encoding
// - Publish npm package

const cheerio = require('cheerio');
const fs = require('fs');
const through2 = require('through2');
const program = require('commander');
const packageJson = require('./package.json');

//
// Command line interface
//

program
	.version(packageJson.version)
	.option('-e, --encoding <encoding>', 'encoding of tmx file, e.g. utf16le. Default is utf8')
	.on('--help', function () {
		console.log('  Examples:');
		console.log('');
		console.log('    $ cat input.tmx | tmx2json --encoding utf16le');
		console.log('    $ cat input.tmx | tmx2json | jsonlint');
		console.log('    $ gzip -d input.tmx.gz -c | tmx2json | gzip > output.json.gz');
		console.log('    $ unzip -p input.tmx.zip | tmx2json | gzip > output.json.gz');
		console.log('');
		console.log('  With progress bar using pv:'); // (Doesn`t work with unzip!)
		console.log('');
		console.log('    $ pv eu.tmx.gz | gzip -d -c | tmx2json --encoding utf16le | gzip > eu.json.gz');
		console.log('');
	})
	.parse(process.argv);

const encoding = program.encoding || 'utf8'; // Default encoding = utf8

//
// tmx2json
//

// Booleans help write valid JSON
// Write opening [ on begin
// Write closing ] on end
var end = false;
var begin = true;

// Converts tmx (xml format) to Javascript objects
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

// Converts Javascript objects to valid JSON (enclosed in an array [])
const obj2json = function (chunk, enc, callback) {
	if (begin) this.push('[');
	if (!begin) this.push(',\n');
	begin = false;
	this.push(JSON.stringify(chunk, null, 4));
	callback()
}

//
// Glueing all streams together
//

process.stdin.setEncoding(encoding)
	.pipe(through2.obj(tmx2obj))
	.pipe(through2.obj(obj2json))
	.on('end', function () {
		process.stdout.write(']');
	})
	.pipe(process.stdout);
