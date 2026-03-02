/**
 * DashboardPage - User dashboard page with TaskerClient integration
 */

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import UserDashboard from '../components/dashboard/UserDashboard'
import { TaskWithId } from '../components/marketplace/TaskMarketplace'
import { ExecutorProfile } from '../contracts/tasker/types'
import { createTaskerClient } from '../contracts/tasker'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'

export default function DashboardPage() {
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [myTasks, setMyTasks] = useState<TaskWithId[]>([])
  const [executorProfile, setExecutorProfile] = useState<ExecutorProfile>()
  const [isExecutor, setIsExecutor] = useState(false)
  const [loading, setLoading] = useState(true)

  // Redirect if wallet not connected
  useEffect(() => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', {
        variant: 'warning',
      })
      navigate('/app')
    }
  }, [activeAddress, navigate, enqueueSnackbar])

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
      loadDashboardData()
    }
  }, [transactionSigner, activeAddress])

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!activeAddress) return

    setLoading(true)

    try {
      // For demo, use mock data since contracts aren't deployed yet
      const mockTasks = generateMockUserTasks(activeAddress)
      setMyTasks(mockTasks)

      // Mock executor profile
      const mockProfile: ExecutorProfile = {
        stakeAmount: 15_000_000,
        successfulExecutions: 42,
        failedExecutions: 3,
        totalRewardsEarned: 12_500_000,
        reputationScore: 87,
        isSlashed: false,
        registrationTime: Math.floor(Date.now() / 1000) - 30 * 86400,
      }
      setExecutorProfile(mockProfile)
      setIsExecutor(true)

      // TODO: Replace with real data when contracts are deployed
      // const tasks = await taskerClient.getMyTasks()
      // setMyTasks(tasks)

      // const isReg = await taskerClient.isExecutor()
      // setIsExecutor(isReg)

      // if (isReg) {
      //   const profile = await taskerClient.getMyExecutorProfile()
      //   setExecutorProfile(profile)
      // }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [activeAddress, taskerClient, enqueueSnackbar])

  // Create task handler
  const handleCreateTask = async (taskData: any) => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet', { variant: 'warning' })
      return
    }

    try {
      enqueueSnackbar('Creating task...', { variant: 'info' })

      // TODO: Implement actual creation when contracts are deployed
      // const result = await taskerClient.createTask(taskData)

      // For demo, simulate creation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      enqueueSnackbar('Task created successfully!', { variant: 'success' })

      // Refresh tasks
      await loadDashboardData()
    } catch (error: any) {
      console.error('Failed to create task:', error)
      enqueueSnackbar(`Failed to create task: ${error.message}`, {
        variant: 'error',
      })
    }
  }

  // Cancel task handler
  const handleCancelTask = async (taskId: number) => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet', { variant: 'warning' })
      return
    }

    try {
      enqueueSnackbar(`Canceling task ${taskId}...`, { variant: 'info' })

      // TODO: Implement actual cancellation when contracts are deployed
      // await taskerClient.cancelTask(taskId)

      // For demo, simulate cancellation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      enqueueSnackbar(`Task ${taskId} cancelled successfully!`, {
        variant: 'success',
      })

      // Refresh tasks
      await loadDashboardData()
    } catch (error: any) {
      console.error('Failed to cancel task:', error)
      enqueueSnackbar(`Failed to cancel task: ${error.message}`, {
        variant: 'error',
      })
    }
  }

  if (!activeAddress) {
    return null
  }

  return (
    <UserDashboard
      userAddress={activeAddress}
      myTasks={myTasks}
      executorProfile={executorProfile}
      isExecutor={isExecutor}
      onCreateTask={handleCreateTask}
      onCancelTask={handleCancelTask}
      onRefresh={loadDashboardData}
      loading={loading}
    />
  )
}

// Mock data generator for demonstration
function generateMockUserTasks(userAddress: string): TaskWithId[] {
  const now = Math.floor(Date.now() / 1000)

  return [
    {
      taskId: 101,
      creator: userAddress,
      vaultAppId: 999101,
      expiration: now + 86400 * 14, // 14 days
      maxExecutions: 20,
      executionCount: 8,
      recurringInterval: 3600, // Every hour
      lastExecution: now - 1800,
      rewardAmount: 1_200_000, // 1.2 ALGO
      rewardAssetId: 0,
      adapterAppId: 888001,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 102,
      creator: userAddress,
      vaultAppId: 999102,
      expiration: now + 86400 * 30, // 30 days
      maxExecutions: 0, // Unlimited
      executionCount: 156,
      recurringInterval: 7200, // Every 2 hours
      lastExecution: now - 3600,
      rewardAmount: 750_000, // 0.75 ALGO
      rewardAssetId: 0,
      adapterAppId: 888002,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 103,
      creator: userAddress,
      vaultAppId: 999103,
      expiration: now + 86400 * 7, // 7 days
      maxExecutions: 1,
      executionCount: 0,
      recurringInterval: 0, // One-time
      lastExecution: 0,
      rewardAmount: 5_000_000, // 5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888003,
      actionParamsHash: new Uint8Array(32),
      status: 0, // Active
    },
    {
      taskId: 104,
      creator: userAddress,
      vaultAppId: 999104,
      expiration: now - 7200, // Expired 2 hours ago
      maxExecutions: 10,
      executionCount: 10,
      recurringInterval: 1800, // Every 30 minutes
      lastExecution: now - 7200,
      rewardAmount: 500_000, // 0.5 ALGO
      rewardAssetId: 0,
      adapterAppId: 888001,
      actionParamsHash: new Uint8Array(32),
      status: 2, // Completed
    },
  ]
}
