export interface BackgroundImage {
    uri: string;
}

export interface LogoProperties {
    uri: string;
    altText?: string;
}

export interface DisplayProperties {
    name?: string;
    logo?: LogoProperties;
    description?: string;
    backgroundImage?: BackgroundImage;
    backgroundColor?: string;
    textColor?: string;
}
