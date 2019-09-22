const fs = require('fs');
const path = require('path');
const isbinaryfile = require('isbinaryfile');
const iconv = require('iconv-lite');
const jschardet = require('jschardet');

/*
params = {
    pathToConv,
    saveDir,
    fromEncoding,
    toEncoding
}
*/

async function loadConvIgnore(saveDir) {
    const convIgnore = path.resolve(process.cwd(), '.convIgnore');
    let toIgnore = [saveDir, convIgnore];

    if (!fs.existsSync(convIgnore))
        return toIgnore;

    const data = await fs.promises.readFile(convIgnore, 'utf-8');

    toIgnore.push(...data.split('\n'));
    for (let index = 2; toIgnore[index]; ++index)
        toIgnore[index] = path.resolve(process.cwd(), toIgnore[index]);

    return toIgnore;
}

async function translateParams(pathToConv, saveDir, fromEncoding, toEncoding) {
    const isVarValid = (varName, varValue, varType) => {
        const type = typeof varValue;
        if (type !== varType)
            throw `Error: '${varName}': unexpected variable type, got '${type}', expected '${varType}'`;
    }

    isVarValid('pathToConv', pathToConv, 'string');
    isVarValid('saveDir', saveDir, 'string');
    isVarValid('fromEncoding', fromEncoding, 'string');
    isVarValid('toEncoding', toEncoding, 'string');

    const params = {
        pathToConv: path.resolve(process.cwd(), pathToConv || '.'),
        saveDir: path.resolve(process.cwd(), saveDir || './CONVERTED/'),
        fromEncoding: fromEncoding,
        toEncoding: toEncoding || 'UTF-8',
    };

    if (!fs.existsSync(params.pathToConv))
        throw `Error: path to convert isn't valid (${params.pathToConv})`;
    if (params.fromEncoding && !iconv.encodingExists(params.fromEncoding))
        throw `Error: unsupported encoding: '${params.fromEncoding}'`;
    if (!iconv.encodingExists(params.toEncoding))
        throw `Error: unsupported encoding: '${params.toEncoding}'`;

    return params;
}

async function convertDir(params, toIgnore) {
    const basename = path.basename(params.pathToConv);
    const dirs = await fs.promises.readdir(params.pathToConv);

    params.saveDir = path.resolve(params.saveDir, basename);

    let parsed = 0;
    let failed = 0;
    let promises = [];
    for (const dir of dirs) {
        const toConvert = path.resolve(params.pathToConv, dir);

        if (toIgnore.includes(toConvert)) continue;

        const pathStat = await fs.promises.lstat(toConvert);

        const subParams = {
            ...params,
            pathToConv: toConvert,
        }
        if (pathStat.isFile()) {
            promises.push(
                convertFile(subParams)
                    .then(() => ++parsed)
                    .catch(err => {
                        ++failed;
                        console.error(err);
                    })
            );
        } else if (pathStat.isDirectory()) {
            promises.push(
                convertDir(subParams, toIgnore)
                    .then(res => {
                        parsed += res.parsed;
                        failed += res.failed;
                    })
            );
        }
    }
    await Promise.all(promises);
    return { parsed, failed, total: parsed + failed };
}

async function convertFile(params) {
    try {
        await fs.promises.mkdir(params.saveDir, { recursive: true });

        const buffer = await getConvertedFileBuffer(params);
        const savePath = path.resolve(params.saveDir, path.basename(params.pathToConv));

        await fs.promises.writeFile(savePath, buffer);
    } catch (err) {
        throw err;
    }
}

async function getConvertedFileBuffer(params) {
    let buffer;

    try {
        await fs.promises.access(params.pathToConv, fs.constants.R_OK);
    } catch {
        throw `Missing read permissions on ${params.pathToConv}`;
    }
    try {
        buffer = await fs.promises.readFile(params.pathToConv);
    } catch (error) {
        throw `Can't read file ${params.pathToConv}`;
    }
    if (await isbinaryfile.isBinaryFile(buffer))
        throw `Can't convert ${params.pathToConv} (binary file detected)`;

    let fromEncoding = params.fromEncoding;
    if (!fromEncoding) {
        let detected = await jschardet.detect(buffer, { minimumThreshold: 0 });
        if (!iconv.encodingExists(detected.encoding))
            throw `Error: detected encoding ('${detected.encoding}') is not supported (${params.pathToConv})`;
        else
            console.log(`Info: detected encoding '${detected.encoding}' for file ${params.pathToConv} (${detected.confidence * 100}% confident)`);
        fromEncoding = detected.encoding;
    }

    buffer = iconv.decode(buffer, params.fromEncoding);
    buffer = iconv.encode(buffer, params.toEncoding);

    return buffer;
}

module.exports = {
    loadConvIgnore,
    translateParams,
    convertDir,
    convertFile,
    getConvertedFileBuffer
}
