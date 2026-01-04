import { v7 as uuidv7 } from 'uuid'

export function generateUuid(): string {
  return uuidv7()
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = generateUuid()
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}
