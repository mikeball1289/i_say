import { ASTNode, isValue, ValueNode, StatementNode, FunctionDeclaration, FunctionCallStatement, StatmentBlock, FunctionCallAndAssignStatement } from './ast';
import { question } from 'readline-sync';
import { parseNumber } from './number';

export function execute(program: ASTNode[], locals: Namespace = {}): Namespace {
    for (const statement of program) {
        if (statement.type === 'function') {
            locals[statement.name] = statement;
        } else if (isValue(statement)) {
            evaluate(statement, locals);
        } else {
            run(statement, locals);
        }
    }
    return locals;
}

export function run(statement: StatementNode, locals: Namespace = {}): Namespace {
    switch(statement.type) {
        case 'assignment': {
            locals[statement.lhv.name] = evaluate(statement.rhv, locals);
            break;
        }
        case 'block': {
            runBlock(statement, locals);
            break;
        }
        case 'call':
        case 'callandassign': {
            runFunction(statement, locals);
            break;
        }
        case 'return': {
            locals['__return'] = evaluate(statement.value, locals);
            break;
        }
        case 'if': {
            if (evaluate(statement.condition, locals)) run(statement.body, locals);
            break;
        }
        case 'ifelse': {
            if (evaluate(statement.condition, locals)) run(statement.body, locals);
            else run(statement.otherwise, locals);
            break;
        }
        case 'print': {
            console.log(evaluate(statement.value, locals));
            break;
        }
        case 'prompt': {
            const response = question(statement.prompt + " ");
            locals[statement.readinto.name] = literal(response);
            break;
        }
        case 'while': {
            while (evaluate(statement.condition, locals)) run(statement.body, locals);
            break;
        }
    }
    return locals;
}

function runBlock(block: StatmentBlock, locals: Namespace = {}) {
    for (const statement of block.statements) {
        run(statement, locals);
        if (locals.hasOwnProperty('__return')) {
            break;
        }
    }
}

function runFunction(statement: FunctionCallStatement | FunctionCallAndAssignStatement, locals: Namespace = {}) {
    assertParamsProvided(locals[statement.name], statement);
    const functionscope: { [name: string]: any } = { ...locals };
    for (const param of Object.keys(statement.functionlocalscope)) {
        functionscope[param] = evaluate(statement.functionlocalscope[param], locals);
    }
    run((locals[statement.name] as FunctionDeclaration).body, functionscope);
    if (statement.type === 'callandassign') {
        locals[statement.readinto.name] = functionscope['__return'];
    }
}

export function evaluate(value: ValueNode, locals: Namespace = {}): any {
    switch(value.type) {
        case 'literal': return literal(value.value);
        case 'variable': return locals[value.name];
        case 'sum': return evaluate(value.lhs, locals) + evaluate(value.rhs, locals);
        case 'difference': return evaluate(value.lhs, locals) - evaluate(value.rhs, locals);
        case 'absolutedifference': return Math.abs(evaluate(value.lhs, locals) - evaluate(value.rhs, locals));
        case 'product': return evaluate(value.lhs, locals) * evaluate(value.rhs, locals);
        case 'division': return evaluate(value.lhs, locals) / evaluate(value.rhs, locals);
        case 'randomnumber': {
            const upperBound: number = evaluate(value.upperbound, locals);
            const lowerBound: number = evaluate(value.lowerbound, locals);
            return Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
        }
        case 'equalto': return evaluate(value.lhs, locals) == evaluate(value.rhs, locals);
        case 'lessthan': return evaluate(value.lhs, locals) < evaluate(value.rhs, locals);
        case 'greaterthan': return evaluate(value.lhs, locals) > evaluate(value.rhs, locals);
        case 'differentfrom': return evaluate(value.lhs, locals) != evaluate(value.rhs, locals);
    }
}

function assertParamsProvided(declaration: FunctionDeclaration, call: FunctionCallStatement | FunctionCallAndAssignStatement) {
    for (const param of declaration.params) {
        if (!call.functionlocalscope.hasOwnProperty(param.name)) {
            throw new RuntimeError(`Function call ${declaration.name} missing required parameter ${param.name}`);
        }
    }
}

function literal(value: string) {
    let n = parseNumber(value);
    if (isNaN(n)) {
        n = Number.parseInt(value);
    }
    if (!isNaN(n)) {
        return n;
    }
    return value === 'true' ? true : value === 'false' ? false : value;
}

export interface Namespace {
    [name: string]: any;
}

class RuntimeError extends Error {
    constructor(public message: string) {
        super();
    }
}