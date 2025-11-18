#!/bin/bash

# TaskerOnChain Smart Contracts - Syntax Validation Script
# This script performs basic validation without requiring full compilation

set -e

echo "================================================"
echo "TaskerOnChain Smart Contracts - Syntax Validation"
echo "================================================"
echo ""

CONTRACTS_DIR="QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/tasker"

# Check if contracts directory exists
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo "❌ Error: Contracts directory not found: $CONTRACTS_DIR"
    exit 1
fi

echo "✅ Contracts directory found"
echo ""

# Count contract files
echo "📊 Contract Inventory:"
echo "-------------------"

CORE_CONTRACTS=$(find "$CONTRACTS_DIR" -name "contract.algo.ts" -not -path "*/__test__/*" | wc -l)
ADAPTER_CONTRACTS=$(find "$CONTRACTS_DIR/adapters" -name "contract.algo.ts" 2>/dev/null | wc -l)
BASE_FILES=$(find "$CONTRACTS_DIR/adapters" -name "base_adapter.algo.ts" 2>/dev/null | wc -l)
TEST_FILES=$(find "$CONTRACTS_DIR" -name "*.test.algo.ts" | wc -l)

echo "Core Contracts: $CORE_CONTRACTS"
echo "Adapter Contracts: $ADAPTER_CONTRACTS"
echo "Base Infrastructure: $BASE_FILES"
echo "Test Files: $TEST_FILES"
echo ""

# List all contracts
echo "📋 Contract Files:"
echo "-------------------"
find "$CONTRACTS_DIR" -name "*.algo.ts" -type f | sort | while read file; do
    filename=$(basename "$file")
    dir=$(dirname "$file" | sed "s|$CONTRACTS_DIR/||")
    loc=$(wc -l < "$file")
    printf "%-50s %5d lines\n" "$dir/$filename" "$loc"
done
echo ""

# Check for common patterns
echo "🔍 Pattern Analysis:"
echo "-------------------"

check_pattern() {
    pattern=$1
    description=$2
    count=$(find "$CONTRACTS_DIR" -name "*.algo.ts" -type f -exec grep -l "$pattern" {} \; | wc -l)
    echo "✓ $description: $count files"
}

check_pattern "extends Contract" "Contracts extending Algorand Contract"
check_pattern "extends BaseAdapter" "Adapters extending BaseAdapter"
check_pattern "getTokenRequirements" "Implements getTokenRequirements()"
check_pattern "canExecute" "Implements canExecute()"
check_pattern "GlobalStateKey" "Uses GlobalStateKey"
check_pattern "LocalStateKey" "Uses LocalStateKey"
check_pattern "this.boxes" "Uses Box storage"
check_pattern "assert(" "Uses assert for validation"
check_pattern "sendPayment" "Uses inner transactions (ALGO)"
check_pattern "sendAssetTransfer" "Uses inner transactions (ASA)"
echo ""

# Check for architectural improvements
echo "🏗️  Architectural Improvements:"
echo "-------------------"

if grep -r "getTokenRequirements" "$CONTRACTS_DIR" > /dev/null 2>&1; then
    echo "✅ getTokenRequirements() pattern implemented"
else
    echo "❌ getTokenRequirements() pattern NOT found"
fi

if grep -r "class TokenRequirement" "$CONTRACTS_DIR" > /dev/null 2>&1; then
    echo "✅ TokenRequirement class defined"
else
    echo "❌ TokenRequirement class NOT found"
fi

if grep -r "abstract class IActionAdapter" "$CONTRACTS_DIR" > /dev/null 2>&1; then
    echo "✅ IActionAdapter interface defined"
else
    echo "❌ IActionAdapter interface NOT found"
fi

if grep -r "class BaseAdapter extends IActionAdapter" "$CONTRACTS_DIR" > /dev/null 2>&1; then
    echo "✅ BaseAdapter base class defined"
else
    echo "❌ BaseAdapter base class NOT found"
fi

echo ""

# Check for security patterns
echo "🔒 Security Patterns:"
echo "-------------------"

check_security_pattern() {
    pattern=$1
    description=$2
    count=$(find "$CONTRACTS_DIR" -name "*.algo.ts" -type f -exec grep -c "$pattern" {} \; | awk '{sum+=$1} END {print sum}')
    echo "✓ $description: $count occurrences"
}

check_security_pattern "assert(" "Assert statements"
check_security_pattern "this.txn.sender ===" "Sender verification"
check_security_pattern "this.admin.value" "Admin checks"
check_security_pattern "requireAdmin" "Admin requirement calls"
check_security_pattern "requireNotPaused" "Pause checks"
check_security_pattern "sha256(" "Hash verification"

echo ""

# Check for TODOs
echo "⚠️  TODOs & Implementation Notes:"
echo "-------------------"

TODO_COUNT=$(find "$CONTRACTS_DIR" -name "*.algo.ts" -type f -exec grep -c "TODO:" {} \; | awk '{sum+=$1} END {print sum}')
echo "Total TODOs: $TODO_COUNT"
echo ""

if [ $TODO_COUNT -gt 0 ]; then
    echo "TODO Items:"
    find "$CONTRACTS_DIR" -name "*.algo.ts" -type f -exec grep -Hn "TODO:" {} \; | head -10
    if [ $TODO_COUNT -gt 10 ]; then
        echo "... and $((TODO_COUNT - 10)) more"
    fi
fi

echo ""

# Summary
echo "================================================"
echo "📊 Summary:"
echo "================================================"

TOTAL_CONTRACTS=$((CORE_CONTRACTS + ADAPTER_CONTRACTS + BASE_FILES))
TOTAL_LOC=$(find "$CONTRACTS_DIR" -name "*.algo.ts" -type f -not -path "*/__test__/*" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}')
TEST_LOC=$(find "$CONTRACTS_DIR" -name "*.test.algo.ts" -type f -exec wc -l {} \; | awk '{sum+=$1} END {print sum}')

echo "Total Contracts: $TOTAL_CONTRACTS"
echo "Total LOC: $TOTAL_LOC"
echo "Test LOC: $TEST_LOC"
echo "TODOs: $TODO_COUNT"
echo ""

echo "✅ Structural validation complete!"
echo ""
echo "⚠️  Note: Full compilation requires network access to download"
echo "   Algorand Puya compiler binary from GitHub."
echo ""
echo "To compile when network is available:"
echo "  cd QuickStartTemplate/projects/QuickStartTemplate-contracts"
echo "  npm install"
echo "  npm run build"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
