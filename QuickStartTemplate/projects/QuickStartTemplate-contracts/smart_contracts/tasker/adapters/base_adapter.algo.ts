import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * TokenRequirement - Specifies what tokens an adapter needs
 * This allows adapters to declare their token needs without TaskVault
 * having to understand their parameter structure
 */
class TokenRequirement {
  assetId: uint64 // 0 = ALGO
  amount: uint64
  isInput: boolean // true = adapter needs this token, false = adapter produces this token

  constructor(assetId: uint64, amount: uint64, isInput: boolean) {
    this.assetId = assetId
    this.amount = amount
    this.isInput = isInput
  }
}

/**
 * CanExecuteResult - Result of condition checking
 */
class CanExecuteResult {
  canExecute: boolean
  reason: string

  constructor(canExecute: boolean, reason: string) {
    this.canExecute = canExecute
    this.reason = reason
  }
}

/**
 * ExecuteResult - Result of action execution
 */
class ExecuteResult {
  success: boolean
  resultData: bytes

  constructor(success: boolean, resultData: bytes) {
    this.success = success
    this.resultData = resultData
  }
}

/**
 * AdapterMetadata - Information about the adapter
 */
class AdapterMetadata {
  name: string
  description: string
  category: string
  version: string

  constructor(name: string, description: string, category: string, version: string) {
    this.name = name
    this.description = description
    this.category = category
    this.version = version
  }
}

/**
 * IActionAdapter - Base interface that all adapters MUST implement
 *
 * This is the critical improvement based on Ethereum's TaskLogicV2 analysis:
 * By adding getTokenRequirements(), we enable adapters to declare their
 * token needs WITHOUT forcing them to conform to a hardcoded param structure.
 *
 * Key Methods:
 * 1. getTokenRequirements() - NEW! Declares what tokens adapter needs
 * 2. canExecute() - Checks if conditions are met
 * 3. execute() - Performs the action
 * 4. getMetadata() - Returns adapter information
 */
export abstract class IActionAdapter extends Contract {
  /**
   * Get token requirements for this action
   *
   * This method allows the adapter to declare what tokens it needs WITHOUT
   * TaskVault having to parse the adapter's parameter structure.
   *
   * Example for a swap adapter:
   * - Input: [TokenRequirement(USDC, 100_000000, true)]  // Need 100 USDC
   * - Output: [TokenRequirement(ALGO, 0, false)]         // Will produce ALGO (amount unknown until execution)
   *
   * Example for a transfer adapter:
   * - Input: [TokenRequirement(USDC, 50_000000, true)]   // Need 50 USDC
   *
   * Example for a multi-step adapter (future):
   * - Input: [
   *     TokenRequirement(USDC, 100_000000, true),        // Need 100 USDC
   *     TokenRequirement(ALGO, 10_000000, true)          // Need 10 ALGO
   *   ]
   *
   * @param actionParams - Adapter-specific parameters (any structure)
   * @returns Array of token requirements
   */
  abstract getTokenRequirements(actionParams: bytes): TokenRequirement[]

  /**
   * Check if conditions are met for execution
   *
   * This is called first to determine if the task should execute.
   * Should be a view function (no state changes).
   *
   * @param actionParams - Adapter-specific parameters
   * @returns CanExecuteResult with decision and reason
   */
  abstract canExecute(actionParams: bytes): CanExecuteResult

  /**
   * Execute the action
   *
   * This is called after canExecute() returns true.
   * Can perform state changes, inner transactions, etc.
   *
   * @param vaultAddress - Address of the TaskVault calling this adapter
   * @param actionParams - Adapter-specific parameters
   * @returns ExecuteResult with success status and data
   */
  abstract execute(vaultAddress: Address, actionParams: bytes): ExecuteResult

  /**
   * Get adapter metadata
   *
   * @returns AdapterMetadata with name, description, category, version
   */
  abstract getMetadata(): AdapterMetadata

  /**
   * Get adapter version
   * Useful for upgrades and compatibility checks
   */
  getVersion(): string {
    return '1.0.0'
  }
}

/**
 * BaseAdapter - Convenience base class with common functionality
 *
 * Adapters can extend this instead of IActionAdapter to get:
 * - Admin management
 * - Pause functionality
 * - Execution statistics
 * - Common utilities
 */
export abstract class BaseAdapter extends IActionAdapter {
  // Global state
  admin = GlobalStateKey<Address>({ key: 'admin' })
  isPaused = GlobalStateKey<boolean>({ key: 'paused' })
  totalExecutions = GlobalStateKey<uint64>({ key: 'total_exec' })
  successfulExecutions = GlobalStateKey<uint64>({ key: 'success_exec' })

  /**
   * Initialize base adapter state
   */
  protected initializeBase(): void {
    this.admin.value = this.txn.sender
    this.isPaused.value = false
    this.totalExecutions.value = 0
    this.successfulExecutions.value = 0
  }

  /**
   * Require not paused
   */
  protected requireNotPaused(): void {
    assert(!this.isPaused.value, 'Adapter is paused')
  }

  /**
   * Require admin
   */
  protected requireAdmin(): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
  }

  /**
   * Record execution result
   */
  protected recordExecution(success: boolean): void {
    this.totalExecutions.value = this.totalExecutions.value + 1
    if (success) {
      this.successfulExecutions.value = this.successfulExecutions.value + 1
    }
  }

  /**
   * Get success rate
   */
  getSuccessRate(): uint64 {
    if (this.totalExecutions.value === 0) {
      return 100 // No executions yet, assume 100%
    }
    return (this.successfulExecutions.value * 100) / this.totalExecutions.value
  }

  /**
   * Pause adapter (admin only)
   */
  pause(): void {
    this.requireAdmin()
    this.isPaused.value = true
    log('AdapterPaused')
  }

  /**
   * Unpause adapter (admin only)
   */
  unpause(): void {
    this.requireAdmin()
    this.isPaused.value = false
    log('AdapterUnpaused')
  }

  /**
   * Transfer admin
   */
  transferAdmin(newAdmin: Address): void {
    this.requireAdmin()
    this.admin.value = newAdmin
    log('AdminTransferred')
  }

  /**
   * Get statistics
   */
  getStats(): { total: uint64; successful: uint64; successRate: uint64 } {
    return {
      total: this.totalExecutions.value,
      successful: this.successfulExecutions.value,
      successRate: this.getSuccessRate(),
    }
  }
}
