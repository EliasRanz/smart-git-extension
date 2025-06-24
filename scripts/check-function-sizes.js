#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Checks TypeScript functions for size compliance with coding standards.
 * - Target: <40 lines per function
 * - Maximum: 50 lines per function
 * - Excludes test files and generated files
 */

const MAX_FUNCTION_LINES = 50;
const TARGET_FUNCTION_LINES = 40;

function parseFunctions(content, filePath) {
    const lines = content.split('\n');
    
    // Simple regex patterns for different function types
    const patterns = [
        /function\s+(\w+)\s*\(/,                    // function name()
        /(public|private|protected)\s+(\w+)\s*\(/,  // method declarations
        /(\w+)\s*[=:]\s*\(/,                       // arrow functions and assignments
        /async\s+(\w+)\s*\(/                       // async functions
    ];

    return extractFunctionsFromLines(lines, patterns);
}

function extractFunctionsFromLines(lines, patterns) {
    const functions = [];
    let braceDepth = 0;
    let currentFunction = null;
    let inFunction = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (shouldSkipLine(trimmed)) continue;

        if (!inFunction && isFunctionStart(trimmed, patterns)) {
            currentFunction = createFunctionInfo(trimmed, i + 1, patterns);
            inFunction = true;
            braceDepth = 0;
        }

        if (inFunction) {
            const { openBraces, closeBraces } = countBraces(line);
            braceDepth += openBraces - closeBraces;
            currentFunction.endLine = i + 1;

            if (braceDepth <= 0 && openBraces > 0) {
                finalizeFunctionInfo(currentFunction, lines);
                functions.push(currentFunction);
                inFunction = false;
                currentFunction = null;
            }
        }
    }

    return functions;
}

function shouldSkipLine(trimmed) {
    return !trimmed || 
           trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*');
}

function isFunctionStart(trimmed, patterns) {
    return patterns.some(pattern => pattern.test(trimmed));
}

function createFunctionInfo(trimmed, lineNumber, patterns) {
    let functionName = 'anonymous';
    
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
            functionName = match[1] || match[2] || 'anonymous';
            break;
        }
    }
    
    return {
        name: functionName,
        startLine: lineNumber,
        endLine: lineNumber
    };
}

function countBraces(line) {
    return {
        openBraces: (line.match(/\{/g) || []).length,
        closeBraces: (line.match(/\}/g) || []).length
    };
}

function finalizeFunctionInfo(functionInfo, lines) {
    const functionLength = functionInfo.endLine - functionInfo.startLine + 1;
    const functionLines = lines.slice(functionInfo.startLine - 1, functionInfo.endLine);
    
    const codeLines = functionLines.filter(line => {
        const trimmed = line.trim();
        return trimmed !== '' && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('/*') && 
               !trimmed.startsWith('*') &&
               trimmed !== '*/';
    }).length;

    functionInfo.totalLines = functionLength;
    functionInfo.codeLines = codeLines;
}

function checkFunctionSizes() {
    const pattern = 'src/**/*.ts';
    const files = glob.sync(pattern, {
        ignore: [
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
            'src/**/*.d.ts',
            'node_modules/**',
            'dist/**',
            'out/**'
        ]
    });

    let violations = [];
    let warnings = [];
    let totalFunctions = 0;
    
    console.log('🔍 Checking function sizes...\n');
    
    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const functions = parseFunctions(content, file);
            totalFunctions += functions.length;
            
            functions.forEach(func => {
                const relativePath = path.relative(process.cwd(), file);
                
                if (func.codeLines > MAX_FUNCTION_LINES) {
                    violations.push({
                        file: `${relativePath}:${func.startLine}`,
                        function: func.name,
                        lines: func.codeLines,
                        severity: 'error'
                    });
                } else if (func.codeLines > TARGET_FUNCTION_LINES) {
                    warnings.push({
                        file: `${relativePath}:${func.startLine}`,
                        function: func.name,
                        lines: func.codeLines,
                        severity: 'warning'
                    });
                }
            });
        } catch (error) {
            console.error(`Error processing file ${file}: ${error.message}`);
        }
    });

    // Report results
    if (violations.length === 0 && warnings.length === 0) {
        console.log('✅ All functions comply with size standards!');
        console.log(`📊 Checked ${totalFunctions} functions in ${files.length} files`);
        return true;
    }

    // Print violations (errors)
    if (violations.length > 0) {
        console.log('❌ Function size violations (>50 lines):');
        violations.forEach(v => {
            console.log(`   ${v.file} - ${v.function}(): ${v.lines} lines`);
        });
        console.log('');
    }

    // Print warnings (over target but under max)
    if (warnings.length > 0) {
        console.log('⚠️  Functions approaching size limit (>40 lines):');
        warnings.forEach(w => {
            console.log(`   ${w.file} - ${w.function}(): ${w.lines} lines`);
        });
        console.log('');
    }

    console.log('📋 Function size standards:');
    console.log('   Target: <40 lines per function');
    console.log('   Maximum: 50 lines per function');
    console.log('   Each function should have a single responsibility');
    console.log('');

    // Return true if no violations (warnings are OK)
    return violations.length === 0;
}

// Run the check
const success = checkFunctionSizes();
process.exit(success ? 0 : 1);
