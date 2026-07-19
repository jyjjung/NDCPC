'use client';

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { Logo } from '@/components/Logo';
import { BackLink } from '@/components/BackLink';
import { useTranslation } from '@/context/LocaleProvider';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-8">
        <BackLink href="/sign-in" />
        <div className="flex flex-col items-center space-y-3 text-center">
          <Logo size="lg" />
          <h1 className="font-headline text-2xl font-semibold tracking-tight">
            {t('auth.forgotPassword')}
          </h1>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
