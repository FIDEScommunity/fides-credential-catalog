package community.fides.credentialcatalog.backend.rest.webmanage.form;

import community.fides.credentialcatalog.backend.rest.webmanage.dto.OrganizationDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class KeyCloakUserForm {

    private String id;
    private String userName;
    private String firstName;
    private String lastName;
    private OrganizationDto organization;
}
