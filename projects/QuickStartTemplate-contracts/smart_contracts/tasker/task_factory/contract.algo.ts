import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * TaskMetadata structure stored in box storage
 */
class TaskMetadata {
  creator: Address
  vaultAppId: uint64
  expiration: uint64
  maxExecutions: uint64
  executionCount: uint64
  recurringInterval: uint64
  lastExecution: uint64
  rewardAmount: uint64
  rewardAssetId: uint64 // 0 = ALGO
  adapterAppId: uint64
  actionParamsHash: bytes32
  status: uint8 // 0=Active, 1=Executing, 2=Completed, 3=Cancelled

  constructor(
    creator: Address,
    vaultAppId: uint64,
    expiration: uint64,
    maxExecutions: uint64,
    recurringInterval: uint64,
    rewardAmount: uint64,
    rewardAssetId: uint64,
    adapterAppId: uint64,
    actionParamsHash: bytes32
  ) {
    this.creator = creator
    this.vaultAppId = vaultAppId
    this.expiration = expiration
    this.maxExecutions = maxExecutions
    this.executionCount = 0
    this.recurringInterval = recurringInterval
    this.lastExecution = 0
    this.rewardAmount = rewardAmount
    this.rewardAssetId = rewardAssetId
    this.adapterAppId = adapterAppId
    this.actionParamsHash = actionParamsHash
    this.status = 0 // Active
  }
}

/**
 * TaskFactory - Master registry for creating and tracking all tasks
 *
 * This contract serves as the central coordination point for TaskerOnChain.
 * It creates new tasks, stores their metadata in box storage, and coordinates
 * with other system contracts (ExecutorHub, ActionRegistry, RewardManager).
 */
export class TaskFactory extends Contract {
  // Global state
  totalTasks = GlobalStateKey<uint64>({ key: 'total_tasks' })
  executorHubAppId = GlobalStateKey<uint64>({ key: 'executor_hub_app_id' })
  actionRegistryAppId = GlobalStateKey<uint64>({ key: 'action_registry_app_id' })
  rewardManagerAppId = GlobalStateKey<uint64>({ key: 'reward_manager_app_id' })
  admin = GlobalStateKey<Address>({ key: 'admin' })

  /**
   * Initialize the TaskFactory contract
   * Sets up references to other system contracts
   */
  createApplication(
    executorHubAppId: uint64,
    actionRegistryAppId: uint64,
    rewardManagerAppId: uint64
  ): void {
    this.totalTasks.value = 0
    this.executorHubAppId.value = executorHubAppId
    this.actionRegistryAppId.value = actionRegistryAppId
    this.rewardManagerAppId.value = rewardManagerAppId
    this.admin.value = this.txn.sender
  }

  /**
   * Create a new automated task
   *
   * @param expiration - Unix timestamp when task expires
   * @param maxExecutions - Maximum number of times task can execute (0 = unlimited)
   * @param recurringInterval - Seconds between executions (0 = one-time)
   * @param rewardAmount - Amount to pay executor per execution
   * @param rewardAssetId - Asset ID for rewards (0 = ALGO)
   * @param adapterAppId - Application ID of the adapter contract
   * @param actionParams - Encoded parameters for the adapter
   * @returns taskId - Unique identifier for the created task
   */
  createTask(
    expiration: uint64,
    maxExecutions: uint64,
    recurringInterval: uint64,
    rewardAmount: uint64,
    rewardAssetId: uint64,
    adapterAppId: uint64,
    actionParams: bytes
  ): uint64 {
    // Validate inputs
    assert(expiration > globals.latestTimestamp, 'Expiration must be in future')
    assert(rewardAmount > 0, 'Reward must be greater than 0')
    assert(adapterAppId > 0, 'Invalid adapter app ID')

    // TODO: Verify adapter exists in ActionRegistry
    // This would be done via inner transaction call to ActionRegistry

    // Generate new task ID
    const taskId = this.totalTasks.value + 1
    this.totalTasks.value = taskId

    // Hash action parameters for verification
    const actionParamsHash = sha256(actionParams)

    // TODO: Deploy TaskVault contract via inner transaction
    // For now, we'll use a placeholder vault app ID
    // In production, this would create a new TaskVault instance
    const vaultAppId: uint64 = 0 // Placeholder

    // Create task metadata
    const metadata = new TaskMetadata(
      this.txn.sender,
      vaultAppId,
      expiration,
      maxExecutions,
      recurringInterval,
      rewardAmount,
      rewardAssetId,
      adapterAppId,
      actionParamsHash
    )

    // Store in box storage
    const boxKey = 'task_' + itoa(taskId)
    this.boxes.create(boxKey, 256) // Allocate 256 bytes for metadata
    this.boxes.set(boxKey, metadata)

    // Log event (can be read from transaction logs)
    log('TaskCreated:' + itoa(taskId))

    return taskId
  }

  /**
   * Get task metadata
   */
  getTask(taskId: uint64): TaskMetadata {
    const boxKey = 'task_' + itoa(taskId)
    assert(this.boxes.exists(boxKey), 'Task does not exist')
    return this.boxes.get(boxKey) as TaskMetadata
  }

  /**
   * Update task status (called by ExecutorHub during execution)
   */
  updateTaskStatus(taskId: uint64, newStatus: uint8): void {
    // Only ExecutorHub can update status
    assert(this.txn.sender === this.executorHubAppId.value, 'Only ExecutorHub can update status')

    const boxKey = 'task_' + itoa(taskId)
    assert(this.boxes.exists(boxKey), 'Task does not exist')

    const metadata = this.boxes.get(boxKey) as TaskMetadata
    metadata.status = newStatus
    this.boxes.set(boxKey, metadata)
  }

  /**
   * Increment task execution count (called after successful execution)
   */
  incrementExecutionCount(taskId: uint64): void {
    // Only ExecutorHub can increment
    assert(this.txn.sender === this.executorHubAppId.value, 'Only ExecutorHub can increment')

    const boxKey = 'task_' + itoa(taskId)
    assert(this.boxes.exists(boxKey), 'Task does not exist')

    const metadata = this.boxes.get(boxKey) as TaskMetadata
    metadata.executionCount = metadata.executionCount + 1
    metadata.lastExecution = globals.latestTimestamp

    // Check if task should be completed
    if (metadata.maxExecutions > 0 && metadata.executionCount >= metadata.maxExecutions) {
      metadata.status = 2 // Completed
    }

    this.boxes.set(boxKey, metadata)
  }

  /**
   * Cancel a task (only by creator)
   */
  cancelTask(taskId: uint64): void {
    const boxKey = 'task_' + itoa(taskId)
    assert(this.boxes.exists(boxKey), 'Task does not exist')

    const metadata = this.boxes.get(boxKey) as TaskMetadata
    assert(this.txn.sender === metadata.creator, 'Only creator can cancel')
    assert(metadata.status === 0, 'Task is not active')

    metadata.status = 3 // Cancelled
    this.boxes.set(boxKey, metadata)

    log('TaskCancelled:' + itoa(taskId))
  }

  /**
   * Check if task is executable based on conditions
   */
  isTaskExecutable(taskId: uint64): boolean {
    const boxKey = 'task_' + itoa(taskId)
    if (!this.boxes.exists(boxKey)) {
      return false
    }

    const metadata = this.boxes.get(boxKey) as TaskMetadata

    // Check basic conditions
    if (metadata.status !== 0) {
      return false // Not active
    }

    if (metadata.expiration <= globals.latestTimestamp) {
      return false // Expired
    }

    // Check max executions
    if (metadata.maxExecutions > 0 && metadata.executionCount >= metadata.maxExecutions) {
      return false // Max executions reached
    }

    // Check recurring interval
    if (metadata.recurringInterval > 0) {
      const timeSinceLastExecution = globals.latestTimestamp - metadata.lastExecution
      if (timeSinceLastExecution < metadata.recurringInterval) {
        return false // Too soon for next execution
      }
    }

    return true
  }

  /**
   * Get total number of tasks created
   */
  getTotalTasks(): uint64 {
    return this.totalTasks.value
  }

  /**
   * Update system contract references (admin only)
   */
  updateSystemContracts(
    executorHubAppId: uint64,
    actionRegistryAppId: uint64,
    rewardManagerAppId: uint64
  ): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can update')

    this.executorHubAppId.value = executorHubAppId
    this.actionRegistryAppId.value = actionRegistryAppId
    this.rewardManagerAppId.value = rewardManagerAppId
  }

  /**
   * Transfer admin role
   */
  transferAdmin(newAdmin: Address): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can transfer')
    this.admin.value = newAdmin
  }
}
