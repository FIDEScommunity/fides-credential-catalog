package community.fides.credentialcatalog.backend.service.openidissuance.dto;

// To be replace by WaltId class when draft 13 compatible

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CredentialDefinition {

    @JsonProperty("type")
    private List<String> type;

    @JsonProperty("credentialSubject")
    private Map<String, AttributeDefinition> credentialSubject;
}
