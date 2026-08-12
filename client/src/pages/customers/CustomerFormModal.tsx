import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Customer } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Customer name is required"),
  mobile: z.string().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]),
  address: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CustomerFormModal({
  open,
  onClose,
  onSaved,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customer?: Customer | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerType: "RETAIL", status: "LEAD" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? "",
        mobile: customer?.mobile ?? "",
        email: customer?.email ?? "",
        businessName: customer?.businessName ?? "",
        gstNumber: customer?.gstNumber ?? "",
        customerType: customer?.customerType ?? "RETAIL",
        status: customer?.status ?? "LEAD",
        address: customer?.address ?? "",
        followUpDate: customer?.followUpDate ? customer.followUpDate.slice(0, 10) : "",
        notes: customer?.notes ?? "",
      });
    }
  }, [open, customer, reset]);

  if (!open) return null;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (customer) {
        await api.patch(`/customers/${customer.id}`, values);
        toast.success("Customer updated successfully.");
      } else {
        await api.post("/customers", values);
        toast.success("Customer created successfully.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to save customer"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {customer ? "Edit Customer" : "Add Customer"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" required {...register("name")} error={errors.name?.message} />
            <Input label="Mobile Number" required {...register("mobile")} error={errors.mobile?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
            <Input label="Business Name" {...register("businessName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Number" {...register("gstNumber")} />
            <Select label="Customer Type" {...register("customerType")}>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Status" {...register("status")}>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Input label="Follow-up Date" type="date" {...register("followUpDate")} />
          </div>
          <Textarea label="Address" {...register("address")} />
          <Textarea label="Notes" {...register("notes")} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {customer ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
