import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
// import GoogleIcon from '@mui/icons-material/Google';
import { useState } from "react";

import { useAuth } from "../../state/auth/useAuth";
import { AuthSplitLayout } from "../auth/AuthSplitLayout";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthSplitLayout
      title="Welcome back"
      bullets={["Connect with your team", "Real-time deliverability", "Infrastructure-grade security"] as string[]}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Enter your credentials to access your dashboard.
          </Typography>
        </Stack>

        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await auth.login(values);
              nav("/app/dashboard", { replace: true });
            } catch (e: any) {
              setError("password", {
                message: e?.response?.data?.error ?? "Login failed",
              });
            }
          })}
        >
          <Stack spacing={1.5}>
            <TextField
              label="Email"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register("password")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShow((s) => !s)}
                      edge="end"
                      size="small"
                    >
                      {show ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Remember me"
              />
              <Link
                component="button"
                onClick={() => nav("/forgot-password")}
                underline="hover"
                sx={{ fontWeight: 800 }}
              >
                Forgot password?
              </Link>
            </Stack>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || auth.status === "loading"}
              fullWidth
            >
              Sign in
            </Button>
          </Stack>
        </form>

        <Divider />

        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
          New to ChapMail?{" "}
          <Link
            component="button"
            onClick={() => nav("/register")}
            underline="hover"
            sx={{ fontWeight: 700, color: 'primary.main' }}
          >
            Create an account
          </Link>
        </Typography>
      </Stack>
    </AuthSplitLayout>
  );
}
