import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "spending"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const TransactionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "spending"]),
  amount: z.number().int().positive("Amount must be positive"),
  categoryId: z.number().int().positive("Category ID must be positive"),
  notes: z.string().optional().nullable(),
  transactionDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;

export const UpdateCategorySchema = CategorySchema.partial();
export const UpdateTransactionSchema = TransactionSchema.partial();

export function validateCategory(data: unknown) {
  return CategorySchema.safeParse(data);
}

export function validateTransaction(data: unknown) {
  return TransactionSchema.safeParse(data);
}

export function validateUpdateCategory(data: unknown) {
  return UpdateCategorySchema.safeParse(data);
}

export function validateUpdateTransaction(data: unknown) {
  return UpdateTransactionSchema.safeParse(data);
}
