#!/usr/bin/env node
var fs = require('fs');
var encode = require('byte-base64');

// const regexEmptyLine = /^\s*?$/gm;
// const regexComment = /\/\/.*?$/gm;

console.log('Reading from simfile-registry.json');
var folders = JSON.parse(fs.readFileSync('src/assets/simfile-registry.json', 'utf8'));
for (const folder of folders) {
    console.log(folder.title, folder.simfiles.length);
    for (const file of folder.simfiles) {
        let simfile = fs.readFileSync(`src/assets/Simfiles/${folder.location}/${file.filename}`, 'utf8');        
        // simfile = simfile.replace(regexComment, '');
        // simfile = simfile.replace(regexEmptyLine, '');
        file.simfileDataBase64 = encode.base64encode(simfile);
    }
}
console.log('Writing to simfile-registry-with-data.json');
fs.writeFileSync('src/assets/simfile-registry-with-data.json', JSON.stringify(folders));
console.log('Done');