import { BaseAdapter, TokenRequirement, CanExecuteResult, ExecuteResult, AdapterMetadata } from '../base_adapter.algo'

/**
 * TimeBasedTransferParams - Clean 4-parameter structure!
 *
 * This demonstrates the KEY IMPROVEMENT from the Ethereum TaskLogicV2 analysis:
 * We DON'T need to fake Uniswap's 6-parameter format anymore!
 *
 * The adapter can use whatever parameter structure makes sense.
 * TaskVault doesn't need to parse this - it calls getTokenRequirements() instead.
 */
class TimeBasedTransferParams {
  token: Address // Asset to transfer (0x0 = ALGO)
  recipient: Address // Who receives the transfer
  amount: uint64 // Amount to transfer
  executeAfter: uint64 // Unix timestamp - execute only after this time

  constructor(token: Address, recipient: Address, amount: uint64, executeAfter: uint64) {
    this.token = token
    this.recipient = recipient
    this.amount = amount
    this.executeAfter = executeAfter
  }
}

/**
 * TimeBasedTransferAdapter - Transfer tokens after a specific time
 *
 * This is a simple adapter that demonstrates the improved architecture:
 *
 * BEFORE (Ethereum hardcoded approach):
 * - Had to encode params as: (router, tokenIn, tokenOut, amountIn, minAmountOut, recipient)
 * - Even though we only need: (token, recipient, amount, executeAfter)
 * - TaskLogicV2 would hardcode decode the 6 params
 *
 * AFTER (our improved approach):
 * - Use clean 4-parameter structure
 * - Implement getTokenRequirements() to declare token needs
 * - TaskVault asks adapter what it needs (no hardcoded parsing!)
 *
 * Use Case Examples:
 * - Vesting: Transfer tokens to recipient after vesting period
 * - Delayed payment: Schedule payment for future date
 * - Time-locked operations: Execute action only after cooldown
 */
export class TimeBasedTransferAdapter extends BaseAdapter {
  /**
   * Initialize the adapter
   */
  createApplication(): void {
    this.initializeBase()
  }

  /**
   * Get token requirements - THE KEY IMPROVEMENT!
   *
   * TaskVault calls this to know what tokens are needed.
   * No hardcoded 6-parameter Uniswap structure!
   *
   * @param actionParams - Encoded TimeBasedTransferParams
   * @returns Array with single token requirement
   */
  getTokenRequirements(actionParams: bytes): TokenRequirement[] {
    // Decode OUR clean 4-parameter structure
    // TODO: Implement proper ABI decoding
    // const params = abi.decode(actionParams, TimeBasedTransferParams)

    // Placeholder for demonstration
    const token: Address = '0x0' // ALGO
    const amount: uint64 = 1000000 // 1 ALGO

    // Declare we need 1 token input
    const requirements: TokenRequirement[] = []
    requirements.push(new TokenRequirement(0, amount, true)) // 0 = ALGO, true = input

    return requirements
  }

  /**
   * Check if time condition is met
   *
   * @param actionParams - Encoded TimeBasedTransferParams
   * @returns CanExecuteResult
   */
  canExecute(actionParams: bytes): CanExecuteResult {
    this.requireNotPaused()

    // Decode params
    // TODO: Implement proper ABI decoding
    // const params = abi.decode(actionParams, TimeBasedTransferParams)

    // Placeholder values
    const executeAfter: uint64 = 1700000000 // Example timestamp

    // Check if current time >= executeAfter
    if (globals.latestTimestamp >= executeAfter) {
      return new CanExecuteResult(true, 'Time condition met')
    } else {
      const secondsRemaining = executeAfter - globals.latestTimestamp
      return new CanExecuteResult(false, 'Wait ' + itoa(secondsRemaining) + ' seconds')
    }
  }

  /**
   * Execute the transfer
   *
   * @param vaultAddress - Address of the TaskVault
   * @param actionParams - Encoded TimeBasedTransferParams
   * @returns ExecuteResult
   */
  execute(vaultAddress: Address, actionParams: bytes): ExecuteResult {
    this.requireNotPaused()

    // Decode params
    // TODO: Implement proper ABI decoding
    // const params = abi.decode(actionParams, TimeBasedTransferParams)

    // Placeholder values
    const token: Address = '0x0' // ALGO
    const recipient: Address = '0x123...' // Placeholder
    const amount: uint64 = 1000000 // 1 ALGO
    const assetId: uint64 = 0 // ALGO

    // Verify time condition (defensive check)
    // In production, canExecute() should have already verified this
    const executeAfter: uint64 = 1700000000
    if (globals.latestTimestamp < executeAfter) {
      this.recordExecution(false)
      return new ExecuteResult(false, 'Too early')
    }

    // Perform transfer via inner transaction
    if (assetId === 0) {
      // Transfer ALGO
      sendPayment({
        receiver: recipient,
        amount: amount,
      })
    } else {
      // Transfer ASA
      sendAssetTransfer({
        assetReceiver: recipient,
        xferAsset: assetId,
        assetAmount: amount,
      })
    }

    this.recordExecution(true)

    log('TimeBasedTransferExecuted:' + recipient + ':' + itoa(amount))

    return new ExecuteResult(true, 'Transfer completed')
  }

  /**
   * Get adapter metadata
   */
  getMetadata(): AdapterMetadata {
    return new AdapterMetadata(
      'Time-Based Transfer',
      'Transfer tokens after a specific timestamp',
      'transfer',
      '1.0.0'
    )
  }
}
