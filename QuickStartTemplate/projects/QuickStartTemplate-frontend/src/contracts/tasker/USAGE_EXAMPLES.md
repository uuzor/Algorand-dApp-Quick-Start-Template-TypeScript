# TaskerOnChain Smart Contract Helpers - Usage Examples

Comprehensive guide for integrating TaskerOnChain into your Algorand dApp.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [Task Creator Workflows](#task-creator-workflows)
- [Executor Workflows](#executor-workflows)
- [Advanced Patterns](#advanced-patterns)
- [React Integration](#react-integration)

## Installation & Setup

### 1. Import Dependencies

```typescript
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { TaskerClient, createTaskerClient, TaskStatus } from './contracts/tasker'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from './utils/network/getAlgoClientConfigs'
```

### 2. Initialize Client

```typescript
// Get Algorand client
const algodConfig = getAlgodConfigFromViteEnvironment()
const indexerConfig = getIndexerConfigFromViteEnvironment()
const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

// Create TaskerClient with contract app IDs
const taskerClient = createTaskerClient(algorand, {
  taskFactoryAppId: 123456,
  executorHubAppId: 123457,
  actionRegistryAppId: 123458,
  rewardManagerAppId: 123459,
})

// Set signer from wallet
const { transactionSigner, activeAddress } = useWallet()
taskerClient.setSigner(transactionSigner, activeAddress!)
```

## Basic Usage

### Check System Status

```typescript
// Get system statistics
const stats = await taskerClient.getSystemStats()
console.log(`Total Tasks: ${stats.totalTasks}`)
console.log(`Active Tasks: ${stats.activeTasks}`)
console.log(`Total Executors: ${stats.totalExecutors}`)
console.log(`Total Staked: ${stats.totalStaked / 1_000_000} ALGO`)

// Get system parameters
const params = await taskerClient.getSystemParameters()
console.log(`Minimum Stake: ${params.minStake / 1_000_000} ALGO`)
console.log(`Slashing Threshold: ${params.slashingThreshold}%`)
```

## Task Creator Workflows

### Example 1: Create a Recurring Limit Order Task

```typescript
import { OrderType } from './contracts/tasker'

// Encode Tinyman limit order parameters
const tinymanParams = {
  fromAssetId: 0, // ALGO
  toAssetId: 31566704, // USDC
  amount: 10_000_000, // 10 ALGO
  limitPrice: 2500, // $0.25 per ALGO (in basis points)
  orderType: OrderType.Sell,
  slippageTolerance: 50, // 0.5%
  tinymanPoolAppId: 552635992,
}

// Create ABI-encoded parameters (simplified)
const actionParams = new Uint8Array(
  Buffer.from(JSON.stringify(tinymanParams))
)

// Create task
const result = await taskerClient.createTask({
  expiration: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days
  maxExecutions: 0, // Unlimited executions
  recurringInterval: 3600, // Execute every hour
  rewardAmount: 100_000, // 0.1 ALGO per execution
  rewardAssetId: 0, // Pay in ALGO
  adapterAppId: tinymanAdapterAppId,
  actionParams,
})

console.log(`Task created with ID: ${result.result.taskId}`)
console.log(`Transaction: ${result.transactionId}`)

// Fund the task vault
// TODO: Implement vault funding
```

### Example 2: Create a One-Time Time-Based Transfer

```typescript
// Send 5 ALGO to charity on January 1, 2026
const transferParams = {
  token: '0x0000000000000000000000000000000000000000', // ALGO
  recipient: 'CHARITY...ADDRESS',
  amount: 5_000_000, // 5 ALGO
  executeAfter: new Date('2026-01-01').getTime() / 1000,
}

const actionParams = new Uint8Array(
  Buffer.from(JSON.stringify(transferParams))
)

const result = await taskerClient.createTask({
  expiration: new Date('2026-01-02').getTime() / 1000, // 1 day buffer
  maxExecutions: 1, // One-time task
  recurringInterval: 0, // Not recurring
  rewardAmount: 50_000, // 0.05 ALGO reward
  rewardAssetId: 0,
  adapterAppId: timeTransferAdapterAppId,
  actionParams,
})

console.log(`One-time transfer task created: ${result.result.taskId}`)
```

### Example 3: Monitor and Manage Tasks

```typescript
// Get all my tasks
const myTasks = await taskerClient.getMyTasks()

for (const task of myTasks) {
  console.log(`Task ${task.taskId}:`)
  console.log(`  Status: ${TaskStatus[task.status]}`)
  console.log(`  Executions: ${task.executionCount}/${task.maxExecutions || '∞'}`)
  console.log(`  Reward: ${task.rewardAmount / 1_000_000} ALGO`)

  // Check if ready to execute
  const isExecutable = await taskerClient.isTaskExecutable(task.taskId)
  console.log(`  Executable: ${isExecutable ? 'Yes' : 'No'}`)
}

// Cancel a task
const taskToCancel = 5
const cancelResult = await taskerClient.cancelTask(taskToCancel)
console.log(`Task ${taskToCancel} cancelled: ${cancelResult.transactionId}`)
```

## Executor Workflows

### Example 4: Register as an Executor

```typescript
// Check if already registered
const isExecutor = await taskerClient.isExecutor()

if (!isExecutor) {
  // Get minimum stake requirement
  const params = await taskerClient.getSystemParameters()
  console.log(`Minimum stake: ${params.minStake / 1_000_000} ALGO`)

  // Register with 15 ALGO stake
  const registerResult = await taskerClient.registerAsExecutor({
    stakeAmount: 15_000_000, // 15 ALGO
  })

  console.log(`Registered as executor: ${registerResult.transactionId}`)
} else {
  console.log('Already registered as executor')
}

// Get executor profile
const profile = await taskerClient.getMyExecutorProfile()
console.log(`Stake: ${profile.stakeAmount / 1_000_000} ALGO`)
console.log(`Reputation: ${profile.reputationScore}/100`)
console.log(`Success Rate: ${
  (profile.successfulExecutions /
   (profile.successfulExecutions + profile.failedExecutions) * 100).toFixed(2)
}%`)
console.log(`Total Rewards: ${profile.totalRewardsEarned / 1_000_000} ALGO`)
```

### Example 5: Execute Tasks and Earn Rewards

```typescript
// Get all executable tasks
const activeTasks = await taskerClient.getActiveTasks()

for (const task of activeTasks) {
  // Check if executable
  const isExecutable = await taskerClient.isTaskExecutable(task.taskId)

  if (isExecutable) {
    console.log(`Executing task ${task.taskId}...`)

    try {
      // Execute the task
      const execResult = await taskerClient.executeTask({
        taskId: task.taskId,
        actionParams: task.actionParamsHash, // Must match original params
      })

      if (execResult.result.success) {
        console.log(`✓ Task ${task.taskId} executed successfully!`)
        console.log(`  Reward earned: ${execResult.result.rewardPaid / 1_000_000} ALGO`)
        console.log(`  Gas used: ${execResult.result.gasUsed}`)
      } else {
        console.log(`✗ Task ${task.taskId} execution failed`)
      }
    } catch (error) {
      console.error(`Error executing task ${task.taskId}:`, error)
    }
  }
}

// Monitor executor performance
const profile = await taskerClient.getMyExecutorProfile()
console.log(`\nExecutor Stats:`)
console.log(`  Successful: ${profile.successfulExecutions}`)
console.log(`  Failed: ${profile.failedExecutions}`)
console.log(`  Total Earned: ${profile.totalRewardsEarned / 1_000_000} ALGO`)
console.log(`  Reputation: ${profile.reputationScore}/100`)
```

### Example 6: Manage Executor Stake

```typescript
// Add more stake
const addStakeResult = await taskerClient.addStake(5_000_000) // Add 5 ALGO
console.log(`Added 5 ALGO stake: ${addStakeResult.transactionId}`)

// Check updated profile
const profile = await taskerClient.getMyExecutorProfile()
console.log(`New stake amount: ${profile.stakeAmount / 1_000_000} ALGO`)

// Withdraw excess stake (keep minimum)
const params = await taskerClient.getSystemParameters()
const excessStake = profile.stakeAmount - params.minStake

if (excessStake > 0) {
  const withdrawResult = await taskerClient.withdrawStake(excessStake)
  console.log(`Withdrew ${excessStake / 1_000_000} ALGO: ${withdrawResult.transactionId}`)
}
```

## Advanced Patterns

### Example 7: Build an Automated Executor Bot

```typescript
/**
 * Automated task execution bot
 */
class TaskExecutorBot {
  private taskerClient: TaskerClient
  private isRunning = false

  constructor(taskerClient: TaskerClient) {
    this.taskerClient = taskerClient
  }

  async start(intervalMs: number = 60000) {
    this.isRunning = true
    console.log('🤖 TaskExecutor Bot started')

    while (this.isRunning) {
      await this.scanAndExecute()
      await this.sleep(intervalMs)
    }
  }

  stop() {
    this.isRunning = false
    console.log('🛑 TaskExecutor Bot stopped')
  }

  private async scanAndExecute() {
    try {
      // Get executable tasks
      const tasks = await this.taskerClient.getActiveTasks()

      for (const task of tasks) {
        if (await this.taskerClient.isTaskExecutable(task.taskId)) {
          await this.executeTaskWithRetry(task.taskId, 3)
        }
      }
    } catch (error) {
      console.error('Error in scan cycle:', error)
    }
  }

  private async executeTaskWithRetry(
    taskId: number,
    maxRetries: number
  ) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Executing task ${taskId} (attempt ${attempt})...`)

        const result = await this.taskerClient.executeTask({
          taskId,
          actionParams: new Uint8Array(), // TODO: Fetch from task
        })

        console.log(`✓ Task ${taskId} executed: +${result.result.rewardPaid / 1_000_000} ALGO`)
        return
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          await this.sleep(5000) // Wait 5s before retry
        }
      }
    }

    console.error(`✗ Task ${taskId} failed after ${maxRetries} attempts`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Usage
const bot = new TaskExecutorBot(taskerClient)
bot.start(30000) // Scan every 30 seconds
```

### Example 8: Task Dashboard Component (React)

```typescript
import React, { useEffect, useState } from 'react'
import { TaskerClient, TaskMetadata, TaskStatus } from './contracts/tasker'

interface TaskDashboardProps {
  taskerClient: TaskerClient
}

export function TaskDashboard({ taskerClient }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<TaskMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const myTasks = await taskerClient.getMyTasks()
      setTasks(myTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(taskId: number) {
    try {
      await taskerClient.cancelTask(taskId)
      await loadTasks() // Refresh
    } catch (error) {
      console.error('Failed to cancel task:', error)
    }
  }

  if (loading) return <div>Loading tasks...</div>

  return (
    <div className="task-dashboard">
      <h2>My Tasks ({tasks.length})</h2>

      {tasks.map((task, index) => (
        <div key={index} className="task-card">
          <h3>Task #{index + 1}</h3>
          <p>Status: {TaskStatus[task.status]}</p>
          <p>Executions: {task.executionCount}/{task.maxExecutions || '∞'}</p>
          <p>Reward: {task.rewardAmount / 1_000_000} ALGO</p>
          <p>Expires: {new Date(Number(task.expiration) * 1000).toLocaleString()}</p>

          {task.status === TaskStatus.Active && (
            <button onClick={() => handleCancel(index + 1)}>
              Cancel Task
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

## React Integration

### Complete React Hook Example

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TaskerClient, createTaskerClient } from './contracts/tasker'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

/**
 * Custom hook for TaskerOnChain integration
 */
export function useTasker() {
  const { transactionSigner, activeAddress } = useWallet()
  const [taskerClient, setTaskerClient] = useState<TaskerClient | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize client
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

    const client = createTaskerClient(algorand)

    // Set signer if wallet connected
    if (transactionSigner && activeAddress) {
      client.setSigner(transactionSigner, activeAddress)
      setIsReady(true)
    } else {
      setIsReady(false)
    }

    setTaskerClient(client)
  }, [transactionSigner, activeAddress])

  const createTask = useCallback(async (params: any) => {
    if (!taskerClient) throw new Error('Client not initialized')
    return await taskerClient.createTask(params)
  }, [taskerClient])

  const getMyTasks = useCallback(async () => {
    if (!taskerClient) throw new Error('Client not initialized')
    return await taskerClient.getMyTasks()
  }, [taskerClient])

  const registerAsExecutor = useCallback(async (stakeAmount: number) => {
    if (!taskerClient) throw new Error('Client not initialized')
    return await taskerClient.registerAsExecutor({ stakeAmount })
  }, [taskerClient])

  return {
    taskerClient,
    isReady,
    createTask,
    getMyTasks,
    registerAsExecutor,
  }
}

// Usage in component
function MyComponent() {
  const { taskerClient, isReady, createTask, getMyTasks } = useTasker()

  if (!isReady) {
    return <div>Please connect your wallet</div>
  }

  // Use taskerClient methods...
}
```

## Error Handling

```typescript
try {
  const result = await taskerClient.createTask(params)
  console.log('Success:', result)
} catch (error) {
  if (error.message.includes('Expiration must be in future')) {
    console.error('Invalid expiration time')
  } else if (error.message.includes('Insufficient stake')) {
    console.error('Need more ALGO staked')
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Testing

```typescript
describe('TaskerClient', () => {
  let taskerClient: TaskerClient
  let mockAlgorand: AlgorandClient

  beforeEach(() => {
    mockAlgorand = // ... mock setup
    taskerClient = new TaskerClient(mockAlgorand, {
      taskFactoryAppId: 123456,
      executorHubAppId: 123457,
      actionRegistryAppId: 123458,
      rewardManagerAppId: 123459,
    })
  })

  it('should create a task', async () => {
    const result = await taskerClient.createTask({
      expiration: Math.floor(Date.now() / 1000) + 86400,
      maxExecutions: 10,
      recurringInterval: 3600,
      rewardAmount: 1_000_000,
      rewardAssetId: 0,
      adapterAppId: 999999,
      actionParams: new Uint8Array(),
    })

    expect(result.result.taskId).toBeGreaterThan(0)
  })
})
```

## Additional Resources

- [TaskerOnChain Architecture](../../../TASKER_ARCHITECTURE.md)
- [Smart Contract Documentation](../../../smart_contracts/tasker/README.md)
- [AlgoKit Utils Documentation](https://algorandfoundation.github.io/algokit-utils-ts/)
- [Algorand Developer Portal](https://developer.algorand.org/)
