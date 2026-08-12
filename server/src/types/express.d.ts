declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        email: string;
      };
      cookies?: Record<string, string | undefined>;
    }
  }
}

export {};
