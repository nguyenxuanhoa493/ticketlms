import { redirect } from "next/navigation";

export default function ToolsPage() {
    // Redirect to API Runner as default page
    redirect("/tools/api-runner");
}
