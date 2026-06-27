'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicShell } from '@/components/PublicShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function WelcomePage() {
  const { t } = useTranslation();

  return (
    <PublicShell>
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t('welcome.tagline')}
          </p>
          <h1 className="font-headline text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t('welcome.title')}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t('welcome.description')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">{t('auth.createAccount')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">{t('common.signIn')}</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/how-it-works" className="hover:text-foreground">
            {t('welcome.howItWorks')}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t('welcome.privacyPolicy')}
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
