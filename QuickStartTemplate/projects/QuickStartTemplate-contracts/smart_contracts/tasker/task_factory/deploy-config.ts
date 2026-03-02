import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TaskFactoryFactory } from './TaskFactoryClient'

/**
 * Deploy TaskFactory contract
 *
 * Deployment order for TaskerOnChain system:
 * 1. RewardManager (no dependencies)
 * 2. ActionRegistry (no dependencies)
 * 3. ExecutorHub (needs placeholder for TaskFactory, will be updated)
 * 4. TaskFactory (needs ExecutorHub, ActionRegistry, RewardManager)
 * 5. Update ExecutorHub with TaskFactory reference
 */
export async function deploy() {
  console.log('=== Deploying TaskFactory ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  console.log(`Deploying from account: ${deployer.addr}`)

  // For initial deployment, use placeholder app IDs
  // In production, these would be replaced with actual deployed contract IDs
  const executorHubAppId = BigInt(0) // Will be set later
  const actionRegistryAppId = BigInt(0) // Will be set later
  const rewardManagerAppId = BigInt(0) // Will be set later

  // Create factory instance
  const factory = algorand.client.getTypedAppFactory(TaskFactoryFactory, {
    defaultSender: deployer.addr,
  })

  // Deploy with create or update strategy
  const { appClient, result } = await factory.deploy({
    onSchemaBreak: 'append', // Create new app on schema change
    onUpdate: 'append', // Create new app on code change
    deployTimeParams: {
      executorHubAppId,
      actionRegistryAppId,
      rewardManagerAppId,
    },
  })

  console.log(`✅ TaskFactory deployed!`)
  console.log(`   App ID: ${appClient.appId}`)
  console.log(`   App Address: ${appClient.appAddress}`)
  console.log(`   Transaction ID: ${result.txIds[0]}`)

  // Fund the app account with minimum balance for box storage
  console.log('\n📦 Funding TaskFactory for box storage...')
  const fundResult = await algorand.send.payment({
    sender: deployer.addr,
    receiver: appClient.appAddress,
    amount: algorand.microAlgo(1000000), // 1 ALGO for box storage
  })
  console.log(`   Funded with 1 ALGO`)
  console.log(`   Transaction ID: ${fundResult.txIds[0]}`)

  // Display current configuration
  console.log('\n📋 Current Configuration:')
  console.log(`   Total Tasks: ${await appClient.send.getTotalTasks({})}`)
  console.log(`   ExecutorHub App ID: ${executorHubAppId}`)
  console.log(`   ActionRegistry App ID: ${actionRegistryAppId}`)
  console.log(`   RewardManager App ID: ${rewardManagerAppId}`)

  console.log('\n⚠️  Note: Update system contract references after deploying other contracts')
  console.log('   Use: taskFactory.updateSystemContracts(executorHub, actionRegistry, rewardManager)')

  return {
    appId: appClient.appId,
    appAddress: appClient.appAddress,
    appClient,
  }
}
