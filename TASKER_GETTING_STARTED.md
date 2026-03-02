# TaskerOnChain - Getting Started Guide

## What is TaskerOnChain?

TaskerOnChain is a decentralized task automation protocol on Algorand that enables:

- **Automated Trading**: Limit orders, stop losses, DCA strategies
- **Yield Optimization**: Auto-harvest and compound rewards
- **Portfolio Management**: Automatic rebalancing
- **DeFi Automation**: Loan repayment, liquidity management
- **NFT Operations**: Floor price sniping, automated bidding

**Key Advantages over Centralized Solutions:**
- ✅ Fully decentralized - no centralized oracle needed
- ✅ Non-custodial - you control your funds
- ✅ Transparent - all logic on-chain
- ✅ Incentivized executor network
- ✅ Low cost - Algorand's cheap transactions
- ✅ Fast - 3.3s block finality

## Quick Start

### Prerequisites

```bash
# Install AlgoKit (if not already installed)
curl -sSL https://algokit.io/install | bash

# Install dependencies
npm install
```

### 1. Start LocalNet

```bash
algokit localnet start
```

### 2. Deploy Contracts

```bash
cd projects/QuickStartTemplate-contracts

# Build contracts
npm run build

# Deploy to LocalNet
npm run deploy
```

### 3. Run Frontend

```bash
cd projects/QuickStartTemplate-frontend

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Use Cases & Examples

### Example 1: Create a Limit Order

**Scenario**: Buy 100 USDC of ALGO when price drops to $0.20

```typescript
import { TaskFactoryClient } from './clients/TaskFactoryClient'
import { TinymanLimitOrderAdapter } from './clients/TinymanLimitOrderClient'

// 1. Connect to TaskFactory
const taskFactory = new TaskFactoryClient({
  sender: yourAddress,
  algorand: algorandClient,
})

// 2. Encode limit order parameters
const limitOrderParams = {
  fromAssetId: 31566704, // USDC
  toAssetId: 0, // ALGO
  amount: 100_000000, // 100 USDC (6 decimals)
  limitPrice: 200000, // $0.20 (fixed-point, 6 decimals)
  orderType: 0, // Buy order
  slippageTolerance: 100, // 1%
  tinymanPoolAppId: TINYMAN_USDC_ALGO_POOL,
}

// 3. Create task
const { taskId } = await taskFactory.send.createTask({
  args: {
    expiration: nowTimestamp + 86400, // Expires in 24 hours
    maxExecutions: 1, // Execute once
    recurringInterval: 0, // Not recurring
    rewardAmount: 100000, // 0.1 ALGO reward to executor
    rewardAssetId: 0, // Pay in ALGO
    adapterAppId: TINYMAN_LIMIT_ADAPTER,
    actionParams: encodeParams(limitOrderParams),
  },
})

// 4. Fund the task vault
await taskVault.send.depositAlgo({
  args: {
    paymentTxn: {
      amount: 100_100000, // 100 USDC to trade + 0.1 ALGO reward
    },
  },
})

console.log(`✅ Limit order created! Task ID: ${taskId}`)
console.log(`⏰ Will execute when ALGO price ≤ $0.20`)
```

### Example 2: Dollar Cost Average (DCA)

**Scenario**: Buy $50 of ALGO every Monday for 12 weeks

```typescript
const dcaParams = {
  fromAssetId: 31566704, // USDC
  toAssetId: 0, // ALGO
  amountPerExecution: 50_000000, // $50 USDC
  maxPrice: 500000, // Max $0.50 per ALGO
}

const { taskId } = await taskFactory.send.createTask({
  args: {
    expiration: nowTimestamp + 86400 * 84, // 12 weeks
    maxExecutions: 12, // 12 weekly purchases
    recurringInterval: 604800, // 7 days
    rewardAmount: 50000, // 0.05 ALGO per execution
    rewardAssetId: 0,
    adapterAppId: DCA_ADAPTER,
    actionParams: encodeParams(dcaParams),
  },
})

// Fund with total amount + rewards
await taskVault.send.depositAsset({
  args: {
    assetTxn: {
      amount: 600_000000, // $600 USDC (12 x $50)
      assetId: 31566704,
    },
  },
})

await taskVault.send.depositAlgo({
  args: {
    paymentTxn: {
      amount: 600000, // 0.6 ALGO for rewards (12 x 0.05)
    },
  },
})

console.log(`✅ DCA strategy created! Task ID: ${taskId}`)
console.log(`📅 Will buy $50 of ALGO every 7 days for 12 weeks`)
```

### Example 3: Yield Auto-Harvest

**Scenario**: Auto-harvest and compound AlgoFi yields when rewards > 10 ALGO

```typescript
const harvestParams = {
  poolAppId: ALGOFI_STAKING_POOL,
  minClaimAmount: 10_000000, // 10 ALGO minimum
  autoCompound: true,
}

const { taskId } = await taskFactory.send.createTask({
  args: {
    expiration: nowTimestamp + 86400 * 365, // 1 year
    maxExecutions: 0, // Unlimited
    recurringInterval: 86400, // Check daily
    rewardAmount: 20000, // 0.02 ALGO per harvest
    rewardAssetId: 0,
    adapterAppId: ALGOFI_HARVEST_ADAPTER,
    actionParams: encodeParams(harvestParams),
  },
})

console.log(`✅ Auto-harvest created! Task ID: ${taskId}`)
console.log(`🌾 Will harvest and compound yields daily when rewards > 10 ALGO`)
```

### Example 4: Stop Loss

**Scenario**: Sell 1000 ALGO if price drops below $0.15

```typescript
const stopLossParams = {
  assetId: 0, // ALGO
  amount: 1000_000000, // 1000 ALGO
  triggerPrice: 150000, // $0.15
  dexAppId: TINYMAN_POOL,
}

const { taskId } = await taskFactory.send.createTask({
  args: {
    expiration: nowTimestamp + 86400 * 30, // 30 days
    maxExecutions: 1, // One-time
    recurringInterval: 0,
    rewardAmount: 100000, // 0.1 ALGO
    rewardAssetId: 0,
    adapterAppId: STOP_LOSS_ADAPTER,
    actionParams: encodeParams(stopLossParams),
  },
})

console.log(`✅ Stop loss created! Task ID: ${taskId}`)
console.log(`🛑 Will sell 1000 ALGO if price drops below $0.15`)
```

## Becoming an Executor

Executors earn rewards by executing tasks when conditions are met.

### 1. Register as Executor

```typescript
import { ExecutorHubClient } from './clients/ExecutorHubClient'

const executorHub = new ExecutorHubClient({
  sender: yourAddress,
  algorand: algorandClient,
})

// Opt into ExecutorHub
await executorHub.send.optIn({})

// Register with 10 ALGO stake
await executorHub.send.registerExecutor({
  args: {
    stakeTxn: {
      amount: 10_000000, // 10 ALGO minimum stake
    },
  },
})

console.log('✅ Registered as executor!')
```

### 2. Monitor and Execute Tasks

```typescript
// Get all active tasks
const tasks = await taskFactory.getAllActiveTasks()

for (const task of tasks) {
  // Check if task is executable
  const canExecute = await taskFactory.send.isTaskExecutable({
    args: { taskId: task.id },
  })

  if (canExecute) {
    // Execute the task
    const result = await executorHub.send.executeTask({
      args: {
        taskId: task.id,
        actionParams: task.actionParams,
      },
    })

    if (result.success) {
      console.log(`✅ Executed task ${task.id}`)
      console.log(`💰 Reward received: ${result.rewardAmount}`)
    }
  }
}
```

### 3. Build Executor Bot (Optional)

For automated execution, create a bot:

```typescript
// executor-bot.ts
import { TaskFactoryClient, ExecutorHubClient } from './clients'

class ExecutorBot {
  constructor(
    private taskFactory: TaskFactoryClient,
    private executorHub: ExecutorHubClient
  ) {}

  async start() {
    console.log('🤖 Executor bot started')

    // Poll for executable tasks every 10 seconds
    setInterval(async () => {
      await this.checkAndExecuteTasks()
    }, 10000)
  }

  async checkAndExecuteTasks() {
    const tasks = await this.taskFactory.getAllActiveTasks()

    for (const task of tasks) {
      try {
        const canExecute = await this.taskFactory.send.isTaskExecutable({
          args: { taskId: task.id },
        })

        if (canExecute) {
          console.log(`⚡ Executing task ${task.id}...`)

          const result = await this.executorHub.send.executeTask({
            args: {
              taskId: task.id,
              actionParams: task.actionParams,
            },
          })

          if (result.success) {
            console.log(`✅ Task ${task.id} executed successfully`)
            console.log(`💰 Reward: ${result.rewardAmount} microALGO`)
          }
        }
      } catch (error) {
        console.error(`❌ Error executing task ${task.id}:`, error)
      }
    }
  }
}

// Start the bot
const bot = new ExecutorBot(taskFactory, executorHub)
bot.start()
```

## Executor Economics

### Revenue Breakdown

For each successful execution, you earn:

1. **Base Reward**: Set by task creator (e.g., 0.1 ALGO)
2. **Gas Reimbursement**: gasUsed × gasPrice (e.g., 0.01 ALGO)
3. **Reputation Bonus**: Up to 20% extra for high reputation

**Example:**
- Base reward: 0.1 ALGO
- Gas reimbursement: 0.01 ALGO
- Reputation bonus (15% for 95% success rate): 0.015 ALGO
- **Total: 0.125 ALGO**

### Reputation System

Your reputation score affects bonus rewards:

```
Reputation Score = (Successful Executions / Total Executions) × 100

Reputation Multiplier = 100 + (Reputation Score / 10)

Max Multiplier: 120 (20% bonus at 100% success rate)
```

### Staking Requirements

- **Minimum stake**: 10 ALGO (configurable)
- **Slashing**: 10% penalty if failure rate > 20%
- **Withdrawal**: Can withdraw stake anytime (maintaining minimum)

### ROI Calculation

```
Assumptions:
- Stake: 10 ALGO
- Average reward: 0.1 ALGO per execution
- Daily executions: 20
- Success rate: 95%

Daily Revenue: 20 × 0.1 × 0.95 = 1.9 ALGO
Monthly Revenue: 1.9 × 30 = 57 ALGO
Monthly ROI: (57 / 10) × 100 = 570%
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 TaskerOnChain System                 │
└─────────────────────────────────────────────────────┘
              │
              ├─── TaskFactory (Registry)
              │    └─ Creates and tracks all tasks
              │
              ├─── ExecutorHub (Executor Management)
              │    └─ Staking, reputation, execution coordination
              │
              ├─── TaskVault (Per-task fund management)
              │    └─ Holds funds, executes adapters
              │
              ├─── RewardManager (Incentive Distribution)
              │    └─ Calculates and tracks rewards
              │
              ├─── ActionRegistry (Adapter Management)
              │    └─ Whitelisted adapters with metadata
              │
              └─── Adapters (Action Execution)
                   ├─ TinymanLimitOrderAdapter
                   ├─ DCAAdapter
                   ├─ StopLossAdapter
                   └─ ... more adapters
```

## Contract Addresses

### LocalNet
- TaskFactory: `TBD` (after deployment)
- ExecutorHub: `TBD`
- RewardManager: `TBD`
- ActionRegistry: `TBD`

### TestNet
- TaskFactory: `TBD`
- ExecutorHub: `TBD`
- RewardManager: `TBD`
- ActionRegistry: `TBD`

### MainNet
- 🚧 Not yet deployed

## Development

### Running Tests

```bash
cd projects/QuickStartTemplate-contracts

# Run all tests
npm test

# Test specific contract
npm test task_factory
npm test executor_hub
```

### Building Contracts

```bash
# Compile all contracts
npm run build

# Generate TypeScript clients
algokit generate client smart_contracts/tasker/task_factory/artifacts --output smart_contracts/tasker/task_factory/TaskFactoryClient.ts
```

### Deploying Custom Adapter

1. Create adapter contract:

```typescript
// my_adapter/contract.algo.ts
import { Contract } from '@algorandfoundation/algorand-typescript'

export class MyAdapter extends Contract {
  canExecute(actionParams: bytes): CanExecuteResult {
    // Check conditions
    return new CanExecuteResult(true, 'Ready')
  }

  execute(actionParams: bytes): ExecuteResult {
    // Perform action
    return new ExecuteResult(true, 'Success')
  }
}
```

2. Deploy adapter:

```bash
npm run build
npm run deploy
```

3. Register with ActionRegistry:

```typescript
await actionRegistry.send.registerAdapter({
  args: {
    adapterAppId: myAdapterAppId,
    name: 'My Custom Adapter',
    description: 'Does something cool',
    maxGasLimit: 10000,
    category: 'custom',
  },
})
```

## Security Best Practices

### For Task Creators

1. **Set Reasonable Expiration**: Don't create tasks that expire too far in future
2. **Monitor Task Status**: Check execution status regularly
3. **Use Trusted Adapters**: Only use audited, whitelisted adapters
4. **Set Appropriate Rewards**: Higher rewards attract more executors
5. **Test on TestNet**: Always test tasks on TestNet first

### For Executors

1. **Maintain Minimum Stake**: Keep stake above minimum to avoid deactivation
2. **Monitor Reputation**: High reputation = higher rewards
3. **Validate Tasks**: Ensure task parameters are sensible before executing
4. **Gas Estimation**: Simulate execution before committing
5. **Diversify**: Don't rely on single task type

## Troubleshooting

### Common Issues

**Issue**: Task not executing
- ✅ Check if task is still active (not expired/cancelled)
- ✅ Verify conditions are met (use adapter's canExecute)
- ✅ Ensure task has sufficient funds in vault
- ✅ Check executor is registered and not slashed

**Issue**: Execution failed
- ✅ Check adapter is active in ActionRegistry
- ✅ Verify action parameters are correctly encoded
- ✅ Ensure sufficient gas limit
- ✅ Check slippage tolerance for swaps

**Issue**: Low executor participation
- ✅ Increase reward amount
- ✅ Reduce task complexity
- ✅ Extend expiration time
- ✅ Check if adapter is popular/trusted

## Community & Support

- **GitHub**: [Report issues](https://github.com/your-repo/issues)
- **Discord**: [Join community](#)
- **Docs**: [Full documentation](#)
- **Twitter**: [@TaskerOnChain](#)

## Roadmap

- [x] Core contracts (TaskFactory, ExecutorHub, TaskVault, RewardManager, ActionRegistry)
- [x] Basic adapters (Tinyman limit orders)
- [ ] Advanced adapters (Folks Finance, AlgoFi, Pact)
- [ ] Frontend dApp (task creation, executor dashboard)
- [ ] Executor bot reference implementation
- [ ] TestNet deployment
- [ ] Security audit
- [ ] MainNet launch
- [ ] Governance token
- [ ] Advanced features (task groups, multi-step automation)

## License

MIT License - see LICENSE file

---

**Ready to automate your DeFi operations? Start creating tasks now!**

```bash
npm run dev
```

Visit http://localhost:5173 to get started.
