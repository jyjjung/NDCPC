'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';
import { useTranslation } from '@/context/LocaleProvider';

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const formSchema = z.object({
    email: z.string().email(t('auth.emailInvalid')),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      // Avoid revealing whether the email is registered.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSent(true);
      } else {
        setError(t('auth.resetFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('auth.resetEmailSent')}</p>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('auth.forgotPasswordDescription')}</p>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '…' : t('auth.sendResetLink')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
