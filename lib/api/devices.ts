import type {
  DeviceRegistrationInput,
  DeviceRegistrationResult,
} from '../../types/api';
import type { ApiClient } from './client';

export async function registerDevice(
  client: ApiClient,
  input: DeviceRegistrationInput
): Promise<DeviceRegistrationResult> {
  return await client.request<DeviceRegistrationResult>('/api/v1/devices', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
