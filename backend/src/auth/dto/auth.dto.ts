export class SignupDto {
  email: string;
  password: string;
  name?: string;
}

export class SigninDto {
  email: string;
  password: string;
}

export class AuthResponseDto {
  user: {
    id: number;
    email: string;
    name?: string;
  };
}
