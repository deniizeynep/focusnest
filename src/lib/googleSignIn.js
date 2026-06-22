"use strict";
/** import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

console.log("GOOGLE WEB CLIENT ID EXISTS:", Boolean(webClientId));

GoogleSignin.configure({
  webClientId,
  offlineAccess: false,
});

export async function getGoogleIdToken() {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Her seferinde hesap seçtirmek için
    await GoogleSignin.signOut();

    const response = await GoogleSignin.signIn();

    console.log("GOOGLE RESPONSE SUCCESS:", isSuccessResponse(response));

    if (!isSuccessResponse(response)) {
      return null;
    }

    const idToken = response.data.idToken;

    console.log("GOOGLE ID TOKEN EXISTS:", Boolean(idToken));

    if (!idToken) {
      throw new Error("Google ID token alınamadı.");
    }

    return idToken;
  } catch (error: any) {
    console.log("GOOGLE ERROR CODE:", error?.code);
    console.log("GOOGLE ERROR MESSAGE:", error?.message);

    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }

    if (error?.code === statusCodes.IN_PROGRESS) {
      throw new Error("Google girişi zaten devam ediyor.");
    }

    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services kullanılamıyor.");
    }

    throw new Error(error?.message ?? "Google ile giriş başlatılamadı.");
  }
}

export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {}
}
**/
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInWithGoogle = signInWithGoogle;
exports.configureGoogleSignIn = configureGoogleSignIn;
async function signInWithGoogle() {
    throw new Error("Google ile giriş bu sürümde aktif değil. Lütfen e-posta ve şifre ile giriş yap.");
}
function configureGoogleSignIn() {
    return null;
}
