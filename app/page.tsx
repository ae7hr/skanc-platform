import AuthGate from "../src/AuthGate";
import Skanc from "../src/Skanc";
export const dynamic = "force-dynamic";
export default async function Page() {

  return <AuthGate><Skanc /></AuthGate>;
}
