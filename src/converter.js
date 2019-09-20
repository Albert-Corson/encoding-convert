const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');

module.exports = class encodingConverter {
    static convertDir(dirPath, saveDir, fromEncoding, toEncoding, toIgnore = [saveDir]) {
        const basename = path.basename(dirPath);
        const dirs = fs.readdirSync(dirPath);

        saveDir = path.resolve(saveDir, basename);

        for (const index in dirs) {
            const toConvert = path.resolve(dirPath, dirs[index]);

            if (toIgnore.includes(toConvert)) continue;
            const stat = fs.lstatSync(toConvert);

            if (stat.isFile()) {
                this.convertFile(toConvert, saveDir, fromEncoding, toEncoding)
                .catch(err => console.error(err.message));
            } else if (stat.isDirectory()) {
                this.convertDir(toConvert, saveDir, fromEncoding, toEncoding, toIgnore);
            }
        }
    }

    static async convertFile(filePath, saveDir, fromEncoding, toEncoding) {
        try {
            await fs.mkdir(saveDir, { recursive: true }, err => {
                if (err) throw err;
            });

            const buffer = await this.getConvertedFileBuffer(
                filePath,
                fromEncoding,
                toEncoding
            );
            const savePath = path.resolve(saveDir, path.basename(filePath));
            await fs.promises.writeFile(savePath, buffer, toEncoding);
        } catch (err) {
            throw err;
        }
    }

    static async getConvertedFileBuffer(filePath, fromEncoding, toEncoding) {
        try {
            let buffer = await fs.promises.readFile(filePath);

            buffer = await iconv.decode(buffer, fromEncoding);
            buffer = await iconv.encode(buffer, toEncoding);

            return buffer;
        } catch (err) {
            throw err;
        }
    }
};
