const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');

const Converter = require('./src/converter');

const fromEncoding = process.argv[3];
const toEncoding = process.argv[4];
const fromPath = path.resolve(process.cwd(), process.argv[5]);
const toPath = path.resolve(process.cwd(), process.argv[6] || './CONVERTED/');

if (!fromEncoding || !toEncoding || !fromPath) {
    console.log(
        `Usage:\n\tnode index.js <fromEncoding> <toEncoding> <pathToConvert> [saveDir]`
    );
    process.exit(84);
}

if (!fs.existsSync(fromPath)) {
    console.error(`Error: '${fromPath}' doesn't exist`);
    process.exit(84);
}

if (!iconv.encodingExists(fromEncoding)) {
    console.error(`Error: '${fromEncoding}' is not supported`);
    process.exit(84);
}

if (!iconv.encodingExists(toEncoding)) {
    console.error(`Error: '${toEncoding}' is not supported`);
    process.exit(84);
}

const pathStat = fs.lstatSync(fromPath);

if (pathStat.isFile()) {
    Converter.convertFile(fromPath, toPath, fromEncoding, toEncoding);
} else if (pathStat.isDirectory()) {
    const conIgnore = path.resolve(process.cwd(), '.convIgnore');
    let toIgnore = [toPath, conIgnore];

    if (fs.existsSync(conIgnore))
        toIgnore.push(...fs.readFileSync(conIgnore, 'utf-8').split('\n'));

    for (let index = 2; toIgnore[index]; ++index)
        toIgnore[index] = path.resolve(process.cwd(), toIgnore[index]);

    Converter.convertDir(fromPath, toPath, fromEncoding, toEncoding, toIgnore);
} else {
    console.log(`Error: '${fromPath}' is neither a file nor a directory`);
}
