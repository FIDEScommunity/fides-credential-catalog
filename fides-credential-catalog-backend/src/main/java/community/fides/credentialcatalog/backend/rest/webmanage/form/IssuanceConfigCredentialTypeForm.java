package community.fides.credentialcatalog.backend.rest.webmanage.form;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class IssuanceConfigCredentialTypeForm {

    private String id;
    @NotNull
    private String credentialConfigurationId;
    @NotNull
    private CredentialKind credentialKind;
    private String defaultDisplayLocale;
    private String schemaUrl;
    private String schemaInfo;
    private String trustFrameworkUrl;
    private String trustFrameworkInfo;
    private String documentationUrl;
    private String documentationInfo;
    private String issuePortalUrl;


}
