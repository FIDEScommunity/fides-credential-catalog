import React, { FC, useEffect } from 'react';
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getTranslations } from '../AppTexts';
import { useSelector } from 'react-redux';
import { getUserPreference, userPreferenceSelector } from '../state/slices/userpreference';
import { useAppDispatch } from '../state';

interface Props {
}


export const I18n: FC<Props> = () => {
    const dispatch = useAppDispatch();
    let userPreference = useSelector(userPreferenceSelector).singleItem;
    useEffect(() => {
        dispatch(getUserPreference());
    }, []);

    i18n
        .use(initReactI18next) // passes i18n down to react-i18next
        .init({
            // the translations
            // (tip move them in a JSON file and import them,
            // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
            resources: {
                nl: {
                    translation: getTranslations('nl')
                },
                en: {
                    translation: getTranslations('en')
                }
            },
            fallbackLng: "en",

            interpolation: {
                escapeValue: false
            }
        });

    useEffect(() => {

        let lng = (userPreference?.locale === undefined) ? 'en' : userPreference?.locale;
        i18n.changeLanguage(lng);

    }, [userPreference?.locale]);

    return (<span/>);
};
