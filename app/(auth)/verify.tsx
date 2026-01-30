import { router } from "expo-router";
import { useEffect } from "react";

export default function VerifyScreen() {
  useEffect(() => {
    router.replace("/(auth)/phone");
  }, []);

  return null;
}
