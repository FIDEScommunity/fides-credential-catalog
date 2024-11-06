package community.fides.credentialcatalog.backend.service.openidissuance.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LogoProperties {

    private String uri;
    @JsonAlias("alt_text")
    private String altText;

}
