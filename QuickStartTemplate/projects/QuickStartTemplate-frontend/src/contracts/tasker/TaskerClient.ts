/**
 * TaskerClient - Main orchestrator for TaskerOnChain interactions
 *
 * Provides a unified interface for all TaskerOnChain operations with
 * built-in atomic transaction composition and error handling.
 */

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TransactionSigner } from 'algosdk'
import { TaskFactoryHelper } from './TaskFactoryHelper'
import { ExecutorHubHelper } from './ExecutorHubHelper'
import {
  TaskerSystemConfig,
  CreateTaskParams,
  RegisterExecutorParams,
  ExecuteTaskParams,
  FundVaultParams,
  TaskMetadata,
  ExecutorProfile,
  SystemParameters,
} from './types'

/**
 * Main client for interacting with TaskerOnChain smart contracts
 *
 * @example
 * ```ts
 * import { AlgorandClient } from '@algorandfoundation/algokit-utils'
 * import { TaskerClient } from './contracts/tasker/TaskerClient'
 * import { useWallet } from '@txnlab/use-wallet-react'
 *
 * const { transactionSigner, activeAddress } = useWallet()
 * const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
 *
 * const taskerClient = new TaskerClient(algorand, {
 *   taskFactoryAppId: 123456,
 *   executorHubAppId: 123457,
 *   actionRegistryAppId: 123458,
 *   rewardManagerAppId: 123459,
 * })
 *
 * taskerClient.setSigner(transactionSigner, activeAddress)
 *
 * // Create a new task
 * const task = await taskerClient.createTask({
 *   expiration: Math.floor(Date.now() / 1000) + 86400,
 *   maxExecutions: 0,
 *   recurringInterval: 3600,
 *   rewardAmount: 1_000_000,
 *   rewardAssetId: 0,
 *   adapterAppId: tinymanAdapterAppId,
 *   actionParams: encodedParams,
 * })
 * ```
 */
export class TaskerClient {
  private algorand: AlgorandClient
  private config: TaskerSystemConfig
  private signer?: TransactionSigner
  private sender?: string

  // Contract helpers
  public readonly taskFactory: TaskFactoryHelper
  public readonly executorHub: ExecutorHubHelper

  constructor(algorand: AlgorandClient, config: TaskerSystemConfig) {
    this.algorand = algorand
    this.config = config

    // Initialize contract helpers
    this.taskFactory = new TaskFactoryHelper(
      algorand,
      config.taskFactoryAppId
    )

    this.executorHub = new ExecutorHubHelper(
      algorand,
      config.executorHubAppId
    )
  }

  /**
   * Set the transaction signer (from wallet provider)
   *
   * @param signer Transaction signer function
   * @param sender Sender address
   */
  setSigner(signer: TransactionSigner, sender: string) {
    this.signer = signer
    this.sender = sender

    // Update all helpers
    this.taskFactory.setSigner(signer, sender)
    this.executorHub.setSigner(signer, sender)
  }

  // ============================================================================
  // Task Creator Workflows
  // ============================================================================

  /**
   * Create a new automated task
   *
   * High-level method that:
   * 1. Creates the task in TaskFactory
   * 2. Optionally funds the vault
   *
   * @param params Task creation parameters
   * @param fundAmount Optional initial funding amount
   * @returns Task ID and transaction details
   */
  async createTask(params: CreateTaskParams, fundAmount?: number) {
    const result = await this.taskFactory.createTask(params)

    // TODO: If fundAmount provided, send funding transaction to vault

    return result
  }

  /**
   * Cancel an existing task (creator only)
   */
  async cancelTask(taskId: bigint | number) {
    return await this.taskFactory.cancelTask(taskId)
  }

  /**
   * Get task details
   */
  async getTask(taskId: bigint | number): Promise<TaskMetadata> {
    return await this.taskFactory.getTask(taskId)
  }

  /**
   * List all tasks created by current user
   */
  async getMyTasks() {
    if (!this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }
    return await this.taskFactory.getTasksByCreator(this.sender)
  }

  /**
   * Get all active (executable) tasks
   */
  async getActiveTasks() {
    return await this.taskFactory.getActiveTasks()
  }

  // ============================================================================
  // Executor Workflows
  // ============================================================================

  /**
   * Register as an executor
   *
   * @param params Registration parameters including stake amount
   */
  async registerAsExecutor(params: RegisterExecutorParams) {
    return await this.executorHub.registerExecutor(params)
  }

  /**
   * Execute a task (executors only)
   *
   * @param params Execution parameters
   */
  async executeTask(params: ExecuteTaskParams) {
    return await this.executorHub.executeTask(params)
  }

  /**
   * Get executor profile for current user
   */
  async getMyExecutorProfile(): Promise<ExecutorProfile> {
    if (!this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }
    return await this.executorHub.getExecutorProfile(this.sender)
  }

  /**
   * Check if current user is registered as executor
   */
  async isExecutor(): Promise<boolean> {
    if (!this.sender) return false
    return await this.executorHub.isRegistered(this.sender)
  }

  /**
   * Add more stake to executor account
   */
  async addStake(amount: bigint | number) {
    return await this.executorHub.addStake(amount)
  }

  /**
   * Withdraw stake from executor account
   */
  async withdrawStake(amount: bigint | number) {
    return await this.executorHub.withdrawStake(amount)
  }

  // ============================================================================
  // System Information
  // ============================================================================

  /**
   * Get system-wide parameters
   */
  async getSystemParameters(): Promise<SystemParameters> {
    const minStake = await this.executorHub.getMinStake()

    return {
      minStake,
      slashingThreshold: 20, // TODO: Fetch from contract
      slashingPenalty: 10, // TODO: Fetch from contract
      minTaskReward: 100_000, // TODO: Fetch from contract
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const [totalTasks, totalExecutors, totalStaked] = await Promise.all([
      this.taskFactory.getTotalTasks(),
      this.executorHub.getTotalExecutors(),
      this.executorHub.getTotalStaked(),
    ])

    return {
      totalTasks,
      totalExecutors,
      totalStaked,
      activeTasks: (await this.taskFactory.getActiveTasks()).length,
    }
  }

  /**
   * Get contract addresses
   */
  getConfig(): TaskerSystemConfig {
    return { ...this.config }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if a task is ready to execute
   */
  async isTaskExecutable(taskId: bigint | number): Promise<boolean> {
    return await this.taskFactory.isTaskExecutable(taskId)
  }

  /**
   * Calculate estimated reward for executing a task
   */
  async estimateTaskReward(taskId: bigint | number): Promise<number> {
    const task = await this.taskFactory.getTask(taskId)
    return Number(task.rewardAmount)
  }

  /**
   * Get current sender address
   */
  getSender(): string | undefined {
    return this.sender
  }

  /**
   * Get AlgorandClient instance
   */
  getAlgorandClient(): AlgorandClient {
    return this.algorand
  }
}

/**
 * Factory function to create TaskerClient from environment variables
 *
 * @example
 * ```ts
 * const taskerClient = createTaskerClient(algorand)
 * ```
 */
export function createTaskerClient(
  algorand: AlgorandClient,
  config?: Partial<TaskerSystemConfig>
): TaskerClient {
  const defaultConfig: TaskerSystemConfig = {
    taskFactoryAppId:
      config?.taskFactoryAppId ||
      Number(import.meta.env.VITE_TASK_FACTORY_APP_ID) ||
      0,
    executorHubAppId:
      config?.executorHubAppId ||
      Number(import.meta.env.VITE_EXECUTOR_HUB_APP_ID) ||
      0,
    actionRegistryAppId:
      config?.actionRegistryAppId ||
      Number(import.meta.env.VITE_ACTION_REGISTRY_APP_ID) ||
      0,
    rewardManagerAppId:
      config?.rewardManagerAppId ||
      Number(import.meta.env.VITE_REWARD_MANAGER_APP_ID) ||
      0,
  }

  return new TaskerClient(algorand, { ...defaultConfig, ...config })
}
