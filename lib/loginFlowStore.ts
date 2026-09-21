import AsyncStorage from "@react-native-async-storage/async-storage";

const LOGIN_PHONE_KEY = "grpd_login_phone_v1";
const LOGIN_OTP_REQUEST_KEY = "grpd_login_otp_request_v1";

export type StoredOtpRequest = {
  requestId: string;
  phone: string;
};

export async function setLoginPhone(phone: string): Promise<void> {
  await AsyncStorage.setItem(LOGIN_PHONE_KEY, phone);
}

export async function getLoginPhone(): Promise<string | null> {
  return AsyncStorage.getItem(LOGIN_PHONE_KEY);
}

export async function clearLoginPhone(): Promise<void> {
  await AsyncStorage.removeItem(LOGIN_PHONE_KEY);
}

export async function setLoginOtpRequest(
  data: StoredOtpRequest,
): Promise<void> {
  await AsyncStorage.setItem(LOGIN_OTP_REQUEST_KEY, JSON.stringify(data));
}

export async function clearLoginOtpRequest(): Promise<void> {
  await AsyncStorage.removeItem(LOGIN_OTP_REQUEST_KEY);
}

export async function getLoginOtpRequest(): Promise<StoredOtpRequest | null> {
  const raw = await AsyncStorage.getItem(LOGIN_OTP_REQUEST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredOtpRequest;
  } catch {
    return null;
  }
}
