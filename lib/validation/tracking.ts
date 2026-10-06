import { z } from 'zod'

export const locationPayloadSchema = z.object({
  token: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().nullable().optional(),
  speedKmh: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  recordedAt: z.string().datetime(),
})

export type LocationPayload = z.infer<typeof locationPayloadSchema>
