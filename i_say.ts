import { ast } from './ast';
import { execute } from './vm';
import { parse } from './parser';

const sentinels = ['please', '?', 'ok?'];
let $: string[] = [];

export const i_say = ([w]: TemplateStringsArray) => {
    if (sentinels.includes(w)) {
        try {
            const astnodes = ast($);
            switch(w) {
                case 'please':
                case 'ok': {
                    execute(astnodes);
                    break;
                }
                case '?': {
                    // TODO
                    // const { result } = evaluate(astnodes);
                    // if (result === true) console.log('yes');
                    // else if (result === false) console.log('no');
                    // else console.log(result);
                    break;
                }
            }
        } catch(err) {
            if (err.compilerError) {
                console.log(err.token, err.message);
            } else {
                console.error(err);
            }
        } finally {
            $ = [];
        }
    } else {
        $.push(w);
    }
    return i_say;
}

if (!module.parent && process.argv.length === 3) {
    try {
        const tokens = parse(process.argv[2]);
        const program = ast(tokens);
        execute(program);
    } catch(err) {
        if (err.compilerError) {
            console.log(err.token, err.message);
        } else {
            console.error(err);
        }
    }
}