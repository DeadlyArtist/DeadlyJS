class CustomMath {
    constructor(settings = null) {
        // Merge passed settings with defaults
        settings ??= {};
        let defaultSettings = CustomMath.getDefaultSettings();
        this.operators = settings.operators || defaultSettings.operators;
        this.functions = settings.functions || defaultSettings.functions;
        this.variables = settings.variables || defaultSettings.variables;
        this.brackets = settings.brackets || defaultSettings.brackets;
        this.ignoreCase = settings.ignoreCase || defaultSettings.ignoreCase;

        if (this.ignoreCase) {
            this.lowerCaseOperators = this.mapToLowerCase(this.operators);
            this.lowerCaseFunctions = this.mapToLowerCase(this.functions);
            this.lowerCaseVariables = this.mapToLowerCase(this.variables);
            this.lowerCaseBrackets = this.brackets.map(b => ({
                open: b.open.toLowerCase(),
                close: b.close.toLowerCase(),
                original: b,
            }));
        }
    }

    static parse(formula, settings = null) {
        var math = new CustomMath(settings);
        return math.parse(formula);
    }

    parse(formula) {
        try {
            formula = this.tryIgnoreCase(formula);
            // Tokenize input formula
            const tokens = this.tokenize(formula);
            if (tokens === null) return null;

            // Convert tokens to abstract syntax tree (AST)
            const ast = this.buildAST(tokens);
            if (ast === null) return null;

            // Return an evaluation function (closure over the AST)
            return this.evaluateAST(ast);
        } catch (error) {
            // If parsing or evaluation fails, return null
            return null;
        }
    }

    // Dynamically map properties to lowercased keys
    mapToLowerCase(obj) {
        const map = {};
        for (const key in obj) {
            map[key.toLowerCase()] = obj[key];
        }
        return map;
    }

    // Centralized lookup methods
    getVariable(name) {
        if (this.ignoreCase) {
            return this.lowerCaseVariables[name.toLowerCase()] ?? null;
        }
        return this.variables[name] ?? null;
    }

    getFunction(name) {
        if (this.ignoreCase) {
            return this.lowerCaseFunctions[name.toLowerCase()] ?? null;
        }
        return this.functions[name] ?? null;
    }

    getOperator(name) {
        if (this.ignoreCase) {
            return this.lowerCaseOperators[name.toLowerCase()] ?? null;
        }
        return this.operators[name] ?? null;
    }

    getBracket(token) {
        if (this.ignoreCase) {
            return this.lowerCaseBrackets.find(b => b.open === token || b.close === token)?.original || null;
        }
        return this.brackets.find(b => b.open === token || b.close === token) || null;
    }

    tryIgnoreCase(string) {
        return this.ignoreCase ? string.toLowerCase() : string;
    }

    tokenize(formula) {
        const sortedVariables = Object.keys(this.variables)
            .map(op => this.tryIgnoreCase(op))
            .sort((a, b) => b.length - a.length) // Longer operators first
            .map(op => escapeRegex(op));
        const allVariables = sortedVariables.join('|');
        const variableRegex = new RegExp(`\\b${allVariables}\\b`, 'g');
        formula = formula.replace(variableRegex, (matched) => {
            return this.getVariable(matched);
        });

        const sortedOperators = Object.keys(this.operators)
            .map(op => this.tryIgnoreCase(op))
            .sort((a, b) => b.length - a.length) // Longer operators first
            .map(op => escapeRegex(op));

        // Dynamically build the regex pattern for brackets and operators
        const allOperators = sortedOperators.join('|');
        const bracketChars = this.brackets.map(b => `\\${escapeRegex(this.tryIgnoreCase(b.open))}\\${escapeRegex(this.tryIgnoreCase(b.close))}`).join('');
        const regexPattern = `\\s*(${allOperators}|[A-Za-z_][A-Za-z_0-9]*|\\d*\\.?\\d+|[${bracketChars}])\\s*`;
        const regex = new RegExp(regexPattern, 'g');

        const tokens = [];
        let match;

        // Find all tokens
        while ((match = regex.exec(formula))) {
            tokens.push(match[1]);
        }

        // Validate tokens (check if they are valid components of the formula)
        for (const token of tokens) {
            if (
                !this.getOperator(token) &&
                !this.getFunction(token) &&
                isNaN(token) &&
                !this.getBracket(token)
            ) {
                return null; // Invalid token found
            }
        }

        return tokens;
    }

    buildAST(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        const openBrackets = new Set(this.brackets.map(b => b.open));
        const closeBracketsMap = new Map(this.brackets.map(b => [b.close, b.open]));

        for (const token of tokens) {
            if (!isNaN(token)) {
                outputQueue.push({ type: 'number', value: parseFloat(token) });
            } else if (this.getFunction(token)) {
                operatorStack.push({ type: 'function', name: token });
            } else if (this.getOperator(token)) {
                const operator = this.getOperator(token);
                while (
                    operatorStack.length > 0 &&
                    this.getOperator(operatorStack[operatorStack.length - 1]?.name)?.precedence >=
                    operator.precedence &&
                    operator.associativity === 'left'
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push({ type: 'operator', name: token });
            } else if (openBrackets.has(token)) {
                operatorStack.push({ type: 'left-bracket', value: token });
            } else if (closeBracketsMap.has(token)) {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1].value !== closeBracketsMap.get(token)
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) {
                    return null; // Mismatched brackets
                }
                operatorStack.pop();
                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'function') {
                    outputQueue.push(operatorStack.pop());
                }
            } else {
                return null; // Illegal token
            }
        }

        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op.type === 'left-bracket') {
                return null; // Mismatched brackets
            }
            outputQueue.push(op);
        }

        return outputQueue;
    }

    evaluateAST(ast) {
        const stack = [];

        for (const node of ast) {
            if (node.type === 'number') {
                stack.push(node.value);
            } else if (node.type === 'variable') {
                stack.push(this.getVariable(node.name));
            } else if (node.type === 'function') {
                const arg = stack.pop();
                const func = this.getFunction(node.name);
                if (!func) return null; // Undefined function
                stack.push(func(arg));
            } else if (node.type === 'operator') {
                const b = stack.pop();
                const a = stack.pop();
                const operator = this.getOperator(node.name);
                if (!operator || !operator.func) return null; // Undefined operator or function
                stack.push(operator.func(a, b));
            } else {
                return null; // Illegal node in AST
            }
        }

        if (stack.length !== 1) {
            return null; // Malformed AST
        }
        return stack.pop();
    }

    // Default settings
    static getDefaultOperators() {
        return {
            // Single Operators
            '+': { precedence: 1, associativity: 'left', func: (a, b) => a + b },
            '-': { precedence: 1, associativity: 'left', func: (a, b) => a - b },
            '*': { precedence: 2, associativity: 'left', func: (a, b) => a * b },
            '/': { precedence: 2, associativity: 'left', func: (a, b) => a / b },
            '^': { precedence: 3, associativity: 'right', func: (a, b) => a ** b },

            // Double Operators
            '+/': { precedence: 2, associativity: 'left', func: (a, b) => Math.ceil(a / b) },
            '-/': { precedence: 2, associativity: 'left', func: (a, b) => Math.floor(a / b) },
            '+*': { precedence: 2, associativity: 'left', func: (a, b) => Math.ceil(a * b) },
            '-*': { precedence: 2, associativity: 'left', func: (a, b) => Math.floor(a * b) },
            '+^': { precedence: 2, associativity: 'left', func: (a, b) => Math.ceil(a ** b) },
            '-^': { precedence: 2, associativity: 'left', func: (a, b) => Math.floor(a ** b) },
        };
    }

    static getDefaultFunctions() {
        return {
            sin: Math.sin,
            cos: Math.cos,
            log: Math.log,
            exp: Math.exp,
            sqrt: Math.sqrt,
        };
    }

    static getDefaultVariables() {
        return {
            pi: Math.PI,
            e: Math.E,
        };
    }

    static getDefaultBrackets() {
        return [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
        ];
    }

    static getDefaultSettings() {
        return {
            operators: this.getDefaultOperators(),
            functions: this.getDefaultFunctions(),
            variables: this.getDefaultVariables(),
            brackets: this.getDefaultBrackets(),
            ignoreCase: true,
        };
    }
}
