import { v7 as uuidv7 } from 'uuid'

export function generateUuid(): string {
  return uuidv7()
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('rcps-app-device-id')
  if (!deviceId) {
    deviceId = generateUuid()
    localStorage.setItem('rcps-app-device-id', deviceId)
  }
  return deviceId
}
