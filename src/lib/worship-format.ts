import type { TranslationKey } from '@/i18n/translations';
import type { WorshipFormatItem } from '@/lib/types';
import type { ScheduleRoleKey } from '@/lib/schedule-roles';

export const WEEKLY_WORSHIP_FORMAT_ID = 'weekly';

export const SERVICE_STEP_IDS = [
  'freePlay',
  'worshipPrayer',
  'snack',
  'offeringPrayer',
  'sermonActivity',
  'chant',
  'specialActivity',
] as const;

export type ServiceStepId = (typeof SERVICE_STEP_IDS)[number];

type ServiceStepDefinition = WorshipFormatItem & {
  id: ServiceStepId;
  roles?: ScheduleRoleKey[];
};

export const DEFAULT_SERVICE_STEPS: ServiceStepDefinition[] = [
  { id: 'freePlay', timeFrom: '11:00', timeTo: '11:15' },
  { id: 'worshipPrayer', timeFrom: '11:15', timeTo: '11:30', roles: ['worship'] },
  { id: 'snack', timeFrom: '11:30', timeTo: '11:45' },
  { id: 'offeringPrayer', timeFrom: '11:45', timeTo: '11:50', roles: ['offering'] },
  { id: 'sermonActivity', timeFrom: '11:50', timeTo: '12:30', roles: ['sermon'] },
  { id: 'chant', timeFrom: '12:30', timeTo: '12:35', roles: ['chant'] },
  { id: 'specialActivity', timeFrom: '12:35', timeTo: '13:00', roles: ['activity'] },
];

const LEGACY_LABEL_TO_STEP_ID: Record<string, ServiceStepId> = {
  worship: 'worshipPrayer',
  offering: 'offeringPrayer',
  sermon: 'sermonActivity',
  chant: 'chant',
  activity: 'specialActivity',
};

export function getServiceStepLabelKey(id: ServiceStepId): TranslationKey {
  return `service.step.${id}` as TranslationKey;
}

export function resolveServiceSteps(
  storedItems?: WorshipFormatItem[] | string[] | null
): ServiceStepDefinition[] {
  const normalized = normalizeWorshipFormatItems(storedItems);
  const storedById = new Map<string, WorshipFormatItem>();

  for (const item of normalized) {
    const stepId = item.id ?? LEGACY_LABEL_TO_STEP_ID[item.label ?? ''];
    if (stepId) storedById.set(stepId, item);
  }

  return DEFAULT_SERVICE_STEPS.map((defaultStep) => {
    const stored = storedById.get(defaultStep.id);
    if (!stored) return defaultStep;
    return {
      ...defaultStep,
      timeFrom: stored.timeFrom ?? defaultStep.timeFrom,
      timeTo: stored.timeTo ?? defaultStep.timeTo,
    };
  });
}

export function normalizeWorshipFormatItems(
  items: WorshipFormatItem[] | string[] | undefined | null
): WorshipFormatItem[] {
  if (!items) return [];
  return items.map((item) => {
    if (typeof item === 'string') {
      const stepId = LEGACY_LABEL_TO_STEP_ID[item];
      return stepId ? { id: stepId } : { id: 'freePlay', label: item };
    }
    if (!item.id && item.label && LEGACY_LABEL_TO_STEP_ID[item.label]) {
      return { ...item, id: LEGACY_LABEL_TO_STEP_ID[item.label] };
    }
    return item;
  });
}

export function formatWorshipFormatLabel(
  item: WorshipFormatItem,
  t: (key: TranslationKey) => string
) {
  if (item.id && SERVICE_STEP_IDS.includes(item.id as ServiceStepId)) {
    return t(getServiceStepLabelKey(item.id as ServiceStepId));
  }
  if (item.label) return item.label;
  return '';
}

export function formatWorshipFormatTimeRange(item: WorshipFormatItem) {
  const { timeFrom, timeTo } = item;
  if (timeFrom && timeTo) return `${timeFrom} – ${timeTo}`;
  if (timeFrom) return timeFrom;
  if (timeTo) return timeTo;
  return null;
}

export function getStepRoles(item: WorshipFormatItem): ScheduleRoleKey[] {
  if (item.roles?.length) return item.roles;
  const defaultStep = DEFAULT_SERVICE_STEPS.find((step) => step.id === item.id);
  return defaultStep?.roles ?? [];
}

export function createWorshipFormatItem(id: ServiceStepId): WorshipFormatItem {
  const defaultStep = DEFAULT_SERVICE_STEPS.find((step) => step.id === id);
  return {
    id,
    timeFrom: defaultStep?.timeFrom ?? '',
    timeTo: defaultStep?.timeTo ?? '',
    roles: defaultStep?.roles,
  };
}
