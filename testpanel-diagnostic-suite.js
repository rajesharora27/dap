// TestPanelNew Frontend Issue Resolution Suite
// This script identifies and provides fixes for the TypeScript compilation errors
// and potential runtime issues in the TestPanelNew component

const fs = require('fs').promises;
const path = require('path');

class TestPanelNewDiagnostic {
    constructor() {
        this.issues = [];
        this.fixes = [];
        this.testResultsPath = '/home/rajarora/dap/testpanel-diagnostic-results.json';
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    addIssue(category, description, severity, fix = null) {
        const issue = {
            category,
            description,
            severity, // CRITICAL, HIGH, MEDIUM, LOW
            fix,
            timestamp: new Date().toISOString()
        };
        this.issues.push(issue);

        const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : severity === 'MEDIUM' ? '📋' : '💡';
        this.log(`${emoji} ${category}: ${description}`, severity);
    }

    addFix(description, code = null, file = null) {
        const fix = {
            description,
            code,
            file,
            timestamp: new Date().toISOString()
        };
        this.fixes.push(fix);
        this.log(`🔧 FIX: ${description}`, 'FIX');
    }

    async analyzeCompilationErrors() {
        this.log('🔍 Analyzing TypeScript compilation errors...', 'ANALYSIS');

        // From the compilation errors we saw, identify specific issues
        const knownErrors = [
            {
                error: "Variable 'createdLicenses' implicitly has type 'any[]'",
                category: "TypeScript Type Inference",
                severity: "MEDIUM",
                fix: "Add explicit type annotation for createdLicenses array",
                solution: `const createdLicenses: Array<{ id: string; name: string; level: number; }> = [];`
            },
            {
                error: "Parameter 'p' implicitly has an 'any' type",
                category: "TypeScript Type Inference",
                severity: "MEDIUM",
                fix: "Add explicit type annotations for function parameters",
                solution: `latestProducts.find((p: any) => p.id === state.createdTestProductId)`
            },
            {
                error: "Cannot assign to read only property '0' of object '[object Array]'",
                category: "GraphQL Data Mutation",
                severity: "CRITICAL",
                fix: "Use spread operator to create copy before sorting",
                solution: `const sortedLicenses = [...targetProduct.licenses].sort((a: any, b: any) => a.level - b.level);`
            }
        ];

        knownErrors.forEach(error => {
            this.addIssue(error.category, error.error, error.severity, error.solution);
        });
    }

    async analyzeRuntimeIssues() {
        this.log('🔍 Analyzing potential runtime issues...', 'ANALYSIS');

        // Based on our test results, identify runtime issues
        const runtimeIssues = [
            {
                category: "Weight Capacity Limits",
                description: "Most products have reached 100% weight capacity, preventing new task creation",
                severity: "HIGH",
                fix: "Implement weight capacity checking and user feedback in TestPanelNew"
            },
            {
                category: "Cache Management",
                description: "Apollo cache may not update immediately after task creation",
                severity: "MEDIUM",
                fix: "Ensure proper cache clearing and refetching after mutations"
            },
            {
                category: "Error Handling",
                description: "Missing comprehensive error handling for weight limits and validation failures",
                severity: "HIGH",
                fix: "Add try-catch blocks with specific error messages for different failure scenarios"
            },
            {
                category: "State Persistence",
                description: "Test state may not persist correctly between operations",
                severity: "MEDIUM",
                fix: "Verify localStorage persistence and state restoration"
            }
        ];

        runtimeIssues.forEach(issue => {
            this.addIssue(issue.category, issue.description, issue.severity, issue.fix);
        });
    }

    generateTestPanelNewFixes() {
        this.log('🔧 Generating TestPanelNew fixes...', 'FIXES');

        // Fix 1: Type annotations for createdLicenses
        this.addFix(
            "Add type annotations for createdLicenses array",
            `// Replace line 478:
const createdLicenses = [];

// With:
const createdLicenses: Array<{
  id: string;
  name: string; 
  level: number;
  description: string;
  isActive: boolean;
}> = [];`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );

        // Fix 2: Function parameter type annotations
        this.addFix(
            "Add type annotations for function parameters",
            `// Replace instances of implicit any parameters:
latestProducts.find(p => p.id === state.createdTestProductId)

// With explicit types:
latestProducts.find((p: any) => p.id === state.createdTestProductId)`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );

        // Fix 3: GraphQL data mutation fix  
        this.addFix(
            "Fix GraphQL read-only array mutation",
            `// Replace direct array sorting:
const sortedLicenses = targetProduct.licenses.sort((a, b) => a.level - b.level);

// With spread operator copy:
const sortedLicenses = [...targetProduct.licenses].sort((a: any, b: any) => a.level - b.level);`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );

        // Fix 4: Weight capacity validation
        this.addFix(
            "Enhanced weight capacity validation and user feedback",
            `// Add before task creation:
if (remainingWeight <= 0) {
  const errorMessage = \`Cannot create task: Product "\${targetProduct.name}" has reached 100% weight capacity (\${usedWeight}% used). Please reduce existing task weights or choose a different product.\`;
  updateTestResult(testName, {
    success: false,
    message: errorMessage
  });
  log(errorMessage, testName);
  return;
}

if (testTaskData.weight > remainingWeight) {
  log(\`⚠️ Adjusting task weight from \${testTaskData.weight}% to \${Math.min(remainingWeight - 0.1, testTaskData.weight)}% due to capacity limits\`, testName);
  testTaskData.weight = Math.max(0.1, Math.min(remainingWeight - 0.1, testTaskData.weight));
}`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );

        // Fix 5: Enhanced error handling
        this.addFix(
            "Comprehensive error handling for task creation",
            `// Replace basic catch block with detailed error handling:
} catch (error: any) {
  let errorMessage = \`Task creation test failed: \${error.message}\`;
  
  // Specific error handling
  if (error.message.includes('weight')) {
    errorMessage = \`Task creation failed: Weight allocation issue. Current usage: \${usedWeight}%, attempted: \${testTaskData.weight}%, available: \${remainingWeight}%\`;
  } else if (error.message.includes('estMinutes') || error.message.includes('required')) {
    errorMessage = \`Task creation failed: Missing required fields. Check GraphQL schema requirements.\`;
  } else if (error.message.includes('licenseLevel')) {
    errorMessage = \`Task creation failed: Invalid license level "\${testTaskData.licenseLevel}". Available levels: Essential, Advantage, Signature\`;
  } else if (error.message.includes('Sequence number')) {
    errorMessage = \`Task creation failed: Sequence number conflict. Try without specifying sequenceNumber.\`;
  }
  
  updateTestResult(testName, {
    success: false,
    message: errorMessage
  });
  log(\`❌ \${errorMessage}\`, testName);
  
  // Additional debugging info
  log(\`🔧 Debug info: Product=\${targetProduct.name}, Weight=\${testTaskData.weight}%, License=\${testTaskData.licenseLevel}\`, testName);
}`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );

        // Fix 6: Product selection improvement
        this.addFix(
            "Improved product selection for task creation",
            `// Replace simple first product selection with capacity-aware selection:
let targetProduct = null;

// First priority: Use the test product we created
if (state.createdTestProductId) {
  targetProduct = latestProducts.find((p: any) => p.id === state.createdTestProductId);
  if (targetProduct) {
    const currentTasks = targetProduct.tasks?.edges || [];
    const usedWeight = currentTasks.reduce((sum: number, edge: any) => sum + (edge.node.weight || 0), 0);
    const remainingWeight = 100 - usedWeight;
    
    if (remainingWeight <= 1) {
      log(\`⚠️ Test product "\${targetProduct.name}" has insufficient weight capacity (\${remainingWeight}% remaining)\`, testName);
      targetProduct = null; // Look for alternative
    } else {
      log(\`🎯 Using TEST PRODUCT: \${targetProduct.name} (ID: \${state.createdTestProductId}, Available: \${remainingWeight}%)\`, testName);
    }
  }
}

// Fallback: Find product with available weight capacity
if (!targetProduct && latestProducts.length > 0) {
  for (const product of latestProducts) {
    const currentTasks = product.tasks?.edges || [];
    const usedWeight = currentTasks.reduce((sum: number, edge: any) => sum + (edge.node.weight || 0), 0);
    const remainingWeight = 100 - usedWeight;
    
    if (remainingWeight >= 5) { // Need at least 5% for meaningful task
      targetProduct = product;
      log(\`🎯 Using product with available capacity: \${product.name} (Available: \${remainingWeight}%)\`, testName);
      break;
    }
  }
}

if (!targetProduct) {
  throw new Error('No products available with sufficient weight capacity for task creation. All products may have reached 100% capacity.');
}`,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );
    }

    async generateFixedTestPanelNewCode() {
        this.log('📝 Generating complete fixed TestPanelNew code...', 'CODEGEN');

        const fixedCode = `
    // FIXED simulateTaskCreation function for TestPanelNew.tsx
    const simulateTaskCreation = async () => {
        const testName = 'taskCreation';
        setTestRunning(testName, true);
        log('🧪 Starting REAL task creation test...', testName);

        try {
            // Ensure we have the latest product data
            log('🔄 Loading latest product data...', testName);
            const latestProducts = await loadProducts();

            // Enhanced product selection with capacity awareness
            let targetProduct = null;

            // First priority: Use the test product we created (with capacity check)
            if (state.createdTestProductId) {
                const testProduct = latestProducts.find((p: any) => p.id === state.createdTestProductId);
                if (testProduct) {
                    const currentTasks = testProduct.tasks?.edges || [];
                    const usedWeight = currentTasks.reduce((sum: number, edge: any) => sum + (edge.node.weight || 0), 0);
                    const remainingWeight = 100 - usedWeight;
                    
                    if (remainingWeight >= 5) { // Need at least 5% for task
                        targetProduct = testProduct;
                        log(\`🎯 Using TEST PRODUCT: \${targetProduct.name} (Available: \${remainingWeight}%)\`, testName);
                    } else {
                        log(\`⚠️ Test product has insufficient capacity (\${remainingWeight}% remaining)\`, testName);
                    }
                }
            }

            // Fallback: Find any product with available capacity
            if (!targetProduct && latestProducts.length > 0) {
                for (const product of latestProducts) {
                    const currentTasks = product.tasks?.edges || [];
                    const usedWeight = currentTasks.reduce((sum: number, edge: any) => sum + (edge.node.weight || 0), 0);
                    const remainingWeight = 100 - usedWeight;
                    
                    if (remainingWeight >= 5) {
                        targetProduct = product;
                        log(\`🎯 Using available product: \${product.name} (Capacity: \${remainingWeight}%)\`, testName);
                        break;
                    }
                }
            }

            if (!targetProduct) {
                throw new Error('No products available with sufficient weight capacity (≥5%) for task creation. All products may have reached maximum capacity.');
            }

            log(\`📋 Creating task for product: \${targetProduct.name}\`, testName);

            // Determine valid license level with type safety
            let validLicenseLevel = 'Essential'; // Default
            if (targetProduct.licenses && targetProduct.licenses.length > 0) {
                try {
                    // FIXED: Create copy before sorting (prevents read-only error)
                    const sortedLicenses = [...targetProduct.licenses].sort((a: any, b: any) => a.level - b.level);
                    const lowestLicense = sortedLicenses[0];

                    // Map license levels to GraphQL enum values
                    const levelToEnum: { [key: number]: string } = {
                        1: 'Essential',
                        2: 'Advantage',
                        3: 'Signature'
                    };

                    validLicenseLevel = levelToEnum[lowestLicense.level] || 'Essential';
                    log(\`🔐 Selected license level: \${validLicenseLevel} (level \${lowestLicense.level})\`, testName);
                } catch (licenseError) {
                    log(\`⚠️ License processing error: \${licenseError.message}, using default\`, testName);
                    validLicenseLevel = 'Essential';
                }
            }

            // Enhanced weight allocation with proper validation
            log('⚖️ Validating task weight allocation...', testName);
            const currentTasks = targetProduct.tasks?.edges || [];
            const usedWeight = currentTasks.reduce((sum: number, edge: any) => sum + (edge.node.weight || 0), 0);
            const remainingWeight = 100 - usedWeight;

            let taskWeight = 5; // Default task weight

            // Comprehensive weight validation
            if (remainingWeight <= 0) {
                const errorMessage = \`Cannot create task: Product "\${targetProduct.name}" has reached 100% weight capacity. Current usage: \${usedWeight}%. Please choose a different product or reduce existing task weights.\`;
                updateTestResult(testName, {
                    success: false,
                    message: errorMessage
                });
                log(errorMessage, testName);
                return;
            }

            if (taskWeight > remainingWeight) {
                // Adjust weight to fit within limits
                const adjustedWeight = Math.max(0.1, Math.min(remainingWeight - 0.1, 3));
                log(\`⚠️ Adjusting task weight from \${taskWeight}% to \${adjustedWeight}% due to capacity limits\`, testName);
                taskWeight = adjustedWeight;
            }

            log(\`🔗 Task weight: \${taskWeight}% (remaining: \${remainingWeight}%)\`, testName);

            const testTaskData = {
                productId: targetProduct.id,
                name: \`Test Task \${Date.now()}\`,
                description: 'This is a test task created by the GUI Test Studio for validation purposes.',
                estMinutes: 120, // REQUIRED field
                weight: taskWeight, // REQUIRED field  
                licenseLevel: validLicenseLevel,
                priority: 'Medium',
                notes: 'Created by GUI Test Studio automated test'
                // NOTE: Omit sequenceNumber to avoid conflicts
            };

            log('💾 Step 1: Calling CREATE_TASK mutation...', testName);
            const result = await createTask({
                variables: { input: testTaskData }
            });

            const createdTask = result.data.createTask;
            log(\`✅ Step 2: Task created successfully: \${createdTask.name} (ID: \${createdTask.id})\`, testName);

            // Store the ID for future edit/delete tests
            setStateAndPersist(prev => ({ ...prev, createdTestTaskId: createdTask.id }));

            // Wait for database consistency
            log('⏳ Step 3: Waiting for database consistency...', testName);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Clear Apollo cache to force fresh data
            log('🧹 Step 4: Clearing Apollo cache...', testName);
            await client.clearStore();

            log('🔄 Step 5: Refreshing products list with fresh data...', testName);
            await loadProducts();

            // Verify the task was actually created and is visible
            log('🔍 Step 6: Verifying task creation and visibility...', testName);
            const refreshedProducts = await loadProducts();
            let taskFound = false;
            let foundInProduct = null;

            for (const product of refreshedProducts) {
                const task = product.tasks?.edges.find((edge: any) => edge.node.id === createdTask.id);
                if (task) {
                    taskFound = true;
                    foundInProduct = product.name;
                    log(\`✅ Task verified: Found "\${task.node.name}" in product "\${product.name}"\`, testName);
                    break;
                }
            }

            if (!taskFound) {
                throw new Error(\`Task creation verification failed: Task "\${createdTask.name}" (\${createdTask.id}) not found in any product. Backend creation may have failed or there's a data consistency issue.\`);
            }

            updateTestResult(testName, {
                success: true,
                message: \`Task "\${createdTask.name}" created successfully and verified visible in product "\${foundInProduct}". Weight: \${createdTask.weight}%, Duration: \${createdTask.estMinutes}min\`
            });
            log('🎉 Task creation test PASSED with verification!', testName);

        } catch (error: any) {
            // Enhanced error handling with specific messages
            let errorMessage = \`Task creation test failed: \${error.message}\`;
            
            // Categorize errors for better debugging
            if (error.message.includes('weight') || error.message.includes('capacity')) {
                errorMessage = \`Task creation failed: Weight capacity issue. \${error.message}\`;
            } else if (error.message.includes('estMinutes') || error.message.includes('required')) {
                errorMessage = \`Task creation failed: Missing required fields (estMinutes, weight). Check GraphQL schema compliance.\`;
            } else if (error.message.includes('licenseLevel')) {
                errorMessage = \`Task creation failed: Invalid license level. Available: Essential, Advantage, Signature.\`;
            } else if (error.message.includes('Sequence number')) {
                errorMessage = \`Task creation failed: Sequence number conflict. Backend may enforce unique sequence numbers per product.\`;
            } else if (error.message.includes('Cannot assign to read only property')) {
                errorMessage = \`Task creation failed: GraphQL data mutation error (read-only array). This should be fixed in the updated code.\`;
            }
            
            updateTestResult(testName, {
                success: false,
                message: errorMessage
            });
            log(\`❌ Task creation test FAILED: \${errorMessage}\`, testName);

            // Additional debugging information
            log(\`🔧 Debugging tips:\`, testName);
            log(\`   1. Check if products have available weight capacity\`, testName);
            log(\`   2. Verify GraphQL schema requirements for TaskInput\`, testName);
            log(\`   3. Ensure backend supports all provided field values\`, testName);
            log(\`   4. Check for TypeScript compilation errors\`, testName);
            
        } finally {
            setTestRunning(testName, false);
        }
    };`;

        this.addFix(
            "Complete fixed simulateTaskCreation function",
            fixedCode,
            "/home/rajarora/dap/frontend/src/components/TestPanelNew.tsx"
        );
    }

    async generateSummaryReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: this.issues.length,
                criticalIssues: this.issues.filter(i => i.severity === 'CRITICAL').length,
                highIssues: this.issues.filter(i => i.severity === 'HIGH').length,
                mediumIssues: this.issues.filter(i => i.severity === 'MEDIUM').length,
                lowIssues: this.issues.filter(i => i.severity === 'LOW').length,
                totalFixes: this.fixes.length
            },
            issues: this.issues,
            fixes: this.fixes,
            recommendations: [
                "Apply the TypeScript type annotation fixes to resolve compilation errors",
                "Implement enhanced weight capacity validation to prevent failed task creation attempts",
                "Add comprehensive error handling for better user feedback",
                "Test the fixed code in the browser to verify functionality",
                "Monitor browser console for any remaining runtime errors"
            ]
        };

        try {
            await fs.writeFile(this.testResultsPath, JSON.stringify(report, null, 2));
            this.log(`📝 Diagnostic report saved to: ${this.testResultsPath}`, 'REPORT');
        } catch (error) {
            this.log(`❌ Failed to save report: ${error.message}`, 'ERROR');
        }

        return report;
    }

    async runDiagnostic() {
        console.log('🔍 === TESTPANELNEW COMPREHENSIVE DIAGNOSTIC ===');
        console.log('Analyzing compilation errors, runtime issues, and generating fixes\n');

        try {
            // Run all diagnostic phases
            await this.analyzeCompilationErrors();
            await this.analyzeRuntimeIssues();
            this.generateTestPanelNewFixes();
            await this.generateFixedTestPanelNewCode();

            // Generate final report
            const report = await this.generateSummaryReport();

            // Display summary
            console.log('\n📊 === DIAGNOSTIC SUMMARY ===');
            console.log(`Total Issues Found: ${report.summary.totalIssues}`);
            console.log(`- Critical: ${report.summary.criticalIssues} 🚨`);
            console.log(`- High: ${report.summary.highIssues} ⚠️`);
            console.log(`- Medium: ${report.summary.mediumIssues} 📋`);
            console.log(`- Low: ${report.summary.lowIssues} 💡`);
            console.log(`\nFixes Generated: ${report.summary.totalFixes} 🔧`);

            console.log('\n🎯 === TOP PRIORITY FIXES ===');
            const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
            if (criticalIssues.length > 0) {
                criticalIssues.forEach(issue => {
                    console.log(`🚨 ${issue.category}: ${issue.description}`);
                    if (issue.fix) {
                        console.log(`   Fix: ${issue.fix}`);
                    }
                });
            }

            const highIssues = this.issues.filter(i => i.severity === 'HIGH');
            if (highIssues.length > 0) {
                console.log('\n⚠️ HIGH PRIORITY:');
                highIssues.forEach(issue => {
                    console.log(`- ${issue.category}: ${issue.description}`);
                });
            }

            console.log('\n💡 === NEXT STEPS ===');
            console.log('1. Apply the TypeScript fixes to resolve compilation errors');
            console.log('2. Update the simulateTaskCreation function with the enhanced version');
            console.log('3. Test in browser to verify fixes work correctly');
            console.log('4. Monitor for any remaining issues');
            console.log(`\n📄 Full diagnostic report: ${this.testResultsPath}`);

            return report;

        } catch (error) {
            this.log(`❌ Diagnostic failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// Run the diagnostic
async function main() {
    const diagnostic = new TestPanelNewDiagnostic();
    try {
        await diagnostic.runDiagnostic();
        console.log('\n✅ TestPanelNew diagnostic completed successfully!');
    } catch (error) {
        console.error('\n❌ TestPanelNew diagnostic failed:', error);
    }
}

main();
