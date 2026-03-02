# Architecture Improvements: Adapter Interface Design

## The Problem (from Ethereum TaskLogicV2)

The Ethereum implementation of TaskerOnChain had a critical design flaw: **hardcoded parameter decoding**.

### Original Ethereum Approach

```solidity
// TaskLogicV2.sol - Lines 224-234: HARDCODED Uniswap structure
(
    ,  // router
    address tokenIn,
    ,  // tokenOut
    uint256 amountIn,
    ,  // minAmountOut
       // recipient
) = abi.decode(
    action.params,
    (address, address, address, uint256, uint256, address)
);
```

**Problem**: TaskLogicV2 assumes ALL adapters use Uniswap's 6-parameter format!

### Consequences

1. **Not Scalable**: Every adapter must fake Uniswap params even if irrelevant
2. **Confusing**: Developers must "map" their logic to unused fields
3. **Brittle**: Changes to TaskLogicV2 break all adapters
4. **Wasteful**: Encoding/decoding unused data costs gas
5. **Violates Separation of Concerns**: TaskLogic shouldn't know adapter internals

### Example: Time-Based Transfer Forced Into Uniswap Format

```solidity
// What we WANT to use:
struct TimeBasedTransferParams {
    address token;
    address recipient;
    uint256 amount;
    uint256 executeAfter;
}

// What we're FORCED to encode as (Uniswap format):
struct FakeUniswapParams {
    address router;        // UNUSED - set to 0x0
    address tokenIn;       // Actually: token
    address tokenOut;      // UNUSED - set to 0x0
    uint256 amountIn;      // Actually: amount
    uint256 minAmountOut;  // Actually: executeAfter (ab using type!)
    address recipient;     // Actually: recipient
}
```

**This is terrible design!** ❌

## The Solution: Adapter Interface Extension

We implemented the **Option 1** approach from the Ethereum analysis, adapted for Algorand.

### New Adapter Interface

```typescript
/**
 * IActionAdapter - Base interface that all adapters MUST implement
 */
export abstract class IActionAdapter extends Contract {
  /**
   * NEW METHOD: Get token requirements for this action
   *
   * This allows the adapter to declare what tokens it needs WITHOUT
   * TaskVault having to parse the adapter's parameter structure.
   */
  abstract getTokenRequirements(actionParams: bytes): TokenRequirement[]

  /**
   * Check if conditions are met
   */
  abstract canExecute(actionParams: bytes): CanExecuteResult

  /**
   * Execute the action
   */
  abstract execute(vaultAddress: Address, actionParams: bytes): ExecuteResult

  /**
   * Get adapter metadata
   */
  abstract getMetadata(): AdapterMetadata
}

/**
 * TokenRequirement - Declares what tokens an adapter needs
 */
class TokenRequirement {
  assetId: uint64    // 0 = ALGO
  amount: uint64     // Amount needed
  isInput: boolean   // true = input, false = output
}
```

### How It Works

#### 1. Adapter Declares Token Needs

Each adapter implements `getTokenRequirements()` to declare what tokens it needs:

```typescript
// TimeBasedTransferAdapter
getTokenRequirements(actionParams: bytes): TokenRequirement[] {
  const params = abi.decode(actionParams, TimeBasedTransferParams)

  // Clean declaration: "I need this token"
  return [
    new TokenRequirement(params.token, params.amount, true)
  ]
}
```

#### 2. TaskVault Queries Adapter

TaskVault doesn't need to parse adapter params anymore!

```typescript
// TaskVault.executeAction() - IMPROVED VERSION

// STEP 1: Ask adapter what it needs (no hardcoded parsing!)
const requirements = adapter.call.getTokenRequirements(actionParams)

// STEP 2: Handle token transfers based on requirements
for (const req of requirements) {
  if (req.isInput) {
    // Ensure vault has sufficient balance
    // Transfer to adapter if needed
  }
}

// STEP 3: Execute adapter
const result = adapter.call.execute(vaultAddress, actionParams)
```

#### 3. Adapters Use Clean Parameter Structures

```typescript
// TimeBasedTransferAdapter - CLEAN 4-parameter structure!
class TimeBasedTransferParams {
  token: Address
  recipient: Address
  amount: uint64
  executeAfter: uint64
}

// TinymanLimitOrderAdapter - Use structure that makes sense!
class TinymanLimitOrderParams {
  fromAssetId: uint64
  toAssetId: uint64
  amount: uint64
  limitPrice: uint64
  orderType: uint8
  slippageTolerance: uint16
  tinymanPoolAppId: uint64
}

// No more forcing everything into Uniswap format!
```

## Comparison: Before vs After

### Before (Hardcoded Approach)

```typescript
// ❌ TaskVault must know about EVERY adapter's param structure
executeAction(actionParams: bytes) {
  // Hardcoded decode for Uniswap format
  (router, tokenIn, tokenOut, amountIn, minAmountOut, recipient) =
    decode(actionParams, (address, address, address, uint256, uint256, address))

  // Transfer tokenIn to adapter
  transfer(tokenIn, amountIn)

  // Execute
  adapter.execute(actionParams)
}

// ❌ Every adapter must use Uniswap format
class TimeBasedTransferAdapter {
  execute(actionParams: bytes) {
    // Must decode as Uniswap format even though it doesn't make sense!
    (, tokenIn, , amountIn, executeAfter, recipient) =
      decode(actionParams, (address, address, address, uint256, uint256, address))
    // executeAfter is stored in minAmountOut field 🤦
  }
}
```

### After (Interface Extension)

```typescript
// ✅ TaskVault is generic - works with ANY adapter!
executeAction(actionParams: bytes) {
  // Ask adapter what it needs (no hardcoded parsing!)
  requirements = adapter.getTokenRequirements(actionParams)

  // Transfer based on adapter's declaration
  for (req of requirements) {
    if (req.isInput) {
      transfer(req.assetId, req.amount)
    }
  }

  // Execute
  adapter.execute(vaultAddress, actionParams)
}

// ✅ Adapter uses clean, semantic parameters
class TimeBasedTransferAdapter {
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    params = decode(actionParams, TimeBasedTransferParams)
    return [TokenRequirement(params.token, params.amount, true)]
  }

  execute(vaultAddress: Address, actionParams: bytes) {
    // Decode OUR structure (clean 4 params!)
    params = decode(actionParams, TimeBasedTransferParams)
    // Everything makes sense!
  }
}
```

## Benefits

### ✅ 1. Adapters Can Use ANY Parameter Structure

```typescript
// Simple adapter: 3 parameters
class SimpleTransferParams {
  recipient: Address
  amount: uint64
  assetId: uint64
}

// Complex adapter: 10+ parameters
class ComplexDeFiParams {
  protocol: Address
  strategy: uint8
  assets: Asset[]
  slippages: uint64[]
  deadlines: uint64[]
  // ... as many as needed!
}
```

### ✅ 2. Clean Separation of Concerns

- **TaskVault**: Doesn't know about adapter internals
- **Adapter**: Declares its needs via interface
- **Changes**: Can modify adapter params without touching TaskVault

### ✅ 3. Supports Multi-Token Operations

```typescript
// Adapter that needs multiple tokens
getTokenRequirements(actionParams: bytes): TokenRequirement[] {
  return [
    new TokenRequirement(USDC, 100_000000, true),  // Need 100 USDC
    new TokenRequirement(ALGO, 50_000000, true),   // Need 50 ALGO
    new TokenRequirement(BANK, 0, false),          // Will produce BANK
  ]
}
```

### ✅ 4. Better Gas Efficiency

- No encoding/decoding of unused parameters
- TaskVault only handles tokens that are actually needed
- Smaller transaction sizes

### ✅ 5. More Maintainable

```typescript
// Adding a new parameter to adapter:
// BEFORE: Might break TaskVault if not in expected position
// AFTER: Just add to your param struct, update getTokenRequirements()

class TimeBasedTransferParams {
  token: Address
  recipient: Address
  amount: uint64
  executeAfter: uint64
  memo: string  // ✅ Add new field - TaskVault doesn't care!
}
```

### ✅ 6. Self-Documenting

```typescript
// Anyone can query what an adapter needs:
const requirements = adapter.getTokenRequirements(params)
// Returns: [{ assetId: 0, amount: 1000000, isInput: true }]

// vs. trying to parse hardcoded 6-param structure 🤷
```

## Implementation in Algorand

### BaseAdapter Class

We provide a convenience base class with common functionality:

```typescript
export abstract class BaseAdapter extends IActionAdapter {
  // Admin management
  admin = GlobalStateKey<Address>({ key: 'admin' })
  isPaused = GlobalStateKey<boolean>({ key: 'paused' })

  // Statistics tracking
  totalExecutions = GlobalStateKey<uint64>({ key: 'total_exec' })
  successfulExecutions = GlobalStateKey<uint64>({ key: 'success_exec' })

  // Utility methods
  protected requireNotPaused(): void
  protected requireAdmin(): void
  protected recordExecution(success: boolean): void
  getSuccessRate(): uint64
  pause(): void
  unpause(): void
  transferAdmin(newAdmin: Address): void
}
```

### Example Adapters

#### 1. TimeBasedTransferAdapter (Simple)

```typescript
export class TimeBasedTransferAdapter extends BaseAdapter {
  // Clean 4-parameter structure
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    const params = decode(actionParams, TimeBasedTransferParams)
    return [new TokenRequirement(params.token, params.amount, true)]
  }

  canExecute(actionParams: bytes): CanExecuteResult {
    const params = decode(actionParams, TimeBasedTransferParams)
    return new CanExecuteResult(
      globals.latestTimestamp >= params.executeAfter,
      'Time check'
    )
  }

  execute(vaultAddress: Address, actionParams: bytes): ExecuteResult {
    const params = decode(actionParams, TimeBasedTransferParams)
    // Perform transfer
    return new ExecuteResult(true, 'Transferred')
  }
}
```

#### 2. TinymanLimitOrderAdapter (Complex)

```typescript
export class TinymanLimitOrderAdapter extends BaseAdapter {
  // Complex 7-parameter structure
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    const params = decode(actionParams, TinymanLimitOrderParams)
    return [new TokenRequirement(params.fromAssetId, params.amount, true)]
  }

  canExecute(actionParams: bytes): CanExecuteResult {
    const params = decode(actionParams, TinymanLimitOrderParams)
    const currentPrice = this.getCurrentPrice(params.fromAssetId, params.toAssetId)

    if (params.orderType === 0) { // Buy
      return new CanExecuteResult(
        currentPrice <= params.limitPrice,
        'Price check'
      )
    } else { // Sell
      return new CanExecuteResult(
        currentPrice >= params.limitPrice,
        'Price check'
      )
    }
  }

  execute(vaultAddress: Address, actionParams: bytes): ExecuteResult {
    const params = decode(actionParams, TinymanLimitOrderParams)
    // Perform Tinyman swap
    return new ExecuteResult(true, 'Swapped')
  }
}
```

## Migration Strategy

### Phase 1: Backwards Compatibility (Current)

```typescript
// Old adapters can still work by implementing getTokenRequirements()
class LegacyAdapter extends BaseAdapter {
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    // Decode old 6-param Uniswap format
    (, tokenIn, , amountIn, , ) = decode(actionParams, UniswapFormat)
    return [new TokenRequirement(tokenIn, amountIn, true)]
  }

  // Keep old execute() implementation
  execute(vaultAddress: Address, actionParams: bytes): ExecuteResult {
    // ... existing code ...
  }
}
```

### Phase 2: New Adapters (Recommended)

```typescript
// New adapters use clean structures
class ModernAdapter extends BaseAdapter {
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    const params = decode(actionParams, CleanParams)
    return [new TokenRequirement(params.token, params.amount, true)]
  }

  execute(vaultAddress: Address, actionParams: bytes): ExecuteResult {
    const params = decode(actionParams, CleanParams)
    // ... clean implementation ...
  }
}
```

### Phase 3: TaskVault Update

```typescript
// TaskVault becomes generic (no hardcoded parsing!)
executeAction(actionParams: bytes) {
  // ✅ Works with ANY adapter structure
  requirements = adapter.getTokenRequirements(actionParams)

  // Handle token transfers
  for (req of requirements) {
    if (req.isInput) {
      this.transferToken(req.assetId, req.amount)
    }
  }

  // Execute
  result = adapter.execute(this.app.address, actionParams)
}
```

## Testing

### Test: Multiple Parameter Structures

```typescript
test('TimeBasedTransferAdapter uses 4 params', () => {
  const params = encode(TimeBasedTransferParams, {
    token: ALGO,
    recipient: alice,
    amount: 1_000000,
    executeAfter: nowTimestamp + 3600,
  })

  const requirements = adapter.getTokenRequirements(params)
  expect(requirements.length).toBe(1)
  expect(requirements[0].assetId).toBe(ALGO)
  expect(requirements[0].amount).toBe(1_000000)
})

test('TinymanAdapter uses 7 params', () => {
  const params = encode(TinymanLimitOrderParams, {
    fromAssetId: USDC,
    toAssetId: ALGO,
    amount: 100_000000,
    limitPrice: 200000,
    orderType: 0,
    slippageTolerance: 100,
    tinymanPoolAppId: POOL_ID,
  })

  const requirements = adapter.getTokenRequirements(params)
  expect(requirements.length).toBe(1)
  expect(requirements[0].assetId).toBe(USDC)
  expect(requirements[0].amount).toBe(100_000000)
})
```

### Test: TaskVault Independence

```typescript
test('TaskVault works with any adapter structure', () => {
  // Create task with TimeBasedTransfer (4 params)
  const task1 = taskFactory.createTask({
    adapterAppId: timeTransferAdapter.appId,
    actionParams: encode(TimeBasedTransferParams, {...}),
  })

  // Create task with TinymanLimit (7 params)
  const task2 = taskFactory.createTask({
    adapterAppId: tinymanAdapter.appId,
    actionParams: encode(TinymanLimitOrderParams, {...}),
  })

  // Both work! TaskVault doesn't care about structure
  expect(await executorHub.executeTask(task1)).toBe(true)
  expect(await executorHub.executeTask(task2)).toBe(true)
})
```

## Conclusion

By adding `getTokenRequirements()` to the adapter interface, we achieve:

1. ✅ **Flexibility**: Adapters can use ANY parameter structure
2. ✅ **Separation of Concerns**: TaskVault doesn't parse adapter params
3. ✅ **Scalability**: Easy to add new adapters without changing core contracts
4. ✅ **Maintainability**: Changes to adapter params don't break TaskVault
5. ✅ **Gas Efficiency**: No encoding/decoding of unused data
6. ✅ **Multi-Token Support**: Adapters can declare multiple token needs

This is a **production-ready improvement** over the original Ethereum implementation.

## Files

- `base_adapter.algo.ts` - Interface and base class
- `tinyman_limit/contract.algo.ts` - Complex adapter example
- `time_transfer/contract.algo.ts` - Simple adapter example
- `task_vault/contract.algo.ts` - Updated to use getTokenRequirements()

---

**Based on analysis of Ethereum TaskLogicV2 hardcoded parameter issue**
**Implemented in Algorand TypeScript SDK**
