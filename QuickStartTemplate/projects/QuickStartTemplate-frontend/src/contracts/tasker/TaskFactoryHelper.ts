/**
 * TaskFactoryHelper - Frontend helper for TaskFactory contract interactions
 *
 * Provides type-safe methods for creating, querying, and managing tasks
 */

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TransactionSigner, encodeUint64, makeApplicationCallTxnFromObject, OnApplicationComplete } from 'algosdk'
import {
  TaskMetadata,
  CreateTaskParams,
  CreateTaskResult,
  ContractCallResult,
  TaskStatus,
} from './types'

export class TaskFactoryHelper {
  private algorand: AlgorandClient
  private appId: bigint | number
  private signer?: TransactionSigner
  private sender?: string

  constructor(
    algorand: AlgorandClient,
    appId: bigint | number,
    signer?: TransactionSigner,
    sender?: string
  ) {
    this.algorand = algorand
    this.appId = appId
    this.signer = signer
    this.sender = sender
  }

  /**
   * Set the transaction signer (e.g., from wallet)
   */
  setSigner(signer: TransactionSigner, sender: string) {
    this.signer = signer
    this.sender = sender
  }

  /**
   * Create a new automated task
   *
   * @param params Task creation parameters
   * @returns Task ID and vault app ID
   *
   * @example
   * ```ts
   * const result = await taskFactory.createTask({
   *   expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
   *   maxExecutions: 10,
   *   recurringInterval: 3600, // Every hour
   *   rewardAmount: 1000000, // 1 ALGO
   *   rewardAssetId: 0,
   *   adapterAppId: tinymanAdapterAppId,
   *   actionParams: encodedParams,
   * })
   * console.log('Created task:', result.taskId)
   * ```
   */
  async createTask(
    params: CreateTaskParams
  ): Promise<ContractCallResult<CreateTaskResult>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    // Encode ABI method call
    const appArgs = [
      new Uint8Array(Buffer.from('createTask')),
      encodeUint64(Number(params.expiration)),
      encodeUint64(Number(params.maxExecutions)),
      encodeUint64(Number(params.recurringInterval)),
      encodeUint64(Number(params.rewardAmount)),
      encodeUint64(Number(params.rewardAssetId)),
      encodeUint64(Number(params.adapterAppId)),
      params.actionParams,
    ]

    const suggestedParams = await this.algorand.client.algod.getTransactionParams().do()

    const txn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs,
      suggestedParams,
    })

    // Sign and send
    const signedTxn = await this.signer([txn], [0])
    const { txId } = await this.algorand.client.algod.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    const result = await this.algorand.client.algod.pendingTransactionInformation(txId).do()

    // Extract task ID from logs
    const logs = result['logs'] || []
    const taskIdLog = logs.find((log: string) =>
      Buffer.from(log, 'base64').toString().startsWith('TaskCreated:')
    )

    if (!taskIdLog) {
      throw new Error('Task ID not found in transaction logs')
    }

    const taskId = parseInt(
      Buffer.from(taskIdLog, 'base64').toString().split(':')[1]
    )

    return {
      result: {
        taskId,
        vaultAppId: 0, // TODO: Extract from logs once vault deployment is implemented
        transactionId: txId,
      },
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Get task metadata by ID
   *
   * @param taskId Task identifier
   * @returns Task metadata
   *
   * @example
   * ```ts
   * const task = await taskFactory.getTask(1)
   * console.log('Task creator:', task.creator)
   * console.log('Reward:', task.rewardAmount)
   * console.log('Status:', TaskStatus[task.status])
   * ```
   */
  async getTask(taskId: bigint | number): Promise<TaskMetadata> {
    // Read from box storage
    const boxName = `task_${taskId}`
    const boxValue = await this.algorand.client.algod
      .getApplicationBoxByName(Number(this.appId), Buffer.from(boxName))
      .do()

    // Decode box value (simplified - in production, use proper ABI decoding)
    const data = boxValue.value

    // Parse the box data structure
    // Note: This is a simplified parser. In production, use proper ABI codec
    return {
      creator: '', // Parse from data
      vaultAppId: 0,
      expiration: 0,
      maxExecutions: 0,
      executionCount: 0,
      recurringInterval: 0,
      lastExecution: 0,
      rewardAmount: 0,
      rewardAssetId: 0,
      adapterAppId: 0,
      actionParamsHash: new Uint8Array(),
      status: TaskStatus.Active,
    }
  }

  /**
   * Cancel an active task (creator only)
   *
   * @param taskId Task to cancel
   * @returns Transaction ID
   *
   * @example
   * ```ts
   * const result = await taskFactory.cancelTask(1)
   * console.log('Task cancelled:', result.transactionId)
   * ```
   */
  async cancelTask(taskId: bigint | number): Promise<ContractCallResult<void>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    const appArgs = [
      new Uint8Array(Buffer.from('cancelTask')),
      encodeUint64(Number(taskId)),
    ]

    const suggestedParams = await this.algorand.client.algod.getTransactionParams().do()

    const txn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs,
      suggestedParams,
    })

    const signedTxn = await this.signer([txn], [0])
    const { txId } = await this.algorand.client.algod.sendRawTransaction(signedTxn).do()

    const result = await this.algorand.client.algod.pendingTransactionInformation(txId).do()

    return {
      result: undefined as void,
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Check if a task is executable
   *
   * @param taskId Task to check
   * @returns Whether task can be executed
   *
   * @example
   * ```ts
   * if (await taskFactory.isTaskExecutable(1)) {
   *   console.log('Task is ready to execute')
   * }
   * ```
   */
  async isTaskExecutable(taskId: bigint | number): Promise<boolean> {
    const task = await this.getTask(taskId)

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (Number(task.expiration) < now) {
      return false
    }

    // Check status
    if (task.status !== TaskStatus.Active) {
      return false
    }

    // Check max executions
    if (
      Number(task.maxExecutions) > 0 &&
      Number(task.executionCount) >= Number(task.maxExecutions)
    ) {
      return false
    }

    // Check recurring interval
    if (Number(task.recurringInterval) > 0) {
      const timeSinceLastExecution = now - Number(task.lastExecution)
      if (timeSinceLastExecution < Number(task.recurringInterval)) {
        return false
      }
    }

    return true
  }

  /**
   * Get total number of tasks created
   *
   * @returns Total task count
   */
  async getTotalTasks(): Promise<number> {
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()

    const globalState = appInfo.params['global-state'] || []
    const totalTasksKey = Buffer.from('total_tasks').toString('base64')

    const totalTasksState = globalState.find(
      (kv: any) => kv.key === totalTasksKey
    )

    return totalTasksState ? totalTasksState.value.uint : 0
  }

  /**
   * List all tasks (paginated)
   *
   * @param offset Starting index
   * @param limit Maximum number of tasks to return
   * @returns Array of task metadata
   *
   * @example
   * ```ts
   * const tasks = await taskFactory.listTasks(0, 10)
   * tasks.forEach(task => {
   *   console.log(`Task ${task.taskId}:`, task.creator)
   * })
   * ```
   */
  async listTasks(
    offset: number = 0,
    limit: number = 10
  ): Promise<(TaskMetadata & { taskId: number })[]> {
    const total = await this.getTotalTasks()
    const tasks: (TaskMetadata & { taskId: number })[] = []

    const end = Math.min(offset + limit, total)

    for (let i = offset + 1; i <= end; i++) {
      try {
        const task = await this.getTask(i)
        tasks.push({ ...task, taskId: i })
      } catch (error) {
        // Task might not exist or be deleted
        console.warn(`Failed to fetch task ${i}:`, error)
      }
    }

    return tasks
  }

  /**
   * Get tasks created by a specific address
   *
   * @param creator Algorand address
   * @returns Array of tasks created by the address
   */
  async getTasksByCreator(creator: string): Promise<(TaskMetadata & { taskId: number })[]> {
    const allTasks = await this.listTasks(0, 1000) // TODO: Implement proper pagination
    return allTasks.filter((task) => task.creator === creator)
  }

  /**
   * Get active tasks (not completed or cancelled)
   *
   * @returns Array of active tasks
   */
  async getActiveTasks(): Promise<(TaskMetadata & { taskId: number })[]> {
    const allTasks = await this.listTasks(0, 1000)
    return allTasks.filter((task) => task.status === TaskStatus.Active)
  }

  /**
   * Get app ID
   */
  getAppId(): bigint | number {
    return this.appId
  }

  /**
   * Get app address
   */
  async getAppAddress(): Promise<string> {
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()
    return appInfo.params['creator']
  }
}
