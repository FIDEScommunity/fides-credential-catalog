package community.fides.credentialcatalog.backend.rest.webpublic.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class StaticDataDto {

    private List<String> grantTypesSupported;
    private List<String> credentialFormat;
    private List<String> cryptographicBindingMethodsSupported;
    private List<String> credentialSigningAlgValuesSupported;
    private List<String> locale;

}
