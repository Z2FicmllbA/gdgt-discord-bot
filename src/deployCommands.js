import { REST, Routes } from 'discord.js';
import 'dotenv/config';

import { LoadCommands } from './utility/loadCommands.js';

const commands = [];
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
	try {
		const commandsArray = await LoadCommands();
		for (let i = 0; i < commandsArray.length; i++) {
			commands.push(commandsArray[i].data.toJSON());
		}

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) { console.error(error); }
})();