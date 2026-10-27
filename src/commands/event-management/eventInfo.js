import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js"

import { EventModel } from "../../models/eventModel.js";
import { LoadActiveEvent } from "../../utility/loadActiveEvent.js";
import { ErrorEmbed, EmbedColors } from "../../utility/followUpEmbed.js";

export const data = new SlashCommandBuilder()
    .setName('event-info')
    .setDescription('Get all important info about an event.')
    .addStringOption(option =>
        option.setName('tag')
            .setDescription('The unique tag of the event.')
            .setRequired(false)
    )
    .addBooleanOption(option =>
        option.setName('show-stage-order')
            .setDescription('Optional flag, mostly for debugging purposes.')
            .setRequired(false)
    );

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let event;
    let eventId = interaction.options.getString('tag');
    if (eventId) {
        eventId = eventId.toUpperCase();
        event = await EventModel.findById(eventId);
    } else {
        event = await LoadActiveEvent(interaction.guild.id);
    }

    if (!event) {
        let errorMessage = `No event found with the id ${eventId}.`;
        if (!eventId) {
            errorMessage = `No active event set for the guild **${interaction.guild.name}**.`;
        }

        await interaction.followUp({ embeds: [ErrorEmbed(errorMessage)] });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(event.name)
        .setDescription(String(event._id))
        .setColor(EmbedColors.INFO);
    
    // Participant role
    embed.addFields(
        { name: 'Role', value: `<@&${event.roleId}>` }
    );

    // Archive state
    if (event.archiveState) {
        embed.addFields(
            { name: 'Archived', value: String(event.archiveState) }
        ).setColor(EmbedColors.INACTIVE);
    }

    // General settings
    embed.addFields(
        {
            name: 'Team size',
            value: `${event.teamSizeMin}-${event.teamSizeMax}`,
            inline: true,
        },
        {
            name: 'Registrations open',
            value: String(event.registrationsState),
            inline: true,
        },
        {
            name: 'Submissions open',
            value: String(event.submissionsState),
            inline: true,
        },
    );

    // Stages 
    // TO DO: add number of entries to all stages
    const stages = event.stages;
    stages.sort((a, b) => a.stageOrder - b.stageOrder);

    let stagesString = '';
    const showStageOrder = interaction.options.getBoolean('show-stage-order');

    if (!showStageOrder) {
        stages.forEach(stage => {
            stagesString += `- ${stage.stageName}\n`;
        });
    } else {
        stages.forEach(stage => {
            stagesString += `- ${stage.stageName} (${stage.stageOrder})\n`;
        });
    }

    embed.addFields(
        { name: 'Stages', value: stagesString }
    );

    await interaction.followUp({ embeds: [embed] });
}