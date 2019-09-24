const fs = require('fs');

const converter = require('./converter');

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
     * Promise that resolves with `{ converted: int, copied: int, failed: int, total: int }`
     * It rejects with an error message
     */
    static async convert(pathToConv, saveDir, fromEncoding, toEncoding, toIgnore) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);
        
        if (pathStat.isFile()) {
            const retValue = {
                converted: 0,
                failed: 0,
                copied: 0
            };
            await converter.convertFile(params, true)
                .then(res => {
                    if (res)
                        ++retValue.converted;
                    else
                        ++retValue.copied;
                }).catch(err => {
                    console.error(err);
                    ++retValue.failed;
                });
            retValue.total = retValue.converted + retValue.failed + retValue.copied;

            return retValue;
        } else if (pathStat.isDirectory()) {
            if (!toIgnore)
                toIgnore = await converter.loadConvIgnore(params.pathToConv, params.saveDir);
            else if (!Array.isArray(toIgnore))
                throw Error(`Error: 'toIgnore': expected an array but got ${typeof toIgnore}`);

            return converter.convertDir(params, toIgnore);
        } else {
            throw Error(`Error: path to convert is neither a file nor a directory (${pathToConv})`);
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
     * Promise that resolves with `{ converted: int, copied: int, failed: int, total: int }` or rejects with an error message
     */
    static async convertDir(pathToConv, saveDir, fromEncoding, toEncoding, toIgnore) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);

        if (!toIgnore)
            toIgnore = await converter.loadConvIgnore(params.pathToConv, params.saveDir);
        else if (!Array.isArray(toIgnore))
            throw Error(`Error: 'toIgnore': expected an array but got ${typeof toIgnore}`);

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
     * Promise that resolves with true the conversion was successful or false if the file was just copied.
     * It rejects with an error message
     */
    static async convertFile(pathToConv, saveDir, fromEncoding, toEncoding) {
        const params = await converter.translateParams(pathToConv, saveDir, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);

        if (!pathStat.isFile()) {
            throw Error(`Error: path to convert is not a file: ${pathToConv}`);
        }

        return converter.convertFile(params, true);
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
     * Promise that resolves with `{ buffer, encoding: string, confidence: int }` or rejects with an error message
     */
    async getConvertedFileBuffer(filePath, fromEncoding, toEncoding) {
        const params = await converter.translateParams(filePath, undefined, fromEncoding, toEncoding);
        const pathStat = fs.lstatSync(params.pathToConv);

        if (!pathStat.isFile()) {
            throw Error(`Error: path to convert is not a file: ${pathToConv}`);
        }
        return converter.getConvertedFileBuffer(params);
    }
}

module.exports = EncodingConverter;
