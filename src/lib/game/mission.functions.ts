import { createServerFn } from '@tanstack/react-start';
import { generateChatCompletion, GatewayError } from '@lovable.dev/ai-gateway';
import { DEFAULT_MISSION, validateMission } from './mission';

const SYSTEM_PROMPT = `You are the mission designer for Starbound, a 2D-in-3D deep-space arcade flight game. The player flies forward through an endless field; they steer a rocket, fly through glowing cyan gates for points, and shoot or dodge asteroids that damage the hull on impact.

Turn the player's challenge description into a balanced mission. Reply with ONLY a JSON object, no prose, using exactly these keys:
- "name": short uppercase mission title, max 28 characters
- "brief": one atmospheric sentence about this run, max 110 characters
- "objective": one concrete instruction for the player, max 90 characters
- "gateCount": integer 5-20, how many gates per circuit
- "gatePoints": integer 100-500, points per gate
- "gateRadius": number 1.6-3.2, gate size (smaller = harder)
- "rockDensity": number 0.4-2.5, asteroid density multiplier (2.5 = punishing swarm)
- "rockPoints": integer 50-250, points per asteroid destroyed
- "speed": number 0.8-1.5, flight-speed multiplier (1.5 = blazing, 0.8 = leisurely)
- "hull": integer 1-5, hull segments before the flight ends

Balance difficulty honestly: a challenge asking for "brutal" should combine small gates, high density, high speed or low hull, but never every extreme at once. A "relaxing" request gets wide gates, sparse rocks and low speed. Keep flavor serious-toned, space-mission style, no emoji.`;

export type MissionResult = { mission: null; error: string } | { mission: ReturnType<typeof validateMission>; error: null };

function parseModelJson(content: string): unknown {
  const text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export const generateMission = createServerFn({ method: 'POST' })
  .inputValidator((input: { description?: unknown }) => input)
  .handler(async ({ data }): Promise<MissionResult> => {
    const description = typeof data?.description === 'string' ? data.description.trim() : '';
    if (description.length < 3) return { mission: null, error: 'Describe your challenge in a few words first.' };
    if (description.length > 400) return { mission: null, error: 'Keep the mission brief under 400 characters.' };

    try {
      const response = await generateChatCompletion({
        model: 'openai/gpt-6-astra',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Mission request: ${description}` },
        ],
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content;
      const mission = typeof content === 'string' ? validateMission(parseModelJson(content)) : null;
      if (!mission) return { mission: null, error: 'The mission came back unreadable — try describing it a little differently.' };
      return { mission, error: null };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error('Mission generation failed:', error.code, error.httpStatus);
        return { mission: null, error: 'The mission designer is unreachable right now. Try again in a moment.' };
      }
      console.error('Mission generation failed:', error);
      return { mission: null, error: 'The mission designer hit a snag. Try again in a moment.' };
    }
  });

// Re-exported so the client bundle keeps the shared default without importing
// server-only paths.
export { DEFAULT_MISSION };
