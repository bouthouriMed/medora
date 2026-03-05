import { useGetDoctorRatingSummariesQuery } from '../api';
import { useTranslation } from 'react-i18next';

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < Math.round(value) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function DoctorRatings() {
  const { t } = useTranslation();
  const { data: summaries = [], isLoading } = useGetDoctorRatingSummariesQuery(undefined);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2].map((i) => <div key={i} className="h-60 skeleton rounded-2xl"></div>)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('ratings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('ratings.subtitle')}</p>
      </div>

      {(summaries as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <span className="text-5xl block mb-3">⭐</span>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ratings.noRatings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(summaries as any[]).map((s: any) => (
            <div key={s.doctor.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {s.doctor.firstName[0]}{s.doctor.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Dr. {s.doctor.firstName} {s.doctor.lastName}</h3>
                  {s.doctor.specialty && <p className="text-sm text-gray-500 dark:text-gray-400">{s.doctor.specialty}</p>}
                  <p className="text-xs text-gray-400">{s.count} {t('ratings.reviews')}</p>
                </div>
              </div>

              {s.averages ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('ratings.overall')}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={s.averages.overall} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.averages.overall}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('ratings.bedsideManner')}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={s.averages.bedsideManner} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.averages.bedsideManner}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('ratings.waitTime')}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={s.averages.waitTime} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.averages.waitTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('ratings.clarity')}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={s.averages.clarity} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.averages.clarity}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('ratings.noRatingsYet')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
