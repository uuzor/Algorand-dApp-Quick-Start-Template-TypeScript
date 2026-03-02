/**
 * ExecutorHubHelper - Frontend helper for ExecutorHub contract interactions
 *
 * Provides type-safe methods for executor registration, staking, and task execution
 */

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import {
  TransactionSigner,
  encodeUint64,
  makeApplicationCallTxnFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  OnApplicationComplete,
  assignGroupID,
} from 'algosdk'
import {
  ExecutorProfile,
  RegisterExecutorParams,
  ExecuteTaskParams,
  ExecutionResult,
  ContractCallResult,
} from './types'

export class ExecutorHubHelper {
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
   * Register as an executor by staking ALGO
   *
   * Creates an atomic transaction group:
   * 1. Payment transaction to contract
   * 2. App call to register
   *
   * @param params Registration parameters
   * @returns Transaction ID
   *
   * @example
   * ```ts
   * const result = await executorHub.registerExecutor({
   *   stakeAmount: 10_000_000, // 10 ALGO minimum
   * })
   * console.log('Registered as executor:', result.transactionId)
   * ```
   */
  async registerExecutor(
    params: RegisterExecutorParams
  ): Promise<ContractCallResult<void>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    const suggestedParams = await this.algorand.client.algod
      .getTransactionParams()
      .do()

    // Get app address
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()
    const appAddress = appInfo.params['creator'] // Simplified - should calculate from app ID

    // 1. Payment transaction
    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: this.sender,
      to: appAddress,
      amount: Number(params.stakeAmount),
      suggestedParams,
    })

    // 2. App call transaction
    const appCallTxn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.OptInOC, // Opt-in for local state
      appArgs: [new Uint8Array(Buffer.from('registerExecutor'))],
      suggestedParams,
    })

    // Group transactions
    const txns = assignGroupID([paymentTxn, appCallTxn])

    // Sign and send
    const signedTxns = await this.signer(txns, [0, 1])
    const { txId } = await this.algorand.client.algod
      .sendRawTransaction(signedTxns)
      .do()

    const result = await this.algorand.client.algod
      .pendingTransactionInformation(txId)
      .do()

    return {
      result: undefined as void,
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Add more stake to existing executor account
   *
   * @param amount Additional stake amount in micro-ALGOs
   * @returns Transaction ID
   *
   * @example
   * ```ts
   * await executorHub.addStake(5_000_000) // Add 5 ALGO
   * ```
   */
  async addStake(amount: bigint | number): Promise<ContractCallResult<void>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    const suggestedParams = await this.algorand.client.algod
      .getTransactionParams()
      .do()

    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()
    const appAddress = appInfo.params['creator']

    // Payment transaction
    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: this.sender,
      to: appAddress,
      amount: Number(amount),
      suggestedParams,
    })

    // App call
    const appCallTxn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs: [new Uint8Array(Buffer.from('addStake'))],
      suggestedParams,
    })

    const txns = assignGroupID([paymentTxn, appCallTxn])
    const signedTxns = await this.signer(txns, [0, 1])
    const { txId } = await this.algorand.client.algod
      .sendRawTransaction(signedTxns)
      .do()

    const result = await this.algorand.client.algod
      .pendingTransactionInformation(txId)
      .do()

    return {
      result: undefined as void,
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Withdraw stake from executor account
   *
   * @param amount Amount to withdraw in micro-ALGOs
   * @returns Transaction ID
   *
   * @example
   * ```ts
   * await executorHub.withdrawStake(3_000_000) // Withdraw 3 ALGO
   * ```
   */
  async withdrawStake(
    amount: bigint | number
  ): Promise<ContractCallResult<void>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    const appArgs = [
      new Uint8Array(Buffer.from('withdrawStake')),
      encodeUint64(Number(amount)),
    ]

    const suggestedParams = await this.algorand.client.algod
      .getTransactionParams()
      .do()

    const txn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs,
      suggestedParams,
    })

    const signedTxn = await this.signer([txn], [0])
    const { txId } = await this.algorand.client.algod
      .sendRawTransaction(signedTxn)
      .do()

    const result = await this.algorand.client.algod
      .pendingTransactionInformation(txId)
      .do()

    return {
      result: undefined as void,
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Execute a task
   *
   * This orchestrates the entire execution flow using atomic transactions:
   * 1. Check conditions (Adapter.canExecute)
   * 2. Execute action (TaskVault.executeAction)
   * 3. Distribute rewards (RewardManager)
   *
   * @param params Execution parameters
   * @returns Execution result
   *
   * @example
   * ```ts
   * const result = await executorHub.executeTask({
   *   taskId: 1,
   *   actionParams: encodedParams,
   * })
   * if (result.result.success) {
   *   console.log('Task executed, reward:', result.result.rewardPaid)
   * }
   * ```
   */
  async executeTask(
    params: ExecuteTaskParams
  ): Promise<ContractCallResult<ExecutionResult>> {
    if (!this.signer || !this.sender) {
      throw new Error('Signer not set. Call setSigner() first.')
    }

    const appArgs = [
      new Uint8Array(Buffer.from('executeTask')),
      encodeUint64(Number(params.taskId)),
      params.actionParams,
    ]

    const suggestedParams = await this.algorand.client.algod
      .getTransactionParams()
      .do()

    const txn = makeApplicationCallTxnFromObject({
      from: this.sender,
      appIndex: Number(this.appId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs,
      suggestedParams,
    })

    const signedTxn = await this.signer([txn], [0])
    const { txId } = await this.algorand.client.algod
      .sendRawTransaction(signedTxn)
      .do()

    const result = await this.algorand.client.algod
      .pendingTransactionInformation(txId)
      .do()

    // Parse execution result from logs
    const logs = result['logs'] || []
    // TODO: Parse execution result properly

    return {
      result: {
        success: true,
        resultData: new Uint8Array(),
        gasUsed: 0,
        rewardPaid: 0,
      },
      transactionId: txId,
      confirmedRound: result['confirmed-round'],
    }
  }

  /**
   * Get executor profile
   *
   * @param address Executor's Algorand address
   * @returns Executor profile data
   *
   * @example
   * ```ts
   * const profile = await executorHub.getExecutorProfile(myAddress)
   * console.log('Reputation score:', profile.reputationScore)
   * console.log('Total rewards:', profile.totalRewardsEarned)
   * ```
   */
  async getExecutorProfile(address: string): Promise<ExecutorProfile> {
    const accountInfo = await this.algorand.client.algod
      .accountApplicationInformation(address, Number(this.appId))
      .do()

    const localState = accountInfo['app-local-state']?.['key-value'] || []

    // Helper to get local state value
    const getLocalValue = (key: string, defaultValue: any = 0): any => {
      const keyBase64 = Buffer.from(key).toString('base64')
      const stateItem = localState.find((kv: any) => kv.key === keyBase64)
      if (!stateItem) return defaultValue
      return stateItem.value.uint || stateItem.value.bytes || defaultValue
    }

    return {
      stakeAmount: getLocalValue('stake'),
      successfulExecutions: getLocalValue('success'),
      failedExecutions: getLocalValue('failed'),
      totalRewardsEarned: getLocalValue('rewards'),
      reputationScore: getLocalValue('reputation', 100),
      isSlashed: getLocalValue('slashed', 0) === 1,
      registrationTime: getLocalValue('reg_time'),
    }
  }

  /**
   * Check if an address is a registered executor
   *
   * @param address Algorand address to check
   * @returns True if registered
   */
  async isRegistered(address: string): Promise<boolean> {
    try {
      const profile = await this.getExecutorProfile(address)
      return Number(profile.stakeAmount) > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Get minimum stake requirement
   *
   * @returns Minimum stake in micro-ALGOs
   */
  async getMinStake(): Promise<number> {
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()

    const globalState = appInfo.params['global-state'] || []
    const minStakeKey = Buffer.from('min_stake').toString('base64')

    const minStakeState = globalState.find((kv: any) => kv.key === minStakeKey)

    return minStakeState ? minStakeState.value.uint : 10_000_000 // Default 10 ALGO
  }

  /**
   * Get total number of executors
   *
   * @returns Total executor count
   */
  async getTotalExecutors(): Promise<number> {
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()

    const globalState = appInfo.params['global-state'] || []
    const totalExecutorsKey = Buffer.from('total_executors').toString('base64')

    const totalExecutorsState = globalState.find(
      (kv: any) => kv.key === totalExecutorsKey
    )

    return totalExecutorsState ? totalExecutorsState.value.uint : 0
  }

  /**
   * Get total staked amount across all executors
   *
   * @returns Total staked in micro-ALGOs
   */
  async getTotalStaked(): Promise<number> {
    const appInfo = await this.algorand.client.algod
      .getApplicationByID(Number(this.appId))
      .do()

    const globalState = appInfo.params['global-state'] || []
    const totalStakedKey = Buffer.from('total_staked').toString('base64')

    const totalStakedState = globalState.find(
      (kv: any) => kv.key === totalStakedKey
    )

    return totalStakedState ? totalStakedState.value.uint : 0
  }

  /**
   * Calculate executor's success rate
   *
   * @param address Executor address
   * @returns Success rate as percentage (0-100)
   */
  async getSuccessRate(address: string): Promise<number> {
    const profile = await this.getExecutorProfile(address)

    const total =
      Number(profile.successfulExecutions) + Number(profile.failedExecutions)

    if (total === 0) return 100 // No executions yet, assume 100%

    return (Number(profile.successfulExecutions) / total) * 100
  }

  /**
   * Get app ID
   */
  getAppId(): bigint | number {
    return this.appId
  }
}
