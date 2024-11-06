package community.fides.credentialcatalog.backend.rest.webpublic.dto;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.domain.OpenId4VcSpecVersion;
import community.fides.credentialcatalog.backend.domain.VisibilityStatus;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class CredentialTypeDto {

    private Long id;
    private String issuanceUrl;
    private String description;
    private DeploymentEnvironment deploymentEnvironment;
    private VisibilityStatus visibilityStatus;
    private OpenId4VcSpecVersion supportedOpenId4VcSpecVersion;
    private DisplayProperties issuerDisplay;

    private String credentialConfigurationId;
    private CredentialKind credentialKind;
    private String defaultDisplayLocale;
    private DisplayProperties display;
    private Map<String, DisplayProperties> credentialAttributes;
    private String schemaUrl;
    private String schemaInfo;
    private String trustFrameworkUrl;
    private String trustFrameworkInfo;
    private String documentationUrl;
    private String documentationInfo;
    private String issuePortalUrl;

    private String credentialFormat;
    private List<String> grantTypesSupported;
    private List<String> cryptographicBindingMethodsSupported;
    private List<String> credentialSigningAlgValuesSupported;
    private List<String> locale;


    public static CredentialTypeDto from(IssuanceConfigCredentialType issuanceConfigCredentialType, DisplayProperties issuerDisplay, DisplayProperties credentialTypeDisplay, Map<String, DisplayProperties> credentialAttributes) {

        return CredentialTypeDto.builder()
                .id(issuanceConfigCredentialType.getId())
                .issuanceUrl(issuanceConfigCredentialType.getIssuanceConfig().getIssuanceUrl())
                .description(issuanceConfigCredentialType.getIssuanceConfig().getDescription())
                .deploymentEnvironment(issuanceConfigCredentialType.getIssuanceConfig().getDeploymentEnvironment())
                .visibilityStatus(issuanceConfigCredentialType.getIssuanceConfig().getVisibilityStatus())
                .supportedOpenId4VcSpecVersion(issuanceConfigCredentialType.getIssuanceConfig().getSupportedOpenId4VcSpecVersion())

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

                .issuerDisplay(issuerDisplay)
                .display(credentialTypeDisplay)
                .credentialAttributes(credentialAttributes)
                .credentialFormat(issuanceConfigCredentialType.getCredentialFormat())
                .cryptographicBindingMethodsSupported(issuanceConfigCredentialType.getCryptographicBindingMethodsSupported())
                .grantTypesSupported(issuanceConfigCredentialType.getIssuanceConfig().getGrantTypesSupported())
                .cryptographicBindingMethodsSupported(issuanceConfigCredentialType.getCryptographicBindingMethodsSupported())
                .credentialSigningAlgValuesSupported(issuanceConfigCredentialType.getCredentialSigningAlgValuesSupported())
                .locale(issuanceConfigCredentialType.getLocale())
                .build();
    }

}
