import { readFileSync } from "fs";

export function parse(filename: string) {
    let code = readFileSync(filename, 'ascii') + ' ';
    code = code.replace(/(?!\B"[^"]*)[\.,!](?![^"]*"\B)/g, ''); // remove punctuation
    const token = /[^"\s]+[\s]|".+?"/g;
    const isStringToken = (t: string) => t.startsWith('"') && t.endsWith('"');
    const tokens: string[] = Array.prototype.slice.apply(code.match(token));
    return tokens.map(t => t.trim())
        .map(t => isStringToken(t) ? t : t.toLowerCase())
        .map(t => isStringToken(t) ? t.slice(1, -1) : t);
}
