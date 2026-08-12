import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Product } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryName: z.string().optional(),
  warehouseName: z.string().optional(),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

export function ProductFormModal({
  open,
  onClose,
  onSaved,
  product,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name ?? "",
        sku: product?.sku ?? "",
        categoryName: product?.category?.name ?? "",
        warehouseName: product?.warehouse?.name ?? "",
        unitPrice: product ? Number(product.unitPrice) : undefined,
        stock: product?.stock ?? 0,
        minStock: product?.minStock ?? 0,
      } as any);
    }
  }, [open, product, reset]);

  if (!open) return null;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (product) {
        await api.patch(`/products/${product.id}`, values);
        toast.success("Product updated successfully.");
      } else {
        await api.post("/products", values);
        toast.success("Product created successfully.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to save product"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <Input label="Product Name" required {...register("name")} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU / Code" required {...register("sku")} error={errors.sku?.message} />
            <Input label="Unit Price (₹)" type="number" step="0.01" required {...register("unitPrice")} error={errors.unitPrice?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" placeholder="e.g. Electricals" {...register("categoryName")} />
            <Input label="Warehouse" placeholder="e.g. Vadodara Main" {...register("warehouseName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Stock" type="number" required {...register("stock")} error={errors.stock?.message} />
            <Input label="Minimum Stock Alert" type="number" required {...register("minStock")} error={errors.minStock?.message} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
