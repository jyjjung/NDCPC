'use client';

import { PublicShell } from '@/components/PublicShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function HowItWorksPage() {
  const { t } = useTranslation();

  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <PublicShell title={t('howItWorks.title')} backHref="/welcome">
      <div className="space-y-8">
        <p className="text-muted-foreground">{t('howItWorks.intro')}</p>
        <ol className="space-y-6">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {index + 1}
              </span>
              <div className="space-y-1">
                <h2 className="font-medium">{t(`howItWorks.${step}Title`)}</h2>
                <p className="text-sm text-muted-foreground">{t(`howItWorks.${step}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </PublicShell>
  );
}
