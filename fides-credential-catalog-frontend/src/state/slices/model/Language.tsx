export interface Language {
    locale: string;
    name: string;
    fullName: string;
}

export const languages = [
    {locale: 'de-DE', name: 'DE', fullName: 'German'},
    {locale: 'en-GB', name: 'ENG', fullName: 'English'},
    {locale: 'en-US', name: 'ENG', fullName: 'English'},
    {locale: 'nl-NL', name: 'NL', fullName: 'Dutch'},
]

export const webUiLanguages = ['nl-NL', 'en-GB'];
