// Slug из названия по тем же правилам, что у бэкенда (src/common/utils/slug.util.ts):
// кириллица транслитерируется, остальное — нижний регистр, буквы, цифры и дефисы

const CYRILLIC_TO_LATIN: Record<string, string> = {
	а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
	к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
	х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
	і: 'i', ї: 'yi', є: 'ye', ґ: 'g', ў: 'u', ʼ: ''
};

export function slugifyFromName(name: string): string {
	return Array.from(name.trim().toLowerCase(), (char) => CYRILLIC_TO_LATIN[char] ?? char)
		.join('')
		.replace(/\s+/g, '-')
		.replace(/[^\p{L}\p{N}-]/gu, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
