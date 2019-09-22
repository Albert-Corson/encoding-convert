const fs = require('fs');

const converter = require('./private');

class EncodingConverter {
    /**
     * Converts a files or a directory.
     * 
     * @param {string} [pathToConv]
     * - Path of the file/directory to convert. Default: `.`
     * @param {string} [saveDir]
     * - Path of the directory where to save converted files. Default: `./CONVERTED`
     * @param {string} [fromEncoding]
     * - Name of the encoding of the files. Deafult: `autodetect`
     * @param {string} [toEncoding]
     * - Name of the encoding to convert the files to. Default: `UTF-8`
     * @param {array} [toIgnore]
     * - Array of absolute paths of files/folder to be ignored.
     * If undefined the function will look for a `.convIgnore` file to parse
     * and will add the paths of `saveDir` and `.convIgnore` to the array
     * 
     * @returns {Promise}
     * Promise that resolves with `{ parsed: int, failed: int }` if converting a directory, or no values if converting a file.
     * It rejects with an error message
     */
    static async convert(pathToConv, saveDir, fromEncoding, toEncoding, toIgnore) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);

        if (pathStat.isFile()) {
            return converter.convertFile(pathToConv, saveDir, fromEncoding, toEncoding);
        } else if (pathStat.isDirectory()) {
            if (typeof toIgnore !== 'array')
                toIgnore = await converter.loadConvIgnore(params.saveDir);
            return converter.convertDir(params, toIgnore);
        } else {
            throw `Error: path to convert is neither a file nor a directory (${pathToConv})`;
        }
    }

    /**
     * Recursivly converts files in a directory.
     * 
     * @param {string} [pathToConv]
     * - Path of the directory to convert. Default: `.`
     * @param {string} [saveDir]
     * - Path of the directory where to save converted files. Default: `./CONVERTED`
     * @param {string} [fromEncoding]
     * - Name of the encoding of the files. Deafult: `autodetect`
     * @param {string} [toEncoding]
     * - Name of the encoding to convert the files to. Default: `UTF-8`
     * @param {array} [toIgnore]
     * - Array of absolute paths of files/folder to be ignored.
     * If undefined the function will look for a `.convIgnore` file to parse
     * and will add the paths of `saveDir` and `.convIgnore` to the array
     * 
     * @returns {Promise}
     * Promise that resolves with `{ parsed: int, failed: int, total: int }` or rejects with an error message
     */
    static async convertDir(pathToConv, saveDir, fromEncoding, toEncoding, toIgnore) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);

        if (typeof toIgnore !== 'array')
            toIgnore = await converter.loadConvIgnore(params.saveDir);

        return converter.convertDir(params, toIgnore);
    }


    /**
     * Converts a files.
     * 
     * @param {string} pathToConv
     * - Path of the file to convert.
     * @param {string} [saveDir]
     * - Path of the directory where to save converted files. Default: `./CONVERTED`
     * @param {string} [fromEncoding]
     * - Name of the encoding of the files. Deafult: `autodetect`
     * @param {string} [toEncoding]
     * - Name of the encoding to convert the files to. Default: `UTF-8`
     * 
     * @returns {Promise}
     * Promise that resolves without values or rejects with an error message
     */
    static async convertFile(pathToConv, saveDir, fromEncoding, toEncoding) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);

        if (!pathStat.isFile()) {
            throw `Error: ${pathToConv} is not a file`;
        }
        return converter.convertFile(params);
    }


    /**
     * Get the converted content of a file.
     * 
     * @param {string} filePath
     * - Path of the directory to convert.
     * @param {string} [fromEncoding]
     * - Name of the encoding of the files. Deafult: `autodetect`
     * @param {string} [toEncoding]
     * - Name of the encoding to convert the files to. Default: `UTF-8`
     * 
     * @returns {Promise}
     * Promise that resolves with the converted file content or rejects with an error message
     */
    async getConvertedFileBuffer(filePath, fromEncoding, toEncoding) {
        const params = await converter.translateParams(filePath, undefined, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);

        if (!pathStat.isFile()) {
            throw `Error: ${pathToConv} is not a file`;
        }
        return converter.getConvertedFileBuffer(params);
    }
}

module.exports = EncodingConverter;
