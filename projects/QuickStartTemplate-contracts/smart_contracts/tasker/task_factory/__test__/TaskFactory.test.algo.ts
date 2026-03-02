import { describe, test, expect, beforeAll } from '@jest/globals'
import { TestExecutionContext, TestFixture } from '@algorandfoundation/algorand-typescript-testing'
import { TaskFactory } from '../contract.algo'

describe('TaskFactory', () => {
  let ctx: TestExecutionContext
  let factory: TaskFactory
  let executorHubAppId: uint64
  let actionRegistryAppId: uint64
  let rewardManagerAppId: uint64

  beforeAll(() => {
    ctx = new TestExecutionContext()

    // Mock app IDs for dependent contracts
    executorHubAppId = 1001
    actionRegistryAppId = 1002
    rewardManagerAppId = 1003

    // Create TaskFactory instance
    factory = ctx.contract.create(TaskFactory)
  })

  test('should initialize with correct default values', () => {
    factory.createApplication(executorHubAppId, actionRegistryAppId, rewardManagerAppId)

    expect(factory.getTotalTasks()).toBe(0)
    expect(factory.executorHubAppId.value).toBe(executorHubAppId)
    expect(factory.actionRegistryAppId.value).toBe(actionRegistryAppId)
    expect(factory.rewardManagerAppId.value).toBe(rewardManagerAppId)
  })

  test('should create a new task successfully', () => {
    const now = globals.latestTimestamp
    const expiration = now + 86400 // 24 hours
    const maxExecutions: uint64 = 10
    const recurringInterval: uint64 = 3600 // 1 hour
    const rewardAmount: uint64 = 1000000 // 1 ALGO
    const rewardAssetId: uint64 = 0 // ALGO
    const adapterAppId: uint64 = 2001
    const actionParams = 'test_params'

    const taskId = factory.createTask(
      expiration,
      maxExecutions,
      recurringInterval,
      rewardAmount,
      rewardAssetId,
      adapterAppId,
      actionParams
    )

    expect(taskId).toBe(1)
    expect(factory.getTotalTasks()).toBe(1)

    // Verify task metadata
    const task = factory.getTask(taskId)
    expect(task.creator).toBe(ctx.txn.sender)
    expect(task.expiration).toBe(expiration)
    expect(task.maxExecutions).toBe(maxExecutions)
    expect(task.executionCount).toBe(0)
    expect(task.recurringInterval).toBe(recurringInterval)
    expect(task.rewardAmount).toBe(rewardAmount)
    expect(task.rewardAssetId).toBe(rewardAssetId)
    expect(task.adapterAppId).toBe(adapterAppId)
    expect(task.status).toBe(0) // Active
  })

  test('should fail to create task with past expiration', () => {
    const pastExpiration = globals.latestTimestamp - 1000 // In the past

    expect(() => {
      factory.createTask(
        pastExpiration,
        10,
        0,
        1000000,
        0,
        2001,
        'test_params'
      )
    }).toThrow('Expiration must be in future')
  })

  test('should fail to create task with zero reward', () => {
    const expiration = globals.latestTimestamp + 86400

    expect(() => {
      factory.createTask(
        expiration,
        10,
        0,
        0, // Zero reward
        0,
        2001,
        'test_params'
      )
    }).toThrow('Reward must be greater than 0')
  })

  test('should create multiple tasks with incrementing IDs', () => {
    const expiration = globals.latestTimestamp + 86400

    const taskId1 = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params1')
    const taskId2 = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params2')
    const taskId3 = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params3')

    expect(taskId1).toBe(2) // After previous tests
    expect(taskId2).toBe(3)
    expect(taskId3).toBe(4)
    expect(factory.getTotalTasks()).toBe(4)
  })

  test('should allow creator to cancel task', () => {
    const expiration = globals.latestTimestamp + 86400
    const taskId = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params')

    // Cancel task
    factory.cancelTask(taskId)

    // Verify status changed
    const task = factory.getTask(taskId)
    expect(task.status).toBe(3) // Cancelled
  })

  test('should fail to cancel task by non-creator', () => {
    const expiration = globals.latestTimestamp + 86400
    const taskId = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params')

    // Try to cancel from different sender
    ctx.txn.sender = '0x' + 'different_address'

    expect(() => {
      factory.cancelTask(taskId)
    }).toThrow('Only creator can cancel')
  })

  test('should correctly determine if task is executable', () => {
    const expiration = globals.latestTimestamp + 86400
    const taskId = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params')

    expect(factory.isTaskExecutable(taskId)).toBe(true)

    // Cancel task
    factory.cancelTask(taskId)

    // Should not be executable after cancellation
    expect(factory.isTaskExecutable(taskId)).toBe(false)
  })

  test('should not be executable after expiration', () => {
    const expiration = globals.latestTimestamp + 100 // Soon to expire
    const taskId = factory.createTask(expiration, 1, 0, 1000000, 0, 2001, 'params')

    // Initially executable
    expect(factory.isTaskExecutable(taskId)).toBe(true)

    // Fast forward time past expiration
    ctx.setTimestamp(expiration + 1)

    // Should not be executable after expiration
    expect(factory.isTaskExecutable(taskId)).toBe(false)
  })

  test('should increment execution count', () => {
    const expiration = globals.latestTimestamp + 86400
    const taskId = factory.createTask(expiration, 10, 0, 1000000, 0, 2001, 'params')

    // Set sender to ExecutorHub (only it can increment)
    ctx.txn.sender = executorHubAppId

    factory.incrementExecutionCount(taskId)

    const task = factory.getTask(taskId)
    expect(task.executionCount).toBe(1)
    expect(task.lastExecution).toBe(globals.latestTimestamp)
  })

  test('should complete task after max executions', () => {
    const expiration = globals.latestTimestamp + 86400
    const maxExecutions: uint64 = 2
    const taskId = factory.createTask(expiration, maxExecutions, 0, 1000000, 0, 2001, 'params')

    // Set sender to ExecutorHub
    ctx.txn.sender = executorHubAppId

    // Execute twice
    factory.incrementExecutionCount(taskId)
    factory.incrementExecutionCount(taskId)

    const task = factory.getTask(taskId)
    expect(task.executionCount).toBe(2)
    expect(task.status).toBe(2) // Completed
  })

  test('should respect recurring interval', () => {
    const expiration = globals.latestTimestamp + 86400
    const recurringInterval: uint64 = 3600 // 1 hour
    const taskId = factory.createTask(expiration, 0, recurringInterval, 1000000, 0, 2001, 'params')

    // Set sender to ExecutorHub
    ctx.txn.sender = executorHubAppId

    // First execution
    factory.incrementExecutionCount(taskId)
    expect(factory.isTaskExecutable(taskId)).toBe(false) // Too soon

    // Fast forward time
    ctx.setTimestamp(globals.latestTimestamp + recurringInterval)
    expect(factory.isTaskExecutable(taskId)).toBe(true) // Interval passed
  })

  test('should allow admin to update system contracts', () => {
    const newExecutorHubId: uint64 = 9001
    const newActionRegistryId: uint64 = 9002
    const newRewardManagerId: uint64 = 9003

    factory.updateSystemContracts(newExecutorHubId, newActionRegistryId, newRewardManagerId)

    expect(factory.executorHubAppId.value).toBe(newExecutorHubId)
    expect(factory.actionRegistryAppId.value).toBe(newActionRegistryId)
    expect(factory.rewardManagerAppId.value).toBe(newRewardManagerId)
  })

  test('should fail to update system contracts by non-admin', () => {
    ctx.txn.sender = '0x' + 'non_admin'

    expect(() => {
      factory.updateSystemContracts(9001, 9002, 9003)
    }).toThrow('Only admin can update')
  })

  test('should allow admin transfer', () => {
    const newAdmin = '0x' + 'new_admin_address'

    // Reset sender to original admin
    ctx.txn.sender = factory.admin.value

    factory.transferAdmin(newAdmin)

    expect(factory.admin.value).toBe(newAdmin)
  })
})
