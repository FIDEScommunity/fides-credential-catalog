package community.fides.credentialcatalog.backend.rest.api.dto;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.domain.OpenId4VcSpecVersion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class CredentialTypeDto {

    private String issuanceUrl;
    private DeploymentEnvironment deploymentEnvironment;
    private OpenId4VcSpecVersion supportedOpenId4VcSpecVersion;

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

    private String credentialFormat;


    public static CredentialTypeDto from(IssuanceConfigCredentialType issuanceConfigCredentialType, final Boolean includeAllDetails) {
        if (includeAllDetails) {
            return CredentialTypeDto.builder()
                    .issuanceUrl(issuanceConfigCredentialType.getIssuanceConfig().getIssuanceUrl())
                    .issuePortalUrl(issuanceConfigCredentialType.getIssuePortalUrl())
                    .credentialConfigurationId(issuanceConfigCredentialType.getCredentialConfigurationId())

                    .deploymentEnvironment(issuanceConfigCredentialType.getIssuanceConfig().getDeploymentEnvironment())
                    .supportedOpenId4VcSpecVersion(issuanceConfigCredentialType.getIssuanceConfig().getSupportedOpenId4VcSpecVersion())

                    .credentialKind(issuanceConfigCredentialType.getCredentialKind())
                    .defaultDisplayLocale(issuanceConfigCredentialType.getDefaultDisplayLocale())
                    .schemaUrl(issuanceConfigCredentialType.getSchemaUrl())
                    .schemaInfo(issuanceConfigCredentialType.getSchemaInfo())
                    .trustFrameworkUrl(issuanceConfigCredentialType.getTrustFrameworkUrl())
                    .trustFrameworkInfo(issuanceConfigCredentialType.getTrustFrameworkInfo())
                    .documentationUrl(issuanceConfigCredentialType.getDocumentationUrl())
                    .documentationInfo(issuanceConfigCredentialType.getDocumentationInfo())

                    .credentialFormat(issuanceConfigCredentialType.getCredentialFormat())
                    .build();
        } else {
            return CredentialTypeDto.builder()
                    .issuanceUrl(issuanceConfigCredentialType.getIssuanceConfig().getIssuanceUrl())
                    .issuePortalUrl(issuanceConfigCredentialType.getIssuePortalUrl())
                    .credentialConfigurationId(issuanceConfigCredentialType.getCredentialConfigurationId())
                    .build();
        }
    }

}
