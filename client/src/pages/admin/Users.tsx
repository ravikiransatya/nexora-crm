import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { User } from "@/types";
import { formatDate } from "@/lib/format";

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
}

export default function Users() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<{ data: User[] }>("/users")).data.data,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage internal team access and roles.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New User</Button>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !users || users.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800/60">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-5 py-3"><Badge tone="blue">{u.role}</Badge></td>
                    <td className="px-5 py-3"><Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-5 py-3 text-gray-400">{(u as any).createdAt ? formatDate((u as any).createdAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <UserModal onClose={() => setModalOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["users"] })} />
      )}
    </div>
  );
}

function UserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<UserForm>({ defaultValues: { role: "SALES" } });

  async function onSubmit(values: UserForm) {
    setSubmitting(true);
    try {
      await api.post("/users", values);
      toast.success("User created successfully.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to create user"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <Input label="Name" required {...register("name", { required: true })} />
          <Input label="Email" type="email" required {...register("email", { required: true })} />
          <Input label="Password" type="password" required {...register("password", { required: true, minLength: 6 })} />
          <Select label="Role" {...register("role")}>
            <option value="ADMIN">Admin</option>
            <option value="SALES">Sales</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="ACCOUNTS">Accounts</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create User</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
