import fs = require('node:fs');

export const readFile = (filePath: string): string => {
    return fs.readFileSync(filePath, {encoding: 'utf-8'});
};