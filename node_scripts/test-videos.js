#!/usr/bin/env node
const fs = require('fs');
const fetch = require('node-fetch');
const result = [];
const results = [];

async function doit() {
    console.log('Reading from simfile-registry.json');
    const folders = JSON.parse(fs.readFileSync('src/assets/simfile-registry.json', 'utf8'));
    for (const folder of folders) {
        for (const file of folder.simfiles) {
            for (const youtubeVideo of file.youtubeVideos || []) {
                results.push(await fetch(`http://i3.ytimg.com/vi/${youtubeVideo.id}/default.jpg`, { method: "Get" })
                    .then((response) => response.buffer())
                    .then((buffer) => {
                        const b64 = buffer.toString('base64');
                        if (b64 == '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAUDBAcFBwUFBQUGBQgFBgUFBQUIBQUHBQgFBQUJBggJBQUTChwLBwgaCQgFDiEYGh0RHxMfEwsiGCIeGBwSExIBBQUFBwYHBQgIBRIIBQgSEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEv/AABEIAFoAeAMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQQCAwcGBf/EAD0QAAIBAgMDBwYNBQAAAAAAAAACAQMEBRESBhMhByIxMkFSYRRCcXKS0hVVgYSRlLHBwsPR0/AXUWJks//EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDvQAAAAACYgnSBiDLQNAGIMtA0gYgmYIAAAAAAAAAQZqpipYoqASkbloHyNoNq7HBWWjcb2tWaFdrejEM6I3Vms8zCp4cc/A+RPKhar1cKum9Na3X9QPYbgbg8XPKnT83B3+W9SPyzH+qi/E0/Xl/aA9tuDFqB41eVOj52D1f8tN7Sn8uDbHKfaN04ZeJ6Ktq33wB6d6ZpZTTgG0VljUP5Izo9KNT29RVStCdGpeMwy+iS3WUCuAwAAAAAAMkLtouqVKSF+znioHCseuJuLzELhm1TVu7ltXTzVrMi/JpVIKZNSec7d56je08lvBLCcQurWyR4pTdVVpa24qurpnT28IYCmD023mysYFNpKXU3CXW9XnoqVVejplubE5SuTKXLrYbdYT8MeW6qi21O9a33S7ndOsTpWrnnryZfDMDxoPV7C7IRjqXVardzarRqLRVUpK7tVZNebcYyXKVPN4jbTaV7i1aYdrWrVt2deqzUnlJlfDgB9bk/rzRxTDW1aYq1Wt38VrIyZfTKnYLmDiey7acQwyV6VvLT/sp26784Ci5BLkAAAAAAEoXbRuMekowb6T6QOF3KSlWsjdKVaqN60VZifsMabykq6NKMkrKOrZSrLxiVbsnM+3tthNSxu7p2SdzdValxb1oXmStV5eVaexomWg+FqjvQBaxC/uL1lq3t1WunWNCPUqs7KnTkv9oJfErlqC2U3ddrdZ1LazVfcxpbOOZ0ZZ8SpmSBaw/Ermy1+SXde13saau7qsmpezV9JVmf5PFpbtlm7ZIzGqO9AH1Nkk14jhi/7ls3svDz9h2m4Y5dya4VUrXdK+ZJWjabx97K5K9aUlESl3pjVnOX3nS6jAamIEgAAAAAAErJAA2atXNZYaO7KrMeya2trd+va28+tb0Z/CBmBqbDLFuth9m3zWj7pj8EWHxZZ/VqP6G/MZga1wyyXq4fZr80o+6bVt6CdS1t09W3or+EjMZgbJfs7F6qxwWPVXsMJkgAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=') {
                            console.log(folder.title, '|', file.filename, '|', youtubeVideo.id);
                        }
                    })
                    .catch(console.error));
            }
        }
    }
}
doit();
console.log('Done');