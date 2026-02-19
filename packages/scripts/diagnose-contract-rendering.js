#!/usr/bin/env node

/**
 * Diagnostic Script for Automatic Contract Rendering System
 * 
 * This script checks if all components of the automatic contract rendering
 * system are properly configured and working.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Scaffold-ETH 2 Contract Rendering Diagnostic\n');
console.log('='.repeat(60));

// Check 1: Deployment artifacts exist
console.log('\n1️⃣  Checking deployment artifacts...');
const deploymentsDir = path.join(__dirname, '../hardhat/deployments/localhost');
const deploymentFiles = ['MockERC20.json', 'PredictionMarket.json'];

let deploymentsExist = true;
deploymentFiles.forEach(file => {
    const filePath = path.join(deploymentsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file} exists`);
    } else {
        console.log(`   ❌ ${file} NOT FOUND`);
        deploymentsExist = false;
    }
});

// Check 2: deployedContracts.ts exists and has content
console.log('\n2️⃣  Checking deployedContracts.ts...');
const deployedContractsPath = path.join(__dirname, '../nextjs/contracts/deployedContracts.ts');

if (fs.existsSync(deployedContractsPath)) {
    const content = fs.readFileSync(deployedContractsPath, 'utf8');
    const isEmpty = content.includes('const deployedContracts = {} as const');

    if (isEmpty) {
        console.log('   ❌ deployedContracts.ts is EMPTY');
        console.log('   💡 Run: yarn deploy --reset');
    } else {
        console.log('   ✅ deployedContracts.ts has content');

        // Extract contract names
        const contractMatches = content.match(/"([^"]+)":\s*{/g);
        if (contractMatches) {
            const contracts = contractMatches.map(m => m.match(/"([^"]+)"/)[1]);
            console.log(`   📝 Found contracts: ${contracts.join(', ')}`);
        }
    }
} else {
    console.log('   ❌ deployedContracts.ts NOT FOUND');
}

// Check 3: Generation script exists
console.log('\n3️⃣  Checking generation script...');
const genScriptPath = path.join(__dirname, '../hardhat/scripts/generateDeployedContracts.ts');

if (fs.existsSync(genScriptPath)) {
    console.log('   ✅ generateDeployedContracts.ts exists');
} else {
    console.log('   ❌ generateDeployedContracts.ts NOT FOUND');
    console.log('   💡 This script should be in packages/hardhat/scripts/');
}

// Check 4: Debug components exist
console.log('\n4️⃣  Checking debug UI components...');
const debugComponents = [
    '../nextjs/app/debug/_components/DebugContracts.tsx',
    '../nextjs/app/debug/_components/ContractUI.tsx',
    '../nextjs/app/debug/page.tsx',
];

debugComponents.forEach(component => {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
        console.log(`   ✅ ${path.basename(component)} exists`);
    } else {
        console.log(`   ❌ ${path.basename(component)} NOT FOUND`);
    }
});

// Check 5: Required dependencies
console.log('\n5️⃣  Checking package dependencies...');
const packageJsonPath = path.join(__dirname, '../nextjs/package.json');

if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = {
        '@scaffold-ui/debug-contracts': '^0.1.7',
        '@scaffold-ui/components': '^0.1.8',
        '@scaffold-ui/hooks': '^0.1.6',
        'wagmi': '2.19.5',
        'viem': '2.39.0',
    };

    Object.entries(requiredDeps).forEach(([dep, version]) => {
        if (packageJson.dependencies[dep]) {
            console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`   ❌ ${dep} NOT FOUND (expected: ${version})`);
        }
    });
} else {
    console.log('   ❌ package.json NOT FOUND');
}

// Check 6: Deployment script integration
console.log('\n6️⃣  Checking deployment script integration...');
const deployScriptPath = path.join(__dirname, '../hardhat/deploy/00_deploy_your_contract.ts');

if (fs.existsSync(deployScriptPath)) {
    const deployScript = fs.readFileSync(deployScriptPath, 'utf8');

    if (deployScript.includes('generateDeployedContracts')) {
        console.log('   ✅ Deployment script calls generateDeployedContracts');
    } else {
        console.log('   ❌ Deployment script does NOT call generateDeployedContracts');
        console.log('   💡 Add generation step to deployment script');
    }
} else {
    console.log('   ❌ Deployment script NOT FOUND');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 SUMMARY\n');

if (deploymentsExist) {
    console.log('✅ Deployment artifacts are present');
} else {
    console.log('❌ Missing deployment artifacts - run: yarn deploy');
}

console.log('\n💡 NEXT STEPS:\n');
console.log('1. If deployedContracts.ts is empty:');
console.log('   cd packages/hardhat');
console.log('   yarn deploy --reset\n');

console.log('2. If contracts are deployed but not showing in UI:');
console.log('   cd packages/hardhat');
console.log('   yarn hardhat run scripts/generateDeployedContracts.ts\n');

console.log('3. Start the frontend:');
console.log('   cd packages/nextjs');
console.log('   yarn dev\n');

console.log('4. Access debug UI:');
console.log('   http://localhost:3000/debug\n');

console.log('='.repeat(60) + '\n');
