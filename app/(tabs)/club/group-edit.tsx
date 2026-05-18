import { Redirect, useLocalSearchParams } from "expo-router";

/** @deprecated Use group-create or group-detail */
export default function ClubGroupEditRedirect() {
  const { clubId, groupId } = useLocalSearchParams<{
    clubId?: string;
    groupId?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: "/(tabs)/club/group-create",
        params: { clubId: clubId ?? "", groupId: groupId ?? "A" },
      }}
    />
  );
}
