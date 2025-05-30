export const authSchemas = {
  RegisterInput: {
    type: "object",
    required: ["email", "password", "name"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      password: {
        type: "string",
        example: "P@ssw0rd123",
      },
      name: {
        type: "string",
        example: "Nguyen Van A",
      },
    },
  },
  LoginInput: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      password: {
        type: "string",
        example: "P@ssw0rd123",
      },
    },
  },
  ForgotPasswordInput: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
    },
  },
  ResetPasswordInput: {
    type: "object",
    required: ["newPassword", "token"],
    properties: {
      newPassword: {
        type: "string",
        example: "newPassword123",
      },
      token: {
        type: "string",
        example: "reset-token-12345",
      },
    },
  },
};
