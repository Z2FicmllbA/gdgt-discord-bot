import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

export function ProfanityCheck(text) {
	const matcher = new RegExpMatcher({
		...englishDataset.build(),
		...englishRecommendedTransformers,
	});

	return matcher.hasMatch(text);
}