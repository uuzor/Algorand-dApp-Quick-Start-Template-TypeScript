/**
 * MarketplacePage - Container page with TaskerClient integration
 */

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useSnackbar } from 'notistack'
import TaskMarketplace from '../components/marketplace/TaskMarketplace'
import { TaskWithId } from '../components/marketplace/TaskMarketplace'
import { createTaskerClient } from '../contracts/tasker'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'

export default function MarketplacePage() {
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [tasks, setTasks] = useState<TaskWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [isExecutor, setIsExecutor] = useState(false)

  // Initialize Algorand client and TaskerClient
  const algorand = AlgorandClient.fromConfig({
    algodConfig: getAlgodConfigFromViteEnvironment(),
    indexerConfig: getIndexerConfigFromViteEnvironment(),
  })

  const taskerClient = createTaskerClient(algorand, {
    taskFactoryAppId: 0, // TODO: Set from environment or deployment
    executorHubAppId: 0,
    actionRegistryAppId: 0,
    rewardManagerAppId: 0,
  })

  // Set signer when wallet connects
  useEffect(() => {
    if (transactionSigner && activeAddress) {
      taskerClient.setSigner(transactionSigner, activeAddress)
      checkExecutorStatus()
    }
  }, [transactionSigner, activeAddress])

  // Check if user is registered as executor
  const checkExecutorStatus = useCallback(async () => {
    if (!activeAddress) return

    try {
      const isReg = await taskerClient.isExecutor()
      setIsExecutor(isReg)
    } catch (error) {
      console.error('Failed to check executor status:', error)
      setIsExecutor(false)
    }
  }, [activeAddress, taskerClient])

  // Load tasks from blockchain
  const loadTasks = useCallback(async () => {
    setLoading(true)

    try {
      // For demo, use mock data since contracts aren't deployed yet
      const mockTasks: TaskWithId[] = generateMockTasks()
      setTasks(mockTasks)

      // TODO: Replace with real data when contracts are deployed
      // const activeTasks = await taskerClient.getActiveTasks()
      // setTasks(activeTasks)

      enqueueSnackbar('Tasks loaded successfully', { variant: 'success' })
    } catch (error) {
      console.error('Failed to load tasks:', error)
      enqueueSnackbar('Failed to load tasks', { variant: 'error' })

      // Use mock data as fallback
      setTasks(generateMockTasks())
    } finally {
      setLoading(false)
    }
  }, [taskerClient, enqueueSnackbar])

  // Execute a task
  const handleExecuteTask = async (taskId: number) => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet', { variant: 'warning' })
      return
    }

    if (!isExecutor) {
      enqueueSnackbar('You must register as an executor first', {
        variant: 'warning',
      })
      return
    }

    try {
      enqueueSnackbar(`Executing task ${taskId}...`, { variant: 'info' })

      // TODO: Implement actual execution when contracts are deployed
      // const result = await taskerClient.executeTask({
      //   taskId,
      //   actionParams: new Uint8Array(),
      // })

      // For demo, simulate execution
      await new Promise((resolve) => setTimeout(resolve, 2000))

      enqueueSnackbar(`Task ${taskId} executed successfully!`, {
        variant: 'success',
      })

      // Refresh tasks
      await loadTasks()
    } catch (error: any) {
      console.error('Failed to execute task:', error)
      enqueueSnackbar(`Failed to execute task: ${error.message}`, {
        variant: 'error',
      })
    }
  }

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return (
    <TaskMarketplace
      tasks={tasks}
      loading={loading}
      onRefresh={loadTasks}
      onExecuteTask={handleExecuteTask}
      currentUserAddress={activeAddress}
      isExecutor={isExecutor}
    />
  )
}

// Mock data generator for demonstration
function generateMockTasks(): TaskWithId[] {
  const now = Math.floor(Date.now() / 1000)

  return [
    {
      taskId: 1,
      creator: 'ALGOACCOUNT123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      vaultAppId: 999001,
      expiration: now + 86400 * 7, // 7 days
      maxExecutions: 10,
      executionCount: 3,
      recurringInterval: 3600, // Every hour
      lastExecution: now - 1800,
      rewardAmount: 1_500_000, // 1.5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888001,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 2,
      creator: 'ALGOUSER987654321ZYXWVUTSRQPONMLKJIHGFEDCBA',
      vaultAppId: 999002,
      expiration: now + 86400 * 2, // 2 days
      maxExecutions: 1,
      executionCount: 0,
      recurringInterval: 0, // One-time
      lastExecution: 0,
      rewardAmount: 5_000_000, // 5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888002,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 3,
      creator: 'ALGOTASK111222333444555666777888999AAABBBCCC',
      vaultAppId: 999003,
      expiration: now + 86400 * 30, // 30 days
      maxExecutions: 0, // Unlimited
      executionCount: 42,
      recurringInterval: 7200, // Every 2 hours
      lastExecution: now - 3600,
      rewardAmount: 750_000, // 0.75 ALGO
      rewardAssetId: 0,
      adapterAppId: 888001,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 4,
      creator: 'ALGOSWAP444555666777888999AAABBBCCCDDDEEEFFFGGG',
      vaultAppId: 999004,
      expiration: now + 86400 * 14, // 14 days
      maxExecutions: 20,
      executionCount: 15,
      recurringInterval: 1800, // Every 30 minutes
      lastExecution: now - 900,
      rewardAmount: 2_250_000, // 2.25 ALGO
      rewardAssetId: 0,
      adapterAppId: 888003,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 5,
      creator: 'ALGODEFI777888999AAABBBCCCDDDEEEFFFGGGHHHIII',
      vaultAppId: 999005,
      expiration: now - 3600, // Expired 1 hour ago
      maxExecutions: 5,
      executionCount: 5,
      recurringInterval: 0,
      lastExecution: now - 7200,
      rewardAmount: 1_000_000, // 1 ALGO
      rewardAssetId: 0,
      adapterAppId: 888002,
      actionParamsHash: new Uint8Array(32),
      status: 2, // Completed
    },
    {
      taskId: 6,
      creator: 'ALGOLIMIT999AAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKK',
      vaultAppId: 999006,
      expiration: now + 86400 * 5, // 5 days
      maxExecutions: 100,
      executionCount: 0,
      recurringInterval: 300, // Every 5 minutes
      lastExecution: 0,
      rewardAmount: 250_000, // 0.25 ALGO
      rewardAssetId: 0,
      adapterAppId: 888004,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 7,
      creator: 'ALGOYIELD123456ABCDEFGHIJKLMNOPQRSTUVWXYZ987',
      vaultAppId: 999007,
      expiration: now + 86400 * 90, // 90 days
      maxExecutions: 0,
      executionCount: 156,
      recurringInterval: 86400, // Daily
      lastExecution: now - 43200,
      rewardAmount: 3_500_000, // 3.5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888005,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 8,
      creator: 'ALGOARB456789GHIJKLMNOPQRSTUVWXYZ123ABCDEFG',
      vaultAppId: 999008,
      expiration: now + 86400, // 1 day
      maxExecutions: 50,
      executionCount: 48,
      recurringInterval: 600, // Every 10 minutes
      lastExecution: now - 300,
      rewardAmount: 500_000, // 0.5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888001,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
  ]
}
