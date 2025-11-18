# TaskerOnChain - Decentralized Task Automation on Algorand

## Overview

TaskerOnChain is a decentralized task automation protocol that enables trustless execution of on-chain operations based on dynamic conditions. Users can create automated tasks (like limit orders, DCA, yield harvesting) that are executed by a network of incentivized executors when specific conditions are met.

## Core Contracts

### 1. TaskFactory (`task_factory/`)

The central registry for creating and tracking all tasks.

**Key Methods:**
- `createTask()` - Create a new automated task
- `getTask()` - Retrieve task metadata
- `cancelTask()` - Cancel an active task (creator only)
- `isTaskExecutable()` - Check if task can be executed

**State:**
- Global: Task count, system contract references
- Box Storage: Task metadata indexed by task ID

### 2. ExecutorHub (`executor_hub/`)

Manages executor registration, staking, and reputation.

**Key Methods:**
- `registerExecutor()` - Register as executor with stake
- `executeTask()` - Execute a task (main entry point)
- `addStake()` - Increase stake amount
- `withdrawStake()` - Withdraw stake
- `getExecutorStats()` - Get executor statistics

**State:**
- Global: Minimum stake, total executors, slashing parameters
- Local (per executor): Stake, executions, reputation, slashed status

**Economics:**
- Minimum stake: 10 ALGO (configurable)
- Reputation system: 0-100 based on success rate
- Slashing: 10% penalty for >20% failure rate (configurable)

### 3. TaskVault (`task_vault/`)

Per-task fund management and action execution.

**Key Methods:**
- `depositAlgo()` - Deposit ALGO rewards
- `depositAsset()` - Deposit ASA rewards
- `executeAction()` - Execute adapter action (called by TaskFactory)
- `withdrawFunds()` - Withdraw remaining funds (creator only, after completion)

**State:**
- Global: Task ID, creator, total deposited/withdrawn
- Vault holds funds in contract account

**Security:**
- Non-custodial: Creator maintains control
- Isolated: Each task has separate vault
- Emergency withdrawal: Available after cooldown period

### 4. RewardManager (`reward_manager/`)

Calculates and tracks executor rewards.

**Key Methods:**
- `calculateReward()` - Calculate total reward for execution
- `recordRewardDistribution()` - Track distributed rewards
- `getExecutorLifetimeRewards()` - Get executor's total rewards

**Reward Formula:**
```
Total = Base Reward + Gas Reimbursement + Reputation Bonus - Protocol Fee

- Base Reward: Task's configured reward amount
- Gas Reimbursement: gasUsed * baseGasPrice
- Reputation Bonus: baseReward * (reputationMultiplier - 100) / 100
- Protocol Fee: total * protocolFeePercent / 10000 (optional)
```

**State:**
- Global: Gas price, protocol fee, statistics
- Box Storage: Per-executor lifetime rewards

### 5. ActionRegistry (`action_registry/`)

Maintains approved action adapters.

**Key Methods:**
- `registerAdapter()` - Register new adapter (admin only)
- `getAdapter()` - Get adapter metadata
- `isAdapterActive()` - Check if adapter is active
- `deactivateAdapter()` - Deactivate adapter
- `recordExecution()` - Track adapter usage

**State:**
- Global: Total adapters, admin
- Box Storage: Adapter metadata (name, description, gas limit, category, stats)

## Adapters

### Base Adapter Interface

All adapters must implement:

```typescript
canExecute(actionParams: bytes): CanExecuteResult
execute(actionParams: bytes): ExecuteResult
getMetadata(): AdapterMetadata
```

### Example: TinymanLimitOrderAdapter (`adapters/tinyman_limit/`)

Executes limit orders on Tinyman DEX when price reaches target.

**Parameters:**
- `fromAssetId` - Asset to sell
- `toAssetId` - Asset to buy
- `amount` - Amount to sell
- `limitPrice` - Target price (fixed-point, 6 decimals)
- `orderType` - 0=Buy, 1=Sell
- `slippageTolerance` - Max slippage in basis points
- `tinymanPoolAppId` - Tinyman pool contract

**Condition Logic (`canExecute`):**
- Buy order: Execute when current price ≤ limit price
- Sell order: Execute when current price ≥ limit price

**Execution Logic (`execute`):**
- Query Tinyman pool for current price
- Create swap transaction group
- Execute swap via inner transactions
- Verify slippage protection

## Execution Flow

### 1. Task Creation

```
User → TaskFactory.createTask()
  ├─ Validate parameters
  ├─ Create TaskVault instance
  ├─ Store task metadata in box storage
  └─ Return task_id

User → TaskVault.depositAlgo/depositAsset()
  └─ Fund task with rewards
```

### 2. Task Execution (Atomic Transaction Group)

```
Executor → ExecutorHub.executeTask(taskId)
  ├─ Verify executor is registered and staked
  ├─ Get task metadata from TaskFactory
  ├─ Verify adapter is active (ActionRegistry)
  ├─ Call Adapter.canExecute() via inner transaction
  │
  ├─ If canExecute = true:
  │  ├─ Call TaskVault.executeAction()
  │  │  ├─ Call Adapter.execute()
  │  │  ├─ Calculate reward (RewardManager)
  │  │  └─ Transfer reward to executor
  │  ├─ Update task state (increment execution count)
  │  └─ Update executor stats (reputation++)
  │
  └─ If canExecute = false:
     └─ Transaction succeeds but no action taken
```

### 3. Reward Distribution

```
TaskVault.executeAction() success
  ├─ Call RewardManager.calculateReward()
  │  └─ Returns: base + gas + reputation bonus
  ├─ Transfer reward (ALGO or ASA) to executor
  ├─ Call RewardManager.recordRewardDistribution()
  └─ Update ExecutorHub stats
```

## Deployment

### Deployment Order

1. **RewardManager** - Deploy first (no dependencies)
2. **ActionRegistry** - Deploy second (no dependencies)
3. **ExecutorHub** - Deploy third (needs TaskFactory ref - will update later)
4. **TaskFactory** - Deploy fourth (needs ExecutorHub, ActionRegistry, RewardManager)
5. **Update ExecutorHub** - Set TaskFactory reference
6. **Deploy Adapters** - Deploy and register in ActionRegistry
7. **TaskVault** - Deployed dynamically by TaskFactory when tasks are created

### Deployment Commands

```bash
# From contracts directory
cd projects/QuickStartTemplate-contracts

# Build all contracts
npm run build

# Deploy to LocalNet
algokit deploy localnet

# Deploy to TestNet
algokit deploy testnet

# Deploy to MainNet
algokit deploy mainnet
```

### Configuration

Each deployment environment needs:
- Admin account (for contract administration)
- Initial gas price (for reward calculations)
- Protocol fee percentage (optional, for sustainability)
- Minimum executor stake
- Slashing parameters (threshold, penalty)

## Testing

### Unit Tests

Located in each contract's directory:

```bash
# Run all tests
npm test

# Test specific contract
npm test task_factory
npm test executor_hub
npm test tinyman_limit
```

### Integration Tests

Full end-to-end tests simulating:
1. Task creation with funding
2. Executor registration with stake
3. Task execution when conditions met
4. Reward distribution
5. Reputation updates
6. Slashing for failed executions

## Usage Examples

### Example 1: Create Limit Order

```typescript
// 1. Create task
const taskId = await taskFactory.createTask({
  expiration: nowTimestamp + 86400, // 24 hours
  maxExecutions: 1, // One-time
  recurringInterval: 0, // Not recurring
  rewardAmount: 100000, // 0.1 ALGO reward
  rewardAssetId: 0, // ALGO
  adapterAppId: tinymanLimitAdapter.appId,
  actionParams: encodeParams({
    fromAssetId: 0, // ALGO
    toAssetId: 31566704, // USDC
    amount: 10000000, // 10 ALGO
    limitPrice: 250000, // $0.25
    orderType: 0, // Buy
    slippageTolerance: 100, // 1%
    tinymanPoolAppId: poolId,
  }),
})

// 2. Fund task vault
await taskVault.depositAlgo({
  amount: 10100000, // 10 ALGO + 0.1 reward
})
```

### Example 2: Register as Executor

```typescript
// Opt into ExecutorHub
await executorHub.optIn()

// Register with stake
await executorHub.registerExecutor({
  stakeAmount: 10000000, // 10 ALGO stake
})
```

### Example 3: Execute Task

```typescript
// Check if task is executable
const canExecute = await taskFactory.isTaskExecutable(taskId)

if (canExecute) {
  // Execute task
  const result = await executorHub.executeTask({
    taskId: taskId,
    actionParams: taskActionParams,
  })

  if (result.success) {
    console.log('Task executed successfully!')
    console.log('Reward received:', result.rewardAmount)
  }
}
```

## Security Considerations

### 1. Adapter Whitelisting
- Only admin-approved adapters in ActionRegistry
- Each adapter should be audited before activation
- Gas limits enforced to prevent DoS

### 2. Economic Security
- Executor stake > potential malicious profit
- Slashing for failed executions
- Reputation system for long-term alignment

### 3. Access Control
- TaskVault only callable by TaskFactory
- ExecutorHub requires valid stake
- Cancel/withdraw only by task creator

### 4. Atomicity
- All execution steps in single atomic group
- No partial state updates on failure
- Inner transaction failure rolls back entire execution

### 5. Oracle Security
- Adapters use multiple price sources when possible
- Time-weighted averages for price data
- Slippage protection on all swaps

## Gas Optimization

1. **Box Storage** - Use efficient packing for metadata
2. **Lazy Evaluation** - Skip expensive operations when possible
3. **Batch Operations** - Minimize inner transaction count
4. **State Caching** - Cache frequently accessed data

## Monitoring & Analytics

### On-Chain Metrics

- Total tasks created
- Total executions
- Total rewards distributed
- Executor statistics (stake, reputation, rewards)
- Adapter success rates

### Off-Chain Indexing

Recommended to index:
- Task creation events
- Execution events
- Reward distribution
- Slashing events
- Adapter usage

Use Algorand Indexer to query historical data.

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] TaskFactory
- [x] ExecutorHub
- [x] TaskVault
- [x] RewardManager
- [x] ActionRegistry

### Phase 2: Basic Adapters (Current)
- [x] TinymanLimitOrderAdapter
- [ ] SimpleDCAAdapter
- [ ] TimeBasedAdapter

### Phase 3: Advanced Features
- [ ] Multi-adapter tasks (sequential execution)
- [ ] Task groups (atomic execution of multiple tasks)
- [ ] Advanced reputation (stake-weighted, time-decayed)
- [ ] Governance (protocol parameter voting)

### Phase 4: Ecosystem Integration
- [ ] Folks Finance adapters
- [ ] AlgoFi adapters
- [ ] NFT marketplace adapters
- [ ] Governance voting adapters

### Phase 5: Frontend & Tools
- [ ] Web UI for task creation
- [ ] Executor dashboard
- [ ] Analytics dashboard
- [ ] Executor bot (reference implementation)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## License

MIT License

## Support

- GitHub Issues: [Report bugs]
- Discord: [Community chat]
- Documentation: [Full docs]

---

**Built with Algorand TypeScript SDK**
**Compatible with AlgoKit deployment**
