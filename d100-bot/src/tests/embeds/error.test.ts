import { assertEquals, assert } from '@std/assert';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { COLORS, EMOJI } from '../../constants.ts';

Deno.test('buildErrorEmbed — sets ERROR color', () => {
  const data = buildErrorEmbed('Something went wrong').toJSON();
  assertEquals(data.color, COLORS.ERROR);
});

Deno.test('buildErrorEmbed — title contains cross emoji', () => {
  const data = buildErrorEmbed('oops').toJSON();
  assert(data.title?.includes(EMOJI.cross), `Title "${data.title}" should contain ${EMOJI.cross}`);
});

Deno.test('buildErrorEmbed — description matches provided message', () => {
  const msg = 'No account found. Run /register first.';
  const data = buildErrorEmbed(msg).toJSON();
  assertEquals(data.description, msg);
});
