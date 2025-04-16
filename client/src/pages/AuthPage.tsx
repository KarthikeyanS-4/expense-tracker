import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import axios from "../api/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { isAuthenticated, login  } = useAuth();

  // Determine which tab to show based on the URL path
  const defaultTab = location.pathname === "/signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const onSubmitLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await axios.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      // Assume token is in response.data.token
      login(response.data.data.token);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(
        error.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await axios.post("/auth/signup", {
        name: data.name,
        email: data.email,
        password: data.password,
        // confirmPassword not sent to API
      });

      // Assume token is in response.data.token
      login(response.data.data.token);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(
        error.response?.data?.message ||
          "Failed to create account. This email may already be in use."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setAuthError(null);
    if (value === "login") {
      navigate("/login", { replace: true });
    } else {
      navigate("/signup", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left column: branding */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-primary text-white py-12 px-8">
        <Link to="/" className="mb-6">
          <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">
            ExpenseTracker
          </h1>
        </Link>
        <p className="mt-6 text-lg font-medium opacity-90 max-w-md text-center">
          Take control of your finances.<br />
          Simple, fast, and secure.
        </p>
        {/* Optionally, insert an image or illustration below */}
        {/* <img src="/illustration.svg" alt="App illustration" className="mt-8 w-3/4"/> */}
      </div>

      {/* Right column: auth forms */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          {/* Only show app name on mobile for right column */}
          <div className="md:hidden text-center mb-6">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-primary">ExpenseTracker</h1>
            </Link>
          </div>
          <div className="text-center">
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {activeTab === "login" ? "Welcome back" : "Welcome"}
            </h2>
            <p className="mt-2 text-gray-600">
              {activeTab === "login"
                ? "Sign in to your account to continue"
                : "Create an account to get started"}
            </p>
          </div>
          <Card className="shadow-lg">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <CardHeader className="space-y-1 pb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                {authError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login" className="mt-0">
                  <form
                    onSubmit={loginForm.handleSubmit(onSubmitLogin)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        {...loginForm.register("email")}
                        disabled={isLoading}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                        disabled={isLoading}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form
                    onSubmit={signupForm.handleSubmit(onSubmitSignup)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        {...signupForm.register("name")}
                        disabled={isLoading}
                      />
                      {signupForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        {...signupForm.register("email")}
                        disabled={isLoading}
                      />
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...signupForm.register("password")}
                        disabled={isLoading}
                      />
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...signupForm.register("confirmPassword")}
                        disabled={isLoading}
                      />
                      {signupForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;