import cron from 'node-cron';
import { performDayRollover } from '../services/rolloverService.js';
import { getNextRolloverTime, getBusinessDate } from '../utils/businessDate.js';

let rolloverTask = null;

/**
 * Initializes scheduled background jobs
 * 
 * Requirement 4:
 * Auto-Save at 4:00 AM (Day Rollover)
 * Uses node-cron to schedule a job that runs every day at 4:00 AM ('0 4 * * *').
 */
export function initCronJobs() {
  // Cron syntax: 0 4 * * * (At 04:00 every day)
  rolloverTask = cron.schedule('0 4 * * *', async () => {
    const triggerTime = new Date();
    console.log(`[node-cron] ⏰ 4:00 AM Day-Rollover Cron Job Triggered at ${triggerTime.toISOString()}`);

    try {
      const result = await performDayRollover('cron-4am');
      console.log(`[node-cron] ✅ 4:00 AM Day-Rollover Completed Successfully:`, result.message);
    } catch (err) {
      console.error(`[node-cron] ❌ Failed to execute 4:00 AM rollover:`, err);
    }
  }, {
    scheduled: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
  });

  const nextExecution = getNextRolloverTime();
  console.log(`[node-cron] ⏳ Daily 4:00 AM Rollover Job scheduled.`);
  console.log(`[node-cron] 📅 Next execution at: ${nextExecution.toLocaleString()} (Local Timezone)`);

  return rolloverTask;
}

export function getCronStatus() {
  const next = getNextRolloverTime();
  return {
    jobName: '4:00 AM Business Day Rollover',
    schedule: '0 4 * * * (Every day at 04:00 AM)',
    isActive: rolloverTask !== null,
    nextExecution: next.toISOString(),
    nextExecutionFormatted: next.toLocaleString(),
    currentBusinessDate: getBusinessDate(),
  };
}
