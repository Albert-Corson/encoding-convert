# encoding-convert
Converts a repository to a given encoding

> Compatibility on all node versions and on multiple operating systems has not been tested


## Usage
```
node index.js [fromEncoding] [toEncoding] [pathToConvert] [saveDir]
```
_Passing `-u` as an argument means the value of the said argument will be `undefined`_

- `[fromEncoding]` idicates the encoding of the file(s) that are going to be converted. _Default: autodetect_
- `[toEncoding]` idicates the wanted encoding. _Default: 'UTF-8'_
- `[pathToConvert]` is the path to a file or directory to convert. _Deafult '.'_
- `[saveDir]` is the directory where the files will be saved. _Default: ./CONVERTED/_

`.convIgnore`: The script will automatically look for a .convIgnore file in your working directory (pwd) and will ignore the files/folder mentioned in it (just like a .gitignore file). The content of this file should be in UTF-8

> Note that the file names and tree of the repository will be reproduced in saveDir. __Files that can't be converted or those in the `.convIgnore` will be copied to maintain the tree.__

_Encoding auto detection is not recommended as it lacks in precision_

## Supported encodings
This script uses the [iconv-lite](https://www.npmjs.com/package/iconv-lite) node module for encoding and decoding, thus [here](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings) are the supported file encodings.