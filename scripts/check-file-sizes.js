#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Checks TypeScript files for size compliance with coding standards.
 * - Target: <300 lines
 * - Maximum: 500 lines
 * - Excludes generated files and test files
 */

const MAX_LINES = 500;
const TARGET_LINES = 300;

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Count non-empty, non-comment-only lines
        const codeLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed !== '' && 
                   !trimmed.startsWith('//') && 
                   !trimmed.startsWith('/*') && 
                   !trimmed.startsWith('*') &&
                   trimmed !== '*/';
        });
        
        return {
            total: lines.length,
            code: codeLines.length
        };
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return { total: 0, code: 0 };
    }
}

function checkFileSizes() {
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
    
    console.log('🔍 Checking file sizes...\n');
    
    files.forEach(file => {
        const lineCount = countLines(file);
        const relativePath = path.relative(process.cwd(), file);
        
        if (lineCount.total > MAX_LINES) {
            violations.push({
                file: relativePath,
                lines: lineCount.total,
                codeLines: lineCount.code,
                severity: 'error'
            });
        } else if (lineCount.total > TARGET_LINES) {
            warnings.push({
                file: relativePath,
                lines: lineCount.total,
                codeLines: lineCount.code,
                severity: 'warning'
            });
        }
    });

    // Report results
    if (violations.length === 0 && warnings.length === 0) {
        console.log('✅ All files comply with size standards!');
        console.log(`📊 Checked ${files.length} files`);
        return true;
    }

    // Print violations (errors)
    if (violations.length > 0) {
        console.log('❌ File size violations (>500 lines):');
        violations.forEach(v => {
            console.log(`   ${v.file}: ${v.lines} lines (${v.codeLines} code lines)`);
        });
        console.log('');
    }

    // Print warnings (over target but under max)
    if (warnings.length > 0) {
        console.log('⚠️  Files approaching size limit (>300 lines):');
        warnings.forEach(w => {
            console.log(`   ${w.file}: ${w.lines} lines (${w.codeLines} code lines)`);
        });
        console.log('');
    }

    console.log('📋 File size standards:');
    console.log('   Target: <300 lines per file');
    console.log('   Maximum: 500 lines per file');
    console.log('   Generated files are exempt from these limits');
    console.log('');

    // Return true if no violations (warnings are OK)
    return violations.length === 0;
}

// Run the check
const success = checkFileSizes();
process.exit(success ? 0 : 1);
