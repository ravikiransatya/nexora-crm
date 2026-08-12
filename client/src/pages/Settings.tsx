import { useAuth } from "@/context/AuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your account details.</p>
      </div>
      <Card className="max-w-md">
        <CardHeader><h2 className="text-sm font-semibold">Profile</h2></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium text-gray-800 dark:text-gray-200">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-medium text-gray-800 dark:text-gray-200">{user?.email}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Role</span><Badge tone="blue">{user?.role}</Badge></div>
        </CardBody>
      </Card>
    </div>
  );
}
