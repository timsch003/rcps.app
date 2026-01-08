import { v7 as uuidv7 } from 'uuid'

export function generateUuid(): string {
  return uuidv7()
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = generateUuid()
    localStorage.setItem(`${import.meta.env.VITE_APP_NAME}_device_id`, deviceId)
  }
  return deviceId
}
