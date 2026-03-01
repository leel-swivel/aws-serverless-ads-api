import { z } from "zod";

export const createAdSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  imageBase64: z.string().optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;