package community.fides.credentialcatalog.backend.rest.webmanage.form;

import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.OpenId4VcSpecVersion;
import community.fides.credentialcatalog.backend.domain.VisibilityStatus;
import community.fides.credentialcatalog.backend.rest.webmanage.dto.OrganizationDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class IssuanceConfigForm {

    private Long id;
    private String name;
    @NotNull
    private String issuanceUrl;
    private String description;

    @NotNull
    private DeploymentEnvironment deploymentEnvironment;
    @NotNull
    private VisibilityStatus visibilityStatus;
    @NotNull
    private OpenId4VcSpecVersion supportedOpenId4VcSpecVersion;
    private List<@Valid IssuanceConfigCredentialTypeForm> credentialTypes;
    private OrganizationDto organization;
}
