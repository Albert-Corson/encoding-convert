const fs = require('fs');
const path = require('path');
const isbinaryfile = require('isbinaryfile');
const iconv = require('iconv-lite');
const jschardet = require('jschardet');

const copier = require('./copier');

/*
params = {
    pathToConv,
    saveDir,
    fromEncoding,
    toEncoding
}
*/

async function loadConvIgnore(pathToConv, saveDir) {
    const convIgnore = path.resolve(process.cwd(), '.convIgnore');
    let toIgnore = [saveDir, convIgnore];

    if (!fs.existsSync(convIgnore)) return toIgnore;

    const data = await fs.promises.readFile(convIgnore, 'utf-8');

    for (const ignore of data.split('\n')) {
        if (ignore.length <= 0) continue;
        toIgnore.push(path.resolve(process.cwd(), pathToConv, ignore));
    }

    return toIgnore;
}

async function translateParams(pathToConv, saveDir, fromEncoding, toEncoding) {
    const isVarValid = (varName, varValue, varType) => {
        const type = typeof varValue;
        if (varValue && type !== varType)
            throw `Error: '${varName}': unexpected variable type, got '${type}', expected '${varType}'`;
    };

    isVarValid('pathToConv', pathToConv, 'string');
    isVarValid('saveDir', saveDir, 'string');
    isVarValid('fromEncoding', fromEncoding, 'string');
    isVarValid('toEncoding', toEncoding, 'string');

    const params = {
        pathToConv: path.resolve(process.cwd(), pathToConv || '.'),
        saveDir: path.resolve(process.cwd(), saveDir || './CONVERTED/'),
        fromEncoding: fromEncoding,
        toEncoding: toEncoding || 'UTF-8'
    };

    if (!fs.existsSync(params.pathToConv))
        throw `Error: path to convert isn't valid: ${params.pathToConv}`;
    if (params.fromEncoding && !iconv.encodingExists(params.fromEncoding))
        throw `Error: unsupported encoding: '${params.fromEncoding}'`;
    if (!iconv.encodingExists(params.toEncoding))
        throw `Error: unsupported encoding: '${params.toEncoding}'`;

    return params;
}

async function convert(params, toIgnore) {
    const pathStat = await fs.promises.lstat(params.pathToConv);
    
    let parsed = 0;
    let failed = 0;
    let copied = 0;
    if (toIgnore.includes(params.pathToConv)) {
        await copier.copy(params).then(res => {
            copied += res.copied;
            failed += res.failed;
        });
    } else if (pathStat.isFile()) {
        await convertFile(params)
            .then(converted => {
                if (converted) ++parsed;
                else ++copied;
            })
            .catch(err => {
                ++failed;
                console.log(err);
            });
    } else if (pathStat.isDirectory()) {
        await convertDir(params, toIgnore).then(res => {
            parsed += res.parsed;
            failed += res.failed;
            copied += res.copied;
        });
    }

    return {
        parsed,
        failed,
        copied
    };
}

async function convertDir(params, toIgnore) {
    const basename = path.basename(params.pathToConv);
    const dirs = await fs.promises.readdir(params.pathToConv);
    const subParams = {
        ...params,
        saveDir: path.resolve(params.saveDir, basename)
    };

    let parsed = 0;
    let failed = 0;
    let copied = 0;
    let promises = [];
    for (const dir of dirs) {
        subParams.pathToConv = path.resolve(params.pathToConv, dir);

        if (subParams.pathToConv !== params.saveDir) {
            promises.push(convert(subParams, toIgnore).then(res => {
                parsed += res.parsed;
                failed += res.failed;
                copied += res.copied;
            }));
        }
    }
    await Promise.all(promises);
    return {
        parsed,
        failed,
        copied,
        total: parsed + failed + copied
    };
}

async function convertFile(params) {
    let buffer;
    try {
        const res = await getConvertedFileBuffer(params);
        buffer = res.buffer;
        if (!params.fromEncoding)
            console.log(`Info: detected encoding '${res.encoding}' (confidence: ${res.confidence * 100}%): ${params.pathToConv}`);
    } catch (err) {
        buffer = await copier.copyFile(params);
        console.log(err + ' (created a copy)');
        return false;
    }

    const savePath = path.resolve(
        params.saveDir,
        path.basename(params.pathToConv)
    );

    await fs.promises.mkdir(params.saveDir, { recursive: true });
    await fs.promises.writeFile(savePath, buffer);
    return true;
}

async function getConvertedFileBuffer(params) {
    let buffer;

    try {
        await fs.promises.access(params.pathToConv, fs.constants.R_OK);
    } catch (err) {
        throw `Error: missing read permissions: ${params.pathToConv}`;
    }

    try {
        buffer = await fs.promises.readFile(params.pathToConv);
    } catch (error) {
        throw `Error: can't read file: ${params.pathToConv}`;
    }

    if (await isbinaryfile.isBinaryFile(buffer)) {
        throw `Error: can't convert, non-text file detected: ${params.pathToConv}`;
    }

    let detected;
    let fromEncoding = params.fromEncoding;
    if (!fromEncoding) {
        detected = await jschardet.detect(buffer, { minimumThreshold: 0 });
        if (!iconv.encodingExists(detected.encoding))
            throw `Error: detected encoding '${detected.encoding}' is not supported: ${params.pathToConv}`;
        fromEncoding = detected.encoding;
    }

    buffer = iconv.decode(buffer, fromEncoding);
    buffer = iconv.encode(buffer, params.toEncoding);

    return {
        encoding: fromEncoding,
        confidence: detected ? detected.confidence : 1,
        buffer
    };
}

module.exports = {
    loadConvIgnore,
    translateParams,
    convertDir,
    convertFile,
    getConvertedFileBuffer
};
