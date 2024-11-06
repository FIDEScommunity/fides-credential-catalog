export interface AppTexts {
    appName: {
        displayName: string;
        name: string;
    };
    busyInitializing: string;
    menu: {
        issuanceConfig: string;
        apiDocs: string;
        credentialTypes: string;
        userMaintenance: string;
        organizationMaintenance: string;
        logoff: string;
    };
    generic: {
        yes: string;
        no: string;
        ok: string;
        cancel: string;
        add: string;
        save: string;
        delete: string;
        edit: string;
        back: string;
        loading: string;
        accept: string;
        reject: string;
        search: string;
        startSearching: string;
        removeCredential: string;
    };
    error: {
        retrievingData: string;
        errorCodes: {
            "ERR-1": string;
        };
    };
    fields: {
        issuanceConfig: {
            issuerName: {
                typeDescription: string;
            };
            name: {
                typeDescription: string;
            };
            issuanceUrl: {
                typeDescription: string;
            };
            description: {
                typeDescription: string;
            };
            deploymentEnvironment: {
                typeDescription: string;
                values: {
                    PRODUCTION: string;
                    SANDBOX: string;
                }
            };
            visibilityStatus: {
                typeDescription: string;
                values: {
                    PUBLIC: string;
                    PRIVATE: string;
                }
            };
            openId4VcSpecVersion: {
                typeDescription: string;
                values: {
                    DRAFT13: string;
                }
            }
            grantTypesSupported: {
                typeDescription: string;
            }
        };
        organization: {
            name: {
                typeDescription: string;
            }
        };
        issuanceConfigCredentialType: {
            credentialKind: {
                typeDescription: string;
                values: {
                    PERSONAL: string;
                    ORGANIZATIONAL: string;
                    PRODUCT: string;
                    UNKNOWN: string;
                }
                placeHolder: string;
            }
            credentialType: {
                typeDescription: string
            };
            credentialConfigurationId: {
                typeDescription: string
            };
            defaultDisplayLocale: {
                typeDescription: string
                placeHolder: string;
            };
            schemaUrl: {
                typeDescription: string;
                placeHolder: string;
            };
            schemaInfo: {
                typeDescription: string;
                placeHolder: string;
            };
            trustFrameworkUrl: {
                typeDescription: string;
                placeHolder: string;
            };
            trustFrameworkInfo: {
                typeDescription: string;
                placeHolder: string;
            };
            documentationUrl: {
                typeDescription: string;
                placeHolder: string;
            };
            documentationInfo: {
                typeDescription: string;
                placeHolder: string;
            };
            issuePortalUrl: {
                typeDescription: string;
                placeHolder: string;
            };
            credentialFormat: {
                typeDescription: string;
            }
            cryptographicBindingMethodsSupported: {
                typeDescription: string;
            }
            credentialSigningAlgValuesSupported: {
                typeDescription: string;
            }
            locale: {
                typeDescription: string;
            }
        };
        userMaintenance: {
            userName: {
                typeDescription: string;
            }
            lastName: {
                typeDescription: string;
            }
            firstName: {
                typeDescription: string;
            }
            emailAddress: {
                typeDescription: string;
            }
        };
    };
    screens: {
        header: {
            welcomeTitle: string;
            welcomeSubTitle: string;
        },
        issuanceConfigList: {
            intro: {
                title: string;
                description: string;
            }
            add: string;
        },
        issuanceConfigForm: {
            title: string;
            save: string;
            delete: string;
            deleteConfirmTitle: string;
            deleteConfirmMessage: string;
            attributes: {
                organization: {
                    label: string;
                }
                name: {
                    label: string;
                    placeHolder: string;
                }
                issuanceUrl: {
                    label: string;
                    placeHolder: string;
                }
                description: {
                    label: string;
                    placeHolder: string;
                }
                deploymentEnvironment: {
                    label: string;
                }
                visibilityStatus: {
                    label: string;
                }
                supportedOpenId4VcSpecVersion: {
                    label: string;
                }
            }
        },
        credentialTypeList: {
            title: string;
            body1: string;
            body2: string;
            freeSearchPlaceholder: string;
            languageSelectorHelpText: string;
        }
        search: {
            searchNoCredentialTypesFound: string;
        },
        credentialTypeDetail: {
            issuanceConfig: {
                title: string;
            }
            credentialTypeConfig: {
                title: string;
            }
            credentialTypeAttributes: {
                title: string;
                noAttributesFound: string;
            }
            additionalInformation: {
                title: string;
            }
            attributeName: {
                label: string;
            }
            translation: {
                label: string;
            }
        },
        userMaintenanceUserForm: {
            title: string;
            attributes: {
                organization: {
                    label: string;
                }
                userName: {
                    label: string;
                    placeHolder: string;
                }
                lastName: {
                    label: string;
                    placeHolder: string;
                }
                firstName: {
                    label: string;
                    placeHolder: string;
                }
                emailAddress: {
                    label: string;
                    placeHolder: string;
                }
            },
            userCreatedDialog: {
                title: string;
                message: string;
                userId: string;
                password: string;
            },
            passwordResetButton: string;
            passwordResetConfirmDialog: {
                title: string;
                message: string;
            },
            passwordResetCompletedDialog: {
                title: string;
                message: string;
                userId: string;
                password: string;
            },
            userDeleteConfirmDialog: {
                title: string;
                message: string;
            },
        },
        organizationForm: {
            title: string;
            attributes: {
                name: {
                    label: string;
                    placeHolder: string;
                }
            },
            organizationDeleteConfirmDialog: {
                title: string;
                message: string;
            }
        }
    }
}

const getAppTextsEn = (): AppTexts => {
    return {
        menu: {
            credentialTypes: 'Credential Catalog',
            issuanceConfig: 'Issuer configurations',
            userMaintenance: 'Users',
            organizationMaintenance: 'Organizations',
            apiDocs: 'API Docs',
            logoff: 'Logoff'
        },
        generic: {
            yes: 'Ja',
            no: 'Nee',
            ok: 'OK',
            cancel: 'Cancel',
            add: 'Add',
            save: 'Save',
            edit: 'Edit',
            delete: 'Delete',
            back: 'Back',
            loading: 'Loading...',
            accept: 'Accept',
            reject: 'Reject',
            search: 'Search',
            startSearching: 'Start searching...',
            removeCredential: 'Remove credential'
        },
        error: {
            retrievingData: "Er is is mis gegaan bij het ophalen van de data. Probeer het later nog een keer.",
            errorCodes: {
                "ERR-1": 'E-mail adres is niet toegestaan. Gebruik uw zakelijke e-mail adres.'
            }
        },
        fields: {
            issuanceConfig: {
                issuerName: {
                    typeDescription: 'Issuer Name'
                },
                name: {
                    typeDescription: 'Private name',
                },
                issuanceUrl: {
                    typeDescription: 'OpenID Issuance URL'
                },
                description: {
                    typeDescription: 'Description'
                },
                deploymentEnvironment: {
                    typeDescription: 'Deployment',
                    values: {
                        PRODUCTION: 'Production',
                        SANDBOX: 'Sandbox'
                    }
                },
                visibilityStatus: {
                    typeDescription: 'Visibility',
                    values: {
                        PUBLIC: 'Public',
                        PRIVATE: 'Private'
                    }
                },
                openId4VcSpecVersion: {
                    typeDescription: 'OpenId4Vc version',
                    values: {
                        DRAFT13: 'Draft 13'
                    }
                },
                grantTypesSupported: {
                    typeDescription: 'Grant types supported'
                }
            },
            organization: {
                name: {
                    typeDescription: 'Organization'
                }
            },
            issuanceConfigCredentialType: {
                credentialKind: {
                    typeDescription: 'Subject Type',
                    values: {
                        PERSONAL: 'Personal',
                        ORGANIZATIONAL: 'Organizational',
                        PRODUCT: 'Product',
                        UNKNOWN: 'Unknown'
                    },
                    placeHolder: 'Select the kind of credential'
                },
                credentialType: {
                    typeDescription: 'Credential Type'
                },
                credentialConfigurationId: {
                    typeDescription: 'Credential Configuration ID'
                },
                defaultDisplayLocale: {
                    typeDescription: 'Default display locale',
                    placeHolder: 'The locale of the display properties without a specific locale'
                },
                schemaUrl: {
                    typeDescription: 'Schema URL',
                    placeHolder: 'The URL of the schema containing the attributes of the credential subject'
                },
                schemaInfo: {
                    typeDescription: 'Schema Info',
                    placeHolder: 'Additional information about the schema'
                },
                trustFrameworkUrl: {
                    typeDescription: 'Trust Framework URL',
                    placeHolder: 'The URL of the trust framework used'
                },
                trustFrameworkInfo: {
                    typeDescription: 'Trust Framework Info',
                    placeHolder: 'Additional information about the trust framework'
                },
                documentationUrl: {
                    typeDescription: 'Documentation URL',
                    placeHolder: 'The URL of the documentation'
                },
                documentationInfo: {
                    typeDescription: 'Additional Documentation',
                    placeHolder: 'Additional documentation'
                },
                issuePortalUrl: {
                    typeDescription: 'Issue Portal URL',
                    placeHolder: 'The direct url off the issue portal. Useful when wallet initiated flow is not used.'
                },
                credentialFormat: {
                    typeDescription: 'Credential Format'
                },
                cryptographicBindingMethodsSupported: {
                    typeDescription: 'Cryptographic binding methods supported'
                },
                credentialSigningAlgValuesSupported: {
                    typeDescription: 'Credential Signing algorithms supported'
                },
                locale: {
                    typeDescription: 'Locales'
                },
            },
            userMaintenance: {
                userName: {
                    typeDescription: 'Username'
                },
                lastName: {
                    typeDescription: 'Last name'
                },
                firstName: {
                    typeDescription: 'First name'
                },
                emailAddress: {
                    typeDescription: 'E-mail address'
                }
            }
        },
        screens: {
            header: {
                welcomeTitle: 'Fides Credential Catalog',
                welcomeSubTitle: '',
            },
            issuanceConfigList: {
                intro: {
                    title: 'Issuance Configurations',
                    description: 'Manage the OpenID for Verifiable Credential Issuance Configurations'
                },
                add: 'Add configuration'
            },
            issuanceConfigForm: {
                title: 'Issuance Configuration',
                save: 'Save configuration',
                delete: 'Delete configuration',
                deleteConfirmTitle: 'Delete configuration?',
                deleteConfirmMessage: 'Are you sure you want to delete this configuration? This action cannot be undone.',
                attributes: {
                    organization: {
                        label: 'Organization'
                    },
                    name: {
                        label: 'Private name',
                        placeHolder: 'Private name. Not visible to others'
                    },
                    issuanceUrl: {
                        placeHolder: 'Enter the OpenID Issuance URL (/.well-known/openid-configuration)'
                    },
                    description: {
                        placeHolder: 'Enter a public visible description'
                    },
                    supportedOpenId4VcSpecVersion: {
                        label: 'Supported OpenId4Vc version'
                    }
                }
            },
            credentialTypeList: {
                title: 'Credential Catalog',
                body1: 'The FIDES Credential catalog allows you to discover digital credentials that are issued using the OpenID for Verifiable Credential Issuance (OID4VCI) specification. This specification is gaining adoption in many regions across the world. The objective of this catalog is to provide a clear, neutral overview of implementations with details on how to use them. You can use the filter or use free text search for finding particular attributes, schema, credential types, formats, languages etc.\n',
                body2: 'Any issuer and credential can be added free of charge. The data in the  catalog is automatically fetched by crawling the public issuer url with all (standardized) meta data about the issuer and the credentials. A couple of additional meta data attributes that are (currently) not part of the OID4VCI spec can optionally be added.' +
                    'The FIDES team has collected an initial set of (publicly accessible) issuers and credentials. Representatives of any OID4VCI issuer can reach out to the FIDES team to get a login to adding and maintaining the listing of their own. Please send a mail to catalog@fides.community. This address can also be used for pointing to any OID4VC! Issuer or any other suggestions or feedback on this catalog.',
                freeSearchPlaceholder: 'Text to search',
                languageSelectorHelpText: 'Credentials can be translated into any language. If there are no translations provided for the selected language, this view displays the credential in it\'s default language'
            },
            search: {
                searchNoCredentialTypesFound: 'No credential types found'
            },
            credentialTypeDetail: {
                issuanceConfig: {
                    title: 'OIDC4VCI Issuer Metadata'
                },
                credentialTypeConfig: {
                    title: 'OIDC4VCI Credential Metadata'
                },
                credentialTypeAttributes: {
                    title: 'OIDC4VCI Credential Attributes',
                    noAttributesFound: 'No attribute definitions found'
                },
                additionalInformation: {
                    title: 'General Information'
                },
                attributeName: {
                    label: 'Attribute name'
                },
                translation: {
                    label: 'Translation'
                }
            },
            userMaintenanceUserForm: {
                title: 'User Maintenance',
                attributes: {
                    organization: {
                        label: 'Organization'
                    },
                    userName: {
                        label: 'Username/email',
                        placeHolder: 'Enter the email address'
                    },
                    lastName: {
                        label: 'Last name',
                        placeHolder: 'Last name'
                    },
                    firstName: {
                        label: 'First name',
                        placeHolder: 'First name'
                    },
                    emailAddress: {
                        label: 'E-mail address',
                        placeHolder: 'E-mail address'
                    }
                },
                userCreatedDialog: {
                    title: 'New user created',
                    message: 'The new user is created. Please sent the temporary password to the user.<br/><br/> The user will be asked to change the password after the first login.',
                    userId: 'Username: {{userName}}',
                    password: 'Password: {{password}}'
                },
                passwordResetButton: 'Reset password',
                passwordResetConfirmDialog: {
                    title: 'Reset password',
                    message: 'Are you sure you want to reset the password of user {{userName}}?',
                },
                passwordResetCompletedDialog: {
                    title: 'Password reset completed',
                    message: 'The password of user {{userName}} is reset. Please sent the temporary password to the user.<br/><br/> The user will be asked to change the password after the first login.',
                    password: 'Password: {{password}}'
                },
                userDeleteConfirmDialog: {
                    title: 'Delete user',
                    message: 'Are you sure you want to delete user {{userName}}?'
                }
            },
            organizationForm: {
                title: 'Organization',
                attributes: {
                    name: {
                        label: 'Name',
                        placeHolder: 'Name of the organization'
                    }
                },
                organizationDeleteConfirmDialog: {
                    title: 'Delete organization',
                    message: 'Are you sure you want to delete organization {{name}}?'
                }
            }
        }
    } as AppTexts;
};

const flatten: (object: any, prefix?: string) => any = (object, prefix = '') =>
    Object.keys(object).reduce(
        (prev, element) =>
            object[element] &&
            typeof object[element] === 'object' &&
            !Array.isArray(object[element])
                ? {...prev, ...flatten(object[element], `${prefix}${element}.`)}
                : {...prev, ...{[`${prefix}${element}`]: object[element]}},
        {},
    );

export const getTranslations = (language: string): {} => {
    const appTexts = getAppTextsEn();
    return flatten(appTexts, '');
}
