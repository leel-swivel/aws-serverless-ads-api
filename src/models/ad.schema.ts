import { z } from "zod";

export const createAdSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  imageBase64: z
  .string()
  .regex(
    /^data:image\/(jpeg|jpg|png);base64,/,
    "Image must be a valid base64-encoded JPEG or PNG"
  )
  .optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
