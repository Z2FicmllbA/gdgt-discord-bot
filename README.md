# gdgt-discord-bot
WIP; Using Node.js v24.18.0

Dev portal setup: in the OAuth2 tab under OAuth2 URL Generator enable: `applications.commands` and `bot`. For the bot permissions just tick off `Administrator`. // TO DO: remove admin permissions so the bot can be confined to separate channels (and not be used to spam in general)

Discord server setup: move the bot role all the way up, and don't forget to set the Server Member role ID in the .env file if you haven't already.

## Setup (temporary, will add Docker components and change this)
1. Run `npm install` to get all needed packages
2. Create or add the .env file in the source directory
3. Make sure mongod.exe is running
4. Run `npm run start`

## Commands
WIP; fields with the question mark (?) at the end are not required

some commands contain a dialog box to confirm the action // TO DO: test the collector filter

### Event management
* `/event-create [name] [tag] [default-stage?]` - Create an event with a unique alphanumerical tag. The first stage is set by default to Qualifiers.

* `/event-delete [tag]` - Delete the event with the given tag.

* `/event-info [tag?]` - Show general info about the active event. Additionally providing a tag will instead search for that event instead. This command is available to everyone and will return an ephemeral answer.

* `/event-set-active [tag]` - Set the event as active/default for the current server. This means that all commands submitted by participants in the server will automatically be attached to this event.

* `/event-team-size [min] [max]` - Change the team size values of the active event. The defaults when creating any event are `min: 2`, `max: 5`.

* `/event-registrations-state [state]` - Change the registrations state of the active event. Participants will be able to register teams only while the registrations are open. False by default.

* `/event-submissions-state [state]` - Change the submissions state of the active event. Participants will be able to submit entries only while the submissions are open. False by default.

* `/event-stage [name] [order]` - Modify a given stage of the active event. This command has different actions:
    - If the provided name is unique, create a new stage
    - If the provided order is 0, delete the stage with the provided name
    - All other cases will update the stage with the provided name

* `/event-archive [tag] [state]` - Archive/unarchive an event. Archived events will be locked from any changes both by admins and participants.


### Team management

* `/team-create [name] [tag]` - Create a new team for the active event with yourself as the captain. Can only be done in the registrations phase.

* `/team-disband [name] [tag]` - Disband your team from the active event (only for captains). Can only be done in the registrations phase.


### Utility
// TO DO: add a cooldown for non-ephemeral user commands
* `/roll [max-value?]` - Roll a number between 0-100 (or to whatever number instead).