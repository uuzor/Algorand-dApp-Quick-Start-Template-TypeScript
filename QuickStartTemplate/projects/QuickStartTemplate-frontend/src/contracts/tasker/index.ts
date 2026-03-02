/**
 * TaskerOnChain Smart Contract Helpers
 *
 * Provides type-safe TypeScript interfaces for interacting with
 * TaskerOnChain smart contracts on Algorand.
 *
 * @packageDocumentation
 */

// Main client
export { TaskerClient, createTaskerClient } from './TaskerClient'

// Individual helpers
export { TaskFactoryHelper } from './TaskFactoryHelper'
export { ExecutorHubHelper } from './ExecutorHubHelper'

// Types
export * from './types'

// Re-export for convenience
export type {
  TaskMetadata,
  CreateTaskParams,
  CreateTaskResult,
  ExecutorProfile,
  RegisterExecutorParams,
  ExecuteTaskParams,
  ExecutionResult,
  TaskerSystemConfig,
  SystemParameters,
  TaskStatus,
  AdapterCategory,
  OrderType,
  TinymanLimitOrderParams,
  TimeBasedTransferParams,
  ContractCallResult,
} from './types'
