package community.fides.credentialcatalog.backend.rest.webmanage.form;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class OrganizationForm {

    private Long id;
    private String name;


}


