import { MAILHOG_URL } from '../src/libs/config.js';
import { EmailHug } from './types/MailHug';

const getLastEmail = async (): Promise<EmailHug> => {
  const response = await fetch(`${MAILHOG_URL}/messages?limit=1`);
  const data = await response.json();
  return data[0];
};

export default getLastEmail;
