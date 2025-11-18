import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * ExecutionResult returned after task execution
 */
class ExecutionResult {
  success: boolean
  resultData: bytes
  gasUsed: uint64

  constructor(success: boolean, resultData: bytes, gasUsed: uint64) {
    this.success = success
    this.resultData = resultData
    this.gasUsed = gasUsed
  }
}

/**
 * ExecutorHub - Manages executor registration, staking, and reputation
 *
 * This contract handles:
 * - Executor registration with stake requirements
 * - Task execution coordination using atomic transactions
 * - Reputation tracking and rewards
 * - Slashing for malicious/failed executions
 */
export class ExecutorHub extends Contract {
  // Global state
  minStake = GlobalStateKey<uint64>({ key: 'min_stake' })
  totalExecutors = GlobalStateKey<uint64>({ key: 'total_executors' })
  totalStaked = GlobalStateKey<uint64>({ key: 'total_staked' })
  taskFactoryAppId = GlobalStateKey<uint64>({ key: 'task_factory_app_id' })
  rewardManagerAppId = GlobalStateKey<uint64>({ key: 'reward_manager_app_id' })
  admin = GlobalStateKey<Address>({ key: 'admin' })

  // Reputation thresholds
  slashingThreshold = GlobalStateKey<uint64>({ key: 'slashing_threshold' }) // Failure rate % that triggers slashing
  slashingPenalty = GlobalStateKey<uint64>({ key: 'slashing_penalty' }) // % of stake to slash

  // Local state (per executor)
  stakeAmount = LocalStateKey<uint64>({ key: 'stake' })
  successfulExecutions = LocalStateKey<uint64>({ key: 'success' })
  failedExecutions = LocalStateKey<uint64>({ key: 'failed' })
  totalRewardsEarned = LocalStateKey<uint64>({ key: 'rewards' })
  reputationScore = LocalStateKey<uint64>({ key: 'reputation' })
  isSlashed = LocalStateKey<boolean>({ key: 'slashed' })
  registrationTime = LocalStateKey<uint64>({ key: 'reg_time' })

  /**
   * Initialize the ExecutorHub contract
   */
  createApplication(minStakeAmount: uint64, taskFactoryAppId: uint64, rewardManagerAppId: uint64): void {
    this.minStake.value = minStakeAmount
    this.totalExecutors.value = 0
    this.totalStaked.value = 0
    this.taskFactoryAppId.value = taskFactoryAppId
    this.rewardManagerAppId.value = rewardManagerAppId
    this.admin.value = this.txn.sender
    this.slashingThreshold.value = 20 // 20% failure rate triggers slashing
    this.slashingPenalty.value = 10 // 10% stake slashed
  }

  /**
   * Register as an executor by staking ALGO
   * Requires payment transaction in atomic group
   */
  registerExecutor(stakeTxn: PayTxn): void {
    // Verify stake payment
    verifyPayTxn(stakeTxn, {
      receiver: this.app.address,
      amount: { greaterThanEqualTo: this.minStake.value },
    })

    // Verify executor hasn't already registered
    assert(!this.stakeAmount(this.txn.sender).exists, 'Already registered')

    // Initialize executor local state
    this.stakeAmount(this.txn.sender).value = stakeTxn.amount
    this.successfulExecutions(this.txn.sender).value = 0
    this.failedExecutions(this.txn.sender).value = 0
    this.totalRewardsEarned(this.txn.sender).value = 0
    this.reputationScore(this.txn.sender).value = 100 // Start with neutral reputation
    this.isSlashed(this.txn.sender).value = false
    this.registrationTime(this.txn.sender).value = globals.latestTimestamp

    // Update global counters
    this.totalExecutors.value = this.totalExecutors.value + 1
    this.totalStaked.value = this.totalStaked.value + stakeTxn.amount

    log('ExecutorRegistered:' + this.txn.sender)
  }

  /**
   * Add more stake to existing executor account
   */
  addStake(stakeTxn: PayTxn): void {
    verifyPayTxn(stakeTxn, {
      receiver: this.app.address,
    })

    assert(this.stakeAmount(this.txn.sender).exists, 'Not registered')
    assert(!this.isSlashed(this.txn.sender).value, 'Executor is slashed')

    this.stakeAmount(this.txn.sender).value = this.stakeAmount(this.txn.sender).value + stakeTxn.amount
    this.totalStaked.value = this.totalStaked.value + stakeTxn.amount
  }

  /**
   * Withdraw stake (only if no slashing and sufficient cooldown)
   */
  withdrawStake(amount: uint64): void {
    assert(this.stakeAmount(this.txn.sender).exists, 'Not registered')
    assert(!this.isSlashed(this.txn.sender).value, 'Cannot withdraw while slashed')

    const currentStake = this.stakeAmount(this.txn.sender).value
    assert(amount <= currentStake, 'Insufficient stake')

    // Ensure minimum stake remains
    const remainingStake = currentStake - amount
    assert(remainingStake >= this.minStake.value, 'Must maintain minimum stake')

    // Send stake back to executor
    sendPayment({
      receiver: this.txn.sender,
      amount: amount,
    })

    this.stakeAmount(this.txn.sender).value = remainingStake
    this.totalStaked.value = this.totalStaked.value - amount

    log('StakeWithdrawn:' + itoa(amount))
  }

  /**
   * Execute a task - Main entry point for task execution
   * This orchestrates the entire execution flow using atomic transactions
   */
  executeTask(taskId: uint64, actionParams: bytes): ExecutionResult {
    // Verify executor is registered and not slashed
    assert(this.stakeAmount(this.txn.sender).exists, 'Not registered')
    assert(!this.isSlashed(this.txn.sender).value, 'Executor is slashed')

    // Get task metadata from TaskFactory via inner transaction call
    // TODO: Implement inner transaction to call TaskFactory.getTask()
    // For now, we'll assume task is valid

    // TODO: Call ActionRegistry to verify adapter
    // TODO: Call Adapter.canExecute() to check conditions
    // TODO: If canExecute returns true, call TaskVault.executeAction()
    // TODO: Call RewardManager to calculate and distribute rewards

    // Placeholder execution result
    const result = new ExecutionResult(true, 'executed', 1000)

    // Update executor stats
    if (result.success) {
      this.successfulExecutions(this.txn.sender).value =
        this.successfulExecutions(this.txn.sender).value + 1
      this.updateReputation(this.txn.sender)
    } else {
      this.failedExecutions(this.txn.sender).value = this.failedExecutions(this.txn.sender).value + 1
      this.updateReputation(this.txn.sender)
      this.checkAndSlash(this.txn.sender)
    }

    return result
  }

  /**
   * Update executor reputation based on success/failure ratio
   */
  private updateReputation(executor: Address): void {
    const successful = this.successfulExecutions(executor).value
    const failed = this.failedExecutions(executor).value
    const total = successful + failed

    if (total === 0) {
      this.reputationScore(executor).value = 100
      return
    }

    // Reputation = (successful / total) * 100
    const reputation = (successful * 100) / total
    this.reputationScore(executor).value = reputation
  }

  /**
   * Check if executor should be slashed based on failure rate
   */
  private checkAndSlash(executor: Address): void {
    const successful = this.successfulExecutions(executor).value
    const failed = this.failedExecutions(executor).value
    const total = successful + failed

    // Only check after minimum executions
    if (total < 10) {
      return
    }

    const failureRate = (failed * 100) / total

    if (failureRate > this.slashingThreshold.value) {
      this.slashExecutor(executor, 'High failure rate')
    }
  }

  /**
   * Slash an executor's stake as penalty
   */
  private slashExecutor(executor: Address, reason: string): void {
    if (this.isSlashed(executor).value) {
      return // Already slashed
    }

    const stake = this.stakeAmount(executor).value
    const slashAmount = (stake * this.slashingPenalty.value) / 100

    // Transfer slashed amount to admin (protocol treasury)
    sendPayment({
      receiver: this.admin.value,
      amount: slashAmount,
    })

    // Update executor state
    this.stakeAmount(executor).value = stake - slashAmount
    this.isSlashed(executor).value = true
    this.totalStaked.value = this.totalStaked.value - slashAmount

    log('ExecutorSlashed:' + executor + ':' + reason)
  }

  /**
   * Get reputation multiplier for rewards (100-120)
   * Higher reputation = higher multiplier
   */
  getReputationMultiplier(executor: Address): uint64 {
    if (!this.stakeAmount(executor).exists) {
      return 100
    }

    const reputation = this.reputationScore(executor).value
    // Multiplier = 100 + (reputation / 10)
    // Max 120 (20% bonus) for 100% success rate
    return 100 + reputation / 10
  }

  /**
   * Reinstate a slashed executor (admin only, after review)
   */
  reinstateExecutor(executor: Address): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can reinstate')
    this.isSlashed(executor).value = false
    log('ExecutorReinstated:' + executor)
  }

  /**
   * Get executor statistics
   */
  getExecutorStats(executor: Address): {
    stake: uint64
    successful: uint64
    failed: uint64
    rewards: uint64
    reputation: uint64
    slashed: boolean
  } {
    return {
      stake: this.stakeAmount(executor).value,
      successful: this.successfulExecutions(executor).value,
      failed: this.failedExecutions(executor).value,
      rewards: this.totalRewardsEarned(executor).value,
      reputation: this.reputationScore(executor).value,
      slashed: this.isSlashed(executor).value,
    }
  }

  /**
   * Update minimum stake requirement (admin only)
   */
  updateMinStake(newMinStake: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.minStake.value = newMinStake
  }

  /**
   * Update slashing parameters (admin only)
   */
  updateSlashingParams(threshold: uint64, penalty: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    assert(threshold > 0 && threshold <= 100, 'Invalid threshold')
    assert(penalty > 0 && penalty <= 50, 'Invalid penalty')

    this.slashingThreshold.value = threshold
    this.slashingPenalty.value = penalty
  }

  /**
   * Opt into local state (required before using)
   */
  optIn(): void {
    // Executor can opt-in without staking first
    // Actual staking happens in registerExecutor
    log('ExecutorOptedIn:' + this.txn.sender)
  }
}
