import 'dotenv/config';

export function WhitelistCheck(userId) {
	const useWhitelists = process.env.USE_WHITELISTS.toLowerCase();
	if (useWhitelists === 'true') {
		const whitelistedAdminIds = process.env.WHITELISTED_ADMIN_IDS.split(',');
		return whitelistedAdminIds.includes(userId);
	}
	return true;
}