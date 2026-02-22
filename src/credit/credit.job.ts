import cron from 'node-cron';
import { resetCredits } from './credit.lib';

export function initRestatCreditJob() {
	cron.schedule('0 0 * * * *', resetCredits);
}
