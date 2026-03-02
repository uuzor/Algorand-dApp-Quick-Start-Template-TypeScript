/**
 * TaskerOnChain TypeScript Types
 *
 * Type definitions matching the Algorand smart contract structures
 */

// ============================================================================
// Enum Types
// ============================================================================

export enum TaskStatus {
  Active = 0,
  Executing = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum AdapterCategory {
  DeFi = 0,
  Governance = 1,
  Transfer = 2,
  Notification = 3,
  Oracle = 4,
  Custom = 255,
}

// ============================================================================
// Task Factory Types
// ============================================================================

/**
 * Task metadata structure stored in TaskFactory box storage
 */
export interface TaskMetadata {
  creator: string // Algorand address
  vaultAppId: bigint | number
  expiration: bigint | number // Unix timestamp
  maxExecutions: bigint | number
  executionCount: bigint | number
  recurringInterval: bigint | number // Seconds between executions (0 = one-time)
  lastExecution: bigint | number // Unix timestamp
  rewardAmount: bigint | number // Micro-ALGOs or asset units
  rewardAssetId: bigint | number // 0 = ALGO
  adapterAppId: bigint | number
  actionParamsHash: Uint8Array // SHA-256 hash
  status: TaskStatus
}

/**
 * Parameters for creating a new task
 */
export interface CreateTaskParams {
  expiration: bigint | number // Unix timestamp when task expires
  maxExecutions: bigint | number // Maximum executions (0 = unlimited)
  recurringInterval: bigint | number // Seconds between executions (0 = one-time)
  rewardAmount: bigint | number // Payment per execution
  rewardAssetId: bigint | number // 0 = ALGO, or ASA ID
  adapterAppId: bigint | number // Adapter contract app ID
  actionParams: Uint8Array // ABI-encoded parameters for the adapter
}

/**
 * Result from task creation
 */
export interface CreateTaskResult {
  taskId: bigint | number
  vaultAppId: bigint | number
  transactionId: string
}

// ============================================================================
// Executor Hub Types
// ============================================================================

/**
 * Executor profile and statistics
 */
export interface ExecutorProfile {
  stakeAmount: bigint | number
  successfulExecutions: bigint | number
  failedExecutions: bigint | number
  totalRewardsEarned: bigint | number
  reputationScore: bigint | number // 0-100 scale
  isSlashed: boolean
  registrationTime: bigint | number
}

/**
 * Parameters for registering as an executor
 */
export interface RegisterExecutorParams {
  stakeAmount: bigint | number // Must be >= minStake
}

/**
 * Result from task execution
 */
export interface ExecutionResult {
  success: boolean
  resultData: Uint8Array
  gasUsed: bigint | number
  rewardPaid: bigint | number
}

/**
 * Parameters for executing a task
 */
export interface ExecuteTaskParams {
  taskId: bigint | number
  actionParams: Uint8Array // Must match hash in task metadata
}

// ============================================================================
// Task Vault Types
// ============================================================================

/**
 * Token requirement for adapter execution
 */
export interface TokenRequirement {
  assetId: bigint | number // 0 = ALGO
  amount: bigint | number
  isInput: boolean // true = consumed, false = output
}

/**
 * Parameters for funding a task vault
 */
export interface FundVaultParams {
  vaultAppId: bigint | number
  amount: bigint | number
  assetId?: bigint | number // Optional, defaults to ALGO (0)
}

/**
 * Parameters for withdrawing from vault
 */
export interface WithdrawVaultParams {
  vaultAppId: bigint | number
  amount: bigint | number
  assetId?: bigint | number // Optional, defaults to ALGO (0)
}

// ============================================================================
// Action Registry Types
// ============================================================================

/**
 * Adapter metadata stored in ActionRegistry
 */
export interface AdapterMetadata {
  name: string
  version: string
  category: AdapterCategory
  description: string
  isActive: boolean
}

/**
 * Parameters for registering an adapter
 */
export interface RegisterAdapterParams {
  adapterAppId: bigint | number
  metadata: AdapterMetadata
}

/**
 * Adapter search/query filters
 */
export interface AdapterQueryFilters {
  category?: AdapterCategory
  isActive?: boolean
  nameContains?: string
}

// ============================================================================
// Adapter Types (Base)
// ============================================================================

/**
 * Result from adapter's canExecute check
 */
export interface CanExecuteResult {
  canExecute: boolean
  reason: string // Human-readable reason
  estimatedGas: bigint | number
}

/**
 * Result from adapter's execute call
 */
export interface AdapterExecuteResult {
  success: boolean
  outputData: Uint8Array
  tokensUsed: TokenRequirement[]
}

// ============================================================================
// Tinyman Limit Order Adapter Types
// ============================================================================

export enum OrderType {
  Buy = 0,
  Sell = 1,
}

/**
 * Parameters for Tinyman limit order
 */
export interface TinymanLimitOrderParams {
  fromAssetId: bigint | number
  toAssetId: bigint | number
  amount: bigint | number
  limitPrice: bigint | number // Price in basis points (10000 = 1.0)
  orderType: OrderType
  slippageTolerance: number // 0-10000 (100 = 1%)
  tinymanPoolAppId: bigint | number
}

// ============================================================================
// Time-Based Transfer Adapter Types
// ============================================================================

/**
 * Parameters for time-based transfer
 */
export interface TimeBasedTransferParams {
  token: string // Algorand address
  recipient: string // Algorand address
  amount: bigint | number
  executeAfter: bigint | number // Unix timestamp
}

// ============================================================================
// Transaction Builder Types
// ============================================================================

/**
 * Atomic transaction group for task creation
 */
export interface CreateTaskTransactionGroup {
  createTaskTxn: any // App call to TaskFactory
  fundVaultTxn?: any // Optional payment to fund vault
}

/**
 * Atomic transaction group for task execution
 */
export interface ExecuteTaskTransactionGroup {
  checkConditionsTxn: any // Call to Adapter.canExecute
  executeActionTxn: any // Call to TaskVault.executeAction
  distributeRewardsTxn: any // Call to RewardManager
}

// ============================================================================
// System Configuration Types
// ============================================================================

/**
 * App IDs for all TaskerOnChain contracts
 */
export interface TaskerSystemConfig {
  taskFactoryAppId: bigint | number
  executorHubAppId: bigint | number
  actionRegistryAppId: bigint | number
  rewardManagerAppId: bigint | number
}

/**
 * Global configuration values
 */
export interface SystemParameters {
  minStake: bigint | number // Minimum executor stake in micro-ALGOs
  slashingThreshold: number // Failure rate % that triggers slashing
  slashingPenalty: number // % of stake to slash
  minTaskReward: bigint | number // Minimum reward per execution
}

// ============================================================================
// Helper Return Types
// ============================================================================

/**
 * Result from deployment operations
 */
export interface DeploymentResult {
  appId: bigint | number
  appAddress: string
  transactionId: string
}

/**
 * Paginated list result
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

/**
 * Contract call result with transaction info
 */
export interface ContractCallResult<T> {
  result: T
  transactionId: string
  confirmedRound: bigint | number
}
