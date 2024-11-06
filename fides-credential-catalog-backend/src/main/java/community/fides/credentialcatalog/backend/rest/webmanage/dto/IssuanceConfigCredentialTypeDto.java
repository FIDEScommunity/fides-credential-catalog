package community.fides.credentialcatalog.backend.rest.webmanage.dto;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.OpenIDProviderMetadata;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import static community.fides.credentialcatalog.backend.rest.webmanage.dto.LocaleDisplayFilter.getByLocale;

@Builder
@Getter
public class IssuanceConfigCredentialTypeDto {

    private Long id;
    private String credentialConfigurationId;
    private CredentialKind credentialKind;
    private String defaultDisplayLocale;
    private String schemaUrl;
    private String schemaInfo;
    private String trustFrameworkUrl;
    private String trustFrameworkInfo;
    private String documentationUrl;
    private String documentationInfo;
    private String issuePortalUrl;
    private DisplayProperties display;

    public static List<IssuanceConfigCredentialTypeDto> from(List<IssuanceConfigCredentialType> issuanceConfigCredentialTypes, final OpenIDProviderMetadata openIDProviderMetadata, final String locale) {
        if (issuanceConfigCredentialTypes == null) {
            return List.of();
        }
        return issuanceConfigCredentialTypes.stream()
                .map(issuanceConfigCredentialType -> from(issuanceConfigCredentialType, openIDProviderMetadata, locale))
                .toList();
    }

    public static IssuanceConfigCredentialTypeDto from(IssuanceConfigCredentialType issuanceConfigCredentialType, final OpenIDProviderMetadata openIDProviderMetadata, String locale) {
        return IssuanceConfigCredentialTypeDto.builder()
                .id(issuanceConfigCredentialType.getId())
                .credentialConfigurationId(issuanceConfigCredentialType.getCredentialConfigurationId())
                .credentialKind(issuanceConfigCredentialType.getCredentialKind())
                .defaultDisplayLocale(issuanceConfigCredentialType.getDefaultDisplayLocale())
                .schemaUrl(issuanceConfigCredentialType.getSchemaUrl())
                .schemaInfo(issuanceConfigCredentialType.getSchemaInfo())
                .trustFrameworkUrl(issuanceConfigCredentialType.getTrustFrameworkUrl())
                .trustFrameworkInfo(issuanceConfigCredentialType.getTrustFrameworkInfo())
                .documentationUrl(issuanceConfigCredentialType.getDocumentationUrl())
                .documentationInfo(issuanceConfigCredentialType.getDocumentationInfo())
                .issuePortalUrl(issuanceConfigCredentialType.getIssuePortalUrl())
                .display(openIDProviderMetadata == null ? null : getByLocale(openIDProviderMetadata.getCredentialConfigurationsSupported().get(issuanceConfigCredentialType.getCredentialConfigurationId()).getDisplay(), locale))
                .build();
    }

}
