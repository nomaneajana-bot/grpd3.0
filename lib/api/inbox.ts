import type { InboxResult } from "../../types/api";
import type { ApiClient } from "./client";

export async function getInbox(client: ApiClient): Promise<InboxResult> {
  return await client.request<InboxResult>("/api/v1/me/inbox", {
    method: "GET",
  });
}
