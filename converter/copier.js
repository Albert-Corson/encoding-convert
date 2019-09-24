const fs = require('fs');
const path = require('path');

async function copy(params) {
    const pathStat = await fs.promises.lstat(params.pathToConv);

    let copied = 0;
    let failed = 0;
    if (pathStat.isFile()) {
        await copyFile(params)
            .then(() => ++copied)
            .catch(err => {
                ++failed;
                console.log(err);
            });
    } else if (pathStat.isDirectory()) {
        await copyDir(params).then(res => {
            copied += res.copied;
            failed += res.failed;
        });
    }
    return {
        copied,
        failed,
    };
}

async function copyDir(params) {
    const basename = path.basename(params.pathToConv);
    const dirs = await fs.promises.readdir(params.pathToConv);
    const subParams = {
        ...params,
        saveDir: path.resolve(params.saveDir, basename),
    };


    let copied = 0;
    let failed = 0;
    let promises = [];
    for (const dir of dirs) {
        subParams.pathToConv = path.resolve(params.pathToConv, dir);

        promises.push(copy(subParams).then(res => {
            copied += res.copied;
            failed += res.failed;
        }));

    }
    await Promise.all(promises);
    return {
        copied,
        failed,
        total: copied + failed
    };
}

async function copyFile(params) {
    const savePath = path.resolve(params.saveDir, path.basename(params.pathToConv));

    await fs.promises.mkdir(params.saveDir, { recursive: true });
    await fs.promises.copyFile(params.pathToConv, savePath, fs.constants.COPYFILE_EXCL);
}

module.exports = {
    copy,
    copyDir,
    copyFile,
};
