import { z } from 'zod';
import { mobileInfoSchema, aadharInfoSchema, vehicleInfoSchema, ipInfoSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  insufficientCredits: z.object({
    message: z.string(),
    credits: z.number(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  user: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.object({
          id: z.number(),
          username: z.string(),
          credits: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/user/history',
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  services: {
    mobile: {
      method: 'POST' as const,
      path: '/api/services/mobile',
      input: mobileInfoSchema,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        402: errorSchemas.insufficientCredits,
        401: errorSchemas.unauthorized,
      },
    },
    aadhar: {
      method: 'POST' as const,
      path: '/api/services/aadhar',
      input: aadharInfoSchema,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        402: errorSchemas.insufficientCredits,
        401: errorSchemas.unauthorized,
      },
    },
    vehicle: {
      method: 'POST' as const,
      path: '/api/services/vehicle',
      input: vehicleInfoSchema,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        402: errorSchemas.insufficientCredits,
        401: errorSchemas.unauthorized,
      },
    },
    ip: {
      method: 'POST' as const,
      path: '/api/services/ip',
      input: ipInfoSchema,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        402: errorSchemas.insufficientCredits,
        401: errorSchemas.unauthorized,
      },
    },
  },
};
