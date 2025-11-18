# TaskerOnChain - Algorand Architecture

## Overview

TaskerOnChain on Algorand is a decentralized task automation protocol that enables trustless execution of on-chain operations based on dynamic conditions. This implementation leverages Algorand's unique features:

- **Atomic Transactions**: Replace commit-reveal schemes with atomic transaction groups
- **Inner Transactions**: Enable contracts to execute multi-step operations autonomously
- **Box Storage**: Efficient storage for task metadata and executor data
- **Low Fees**: Make micro-automation economically viable
- **Fast Finality**: 3.3s block time enables responsive automation

## System Architecture

### Core Contracts

```
┌─────────────────────────────────────────────────────────────┐
│                      TaskerOnChain System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │ TaskFactory  │────▶│  TaskCore    │────▶│  TaskVault  │ │
│  │ (Registry)   │     │  (Logic)     │     │  (Funds)    │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│         ▼                     ▼                     ▼        │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │ ExecutorHub  │     │ActionRegistry│     │RewardManager│ │
│  │(Staking/Rep) │     │  (Adapters)  │     │(Incentives) │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                     │                              │
│         │                     │                              │
│         └─────────┬───────────┘                              │
│                   │                                          │
│                   ▼                                          │
│         ┌──────────────────┐                                │
│         │  Adapter Layer   │                                │
│         │ ┌──────────────┐ │                                │
│         │ │UniswapLimit  │ │                                │
│         │ │TinymanLimit  │ │                                │
│         │ │ DCAAdapter   │ │                                │
│         │ │StopLoss      │ │                                │
│         │ │YieldHarvest  │ │                                │
│         │ └──────────────┘ │                                │
│         └──────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Contract Descriptions

#### 1. TaskFactory (Master Registry)

**Purpose**: Central registry for creating and tracking all tasks

**State**:
- Global State:
  - `total_tasks`: uint64 - Total number of tasks created
  - `executor_hub_app_id`: uint64 - Reference to ExecutorHub contract
  - `action_registry_app_id`: uint64 - Reference to ActionRegistry
  - `reward_manager_app_id`: uint64 - Reference to RewardManager

- Box Storage:
  - Key: `task_{task_id}` → Value: TaskMetadata struct

**Methods**:
```typescript
// Create a new task
createTask(
  taskParams: {
    expiration: uint64,
    maxExecutions: uint64,
    recurringInterval: uint64,
    rewardAmount: uint64,
    rewardAssetId: uint64,
    adapterAppId: uint64,
    actionParams: bytes,
  }
): uint64  // Returns task_id

// Cancel a task (only by creator)
cancelTask(taskId: uint64): void

// Get task details
getTask(taskId: uint64): TaskMetadata
```

**TaskMetadata Structure**:
```typescript
type TaskMetadata = {
  creator: Address,
  vaultAppId: uint64,
  expiration: uint64,
  maxExecutions: uint64,
  executionCount: uint64,
  recurringInterval: uint64,
  lastExecution: uint64,
  rewardAmount: uint64,
  rewardAssetId: uint64,  // 0 = ALGO
  adapterAppId: uint64,
  actionParamsHash: bytes32,  // Hash of action parameters
  status: uint8,  // 0=Active, 1=Executing, 2=Completed, 3=Cancelled
}
```

#### 2. TaskVault (Per-Task Fund Management)

**Purpose**: Holds funds for a single task, executes actions through adapters

**State**:
- Global State:
  - `task_id`: uint64
  - `task_factory_app_id`: uint64
  - `creator`: Address
  - `total_deposited`: uint64
  - `total_withdrawn`: uint64

**Methods**:
```typescript
// Deposit funds (ALGO or ASA)
deposit(amount: uint64, assetId: uint64): void

// Execute action through adapter (only via TaskFactory)
executeAction(
  executorAddress: Address,
  adapterAppId: uint64,
  actionParams: bytes
): ExecutionResult

// Withdraw remaining funds (only creator, only if task cancelled/expired)
withdraw(amount: uint64, assetId: uint64): void

type ExecutionResult = {
  success: boolean,
  resultData: bytes,
  gasUsed: uint64,
}
```

**Key Innovation**: Uses inner transactions to:
1. Call adapter's `canExecute()` method
2. If true, call adapter's `execute()` method
3. Transfer rewards to executor
4. Update task state

#### 3. ExecutorHub (Executor Management)

**Purpose**: Manages executor registration, staking, reputation, and atomic execution

**State**:
- Global State:
  - `min_stake`: uint64 - Minimum stake required (e.g., 10 ALGO)
  - `total_executors`: uint64
  - `total_staked`: uint64

- Local State (per executor):
  - `stake_amount`: uint64
  - `successful_executions`: uint64
  - `failed_executions`: uint64
  - `total_rewards_earned`: uint64
  - `reputation_score`: uint64
  - `is_slashed`: boolean

**Methods**:
```typescript
// Register as executor by staking ALGO
registerExecutor(stakeAmount: uint64): void

// Add more stake
addStake(additionalAmount: uint64): void

// Withdraw stake (only if no pending tasks)
withdrawStake(amount: uint64): void

// Execute task (atomic transaction pattern)
executeTask(
  taskId: uint64,
  executionProof: bytes
): ExecutionResult

// Slash malicious executor
slashExecutor(executorAddress: Address, reason: string): void

// Calculate reputation multiplier
getReputationMultiplier(executorAddress: Address): uint64
```

**Reputation Formula**:
```
reputation_score = (successful_executions * 100) / (successful_executions + failed_executions)
reputation_multiplier = 100 + (reputation_score / 10)  // Max 20% bonus
```

#### 4. ActionRegistry (Adapter Management)

**Purpose**: Maintains approved adapters with metadata and gas limits

**State**:
- Box Storage:
  - Key: `adapter_{app_id}` → Value: AdapterMetadata

**Methods**:
```typescript
// Register new adapter (only admin)
registerAdapter(
  adapterAppId: uint64,
  name: string,
  description: string,
  maxGasLimit: uint64,
  category: string  // "swap", "lending", "yield", "nft", etc.
): void

// Deactivate adapter
deactivateAdapter(adapterAppId: uint64): void

// Get adapter details
getAdapter(adapterAppId: uint64): AdapterMetadata

type AdapterMetadata = {
  appId: uint64,
  name: string,
  description: string,
  maxGasLimit: uint64,
  category: string,
  isActive: boolean,
  totalExecutions: uint64,
  successRate: uint64,
}
```

#### 5. RewardManager (Incentive Distribution)

**Purpose**: Calculates and distributes rewards to executors

**State**:
- Global State:
  - `base_gas_price`: uint64
  - `reputation_bonus_enabled`: boolean

**Methods**:
```typescript
// Calculate total reward for execution
calculateReward(
  taskReward: uint64,
  gasUsed: uint64,
  executorReputation: uint64
): uint64

// Distribute reward (called by TaskVault via inner transaction)
distributeReward(
  executorAddress: Address,
  taskId: uint64,
  amount: uint64,
  assetId: uint64
): void

// Reward formula
// total = taskReward + (gasUsed * gasPrice) + reputationBonus
// reputationBonus = taskReward * (reputationMultiplier - 100) / 100
```

### Adapter Layer

#### Base Adapter Interface

All adapters must implement this interface:

```typescript
abstract class BaseAdapter extends Contract {
  // Check if conditions are met for execution
  abstract canExecute(actionParams: bytes): CanExecuteResult

  // Execute the action (only callable if canExecute returns true)
  abstract execute(actionParams: bytes): ExecuteResult

  // Get adapter metadata
  abstract getMetadata(): AdapterMetadata
}

type CanExecuteResult = {
  canExecute: boolean,
  reason: string,
}

type ExecuteResult = {
  success: boolean,
  resultData: bytes,
}
```

#### Example Adapters

##### 1. TinymanLimitOrderAdapter

**Purpose**: Buy/sell ASAs when price reaches target on Tinyman DEX

**Action Parameters**:
```typescript
type TinymanLimitOrderParams = {
  fromAssetId: uint64,
  toAssetId: uint64,
  amount: uint64,
  limitPrice: uint64,  // In fixed-point (6 decimals)
  orderType: uint8,    // 0=Buy, 1=Sell
  slippageTolerance: uint16,  // In basis points (100 = 1%)
}
```

**canExecute Logic**:
1. Fetch current price from Tinyman pool (via inner transaction call)
2. Compare with limit price
3. Check if order type matches (buy below limit, sell above limit)
4. Verify pool has sufficient liquidity

**execute Logic**:
1. Opt-in to destination asset if needed
2. Create Tinyman swap transaction group
3. Execute swap via inner transactions
4. Return swap result

##### 2. FolksDCAAdapter

**Purpose**: Dollar-cost average into assets using Folks Finance

**Action Parameters**:
```typescript
type DCAParams = {
  fromAssetId: uint64,
  toAssetId: uint64,
  amountPerExecution: uint64,
  intervalSeconds: uint64,
  maxPrice: uint64,  // Maximum acceptable price
}
```

##### 3. AlgoFiYieldHarvestAdapter

**Purpose**: Automatically harvest and compound yields from AlgoFi

**Action Parameters**:
```typescript
type YieldHarvestParams = {
  poolAppId: uint64,
  minClaimAmount: uint64,
  autoCompound: boolean,
}
```

##### 4. StopLossAdapter

**Purpose**: Automatically exit position when price drops below threshold

**Action Parameters**:
```typescript
type StopLossParams = {
  assetId: uint64,
  amount: uint64,
  triggerPrice: uint64,
  dexAppId: uint64,  // Tinyman, Pact, etc.
}
```

## Execution Flow

### Task Creation Flow

```
1. User → TaskFactory.createTask()
   ├─ Validates adapter exists in ActionRegistry
   ├─ Creates TaskVault contract (inner transaction)
   ├─ Stores TaskMetadata in box storage
   └─ Returns task_id

2. User → TaskVault.deposit()
   ├─ Transfers ALGO/ASA to vault
   └─ Updates total_deposited

3. TaskFactory emits TaskCreated event
```

### Task Execution Flow (Algorand Atomic Pattern)

**Key Innovation**: No commit-reveal needed due to atomic transactions!

```
Executor → ExecutorHub.executeTask() [Atomic Group]
│
├─ Txn 1: Executor calls ExecutorHub.executeTask()
│  ├─ Verify executor is registered and staked
│  ├─ Check task exists and is active
│  └─ Proceed to next transaction
│
├─ Txn 2: ExecutorHub → TaskFactory (inner transaction)
│  ├─ Get task metadata
│  ├─ Verify task not expired
│  └─ Get TaskVault and adapter references
│
├─ Txn 3: ExecutorHub → ActionRegistry (inner transaction)
│  ├─ Verify adapter is active
│  └─ Get gas limit
│
├─ Txn 4: ExecutorHub → Adapter.canExecute() (inner transaction)
│  ├─ Adapter checks on-chain conditions
│  │  Example: Price oracle, time elapsed, balance threshold
│  └─ Returns (true/false, reason)
│
├─ If canExecute = true:
│  │
│  ├─ Txn 5: ExecutorHub → TaskVault.executeAction() (inner transaction)
│  │  │
│  │  ├─ TaskVault → Adapter.execute() (inner transaction)
│  │  │  ├─ Adapter performs action (e.g., Tinyman swap)
│  │  │  └─ Returns ExecuteResult
│  │  │
│  │  ├─ TaskVault → RewardManager.calculateReward() (inner transaction)
│  │  │  └─ Returns total reward amount
│  │  │
│  │  ├─ TaskVault → Transfer reward to executor (inner transaction)
│  │  │  ├─ Base reward
│  │  │  ├─ Gas reimbursement
│  │  │  └─ Reputation bonus
│  │  │
│  │  └─ TaskVault updates task state:
│  │     ├─ Increment executionCount
│  │     ├─ Update lastExecution timestamp
│  │     └─ Set status=Completed if maxExecutions reached
│  │
│  └─ Txn 6: ExecutorHub updates executor stats
│     ├─ Increment successful_executions
│     ├─ Add to total_rewards_earned
│     └─ Recalculate reputation_score
│
└─ If canExecute = false:
   └─ Entire atomic group succeeds but no-op
      (This is key: executor can safely check without penalty)
```

**Advantages over Ethereum Commit-Reveal**:
1. **No Front-Running**: Atomic transactions execute or fail together
2. **No Commit Wait**: Single atomic group vs. 2 separate transactions
3. **Gas Efficient**: Failed conditions don't consume much fee
4. **Simpler Logic**: No need for commit hashes and reveal verification

### Slashing Flow

```
If adapter.execute() fails:
├─ ExecutorHub marks failed_executions++
├─ If failure rate > threshold (e.g., 20%):
│  ├─ Slash executor stake (e.g., 10%)
│  ├─ Transfer slashed amount to protocol treasury
│  └─ Set is_slashed = true (temporary ban)
└─ Update reputation_score
```

## Key Algorand Adaptations

### 1. Box Storage for Task Data

**Why**: Unlimited scalable storage for task metadata

```typescript
// Store task in box
this.boxes.set(`task_${taskId}`, taskMetadata)

// Retrieve task
const task = this.boxes.get(`task_${taskId}`)
```

### 2. Inner Transactions for Autonomy

**Why**: Contracts can execute multi-step operations without external coordination

```typescript
// Inside TaskVault.executeAction()
sendMethodCall({
  applicationID: adapterAppId,
  methodArgs: [actionParams],
  onCompletion: OnCompletion.NoOp,
  rekeyTo: globals.zeroAddress,
})
```

### 3. No Merkle Proofs Needed

**Why**: Atomic transactions guarantee integrity

- Ethereum: Need Merkle proofs to verify action parameters against task root
- Algorand: Action parameters stored in box storage, directly verifiable

### 4. Asset Opt-In Handling

**Why**: Algorand requires accounts to opt-in before receiving ASAs

```typescript
// TaskVault automatically opts into reward assets
if (rewardAssetId !== 0) {
  sendAssetTransfer({
    assetReceiver: this.address,
    assetAmount: 0,
    xferAsset: rewardAssetId,
  })
}
```

### 5. Minimum Balance Requirements

**Why**: Algorand accounts need minimum balance (0.1 ALGO + 0.1 per asset/app)

**Solution**: TaskFactory funds new TaskVaults with initial ALGO during creation

```typescript
// In TaskFactory.createTask()
sendPayment({
  receiver: newVaultAddress,
  amount: 500_000,  // 0.5 ALGO for vault operations
})
```

## Use Cases on Algorand

### 1. Tinyman Limit Orders
- Adapter: `TinymanLimitOrderAdapter`
- Use: Buy/sell ASAs when price reaches target
- Example: Buy 1000 USDC of ALGO when price drops to $0.20

### 2. Folks Finance DCA
- Adapter: `FolksDCAAdapter`
- Use: Recurring buys every N blocks
- Example: Buy $100 of ALGO every 7 days for 6 months

### 3. AlgoFi Yield Harvesting
- Adapter: `AlgoFiYieldHarvestAdapter`
- Use: Auto-claim and compound yields
- Example: Harvest BANK rewards and reinvest into STBL pool

### 4. Governance Voting Automation
- Adapter: `GovernanceVoteAdapter`
- Use: Vote on proposals matching criteria
- Example: Vote "yes" on all proposals from specific governor

### 5. NFT Floor Price Sniping
- Adapter: `NFTBuyAdapter`
- Use: Buy NFT when floor drops below threshold
- Example: Buy any Aorist NFT when floor < 100 ALGO

### 6. Lending Protocol Automation
- Adapter: `AlgoFiRepayAdapter`
- Use: Repay loans before liquidation threshold
- Example: Repay 10% when collateral ratio < 150%

### 7. Portfolio Rebalancing
- Adapter: `PortfolioRebalanceAdapter`
- Use: Maintain target asset allocations
- Example: Keep portfolio at 60% ALGO, 40% USDC

## Security Considerations

### 1. Adapter Whitelisting
- Only admin-approved adapters in ActionRegistry
- Each adapter audited before activation
- Gas limits enforced per adapter

### 2. Reentrancy Protection
- Algorand's execution model prevents reentrancy
- State updates before inner transactions

### 3. Access Control
- TaskVault only callable by TaskFactory
- ExecutorHub requires valid stake
- Cancel only by task creator

### 4. Economic Security
- Executor stake > potential malicious profit
- Slashing for failed executions
- Reputation system for long-term alignment

### 5. Oracle Security
- Adapters use multiple price sources when possible
- Time-weighted averages for price data
- Slippage protection on all swaps

## Gas Optimization

### 1. Use Box Storage Efficiently
- Pack multiple fields into single box
- Use fixed-size keys (`task_123` vs. variable length)

### 2. Minimize Inner Transactions
- Batch operations when possible
- Cache frequently accessed data in local state

### 3. Lazy Evaluation
- Only call expensive operations when necessary
- Skip adapter.execute() if canExecute() fails early

## Deployment Strategy

### Phase 1: Core Infrastructure (TestNet)
1. Deploy TaskFactory
2. Deploy ExecutorHub
3. Deploy ActionRegistry
4. Deploy RewardManager

### Phase 2: Basic Adapters (TestNet)
1. Deploy TinymanLimitOrderAdapter
2. Deploy SimpleDCAAdapter
3. Deploy TimeBasedAdapter (for testing)

### Phase 3: Integration Testing (TestNet)
1. Create test tasks
2. Run executor bots
3. Verify reward distribution
4. Test edge cases (expiration, cancellation, slashing)

### Phase 4: Advanced Adapters (TestNet)
1. Deploy FolksFinanceAdapter
2. Deploy AlgoFiAdapter
3. Deploy NFT adapters
4. Deploy governance adapters

### Phase 5: MainNet Launch
1. Audit all contracts
2. Deploy to MainNet
3. Bootstrap executor network with incentives
4. Launch frontend dApp

## Frontend Architecture

### Task Creation Interface
- Form to configure task parameters
- Adapter selector with descriptions
- Fund deposit interface
- Task preview and confirmation

### Executor Dashboard
- List of available tasks
- Profitability calculator
- Execution history
- Reputation score display
- Stake management

### Task Monitor
- Active tasks list
- Execution history
- Task status (pending conditions, executing, completed)
- Cancel task button

### Adapter Marketplace
- Browse available adapters
- Adapter statistics (success rate, gas usage)
- Create task from adapter template

## API Endpoints (Off-Chain Monitoring)

```typescript
// Optional: Executor bots can use these APIs

// Get all active tasks
GET /api/tasks/active

// Get tasks for specific adapter
GET /api/tasks/adapter/:adapterAppId

// Get tasks ready for execution
GET /api/tasks/executable

// Get executor stats
GET /api/executors/:address

// Get task execution history
GET /api/tasks/:taskId/history
```

## Comparison: Ethereum vs. Algorand

| Feature | Ethereum TaskerOnChain | Algorand TaskerOnChain |
|---------|------------------------|------------------------|
| **Condition Checking** | Embedded in adapters | Embedded in adapters |
| **Front-Running Protection** | Commit-reveal (2 txns) | Atomic transactions (1 group) |
| **Task Storage** | Contract storage (expensive) | Box storage (cheap) |
| **Execution Model** | EVM external calls | Inner transactions |
| **Gas Costs** | $5-50 per task creation | $0.001-0.01 per task |
| **Executor Stake** | 0.1 ETH (~$300) | 10 ALGO (~$3) |
| **Block Time** | 12 seconds | 3.3 seconds |
| **Finality** | 12+ minutes | 3.3 seconds |
| **Merkle Proofs** | Required | Not needed |

## Economic Model

### Task Creator Costs
- Task creation: ~0.01 ALGO (transaction fee)
- Task vault funding: ~0.5 ALGO (minimum balance)
- Reward pool: User-defined (e.g., 1 ALGO per execution)
- Total per task: ~1.5+ ALGO

### Executor Economics
- Stake requirement: 10 ALGO minimum
- Revenue per execution: Base reward + gas reimbursement + reputation bonus
- Example: 1 ALGO base + 0.01 ALGO gas + 0.1 ALGO bonus = 1.11 ALGO
- Break-even: ~14 executions to recover stake opportunity cost

### Protocol Revenue (Optional)
- Take 2% of base rewards as protocol fee
- Use for development, security audits, ecosystem growth
- Fee can be adjusted via governance

## Next Steps

1. **Implement Core Contracts**: Start with TaskFactory, ExecutorHub, TaskVault
2. **Build Basic Adapter**: TinymanLimitOrderAdapter as proof of concept
3. **Create Testing Framework**: Comprehensive tests for all contracts
4. **Develop Frontend**: Task creation and monitoring UI
5. **Deploy to TestNet**: Begin real-world testing
6. **Build Executor Bot**: Reference implementation for executors
7. **Security Audit**: Professional audit before MainNet
8. **Launch MainNet**: Gradual rollout with incentives

---

**Built on Algorand TypeScript SDK v1.0**
**Compatible with AlgoKit deployment tools**
**Ready for integration with existing dApp template**
