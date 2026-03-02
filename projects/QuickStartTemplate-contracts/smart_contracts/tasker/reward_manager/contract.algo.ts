import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * RewardCalculation result
 */
class RewardCalculation {
  totalReward: uint64
  baseReward: uint64
  gasReimbursement: uint64
  reputationBonus: uint64

  constructor(total: uint64, base: uint64, gas: uint64, reputation: uint64) {
    this.totalReward = total
    this.baseReward = base
    this.gasReimbursement = gas
    this.reputationBonus = reputation
  }
}

/**
 * RewardManager - Calculates and tracks executor rewards
 *
 * This contract handles:
 * - Reward calculation (base + gas + reputation bonus)
 * - Reward distribution tracking
 * - Protocol fee collection (optional)
 * - Reward statistics
 */
export class RewardManager extends Contract {
  // Global state
  baseGasPrice = GlobalStateKey<uint64>({ key: 'gas_price' }) // microAlgos per unit gas
  reputationBonusEnabled = GlobalStateKey<boolean>({ key: 'reputation_bonus' })
  protocolFeePercent = GlobalStateKey<uint64>({ key: 'protocol_fee' }) // Basis points (100 = 1%)
  admin = GlobalStateKey<Address>({ key: 'admin' })
  protocolTreasury = GlobalStateKey<Address>({ key: 'treasury' })

  // Statistics
  totalRewardsDistributed = GlobalStateKey<uint64>({ key: 'total_rewards' })
  totalProtocolFees = GlobalStateKey<uint64>({ key: 'total_fees' })
  totalExecutions = GlobalStateKey<uint64>({ key: 'total_executions' })

  // Box storage for per-executor lifetime rewards
  // Key: executor_address → Value: total rewards earned

  /**
   * Initialize the RewardManager
   */
  createApplication(gasPrice: uint64, protocolFee: uint64, treasuryAddress: Address): void {
    this.baseGasPrice.value = gasPrice
    this.reputationBonusEnabled.value = true
    this.protocolFeePercent.value = protocolFee
    this.admin.value = this.txn.sender
    this.protocolTreasury.value = treasuryAddress
    this.totalRewardsDistributed.value = 0
    this.totalProtocolFees.value = 0
    this.totalExecutions.value = 0
  }

  /**
   * Calculate total reward for a task execution
   *
   * Formula:
   * - Base Reward: Task's configured reward amount
   * - Gas Reimbursement: gasUsed * baseGasPrice
   * - Reputation Bonus: baseReward * (reputationMultiplier - 100) / 100
   * - Total: baseReward + gasReimbursement + reputationBonus
   *
   * @param taskReward - Base reward configured for the task
   * @param gasUsed - Estimated gas units used for execution
   * @param executorReputation - Executor's reputation multiplier (100-120)
   * @returns RewardCalculation breakdown
   */
  calculateReward(
    taskReward: uint64,
    gasUsed: uint64,
    executorReputation: uint64
  ): RewardCalculation {
    // Calculate gas reimbursement
    const gasReimbursement = gasUsed * this.baseGasPrice.value

    // Calculate reputation bonus if enabled
    let reputationBonus: uint64 = 0
    if (this.reputationBonusEnabled.value) {
      // executorReputation is 100-120 (representing 100%-120%)
      // Bonus = baseReward * (reputation - 100) / 100
      if (executorReputation > 100) {
        const bonusPercent = executorReputation - 100
        reputationBonus = (taskReward * bonusPercent) / 100
      }
    }

    // Calculate total reward before protocol fee
    const totalBeforeFee = taskReward + gasReimbursement + reputationBonus

    // Deduct protocol fee if configured
    let protocolFee: uint64 = 0
    if (this.protocolFeePercent.value > 0) {
      protocolFee = (totalBeforeFee * this.protocolFeePercent.value) / 10000 // Basis points
    }

    const totalReward = totalBeforeFee - protocolFee

    return new RewardCalculation(totalReward, taskReward, gasReimbursement, reputationBonus)
  }

  /**
   * Record reward distribution (called by TaskVault after sending reward)
   *
   * @param executorAddress - Address of executor receiving reward
   * @param taskId - ID of task that was executed
   * @param rewardAmount - Amount of reward distributed
   * @param assetId - Asset ID (0 = ALGO)
   */
  recordRewardDistribution(
    executorAddress: Address,
    taskId: uint64,
    rewardAmount: uint64,
    assetId: uint64
  ): void {
    // Only TaskVault contracts can record distributions
    // TODO: Verify caller is a valid TaskVault

    // Update global statistics
    this.totalRewardsDistributed.value = this.totalRewardsDistributed.value + rewardAmount
    this.totalExecutions.value = this.totalExecutions.value + 1

    // Update executor's lifetime rewards in box storage
    const boxKey = 'executor_' + executorAddress
    if (this.boxes.exists(boxKey)) {
      const currentRewards = btoi(this.boxes.get(boxKey))
      this.boxes.set(boxKey, itob(currentRewards + rewardAmount))
    } else {
      this.boxes.create(boxKey, 8) // 8 bytes for uint64
      this.boxes.set(boxKey, itob(rewardAmount))
    }

    log('RewardDistributed:' + executorAddress + ':' + itoa(rewardAmount))
  }

  /**
   * Collect protocol fee (called by TaskVault during reward distribution)
   */
  collectProtocolFee(paymentTxn: PayTxn): void {
    verifyPayTxn(paymentTxn, {
      receiver: this.protocolTreasury.value,
    })

    this.totalProtocolFees.value = this.totalProtocolFees.value + paymentTxn.amount
  }

  /**
   * Get executor's lifetime rewards
   */
  getExecutorLifetimeRewards(executorAddress: Address): uint64 {
    const boxKey = 'executor_' + executorAddress
    if (this.boxes.exists(boxKey)) {
      return btoi(this.boxes.get(boxKey))
    }
    return 0
  }

  /**
   * Get global reward statistics
   */
  getGlobalStats(): {
    totalRewards: uint64
    totalFees: uint64
    totalExecutions: uint64
    avgRewardPerExecution: uint64
  } {
    let avgReward: uint64 = 0
    if (this.totalExecutions.value > 0) {
      avgReward = this.totalRewardsDistributed.value / this.totalExecutions.value
    }

    return {
      totalRewards: this.totalRewardsDistributed.value,
      totalFees: this.totalProtocolFees.value,
      totalExecutions: this.totalExecutions.value,
      avgRewardPerExecution: avgReward,
    }
  }

  /**
   * Update gas price (admin only)
   */
  updateGasPrice(newGasPrice: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.baseGasPrice.value = newGasPrice
    log('GasPriceUpdated:' + itoa(newGasPrice))
  }

  /**
   * Update protocol fee (admin only)
   * @param newFeePercent - Fee in basis points (100 = 1%, max 1000 = 10%)
   */
  updateProtocolFee(newFeePercent: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    assert(newFeePercent <= 1000, 'Fee too high') // Max 10%
    this.protocolFeePercent.value = newFeePercent
    log('ProtocolFeeUpdated:' + itoa(newFeePercent))
  }

  /**
   * Toggle reputation bonus (admin only)
   */
  toggleReputationBonus(enabled: boolean): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.reputationBonusEnabled.value = enabled
  }

  /**
   * Update treasury address (admin only)
   */
  updateTreasury(newTreasury: Address): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.protocolTreasury.value = newTreasury
  }

  /**
   * Transfer admin role
   */
  transferAdmin(newAdmin: Address): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.admin.value = newAdmin
  }
}
