import { Contract } from '@algorandfoundation/algorand-typescript'

/**
 * AdapterMetadata stored in box storage
 */
class AdapterMetadata {
  appId: uint64
  name: string
  description: string
  maxGasLimit: uint64
  category: string
  isActive: boolean
  totalExecutions: uint64
  successfulExecutions: uint64

  constructor(
    appId: uint64,
    name: string,
    description: string,
    maxGasLimit: uint64,
    category: string
  ) {
    this.appId = appId
    this.name = name
    this.description = description
    this.maxGasLimit = maxGasLimit
    this.category = category
    this.isActive = true
    this.totalExecutions = 0
    this.successfulExecutions = 0
  }
}

/**
 * ActionRegistry - Manages approved action adapters
 *
 * This contract maintains a registry of approved adapter contracts that can be used
 * for task automation. Each adapter is whitelisted, categorized, and has gas limits.
 */
export class ActionRegistry extends Contract {
  // Global state
  totalAdapters = GlobalStateKey<uint64>({ key: 'total_adapters' })
  admin = GlobalStateKey<Address>({ key: 'admin' })

  // Box storage for adapter metadata
  // Key: adapter_{app_id} → Value: AdapterMetadata

  /**
   * Initialize the ActionRegistry
   */
  createApplication(): void {
    this.totalAdapters.value = 0
    this.admin.value = this.txn.sender
  }

  /**
   * Register a new adapter (admin only)
   *
   * @param adapterAppId - Application ID of the adapter contract
   * @param name - Human-readable name (e.g., "Tinyman USDC/ALGO Limit Buy")
   * @param description - Detailed description of what the adapter does
   * @param maxGasLimit - Maximum gas this adapter can consume
   * @param category - Category for organization (swap, lending, yield, nft, etc.)
   */
  registerAdapter(
    adapterAppId: uint64,
    name: string,
    description: string,
    maxGasLimit: uint64,
    category: string
  ): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can register')
    assert(adapterAppId > 0, 'Invalid app ID')
    assert(maxGasLimit > 0, 'Invalid gas limit')

    const boxKey = 'adapter_' + itoa(adapterAppId)
    assert(!this.boxes.exists(boxKey), 'Adapter already registered')

    // Create adapter metadata
    const metadata = new AdapterMetadata(adapterAppId, name, description, maxGasLimit, category)

    // Store in box storage
    this.boxes.create(boxKey, 512) // Allocate 512 bytes
    this.boxes.set(boxKey, metadata)

    this.totalAdapters.value = this.totalAdapters.value + 1

    log('AdapterRegistered:' + itoa(adapterAppId) + ':' + name)
  }

  /**
   * Get adapter metadata
   */
  getAdapter(adapterAppId: uint64): AdapterMetadata {
    const boxKey = 'adapter_' + itoa(adapterAppId)
    assert(this.boxes.exists(boxKey), 'Adapter not found')
    return this.boxes.get(boxKey) as AdapterMetadata
  }

  /**
   * Check if adapter is active
   */
  isAdapterActive(adapterAppId: uint64): boolean {
    const boxKey = 'adapter_' + itoa(adapterAppId)
    if (!this.boxes.exists(boxKey)) {
      return false
    }

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    return metadata.isActive
  }

  /**
   * Deactivate an adapter (admin only)
   * Does not delete, just marks inactive
   */
  deactivateAdapter(adapterAppId: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can deactivate')

    const boxKey = 'adapter_' + itoa(adapterAppId)
    assert(this.boxes.exists(boxKey), 'Adapter not found')

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    metadata.isActive = false
    this.boxes.set(boxKey, metadata)

    log('AdapterDeactivated:' + itoa(adapterAppId))
  }

  /**
   * Reactivate an adapter (admin only)
   */
  reactivateAdapter(adapterAppId: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin can reactivate')

    const boxKey = 'adapter_' + itoa(adapterAppId)
    assert(this.boxes.exists(boxKey), 'Adapter not found')

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    metadata.isActive = true
    this.boxes.set(boxKey, metadata)

    log('AdapterReactivated:' + itoa(adapterAppId))
  }

  /**
   * Update adapter gas limit (admin only)
   */
  updateAdapterGasLimit(adapterAppId: uint64, newGasLimit: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    assert(newGasLimit > 0, 'Invalid gas limit')

    const boxKey = 'adapter_' + itoa(adapterAppId)
    assert(this.boxes.exists(boxKey), 'Adapter not found')

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    metadata.maxGasLimit = newGasLimit
    this.boxes.set(boxKey, metadata)

    log('AdapterGasLimitUpdated:' + itoa(adapterAppId) + ':' + itoa(newGasLimit))
  }

  /**
   * Record adapter execution (called by ExecutorHub/TaskVault)
   */
  recordExecution(adapterAppId: uint64, success: boolean): void {
    // TODO: Add access control - only authorized contracts can call this

    const boxKey = 'adapter_' + itoa(adapterAppId)
    if (!this.boxes.exists(boxKey)) {
      return // Silently ignore if adapter not found
    }

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    metadata.totalExecutions = metadata.totalExecutions + 1

    if (success) {
      metadata.successfulExecutions = metadata.successfulExecutions + 1
    }

    this.boxes.set(boxKey, metadata)
  }

  /**
   * Get adapter success rate
   */
  getAdapterSuccessRate(adapterAppId: uint64): uint64 {
    const boxKey = 'adapter_' + itoa(adapterAppId)
    if (!this.boxes.exists(boxKey)) {
      return 0
    }

    const metadata = this.boxes.get(boxKey) as AdapterMetadata
    if (metadata.totalExecutions === 0) {
      return 100 // No executions yet, assume 100%
    }

    return (metadata.successfulExecutions * 100) / metadata.totalExecutions
  }

  /**
   * Get all adapters by category
   * Returns array of adapter app IDs
   * Note: In practice, this would be handled off-chain by indexing box storage
   */
  getAdaptersByCategory(category: string): uint64[] {
    // This is a simplified version - in production, use indexer
    // For now, return empty array as placeholder
    const adapters: uint64[] = []
    return adapters
  }

  /**
   * Get total number of adapters
   */
  getTotalAdapters(): uint64 {
    return this.totalAdapters.value
  }

  /**
   * Transfer admin role
   */
  transferAdmin(newAdmin: Address): void {
    assert(this.txn.sender === this.admin.value, 'Only admin')
    this.admin.value = newAdmin
  }
}
