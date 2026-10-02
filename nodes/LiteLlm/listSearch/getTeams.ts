import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { liteLlmApiRequest } from '../shared/transport';

type Team = { team_id?: string; team_alias?: string };

/** Teams on the proxy, as shown by GET /team/list. */
export async function getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await liteLlmApiRequest.call(this, 'GET', '/team/list')) as
		| Team[]
		| { teams?: Team[] };

	const teams = Array.isArray(response) ? response : (response?.teams ?? []);

	return teams
		.filter((team): team is Team & { team_id: string } => Boolean(team?.team_id))
		.map((team) => ({
			name: team.team_alias ? `${team.team_alias} (${team.team_id})` : team.team_id,
			value: team.team_id,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}
