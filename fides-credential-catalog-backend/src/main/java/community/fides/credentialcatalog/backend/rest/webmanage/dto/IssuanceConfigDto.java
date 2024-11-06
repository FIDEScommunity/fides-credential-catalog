package community.fides.credentialcatalog.backend.rest.webmanage.dto;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.domain.OpenId4VcSpecVersion;
import community.fides.credentialcatalog.backend.domain.VisibilityStatus;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.OpenIDProviderMetadata;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import static community.fides.credentialcatalog.backend.rest.webmanage.dto.LocaleDisplayFilter.getByLocale;

@Builder
@Getter
public class IssuanceConfigDto {

    private Long id;
    private String name;
    private String issuanceUrl;
    private String description;
    private DeploymentEnvironment deploymentEnvironment;
    private VisibilityStatus visibilityStatus;
    private OpenId4VcSpecVersion supportedOpenId4VcSpecVersion;
    private List<IssuanceConfigCredentialTypeDto> credentialTypes;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private DisplayProperties issuerDisplay;
    private OrganizationDto organization;

    public static IssuanceConfigDto from(LocalPrincipal principal, IssuanceConfig issuanceConfig, OpenIDProviderMetadata openIDProviderMetadata, String locale) {
        final IssuanceConfigDto issuanceConfigDto = IssuanceConfigDto.builder()
                .id(issuanceConfig.getId())
                .name(issuanceConfig.getName())
                .issuanceUrl(issuanceConfig.getIssuanceUrl())
                .description(issuanceConfig.getDescription())
                .deploymentEnvironment(issuanceConfig.getDeploymentEnvironment())
                .visibilityStatus(issuanceConfig.getVisibilityStatus())
                .supportedOpenId4VcSpecVersion(issuanceConfig.getSupportedOpenId4VcSpecVersion())
                .credentialTypes(IssuanceConfigCredentialTypeDto.from(issuanceConfig.getCredentialTypes(), openIDProviderMetadata, locale))
                .organization(OrganizationDto.from(issuanceConfig.getOrganization()))
                .build();
        if ((issuanceConfig.getOrganization() != null) && (principal.getOrganization().getId().equals(issuanceConfig.getOrganization().getId()))) {
            issuanceConfigDto.name = issuanceConfig.getName();
            issuanceConfigDto.createdAt = issuanceConfig.getCreatedAt();
            issuanceConfigDto.createdBy = issuanceConfig.getCreatedBy();
            issuanceConfigDto.updatedAt = issuanceConfig.getUpdatedAt();
            issuanceConfigDto.updatedBy = issuanceConfig.getUpdatedBy();
        }
        if (openIDProviderMetadata != null) {
            issuanceConfigDto.issuerDisplay = getByLocale(openIDProviderMetadata.getDisplay(), locale);
        }
        return issuanceConfigDto;
    }

}
