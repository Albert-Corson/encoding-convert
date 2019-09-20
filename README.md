# encoding-convert
Converts a repository to a given encoding

> Compatibility on all node versions and on multiple operating systems has not been tested


## Usage
node index.js fromEncoding toEncoding pathToConvert [saveDir]

- `<fromEncoding>` idicates the encoding of the file(s) that are going to be converted
- `<toEncoding>` idicates the wanted encoding
- `<pathToConvert>` is the path to a file or directory to convert
- `[saveDir]` is the directory where the files will be saved (default: ./CONVERTED/)

`.convIgnore`: The script will automatically look for a .convIgnore file in pwd and will ignore the files mentioned in it (just like a .gitignore file)

> Note that the file names and tree of the repository will be reproduced in saveDir

## Supported encodings
This script uses the [iconv-lite](https://www.npmjs.com/package/iconv-lite) node module, thus [here](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings) are the supported file encodings