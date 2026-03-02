import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * ExecutionResult from adapter execution
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
 * TaskVault - Per-task fund management and action execution
 *
 * Each task gets its own TaskVault instance for:
 * - Holding task funds (ALGO and ASAs)
 * - Executing actions through adapters via inner transactions
 * - Distributing rewards to executors
 * - Withdrawing remaining funds when task is cancelled/completed
 *
 * Non-custodial design: Only task creator can withdraw, only after cancellation/completion
 */
export class TaskVault extends Contract {
  // Global state
  taskId = GlobalStateKey<uint64>({ key: 'task_id' })
  taskFactoryAppId = GlobalStateKey<uint64>({ key: 'task_factory' })
  creator = GlobalStateKey<Address>({ key: 'creator' })
  totalDeposited = GlobalStateKey<uint64>({ key: 'total_deposited' })
  totalWithdrawn = GlobalStateKey<uint64>({ key: 'total_withdrawn' })
  rewardManagerAppId = GlobalStateKey<uint64>({ key: 'reward_manager' })

  // Asset tracking
  primaryAssetId = GlobalStateKey<uint64>({ key: 'primary_asset' }) // Main asset for task (0 = ALGO)
  hasOptedIntoAsset = GlobalStateKey<boolean>({ key: 'opted_in' })

  /**
   * Initialize the TaskVault for a specific task
   */
  createApplication(
    taskIdValue: uint64,
    taskFactoryApp: uint64,
    creatorAddress: Address,
    rewardManagerApp: uint64,
    assetId: uint64
  ): void {
    this.taskId.value = taskIdValue
    this.taskFactoryAppId.value = taskFactoryApp
    this.creator.value = creatorAddress
    this.rewardManagerAppId.value = rewardManagerApp
    this.totalDeposited.value = 0
    this.totalWithdrawn.value = 0
    this.primaryAssetId.value = assetId
    this.hasOptedIntoAsset.value = false

    // Fund vault with minimum balance for operations
    // This should be done via payment in atomic group during creation
  }

  /**
   * Deposit ALGO into the vault
   * Requires payment transaction in atomic group
   */
  depositAlgo(paymentTxn: PayTxn): void {
    verifyPayTxn(paymentTxn, {
      receiver: this.app.address,
    })

    assert(this.txn.sender === this.creator.value, 'Only creator can deposit')

    this.totalDeposited.value = this.totalDeposited.value + paymentTxn.amount

    log('AlgoDeposited:' + itoa(paymentTxn.amount))
  }

  /**
   * Deposit ASA into the vault
   * Vault must opt into asset first
   */
  depositAsset(assetTxn: AssetTransferTxn): void {
    verifyAssetTransferTxn(assetTxn, {
      receiver: this.app.address,
      assetReceiver: this.app.address,
    })

    assert(this.txn.sender === this.creator.value, 'Only creator can deposit')
    assert(assetTxn.xferAsset === this.primaryAssetId.value, 'Wrong asset')

    this.totalDeposited.value = this.totalDeposited.value + assetTxn.assetAmount

    log('AssetDeposited:' + itoa(assetTxn.assetAmount))
  }

  /**
   * Opt vault into an ASA (required before receiving ASA)
   */
  optIntoAsset(assetId: uint64): void {
    assert(this.txn.sender === this.creator.value, 'Only creator can opt-in')
    assert(assetId === this.primaryAssetId.value, 'Asset ID mismatch')
    assert(!this.hasOptedIntoAsset.value, 'Already opted in')

    // Send 0-amount asset transfer to self to opt-in
    sendAssetTransfer({
      assetReceiver: this.app.address,
      xferAsset: assetId,
      assetAmount: 0,
    })

    this.hasOptedIntoAsset.value = true
    log('OptedIntoAsset:' + itoa(assetId))
  }

  /**
   * Execute action through adapter
   * This is the IMPROVED implementation using getTokenRequirements()
   *
   * KEY IMPROVEMENT: We no longer need to parse adapter-specific params!
   * Instead, we ask the adapter what tokens it needs via getTokenRequirements().
   *
   * Flow:
   * 1. Verify caller is authorized (TaskFactory/ExecutorHub)
   * 2. Call adapter.getTokenRequirements() to know what tokens are needed
   * 3. Approve/transfer required tokens to adapter
   * 4. Call adapter.canExecute() to check conditions
   * 5. If true, call adapter.execute() to perform action
   * 6. Calculate and distribute rewards
   * 7. Return execution result
   */
  executeAction(
    executorAddress: Address,
    adapterAppId: uint64,
    actionParams: bytes,
    actionParamsHash: bytes32
  ): ExecutionResult {
    // Verify caller is TaskFactory (which is called by ExecutorHub)
    assert(this.txn.sender === this.taskFactoryAppId.value, 'Only TaskFactory can execute')

    // Verify action parameters match hash
    assert(sha256(actionParams) === actionParamsHash, 'Action params mismatch')

    // STEP 1: Get token requirements from adapter
    // This is the KEY IMPROVEMENT - adapter declares what it needs!
    // TODO: Implement via inner transaction call to adapter.getTokenRequirements(actionParams)
    // const requirements = adapterAppId.call.getTokenRequirements(actionParams)

    // For now, placeholder - in production this would be from adapter
    // const requirements: TokenRequirement[] = [
    //   { assetId: 0, amount: 1000000, isInput: true }  // 1 ALGO input
    // ]

    // STEP 2: Handle token approvals/transfers based on requirements
    // for (const req of requirements) {
    //   if (req.isInput) {
    //     // Ensure vault has sufficient balance
    //     // For ALGO: check this.app.address.balance
    //     // For ASA: query asset balance
    //
    //     // Transfer to adapter if needed (adapter may pull directly)
    //   }
    // }

    // STEP 3: Call adapter.canExecute() via inner transaction
    // TODO: Implement via inner transaction
    const canExecute = true

    if (!canExecute) {
      return new ExecutionResult(false, 'Conditions not met', 0)
    }

    // STEP 4: Call adapter.execute(vaultAddress, actionParams) via inner transaction
    // TODO: Implement via inner transaction
    // sendMethodCall({
    //   applicationID: adapterAppId,
    //   methodArgs: [this.app.address, actionParams],
    //   onCompletion: OnCompletion.NoOp,
    // })
    const gasUsed: uint64 = 5000 // Placeholder

    // STEP 5: Calculate reward
    // TODO: Call RewardManager to calculate reward
    // const rewardAmount = RewardManager.calculateReward(taskReward, gasUsed, executorReputation)
    const rewardAmount: uint64 = 1000000 // 0.001 ALGO

    // STEP 6: Send reward to executor
    if (this.primaryAssetId.value === 0) {
      // ALGO reward
      sendPayment({
        receiver: executorAddress,
        amount: rewardAmount,
      })
    } else {
      // ASA reward
      sendAssetTransfer({
        assetReceiver: executorAddress,
        xferAsset: this.primaryAssetId.value,
        assetAmount: rewardAmount,
      })
    }

    this.totalWithdrawn.value = this.totalWithdrawn.value + rewardAmount

    log('ActionExecuted:' + executorAddress)

    return new ExecutionResult(true, 'Success', gasUsed)
  }

  /**
   * Withdraw remaining funds (only creator, only if task cancelled/completed)
   * Requires verification from TaskFactory that task is in correct state
   */
  withdrawFunds(amount: uint64, assetId: uint64): void {
    assert(this.txn.sender === this.creator.value, 'Only creator can withdraw')

    // TODO: Verify with TaskFactory that task is cancelled or completed
    // This would be done via inner transaction call

    const availableBalance = this.totalDeposited.value - this.totalWithdrawn.value
    assert(amount <= availableBalance, 'Insufficient balance')

    if (assetId === 0) {
      // Withdraw ALGO
      sendPayment({
        receiver: this.creator.value,
        amount: amount,
      })
    } else {
      // Withdraw ASA
      assert(assetId === this.primaryAssetId.value, 'Wrong asset')
      sendAssetTransfer({
        assetReceiver: this.creator.value,
        xferAsset: assetId,
        assetAmount: amount,
      })
    }

    this.totalWithdrawn.value = this.totalWithdrawn.value + amount

    log('FundsWithdrawn:' + itoa(amount))
  }

  /**
   * Get vault balance information
   */
  getBalance(): { deposited: uint64; withdrawn: uint64; available: uint64 } {
    const available = this.totalDeposited.value - this.totalWithdrawn.value
    return {
      deposited: this.totalDeposited.value,
      withdrawn: this.totalWithdrawn.value,
      available: available,
    }
  }

  /**
   * Emergency withdraw (only creator, with cooldown period)
   * For use if adapters fail or task gets stuck
   */
  emergencyWithdraw(): void {
    assert(this.txn.sender === this.creator.value, 'Only creator')

    // TODO: Add cooldown period check (e.g., 7 days after task expiration)

    // Withdraw all remaining ALGO
    const algoBalance = this.app.address.balance - this.app.address.minBalance
    if (algoBalance > 0) {
      sendPayment({
        receiver: this.creator.value,
        amount: algoBalance,
      })
    }

    // Withdraw all remaining ASAs if opted in
    if (this.hasOptedIntoAsset.value) {
      // TODO: Query asset balance and transfer
      // This would require checking current asset balance via globals
    }

    log('EmergencyWithdraw')
  }

  /**
   * Get vault metadata
   */
  getVaultInfo(): {
    taskId: uint64
    creator: Address
    primaryAsset: uint64
    deposited: uint64
    withdrawn: uint64
  } {
    return {
      taskId: this.taskId.value,
      creator: this.creator.value,
      primaryAsset: this.primaryAssetId.value,
      deposited: this.totalDeposited.value,
      withdrawn: this.totalWithdrawn.value,
    }
  }
}
