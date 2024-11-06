package community.fides.credentialcatalog.backend.service.dto;

import community.fides.credentialcatalog.backend.domain.Organization;
import community.fides.credentialcatalog.backend.rest.webmanage.dto.OrganizationDto;
import lombok.Builder;
import lombok.Getter;
import org.keycloak.representations.idm.UserRepresentation;

@Builder(toBuilder = true)
@Getter
public class KeyCloakUserDto {

    private String id;
    private String userName;
    private String name;
    private String firstName;
    private String lastName;
    private OrganizationDto organization;
    private String tempPassword;

    public static KeyCloakUserDto from(UserRepresentation userRepresentation, final Organization organization) {
        return from(userRepresentation, organization, null);
    }

    public static KeyCloakUserDto from(UserRepresentation userRepresentation, final Organization organization, String tempPassword) {
        return KeyCloakUserDto.builder()
                .id(userRepresentation.getId())
                .userName(userRepresentation.getUsername())
                .firstName(userRepresentation.getFirstName())
                .lastName(userRepresentation.getLastName())
                .organization(OrganizationDto.from(organization))
                .tempPassword(tempPassword)
                .build();

    }
}
