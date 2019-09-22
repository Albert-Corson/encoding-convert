const path = require('path');

const Converter = require('./converter');

const fromEncoding = process.argv[2];
const toEncoding = process.argv[3];
const fromPath = !process.argv[4] ? process.argv[4] : path.resolve(process.cwd(), process.argv[4]);
const toPath = path.resolve(process.cwd(), process.argv[5] || './CONVERTED/');

if (!fromEncoding || !toEncoding || !fromPath) {
    console.log(
        `Usage:\n\tnode index.js <fromEncoding> <toEncoding> <pathToConvert> [saveDir]`
    );
    process.exit(1);
}

Converter.convert(fromPath, toPath, fromEncoding, toEncoding)
.then(res => console.log(`Parsed ${res.parsed}/${res.total} files (${res.failed} failed).`))
.catch(err => {
    console.error(err);
    process.exit(1);
});