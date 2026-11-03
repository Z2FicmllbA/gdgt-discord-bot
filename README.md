# gdgt-discord-bot
WIP; Using Node.js v24.18.0

Dev portal setup: in the OAuth2 tab under OAuth2 URL Generator enable: `applications.commands` and `bot`. For the bot permissions just tick off `Administrator`.

Discord server setup: move the bot role all the way up; under Server Settings/Apps/Integrations manage the bot by making all channels unavailable and add the bot channel(s) as the only one(s) available; and don't forget to set the Server Member role ID in the .env file if you haven't already.

## Setup (temporary, will add Docker components and change this)
1. Run `npm install` to get all needed packages
2. Create or add the .env file in the source directory
3. Make sure mongod.exe is running
4. Run `npm run start`

## Commands
WIP, a lot of inconsistent terms & naming; fields with the question mark (?) at the end are not required

some commands contain a dialog box to confirm the action

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

* `/event-blacklist-role [@role] [state]` - Mark a role on the server as blacklisted for the active event. User with blacklisted roles will not be able to create/join teams or receive any invites.

* `/event-archive [tag] [state]` - Archive/unarchive an event. Archived events will be locked from any changes both by admins and participants.


### Team management
These commands can only be done in the registrations phase of any respective event.

// TO DO: listen for users leaving the guild & if they are the captain of a team in an active event make someone else the captain (sounds like a pain)

* `/team-create [name] [tag]` - Create a new team for the active event with yourself as the captain.

* `/team-disband [name] [tag]` - Disband your team from the active event (only for captains).

* `/team-info [tag]` - Show general info about a specific team. Captains, when checking their own team, can also see the sent invites. This command is available to everyone at any time and will return an ephemeral answer.

* `/team-invite [@member]` - Send an invite for your team to a free agent. Run the command again to cancel the invite.
// TO DO: in /profile ONLY the user needs to see which teams he got invited by

* `/team-join [tag]` - Join a team you've been invited to.
// TO DO: Joining the team voids all invites to this user for the respective event

* `/team-leave` - Leave your current team (captains excluded).


### Utility
TO DO: add a cooldown for non-ephemeral user commands
* `/roll [max-value?]` - Roll a number between 0-100 (or to whatever number instead).