import { AttachmentBuilder } from 'discord.js';

export const LOGO_PATH = new URL('../../assets/logo.png', import.meta.url).pathname;
export const LOGO_ATTACHMENT_NAME = 'logo.png';

export function createLogoAttachment(): AttachmentBuilder {
  return new AttachmentBuilder(LOGO_PATH, { name: LOGO_ATTACHMENT_NAME });
}
