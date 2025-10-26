'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  MailCheck, 
  Shield, 
  Rocket, 
  Users,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Building2
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function ConfirmEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);

  // Separate effect for countdown - only runs when status is success
  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Use setTimeout to defer router.push outside of state update
          setTimeout(() => {
            router.push('/dashboard');
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, router]);

  // Separate effect for progress animation
  useEffect(() => {
    if (status !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [status]);

  // Main email confirmation effect
  useEffect(() => {
    let mounted = true;

    const confirmEmail = async () => {
      try {
        const uid = params.uid as string;
        const token = params.token as string;

        if (!uid || !token) {
          throw new Error('Invalid confirmation link');
        }

        // Call your actual API
        await authApi.confirmEmail(uid, token);

        if (!mounted) return;

        setProgress(100);
        
        // Use setTimeout to defer state update
        setTimeout(() => {
          if (!mounted) return;
          setStatus('success');
          setMessage('Your email has been successfully verified! Welcome to RealEstate Pro.');
        }, 500);

      } catch (error) {
        if (!mounted) return;
        
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'Email confirmation failed. The link may be invalid or expired.'
        );
        setProgress(0);
      }
    };

    confirmEmail();

    return () => {
      mounted = false;
    };
  }, [params.uid, params.token]);

  const handleNavigation = (path: string) => {
    // Use setTimeout to defer navigation
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const features = [
    { icon: Shield, text: 'Secure Account Protection' },
    { icon: Users, text: 'Explore Properties' },
    { icon: Rocket, text: 'Save Your Favorites' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="secondary" className="px-4 py-2 bg-primary/10 backdrop-blur-sm border-primary/20">
            <MailCheck className="w-4 h-4 mr-2 text-primary" />
            <span className="text-foreground">Email Verification</span>
          </Badge>
        </div>

        <Card className="border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-primary/10 shadow-lg">
                <MailCheck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold">
                {status === 'loading' && 'Verifying Your Account'}
                {status === 'success' && 'Welcome Aboard!'}
                {status === 'error' && 'Verification Issue'}
              </CardTitle>
              <CardDescription className="text-lg">
                {status === 'loading' && 'Securing your RealEstate Pro account...'}
                {status === 'success' && 'Your journey begins now'}
                {status === 'error' && 'Let us help you get back on track'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Progress Bar for Loading State */}
            {status === 'loading' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Verification Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-primary/10 [&>div]:bg-primary" />
                </div>
                
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">Securing Your Account</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We're verifying your email address and setting up your secure RealEstate Pro account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Success State */}
            {status === 'success' && (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center shadow-lg border-2 border-green-200">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Rocket className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Email Verified Successfully!</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {message}
                    </p>
                  </div>

                  {/* Features Unlocked */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-all duration-300">
                        <feature.icon className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Countdown */}
                  <div className="pt-4">
                    <div className="inline-flex items-center space-x-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/20">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="font-medium">Redirecting in {countdown}s</span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {status === 'error' && (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center shadow-lg border-2 border-red-200">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Verification Failed</h3>
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-left">
                      <AlertDescription className="text-red-700">{message}</AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      Don't worry, we're here to help you get access to your account.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                      <Button 
                        onClick={() => handleNavigation('/login')}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white border-primary shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        Go to Login
                      </Button>
                      <Button 
                        onClick={() => handleNavigation('/register')}
                        variant="outline"
                        className="w-full h-12 border-primary/20 text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
                        size="lg"
                      >
                        Create New Account
                      </Button>
                      <Button 
                        onClick={() => window.location.reload()}
                        className="w-full h-12 bg-muted hover:bg-muted/80 text-foreground border-muted-foreground/20 transition-all duration-300"
                        size="lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => handleNavigation('/contact')}
                        variant="ghost"
                        className="w-full h-12 text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-300"
                        size="lg"
                      >
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Get Help
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <span>Need assistance?</span>
            <a 
              href="mailto:yassinehamza.pro@gmail.com" 
              className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center space-x-1"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © 2024 RealEstate Pro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}