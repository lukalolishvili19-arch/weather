import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ActionButton, SurfaceCard } from "@/features/weather-dashboard/ui/components/primitives";

import { useAuth } from "../model/auth-context";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  return "Unable to create account. Please try again.";
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await registerUser(values.email, values.password, values.name || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  return (
    <div className="grid min-h-screen place-items-center bg-[#070b18] px-4 font-['Manrope',sans-serif] text-[#e8edf8]">
      <SurfaceCard className="w-full max-w-md">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7921e]">
          SkyCast
        </p>
        <h1 className="mb-1 text-2xl font-black tracking-[-0.4px]">Create account</h1>
        <p className="mb-6 text-sm text-[#7a8ba8]">Register to save favorites, alerts, and settings.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#7a8ba8]">Name</span>
            <input
              type="text"
              autoComplete="name"
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-[#f7921e]/40"
              {...register("name")}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#7a8ba8]">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-[#f7921e]/40"
              {...register("email", { required: true })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#7a8ba8]">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-[#f7921e]/40"
              {...register("password", { required: true, minLength: 8 })}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <ActionButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full justify-center"
          >
            {isSubmitting ? "Creating…" : "Create account"}
          </ActionButton>
        </form>
        <p className="mt-5 text-center text-sm text-[#7a8ba8]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#f7921e]" to="/login">
            Sign in
          </Link>
        </p>
      </SurfaceCard>
    </div>
  );
}
