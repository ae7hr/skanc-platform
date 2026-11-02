import { requireChatGPTUser } from "./chatgpt-auth";
import Skanc from "../src/Skanc";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireChatGPTUser("/");
  return <Skanc />;
}
