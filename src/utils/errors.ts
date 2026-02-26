
export interface ValidationErrorDetail {
    field: string;
    message: string;
  }

export class AppError extends Error {
    public statusCode: number;
    public code: string;
  
    constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  
  export class ValidationError extends AppError {
    public details?: ValidationErrorDetail[];
  
    constructor(message: string, details?: ValidationErrorDetail[]) {
      super(message, 400, "VALIDATION_ERROR");
      this.details = details;
    }
  }