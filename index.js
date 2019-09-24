const Converter = require('./converter');

const args = process.argv.slice(2);

for (const index in args) {
    if (args[index] === '-u') {
        args[index] = undefined;
    }
}

Converter.convert(...args)
.then(res => console.log(res))
.catch(err => {
    console.error(err);
    process.exit(1);
});
