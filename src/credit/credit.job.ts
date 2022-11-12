import cron from "node-cron";
import { setUserCredit } from "./credit.lib";

export function initRestatCreditJob() {
  cron.schedule("0 0 * * * *", setUserCredit);
}
