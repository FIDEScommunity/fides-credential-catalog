package community.fides.credentialcatalog.backend.service.openidissuance.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Getter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CredentialConfigurationSupported {

    private String id;

    private String format;

    @JsonAlias("cryptographic_binding_methods_supported")
    private List<String> cryptographicBindingMethodsSupported;

    @JsonAlias("credential_signing_alg_values_supported")
    private List<String> credentialSigningAlgValuesSupported;

    private List<DisplayProperties> display;

    @JsonAlias("credential_definition")
    private CredentialDefinition credentialDefinition;

    @JsonProperty("claims")
    private JsonNode claims;

    // Backward compatibility
    @JsonProperty("types")
    private List<String> types;


}
