import { ASTNode } from './ast';

function consume(tokens: string[], matching: string, negativeLookahead?: string): boolean {
    const matchingTokens = matching.split(' ');
    if (matchingTokens.reduce((acc, t, i) => acc && t === tokens[i], true)) {
        if (!negativeLookahead || tokens[matchingTokens.length] != negativeLookahead) {
            tokens.splice(0, matchingTokens.length);
            return true;
        }
    }
    return false;
}

function consumeAssert(tokens: string[], matching: string, message = 'An error occurred') {
    if (!consume(tokens, matching)) throw new CompilerError(matching, message);
}

// opening keywords: let, show me, tell me, ask me, is, I'll explain how to, first, then, finally, if, as long as, let's
// infix operators: equal to, greater than, less than, different from, divided by
// prefix operators: sum of, product of, difference of, difference between
export function ast(tokens: string[]): ASTNode[] {
    let statements: ASTNode[] = [];
    let functions: FunctionDeclaration[] = [];
    while (tokens.length > 0) {
        const branch = constructFunction(tokens) || constructStatement(tokens) || constructValue(tokens);
        if (branch.type === 'function') {
            functions.push(branch);
        } else {
            statements.push(branch);
        }
    }
    
    return (functions as ASTNode[]).concat(statements);
}

function constructFunction(tokens: string[]): FunctionDeclaration | null {
    if (consume(tokens, 'i\'ll explain how to')) {
        const name = tokens.shift()!;
        const params: Variable[] = [];
        while (consume(tokens, 'i\'ll tell you what')) {
            params.push({ type: 'variable', name: tokens.shift()! });
            consumeAssert(tokens, 'is');
            consume(tokens, 'and');
        }
        const body = assertNonemptyStatement(constructStatement(tokens), tokens[0]);
        return { type: 'function', name, params, body };
    }
    return null;
}

function constructStatement(tokens: string[]): StatementNode | null {
    if (consume(tokens, 'let')) {
        const varName = { type: 'variable', name: tokens.shift()! } as Variable;
        consumeAssert(tokens, 'be', 'Assignment requires "be"');
        const value = constructValue(tokens);
        return { type: 'assignment', lhv: varName, rhv: value } as Assignment;
    } else if (consume(tokens, 'first') || consume(tokens, 'you should')) {
        return statementBlock(tokens);
    } else if (consume(tokens, 'if')) {
        return ifStatement(tokens);
    } else if (consume(tokens, 'as long as')) {
        return whileStatement(tokens);
    } else if (consume(tokens, 'tell me') || consume(tokens, 'show me')) {
        return { type: 'print', value: constructValue(tokens) };
    } else if (consume(tokens, 'ask me')) {
        return promptStatement(tokens);
    } else if (consume(tokens, 'let\'s')) {
        const name = tokens.shift()!;
        const functionlocalscope: { [name: string]: ValueNode } = {};
        if (consume(tokens, 'where')) {
            do {
                const paramname = tokens.shift()!;
                consumeAssert(tokens, 'is');
                const paramvalue = constructValue(tokens);
                functionlocalscope[paramname] = paramvalue;
            } while(consume(tokens, 'and', 'call'));
        }
        if (consume(tokens, 'and call it')) {
            const readinto = { type: 'variable', name: tokens.shift()! } as Variable;
            return { type: 'callandassign', name, functionlocalscope, readinto };
        } else {
            return { type: 'call', name, functionlocalscope };
        }
    } else if (consume(tokens, 'the answer is')) {
        return { type: 'return', value: constructValue(tokens) };
    } else if (consume(tokens, 'increment')) {
        const lhv = { type: 'variable', name: tokens.shift()! } as Variable;
        const rhv = { type: 'sum', lhs: lhv, rhs: { type: 'literal', value: 'one' } as LiteralNode } as ArithmeticNode;
        return { type: "assignment", lhv, rhv };
    } else if (consume(tokens, 'decrement')) {
        const lhv = { type: 'variable', name: tokens.shift()! } as Variable;
        const rhv = { type: 'difference', lhs: lhv, rhs: { type: 'literal', value: 'one' } as LiteralNode } as ArithmeticNode;
        return { type: "assignment", lhv, rhv };
    }
    return null;
}

function whileStatement(tokens: string[]): WhileStatement {
    const condition = constructValue(tokens);
    consume(tokens, 'then');
    consume(tokens, 'you');
    const body = assertNonemptyStatement(constructStatement(tokens), tokens[0]);
    return { type: 'while', condition, body }
}

function promptStatement(tokens: string[]): PromptStatement {
    const prompt = tokens.shift()!;
    consumeAssert(tokens, 'and call it', 'No target variable provided for prompt input');
    const readinto = { type: 'variable', name: tokens.shift()! } as Variable;
    return { type: 'prompt', prompt, readinto };
}

function ifStatement(tokens: string[]): IfStatement | IfElseStatement {
    const condition = constructValue(tokens);
    consume(tokens, 'then');
    consume(tokens, 'you');
    const body = assertNonemptyStatement(constructStatement(tokens), tokens[0]);
    if (consume(tokens, 'otherwise')) {
        const otherwise = assertNonemptyStatement(constructStatement(tokens), tokens[0]);
        return { type: 'ifelse', condition, body, otherwise };
    }
    return { type: 'if', condition, body };
}

function assertNonemptyStatement(statement: StatementNode | null, token: string): StatementNode {
    if (!statement) throw new CompilerError(token, `Expected valid statement but got ${token} instead`);
    return statement;
}

function statementBlock(tokens: string[]): StatmentBlock {
    let statements: StatementNode[] = [];
    statements.push(assertNonemptyStatement(constructStatement(tokens), tokens[0]));
    while (consume(tokens, 'then')) {
        statements.push(assertNonemptyStatement(constructStatement(tokens), tokens[0]));
    }
    if (!consume(tokens, 'and lastly') && !consume(tokens, 'finally')) {
        throw new CompilerError(tokens[0], 'Statment block must end with lastly');
    }
    statements.push(assertNonemptyStatement(constructStatement(tokens), tokens[0]));
    return { type: 'block', statements };
}

function constructValue(tokens: string[]): ValueNode {
    let value: ValueNode | null = null;
    if (consume(tokens, 'the value of')) {
        value = { type: 'variable', name: tokens.shift()! } as Variable;
    }
    if (!value) {
        value = arithmeticValue(tokens);
    }
    if (!value) {
        value = randomNumber(tokens);
    }
    if (!value) {
        value = { type: 'literal', value: tokens.shift()! };
    }
    if (consume(tokens, 'is')) {
        return logicalValue(value, tokens);
    } else if (consume(tokens, 'divided by')) {
        const rhs = constructValue(tokens);
        return { type: 'division', lhs: value, rhs };
    } else {
        return value;
    }
}

function randomNumber(tokens: string[]): RandomNumberNode | null {
    if (consume(tokens, 'a random number between')) {
        const lowerbound = constructValue(tokens);
        consumeAssert(tokens, 'and', 'Expected "and" between lower and upper random number bounds');
        const upperbound = constructValue(tokens);
        return { type: 'randomnumber', upperbound, lowerbound };
    }
    return null;
}

function arithmeticValue(tokens: string[]): ValueNode | null {
    if (consume(tokens, 'the product of')) {
        const lhs = constructValue(tokens);
        consumeAssert(tokens, 'and');
        const rhs = constructValue(tokens);
        return { type: 'product', lhs, rhs };
    } else if (consume(tokens, 'the sum of')) {
        const lhs = constructValue(tokens);
        consumeAssert(tokens, 'and');
        const rhs = constructValue(tokens);
        return { type: 'sum', lhs, rhs };
    } else if (consume(tokens, 'the difference of')) {
        const lhs = constructValue(tokens);
        consumeAssert(tokens, 'and');
        const rhs = constructValue(tokens);
        return { type: 'difference', lhs, rhs };
    } else if (consume(tokens, 'the difference between')) {
        const lhs = constructValue(tokens);
        consumeAssert(tokens, 'and');
        const rhs = constructValue(tokens);
        return { type: 'absolutedifference', lhs, rhs };
    }
    return null;
}

function logicalValue(lhs: ValueNode, tokens: string[]): ValueNode {
    if (consume(tokens, 'equal to')) {
        const rhs = constructValue(tokens);
        return { type: 'equalto', lhs, rhs };
    } else if (consume(tokens, 'greater than')) {
        const rhs = constructValue(tokens);
        return { type: 'greaterthan', lhs, rhs };
    } else if (consume(tokens, 'less than')) {
        const rhs = constructValue(tokens);
        return { type: 'lessthan', lhs, rhs };
    } else if (consume(tokens, 'different from')) {
        const rhs = constructValue(tokens);
        return { type: 'differentfrom', lhs, rhs };
    }
    throw new CompilerError(tokens[0], 'Expected logical comparator after "is"');
}

export type ASTNode = ValueNode | StatementNode | FunctionDeclaration;

export type ValueNode = LiteralNode | ArithmeticNode | LogicalNode | Variable | RandomNumberNode;
export const isValue = (n: ASTNode): n is ValueNode => ['literal', 'sum', 'division', 'product', 'difference', 'absolutedifference', 'greaterthan', 'lessthan', 'equalto', 'differentfrom', 'variable', 'randomnumber'].includes(n.type);

export interface LiteralNode {
    type: 'literal';
    value: string;
}

export interface Variable {
    type: 'variable';
    name: string;
}

export interface ArithmeticNode {
    type: 'sum' | 'division' | 'product' | 'difference' | 'absolutedifference';
    lhs: ValueNode;
    rhs: ValueNode;
}

export interface LogicalNode {
    type: 'greaterthan' | 'lessthan' | 'equalto' | 'differentfrom';
    lhs: ValueNode;
    rhs: ValueNode;
}

export interface RandomNumberNode {
    type: 'randomnumber';
    lowerbound: ValueNode;
    upperbound: ValueNode;
}

export type StatementNode = Assignment | StatmentBlock | IfStatement | IfElseStatement | PromptStatement | PrintStatement | WhileStatement | FunctionCallStatement | FunctionCallAndAssignStatement | ReturnStatement;

export interface Assignment {
    type: 'assignment';
    lhv: Variable;
    rhv: ValueNode;
}

export interface StatmentBlock {
    type: 'block';
    statements: StatementNode[];
}

export interface IfStatement {
    type: 'if';
    condition: ValueNode;
    body: StatementNode;
}

export interface IfElseStatement {
    type: 'ifelse';
    condition: ValueNode;
    body: StatementNode;
    otherwise: StatementNode;
}

export interface PromptStatement {
    type: 'prompt';
    prompt: string;
    readinto: Variable;
}

export interface PrintStatement {
    type: 'print';
    value: ValueNode;
}

export interface WhileStatement {
    type: 'while';
    condition: ValueNode;
    body: StatementNode;
}

export interface ReturnStatement {
    type: 'return';
    value: ValueNode;
}

export interface FunctionCallStatement {
    type: 'call';
    name: string;
    functionlocalscope: { [name: string]: ValueNode };
}

export interface FunctionCallAndAssignStatement {
    type: 'callandassign';
    name: string;
    functionlocalscope: { [name: string]: ValueNode };
    readinto: Variable;
}

export interface FunctionDeclaration {
    type: 'function';
    name: string;
    params: Variable[];
    body: StatementNode;
}

class CompilerError extends Error {
    readonly compilerError = true;
    constructor(public token: string, public message: string) {
        super();
    }
}