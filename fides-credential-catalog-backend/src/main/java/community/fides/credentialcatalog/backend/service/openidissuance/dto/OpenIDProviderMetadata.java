package community.fides.credentialcatalog.backend.service.openidissuance.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenIDProviderMetadata {

    private String issuer;

    @JsonAlias("credential_issuer")
    private String credentialIssuer;

    @JsonAlias("grant_types_supported")
    private List<String> grantTypesSupported;

    private List<DisplayProperties> display;

    @JsonAlias("credential_configurations_supported")
    private Map<String, CredentialConfigurationSupported> credentialConfigurationsSupported;

}
