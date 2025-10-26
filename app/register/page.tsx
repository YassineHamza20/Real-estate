'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth';
import { AlertCircle, Building2, CheckCircle2, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'buyer',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load saved state on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pending_confirmation_email');
    if (savedEmail) {
      setSuccess(true);
      setUserEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      });
      
      // Show success message and save to localStorage
      setSuccess(true);
      setUserEmail(formData.email);
      localStorage.setItem('pending_confirmation_email', formData.email);
      
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'buyer',
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await authApi.resendConfirmationEmail(userEmail);
      alert('Confirmation email sent! Please check your inbox.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  // Clear the saved state when user navigates away or manually
  const clearPendingConfirmation = () => {
    localStorage.removeItem('pending_confirmation_email');
    setSuccess(false);
    setUserEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Enhanced Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-3xl bg-primary/10 shadow-lg">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold">RealEstate Pro</h1>
              <p className="text-muted-foreground text-sm mt-2">Premium Property Platform</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-balance leading-tight">
              Start your 
              <span className="text-primary"> real estate journey</span> today
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join thousands of buyers and sellers who trust RealEstate Pro for their property needs.
            </p>
          </div>

          {/* Enhanced Features List */}
          <div className="space-y-4 pt-6">
            {[
              { title: 'Free to Join', description: 'No credit card required, start browsing immediately' },
              { title: 'Verified Listings', description: 'Access thousands of verified property listings' },
              { title: 'Expert Support', description: 'Get help from our team of real estate professionals' },
              { title: 'Secure Platform', description: 'Your data is protected with enterprise-grade security' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Enhanced Register Form */}
        <Card className="w-full border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center gap-3 mb-2 lg:hidden">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">RealEstate Pro</CardTitle>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold">
                {success ? 'Check Your Email' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-lg">
                {success 
                  ? 'Almost there! Confirm your email to get started' 
                  : 'Join RealEstate Pro to start exploring properties'
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          {/* Enhanced Success Message */}
          {success && (
            <div className="mx-6 mb-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Registration Successful!
                  </h3>
                  <div className="text-green-700 space-y-3">
                    <p>
                      We've sent a confirmation email to <strong>{userEmail}</strong>. 
                      Please check your inbox and click the confirmation link to activate your account.
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resendLoading}
                        className="block text-sm text-green-800 hover:text-green-900 underline disabled:opacity-50 transition-colors"
                      >
                        {resendLoading ? 'Sending...' : 'Didn\'t receive the email? Click here to resend.'}
                      </button>
                      <button
                        type="button"
                        onClick={clearPendingConfirmation}
                        className="block text-sm text-green-800 hover:text-green-900 underline transition-colors"
                      >
                        Register with a different email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-2 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Enhanced Form Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="font-medium">First Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10 border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="font-medium">Last Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10 border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="username" className="font-medium">Username</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10 border-2 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10 border-2 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="font-medium">Phone Number (optional)</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+49 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isLoading}
                      className="h-11 pl-10 border-2 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="password" className="font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10 pr-12 border-2 focus:border-primary/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10 pr-12 border-2 focus:border-primary/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-medium">Already have an account?</span>
                  </div>
                </div>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full h-12 text-base font-medium bg-background border-2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}