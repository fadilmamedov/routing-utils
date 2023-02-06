import { api } from "./api";

type LoginResponse = {
  token: {
    token: string;
  };
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
};

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>("api/v1/tokens", {
    user: {
      email,
      password,
    },
  });

  return response.data;
}
