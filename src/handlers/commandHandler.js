import { MessageFlags } from 'discord.js';

export async function commandHandler(interaction) {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorMessage);
		}
		else {
			await interaction.reply(errorMessage);
		}
	}
}

const errorMessage = {
	content: 'There was an error executing this command!',
	flags: MessageFlags.Ephemeral,
};